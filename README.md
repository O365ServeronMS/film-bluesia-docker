# film.bluesia.net

Bluesia Cinema là app xem phim cá nhân, mobile-first, chạy bằng Next.js App Router. App lấy metadata phim từ OPhim qua server proxy nội bộ, tối ưu/cache ảnh trên VPS, còn video/HLS vẫn phát trực tiếp từ nguồn ngoài về trình duyệt.

## Tính năng chính

- Trang chủ kiểu app mobile với thanh tìm kiếm, hero slider, các hàng phim và bottom navigation.
- Smart Spotlight cho banner trang chủ, chấm điểm phim từ dữ liệu phim và tín hiệu cục bộ như yêu thích/lịch sử xem.
- Danh sách phim theo nhóm: phim mới cập nhật, phim lẻ, phim bộ, TV show, hoạt hình, phim chiếu rạp.
- Bộ lọc nhanh theo quốc gia cho danh sách hỗ trợ lọc, hiện có Âu Mỹ và Hàn Quốc.
- Tab phim lẻ có thêm lọc phim chiếu rạp.
- Tìm kiếm phim đầy đủ tại `/search`.
- Gợi ý kết quả khi đang gõ tìm kiếm:
  - bắt đầu từ 2 ký tự,
  - debounce 280ms,
  - giới hạn 6 gợi ý,
  - click gợi ý mở thẳng trang chi tiết phim,
  - Enter mở trang kết quả tìm kiếm đầy đủ.
- Trang chi tiết phim với poster, thông tin phim, tập phim, yêu thích và nút xem.
- Trang xem phim:
  - ưu tiên `link_embed`,
  - fallback sang `link_m3u8` bằng HLS.js khi cần.
- Yêu thích và lịch sử xem lưu cục bộ bằng `localStorage` trên từng trình duyệt.
- Trang cài đặt hiển thị nguồn dữ liệu, trạng thái cache và khuyến nghị vận hành.
- PWA manifest, favicon và app icon riêng cho film.bluesia.net.

## Kiến trúc dữ liệu

Metadata phim đi qua các route proxy nội bộ:

```text
/api/ophim/home
/api/ophim/list/[type]
/api/ophim/movie/[slug]
/api/ophim/search
/api/ophim/categories
/api/ophim/countries
```

Nguồn mặc định:

```text
OPHIM_BASE_URL=https://ophim1.com
```

App không proxy/cache video. Các file video, HLS, m3u8, ts, m4s, mp4 vẫn đi trực tiếp từ nguồn phát tới trình duyệt.

## Cache và tối ưu ảnh

Cache dùng filesystem volume Docker, giới hạn tổng dung lượng 8GB.

Thiết lập chính trong `compose.yaml`:

```text
BLUESIA_CACHE_DIR=/cache/bluesia
BLUESIA_CACHE_MAX_BYTES=8589934592

BLUESIA_IMAGE_CACHE_TTL_SECONDS=1296000
BLUESIA_IMAGE_WEBP_QUALITY=70
BLUESIA_IMAGE_MAX_WIDTH=720

BLUESIA_DETAIL_CACHE_TTL_SECONDS=1296000
BLUESIA_TAXONOMY_CACHE_TTL_SECONDS=1296000
BLUESIA_LIST_CACHE_TTL_SECONDS=1800
BLUESIA_SEARCH_CACHE_TTL_SECONDS=1800
```

Ý nghĩa:

```text
Ảnh poster/thumb: cache 15 ngày, chuyển WebP quality 70, giới hạn rộng tối đa 720px
Chi tiết phim: 15 ngày
Thể loại/quốc gia: 15 ngày
Danh sách phim: 30 phút
Tìm kiếm/autocomplete: 30 phút
Tổng cache ảnh + metadata JSON: 8GB
```

Endpoint kiểm tra cache:

```text
/api/cache/status
```

## Cache warmer

Stack có service `bluesia-cache-warmer` gọi warmup mỗi 30 phút:

```text
WARMUP_URL=http://bluesia-app:3000/api/cache/warmup
WARMUP_INTERVAL_SECONDS=1800
```

Warmup mặc định:

```text
BLUESIA_CACHE_WARMUP_TYPES=phim-le,phim-bo
BLUESIA_CACHE_WARMUP_PAGES=10
BLUESIA_CACHE_WARMUP_LIMIT=30
BLUESIA_CACHE_WARMUP_IMAGE_CONCURRENCY=6
BLUESIA_CACHE_WARMUP_HTML=1
BLUESIA_CACHE_WARMUP_HTML_CONCURRENCY=2
```

Route warmup chỉ cho phép request nội bộ Docker/localhost hoặc token hợp lệ nếu cấu hình `BLUESIA_CACHE_WARMUP_TOKEN`.

## Chạy local

```bash
npm install
npm run dev
```

Mở:

```text
http://localhost:3000
```

## Chạy bằng Docker/Dockge trên VPS

Stack mặc định expose app trên loopback:

```text
127.0.0.1:3030 -> container 3000
```

Giới hạn tài nguyên hiện tại:

```text
mem_limit: 3g
cpus: "2.0"
```

Build và chạy:

```bash
docker compose up -d --build
```

Recreate sau khi build image:

```bash
docker compose up -d --force-recreate bluesia-app bluesia-cache-warmer
```

Caddy reverse proxy khuyến nghị:

```caddy
film.bluesia.net {
    encode gzip
    reverse_proxy 127.0.0.1:3030
}
```

## Kiểm tra vận hành

Build production:

```bash
docker compose build bluesia-app
```

Health/container:

```bash
docker ps --filter name=bluesia
```

Trang chủ:

```bash
curl -fsS http://127.0.0.1:3030/ >/dev/null && echo home_ok
```

API tìm kiếm:

```bash
curl -fsS 'http://127.0.0.1:3030/api/ophim/search?keyword=batman&limit=6'
```

Cache status:

```bash
curl -s http://127.0.0.1:3030/api/cache/status | python3 -m json.tool
```

## Cấu trúc chính

```text
app/
  api/cache/status      Kiểm tra cache VPS
  api/cache/warmup      Warm cache định kỳ từ Docker network
  api/image             Proxy/cache ảnh poster/thumb
  api/ophim/*           Server proxy tới OPhim metadata
  favorites             Danh sách yêu thích từ localStorage
  history               Lịch sử xem từ localStorage
  list/[type]           Danh sách phim
  movie/[slug]          Chi tiết phim
  search                Trang tìm kiếm
  watch/[slug]          Xem phim

components/
  SearchSuggest.tsx     Autocomplete tìm kiếm
  HeroSlider.tsx        Spotlight trang chủ
  MovieCard.tsx         Card phim
  HlsVideo.tsx          HLS.js player fallback
  LocalMovieActions.tsx Yêu thích/lưu cục bộ
  WatchRecorder.tsx     Ghi lịch sử xem

lib/
  cache.ts              Cache manager, TTL, prune theo dung lượng
  ophim.ts              Adapter/normalizer dữ liệu OPhim
  spotlight.ts          Smart Spotlight scoring
  utils.ts              Helper UI/data
```

## Ghi chú Git

Không commit cache, build output, backup, file tạm hoặc env local. Các nhóm này được loại bằng `.gitignore`.
