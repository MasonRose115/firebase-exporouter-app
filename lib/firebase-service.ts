/**
 * Firebase authentication service module.
 * Provides methods for user authentication and session management.
 * @module
 */

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * User response structure from Firebase Authentication
 * @interface
 */
export interface FirebaseUserResponse {
  user: User;
}

/**
 * Location data structure for Firestore
 * @interface
 */
export interface LocationData {
  locationId: string;
  locationName: string;
  explanation: string;
  latitude: number;
  longitude: number;
  huntId: string;
  /** Optional time window when this location is active */
  availableFrom?: Timestamp | null;
  availableTo?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================================
// Hunts (Minimal) - Only fields requested: huntId, name, userId
// ============================================================================

export interface HuntData {
  huntId: string; // logical id (also used as Firestore doc id)
  name: string;
  userId: string; // owner/creator
}

// ============================================================================
// Player Hunts - Track per-user hunt status (e.g., COMPLETED)
// ============================================================================

export type PlayerHuntStatus = 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface PlayerHunts {
  huntId: string;
  playerHuntId: string; // `${userId}_${huntId}`
  status: PlayerHuntStatus;
  userId: string;
  huntName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
  startTime?: Timestamp; // optional explicit start time
}

// ----------------------------------------------------------------------------
// CheckIns - per user per location completion records
// ----------------------------------------------------------------------------
export interface CheckInData {
  checkInId?: string; // doc id
  userId: string;
  huntId: string;
  locationId: string;
  timeStamp?: Timestamp;
}

/** Create a check-in record for a location (idempotent per user/location). */
export async function addCheckIn(userId: string, huntId: string, locationId: string): Promise<void> {
  const qRef = query(
    collection(db, 'CheckIns'),
    where('userId', '==', userId),
    where('huntId', '==', huntId),
    where('locationId', '==', locationId)
  );
  const existing = await getDocs(qRef);
  if (!existing.empty) return; // already checked in
  await addDoc(collection(db, 'CheckIns'), {
    userId,
    huntId,
    locationId,
    timeStamp: Timestamp.now(),
  });
}

/** Delete all check-ins for a user & hunt (used when abandoning). */
export async function deleteUserCheckInsForHunt(userId: string, huntId: string): Promise<void> {
  const qRef = query(
    collection(db, 'CheckIns'),
    where('userId', '==', userId),
    where('huntId', '==', huntId)
  );
  const snap = await getDocs(qRef);
  const batchDeletes: Promise<void>[] = [];
  snap.forEach(d => batchDeletes.push(deleteDoc(doc(db, 'CheckIns', d.id))));
  await Promise.all(batchDeletes);
}

/** Fetch completion map and total counts for all locations in a hunt. */
export async function getCheckInSummaryForHunt(huntId: string, userId?: string): Promise<{ counts: Record<string, number>; userCompleted: Set<string>; total: number; }>{
  const qRef = query(collection(db, 'CheckIns'), where('huntId', '==', huntId));
  const snap = await getDocs(qRef);
  const counts: Record<string, number> = {};
  const userCompleted = new Set<string>();
  snap.forEach(d => {
    const data = d.data() as CheckInData;
    counts[data.locationId] = (counts[data.locationId] || 0) + 1;
    if (userId && data.userId === userId) userCompleted.add(data.locationId);
  });
  return { counts, userCompleted, total: snap.size };
}

/**
 * Creates a hunt document with the specified huntId as the Firestore doc id.
 * Stores only huntId, name, userId plus timestamps.
 */
export async function createHunt(huntId: string, name: string, userId: string): Promise<void> {
  try {
    const ref = doc(db, 'hunts', huntId);
    await setDoc(ref, {
      huntId,
      name,
      userId,
    });
  } catch (e) {
    console.error('Error creating hunt:', e);
    throw e;
  }
}

/** Get a single hunt by huntId (doc id). */
export async function getHuntById(huntId: string): Promise<HuntData | null> {
  try {
    const ref = doc(db, 'hunts', huntId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as HuntData;
  } catch (e) {
    console.error('Error fetching hunt:', e);
    throw e;
  }
}

/** Get all hunts for a given userId. */
export async function getHuntsByUser(userId: string): Promise<HuntData[]> {
  try {
    const qRef = query(collection(db, 'hunts'), where('userId', '==', userId));
    const snap = await getDocs(qRef);
    return snap.docs.map(d => d.data() as HuntData);
  } catch (e) {
    console.error('Error fetching user hunts:', e);
    throw e;
  }
}

/** Update only the name for a hunt. */
export async function updateHuntName(huntId: string, name: string): Promise<void> {
  try {
    const ref = doc(db, 'hunts', huntId);
    await updateDoc(ref, { name, updatedAt: Timestamp.now() });
  } catch (e) {
    console.error('Error updating hunt name:', e);
    throw e;
  }
}

/** Delete a hunt by huntId. */
export async function deleteHunt(huntId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'hunts', huntId));
  } catch (e) {
    console.error('Error deleting hunt:', e);
    throw e;
  }
}

