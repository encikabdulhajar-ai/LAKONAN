import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, googleProvider, db, setCachedAccessToken, getCachedAccessToken } from '../lib/firebase.ts';
import { UserProfile, UserRole } from '../types/index.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requestGoogleAccessToken: () => Promise<string>;
  getAccessToken: () => Promise<string | null>;
  updateProfile: (data: { name: string; institution?: string; educationLevel?: string }) => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isConsultant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_BOOTSTRAP_EMAIL = 'encikabdulhajar@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const path = `users/${user.uid}`;

        try {
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            // First time login: Create user profile
            const isBootstrapSuperAdmin = user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
            const initialRole: UserRole = isBootstrapSuperAdmin ? 'super_admin' : 'user';

            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'Peneliti LAKONAN',
              email: user.email || '',
              photoURL: user.photoURL || '',
              role: initialRole,
              institution: '',
              educationLevel: 'Mahasiswa Sarjana (S1)',
              createdAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          } else {
            const data = docSnap.data() as UserProfile;
            // Check if bootstrap email should be super_admin if not already
            if (
              user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase() &&
              data.role !== 'super_admin'
            ) {
              await updateDoc(userDocRef, { role: 'super_admin' });
              setUserProfile({ ...data, role: 'super_admin' });
            } else {
              setUserProfile(data);
            }
          }

          // Real-time listener for profile / role updates
          unsubscribeSnapshot = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                setUserProfile(snapshot.data() as UserProfile);
              }
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, path);
            }
          );
        } catch (error) {
          console.error('Error initializing user profile:', error);
          handleFirestoreError(error, OperationType.GET, path);
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error('Sign in with Google failed:', error);
      throw error;
    }
  };

  const requestGoogleAccessToken = async (): Promise<string> => {
    const existing = getCachedAccessToken();
    if (existing) return existing;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses Google Sheets dari Firebase Auth.');
      }
      setCachedAccessToken(credential.accessToken);
      return credential.accessToken;
    } catch (error) {
      console.error('Request Google access token error:', error);
      throw error;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    return getCachedAccessToken();
  };

  const signOut = async () => {
    try {
      setCachedAccessToken(null);
      await fbSignOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { name: string; institution?: string; educationLevel?: string }) => {
    if (!currentUser) throw new Error('Pengguna belum masuk.');

    const userDocRef = doc(db, 'users', currentUser.uid);
    const path = `users/${currentUser.uid}`;

    try {
      const updateData = {
        name: data.name.trim(),
        institution: data.institution?.trim() || '',
        educationLevel: data.educationLevel || '',
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userDocRef, updateData);
      setUserProfile((prev) => (prev ? { ...prev, ...updateData } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Cascading permissions
  const isSuperAdmin =
    userProfile?.role === 'super_admin' ||
    currentUser?.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

  const isAdmin = isSuperAdmin || userProfile?.role === 'admin';
  const isConsultant = isAdmin || userProfile?.role === 'consultant';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        requestGoogleAccessToken,
        getAccessToken,
        updateProfile,
        isSuperAdmin,
        isAdmin,
        isConsultant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
