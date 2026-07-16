import { db, collection, getDocs, writeBatch, doc } from './firebase';
import { SEED_GALLERY } from './seedData';

export async function checkAndSeedDatabase() {
  try {
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
