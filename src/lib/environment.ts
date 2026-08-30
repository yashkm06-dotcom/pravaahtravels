export const PRODUCTION_FIREBASE_PROJECT_ID = 'zealous-theory-q09p9';
export const STAGING_FIREBASE_PROJECT_ID = 'pravaah-travels-test';

export type AppEnvironment = 'production' | 'staging';

const required = (name: string): string => {
  const value = String(import.meta.env[name] || '').trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const appEnvironment = required('VITE_APP_ENV') as AppEnvironment;

if (!['production', 'staging'].includes(appEnvironment)) {
  throw new Error('VITE_APP_ENV must be either production or staging.');
}

const projectId = required('VITE_FIREBASE_PROJECT_ID');

if (appEnvironment === 'production' && projectId !== PRODUCTION_FIREBASE_PROJECT_ID) {
  throw new Error('Production build blocked: Firebase project ID does not match production.');
}

if (appEnvironment === 'staging') {
  const expectedStagingProjectId = required('VITE_STAGING_FIREBASE_PROJECT_ID');
  if (projectId === PRODUCTION_FIREBASE_PROJECT_ID || expectedStagingProjectId === PRODUCTION_FIREBASE_PROJECT_ID) {
    throw new Error('Staging build blocked: production Firebase project detected.');
  }
  if (projectId !== STAGING_FIREBASE_PROJECT_ID || expectedStagingProjectId !== STAGING_FIREBASE_PROJECT_ID) {
    throw new Error(`Staging build blocked: expected Firebase project ${STAGING_FIREBASE_PROJECT_ID}.`);
  }
  if (projectId !== expectedStagingProjectId) {
    throw new Error('Staging build blocked: Firebase project ID does not match the staging guard.');
  }
}

export const isStaging = appEnvironment === 'staging';

export const firebaseConfig = {
  apiKey: required('VITE_FIREBASE_API_KEY'),
  authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId,
  storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: required('VITE_FIREBASE_APP_ID'),
  firestoreDatabaseId: required('VITE_FIREBASE_DATABASE_ID'),
  measurementId: String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim(),
};
