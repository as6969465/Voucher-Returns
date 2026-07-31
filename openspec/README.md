# 禮券退貨彙整平台（voucher-returns）

## 摘要

處理大量零散序號禮券退貨作業的工具，取代人工目視判斷連號。提供批次整理與即時掃描歸組兩種模式，輸出可直接貼入 Excel 的連號區間報表。

## 核心功能

- **即時歸組模式**：條碼槍逐筆刷入 → 依容忍值即時比對併入群組或開新群組 → 即時 Feedback Bar 提示
- **排序群組**：全部刷完後可依前綴 + 序號重新排序群組顯示順序（群組編號不變）
- **整理結果分頁**：將所有連號區段整理成一組一列（第一張序號 / 最後一張序號 / 張數），供人員核對實體禮券並勾選同步狀態
- **匯出**：整理結果可匯出 TSV（直貼 Excel）或直接匯出 `.xlsx` 檔案
- **登入驗證**：串接 FME AasApi CheckUserId（見 `openspec/api-interface.json`）

## 專案結構

```
voucher-returns/
├── index.html                登入頁（含 Demo 模式，正式串接見 script 內 TODO）
├── app.html                  主功能頁（即時歸組模式 + 整理結果）
├── script.js                  核心邏輯（parseSerial / groupSerials / findBestGroup 等）
├── style.css                  動畫與高亮樣式
├── firebase-config.js         Firebase Web SDK 初始化（CDN ESM 版本）
├── firebase.json / .firebaserc  Firebase Hosting 設定
├── .github/workflows/         GitHub Actions（push 到 main 自動部署 Firebase Hosting）
├── openspec/
│   ├── SDD.md                系統技術規格書
│   ├── README.md             本檔案
│   └── api-interface.json    前後端介接格式
└── db/migrations/
    ├── 001_schema.sql
    ├── 002_init.sql
    └── 003_seed.sql
```

## IT 快速導讀

1. `script.js` 內所有函式皆為純函式（無 DOM 依賴），可直接搬移至後端（Node.js）重用，或作為前端邏輯保留。
2. `index.html` 目前為 Demo 模式（任意帳密可登入），正式環境請依 `openspec/api-interface.json` 的 auth 規格串接 FME CheckUserId API，並移除 Demo 分支。
3. 資料庫採 PostgreSQL，schema 名稱固定為 `voucher_returns`，所有 migration 檔需依序執行（001 → 002 → 003）。
4. 目前前端未串接資料庫，序號解析與分組皆在瀏覽器端記憶體中運算；如需持久化，請依 `db/migrations` 資料表結構呼叫後端 API 寫入 `batches` / `serial_groups` / `serial_items`。

## 部署（Firebase Hosting + GitHub Actions）

1. 到 [Firebase Console](https://console.firebase.google.com/) 專案 `voucher-returns` → 專案設定 → 服務帳戶 → 產生新的私密金鑰（JSON）。
2. 到 GitHub repo `Settings > Secrets and variables > Actions`，新增 secret：
   - 名稱：`FIREBASE_SERVICE_ACCOUNT_VOUCHER_RETURNS`
   - 值：貼上上一步下載的 JSON 檔完整內容
3. push 到 `main` 分支後，`.github/workflows/firebase-hosting.yml` 會自動觸發部署到 Firebase Hosting。
4. 也可在本機安裝 `firebase-tools` 並登入後，於專案根目錄執行 `firebase deploy --only hosting` 手動部署。
