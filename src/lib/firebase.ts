import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore using the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export default app;
