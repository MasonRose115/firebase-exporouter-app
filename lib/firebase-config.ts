/**
 * Firebase configuration and initialization module.
 * This module handles the setup of Firebase services for the application.
 * @module
 */
import { initializeApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Firebase configuration object containing necessary credentials and endpoints
 * @type {Object}
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ============================================================================
// Firebase Initialization
// ============================================================================

/**
 * Initialize Firebase application instance
 * @type {FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase Authentication service with a safe fallback.
 * On web we use the standard getAuth(). On native, attempt to use
 * getReactNativePersistence(AsyncStorage) if available; otherwise
 * fall back to initializeAuth without custom persistence.
 */
let auth: any;
if (Platform.OS === 'web') {
  // Web: use the standard JS SDK auth
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  try {
    // Try to load the RN persistence helper from known paths.
    // Use require to avoid static ESM import resolution problems in the bundler.
    // Try the distribution path first, then the main package.
    // @ts-ignore
    let getReactNativePersistence: any;
    try {
      // Common location used in some Firebase releases
      // @ts-ignore
      getReactNativePersistence = require('firebase/auth/dist/rn/persistence').getReactNativePersistence;
    } catch (err) {
      try {
        // Fallback to main export if present
        // @ts-ignore
        getReactNativePersistence = require('firebase/auth').getReactNativePersistence;
      } catch (err2) {
        getReactNativePersistence = undefined;
      }
    }

    if (typeof getReactNativePersistence === 'function') {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } else {
      console.warn('getReactNativePersistence not available; initializing auth without RN persistence');
      auth = initializeAuth(app);
    }
  } catch (e) {
    console.warn('Failed to initialize native Firebase auth with RN persistence, falling back:', e);
    try {
      auth = initializeAuth(app);
    } catch (err) {
      console.error('initializeAuth failed entirely:', err);
      // As a last resort, attempt getAuth
      try {
        // @ts-ignore
        const { getAuth } = require('firebase/auth');
        auth = getAuth(app);
      } catch (err2) {
        console.error('getAuth also failed:', err2);
        auth = null;
      }
    }
  }
}

/**
 * Initialize Firestore database
 * @type {Firestore}
 */
const db = getFirestore(app);

export { auth, db };
export default app;
