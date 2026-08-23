import { db, collection, getDocs } from './firebase';

export async function checkAndSeedDatabase() {
  try {
    const galleryCol = collection(db, 'gallery');
    const gallerySnapshot = await getDocs(galleryCol);

    if (gallerySnapshot.empty) {
      console.log('No gallery images found in Firestore. Waiting for content to be published.');
    }
  } catch (error) {
    console.error('Error checking gallery data:', error);
  }
}
