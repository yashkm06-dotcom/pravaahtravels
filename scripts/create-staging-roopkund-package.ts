import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const STAGING_PROJECT_ID: string = 'pravaah-travels-test';
const PRODUCTION_PROJECT_ID: string = 'zealous-theory-q09p9';
const DATABASE_ID = '(default)';
const DOCUMENT_ID = 'roopkund-trek';
const APP_NAME = 'staging-roopkund-package-once';
const APPLY_CONFIRMATION = 'CREATE_STAGING_ROOPKUND_PACKAGE:roopkund-trek:pravaah-travels-test';
const CUSTOM_LANDING_PATH = '/roopkund-trek';
const HERO_IMAGE = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=86';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1) {
  throw new Error('The only supported argument is --apply. Project, database and document arguments are forbidden.');
}
const apply = args.includes('--apply');

if (STAGING_PROJECT_ID === PRODUCTION_PROJECT_ID) {
  throw new Error('Safety invariant failed: staging and production project IDs must differ.');
}

for (const name of ['GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GCP_PROJECT', 'CLOUDSDK_PROJECT', 'CLOUDSDK_CORE_PROJECT']) {
  const value = process.env[name]?.trim();
  if (value && value !== STAGING_PROJECT_ID) {
    throw new Error(`Safety check failed: ${name} targets ${value}, not ${STAGING_PROJECT_ID}.`);
  }
}

const firebaseConfig = process.env.FIREBASE_CONFIG?.trim();
if (firebaseConfig?.includes(PRODUCTION_PROJECT_ID)) {
  throw new Error('Safety check failed: FIREBASE_CONFIG references the production project.');
}

if (apply && process.env.STAGING_ROOPKUND_PACKAGE_CONFIRMATION !== APPLY_CONFIRMATION) {
  throw new Error(`Apply mode requires STAGING_ROOPKUND_PACKAGE_CONFIRMATION=${APPLY_CONFIRMATION}.`);
}

const timestamp = new Date().toISOString();
const packageDocument = {
  title: 'Roopkund Trek',
  slug: 'roopkund-trek',
  customLandingPage: CUSTOM_LANDING_PATH,
  destination: 'Roopkund, Uttarakhand',
  destinations: ['Roopkund, Uttarakhand'],
  location: 'Uttarakhand',
  country: 'India',
  category: 'Treks',
  bookingType: 'Adventure Led',
  packageCode: 'STAGING-ROOPKUND-CANONICAL',
  duration: 'Details under review',
  price: 0,
  shortDescription: 'Staging preview for the canonical Roopkund package. Route, pricing and operating details are under factual review.',
  fullDescription: 'This staging-only package intentionally leaves disputed expedition facts unpublished. Verified details can be added through the existing package CMS.',
  highlights: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  thingsToCarry: [],
  faqs: [],
  policies: [],
  imageUrl: HERO_IMAGE,
  packageBannerUrl: HERO_IMAGE,
  galleryImages: [],
  featured: true,
  active: true,
  status: 'Publish',
  cmsStatus: 'published',
  seoTitle: 'Roopkund Trek | Pravaah Travels',
  seoDescription: 'Explore the staging preview for Pravaah Travels’ Roopkund Trek. Final route, duration, pricing and operating details remain under review.',
  createdAt: timestamp,
  updatedAt: timestamp,
};

const app = initializeApp({
  credential: applicationDefault(),
  projectId: STAGING_PROJECT_ID,
}, APP_NAME);

if (app.options.projectId !== STAGING_PROJECT_ID || app.options.projectId === PRODUCTION_PROJECT_ID) {
  throw new Error('Admin SDK project verification failed before the Firestore request.');
}

const database = getFirestore(app, DATABASE_ID);
const reference = database.collection('packages').doc(DOCUMENT_ID);

try {
  const before = await reference.get();
  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    destination: {
      projectId: STAGING_PROJECT_ID,
      databaseId: DATABASE_ID,
      documentPath: `packages/${DOCUMENT_ID}`,
    },
    productionProjectRejected: PRODUCTION_PROJECT_ID,
    existsBefore: before.exists,
    proposed: packageDocument,
  }, null, 2));

  if (!apply) {
    console.log(before.exists
      ? 'Dry-run complete: the target document already exists; apply would verify it and perform no overwrite.'
      : 'Dry-run complete: apply would create exactly one document in staging and perform no other writes.');
  } else if (before.exists) {
    const existing = before.data() || {};
    if (
      existing.packageCode !== packageDocument.packageCode
      || existing.customLandingPage !== CUSTOM_LANDING_PATH
      || existing.slug !== packageDocument.slug
    ) {
      throw new Error('Target document already exists but does not match the canonical staging identity. Refusing to overwrite it.');
    }
    console.log('Apply is idempotent: the canonical staging package already exists; no write was performed.');
  } else {
    await reference.create(packageDocument);
  }

  if (apply) {
    const verified = await reference.get();
    const data = verified.data();
    if (!verified.exists || data?.customLandingPage !== CUSTOM_LANDING_PATH || data?.packageCode !== packageDocument.packageCode) {
      throw new Error('Post-write verification failed for the staging canonical package.');
    }
    console.log(JSON.stringify({
      mode: 'verified',
      projectId: STAGING_PROJECT_ID,
      databaseId: DATABASE_ID,
      documentPath: verified.ref.path,
      customLandingPage: data.customLandingPage,
      active: data.active === true,
      productionWrites: 0,
    }, null, 2));
  }
} finally {
  await deleteApp(app);
}
