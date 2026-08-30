import { config as loadEnv } from 'dotenv';
import path from 'node:path';

const PRODUCTION_PROJECT_ID = 'zealous-theory-q09p9';
const STAGING_PROJECT_ID = 'pravaah-travels-test';
const environment = process.argv[2];

if (environment !== 'production' && environment !== 'staging') {
  throw new Error('Usage: tsx scripts/validate-environment.ts <production|staging>');
}

loadEnv({ path: path.resolve(`.env.${environment}`), override: false });

const required = [
  'VITE_APP_ENV',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_ID',
];

const missing = required.filter((name) => !String(process.env[name] || '').trim());
if (missing.length) throw new Error(`Missing ${environment} environment variables: ${missing.join(', ')}`);

const projectId = String(process.env.VITE_FIREBASE_PROJECT_ID);
if (process.env.VITE_APP_ENV !== environment) {
  throw new Error(`Environment mismatch: expected VITE_APP_ENV=${environment}.`);
}

if (environment === 'production' && projectId !== PRODUCTION_PROJECT_ID) {
  throw new Error('Production validation failed: unexpected Firebase project.');
}

if (environment === 'staging') {
  const expected = String(process.env.VITE_STAGING_FIREBASE_PROJECT_ID || '').trim();
  if (!expected) throw new Error('Missing VITE_STAGING_FIREBASE_PROJECT_ID staging guard.');
  if (projectId === PRODUCTION_PROJECT_ID || expected === PRODUCTION_PROJECT_ID) {
    throw new Error('Staging validation failed: production Firebase project detected.');
  }
  if (projectId !== STAGING_PROJECT_ID || expected !== STAGING_PROJECT_ID) {
    throw new Error(`Staging validation failed: expected Firebase project ${STAGING_PROJECT_ID}.`);
  }
  if (projectId !== expected) throw new Error('Staging validation failed: project ID does not match staging guard.');
}

console.log(`${environment} environment validated for Firebase project ${projectId}.`);
