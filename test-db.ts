import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
console.log('Using Firebase config:', {
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId
});

async function testDb(dbId: string | undefined, label: string) {
  console.log(`\n--- Testing database: ${label} (${dbId || 'default'}) ---`);
  try {
    const db = getFirestore(app, dbId || undefined);
    
    // 1. Try reading packages
    console.log('1. Attempting to read packages...');
    const pkgsSnapshot = await getDocs(collection(db, 'packages'));
    console.log(`   READ SUCCESS: Packages count: ${pkgsSnapshot.size}`);

    // 2. Try writing a test review
    console.log('2. Attempting to write a test review...');
    const docRef = await addDoc(collection(db, 'reviews'), {
      name: 'System Test Client',
      rating: 5,
      comment: 'Testing database rules and configuration from local container script.',
      destination: 'Test Destination',
      verified: true,
      createdAt: new Date().toISOString()
    });
    console.log(`   WRITE SUCCESS: Document ID: ${docRef.id}`);

    // 3. Try reading reviews
    console.log('3. Attempting to read reviews...');
    const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
    console.log(`   READ SUCCESS: Reviews count: ${reviewsSnapshot.size}`);

  } catch (err: any) {
    console.error(`   FAILED: ${err?.message || err}`);
    if (err?.code) {
      console.error(`   Code: ${err.code}`);
    }
  }
}

async function run() {
  // Test only the custom database
  await testDb(firebaseConfig.firestoreDatabaseId, 'Custom Database');
  process.exit(0);
}

run();
