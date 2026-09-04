# Taskflow

Taskflow là ứng dụng quản lý công việc theo project. Người dùng có thể tổ chức công việc theo từng project, cộng tác với thành viên, phân công task, theo dõi tiến độ và nhận notification khi có thay đổi liên quan.

Dự án được tách thành REST API NestJS, giao diện Next.js và lớp realtime notifications qua Socket.IO. PostgreSQL lưu dữ liệu nghiệp vụ, còn Redis được dùng để cache dữ liệu project.

## Tính năng

- Đăng ký, đăng nhập và xác thực JWT.
- Tạo và quản lý project, thành viên, vai trò và lời mời tham gia.
- Tạo, cập nhật, xóa và phân công task cho thành viên project.
- Theo dõi status, priority, deadline và labels của task.
- Notifications realtime cho các hoạt động liên quan.

## Phân quyền

Mỗi project có hai vai trò:

| Vai trò | Quyền chính |
| --- | --- |
| `MANAGER` | Quản lý project, thành viên, labels, lời mời và phân công task. |
| `MEMBER` | Xem project/task mà mình là thành viên và cập nhật task theo quyền truy cập. |

Backend kiểm tra thành viên project cho các tài nguyên project/task. Khi thay đổi assignee, backend chỉ chấp nhận người dùng đang là thành viên của project.

## Công nghệ

| Phần | Công nghệ |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | NestJS 11, TypeORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Realtime | Socket.IO |

## Cấu trúc thư mục

```text
taskflow/
├── backend/      # NestJS API, migrations và business logic
├── frontend/     # Next.js web application
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Kiến trúc và luồng dữ liệu

```text
Next.js (port 3001)
  ├── REST requests + Bearer JWT ────────────────> NestJS API (port 3000)
  └── Socket.IO notifications <───────────────────┘
                                                     ├── PostgreSQL
                                                     └── Redis cache
```

- Frontend lưu access token sau khi đăng nhập. `apiFetch` tự thêm header `Authorization: Bearer <token>` cho các API yêu cầu xác thực.
- Khi API trả về `401`, frontend xóa token và chuyển người dùng về trang đăng nhập.
- Task API trả về quan hệ `assignee`; danh sách task hiển thị người đang được giao task.
- Notification gateway phát event theo room `user:<userId>` để mỗi người dùng chỉ nhận notification của mình.

## Chạy nhanh với Docker

1. Tạo môi trường cho backend:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Khởi động API, PostgreSQL và Redis:

   ```bash
   docker compose up --build
   ```

Backend có tại `http://localhost:3000`. Chạy frontend riêng theo hướng dẫn bên dưới.

Để dừng các service và giữ dữ liệu database/Redis trong Docker volume:

```bash
docker compose down
```

Muốn xóa cả volumes local (mất dữ liệu development):

```bash
docker compose down -v
```

## Chạy local

### Backend

```bash
cd backend
cp .env.example .env
npm ci
npm run migration:run
npm run start:dev
```

### Frontend

Tạo `frontend/.env.local` với nội dung:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Sau đó chạy:

```bash
cd frontend
npm ci
npm run dev
```

Mở ứng dụng tại `http://localhost:3001`.

## Quy trình sử dụng cơ bản

1. Tạo tài khoản hoặc đăng nhập.
2. Tạo project và mở trang chi tiết project.
3. Thêm thành viên hoặc gửi lời mời vào project.
4. Tạo task với status, priority, deadline và labels.
5. Manager chọn assignee cho task; người được giao sẽ thấy thông tin task và nhận notification khi có sự kiện phù hợp.

## API và dữ liệu chính

| Resource | Dữ liệu quan trọng |
| --- | --- |
| Project | Tên, mô tả, trạng thái, độ ưu tiên, ngày bắt đầu/kết thúc. |
| Project member | User, project và vai trò `MANAGER` hoặc `MEMBER`. |
| Task | Tiêu đề, mô tả, status, priority, due date, `assigneeId` và labels. |
| Label | Tên và màu; có thể gắn vào nhiều task trong cùng project. |
| Notification | Loại notification, tiêu đề/nội dung và entity liên quan. |

Tài liệu endpoint đầy đủ nằm tại [Backend README](backend/README.md).

## Kiểm tra chất lượng

Chạy tại từng thư mục ứng dụng:

```bash
# backend/
npm run lint:check
npm run test
npm run build

# frontend/
npm run lint
npx tsc --noEmit
npm run build
```

## Tài liệu chi tiết

- [Backend README](backend/README.md): API, biến môi trường, migrations và scripts.
- [Frontend README](frontend/README.md): cấu hình web app, cấu trúc UI và scripts.

## Production

Tạo root `.env` từ `.env.example`, thay `POSTGRES_PASSWORD` bằng mật khẩu mạnh và bảo đảm `backend/.env` dùng cùng `DB_PASSWORD`.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Không commit `.env`, `.env.local`, credentials hoặc secret production.

## Khắc phục lỗi thường gặp

| Vấn đề | Cách kiểm tra |
| --- | --- |
| Frontend không gọi được API | Kiểm tra `NEXT_PUBLIC_API_URL` trong `frontend/.env.local` và backend đang chạy ở port 3000. |
| Backend không kết nối database/Redis | Kiểm tra `backend/.env`, trạng thái container bằng `docker compose ps` và logs bằng `docker compose logs -f`. |
| Migration thất bại | Kiểm tra thông số PostgreSQL rồi chạy lại `npm run migration:run` trong `backend/`. |
| Không nhận notification | Đăng nhập lại, kiểm tra kết nối Socket.IO tới backend và đảm bảo notification thuộc đúng user. |
