import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Notification } from "@/hooks/useNotifications";

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

// Zeigt Benachrichtigungen als Toast-Popups an (unten rechts)
export function NotificationToast({ notifications, onDismiss }: Props) {
  const navigate = useNavigate();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => {
            navigate(`/boards/${n.boardId}`);
            onDismiss(n.id);
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {n.type === "task-assigned"
                ? "Neue Aufgabe zugewiesen"
                : n.message || "Aufgabe aktualisiert"}
            </p>
            <p className="text-sm text-gray-600 truncate">
              „{n.taskTitle}" in {n.boardTitle}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(n.id);
            }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
