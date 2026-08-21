import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { NotificationDto } from "../api/types";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get<{ success: boolean; data: { items: NotificationDto[]; unread: number } }>(
        "/api/notifications"
      );
      setItems(res.data.items);
      setUnread(res.data.unread);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markAllRead = async () => {
    await api.patch("/api/notifications/read", {});
    setUnread(0);
    setItems(items.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Notifications {unread > 0 && <span className="rounded bg-indigo-100 px-2 py-0.5 text-sm text-indigo-700">{unread} new</span>}
        </h1>
        {unread > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 shadow-sm ${n.read ? "bg-white opacity-75" : "bg-white"}`}
            >
              <div className="flex items-start justify-between">
                <h3 className={`font-medium ${n.read ? "text-gray-600" : ""}`}>{n.title}</h3>
                {!n.read && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
              </div>
              <p className="mt-1 text-sm text-gray-600">{n.body}</p>
              <p className="mt-2 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
