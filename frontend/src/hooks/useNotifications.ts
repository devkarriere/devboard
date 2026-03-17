import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface Notification {
  id: string;
  type: string;
  boardId: string;
  boardTitle: string;
  taskId: string;
  taskTitle: string;
  assignedBy: string;
  message?: string;
  timestamp: number;
}

// Hook: Stellt eine SSE-Verbindung zum Backend her und empfängt Benachrichtigungen
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(async () => {
    // Alte Verbindung schließen
    eventSourceRef.current?.close();

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    // SSE-Verbindung mit Token als Query-Parameter
    const es = new EventSource(
      `${API_URL}/notifications/sse?token=${encodeURIComponent(token)}`
    );

    es.onopen = () => {
      console.log("SSE-Verbindung geöffnet");
    };

    es.onmessage = (event) => {
      console.log("SSE Event empfangen:", event.data);
      const parsed = JSON.parse(event.data);

      // Heartbeat-Events ignorieren
      if (parsed.type === "heartbeat") return;

      const notification: Notification = {
        id: crypto.randomUUID(),
        type: parsed.type,
        boardId: parsed.boardId,
        boardTitle: parsed.boardTitle,
        taskId: parsed.taskId,
        taskTitle: parsed.taskTitle,
        assignedBy: parsed.assignedBy,
        message: parsed.message,
        timestamp: Date.now(),
      };
      setNotifications((prev) => [notification, ...prev]);
    };

    // Nicht schließen bei Fehler – EventSource versucht automatisch Reconnect
    es.onerror = () => {
      console.warn("SSE-Verbindung unterbrochen, Reconnect wird versucht...");
    };

    eventSourceRef.current = es;
  }, []);

  // Benachrichtigung entfernen
  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Alle Benachrichtigungen entfernen
  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { notifications, dismiss, dismissAll };
}
