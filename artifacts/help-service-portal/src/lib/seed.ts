import { SLA_HOURS, STAGES, type AppState, type Priority, type ServiceRequest, type Stage } from "./types";

const H = 3600000;
export const DEMO_USER = "김하늘";

interface SeedSpec {
  title: string;
  desc: string;
  company: string;
  service: string;
  fields: Record<string, string>;
  priority: Priority;
  requester: string;
  assignee: string | null;
  ageH: number;
  steps: number[]; // hours after creation for each subsequent stage
  rating?: number;
  feedback?: string;
}

const specs: SeedSpec[] = [
  { title: "재택 VPN 접속 시 인증 실패", desc: "오늘 아침부터 VPN 로그인 시 인증서 오류가 표시됩니다.", company: "c1", service: "net-vpn", fields: { where: "재택 VPN", scope: "나만" }, priority: "긴급", requester: DEMO_USER, assignee: "박서준", ageH: 3.4, steps: [0.4, 1.1] },
  { title: "재무팀 공유폴더 쓰기 권한 요청", desc: "결산 자료 업로드를 위해 쓰기 권한이 필요합니다.", company: "c1", service: "acct-perm", fields: { target: "재무팀 공유폴더/2025 결산", level: "쓰기" }, priority: "높음", requester: DEMO_USER, assignee: "이도윤", ageH: 7.2, steps: [1.5, 3.0, 4.2] },
  { title: "신규 입사자 노트북 지급", desc: "다음 주 월요일 입사 예정인 디자이너용 장비입니다.", company: "c2", service: "hw-laptop", fields: { device: "노트북", reason: "신규 입사", location: "판교 4층 디자인실" }, priority: "낮음", requester: DEMO_USER, assignee: "최민지", ageH: 50, steps: [2, 20, 26, 44], },
  { title: "Adobe Acrobat Pro 설치", desc: "계약서 전자서명 검토용으로 필요합니다.", company: "c1", service: "sw-install", fields: { software: "Adobe Acrobat Pro", license: "회사 보유" }, priority: "보통", requester: DEMO_USER, assignee: "정우성", ageH: 96, steps: [1, 4, 9, 18, 30], rating: 5, feedback: "설치 후 사용법까지 안내해 주셔서 좋았습니다." },
  { title: "의심 메일 수신 신고", desc: "택배 조회를 사칭한 메일을 받았고 링크는 누르지 않았습니다.", company: "c3", service: "sec-incident", fields: { kind: "피싱 메일", occurred: "2025-05-27" }, priority: "긴급", requester: "오세진", assignee: null, ageH: 0.6, steps: [] },
  { title: "7층 회의실 모니터 화면 깜빡임", desc: "HDMI 연결 시 화면이 주기적으로 꺼집니다.", company: "c2", service: "hw-repair", fields: { asset: "DG-MON-7041", symptom: "화면 이상" }, priority: "높음", requester: "윤가람", assignee: "한지수", ageH: 10.5, steps: [0.8, 2.5] },
  { title: "ERP 계정 신청", desc: "구매팀 전입으로 ERP 구매 모듈 계정이 필요합니다.", company: "c4", service: "acct-new", fields: { system: "ERP", start: "2025-06-02" }, priority: "보통", requester: "서지우", assignee: null, ageH: 5, steps: [1.2] },
  { title: "층 전체 Wi-Fi 끊김", desc: "3층 전체에서 오후 2시경부터 무선이 불안정합니다.", company: "c4", service: "net-vpn", fields: { where: "사무실 Wi-Fi", scope: "층 전체" }, priority: "긴급", requester: "장하린", assignee: "박서준", ageH: 6, steps: [0.3, 0.9, 1.4] },
  { title: "도킹스테이션 추가 지급", desc: "듀얼 모니터 사용을 위해 필요합니다.", company: "c3", service: "hw-laptop", fields: { device: "도킹스테이션", reason: "추가 필요", location: "본사 9층" }, priority: "낮음", requester: "문태오", assignee: "최민지", ageH: 120, steps: [5, 30, 40, 70, 80], rating: 3, feedback: "처리는 되었지만 진행 상황 안내가 더 있었으면 합니다." },
  { title: "인사시스템 메뉴 접근 회수", desc: "부서 이동한 팀원의 평가 메뉴 권한 회수 요청입니다.", company: "c2", service: "acct-perm", fields: { target: "인사시스템/평가관리", level: "회수" }, priority: "높음", requester: "윤가람", assignee: "이도윤", ageH: 30, steps: [2, 6, 7, 12] },
  { title: "통계 분석 프로그램 신규 구매 설치", desc: "데이터 분석 과제를 위해 필요합니다.", company: "c3", service: "sw-install", fields: { software: "SPSS Statistics", license: "신규 구매 필요" }, priority: "보통", requester: "오세진", assignee: "정우성", ageH: 40, steps: [3, 10] },
  { title: "노트북 팬 소음 및 과열", desc: "화상회의 중 발열로 속도가 크게 느려집니다.", company: "c1", service: "hw-repair", fields: { asset: "DG-NB-2210", symptom: "소음·발열" }, priority: "높음", requester: DEMO_USER, assignee: null, ageH: 1.2, steps: [] },
];

export function buildSeed(): AppState {
  const now = Date.now();
  const requests: ServiceRequest[] = specs.map((s, i) => {
    const created = now - s.ageH * H;
    const transitions = [{ stage: "접수" as Stage, at: new Date(created).toISOString(), by: s.requester }];
    s.steps.forEach((h, k) => {
      const stage = STAGES[k + 1];
      transitions.push({ stage, at: new Date(created + h * H).toISOString(), by: stage === "평가" ? s.requester : s.assignee ?? "상담원" });
    });
    return {
      id: `seed-${i + 1}`,
      code: `SR-${String(1041 + i)}`,
      title: s.title,
      description: s.desc,
      companyId: s.company,
      serviceId: s.service,
      fields: s.fields,
      priority: s.priority,
      stage: transitions[transitions.length - 1].stage,
      requester: s.requester,
      assignee: s.assignee,
      createdAt: new Date(created).toISOString(),
      dueAt: new Date(created + SLA_HOURS[s.priority] * H).toISOString(),
      transitions,
      rating: s.rating ?? null,
      feedback: s.feedback ?? null,
      isSample: true,
    };
  });
  return {
    version: 1,
    role: "requester",
    currentUser: DEMO_USER,
    companies: [
      { id: "c1", label: "디스커버리" },
      { id: "c2", label: "계열사 A" },
      { id: "c3", label: "계열사 B" },
      { id: "c4", label: "계열사 C" },
    ],
    requests,
    notifications: [
      { id: "n-1", at: new Date(now - 2.3 * H).toISOString(), title: "SR-1041 담당자 배정", body: "박서준 상담원이 'VPN 접속 인증 실패' 요청을 검토하고 있습니다.", requestId: "seed-1", read: false },
      { id: "n-2", at: new Date(now - 3 * H).toISOString(), title: "SR-1043 완료, 평가를 남겨 주세요", body: "노트북 지급이 완료되었습니다. 만족도를 남기면 요청이 종료됩니다.", requestId: "seed-3", read: false },
      { id: "n-3", at: new Date(now - 60 * H).toISOString(), title: "SR-1044 평가 감사합니다", body: "남겨 주신 의견은 서비스 개선에 반영됩니다.", requestId: "seed-4", read: true },
    ],
    seq: 1041 + specs.length,
  };
}
