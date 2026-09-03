import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Chrome, Compass, Github, Lock, LogIn, Mail, MapPin, Phone, ShieldCheck, User, UserPlus } from 'lucide-react';
import { createUserWithEmailAndPassword, getIdTokenResult, GoogleAuthProvider, GithubAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile, type User as FirebaseUser } from 'firebase/auth';
import { auth, db, doc, getDoc, serverTimestamp, setDoc } from '../lib/firebase';
import { firebaseConfig } from '../lib/environment';

interface LoginModalProps { onLoginSuccess: (isAdmin: boolean) => void; }
const initial = { email: '', password: '', displayName: '', phone: '', preferredDestinations: '', confirmPassword: '' };

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState(initial);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (redirectRef.current) clearTimeout(redirectRef.current); }, []);
  const updateField = (event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  const scheduleSuccess = (isAdmin: boolean, delay: number) => { if (redirectRef.current) clearTimeout(redirectRef.current); redirectRef.current = setTimeout(() => onLoginSuccess(isAdmin), delay); };
  const isAdmin = async (user: FirebaseUser) => (await getIdTokenResult(user, true)).claims.admin === true;
  const ensureProfile = async (user: FirebaseUser, provider: 'password' | 'google' | 'github') => {
    const ref = doc(db, 'users', user.uid); const existing = await getDoc(ref); const name = form.displayName.trim() || user.displayName || user.email?.split('@')[0] || 'Traveler';
    await setDoc(ref, { name, email: user.email || '', lastLogin: serverTimestamp(), updatedAt: serverTimestamp(), ...(existing.exists() ? {} : { createdAt: serverTimestamp(), role: 'traveler' }), ...(form.phone.trim() ? { phone: form.phone.trim(), whatsapp: form.phone.trim() } : {}), ...(form.preferredDestinations.trim() ? { preferredDestinations: form.preferredDestinations.trim() } : {}), ...(user.photoURL ? { photoURL: user.photoURL } : {}), provider }, { merge: true });
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!form.email.trim() || !form.password) { setError('Please enter your email address and password.'); return; }
    if (mode === 'signup' && (!form.displayName.trim() || !form.phone.trim() || form.phone.replace(/\D/g, '').length !== 10 || form.password !== form.confirmPassword)) { setError(!form.displayName.trim() ? 'Please enter your full name.' : !form.phone.trim() ? 'Phone number is required.' : form.phone.replace(/\D/g, '').length !== 10 ? 'Phone number must be a 10-digit Indian mobile number.' : 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      const email = form.email.trim();
      if (mode === 'signup') { const credential = await createUserWithEmailAndPassword(auth, email, form.password); await updateProfile(credential.user, { displayName: form.displayName.trim() }); await ensureProfile(credential.user, 'password'); setSuccess('Your traveler account is ready. Opening your travel desk...'); scheduleSuccess(false, 1100); }
      else { const credential = await signInWithEmailAndPassword(auth, email, form.password); await ensureProfile(credential.user, 'password'); const admin = await isAdmin(credential.user); setSuccess(admin ? 'Operator access verified. Opening operations...' : 'Welcome back. Opening your travel desk...'); scheduleSuccess(admin, 1000); }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') setError(`Email/password sign-in is disabled in Firebase. Enable it for project ${firebaseConfig.projectId}.`);
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setError('Invalid email address or password.');
      else if (err.code === 'auth/email-already-in-use') setError('This email is already registered. Sign in instead.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters long.');
      else setError(err.message || 'Authentication failed. Please try again.');
    } finally { setLoading(false); }
  };
  const socialLogin = async (providerName: 'google' | 'github') => {
    setLoading(true); setError(''); setSuccess('');
    try { const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider(); const result = await signInWithPopup(auth, provider); await ensureProfile(result.user, providerName); const admin = await isAdmin(result.user); setSuccess(admin ? 'Operator access verified...' : 'Welcome back...'); scheduleSuccess(admin, 900); } catch (err: any) { setError(err.message || 'Social sign-in failed.'); } finally { setLoading(false); }
  };
  const resetPassword = async (event: React.FormEvent) => { event.preventDefault(); setResetLoading(true); setError(''); setResetMessage(''); try { await sendPasswordResetEmail(auth, resetEmail.trim()); setResetMessage('A password reset link has been sent.'); } catch (err: any) { setError(err.code === 'auth/invalid-email' ? 'Please enter a valid email address.' : err.message || 'Unable to send a reset link.'); } finally { setResetLoading(false); } };
  const headerTitle = resetMode ? 'Reset your password' : mode === 'signup' ? 'Create your travel desk' : 'Welcome back';
  const headerCopy = resetMode ? 'We will send a secure link to the email on your account.' : mode === 'signup' ? 'Keep your enquiries, saved journeys, and trip details together.' : 'Pick up where your next journey begins.';

  return <div id="unified-login-view" className="pravaah-login-view"><div className="pravaah-login-panel"><aside className="pravaah-login-intro"><span className="pravaah-login-intro__mark"><Compass className="h-6 w-6" aria-hidden="true" /></span><span className="pravaah-kicker pravaah-kicker--light">Pravaah travel desk</span><h2>Keep the<br /><em>journey</em> close.</h2><p>Your saved routes, enquiries, and travel details, in one quiet place.</p><span className="pravaah-login-intro__line">A little closer to the mountains.</span></aside><section className="pravaah-login-form"><div className="pravaah-login-form__heading"><div><span className="pravaah-kicker">Traveler access</span><h1>{headerTitle}</h1><p>{headerCopy}</p></div><button type="button" className="pravaah-icon-button" onClick={() => onLoginSuccess(false)} aria-label="Close sign in"><ArrowUpRight className="h-5 w-5" aria-hidden="true" /></button></div>{!resetMode && <><div className="pravaah-login-tabs"><button type="button" className={mode === 'signin' ? 'is-active' : ''} onClick={() => { setMode('signin'); setError(''); }}>Sign in</button><button type="button" className={mode === 'signup' ? 'is-active' : ''} onClick={() => { setMode('signup'); setError(''); }}>Create account</button></div><div className="pravaah-social-login"><button type="button" onClick={() => socialLogin('google')} disabled={loading}><Chrome className="h-4 w-4" aria-hidden="true" />Continue with Google</button><button type="button" onClick={() => socialLogin('github')} disabled={loading}><Github className="h-4 w-4" aria-hidden="true" />Continue with GitHub</button></div><div className="pravaah-login-divider"><span>or use email</span></div></>}{error && <div className="pravaah-login-error" role="alert">{error}</div>}{success && <div className="pravaah-login-success" role="status">{success}</div>}{resetMode ? <form className="pravaah-login-fields" onSubmit={resetPassword}><label>Email address<input type="email" required value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} autoComplete="email" /></label>{resetMessage && <p className="pravaah-login-success">{resetMessage}</p>}<div className="pravaah-login-form-actions"><button type="button" className="pravaah-outline-button" onClick={() => { setResetMode(false); setError(''); }}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</button><button type="submit" className="pravaah-button pravaah-button--dark" disabled={resetLoading}>{resetLoading ? 'Sending...' : 'Send reset link'} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div></form> : <form className="pravaah-login-fields" onSubmit={handleSubmit}>{mode === 'signup' && <><label>Full name<input name="displayName" value={form.displayName} onChange={updateField} required autoComplete="name" /></label><div className="pravaah-login-fields__split"><label>Phone<input name="phone" type="tel" value={form.phone} onChange={updateField} required autoComplete="tel" /></label><label>Preferred destinations<input name="preferredDestinations" value={form.preferredDestinations} onChange={updateField} placeholder="Ladakh, valleys..." /></label></div></>}<label>Email address<input name="email" type="email" value={form.email} onChange={updateField} required autoComplete="email" /></label><label>Password<input name="password" type="password" value={form.password} onChange={updateField} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>{mode === 'signup' ? <label>Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required autoComplete="new-password" /></label> : <button type="button" className="pravaah-login-forgot" onClick={() => { setResetMode(true); setResetEmail(form.email); }}>Forgot password?</button>}<button type="submit" className="pravaah-button pravaah-button--copper pravaah-button--wide" disabled={loading}>{loading ? 'Opening your desk...' : mode === 'signup' ? <><UserPlus className="h-4 w-4" aria-hidden="true" />Create traveler account</> : <><LogIn className="h-4 w-4" aria-hidden="true" />Sign in to travel desk</>}</button></form>}<div className="pravaah-login-foot"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Secure Firebase authentication</div></section></div></div>;
}
