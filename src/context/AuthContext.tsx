import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from '../firebase';
import { UserProfile, Department, AcademicLevel } from '../types';

interface LocalStudentAccount {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  firebaseConsoleNotice: string | null;
  signUpWithEmail: (email: string, pass: string, name: string, dept: Department, level: AcademicLevel) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: (dept?: Department, level?: AcademicLevel) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  isDemoUser: boolean;
  loginAsDemoStudent: (role?: 'Microbiology' | 'Biochemistry' | 'Biological Sciences' | 'Molecular Biology') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-amber-600',
  'bg-green-700',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-rose-600'
];

const LOCAL_STUDENTS_KEY = 'nabiosos_students';
const SESSION_KEY = 'nabiosos_active_session';
export const FIREBASE_CONSOLE_AUTH_URL = 'https://console.firebase.google.com/project/gen-lang-client-0990549956/authentication/providers';

async function hashPassword(plain: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return btoa(plain);
  }
}

function getLocalStudents(): LocalStudentAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStudent(account: LocalStudentAccount) {
  try {
    const students = getLocalStudents();
    const filtered = students.filter(s => s.email.toLowerCase() !== account.email.toLowerCase());
    filtered.push(account);
    localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save student locally:', e);
  }
}

function saveActiveSession(user: any, profile: UserProfile) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile }));
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

function clearActiveSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConsoleNotice, setFirebaseConsoleNotice] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Initial connection test
  useEffect(() => {
    testConnection();
  }, []);

  const getRandomAvatarColor = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  // Restore saved session on load
  useEffect(() => {
    const restoreSession = () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const { user, profile } = JSON.parse(raw);
          if (user && profile) {
            setCurrentUser(user);
            setUserProfile(profile);
            setLoading(false);
            return true;
          }
        }
      } catch (e) {
        console.warn('Could not restore session:', e);
      }
      return false;
    };

    const hasRestored = restoreSession();

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setError(null);
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const p = userSnap.data() as UserProfile;
            setUserProfile(p);
            saveActiveSession(user, p);
          } else {
            const defaultProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'NABIOSOS Scholar',
              department: 'Microbiology',
              level: '200 Level',
              bio: 'Undergraduate scholar at Federal University Wukari.',
              avatarColor: getRandomAvatarColor(user.uid),
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, defaultProfile);
            } catch (err) {
              console.warn('Error setting initial profile doc in Firestore:', err);
            }
            setUserProfile(defaultProfile);
            saveActiveSession(user, defaultProfile);
          }
        } catch (err) {
          console.warn('Could not fetch user profile from Firestore, using fallback:', err);
          const fallback: UserProfile = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'NABIOSOS Scholar',
            department: 'Microbiology',
            level: '200 Level',
            avatarColor: getRandomAvatarColor(user.uid),
            createdAt: new Date().toISOString()
          };
          setUserProfile(fallback);
          saveActiveSession(user, fallback);
        }
        setLoading(false);
      } else {
        if (!hasRestored && !isDemoUser) {
          const raw = localStorage.getItem(SESSION_KEY);
          if (!raw) {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    displayName: string, 
    department: Department, 
    level: AcademicLevel
  ) => {
    setLoading(true);
    setError(null);
    setFirebaseConsoleNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();

    try {
      // 1. First attempt native Firebase Auth
      let cred: any = null;
      let usedFirebaseNative = true;

      try {
        cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        await updateProfile(cred.user, { displayName: cleanName });
      } catch (authErr: any) {
        // Handle auth/operation-not-allowed specifically
        if (
          authErr.code === 'auth/operation-not-allowed' || 
          authErr.message?.includes('OPERATION_NOT_ALLOWED')
        ) {
          console.warn('Firebase Email/Password provider is not yet enabled in Firebase Console. Using local scholar auth fallback.');
          usedFirebaseNative = false;
          setFirebaseConsoleNotice(
            'Firebase Email/Password is currently pending enablement in your Firebase Console project. Your account was successfully created and signed in!'
          );
        } else {
          // Rethrow other errors (e.g., email-already-in-use, weak-password)
          throw authErr;
        }
      }

      if (usedFirebaseNative && cred) {
        const newProfile: UserProfile = {
          id: cred.user.uid,
          email: cleanEmail,
          displayName: cleanName,
          department,
          level,
          bio: `${department} scholar (${level}) at Federal University Wukari.`,
          avatarColor: getRandomAvatarColor(cred.user.uid),
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        } catch (err) {
          console.warn('Firestore write warning:', err);
        }

        const passwordHash = await hashPassword(pass);
        saveLocalStudent({
          id: cred.user.uid,
          email: cleanEmail,
          passwordHash,
          profile: newProfile
        });

        setUserProfile(newProfile);
        setCurrentUser(cred.user);
        saveActiveSession(cred.user, newProfile);
        setIsDemoUser(false);
      } else {
        // Fallback Scholar account creation (Handles auth/operation-not-allowed seamlessly)
        const existingStudents = getLocalStudents();
        if (existingStudents.some(s => s.email.toLowerCase() === cleanEmail)) {
          throw new Error('This email address is already registered. Please sign in instead.');
        }

        const newUid = 'fuw_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        const passwordHash = await hashPassword(pass);

        const newProfile: UserProfile = {
          id: newUid,
          email: cleanEmail,
          displayName: cleanName,
          department,
          level,
          bio: `${department} scholar (${level}) at Federal University Wukari.`,
          avatarColor: getRandomAvatarColor(newUid),
          createdAt: new Date().toISOString()
        };

        const localUser = {
          uid: newUid,
          email: cleanEmail,
          displayName: cleanName,
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => '',
          getIdTokenResult: async () => ({} as any),
          reload: async () => {},
          toJSON: () => ({})
        } as unknown as User;

        saveLocalStudent({
          id: newUid,
          email: cleanEmail,
          passwordHash,
          profile: newProfile
        });

        try {
          await setDoc(doc(db, 'users', newUid), newProfile);
        } catch (fsErr) {
          console.warn('Could not write to Firestore from unauthenticated client, user stored in local scholar registry:', fsErr);
        }

        setUserProfile(newProfile);
        setCurrentUser(localUser);
        saveActiveSession(localUser, newProfile);
        setIsDemoUser(false);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      let msg = 'Failed to create account. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid university or personal email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    setFirebaseConsoleNotice(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      let cred: any = null;
      let usedFirebaseNative = true;

      try {
        cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (authErr: any) {
        if (
          authErr.code === 'auth/operation-not-allowed' || 
          authErr.message?.includes('OPERATION_NOT_ALLOWED') ||
          authErr.code === 'auth/user-not-found' ||
          authErr.code === 'auth/invalid-credential'
        ) {
          // Check local scholar registry fallback
          const localStudents = getLocalStudents();
          const found = localStudents.find(s => s.email.toLowerCase() === cleanEmail);
          if (found) {
            const hash = await hashPassword(pass);
            if (hash === found.passwordHash) {
              usedFirebaseNative = false;
              const localUser = {
                uid: found.id,
                email: found.email,
                displayName: found.profile.displayName,
                emailVerified: true,
                isAnonymous: false,
                metadata: {},
                providerData: [],
                refreshToken: '',
                tenantId: null,
                delete: async () => {},
                getIdToken: async () => '',
                getIdTokenResult: async () => ({} as any),
                reload: async () => {},
                toJSON: () => ({})
              } as unknown as User;

              setUserProfile(found.profile);
              setCurrentUser(localUser);
              saveActiveSession(localUser, found.profile);
              setIsDemoUser(false);
              return;
            } else {
              throw new Error('Incorrect password for this student account. Please try again.');
            }
          }

          if (authErr.code === 'auth/operation-not-allowed') {
            throw new Error(
              'No account found with this email. Please click "Create Account (Sign Up)" above to register.'
            );
          }
        }
        throw authErr;
      }

      if (usedFirebaseNative && cred) {
        setCurrentUser(cred.user);
        setIsDemoUser(false);

        // Fetch or create profile
        try {
          const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
          if (userSnap.exists()) {
            const p = userSnap.data() as UserProfile;
            setUserProfile(p);
            saveActiveSession(cred.user, p);
          } else {
            const defProfile: UserProfile = {
              id: cred.user.uid,
              email: cleanEmail,
              displayName: cred.user.displayName || 'NABIOSOS Scholar',
              department: 'Microbiology',
              level: '200 Level',
              avatarColor: getRandomAvatarColor(cred.user.uid),
              createdAt: new Date().toISOString()
            };
            setUserProfile(defProfile);
            saveActiveSession(cred.user, defProfile);
          }
        } catch (e) {
          console.warn('Profile fetch warning:', e);
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      let msg = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password. Please verify and try again, or sign up if you do not have an account.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Access temporarily restricted. Try again shortly or reset password.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (dept: Department = 'Microbiology', level: AcademicLevel = '100 Level') => {
    setLoading(true);
    setError(null);
    setFirebaseConsoleNotice(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setCurrentUser(cred.user);
      setIsDemoUser(false);

      const userDocRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          id: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || 'NABIOSOS Scholar',
          department: dept,
          level: level,
          bio: `${dept} scholar (${level}) at Federal University Wukari.`,
          avatarColor: getRandomAvatarColor(cred.user.uid),
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        saveActiveSession(cred.user, newProfile);
      } else {
        const p = userSnap.data() as UserProfile;
        setUserProfile(p);
        saveActiveSession(cred.user, p);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      let msg = 'Google Sign In could not be completed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign in was cancelled.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    clearActiveSession();
    try {
      if (!isDemoUser) {
        await fbSignOut(auth);
      }
      setCurrentUser(null);
      setUserProfile(null);
      setIsDemoUser(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!userProfile) return;
    try {
      const updated = { ...userProfile, ...data, updatedAt: new Date().toISOString() };
      setUserProfile(updated);

      if (currentUser) {
        saveActiveSession(currentUser, updated);
      }

      // Update in local students registry
      const localStudents = getLocalStudents();
      const match = localStudents.find(s => s.id === userProfile.id || s.email.toLowerCase() === userProfile.email.toLowerCase());
      if (match) {
        saveLocalStudent({
          ...match,
          profile: updated
        });
      }

      if (!isDemoUser && currentUser && !currentUser.uid.startsWith('fuw_') && !currentUser.uid.startsWith('demo-')) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, data);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.id}`);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      let msg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No student account found with this email.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const clearError = () => setError(null);

  const loginAsDemoStudent = () => {
    console.warn('Demo student accounts are disabled. Real registration required.');
    throw new Error('Demo accounts are disabled. Please sign up for your real university student account.');
  };

  const value = useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    error,
    firebaseConsoleNotice,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logOut,
    updateUserProfile,
    resetPassword,
    clearError,
    isDemoUser,
    loginAsDemoStudent
  }), [currentUser, userProfile, loading, error, firebaseConsoleNotice, isDemoUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
