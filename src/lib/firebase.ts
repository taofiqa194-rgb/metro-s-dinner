import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDhPGKC9j9tpHP_YIk_AyBePoNPPXzK1Qg",
  authDomain: "metro-s-diner.firebaseapp.com",
  projectId: "metro-s-diner",
  storageBucket: "metro-s-diner.firebasestorage.app",
  messagingSenderId: "712941497208",
  appId: "1:712941497208:web:e70274986ee4bcdfbc768d",
  measurementId: "G-8KSE9PKNNB"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { collection, addDoc, serverTimestamp };

// Optional connection check
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  }
}
