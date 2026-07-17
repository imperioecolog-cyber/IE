import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  Auth 
} from 'firebase/auth';

let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;
let isSigningIn = false;
let cachedAccessToken: string | null = sessionStorage.getItem("SISTEMA_LOGISTICA_OAUTH_TOKEN");

// Dynamically fetch Firebase configuration from our server
export async function fetchFirebaseConfig() {
  const response = await fetch('/api/firebase-config');
  if (!response.ok) {
    throw new Error('Failed to load Firebase configuration from server');
  }
  return response.json();
}

// Initialize Auth
export async function initAuthInstance() {
  if (auth) return auth;

  const config = await fetchFirebaseConfig();
  const app = initializeApp(config);
  auth = getAuth(app);
  
  provider = new GoogleAuthProvider();
  // Request required scopes
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  
  return auth;
}

export const initAuth = async (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const authInstance = await initAuthInstance();
  return onAuthStateChanged(authInstance, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const authInstance = await initAuthInstance();
    if (!provider) {
      provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
    }
    const result = await signInWithPopup(authInstance, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem("SISTEMA_LOGISTICA_OAUTH_TOKEN", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (!auth) return;
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem("SISTEMA_LOGISTICA_OAUTH_TOKEN");
};
