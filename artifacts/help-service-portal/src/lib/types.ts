export const STAGES = ["접수", "검토", "승인", "작업", "완료", "평가"] as const;
export type Stage = (typeof STAGES)[number];

export const PRIORITIES = ["긴급", "높음", "보통", "낮음"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const SLA_HOURS: Record<Priority, number> = { 긴급: 4, 높음: 8, 보통: 24, 낮음: 72 };

export type Role = "requester" | "agent" | "manager";
export const ROLE_LABEL: Record<Role, string> = {
  requester: "요청자",
  agent: "상담원",
  manager: "관리자",
};

export interface Company {
  id: string;
  label: string;
}

export interface Transition {
  stage: Stage;
  at: string;
  by: string;
}

export interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  companyId: string;
  serviceId: string;
  fields: Record<string, string>;
  priority: Priority;
  stage: Stage;
  requester: string;
  assignee: string | null;
  createdAt: string;
  dueAt: string;
  transitions: Transition[];
  rating: number | null;
  feedback: string | null;
  isSample: boolean;
}

export interface AppNotification {
  id: string;
  at: string;
  title: string;
  body: string;
  requestId: string | null;
  read: boolean;
}

export type FieldDef =
  | { key: string; label: string; type: "text"; placeholder?: string; required?: boolean }
  | { key: string; label: string; type: "select"; options: string[]; required?: boolean }
  | { key: string; label: string; type: "date"; required?: boolean };

export interface ServiceDef {
  id: string;
  category: string;
  name: string;
  summary: string;
  defaultPriority: Priority;
  fields: FieldDef[];
}

export interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  body: string[];
  updated: string;
  views: number;
}

export interface AppState {
  version: number;
  role: Role;
  currentUser: string;
  companies: Company[];
  requests: ServiceRequest[];
  notifications: AppNotification[];
  seq: number;
}
