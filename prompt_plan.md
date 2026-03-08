# PersonaID — PRD & 개발 계획

> 최종 업데이트: 2026-03-08 (실제 코드 기반 전면 재정리)

---

## 제품 개요 (PRD)

### 한 줄 정의
방문자가 자연어로 질문하면 AI가 해당 인물처럼 답변하는 **AI 명함 인터뷰 서비스**

### 핵심 사용자
| 역할 | 설명 |
|---|---|
| Owner | 자신의 명함을 만드는 사람 (개발자, 디자이너 등) |
| Visitor | 명함을 보고 질문하는 사람 (면접관, 채용 담당자, 지인 등) |

### 핵심 가치
- Owner: 이력서/포트폴리오 기반 AI가 24시간 대신 질문에 답변
- Visitor: 딱딱한 이력서 대신 대화로 그 사람을 파악

### 기술 스택

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript) + Tailwind CSS + shadcn/ui |
| Backend | FastAPI + Python 3.12 + uvicorn |
| LLM | OpenRouter API — GLM-4.7 Flash |
| Embedding | OpenRouter — text-embedding-3-small (1536 dim) |
| Vector DB | Supabase pgvector |
| Storage | Supabase Storage (avatars, documents buckets) |
| Auth | Supabase Auth (스키마 준비됨, 아직 미연동) |
| Testing | Vitest (frontend), pytest (backend) |
| Deploy | Vercel (frontend), TBD (backend) |

---

## 현재 진행 상태 (2026-03-08 기준)

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 1 | 프로젝트 기반 + 라우팅 | ✅ 완료 |
| Phase 2 | Visitor UI (더미 데이터 → 실제 연동) | ✅ 완료 |
| Phase 3 | Owner 대시보드 | ✅ 완료 |
| Phase 4 | RAG 파이프라인 (pgvector) | ✅ 완료 |
| Phase 5 | Q&A 캐시 & 히스토리 | 🔲 미구현 |
| Phase 6 | FastAPI 백엔드 분리 | ✅ 완료 |
| Phase 7 | 인증 (Supabase Auth 연동) | 🔲 미구현 |
| Phase 8 | 버그 수정 & 프로덕션 하드닝 | 🔲 미구현 |
| Phase 9 | 배포 (Vercel + FastAPI Docker) | 🔲 미구현 |

---

## 완료된 기능 상세

### Phase 1: 프로젝트 기반 (완료)
- Next.js 15 (App Router, TypeScript) 프로젝트 생성
- Supabase 클라이언트 (Admin / Server / Client) 연결
- zod 환경변수 스키마 (`src/lib/env.ts`)
- 라우팅: `/` → `/dashboard` → `/[username]`

### Phase 2: Visitor UI (완료)
- `/[username]` 페이지: 프로필 헤더 + 채팅 UI + 포트폴리오 캐러셀
- 채팅 버블 (사용자/AI), SSE 스트리밍 애니메이션
- Interviewer 설정 패널 (답변 길이 / 언어 / 말투 / 질문 스타일 / 출처 표시)
- 추천 질문 바텀 시트
- 모바일 반응형 레이아웃 (h-dvh 고정, 모바일 자연 스크롤)

### Phase 3: Owner 대시보드 (완료)
- `/dashboard` 프로필 섹션: 이름/직책/bio/사진/username
- 문서 섹션: PDF 업로드 + URL 스테이징 (Notion, GitHub, LinkedIn, 기타)
  - PDF: Storage 선업로드 → 이탈 시 자동 삭제
  - 한글 파일명 sanitize (`sanitizeStorageKey`)
- 페르소나 설정: 말투 프리셋 / 커스텀 프롬프트 / 방문자 기본값
- 추천 질문 관리 (추가/삭제)
- Server Actions으로 DB 저장
- "방문자로 보기" → `/[username]` 이동

### Phase 4: RAG 파이프라인 (완료)
- PDF 파싱 (pdfplumber) + URL 스크래핑 (httpx + BeautifulSoup)
- 텍스트 청킹 (500단어, 50단어 오버랩)
- OpenRouter 임베딩 생성 → Supabase pgvector 저장
- Supabase RPC `match_documents` 코사인 유사도 검색
- Citation 포함 SSE 응답 포맷
- 문서 처리 진행률 추적 (백그라운드 태스크)

### Phase 6: FastAPI 백엔드 분리 (완료)
- `backend/` 독립 FastAPI 앱
- `POST /api/chat` — SSE 스트리밍 (RAG + LLM)
- `POST /api/documents/process` — 문서 처리 백그라운드 태스크
- `GET /api/documents/{id}/progress` — 처리 진행률
- `GET /health` — 헬스체크
- Next.js → FastAPI 프록시 (`/api/chat`, `/api/process-document`)

---

## 테스트 현황

### Frontend (Vitest) — 56개 전체 통과
| 파일 | 테스트 수 | 커버 범위 |
|---|---|---|
| `document-section-logic.test.ts` | 15 | URL/PDF 스테이징 불변성, 유효성 검사 |
| `user-to-persona.test.ts` | 7 | User → Persona 타입 변환 |
| `validations.test.ts` | 8 | 파일 크기/타입 유효성 |
| `sanitize-filename.test.ts` | 8 | 한글→ASCII 파일명 변환 |
| `interviewer-config.test.ts` | 18 | 기본값 형상, 불변 업데이트, 부분 업데이트 |

