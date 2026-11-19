# Help Service Portal: 3-Layer Architecture

```text
Front-End (React / Vite)
  화면 · 입력 · 검색/필터 · SLA 시각화
              │ same-origin JSON API (/api/portal)
              ▼
Back-End (Express)
  Routes: API 입력/응답 검증
  Services: 접수 · 배정 · 단계 전환 · 평가 · 데이터 이전
  Repository: 트랜잭션 내 조회와 데이터 조합
              │ Drizzle ORM / parameterized PostgreSQL queries
              ▼
Database (PostgreSQL)
  portal_companies
  portal_requests
  portal_transitions
  portal_ratings
  portal_notifications
```

## 각 계층의 책임

**Front-End**: 기존 요청자·상담원·관리자 화면을 유지합니다. React Query가 공용 상태를 불러오고 5초 주기 및 창 활성화 시 재조회합니다. 저장 완료 응답 이후에만 성공 표시·폼 종료·화면 이동을 수행합니다. 서버가 없을 때 브라우저 샘플로 대체하지 않습니다. SLA·리드타임·업무 부하 표시를 위한 계산과 읽기 전용 서비스 카탈로그·데모 지식 문서는 프런트엔드의 표시용 참조 데이터입니다.

**Back-End**: 실제 요청 접수와 업무 변경을 담당합니다. 요청 ID·번호·요청자·접수 시각·SLA 기한은 서버에서 생성합니다. 서비스별 필수 항목과 선택 값, 회사·담당자를 검증합니다. 표준 단계 순서와 완료 후 평가 조건은 서버가 강제합니다. 샘플 데모 사용자는 서버에서 고정하며 프런트엔드에서 전달한 역할을 인증으로 사용하지 않습니다.

**Database**: 회사·요청·이력·평가·알림을 별도 테이블로 영구 저장합니다. 요청-회사 및 이력/평가/알림-요청 연결은 외래키로 보장합니다. 번호는 DB 시퀀스로 충돌 없이 생성합니다. 단계 전환 및 평가 시 요청 행을 잠그고 요청 상태·처리 이력·알림을 같은 트랜잭션으로 저장합니다. 배치 작업은 기존 단계가 다르면 409를 반환하고 전체 작업을 취소합니다.

## API

| 메서드 | 경로 | 역할 |
|---|---|---|
| GET | `/api/portal` | 회사·요청·이력·평가·알림 조회 |
| POST | `/api/portal/requests` | 요청 생성 |
| POST | `/api/portal/batch` | 담당자 일괄 배정 / 단계 변경 |
| POST | `/api/portal/requests/:id/rating` | 완료 요청 평가 |
| PATCH | `/api/portal/companies` | 회사 이름 저장 |
| POST | `/api/portal/notifications/read` | 지정 알림 읽음 |
| POST | `/api/portal/import` | 기존 브라우저 요청 가져오기 |

입력 계약은 `lib/api-spec/openapi.yaml`이 원본입니다. `pnpm --filter @workspace/api-spec run codegen`으로 프런트엔드 클라이언트와 백엔드 검증 스키마를 생성합니다.

## 기존 로컬 데이터 보존

- 기존 `dg-help-portal-v1` 데이터는 수정하거나 삭제하지 않습니다.
- 설정 화면에서 현재 데모 사용자가 직접 생성한 요청만 명시적 동의 후 가져옵니다.
- 처리 이력·접수/기한·평가는 보존하고 요청 ID와 번호는 서버가 새로 부여합니다.
- 샘플 요청·기존 회사 라벨·기존 알림은 자동 병합하지 않습니다.
- 중복 가져오기는 원본 ID·접수 시각·요청자를 해시한 고유키로 방지합니다. 이미 가져온 요청을 덮어쓰지 않습니다.
- 공용 데이터를 삭제하는 초기화 API와 UI는 제공하지 않습니다.

## 실행과 배포

- 기존 관리 워크플로 `artifacts/api-server: API Server`와 `artifacts/help-service-portal: web`을 함께 실행합니다.
- 개발 스키마 반영: `pnpm --filter @workspace/db run push`.
- 타입 검사: `pnpm run typecheck`.
- 앱 시작 시 기존 스키마에 샘플 데이터를 한 번 삽입할 수 있지만, 스키마 생성·변경 DDL은 실행하지 않습니다.
- 운영 스키마 변경은 게시 흐름에서 개발 스키마 차이를 반영합니다. 운영 DB에 직접 마이그레이션 스크립트를 실행하지 않습니다.

## 운영 전 주의

현재는 **공용 데모**입니다. 로그인, 회사별 격리, 사용자별 알림, 실제 승인자 권한, SSO/Jira/Confluence 연동은 미적용입니다. 읽음 상태와 회사 설정도 공유됩니다. 데이터 저장 구조를 분리했다고 보안·권한이 완성되는 것은 아니며, 실제 사내 업무정보를 입력하기 전에 인증과 서버 측 권한 제어가 필요합니다.

## 검증

- `pnpm run typecheck`: 공유 라이브러리·서버·프런트엔드 타입 검사.
- `node scripts/check-portal.mjs`: 실행 중인 개발 API의 요청 검증, 서버 생성 필드, 저장 후 재조회, 동시 단계 변경 200/409 분리, 배치 실패 원자성, 배정, 단계 전환, 평가, 데이터 이전 중복 방지, 알림 읽음 검증. 회귀 검증임을 제목에 표시한 요청 2건을 생성하며 공용 데이터를 초기화하지 않습니다.
- 브라우저 핵심 흐름: 카탈로그에서 요청 생성 → 상담원 배정 → 검토/승인/작업/완료 → 요청자 4점 평가 → 새로고침 및 로컬 업무 데이터가 없는 새 브라우저에서 동일 기록 유지 확인.
