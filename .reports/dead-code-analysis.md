# Dead Code Analysis Report
Generated: 2026-03-07 | Tools: knip, depcheck, ts-prune | Baseline: 38/38 tests pass

---

## 요약

| 카테고리 | 항목 수 | 결정 |
|---|---|---|
| SAFE — 삭제 가능 | 4 | 제거 |
| CAUTION — 보류 (실제 사용 중) | 6 | 유지 |
| DANGER — 손대지 않음 | 3 | 유지 |

---

## 🟢 SAFE — 삭제 가능

### 1. 미사용 npm 의존성 (`package.json`)

| 패키지 | 근거 | 결정 |
|---|---|---|
| `@ai-sdk/openai` | FastAPI 분리 후 Next.js에서 미사용. OpenAI SDK(`openai`)로 대체됨 | **제거** |
| `ai` (Vercel AI SDK) | FastAPI 프록시 방식으로 교체, 직접 사용 없음 | **제거** |
| `cheerio` | URL 스크래핑이 FastAPI로 이동 (backend/services/document_processor.py) | **제거** |
| `pdf-parse` | PDF 파싱이 FastAPI로 이동 (pdfplumber 사용) | **제거** |

### 2. 미사용 export (`sheet.tsx`)

| Export | 근거 |
|---|---|
| `SheetClose` | 프로젝트 내 어디에서도 import 없음 |
| `SheetFooter` | 프로젝트 내 어디에서도 import 없음 |
| `SheetDescription` | 프로젝트 내 어디에서도 import 없음 |

→ 컴포넌트 파일 자체는 사용 중이므로 export만 제거

---

## 🟡 CAUTION — 유지 (실제 사용 중)

| 항목 | 이유 |
|---|---|
| `src/lib/dummy-data.ts` | knip가 "미사용 파일"로 분류했지만 `/demo` 페이지에서 DUMMY_PERSONA 사용 |
| `src/lib/embeddings.ts` | Next.js에서 직접 import 없지만 향후 Phase 5 캐시에서 재사용 예정 |
| `src/lib/llm.ts` | 동일 — FastAPI 이전 후 직접 호출 없지만 참조 문서 역할 |
| `src/lib/search.ts` | 동일 |
| `src/lib/supabase/client.ts` | 브라우저 측 Supabase 클라이언트, 향후 클라이언트 컴포넌트에서 사용 가능 |
| `src/lib/supabase/server.ts` | SSR 측 Supabase 클라이언트, 서버 컴포넌트에서 사용 가능 |

---

## 🔴 DANGER — 유지

| 항목 | 이유 |
|---|---|
| `@supabase/ssr` | depcheck가 "미사용"으로 감지하지만 `supabase/server.ts`에서 `createServerClient` 사용 |
| `@vitest/coverage-v8` | 커버리지 리포트용, 제거하면 `npm run coverage` 불가 |
| `openai` (npm) | embeddings.ts에서 사용 중 (Next.js 측 fallback용으로 유지) |

---

## 실행 결과

1. [x] `package.json`에서 `@ai-sdk/openai`, `ai`, `cheerio`, `pdf-parse` 제거
2. [x] `npm install`로 lock 파일 업데이트
3. [x] 테스트 재실행 → **38/38 통과**
4. [x] `sheet.tsx`에서 미사용 export 3개 제거 (`SheetClose`, `SheetFooter`, `SheetDescription`)
5. [x] 테스트 재실행 → **38/38 통과**

최종 상태: 모든 변경 완료, 테스트 전부 통과
