import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { TaskLogService } from './task-log.service';
import { SseService } from '../notifications/sse.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    private readonly taskLogService: TaskLogService,
    private readonly sseService: SseService,
  ) {}

  // Benachrichtigung an den Karteninhaber senden (wenn nicht self-notify)
  private async notifyAssignee(
    assignedTo: string,
    userId: string,
    token: string,
    type: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!assignedTo) return;
    const assignedUserId = await this.resolveUserId(assignedTo, token);
    if (assignedUserId && assignedUserId !== userId) {
      this.sseService.emit({ userId: assignedUserId, type, data });
    }
  }

  // Name → User-ID auflösen über Supabase profiles-Tabelle
  private async resolveUserId(name: string, token: string): Promise<string | null> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return null;

    try {
      const url = `${supabaseUrl}/rest/v1/profiles?name=eq.${encodeURIComponent(name)}&select=id`;
      const res = await fetch(url, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log(`resolveUserId("${name}"):`, data);
      return data?.[0]?.id || null;
    } catch (err) {
      console.error('resolveUserId Fehler:', err);
      return null;
    }
  }

  // --- Boards ---

  // Alle Boards laden (jeder eingeloggte User sieht alle Boards)
  async findAll(userId: string, role: string) {
    return this.boardModel.find().exec();
  }

  // Ein Board per ID laden (jeder eingeloggte User hat Zugriff)
  async findOne(id: string, userId: string, role: string) {
    const board = await this.boardModel.findById(id).exec();
    if (!board) throw new NotFoundException('Board nicht gefunden');
    return board;
  }

  // Neues Board erstellen (mit Standard-Spalten)
  async create(title: string, ownerId: string) {
    const board = new this.boardModel({
      title,
      ownerId,
      columns: [
        { id: new Types.ObjectId().toString(), title: 'To Do', order: 0 },
        { id: new Types.ObjectId().toString(), title: 'In Progress', order: 1 },
        { id: new Types.ObjectId().toString(), title: 'Done', order: 2 },
      ],
      tasks: [],
    });
    return board.save();
  }

  // Board-Titel ändern (nur Owner oder Admin)
  async update(id: string, title: string, userId: string, role: string) {
    const board = await this.boardModel.findById(id).exec();
    if (!board) throw new NotFoundException('Board nicht gefunden');

    if (role !== 'admin' && board.ownerId !== userId) {
      throw new ForbiddenException('Nur der Owner oder Admin darf das Board bearbeiten');
    }

    board.title = title;
    return board.save();
  }

  // Board löschen (nur Owner oder Admin)
  async remove(id: string, userId: string, role: string) {
    const board = await this.boardModel.findById(id).exec();
    if (!board) throw new NotFoundException('Board nicht gefunden');

    if (role !== 'admin' && board.ownerId !== userId) {
      throw new ForbiddenException('Nur der Owner oder Admin darf das Board löschen');
    }

    await this.boardModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  // --- Spalten ---

  // Neue Spalte hinzufügen
  async addColumn(boardId: string, title: string, userId: string, role: string) {
    const board = await this.findOne(boardId, userId, role);

    const maxOrder = board.columns.reduce((max, col) => Math.max(max, col.order), -1);
    const newColumn = {
      id: new Types.ObjectId().toString(),
      title,
      order: maxOrder + 1,
    };

    board.columns.push(newColumn);
    await board.save();
    return newColumn;
  }

  // Spalte umbenennen oder verschieben
  async updateColumn(boardId: string, colId: string, updates: { title?: string; order?: number }, userId: string, role: string) {
    const board = await this.findOne(boardId, userId, role);

    const column = board.columns.find((c) => c.id === colId);
    if (!column) throw new NotFoundException('Spalte nicht gefunden');

    if (updates.title !== undefined) column.title = updates.title;
    if (updates.order !== undefined) column.order = updates.order;

    board.markModified('columns');
    await board.save();
    return column;
  }

  // Spalte löschen (inkl. aller Tasks in dieser Spalte)
  async removeColumn(boardId: string, colId: string, userId: string, role: string) {
    const board = await this.findOne(boardId, userId, role);

    // Nur Owner oder Admin darf Spalten löschen
    if (role !== 'admin' && board.ownerId !== userId) {
      throw new ForbiddenException('Nur der Owner oder Admin darf Spalten löschen');
    }

    board.columns = board.columns.filter((c) => c.id !== colId);
    board.tasks = board.tasks.filter((t) => t.columnId !== colId);
    await board.save();
    return { deleted: true };
  }

  // --- Tasks ---

  // Neue Task erstellen
  async addTask(
    boardId: string,
    data: { columnId: string; title: string; description?: string; assignedTo?: string },
    userId: string,
    role: string,
    token: string,
  ) {
    const board = await this.findOne(boardId, userId, role);

    // Prüfen ob die Spalte existiert
    const columnExists = board.columns.some((c) => c.id === data.columnId);
    if (!columnExists) throw new NotFoundException('Spalte nicht gefunden');

    const tasksInColumn = board.tasks.filter((t) => t.columnId === data.columnId);
    const maxOrder = tasksInColumn.reduce((max, t) => Math.max(max, t.order), -1);

    const newTask = {
      id: new Types.ObjectId().toString(),
      columnId: data.columnId,
      title: data.title,
      description: data.description || '',
      assignedTo: data.assignedTo || '',
      order: maxOrder + 1,
    };

    board.tasks.push(newTask);
    await board.save();

    // Log: Task wurde erstellt
    await this.taskLogService.log(
      newTask.id,
      boardId,
      userId,
      `Task "${newTask.title}" wurde erstellt`,
    );

    // SSE: Benachrichtigung an zugewiesenen User senden
    await this.notifyAssignee(newTask.assignedTo, userId, token, 'task-assigned', {
      boardId,
      boardTitle: board.title,
      taskId: newTask.id,
      taskTitle: newTask.title,
      assignedBy: userId,
    });

    return newTask;
  }

  // Task bearbeiten (Titel, Beschreibung, Zuweisung, Spalte, Reihenfolge)
  async updateTask(
    boardId: string,
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      assignedTo?: string;
      columnId?: string;
      order?: number;
    },
    userId: string,
    role: string,
    token: string,
  ) {
    const board = await this.findOne(boardId, userId, role);

    const task = board.tasks.find((t) => t.id === taskId);
    if (!task) throw new NotFoundException('Task nicht gefunden');

    // Alte Werte merken, um Änderungen zu loggen
    const oldTitle = task.title;
    const oldDescription = task.description;
    const oldAssignedTo = task.assignedTo;
    const oldColumnId = task.columnId;

    // Nur die Felder aktualisieren, die mitgeschickt werden
    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo;
    if (updates.columnId !== undefined) task.columnId = updates.columnId;
    if (updates.order !== undefined) task.order = updates.order;

    board.markModified('tasks');
    await board.save();

    // Gemeinsame Notification-Daten für task-updated Events
    const notificationBase = {
      boardId,
      boardTitle: board.title,
      taskId,
      taskTitle: task.title,
    };

    // Änderungen loggen + Karteninhaber benachrichtigen
    if (updates.title !== undefined && updates.title !== oldTitle) {
      await this.taskLogService.log(
        taskId, boardId, userId,
        `Titel wurde von "${oldTitle}" zu "${updates.title}" geändert`,
      );
      await this.notifyAssignee(task.assignedTo, userId, token, 'task-updated', {
        ...notificationBase,
        taskTitle: updates.title,
        message: `Titel wurde geändert`,
      });
    }

    if (updates.description !== undefined && updates.description !== oldDescription) {
      await this.taskLogService.log(
        taskId, boardId, userId,
        `Beschreibung wurde geändert`,
      );
      await this.notifyAssignee(task.assignedTo, userId, token, 'task-updated', {
        ...notificationBase,
        message: `Beschreibung wurde geändert`,
      });
    }

    if (updates.assignedTo !== undefined && updates.assignedTo !== oldAssignedTo) {
      await this.taskLogService.log(
        taskId, boardId, userId,
        `Task wurde Person "${updates.assignedTo}" zugewiesen`,
      );

      // SSE: Benachrichtigung an neu zugewiesenen User senden
      await this.notifyAssignee(updates.assignedTo, userId, token, 'task-assigned', {
        ...notificationBase,
        assignedBy: userId,
      });
    }

    if (updates.columnId !== undefined && updates.columnId !== oldColumnId) {
      // Spaltennamen auflösen für eine lesbare Nachricht
      const oldColumn = board.columns.find((c) => c.id === oldColumnId);
      const newColumn = board.columns.find((c) => c.id === updates.columnId);
      const oldName = oldColumn ? oldColumn.title : oldColumnId;
      const newName = newColumn ? newColumn.title : updates.columnId;
      await this.taskLogService.log(
        taskId, boardId, userId,
        `Status wurde von "${oldName}" nach "${newName}" geändert`,
      );
      await this.notifyAssignee(task.assignedTo, userId, token, 'task-updated', {
        ...notificationBase,
        message: `Status wurde von „${oldName}" nach „${newName}" geändert`,
      });
    }

    return task;
  }

  // Task löschen
  async removeTask(boardId: string, taskId: string, userId: string, role: string) {
    const board = await this.findOne(boardId, userId, role);

    const task = board.tasks.find((t) => t.id === taskId);
    board.tasks = board.tasks.filter((t) => t.id !== taskId);
    await board.save();

    // Log: Task wurde gelöscht
    if (task) {
      await this.taskLogService.log(
        taskId,
        boardId,
        userId,
        `Task "${task.title}" wurde gelöscht`,
      );
    }

    return { deleted: true };
  }

}
