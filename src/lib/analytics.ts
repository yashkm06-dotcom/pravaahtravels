import { db, collection, addDoc, getDocs, query, where, limit } from './firebase';

// Helper to get or create a session ID
function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem('pravaah_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      sessionStorage.setItem('pravaah_session_id', sid);
    }
    return sid;
  } catch (e) {
    return 'sess_fallback_' + Date.now();
  }
}

/**
 * Logs an analytics event to Firestore.
 * Handles any failures gracefully so user experience is unaffected.
 */
export async function logAnalyticsEvent(
  eventType: 'page_view' | 'package_view' | 'destination_view',
  targetId: string,
  targetName: string = ''
): Promise<void> {
  try {
    // Avoid double logging page view in the same session tab
    if (eventType === 'page_view') {
      const loggedViews = JSON.parse(sessionStorage.getItem('pravaah_logged_page_views') || '[]');
      if (loggedViews.includes(targetId)) {
        return; // Already logged this view in this session
      }
      loggedViews.push(targetId);
      sessionStorage.setItem('pravaah_logged_page_views', JSON.stringify(loggedViews));
    }

    const eventPayload = {
      eventType,
      targetId,
      targetName,
      sessionId: getSessionId(),
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'analytics_events'), eventPayload);
  } catch (err) {
    console.warn('[Analytics] Failed to log analytics event:', err);
  }
}

/**
 * Fetches analytics events from Firestore for administrative dashboard.
 */
export async function fetchAnalyticsEvents(): Promise<any[]> {
  try {
    const q = query(collection(db, 'analytics_events'), limit(1500));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('[Analytics] Failed to fetch analytics events:', err);
    return [];
  }
}
