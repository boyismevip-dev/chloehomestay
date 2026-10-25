# Chloe Homestay — Website giới thiệu phòng & dịch vụ

Website Node.js (Express + EJS) song ngữ Việt/Anh. Khách xem phòng, dịch vụ rồi **gọi hotline / nhắn Zalo để đặt phòng** — không có đặt phòng trực tiếp trên web.

## Chạy thử trên máy

```bash
npm install
npm start          # http://localhost:3000
```

## Sửa nội dung

| Cần sửa | File |
|---|---|
| Hotline, Zalo, địa chỉ, giờ nhận/trả phòng | `data/site.js` |
| Hạng phòng: giá, diện tích, mô tả, ảnh | `data/rooms.js` |
| Chữ giao diện (Việt/Anh) | `data/i18n.js` |
| Màu sắc (xanh rêu #083529), font SVN-Magnificent theo brand guideline, bố cục | `public/css/style.css` |

Ảnh phòng nằm ở `public/img/rooms/<tên-phòng>/`. Muốn thay ảnh gốc: chạy `npm run images` (đọc thư mục ảnh gốc, xuất WebP đã nén).

## Đưa lên GitHub

```bash
git init
git add .
git commit -m "Chloe Homestay website"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/chloe-homestay.git
git push -u origin main
```

## Deploy lên Hostinger (Node.js)

Cần gói hosting có **Node.js Web App** (Business Web Hosting trở lên, Cloud hoặc VPS).

1. hPanel → **Websites → Add Website → Node.js Apps → Import Git Repository**, kết nối GitHub và chọn repo `chloe-homestay`.
2. Cấu hình: Framework **Express**, Node 20 (hoặc 22), Install `npm install`, Start `npm start`, entry file `server.js`.
3. Thêm biến môi trường `SITE_URL=https://<tên-miền-của-bạn>`.
4. Deploy. Mỗi lần `git push` lên `main`, Hostinger có thể tự deploy lại (bật Auto-deploy / webhook).
5. Trỏ tên miền trong hPanel → **Domains**, bật SSL (Let's Encrypt) miễn phí.

Kiểm tra sức khỏe: `/healthz` trả về `ok`. Sitemap: `/sitemap.xml`.
