# Help Service Portal

디스커버리 그룹 4개사가 공용하는 ITSM 포털입니다.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (managed workflow supplies PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: generated Zod API contracts and `drizzle-zod` database schemas
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM backend), Vite (frontend)

## Where things live

- Front-End: `artifacts/help-service-portal/src` — React UI; `lib/store.tsx` is the API/state adapter.
- Back-End: `artifacts/api-server/src/routes/portal.ts` → `services/portal.ts` → `repositories/portal.ts`.
- Database: `lib/db/src/schema` — companies, requests, transitions, ratings, notifications.
- Contract: `lib/api-spec/openapi.yaml`; regenerate clients and validation schemas after changes.
- [3계층 구조 및 데이터 이전](docs/architecture.md)

## Architecture decisions

- The user requested Front-End / Back-End / Database separation. Do not restore browser-only business persistence.
- Role switching remains a demo preference, not authentication. No real business data until authentication and authorization are implemented.
- Legacy browser data remains untouched; import requires explicit confirmation because it becomes visible to every demo visitor.
- Shared data must not be reset through a public endpoint. Only new installations receive server-side sample data.

## Product

- 요청자 셀프서비스, 상담원 워크스페이스, 관리자·경영진 운영 대시보드를 구분합니다.
- 모든 IT 요청은 접수 → 검토 → 승인 → 작업 → 완료 → 평가 순서로 처리하고 진행 상태와 단계별 리드타임을 추적합니다.
- 현재 버전은 PostgreSQL에 업무 데이터를 저장하는 공용 데모입니다. 역할 전환은 권한 인증이 아닙니다.
- 그룹 SSO(OIDC), Jira, Confluence 및 기존 사내 시스템은 아직 연결되지 않았습니다.
- 정식 회사명 목록이 제공되기 전까지 디스커버리와 계열사 A·B·C를 데모 명칭으로 사용합니다.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
