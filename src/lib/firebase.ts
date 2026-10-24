import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp({
  ...firebaseConfig,
  measurementId: firebaseConfig.measurementId || 'G-BGLX08YCN1',
});
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics optional in restricted environments
    });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore on boot as required by firebase-integration-rpc skill.
 */
export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testFirestoreConnection();

/**
 * Synchronizes authenticated user's public & split-private profile to Firestore adhering to firebase-blueprint.json boundaries.
 */
export async function syncAuthenticatedUserToFirestore(user: User): Promise<void> {
  if (!user.emailVerified) return;
  const safeUid = user.uid.slice(0, 128).replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safeDisplayName = (user.displayName || 'Atelier Client').slice(0, 100);
  const safeEmail = (user.email || 'client@example.com').slice(0, 254);

  const publicPath = `users/${safeUid}`;
  try {
    await setDoc(
      doc(db, 'users', safeUid),
      {
        uid: safeUid,
        displayName: safeDisplayName,
        role: user.email === 'bhattacharyadebargha14@gmail.com' ? 'admin' : 'customer',
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    // Only throw structured error if permission denied on owned path
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, publicPath);
    }
  }

  const privatePath = `users/${safeUid}/private/info`;
  try {
    await setDoc(
      doc(db, 'users', safeUid, 'private', 'info'),
      {
        uid: safeUid,
        email: safeEmail,
        notifyEmail: true,
        notifySms: true,
        notifyWhatsapp: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }
}

/**
 * Synchronizes catalog product metadata to Firestore `/products/{productId}` when an authenticated Firebase Admin creates/updates a garment.
 * Per Firebase skill guidelines, binary images are stored in the server/catalog store rather than inside 1MB Firestore documents.
 */
export async function syncProductMetadataToFirestore(product: {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  published: boolean;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const safeId = product.id.slice(0, 128).replace(/[^a-zA-Z0-9_\-]/g, '-');
  const safeSku = product.sku.slice(0, 64).replace(/[^a-zA-Z0-9_\-]/g, '-');
  const safeName = product.name.slice(0, 140);
  const safeCategory = product.category.slice(0, 60);
  const safePrice = Math.min(10000000, Math.max(0, Number(product.price) || 0));
  const safeAuthorUid = currentUser.uid.slice(0, 128).replace(/[^a-zA-Z0-9_\-]/g, '_');

  const path = `products/${safeId}`;
  try {
    await setDoc(doc(db, 'products', safeId), {
      sku: safeSku,
      name: safeName,
      category: safeCategory,
      price: safePrice,
      published: Boolean(product.published),
      authorUid: safeAuthorUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export { signInWithPopup, signOut, onAuthStateChanged, type User };

