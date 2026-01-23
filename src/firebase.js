import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCmoiIKec5NIDYzyY_TqwXgjbI_pu4WUy8",
  authDomain: "patrick-masajes.firebaseapp.com",
  projectId: "patrick-masajes",
  storageBucket: "patrick-masajes.firebasestorage.app",
  messagingSenderId: "148332805394",
  appId: "1:148332805394:web:5c3307241ed2fb5af2c7cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, doc, setDoc, onSnapshot, deleteDoc };
