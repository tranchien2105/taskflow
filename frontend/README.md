# Taskflow Frontend

Giao diện web của Taskflow, xây dựng bằng Next.js 16, React 19 và Tailwind CSS 4.

## Chức năng

- Đăng ký, đăng nhập và tự chuyển về trang đăng nhập khi phiên JWT hết hạn.
- Dashboard, danh sách project và trang chi tiết project.
- Tạo, cập nhật và xóa task; hiển thị trạng thái, độ ưu tiên, deadline, labels và người được giao.
- Quản lý thành viên, nhãn project và lời mời tham gia project.
- Hiển thị notification từ backend qua Socket.IO.

## Yêu cầu

- Node.js 22+
- Backend Taskflow đang chạy (mặc định tại `http://localhost:3000`)

## Cấu hình môi trường

Tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Đổi URL này khi backend chạy trên host hoặc port khác. Không commit `.env.local` nếu chứa thông tin riêng của môi trường deploy.

## Chạy local

```bash
npm ci
npm run dev
```

Mặc định ứng dụng chạy tại [http://localhost:3001](http://localhost:3001).

## Scripts

```bash
npm run dev      # Next.js development server, port 3001
npm run build    # Build production
npm run start    # Chạy bản production đã build
npm run lint     # Kiểm tra ESLint
npx tsc --noEmit # Kiểm tra TypeScript không tạo file build
```

## Cấu trúc chính

```text
app/                     # Routes: dashboard, login, projects
components/tasks/        # Danh sách task, labels và task detail modal
components/projects/     # Tạo task, members và project labels
contexts/AuthContext.tsx # Phiên người dùng phía client
lib/api.ts               # API client, tự gắn Bearer token
```

## Luồng xác thực

Sau khi đăng nhập, access token được lưu ở `localStorage`. `apiFetch` tự gửi token trong header `Authorization: Bearer <token>` và xóa token/chuyển đến `/login` khi server trả về `401`.
