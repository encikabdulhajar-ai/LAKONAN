import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: The app requires specific databaseId (ai-studio-ad59865d-987d-403e-ac1c-b03d481b401a) to bind correctly
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-ad59865d-987d-403e-ac1c-b03d481b401a';
export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);
export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
GOOGLE_SHEETS_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// In-memory token cache (never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

// CRITICAL CONSTRAINT: Test connection at boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Please check connection.');
    }
    return false;
  }
}

// Initial boot connection test
testConnection();
