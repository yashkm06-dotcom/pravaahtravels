import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/** Explicit one-time migration helper. It never discovers or changes users automatically. */
const uid = process.env.ADMIN_UID?.trim();
if (!uid || !/^[A-Za-z0-9_-]{20,128}$/.test(uid)) {
  throw new Error('ADMIN_UID must be supplied explicitly as an exact Firebase Auth UID.');
}

if (getApps().length === 0) initializeApp();
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), admin: true });
console.log(`Assigned admin=true to UID ${uid}. The user must refresh their ID token.`);
