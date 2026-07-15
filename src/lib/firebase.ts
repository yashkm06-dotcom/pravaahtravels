import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { 
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Use custom firestore database ID from the config (ai-studio-pravaahtravels-e139cba2-4b0b-4550-a190-1ca3520d6d45)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Export standard firestore methods directly so components use them natively
export {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  setDoc,
  writeBatch
};
