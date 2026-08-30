import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const TARGET_PROJECT_ID: string = 'pravaah-travels-test';
const PRODUCTION_PROJECT_ID: string = 'zealous-theory-q09p9';
const TARGET_EMAIL = 'yash.km06@gmail.com';
const APPLY_CONFIRMATION = 'SET_ADMIN_TRUE:yash.km06@gmail.com:pravaah-travels-test';
const APP_NAME = 'staging-admin-claim-once';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1) {
  throw new Error('The only supported argument is --apply. Email and UID arguments are forbidden.');
}
const apply = args.includes('--apply');

if (TARGET_PROJECT_ID === PRODUCTION_PROJECT_ID) {
  throw new Error('Safety invariant failed: staging and production project IDs must differ.');
}

const projectEnvironmentVariables = [
  'GOOGLE_CLOUD_PROJECT',
  'GCLOUD_PROJECT',
  'GCP_PROJECT',
  'CLOUDSDK_PROJECT',
  'CLOUDSDK_CORE_PROJECT',
];
for (const name of projectEnvironmentVariables) {
  const value = process.env[name]?.trim();
  if (value && value !== TARGET_PROJECT_ID) {
    throw new Error(`Safety check failed: ${name} targets ${value}, not ${TARGET_PROJECT_ID}.`);
  }
}

const firebaseConfig = process.env.FIREBASE_CONFIG?.trim();
if (firebaseConfig) {
  if (firebaseConfig.includes(PRODUCTION_PROJECT_ID)) {
    throw new Error('Safety check failed: FIREBASE_CONFIG references the production project.');
  }
  if (firebaseConfig.startsWith('{')) {
    const parsed = JSON.parse(firebaseConfig) as { projectId?: string };
    if (parsed.projectId && parsed.projectId !== TARGET_PROJECT_ID) {
      throw new Error(`Safety check failed: FIREBASE_CONFIG targets ${parsed.projectId}.`);
    }
  }
}

if (apply && process.env.STAGING_ADMIN_CLAIM_CONFIRMATION !== APPLY_CONFIRMATION) {
  throw new Error(`Apply mode requires STAGING_ADMIN_CLAIM_CONFIRMATION=${APPLY_CONFIRMATION}.`);
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId: TARGET_PROJECT_ID,
}, APP_NAME);

if (app.options.projectId !== TARGET_PROJECT_ID || app.options.projectId === PRODUCTION_PROJECT_ID) {
  throw new Error('Admin SDK project verification failed before the Auth request.');
}

const auth = getAuth(app);

const explainPermissionFailure = (operation: 'get' | 'update', error: unknown): never => {
  const detail = error instanceof Error ? error.message : String(error);
  const permission = operation === 'get' ? 'firebaseauth.users.get' : 'firebaseauth.users.update';
  throw new Error(`The WIF service account cannot ${operation} the staging Auth user. Required permission: ${permission}. Original error: ${detail}`);
};

try {
  let user;
  try {
    user = await auth.getUserByEmail(TARGET_EMAIL);
  } catch (error: any) {
    if (error?.code === 'auth/insufficient-permission' || /permission|credential/i.test(String(error?.message || ''))) {
      explainPermissionFailure('get', error);
    }
    throw error;
  }

  if (user.email?.trim().toLowerCase() !== TARGET_EMAIL) {
    throw new Error('Resolved staging Auth user email does not match the immutable target email.');
  }

  const currentClaims = user.customClaims || {};
  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    projectId: TARGET_PROJECT_ID,
    email: TARGET_EMAIL,
    adminBefore: currentClaims.admin === true,
  }));

  if (!apply) {
    console.log(currentClaims.admin === true
      ? 'Dry-run complete: admin=true is already present; apply would be an idempotent no-op.'
      : 'Dry-run complete: apply would preserve existing claims and add only admin=true.');
    process.exitCode = 0;
  } else {
    if (currentClaims.admin !== true) {
      try {
        await auth.setCustomUserClaims(user.uid, { ...currentClaims, admin: true });
      } catch (error: any) {
        if (error?.code === 'auth/insufficient-permission' || /permission|credential/i.test(String(error?.message || ''))) {
          explainPermissionFailure('update', error);
        }
        throw error;
      }
    }

    const verifiedUser = await auth.getUser(user.uid);
    if (verifiedUser.email?.trim().toLowerCase() !== TARGET_EMAIL) {
      throw new Error('Post-update verification resolved an unexpected Auth user email.');
    }
    if (verifiedUser.customClaims?.admin !== true) {
      throw new Error('Post-update verification failed: customClaims.admin is not true.');
    }

    console.log(JSON.stringify({
      mode: 'verified',
      projectId: TARGET_PROJECT_ID,
      email: TARGET_EMAIL,
      adminAfter: true,
      changed: currentClaims.admin !== true,
    }));
  }
} finally {
  await deleteApp(app);
}
