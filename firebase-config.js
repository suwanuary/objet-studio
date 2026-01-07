// firebase-config.js
// Firebase v9 Modular SDK 설정

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase 프로젝트 설정 - Objet Studio
const firebaseConfig = {
    apiKey: "AIzaSyCGmCblH1cHzVZTx4BPtjEeMioG_wOx4F8",
    authDomain: "objet-studio.firebaseapp.com",
    projectId: "objet-studio",
    storageBucket: "objet-studio.firebasestorage.app",
    messagingSenderId: "307333439042",
    appId: "1:307333439042:web:5e074dd28e9093361b97db",
    measurementId: "G-5SVJ064RP2"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 인스턴스 생성 및 export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
