import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import {
  getFirestore,
  collection,
  collectionGroup,
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
  writeBatch,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

// Prevent duplicate Firebase initialization
export const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

// Firebase Auth
export const auth = getAuth(app);

// Firebase Storage
export const storage = getStorage(app);

// Firestore
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId
);

// Export Firestore helpers
export {
  collection,
  collectionGroup,
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
  writeBatch,
  serverTimestamp,
  onSnapshot
};