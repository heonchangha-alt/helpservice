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
  const { state, saveCompanies, legacyCount, legacyError, importLegacy } = useStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, string>>(Object.fromEntries(state.companies.map((c) => [c.id, c.label])));
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="시스템" title="설정" desc="Front-End → Back-End API → PostgreSQL Database의 3계층 구조입니다. 변경 사항은 서버에 저장되어 모든 접속자에게 공유됩니다." />
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-bold">저장 및 운영 환경</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div><dt className="font-semibold">Front-End · React</dt><dd className="text-muted-foreground">화면 표시, 입력, 검색과 조회 결과 시각화</dd></div>
          <div><dt className="font-semibold">Back-End · Express API</dt><dd className="text-muted-foreground">요청 검증, 담당자 배정, 단계 전환, 평가와 트랜잭션 처리</dd></div>
          <div><dt className="font-semibold">Database · PostgreSQL</dt><dd className="text-muted-foreground">회사, 요청, 단계별 이력, 평가, 알림 영구 저장</dd></div>
        </dl>
        <p className="mt-4 rounded-lg bg-accent p-3 text-xs">공용 데모입니다. 로그인과 권한 인증은 아직 적용되지 않았습니다. 실제 업무정보는 입력하지 마세요. 브라우저에는 미리보기 역할만 저장합니다.</p>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-bold">회사 표시 이름</h2>
        <p className="text-xs text-muted-foreground">저장하면 모든 접속자에게 반영됩니다. 공식 명칭이 확정되지 않아 데모 라벨을 사용합니다.</p>
        <form className="mt-4 space-y-2" onSubmit={async (e) => {
          e.preventDefault();
          if (Object.values(draft).some((v) => !v.trim())) {
            toast({ title: "회사 이름은 비워 둘 수 없습니다", variant: "destructive" }); return;
          }
          const saved = await saveCompanies(state.companies.map((c) => ({ id: c.id, label: (draft[c.id] ?? c.label).trim() })));
          if (saved) toast({ title: "회사 표시 이름을 저장했습니다" });
        }}>
          {state.companies.map((c, i) => (
            <label key={c.id} className="flex items-center gap-3 text-sm">
              <span className="w-14 font-mono text-xs text-muted-foreground">회사 {i + 1}</span>
              <input maxLength={100} data-testid={`input-company-${c.id}`} value={draft[c.id] ?? ""} onChange={(e) => setDraft({ ...draft, [c.id]: e.target.value })} className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40" />
            </label>
          ))}
          <button type="submit" data-testid="button-save-companies" className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">저장</button>
        </form>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-bold">이전 브라우저 요청 가져오기</h2>
        <p className="mt-1 text-xs text-muted-foreground">이전 버전에서 직접 생성한 요청 {legacyCount}건을 가져올 수 있습니다. 요청 번호는 서버에서 새로 부여하고 처리 이력·평가는 보존합니다. 샘플 요청·회사 설정·알림은 가져오지 않으며, 기존 로컬 원본과 공용 데이터는 덮어쓰거나 삭제하지 않습니다. 같은 요청을 다시 가져와도 중복 생성하지 않습니다.</p>
        {legacyError && <p role="alert" className="mt-2 text-sm text-destructive">{legacyError}</p>}
        {legacyCount > 0 && <AlertDialog>
          <AlertDialogTrigger asChild><button data-testid="button-import-legacy" className="mt-3 rounded-lg border px-4 py-2 text-sm font-semibold">요청 {legacyCount}건 가져오기</button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>요청을 공용 데이터베이스로 가져올까요?</AlertDialogTitle><AlertDialogDescription>이후 다른 접속자도 요청 내용과 처리 이력·평가를 볼 수 있습니다. 브라우저에 저장된 원본은 그대로 유지됩니다.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction data-testid="button-confirm-import" onClick={async () => {
              if (await importLegacy()) toast({ title: "이전 요청을 서버로 가져왔습니다" });
            }}>가져오기</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>}
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-bold">외부 연동 상태</h2>
        <p className="text-xs text-muted-foreground">3계층 구조 전환과 별개로 실제 외부 연동은 아직 구성되어 있지 않습니다.</p>
        <ul className="mt-3 divide-y">
          {INTEGRATIONS.map((i) => (
            <li key={i.name} className="flex items-center justify-between py-3 text-sm">
              <div><div className="font-semibold">{i.name}</div><div className="text-xs text-muted-foreground">{i.desc}</div></div>
              <span className="rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">미연결</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted-foreground">공용 데이터 보호를 위해 전체 데이터 초기화 기능은 제공하지 않습니다.</p>
    </div>
  );
}
