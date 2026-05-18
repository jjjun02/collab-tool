# 실시간 프로젝트 협력 툴 - 프론트엔드

화면설계서(MDR-UI-v1.00) 기반 13개 화면을 모두 구현한 React 프론트엔드.

## 스택

- **React 18** + **Vite** — 빠른 빌드, HMR
- **react-router-dom** — 라우팅
- **axios** — HTTP 클라이언트 (인터셉터로 JWT 자동 첨부 + 401 자동 로그아웃)
- **zustand** — 인증 상태 관리 (localStorage persist)
- **react-hook-form** — 폼 + 검증
- **@dnd-kit/core** — 칸반 드래그 앤 드롭
- **react-hot-toast** — 토스트 알림
- **tailwindcss** — 스타일링
- **dayjs** — 날짜 포매팅

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 백엔드 연결

기본 설정은 `/api/v1` 으로 요청을 보내며 `vite.config.js`의 proxy 설정이 이를 `http://localhost:3000` 으로 프록시합니다.
백엔드 포트가 다르면 `vite.config.js`의 `proxy.target` 값을 변경하세요.

또는 `.env` 파일을 만들어서 base URL 자체를 변경할 수 있습니다.

```env
# .env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## 화면 구성

| 경로 | 화면 ID | 설명 |
|---|---|---|
| `/login` | SCR-U-001 | 로그인 |
| `/register` | SCR-U-002 | 회원가입 |
| `/profile` | SCR-U-003 | 내 정보 조회/수정 |
| `/projects` | SCR-P-001 | 프로젝트 목록 |
| `/projects/new` | SCR-P-002 | 프로젝트 생성 |
| `/projects/join` | SCR-P-004 | 초대코드로 참여 |
| `/projects/:id/settings` | SCR-P-003 | 프로젝트 상세/설정 |
| `/projects/:id/kanban` | SCR-T-001 | Task 칸반 보드 (드래그앤드롭) |
| `/tasks/:id` | SCR-T-002 | Task 상세 |
| `/projects/:id/board` | SCR-B-001 | 게시판 목록 |
| `/projects/:id/board/new` | SCR-B-002 | 게시글 작성/수정 |
| `/posts/:id` | SCR-B-003 | 게시글 상세 + 댓글 |
| `/admin/logs` | SCR-S-001 | 오류 로그 (admin 전용) |

## 폴더 구조

```
src/
├── api/             # 도메인별 API 함수 (auth, users, projects, tasks, posts, admin)
├── components/      # 공통 컴포넌트 (Modal, Pagination, ConfirmDialog)
├── layouts/         # 페이지 레이아웃 (Auth, Main)
├── pages/           # 화면 (auth, projects, tasks, board, admin)
├── routes/          # ProtectedRoute 가드
├── store/           # zustand 인증 스토어
├── utils/           # 공통 유틸 (error 핸들러)
├── App.jsx          # 라우터
└── main.jsx         # 엔트리
```

## API 응답 포맷 가정

백엔드 응답 키 이름은 camelCase / snake_case 둘 다 처리하도록 작성되어 있습니다 (`projectId` 또는 `project_id` 등).
다음과 같은 응답 구조를 가정합니다:

```jsonc
// POST /auth/login
{ "accessToken": "jwt...", "user": { "userId": 1, "name": "...", "email": "...", "role": "member" } }

// GET /projects
{ "projects": [ { "projectId": 1, "name": "...", "myRole": "admin", "description": "..." } ] }

// GET /projects/:id
{ "projectId": 1, "name": "...", "description": "...", "inviteCode": "ABC123", "myRole": "admin" }

// GET /projects/:id/members
{ "members": [ { "userId": 1, "name": "...", "role": "admin", "joinedAt": "..." } ] }

// GET /projects/:id/tasks
{ "tasks": [ { "taskId": 1, "title": "...", "status": "todo", "assignee": {...}, "dueDate": "...", "isOverdue": false } ] }

// GET /projects/:id/posts?page=1&size=10
{ "posts": [...], "totalCount": 42, "totalPages": 5 }

// GET /posts/:id
{ "postId": 1, "title": "...", "content": "...", "author": {...}, "comments": [...] }
```

응답 구조가 다르면 `src/api/*.js`와 각 페이지에서 추출하는 부분만 수정하세요.

## 주의사항

- JWT는 `localStorage`의 `accessToken` 키에 저장됩니다.
- 401 응답 시 자동으로 토큰을 지우고 `/login` 으로 리다이렉트됩니다.
- 칸반 드래그 시 낙관적 업데이트 후 API 호출 → 실패 시 롤백합니다.
