import type { Article, ServiceDef } from "./types";

export const AGENTS = ["박서준", "이도윤", "최민지", "정우성", "한지수"];

export const SERVICES: ServiceDef[] = [
  {
    id: "acct-new",
    category: "계정 · 권한",
    name: "시스템 계정 신청",
    summary: "그룹웨어, ERP 등 업무 시스템 신규 계정",
    defaultPriority: "보통",
    fields: [
      { key: "system", label: "대상 시스템", type: "select", options: ["그룹웨어", "ERP", "인사시스템", "VPN"], required: true },
      { key: "start", label: "사용 시작일", type: "date", required: true },
    ],
  },
  {
    id: "acct-perm",
    category: "계정 · 권한",
    name: "접근 권한 변경",
    summary: "폴더, 저장소, 메뉴 단위 권한 추가 및 회수",
    defaultPriority: "높음",
    fields: [
      { key: "target", label: "권한 대상 (경로 또는 메뉴)", type: "text", placeholder: "예: 재무팀 공유폴더/2025", required: true },
      { key: "level", label: "요청 권한", type: "select", options: ["읽기", "쓰기", "관리자", "회수"], required: true },
    ],
  },
  {
    id: "hw-laptop",
    category: "하드웨어",
    name: "노트북 · 모니터 지급",
    summary: "신규 입사, 교체, 추가 장비 요청",
    defaultPriority: "낮음",
    fields: [
      { key: "device", label: "장비 종류", type: "select", options: ["노트북", "모니터", "도킹스테이션", "키보드·마우스"], required: true },
      { key: "reason", label: "요청 사유", type: "select", options: ["신규 입사", "고장 교체", "노후 교체", "추가 필요"], required: true },
      { key: "location", label: "수령 위치", type: "text", placeholder: "예: 본사 7층 데스크", required: true },
    ],
  },
  {
    id: "hw-repair",
    category: "하드웨어",
    name: "장비 고장 신고",
    summary: "PC, 프린터, 회의실 장비 장애",
    defaultPriority: "높음",
    fields: [
      { key: "asset", label: "자산 번호", type: "text", placeholder: "장비 하단 라벨 확인", required: false },
      { key: "symptom", label: "증상", type: "select", options: ["전원 불량", "화면 이상", "소음·발열", "주변기기 인식 불가", "기타"], required: true },
    ],
  },
  {
    id: "sw-install",
    category: "소프트웨어",
    name: "소프트웨어 설치",
    summary: "승인된 목록 내 프로그램 설치 및 라이선스",
    defaultPriority: "보통",
    fields: [
      { key: "software", label: "소프트웨어명", type: "text", placeholder: "예: Adobe Acrobat Pro", required: true },
      { key: "license", label: "라이선스 유형", type: "select", options: ["회사 보유", "신규 구매 필요", "잘 모르겠음"], required: true },
    ],
  },
  {
    id: "net-vpn",
    category: "네트워크",
    name: "네트워크 · VPN 장애",
    summary: "사내망, Wi-Fi, 원격 접속 문제",
    defaultPriority: "긴급",
    fields: [
      { key: "where", label: "발생 위치", type: "select", options: ["사무실 유선", "사무실 Wi-Fi", "재택 VPN", "외부 출장지"], required: true },
      { key: "scope", label: "영향 범위", type: "select", options: ["나만", "팀 전체", "층 전체", "모름"], required: true },
    ],
  },
  {
    id: "sec-incident",
    category: "보안",
    name: "보안 의심 신고",
    summary: "피싱 메일, 의심 접속, 분실 장비",
    defaultPriority: "긴급",
    fields: [
      { key: "kind", label: "유형", type: "select", options: ["피싱 메일", "계정 도용 의심", "장비 분실", "악성코드 의심"], required: true },
      { key: "occurred", label: "발생일", type: "date", required: true },
    ],
  },
];

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);
export const CATEGORIES = Array.from(new Set(SERVICES.map((s) => s.category)));

