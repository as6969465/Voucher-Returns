// Firebase 初始化（CDN ESM 版本，無需打包工具）
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8lIcD80FpUY3iUCzSZW_vBQKTrmQKPBA",
  authDomain: "voucher-returns.firebaseapp.com",
  projectId: "voucher-returns",
  storageBucket: "voucher-returns.firebasestorage.app",
  messagingSenderId: "104553695404",
  appId: "1:104553695404:web:41f2c9a5ec4b8c44c6b709",
};

export const app = initializeApp(firebaseConfig);
// 即時歸組模式的共用資料存放於 Firestore，讓多人同時刷入時彼此可即時同步看到結果。
// 開啟本機（IndexedDB）持久化快取：同一台裝置重整/重開分頁時，Firestore 會優先用本機快取
// 服務讀取請求、只跟伺服器同步異動的部分，降低 Spark 免費方案的讀取用量，不影響跨裝置的即時同步。
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