### Backend (pytest) — 69개 전체 통과
| 파일 | 테스트 수 | 커버 범위 |
|---|---|---|
| `test_document_processor.py` | 28 | chunk_text, HTML 추출, PDF 파싱, 처리 통합 |
| `test_llm.py` | 27 | build_system_prompt (언어/말투/길이/인용/프리셋 등) |
| `test_search.py` | 14 | build_context (임계값, 인덱스, 내용 트런케이션 등) |

---

## 발견된 버그 및 수정 이력

### 수정 완료
- `llm.py`: `config.get("language") == "ko"` → None이면 영어로 잘못 설정됨
  → `config.get("language", "ko") == "ko"` 로 수정 (기본값 한국어)

### 수정 필요 (Phase 8에서 처리)
| 심각도 | 위치 | 내용 |
|---|---|---|
| HIGH | `routers/chat.py:39-40` | 임베딩 에러를 traceback.txt 파일에 쓰고 무시 → 로거로 교체 |
| HIGH | `main.py` CORS | `localhost:3000` 하드코딩 → 환경변수 기반으로 변경 |
| MEDIUM | `routers/chat.py:37-41` | 임베딩 실패 시 빈 컨텍스트로 계속 진행 → 클라이언트에 에러 반환 |
| MEDIUM | `services/document_processor.py` | Storage URL 추출 regex fragile |
| LOW | `services/document_processor.py` | 동일 파일 재업로드 시 구 청크 미삭제 |

---

## Phase 5: Q&A 캐시 & 히스토리 (다음 구현)

**목표**: 반복 질문 캐시 반환 + Owner 히스토리 대시보드

### Tasks

#### 5-1. Backend: 대화 저장 + 캐시
- [ ] `routers/conversations.py` 생성
  - `POST /api/conversations` — Q&A 저장 (session_id, config 포함)
  - `GET /api/conversations/cache?q=<question>&user_id=<id>` — 캐시 조회
- [ ] 채팅 엔드포인트에 캐시 체크 추가
  - 질문 임베딩 → 유사도 > 0.95 → 캐시된 답변 즉시 반환
  - 캐시 미스 → 기존 RAG 흐름 + 결과 저장
- [ ] Supabase `conversations` 테이블 스키마 확인/추가

#### 5-2. Frontend: 히스토리 대시보드
- [ ] `/dashboard` 에 히스토리 탭 추가
  - 최근 방문자 질문 목록 (세션 ID, 시각, 질문, 답변 미리보기)
  - 자주 묻는 질문 Top 5
  - 방문 세션 수 통계

#### 5-3. Frontend: 캐시 인디케이터
- [ ] 캐시 히트 응답에 "⚡ 이전 답변" 뱃지 표시

### 완료 기준
- E2E: 동일 질문 2회 전송 → 2번째 응답이 캐시에서 반환됨 (curl 확인)
- 대시보드 히스토리 탭에서 질문 목록 조회 가능

---

## Phase 7: 인증 (Supabase Auth)

**목표**: 실제 멀티 유저 지원 (현재는 demo 유저 하드코딩)

### Tasks
- [ ] 로그인/회원가입 페이지 (`/login`, `/signup`)
- [ ] `users.auth_id` → Supabase Auth `user.id` 연결
- [ ] `/dashboard` auth guard (미로그인 → `/login` 리다이렉트)
- [ ] 로그아웃 기능
- [ ] Owner만 자신의 대시보드 수정 가능하도록 RLS 정책 확인

### 완료 기준
- 회원가입 → 로그인 → 대시보드 접근 E2E 동작

---

## Phase 8: 버그 수정 & 프로덕션 하드닝

### Tasks
- [ ] `chat.py` 임베딩 에러 처리: traceback.txt → logging + 클라이언트 에러 반환
- [ ] CORS 설정: `ALLOWED_ORIGINS` 환경변수로 분리
- [ ] 동일 문서 재처리 시 구 청크 삭제 로직
- [ ] 채팅 입력 길이 제한 (프론트엔드 + 백엔드)
- [ ] 임베딩 API 실패 시 retry 로직 (최대 3회)
- [ ] `document_processor.py`: Storage URL 추출을 regex 대신 URL 파싱으로 교체

---

## Phase 9: 배포

### Tasks
- [ ] FastAPI → `Dockerfile` + `docker-compose.yml`
- [ ] Vercel 환경변수에 `FASTAPI_URL` 설정 (프로덕션 FastAPI URL)
- [ ] FastAPI CORS에 Vercel 도메인 추가
- [ ] 프로덕션 E2E 스모크 테스트

---

## 리스크

| Level | Risk | Mitigation |
|---|---|---|
| HIGH | 인증 없이 대시보드 접근 가능 (현재 상태) | Phase 7 auth 구현 우선 |
| MEDIUM | 임베딩 API 실패 시 빈 컨텍스트로 응답 | Phase 8에서 에러 핸들링 강화 |
| MEDIUM | FastAPI CORS 프로덕션에서 차단 | Phase 8/9에서 환경변수 분리 |
| LOW | 동일 문서 재업로드 시 중복 청크 | Phase 8에서 삭제 로직 추가 |
