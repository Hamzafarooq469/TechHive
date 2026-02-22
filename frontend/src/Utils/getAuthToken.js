// utils/authToken.js
import { auth } from '../Services/Firebase';
import { store } from '../Redux/store';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Wait for Firebase auth to initialize with timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<User|null>} - Firebase user or null
 */
const waitForFirebaseAuth = (timeout = 5000) => {
  return new Promise((resolve) => {
    // If user is already loaded, return immediately
    if (auth.currentUser !== null) {
      resolve(auth.currentUser);
      return;
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      unsubscribe();
      resolve(null); // Return null if timeout
    }, timeout);

    // Wait for auth state to change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(user);
    });
  });
};

export const getAuthToken = async (forceRefresh = false) => {
  try {
    // 1. First check Redux (immediate, no waiting)
    const currentUser = store.getState().user.currentUser;
    const reduxToken = currentUser?.user?.token;
    // console.log("Token", reduxToken)

    // 2. Try Firebase (with reasonable timeout)
    const firebaseUser = await waitForFirebaseAuth(3000); // Wait max 3 seconds
    
    if (firebaseUser) {
      console.log('Using Firebase token');
      return await firebaseUser.getIdToken(forceRefresh);
    }
    
    // 3. Fallback to Redux if Firebase not ready
    if (reduxToken) {
      console.log('Firebase not ready, using Redux token');
      return reduxToken;
    }
    
    throw new Error("No authentication found - user not logged in");
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

export const getAdminToken = async () => {
  try {
    // For admin routes, try Firebase first but don't fail completely
    const firebaseUser = await waitForFirebaseAuth(3000);
    
    if (firebaseUser) {
      console.log('Using fresh Firebase token for admin');
      return await firebaseUser.getIdToken(true); // Always fresh for admin
    }
    
    // If Firebase not available, use Redux but warn
    const currentUser = store.getState().user.currentUser;
    if (currentUser?.user?.token) {
      console.warn('Firebase not available, using Redux token for admin (less secure)');
      return currentUser.user.token;
    }
    
    throw new Error("Admin authentication failed - please login again");
  } catch (error) {
    throw new Error(`Admin authentication failed: ${error.message}`);
  }
};

export const getUserToken = async () => {
  return await getAuthToken(false);
};

// For cases where you definitely want Redux first (faster)
export const getTokenReduxFirst = async () => {
  try {
    // 1. Try Redux first (instant)
    const currentUser = store.getState().user.currentUser;
    if (currentUser?.user?.token) {
      console.log('Using Redux token (fast)');
      return currentUser.user.token;
    }
    
    // 2. Fallback to Firebase
    const firebaseUser = await waitForFirebaseAuth(3000);
    if (firebaseUser) {
      console.log('Redux empty, using Firebase token');
      return await firebaseUser.getIdToken(false);
    }
    
    throw new Error("No authentication found");
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// For debugging - check what tokens are available
export const debugTokens = async () => {
  const currentUser = store.getState().user.currentUser;
  const firebaseUser = await waitForFirebaseAuth(1000);
  
  console.log('=== TOKEN DEBUG ===');
  console.log('Redux user:', !!currentUser?.user?.token);
  console.log('Firebase user:', !!firebaseUser);
  console.log('Auth current user:', !!auth.currentUser);
};