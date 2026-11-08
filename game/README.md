# Nhà Hàng Vui Vẻ — game quản lý nhà hàng 2.5D isometric

Game chạy trên trình duyệt (máy tính và điện thoại). Vite + TypeScript + Phaser 3 (đồ họa/AI) + React (popup, thanh công cụ).
Toàn bộ đồ họa (nội thất, nhân vật, món ăn, sàn, tường) được vẽ bằng Canvas trong code, không dùng file ảnh ngoài.

## Chạy game

```bash
cd game
npm install
npm run dev        # http://localhost:5173
# hoặc bản build:
npm run build && npm run preview
```

## Cách chơi

- Khách tự đến, ngồi, gọi món, chờ, ăn, thanh toán rồi về. Bấm vào khách/nhân viên để xem thông tin.
- **Nhân viên**: phục vụ ghi order → bếp → đầu bếp nấu (cần bếp + nguyên liệu) → phục vụ mang món → dọn bàn; thu ngân tính tiền ở quầy.
- **BUILD**: chọn đồ trong kho/cửa hàng, kéo thả lên lưới (xanh = hợp lệ, đỏ = không hợp lệ), xoay, cất, bán. Chạm vào đồ đã đặt để chọn, kéo để di chuyển. Tranh/đồng hồ/đèn treo kéo sát tường. Ghế đặt cạnh bàn sẽ tự quay mặt vào bàn.
- **SHOP**: nội thất, sàn/tường/cửa, nguyên liệu (kho +40 mỗi tủ lạnh), công thức món, mở rộng nhà hàng, đổi kim cương.
- **MENU / STAFF / QUEST / COLLECT / FRIENDS**, nút thống kê và cài đặt ở thanh trên.
- Điều khiển: kéo để di chuyển camera, cuộn chuột hoặc chụm hai ngón để thu phóng. Phím `R` xoay, `Esc` hủy, `Delete` bán. Nút ×2/×3 ở thanh trên để tăng tốc game.

## Lưu dữ liệu

Tự lưu mỗi 8 giây vào LocalStorage (`nhahang-vuive-save-v1`), có nút Lưu/Xuất/Nhập/Reset trong Cài đặt.
`src/systems/save.ts` định nghĩa interface `SaveRepository`: sau này thay `LocalStorageRepository` bằng bản gọi API server (tài khoản, đồng bộ) mà không phải sửa game.

## Cấu trúc

```
src/
  core/      bus (sự kiện Phaser<->React), state (dữ liệu lưu + store), iso (toán isometric), astar (tìm đường)
  data/      catalog (nội thất, kiểu sàn/tường/cửa, mức mở rộng), dishes, quests, names
  systems/   actions (kinh tế, kho, nhân viên, nhiệm vụ), save, audio (WebAudio synth + nhạc nền)
  art/       draw (bộ vẽ khối isometric), furniture, characters, food, room (sàn/tường), bubbles
  game/      GameScene (camera, input, chế độ xây dựng), Layout (lưới, ghế, bếp), Restaurant (điều phối),
             Customer + Staff (máy trạng thái), Actor (di chuyển A*, sprite)
  ui/        App, Modal, panels/* (React)
```

Máy trạng thái khách: ARRIVING → ENTERING → FINDING_TABLE → SITTING → ORDERING → WAITING_FOOD → EATING → PAYING → LEAVING.
Phục vụ: IDLE → GO_ORDER → RECEIVING_ORDER → MOVING_TO_KITCHEN, hoặc GO_PICKUP → PICKING_FOOD → MOVING_TO_CUSTOMER → SERVING, hoặc GO_CLEAN → CLEANING_TABLE.
Đầu bếp: IDLE → MOVING_TO_STOVE → COOKING. Thu ngân: IDLE → PROCESSING.

## Giới hạn hiện tại

- Mục FRIENDS dùng hàng xóm giả lập (chưa có máy chủ/tài khoản).
- Texture vẽ ở độ phân giải 1x nên hơi mềm trên màn hình retina khi phóng to.
- Nhân vật có 2 mặt (trước/sau) và lật ngang, chưa có 4 hướng riêng.