// ----------------------------------------------------------------------------
// Player Hunts Firestore helpers
// ----------------------------------------------------------------------------

/**
 * Sets or updates the player's hunt status. Uses deterministic doc id `${userId}_${huntId}`.
 */
export async function setPlayerHuntStatus(
  userId: string,
  huntId: string,
  huntName: string | undefined,
  status: PlayerHuntStatus
): Promise<void> {
  try {
    const playerHuntId = `${userId}_${huntId}`;
    const ref = doc(db, 'PlayerHunts', playerHuntId);
    const existing = await getDoc(ref);
    const nowTs = Timestamp.now();
    const basePayload: Record<string, any> = {
      playerHuntId,
      userId,
      huntId,
      huntName: huntName ?? null,
      status,
      updatedAt: nowTs,
      ...(status === 'COMPLETED' ? { completedAt: nowTs } : {}),
      ...(status === 'STARTED' ? { startTime: nowTs } : {})
    };
    if (existing.exists()) {
      await updateDoc(ref, basePayload);
    } else {
      await setDoc(ref, { ...basePayload, createdAt: nowTs });
    }
  } catch (e) {
    console.error('Error setting player hunt status:', e);
    throw e;
  }
}

/** Get all player hunts for user with given status. */
export async function getPlayerHuntsByStatus(
  userId: string,
  status: PlayerHuntStatus
): Promise<PlayerHunts[]> {
  try {
    const qRef = query(
      collection(db, 'PlayerHunts'),
      where('userId', '==', userId),
      where('status', '==', status)
    );
    const snap = await getDocs(qRef);
    return snap.docs.map(d => d.data() as PlayerHunts);
  } catch (e) {
    console.error('Error fetching player hunts by status:', e);
    throw e;
  }
}

/** Convenience for completed hunts. */
export async function getCompletedPlayerHunts(userId: string): Promise<PlayerHunts[]> {
  return getPlayerHuntsByStatus(userId, 'COMPLETED');
}

/** Fetch a single player hunt status for user + hunt. */
export async function getPlayerHunt(userId: string, huntId: string): Promise<PlayerHunts | null> {
  try {
    const playerHuntId = `${userId}_${huntId}`;
    const ref = doc(db, 'PlayerHunts', playerHuntId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as PlayerHunts;
  } catch (e) {
    console.error('Error fetching player hunt record:', e);
    throw e;
  }
}

/** Abandon a player hunt: remove PlayerHunts record + user check-ins. */
export async function abandonPlayerHunt(userId: string, huntId: string): Promise<void> {
  try {
    const playerHuntId = `${userId}_${huntId}`;
    await deleteDoc(doc(db, 'PlayerHunts', playerHuntId));
    await deleteUserCheckInsForHunt(userId, huntId);
  } catch (e) {
    console.error('Error abandoning player hunt:', e);
    throw e;
  }
}

// ============================================================================
// Authentication Services
// ============================================================================

/**
 * Retrieves the current authenticated user and their session
 * Utilizes Firebase's onAuthStateChanged to provide real-time auth state
 * @returns {Promise<{ user: User | null }>} Current user object or null
 * @throws {Error} If there's an error accessing Firebase Auth
 */
export const getCurrentUser = async () => {
  try {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
        unsubscribe();
        resolve(user ? { user } : null);
      });
    });
  } catch (error) {
    console.error("[error getting user] ==>", error);
    return null;
  }
};

/**
 * Authenticates a user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<FirebaseUserResponse | undefined>} Authenticated user data
 * @throws {Error} If authentication fails
 */
export async function login(
  email: string, 
  password: string
): Promise<FirebaseUserResponse | undefined> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    return { user: userCredential.user };
  } catch (e) {
    console.error("[error logging in] ==>", e);
    throw e;
  }
}

/**
 * Logs out the current user by terminating their session
 * @returns {Promise<void>}
 * @throws {Error} If logout fails
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("[error logging out] ==>", e);
    throw e;
  }
}

/**
 * Creates a new user account and optionally sets their display name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} [name] - Optional user's display name
 * @returns {Promise<FirebaseUserResponse | undefined>} Created user data
 * @throws {Error} If registration fails
 */
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<FirebaseUserResponse | undefined> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    // Ensure a user record exists in `users` with the userId field
    await ensureUserDocument(userCredential.user.uid);
    return { user: userCredential.user };
  } catch (e) {
    console.error("[error registering] ==>", e);
    throw e;
  }
}

// ============================================================================
// Firestore Location Services
// ============================================================================

/**
 * Saves a new location to Firestore
 * @param {LocationData} locationData - The location data to save
 * @returns {Promise<string>} The document ID of the created location
 * @throws {Error} If saving fails
 */
