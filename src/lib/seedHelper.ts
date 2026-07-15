import { db, collection, getDocs, addDoc, writeBatch, doc } from './firebase';
import { SEED_PACKAGES, SEED_GALLERY } from './seedData';

export async function checkAndSeedDatabase() {
  try {
    // Check packages
    const packagesCol = collection(db, 'packages');
    const packagesSnapshot = await getDocs(packagesCol);
    
    if (packagesSnapshot.empty) {
      console.log('No packages found in Firestore. Seeding default travel packages...');
      const batch = writeBatch(db);
      
      SEED_PACKAGES.forEach((pkg) => {
        const docRef = doc(packagesCol);
        batch.set(docRef, {
          ...pkg,
          createdAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
      console.log('Seeded default packages successfully.');
    }

    // Check gallery
    const galleryCol = collection(db, 'gallery');
    const gallerySnapshot = await getDocs(galleryCol);
    
    if (gallerySnapshot.empty) {
      console.log('No gallery images found in Firestore. Seeding default gallery...');
      const batch = writeBatch(db);
      
      SEED_GALLERY.forEach((item) => {
        const docRef = doc(galleryCol);
        batch.set(docRef, {
          ...item,
          createdAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
      console.log('Seeded default gallery successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
