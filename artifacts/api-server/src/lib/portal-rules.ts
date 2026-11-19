import type { RequestInput } from "@workspace/api-zod";

export const DEMO_USER = "김하늘";
export const STAGES = ["접수", "검토", "승인", "작업", "완료", "평가"] as const;
export const SLA_HOURS = { 긴급: 4, 높음: 8, 보통: 24, 낮음: 72 };
export const AGENTS = ["박서준", "이도윤", "최민지", "정우성", "한지수"];

export class PortalError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function ensure(ok: unknown, message: string, status = 400): asserts ok {
  if (!ok) throw new PortalError(status, message);
}

type Rule = { required?: boolean; options?: string[]; date?: boolean };
const rules: Record<string, Record<string, Rule>> = {
  "acct-new": { system: { required: true, options: ["그룹웨어", "ERP", "인사시스템", "VPN"] }, start: { required: true, date: true } },
  "acct-perm": { target: { required: true }, level: { required: true, options: ["읽기", "쓰기", "관리자", "회수"] } },
  "hw-laptop": { device: { required: true, options: ["노트북", "모니터", "도킹스테이션", "키보드·마우스"] }, reason: { required: true, options: ["신규 입사", "고장 교체", "노후 교체", "추가 필요"] }, location: { required: true } },
  "hw-repair": { asset: {}, symptom: { required: true, options: ["전원 불량", "화면 이상", "소음·발열", "주변기기 인식 불가", "기타"] } },
  "sw-install": { software: { required: true }, license: { required: true, options: ["회사 보유", "신규 구매 필요", "잘 모르겠음"] } },
  "net-vpn": { where: { required: true, options: ["사무실 유선", "사무실 Wi-Fi", "재택 VPN", "외부 출장지"] }, scope: { required: true, options: ["나만", "팀 전체", "층 전체", "모름"] } },
  "sec-incident": { kind: { required: true, options: ["피싱 메일", "계정 도용 의심", "장비 분실", "악성코드 의심"] }, occurred: { required: true, date: true } },
};

export function validateRequest(input: RequestInput) {
  ensure(input.title.trim().length >= 4, "제목은 4자 이상 입력해 주세요.");
  const fields = rules[input.serviceId];
  ensure(fields, "지원하지 않는 서비스입니다.");
  ensure(Object.keys(input.fields).every((key) => key in fields), "서비스에 없는 항목입니다.");
  for (const [key, rule] of Object.entries(fields)) {
    const value = input.fields[key]?.trim();
    ensure(!rule.required || value, `${key}: 필수 항목을 입력해 주세요.`);
    if (!value) continue;
    ensure(!rule.options || rule.options.includes(value), `${key}: 올바른 값을 선택해 주세요.`);
    if (rule.date) {
      const date = new Date(value);
      ensure(/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value, `${key}: 날짜가 올바르지 않습니다.`);
    }
  }
}
