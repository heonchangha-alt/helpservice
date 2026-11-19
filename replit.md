# Help Service Portal

디스커버리 그룹 4개사가 공용하는 ITSM 포털입니다.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- 요청자 셀프서비스와 관리자·경영진 운영 대시보드를 구분합니다.
- 상담원 워크스페이스와 상담원 미리보기 역할은 사용자 요청에 따라 제공하지 않습니다.
- 모든 IT 요청은 접수 → 검토 → 승인 → 작업 → 완료 → 평가 순서로 처리하고 진행 상태와 단계별 리드타임을 추적합니다.
- 현재 버전은 UI 검토용 데모이며 브라우저에 데이터를 저장합니다. 역할 전환은 권한 인증이 아닙니다.
- 그룹 SSO(OIDC), Jira, Confluence 및 기존 사내 시스템은 아직 연결되지 않았습니다.
- 정식 회사명 목록이 제공되기 전까지 디스커버리와 계열사 A·B·C를 데모 명칭으로 사용합니다.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
