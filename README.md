# 🐋 ORCA FINANCIAL Dashboard

Dashboard tài chính fullstack — **Next.js + PostgreSQL + Drizzle ORM**.

Real-time data, auto-scan mỗi **1 giờ**, search, export PDF/PNG, responsive mobile+laptop.

---

## Chạy local

```bash
npm install
cp .env.example .env        # sửa DATABASE_URL
npx drizzle-kit push         # tạo bảng
npm run dev                  # http://localhost:3000
```

## Đưa lên GitHub

```bash
git init && git add . && git commit -m "init" && git branch -M main
git remote add origin https://github.com/YOU/YOUR-REPO.git
git push -u origin main
```

Hoặc mở **GitHub Desktop** → Add Existing Repo → Commit → Publish.

## Cập nhật sau này

```bash
git add . && git commit -m "update" && git push
```

---

## Tính năng

| Nhóm | Chi tiết |
|------|---------|
| **Nội dung** | Thị trường VN & quốc tế, vĩ mô, hàng hóa chi tiết, tin tức, ngành, kỹ thuật VNINDEX/VN30, chiến lược, watchlist cổ phiếu |
| **Real-time** | Client tự gọi API mỗi 1 giờ + khi focus tab. Server tự quét Yahoo Finance + Google News RSS nếu snapshot cũ > 50 phút |
| **Cron** | Route `/api/cron/hourly-update` — gọi bằng external cron hoặc trình duyệt |
| **Search** | Tìm theo từ khóa, mã cổ phiếu, ngày: `[thông tin] ngày dd/mm/yyyy` |
| **Export** | PDF / PNG — nền tối, chữ sáng, sắc nét |
| **Notification** | Web push khi có dữ liệu mới |
| **UI** | Responsive mobile + laptop, glass-card, dark theme |
| **DB** | Snapshot vào PostgreSQL, cleanup tự động > 45 ngày |

## API routes

```
/api/health                         — healthcheck
/api/dashboard                      — dữ liệu mới nhất
/api/dashboard?auto=1               — tự quét nếu snapshot cũ
/api/cron/hourly-update             — trigger scan (dùng cho cron)
/api/cron/hourly-update?force=1     — ép scan ngay
/api/cron/daily-task                — task tổng hợp theo ngày
```

## Env bắt buộc

```env
DATABASE_URL=postgresql://...
CRON_SECRET=your-secret
MIN_UPDATE_INTERVAL_MINUTES=50
```

## Cấu trúc file chính

```
src/app/page.tsx                    — trang chính
src/app/globals.css                 — theme / glass-card / animation
src/components/DashboardClient.tsx  — UI dashboard
src/components/SearchOverlay.tsx    — search overlay
src/lib/dashboard-data.ts           — dữ liệu nền / fallback
src/lib/dashboard-store.ts          — auto-scan / snapshot / DB
src/lib/search-index.ts             — search engine
src/lib/export-utils.ts             — PDF / PNG export
src/db/index.ts                     — PostgreSQL connection
src/db/schema.ts                    — Drizzle schema
```
