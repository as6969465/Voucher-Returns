// Firebase 初始化（CDN ESM 版本，無需打包工具）
// TODO: IT 工程師如需使用 Firestore / Auth 等服務，請在此檔案新增對應 SDK import，
// 並從此檔案 export 對應的 instance（例如 export const db = getFirestore(app)）
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8lIcD80FpUY3iUCzSZW_vBQKTrmQKPBA",
  authDomain: "voucher-returns.firebaseapp.com",
  projectId: "voucher-returns",
  storageBucket: "voucher-returns.firebasestorage.app",
  messagingSenderId: "104553695404",
  appId: "1:104553695404:web:41f2c9a5ec4b8c44c6b709",
};

export const app = initializeApp(firebaseConfig);
