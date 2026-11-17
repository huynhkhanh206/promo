# Đưa PromoLab lên GitHub Pages

## File ZIP này đã chuẩn bị gì?
- `vite.config.ts` tự đặt `base` đúng theo tên repository trên GitHub Actions.
- `.github/workflows/deploy.yml` tự cài pnpm, build Vite và deploy thư mục `dist` lên GitHub Pages mỗi khi push lên nhánh `main`.
- Không thay đổi công thức hoặc tính năng của PromoLab.

## 1. Tạo repository GitHub
1. Vào https://github.com/new và đăng nhập.
2. Repository name: ví dụ `promolab`.
3. Chọn **Public** để dùng GitHub Pages miễn phí dễ nhất và để bạn bè truy cập.
4. Không chọn tạo README, .gitignore hay license vì project đã có sẵn các file này.
5. Bấm **Create repository**.

Lưu ý: repository Public nghĩa là mã nguồn cũng công khai. Không đưa mật khẩu, token hay file `.env` có bí mật lên GitHub.

## 2. Đưa mã nguồn vào repository
1. Giải nén `PromoLab_GitHub_Pages_Ready.zip` trên máy tính.
2. Mở repository GitHub vừa tạo.
3. Chọn **Add file > Upload files**.
4. Kéo các file và thư mục ở BÊN TRONG thư mục đã giải nén vào trang upload (không kéo nguyên thư mục cha).
5. Nếu giao diện upload không nhận thư mục ẩn `.github`, hãy tạo workflow riêng theo bước 3 bên dưới.
6. Bấm **Commit changes** và commit lên nhánh `main`.

## 3. Kiểm tra workflow deploy
Trong repository, vào tab **Code**. Mở file `.github/workflows/deploy.yml`.
- Nếu file đã có, tiếp tục bước 4.
- Nếu chưa có, chọn **Add file > Create new file**, đặt tên chính xác `.github/workflows/deploy.yml`, rồi dán nội dung workflow trong file ZIP này và Commit changes.

## 4. Bật GitHub Pages
1. Vào **Settings > Pages** của repository.
2. Trong **Build and deployment > Source**, chọn **GitHub Actions**.
3. Vào tab **Actions** để theo dõi workflow `Deploy PromoLab to GitHub Pages`.
4. Chờ workflow hoàn tất với dấu tích xanh.
5. Mở **Settings > Pages** hoặc phần `deploy` trong Actions để lấy URL.

Với repository tên `promolab`, URL thường có dạng:
`https://TEN-GITHUB-CUA-BAN.github.io/promolab/`

Nếu repository có tên chính xác là `TEN-GITHUB-CUA-BAN.github.io`, URL sẽ là:
`https://TEN-GITHUB-CUA-BAN.github.io/`

## 5. Cập nhật ứng dụng sau này
Mỗi lần cập nhật mã nguồn và commit/push lên nhánh `main`, GitHub Actions sẽ tự build và deploy lại. Không cần tải thủ công thư mục `dist`.

## Lưu ý về dữ liệu PromoLab
Phiên bản hiện tại lưu sản phẩm và kịch bản bằng `localStorage` của trình duyệt. Vì vậy:
- Mỗi bạn mở link sẽ có dữ liệu riêng trên trình duyệt của bạn ấy.
- Dữ liệu của các bạn không tự đồng bộ với nhau và bạn không xem được dữ liệu của họ.
- Dữ liệu không nằm trong repository GitHub và không được chia sẻ giữa các thiết bị.
- Nếu xóa dữ liệu trang web/trình duyệt hoặc đổi trình duyệt, dữ liệu local có thể mất.
- Nên giữ chức năng xuất/nhập JSON để sao lưu/chuyển dữ liệu.

Nếu muốn cả lớp dùng chung một bộ dữ liệu hoặc người quản lý xem được dữ liệu từng người, cần bổ sung backend/database (ví dụ Supabase), xác thực và chính sách bảo mật riêng. GitHub Pages chỉ host phần frontend tĩnh, không tự tạo backend.

## Khắc phục lỗi thường gặp
- **Workflow đỏ:** mở tab Actions, chọn lần chạy bị lỗi, mở bước màu đỏ và đọc log.
- **Trang hiện 404:** kiểm tra Settings > Pages đã chọn GitHub Actions chưa và workflow đã deploy thành công chưa.
- **Trang lên nhưng mất CSS/JS:** kiểm tra repository có commit `vite.config.ts` từ ZIP này và workflow build mới nhất đã chạy sau commit đó.
- **Cần chờ cập nhật:** sau một commit mới, chờ workflow chạy xong rồi tải lại trang bằng Ctrl+F5.
