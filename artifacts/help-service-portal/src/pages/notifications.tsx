import { useState } from "react";
import { useLocation } from "wouter";
import { BellOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/sla";
import { EmptyState, PageHeader } from "@/components/page";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { state, markRead, markAllRead } = useStore();
  const [, setLoc] = useLocation();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const list = state.notifications.filter((n) => !unreadOnly || !n.read);
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="셀프서비스 포털" title="알림 수신함" desc="요청 접수, 배정, 완료, 평가 알림이 서버에 기록됩니다. 현재 데모에서는 읽음 상태도 모든 접속자에게 공유됩니다."
        actions={<>
          <button onClick={() => setUnreadOnly(!unreadOnly)} aria-pressed={unreadOnly} data-testid="button-unread-only" className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", unreadOnly ? "bg-primary text-primary-foreground" : "bg-card")}>안 읽은 알림만</button>
          <button onClick={() => void markAllRead()} disabled={!unread} data-testid="button-mark-all" className="rounded-lg border bg-card px-3 py-2 text-sm font-semibold disabled:opacity-40">모두 읽음</button>
        </>} />
      {list.length === 0 ? (
        <EmptyState icon={BellOff} title="표시할 알림이 없습니다" desc={unreadOnly ? "모든 알림을 확인했습니다." : "요청을 접수하면 진행 알림이 여기에 쌓입니다."} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {list.map((n) => (
            <li key={n.id}>
              <button data-testid={`item-notification-${n.id}`} onClick={async () => { if (await markRead(n.id)) { if (n.requestId) setLoc(`/requests/${n.requestId}`); } }}
                className={cn("flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/60", !n.read && "bg-accent/40")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-[hsl(33_95%_50%)]")} aria-label={n.read ? "읽음" : "안 읽음"} />
                <span className="flex-1">
                  <span className={cn("block text-sm", !n.read && "font-bold")}>{n.title}</span>
                  <span className="block text-sm text-muted-foreground">{n.body}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{fmtDate(n.at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
