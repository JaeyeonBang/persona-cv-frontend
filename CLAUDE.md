# persona-cv-frontend

Next.js 15 프론트엔드. AI 채팅은 `/api/chat` → FastAPI 백엔드 프록시.

## 실행

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # Vitest (38 tests)
npm run build     # 프로덕션 빌드
```

## 환경변수 (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=z-ai/glm-4.7-flash
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
FASTAPI_URL=http://localhost:8001
```

## 라우팅

| 경로 | 설명 |
|---|---|
| `/` | 랜딩 페이지 |
| `/dashboard` | Owner 대시보드 (프로필·문서·페르소나 설정) |
| `/[username]` | 방문자 채팅 페이지 |
| `/demo` | 데모 페이지 (더미 데이터) |
| `/api/chat` | FastAPI `/api/chat` 프록시 (SSE) |
| `/api/process-document` | FastAPI `/api/documents/process` 프록시 |

## 구조

```
src/
  app/                     — Next.js App Router 페이지
  components/
    dashboard/             — 대시보드 섹션 컴포넌트
    persona/               — 방문자 채팅 컴포넌트
    ui/                    — shadcn/ui 기반 공용 컴포넌트
  contexts/                — InterviewerConfigProvider
  lib/
    __tests__/             — Vitest 테스트 (38개)
    supabase/              — Admin / Server / Client 클라이언트
    types.ts               — Persona, InterviewerConfig, User 타입
    constants.ts           — DEFAULT_INTERVIEWER_CONFIG 등
    env.ts                 — zod 환경변수 검증
    api-client.ts          — apiFetch() — FastAPI 프록시 헬퍼
supabase/migrations/       — SQL 마이그레이션
```

## 주요 패턴

- **PDF 업로드**: storage 먼저 → 미저장 시 `useEffect` cleanup 자동 삭제
- **파일명 sanitize**: `sanitizeStorageKey()` — 한글/특수문자 → ASCII
- **Server Actions**: `src/app/dashboard/actions.ts` 집중 관리
- **Demo 유저**: username `demo`, `/dashboard` 접속 시 `ensureDemoUser()` 자동 생성

## 테스트

```bash
npm test                  # 전체 (38 tests)
npm run test:watch        # 워치 모드
```

테스트 위치: `src/lib/__tests__/`
