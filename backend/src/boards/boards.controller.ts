import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { TaskLogService } from './task-log.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Alle Endpoints sind durch den AuthGuard geschützt (JWT erforderlich).
// Der RolesGuard prüft zusätzlich die Rolle, wenn @Roles() gesetzt ist.
@Controller('boards')
@UseGuards(AuthGuard, RolesGuard)
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly taskLogService: TaskLogService,
  ) {}

  // GET /boards – Alle sichtbaren Boards laden
  @Get()
  findAll(@Req() req) {
    return this.boardsService.findAll(req.userId, req.userRole);
  }

  // POST /boards – Neues Board erstellen (nur Admin)
  @Post()
  @Roles('admin')
  create(@Body('title') title: string, @Req() req) {
    return this.boardsService.create(title, req.userId);
  }

  // GET /boards/:id – Ein Board mit allen Spalten und Tasks laden
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.boardsService.findOne(id, req.userId, req.userRole);
  }

  // PATCH /boards/:id – Board-Titel ändern (Owner oder Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body('title') title: string, @Req() req) {
    return this.boardsService.update(id, title, req.userId, req.userRole);
  }

  // DELETE /boards/:id – Board löschen (Owner oder Admin)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.boardsService.remove(id, req.userId, req.userRole);
  }

  // --- Spalten ---

  // POST /boards/:id/columns – Neue Spalte hinzufügen
  @Post(':id/columns')
  addColumn(
    @Param('id') boardId: string,
    @Body('title') title: string,
    @Req() req,
  ) {
    return this.boardsService.addColumn(boardId, title, req.userId, req.userRole);
  }

  // PATCH /boards/:id/columns/:colId – Spalte umbenennen oder verschieben
  @Patch(':id/columns/:colId')
  updateColumn(
    @Param('id') boardId: string,
    @Param('colId') colId: string,
    @Body() body: { title?: string; order?: number },
    @Req() req,
  ) {
    return this.boardsService.updateColumn(boardId, colId, body, req.userId, req.userRole);
  }

  // DELETE /boards/:id/columns/:colId – Spalte löschen (Owner oder Admin)
  @Delete(':id/columns/:colId')
  removeColumn(
    @Param('id') boardId: string,
    @Param('colId') colId: string,
    @Req() req,
  ) {
    return this.boardsService.removeColumn(boardId, colId, req.userId, req.userRole);
  }

  // --- Tasks ---

  // POST /boards/:id/tasks – Neue Task erstellen
  @Post(':id/tasks')
  addTask(
    @Param('id') boardId: string,
    @Body() body: { columnId: string; title: string; description?: string; assignedTo?: string },
    @Req() req,
  ) {
    return this.boardsService.addTask(boardId, body, req.userId, req.userRole, req.token);
  }

  // PATCH /boards/:id/tasks/:taskId – Task bearbeiten oder verschieben
  @Patch(':id/tasks/:taskId')
  updateTask(
    @Param('id') boardId: string,
    @Param('taskId') taskId: string,
    @Body() body: { title?: string; description?: string; assignedTo?: string; columnId?: string; order?: number },
    @Req() req,
  ) {
    return this.boardsService.updateTask(boardId, taskId, body, req.userId, req.userRole, req.token);
  }

  // DELETE /boards/:id/tasks/:taskId – Task löschen
  @Delete(':id/tasks/:taskId')
  removeTask(
    @Param('id') boardId: string,
    @Param('taskId') taskId: string,
    @Req() req,
  ) {
    return this.boardsService.removeTask(boardId, taskId, req.userId, req.userRole);
  }

  // --- Task Logs ---

  // GET /boards/:id/tasks/:taskId/logs – Änderungshistorie einer Task laden
  @Get(':id/tasks/:taskId/logs')
  async getTaskLogs(
    @Param('id') boardId: string,
    @Param('taskId') taskId: string,
    @Req() req,
  ) {
    // Zugriffsprüfung: nur wer das Board sehen darf, darf auch die Logs sehen
    await this.boardsService.findOne(boardId, req.userId, req.userRole);
    return this.taskLogService.findByTaskId(taskId);
  }
}
