# Taskflow Backend

REST API và realtime notifications cho Taskflow, xây dựng bằng NestJS 11, TypeORM, PostgreSQL, Redis và Socket.IO.

## Chức năng

- JWT authentication: đăng ký, đăng nhập và lấy thông tin người dùng hiện tại.
- Projects, thành viên, vai trò manager/member và project invitations.
- Tasks với status, priority, deadline, assignee và labels.
- Chỉ project manager được thay đổi assignee; assignee phải là thành viên của project.
- Notifications realtime khi có các sự kiện liên quan đến project/task.
- AI assistant qua Ollama: hỏi dữ liệu task/project và tạo task/project từ yêu cầu ngôn ngữ tự nhiên.
- Validation toàn cục, HTTP error chuẩn hóa, request ID và Redis cache cho project data.

## Yêu cầu

- Node.js 22+ và npm 10+
- PostgreSQL
- Redis
- Docker Compose (khuyến nghị cho môi trường local đầy đủ)

## Cấu hình môi trường

```bash
cp .env.example .env
```

| Biến | Mô tả |
| --- | --- |
| `PORT` | HTTP port, mặc định `3000` |
| `DB_HOST`, `DB_PORT` | PostgreSQL host và port |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Thông tin kết nối database |
| `REDIS_HOST`, `REDIS_PORT` | Thông tin kết nối Redis |
| `JWT_SECRET` | Secret đủ dài, ngẫu nhiên ở production |
| `JWT_EXPIRES_IN` | Thời hạn token, ví dụ `1d` |
| `OLLAMA_BASE_URL` | Địa chỉ Ollama; mặc định `http://host.docker.internal:11434` |
| `OLLAMA_MODEL` | Model Ollama; mặc định `qwen3:1.7b` |

Không commit file `.env` hoặc secret production.

## Chạy local

```bash
npm ci
npm run migration:run
npm run start:dev
```

API chạy tại `http://localhost:3000`.

AI assistant cần Ollama đang chạy và model được tải. Ví dụ với model mặc định:

```bash
ollama pull qwen3:1.7b
```

Khi backend chạy trực tiếp trên máy host, đặt `OLLAMA_BASE_URL=http://localhost:11434` trong `backend/.env`. Khi backend chạy bằng Docker, mặc định `host.docker.internal` trỏ đến Ollama trên máy host.

## Docker

Từ thư mục root của repository:

```bash
docker compose up --build
```

Compose development khởi động PostgreSQL, Redis và NestJS ở watch mode. Với production, tạo `.env` ở root, đặt mật khẩu database phù hợp với `backend/.env`, sau đó chạy:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## API chính

Ngoại trừ `POST /auth/register` và `POST /auth/login`, các endpoint yêu cầu:

```http
Authorization: Bearer <access-token>
```

| Nhóm | Endpoint |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users | `POST /users`, `GET /users` |
| Projects | `POST/GET /projects`, `GET/PATCH/DELETE /projects/:id` |
| Members | `POST/GET /projects/:projectId/members`, `GET/PATCH/DELETE /projects/:projectId/members/:userId` |
| Invitations | `GET /project-invitations`, `PATCH /project-invitations/:id/accept`, `PATCH /project-invitations/:id/reject` |
| Tasks | `POST/GET /tasks`, `GET/PATCH/DELETE /tasks/:id` |
| Project labels | `POST/GET /projects/:projectId/labels`, `GET/PATCH/DELETE /projects/:projectId/labels/:id` |
| Task labels | `POST/DELETE /tasks/:taskId/labels/:labelId`, `GET /tasks/:taskId/labels` |
| Notifications | `GET /notifications?page=1&limit=20` |
| AI | `POST /ai/chat` |

`GET /tasks` hỗ trợ lọc `projectId`, `assigneeId`, `status`, `priority`, `search`, `page` và `limit`. Kết quả gồm `assignee` để frontend hiển thị người được giao.

`POST /ai/chat` yêu cầu Bearer JWT và nhận body `{ "message": "..." }` (1–4000 ký tự). Trợ lý trả lời câu hỏi về dữ liệu task/project hiện tại hoặc thực hiện yêu cầu tạo task/project sau khi kiểm tra dữ liệu đầu vào.

## Scripts

```bash
npm run build              # Compile TypeScript vào dist/
npm run start:dev          # Chạy Nest ở watch mode
npm run start:prod         # Chạy bản đã build
npm run lint:check         # Kiểm tra ESLint, không tự sửa
npm run test               # Unit tests
npm run test:e2e           # End-to-end tests
npm run migration:run      # Chạy TypeORM migrations
npm run migration:revert   # Hoàn tác migration gần nhất
```
