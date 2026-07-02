# TIENSON SALEHUB V1

Ung dung desktop quan ly quy trinh don hang va xuat kho theo luong can xe vao/ra, duoc trien khai theo kien truc Runtime huong Build va phu hop phat hanh production tren Windows.

## Kien truc Runtime

- Desktop shell: Electron
- Giao dien: React + Vite + CSS
- Dich vu local: Node.js + Express
- Du lieu cuc bo: SQLite qua better-sqlite3
- State UI: Zustand

### Luong runtime

1. Electron Main khoi tao runtime, chon thu muc SQLite.
2. Main process migrate schema va seed tai khoan mac dinh.
3. Express API local khoi dong tren localhost:3977.
4. Renderer giao tiep voi Main qua IPC preload bridge.
5. Moi du lieu don hang, tai khoan, su kien luong duoc ghi vao SQLite.

## Mo hinh Boss ↔ Nhan vien

- Role boss:
  - Tao tai khoan moi
  - Xem toan bo danh sach tai khoan
  - Dieu phoi va chuyen trang thai don
- Role employee:
  - Dang nhap va thao tac nghiep vu don hang theo quyen duoc cap

Tai khoan seed:
- boss / boss123
- nhanvien / nv123

## 4) Da tai khoan & Luu tru

- Ho tro nhieu tai khoan trong bang accounts.
- Co the doi thu muc luu tru SQLite trong man hinh Runtime & Data.
- Cau hinh thu muc duoc luu trong runtime-config.json tai userData cua Electron.

## Du lieu cuc bo

- DB file mac dinh: Documents/TIENSON_SALEHUB_DATA/salehub.db
- Co the chuyen sang thu muc bat ky tu man hinh Cai dat.
- Schema gom:
  - accounts
  - orders
  - workflow_events
  - app_settings

## So do kien truc & luong hoat dong

Ung dung mo phong luong nghiep vu theo cac lane:
- Phong ke toan
- Lai xe
- Thu kho
- Bao ve
- Phong tong hop

Trang thai don hang chinh:
- PENDING_ACCOUNTING
- DRIVER_GATE_IN
- WAREHOUSE_VERIFIED
- SECURITY_CHECKED
- COMPLETED

## Cong nghe & ngon ngu su dung

- Ngon ngu: TypeScript, JavaScript, SQL, HTML, CSS
- Desktop app: Electron, React, Vite
- UI + State: Zustand, React Router
- Local storage: SQLite via better-sqlite3
- Local backend service: Node.js + Express
- Tich hop mo rong san sang: Axios, Google APIs/Sheets, cron jobs, bot channels

## Chay local

```bash
npm install
npm run dev
```

## Build Release Windows (.exe)

```bash
npm run dist:win
```

Artifact duoc tao trong thu muc release.

## Phat hanh GitHub Release

Workflow: .github/workflows/release-win.yml

- Trigger bang workflow_dispatch
- Input version theo SemVer, vi du: v1.0.0
- Workflow se:
  - Restore dependencies
  - Build Release
  - Package NSIS + Portable .exe
  - Tao tag
  - Tao GitHub Release
  - Upload release assets

## Metadata phat hanh

Da cau hinh trong package.json:
- Ten ung dung: TIENSON SALEHUB V1
- Version: Semantic Versioning
- Mo ta: desktop sales workflow app
- Cong ty: TIENSON
- Ban quyen: Copyright (c) 2026 TIENSON

## Build log

Khi build CI, toan bo log duoc ghi tai Action run logs tren GitHub.

## Ghi chu

Repo nay la khung production-ready dau tien de trien khai tiep tinh nang nang cao va ket noi cong nghe ben ngoai.
