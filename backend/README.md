# Taskflow Backend

REST API cho Taskflow, xây dựng bằng NestJS 11, TypeORM, PostgreSQL và Redis.

## Chức năng

- Đăng ký, đăng nhập và xác thực JWT.
- Quản lý dự án, thành viên dự án và phân quyền project manager.
- Quản lý công việc, nhãn dự án và gán nhãn cho công việc.
- Validation toàn cục, chuẩn hóa lỗi HTTP và request ID.
- Cache Redis cho dữ liệu dự án.

## Yêu cầu

- Node.js 22+
- Docker và Docker Compose (khuyến nghị để chạy đầy đủ PostgreSQL và Redis)

## Cấu hình môi trường

Sao chép file mẫu trước khi chạy:

```bash
cp .env.example .env
```

Các biến cần có:

| Biến | Mô tả |
| --- | --- |
| `PORT` | Cổng HTTP, mặc định `3000` |
| `DB_HOST`, `DB_PORT` | Host và cổng PostgreSQL |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Thông tin kết nối PostgreSQL |
| `REDIS_HOST`, `REDIS_PORT` | Host và cổng Redis |
| `JWT_SECRET` | Secret ký JWT; dùng giá trị ngẫu nhiên, đủ dài ở production |
| `JWT_EXPIRES_IN` | Thời hạn JWT, ví dụ `1d` |

Không commit file `.env`. File này đã được ignore; chỉ commit `.env.example` không chứa secret.

## Chạy local

```bash
npm ci
npm run start:dev
```

Ứng dụng chạy tại `http://localhost:3000`.

## Chạy bằng Docker

Từ thư mục gốc repository:

```bash
docker compose up --build
```

Compose development dùng `Dockerfile.dev`, mount source code và chạy Nest ở watch mode. PostgreSQL và Redis được kiểm tra health trước khi backend khởi động.

## Chạy production bằng Docker

Tại thư mục gốc, tạo file `.env` từ `.env.example`, thay `POSTGRES_PASSWORD` bằng một mật khẩu mạnh và đặt `DB_PASSWORD` trong `backend/.env` bằng đúng giá trị đó, sau đó chạy:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

`Dockerfile` dùng multi-stage build và image runtime chỉ cài production dependencies. PostgreSQL và Redis không expose cổng ra host trong cấu hình production.

## API chính

Mọi endpoint, trừ đăng ký và đăng nhập, yêu cầu header:

```http
Authorization: Bearer <access-token>
```

| Nhóm | Endpoint |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users | `POST /users` |
| Projects | `POST/GET /projects`, `GET/PATCH/DELETE /projects/:id` |
| Project members | `POST/GET /projects/:projectId/members`, `GET/PATCH/DELETE /projects/:projectId/members/:userId` |
| Tasks | `POST/GET /tasks`, `GET/PATCH/DELETE /tasks/:id` |
| Labels | `POST/GET /projects/:projectId/labels`, `GET/PATCH/DELETE /projects/:projectId/labels/:id` |
| Task labels | `POST/DELETE /tasks/:taskId/labels/:labelId`, `GET /tasks/:taskId/labels` |

## Scripts

```bash
npm run build              # Compile TypeScript vào dist/
npm run start:dev          # Chạy Nest ở watch mode
npm run start:prod         # Chạy bản đã build
npm run test               # Unit tests
npm run test:e2e           # End-to-end tests
npm run migration:run      # Chạy TypeORM migrations
npm run migration:revert   # Hoàn tác migration gần nhất
```

## Quy tắc trước khi commit

- Không commit `.env`, credentials, key hoặc file build (`dist/`, `node_modules/`).
- Chạy `npm run build` và `npm run test` trước khi mở pull request.
- Khi thêm dependency, cập nhật cả `package.json` và `package-lock.json`.