export async function saveLocation(locationData: Omit<LocationData, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'locations'), {
      ...locationData,
      latitude: Number(locationData.latitude),
      longitude: Number(locationData.longitude),
      // Persist time window if provided
      availableFrom: locationData.availableFrom ?? null,
      availableTo: locationData.availableTo ?? null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('Location saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving location:', error);
    throw error;
  }
}

/**
 * Updates an existing location in Firestore
 * @param {string} docId - The document ID to update
 * @param {LocationData} locationData - The updated location data
 * @returns {Promise<void>}
 * @throws {Error} If updating fails
 */
export async function updateLocation(docId: string, locationData: Omit<LocationData, 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const locationRef = doc(db, 'locations', docId);
    await updateDoc(locationRef, {
      ...locationData,
      latitude: Number(locationData.latitude),
      longitude: Number(locationData.longitude),
      // Persist time window if provided
      ...(locationData.availableFrom !== undefined && {
        availableFrom: locationData.availableFrom ?? null,
      }),
      ...(locationData.availableTo !== undefined && {
        availableTo: locationData.availableTo ?? null,
      }),
      updatedAt: Timestamp.now()
    });
    console.log('Location updated with ID:', docId);
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

/**
 * Retrieves all locations for a specific hunt
 * @param {string} huntId - The hunt ID to filter locations
 * @returns {Promise<Array<LocationData & {id: string}>>} Array of locations with their document IDs
 * @throws {Error} If fetching fails
 */
export async function getLocationsByHunt(huntId: string): Promise<Array<LocationData & {id: string}>> {
  try {
    const q = query(collection(db, 'locations'), where('huntId', '==', huntId));
    const querySnapshot = await getDocs(q);
    
    const locations: Array<LocationData & {id: string}> = [];
    querySnapshot.forEach((doc) => {
      locations.push({
        id: doc.id,
        ...doc.data() as LocationData
      });
    });
    
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}

// ============================================================================
// Time Window Utilities
// ============================================================================

/**
 * Returns true if the provided date is within the [from, to] inclusive window.
 * If either bound is missing, it is treated as open-ended on that side.
 */
export function isNowWithinTimeWindow(
  availableFrom?: Timestamp | null,
  availableTo?: Timestamp | null,
  now: Date = new Date()
): boolean {
  const nowMs = now.getTime();
  const fromMs = availableFrom ? availableFrom.toDate().getTime() : Number.NEGATIVE_INFINITY;
  const toMs = availableTo ? availableTo.toDate().getTime() : Number.POSITIVE_INFINITY;
  return nowMs >= fromMs && nowMs <= toMs;
}

/**
 * Convenience checker for a full Location object.
 */
export function isLocationAvailableNow(location: Partial<LocationData>, now: Date = new Date()): boolean {
  return isNowWithinTimeWindow(location.availableFrom ?? null, location.availableTo ?? null, now);
}

/**
 * Update only the time window for a location.
 * Pass `null` to clear a bound, or `undefined` to leave it unchanged.
 */
export async function updateLocationTimeWindow(
  docId: string,
  params: { availableFrom?: Date | null; availableTo?: Date | null }
): Promise<void> {
  try {
    const locationRef = doc(db, 'locations', docId);
    const payload: Record<string, any> = { updatedAt: Timestamp.now() };

    if (params.availableFrom === undefined) {
      // leave unchanged
    } else if (params.availableFrom === null) {
      payload.availableFrom = null; // or deleteField()
    } else {
      payload.availableFrom = Timestamp.fromDate(params.availableFrom);
    }

    if (params.availableTo === undefined) {
      // leave unchanged
    } else if (params.availableTo === null) {
      payload.availableTo = null; // or deleteField()
    } else {
      payload.availableTo = Timestamp.fromDate(params.availableTo);
    }

    await updateDoc(locationRef, payload);
  } catch (error) {
    console.error('Error updating time window:', error);
    throw error;
  }
}

/**
 * Retrieves a single location by document ID
 * @param {string} docId - The document ID
 * @returns {Promise<(LocationData & {id: string}) | null>} Location data with ID or null if not found
 * @throws {Error} If fetching fails
 */
export async function getLocationById(docId: string): Promise<(LocationData & {id: string}) | null> {
  try {
    const docRef = doc(db, 'locations', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data() as LocationData
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
}

/**
 * Deletes a location from Firestore
 * @param {string} docId - The document ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
export async function deleteLocation(docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'locations', docId));
    console.log('Location deleted with ID:', docId);
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}

//User collection - store userId field
export async function ensureUserDocument(userId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        userId,
      });
    } else {
      await setDoc(ref, {
        userId,
      });
    }
  } catch (e) {
    console.error('Error ensuring user document:', e);
    throw e;
  }
}