export const ARTICLES: Article[] = [
  {
    id: "kb-vpn",
    title: "재택 근무 시 VPN이 연결되지 않을 때",
    category: "네트워크",
    summary: "인증서 만료, 클라이언트 버전, 공유기 설정 순서로 점검합니다.",
    body: [
      "VPN 클라이언트를 완전히 종료한 뒤 다시 실행합니다. 트레이 아이콘에서 종료해야 백그라운드 프로세스까지 정리됩니다.",
      "클라이언트 하단의 버전을 확인합니다. 사내 공지된 최신 버전보다 낮으면 소프트웨어 센터에서 업데이트합니다.",
      "인증서 만료 안내가 표시되면 사내망 접속 상태에서 인증서를 재발급해야 하므로 '네트워크 · VPN 장애'로 요청해 주세요.",
      "가정용 공유기에서 VPN 패스스루 옵션이 꺼져 있으면 연결이 실패할 수 있습니다.",
    ],
    updated: "2025-05-12",
    views: 1284,
  },
  {
    id: "kb-password",
    title: "그룹웨어 비밀번호 초기화 방법",
    category: "계정 · 권한",
    summary: "본인 인증 후 셀프 초기화가 가능하며, 5회 잠금은 30분 뒤 자동 해제됩니다.",
    body: [
      "로그인 화면의 '비밀번호 찾기'에서 사번과 등록된 휴대전화로 본인 인증을 진행합니다.",
      "새 비밀번호는 10자 이상, 영문·숫자·특수문자를 모두 포함해야 하며 최근 3회 사용한 값은 재사용할 수 없습니다.",
      "5회 연속 실패로 잠긴 계정은 30분 뒤 자동으로 해제됩니다. 급한 경우 '시스템 계정 신청'이 아닌 '접근 권한 변경'으로 요청해 주세요.",
    ],
    updated: "2025-04-28",
    views: 2391,
  },
  {
    id: "kb-phishing",
    title: "피싱 메일을 받았을 때 해야 할 일",
    category: "보안",
    summary: "링크를 누르지 말고, 메일을 삭제하기 전에 신고부터 해 주세요.",
    body: [
      "본문 링크나 첨부를 열지 않습니다. 이미 열었다면 네트워크 연결을 끊고 바로 신고합니다.",
      "메일을 삭제하지 말고 보존해 주세요. 보안 담당자가 발신 경로를 확인하는 데 필요합니다.",
      "'보안 의심 신고' 서비스로 요청하면 긴급 우선순위로 접수되어 4시간 이내 응대를 목표로 합니다.",
    ],
    updated: "2025-05-20",
    views: 876,
  },
  {
    id: "kb-printer",
    title: "층별 공용 프린터 드라이버 설치",
    category: "하드웨어",
    summary: "소프트웨어 센터에서 층 번호로 검색하면 드라이버가 자동 설치됩니다.",
    body: [
      "소프트웨어 센터를 열고 '프린터'와 층 번호(예: 7F)를 함께 검색합니다.",
      "설치 후 기본 프린터로 지정하고 테스트 페이지를 출력합니다.",
      "인쇄 대기열이 멈춰 있다면 '장비 고장 신고'에서 증상 '주변기기 인식 불가'를 선택해 주세요.",
    ],
    updated: "2025-03-17",
    views: 642,
  },
  {
    id: "kb-software",
    title: "소프트웨어 설치 요청 전 확인할 사항",
    category: "소프트웨어",
    summary: "회사 보유 라이선스 여부에 따라 승인 단계와 소요 시간이 달라집니다.",
    body: [
      "회사 보유 라이선스는 팀장 승인 후 보통 1영업일 내 설치됩니다.",
      "신규 구매가 필요한 경우 구매 품의가 추가되어 승인 단계가 길어질 수 있습니다.",
      "무료 소프트웨어도 보안 검토 대상이므로 임의 설치하지 말고 요청해 주세요.",
    ],
    updated: "2025-05-02",
    views: 518,
  },
  {
    id: "kb-onboarding",
    title: "신규 입사자 IT 준비 체크리스트",
    category: "계정 · 권한",
    summary: "입사 3영업일 전까지 계정과 장비를 함께 요청하면 첫날부터 업무가 가능합니다.",
    body: [
      "그룹웨어, ERP 등 필요한 시스템 계정을 '시스템 계정 신청'으로 각각 요청합니다.",
      "노트북은 '노트북 · 모니터 지급'에서 요청 사유 '신규 입사'를 선택합니다.",
      "수령 위치를 정확히 적으면 입사 당일 자리에 세팅된 상태로 준비됩니다.",
    ],
    updated: "2025-02-10",
    views: 1107,
  },
];
