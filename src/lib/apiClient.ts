import { auth } from './firebase';

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to use this feature.');
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
