import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const INTEGRATIONS = [
  { name: "그룹 SSO (OIDC)", desc: "사내 계정 로그인" },
  { name: "Jira Service Management", desc: "요청 및 워크플로 연동" },
  { name: "Confluence", desc: "지식 문서 검색" },
];

export default function SettingsPage() {
  const { state, renameCompany, reset } = useStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, string>>(Object.fromEntries(state.companies.map((c) => [c.id, c.label])));
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="시스템" title="설정" desc="데모 환경 설정입니다. 변경 사항은 이 브라우저에만 저장됩니다." />
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-bold">회사 표시 이름</h2>
        <p className="text-xs text-muted-foreground">공식 명칭이 확정되지 않아 데모 라벨을 사용합니다. 필요하면 바꿔 보세요.</p>
        <form className="mt-4 space-y-2" onSubmit={(e) => {
          e.preventDefault();
          const bad = Object.values(draft).some((v) => !v.trim());
          if (bad) { toast({ title: "회사 이름은 비워 둘 수 없습니다", variant: "destructive" }); return; }
          Object.entries(draft).forEach(([id, v]) => renameCompany(id, v.trim()));
          toast({ title: "회사 표시 이름을 저장했습니다" });
        }}>
          {state.companies.map((c, i) => (
            <label key={c.id} className="flex items-center gap-3 text-sm">
              <span className="w-14 font-mono text-xs text-muted-foreground">회사 {i + 1}</span>
              <input data-testid={`input-company-${c.id}`} value={draft[c.id] ?? ""} onChange={(e) => setDraft({ ...draft, [c.id]: e.target.value })} className="h-9 flex-1 rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40" />
            </label>
          ))}
          <button type="submit" data-testid="button-save-companies" className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">저장</button>
        </form>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-bold">외부 연동 상태</h2>
        <p className="text-xs text-muted-foreground">이번 빌드는 화면 우선 데모로, 실제 연동은 구성되어 있지 않습니다.</p>
        <ul className="mt-3 divide-y">
          {INTEGRATIONS.map((i) => (
            <li key={i.name} className="flex items-center justify-between py-3 text-sm">
              <div><div className="font-semibold">{i.name}</div><div className="text-xs text-muted-foreground">{i.desc}</div></div>
              <span data-testid={`status-integration-${i.name}`} className="rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">미연결</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-destructive/25 bg-card p-5">
        <h2 className="font-bold">데모 데이터 초기화</h2>
        <p className="text-xs text-muted-foreground">직접 만든 요청, 평가, 알림을 지우고 샘플 데이터로 되돌립니다.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild><button data-testid="button-reset" className="mt-3 rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive">초기화</button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>데모 데이터를 초기화할까요?</AlertDialogTitle><AlertDialogDescription>이 브라우저에 저장된 모든 변경 사항이 삭제됩니다. 되돌릴 수 없습니다.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction data-testid="button-confirm-reset" onClick={() => { reset(); setDraft({ c1: "디스커버리", c2: "계열사 A", c3: "계열사 B", c4: "계열사 C" }); toast({ title: "샘플 데이터로 초기화했습니다" }); }}>초기화</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
