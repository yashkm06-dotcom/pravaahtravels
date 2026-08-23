/**
 * Client-side utility for triggering automated email notifications.
 * Sends a secure POST request to our server-side proxy which formats 
 * premium templates and dispatches via SMTP (with fallback Firestore logs).
 */
export async function triggerSystemEmail(
  trigger: 'booking-received' | 'booking-confirmed' | 'booking-cancelled' | 'enquiry-received' | 'new-booking' | 'new-enquiry' | 'new-review',
  recipientEmail: string,
  metadata: Record<string, any>
): Promise<boolean> {
  try {
    console.log(`[CLIENT EMAIL] Triggering automated email context: "${trigger}" for "${recipientEmail}"`);
    const token = await (await import('./firebase')).auth.currentUser?.getIdToken();
    if (!token) return false;
    const response = await fetch('/api/trigger-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        trigger,
        recipientEmail,
        metadata,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('[CLIENT EMAIL] Server responded with an error:', errData);
      return false;
    }

    const data = await response.json();
    console.log('[CLIENT EMAIL] Automated email dispatch completed:', data);
    return true;
  } catch (err) {
    console.error('[CLIENT EMAIL] Failed to connect to server-side email proxy:', err);
    return false;
  }
}
