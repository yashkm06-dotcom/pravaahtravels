import React, { useEffect, useRef, useState } from 'react';
import { Compass, ShieldCheck, Mail, Lock, LogIn, UserPlus, User, Chrome, Github, Phone, MapPin, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, updateProfile, sendPasswordResetEmail, getIdTokenResult, type User as FirebaseUser } from 'firebase/auth';
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface LoginModalProps {
  onLoginSuccess: (isAdmin: boolean) => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDestinations, setPreferredDestinations] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetErrorMsg, setResetErrorMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const scheduleLoginSuccess = (isAdmin: boolean, delayMs: number, clearLoading = false) => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    redirectTimeoutRef.current = setTimeout(() => {
      if (clearLoading) {
        setLoading(false);
      }
      onLoginSuccess(isAdmin);
    }, delayMs);
  };

  const checkIsAdmin = async (user: FirebaseUser) => {
    const token = await getIdTokenResult(user, true);
    return token.claims.admin === true;
  };

  const ensureUserProfile = async (
    user: FirebaseUser,
    provider: 'password' | 'google' | 'github',
    profileDisplayName: string,
    extraFields?: { phone?: string; preferredDestinations?: string }
  ) => {
    const userDocRef = doc(db, 'users', user.uid);
    const existingUserDoc = await getDoc(userDocRef);

    const resolvedDisplayName = profileDisplayName.trim() || user.displayName || user.email?.split('@')[0] || 'Traveler';
    const normalizedPhone = extraFields?.phone?.trim();
    const normalizedDestinations = extraFields?.preferredDestinations?.trim();

    const updateData: Record<string, any> = {
      name: resolvedDisplayName,
      email: user.email || '',
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(existingUserDoc.exists() ? {} : { createdAt: serverTimestamp(), role: 'traveler' }),
    };

    if (normalizedPhone) {
      updateData.phone = normalizedPhone;
      updateData.whatsapp = normalizedPhone;
    }

    if (normalizedDestinations) {
      updateData.preferredDestinations = normalizedDestinations;
    }

    if (user.photoURL) {
      updateData.photoURL = user.photoURL;
    }

    updateData.provider = provider;

    await setDoc(userDocRef, updateData, { merge: true });
  };

  const validatePhoneNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    return /^\d{10}$/.test(digitsOnly);
  };

  const openResetPassword = () => {
    setIsResetPassword(true);
    setResetEmail(email);
    setResetErrorMsg('');
    setResetSuccessMsg('');
  };

  const closeResetPassword = () => {
    setIsResetPassword(false);
    setResetEmail('');
    setResetErrorMsg('');
    setResetSuccessMsg('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetErrorMsg('');
    setResetSuccessMsg('');

    if (!resetEmail?.trim()) {
      setResetErrorMsg('Please enter your email address to receive the reset link.');
      setResetLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccessMsg('A password reset link has been sent to your email address.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/invalid-email') {
        setResetErrorMsg('Please enter a valid email address.');
      } else if (err.code === 'auth/user-not-found') {
        setResetErrorMsg('No user found for this email address.');
      } else if (err.code === 'auth/network-request-failed') {
        setResetErrorMsg('Network error. Please check your connection and try again.');
      } else {
        setResetErrorMsg(err.message || 'Unable to send password reset email. Please try again later.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        setErrorMsg('Please enter your full name.');
        setLoading(false);
        return;
      }

      if (!phone.trim()) {
        setErrorMsg('Phone number is required.');
        setLoading(false);
        return;
      }

      if (!validatePhoneNumber(phone)) {
        setErrorMsg('Phone number must be a 10-digit Indian mobile number.');
        setLoading(false);
        return;
      }

      if (!confirmPassword) {
        setErrorMsg('Please confirm your password.');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please confirm your password.');
        setLoading(false);
        return;
      }
    }

    try {
      const emailVal = email.trim();
      if (isSignUp) {
        // Create new account
        const userCredential = await createUserWithEmailAndPassword(auth, emailVal, password);
        const profileName = displayName.trim() || emailVal.split('@')[0];

        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: profileName });
          await ensureUserProfile(userCredential.user, 'password', profileName, {
            phone,
            preferredDestinations,
          });
        }

        setSuccessMsg('Traveler account registered successfully! Entering Traveler Portal...');
        scheduleLoginSuccess(false, 1200);
      } else {
        // Logging in existing user
        const userCredential = await signInWithEmailAndPassword(auth, emailVal, password);
        await ensureUserProfile(userCredential.user, 'password', userCredential.user.displayName || emailVal.split('@')[0], {
          phone,
          preferredDestinations,
        });
        const isAdmin = await checkIsAdmin(userCredential.user);
        setSuccessMsg(
          isAdmin
            ? 'Administrator verified! Entering Operator Panel...'
            : 'Welcome back! Opening your Travel Dashboard...'
        );
        scheduleLoginSuccess(isAdmin, 1000);
      }
    } catch (err: any) {
      console.error('Unified Auth Error:', err);
      let friendlyMessage = 'Authentication failed. Please verify your credentials.';
      
      if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = `Authentication failed: The Email/Password provider is disabled in your Firebase project. To enable it, please visit your Firebase Console: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers and click "Enable" next to Email/Password under the Sign-in method tab.`;
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email address or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already registered. Please Sign In instead.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password must be at least 6 characters long.';
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new GithubAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      const emailVal = result.user.email || '';
      await ensureUserProfile(result.user, providerName, result.user.displayName || 'Traveler');
      const isAdmin = await checkIsAdmin(result.user);

      setSuccessMsg(
        isAdmin
          ? 'Securely authenticated via social login as Admin! Redirecting...'
          : 'Securely authenticated! Redirecting to your Travel Dashboard...'
      );

      scheduleLoginSuccess(isAdmin, 1000, true);
    } catch (err: any) {
      console.error('Social login failed:', err);
      setErrorMsg(err.message || String(err));
      setLoading(false);
    }
  };

  const headerTitle = isSignUp ? 'Create your travel account' : 'Welcome Back';
  const headerSubtitle = isSignUp
    ? 'Set up your profile and start planning your next escape.'
    : 'Sign in to access your travel dashboard.';

  return (
    <div id="unified-login-view" className="flex w-full items-center justify-center px-3 py-4 font-sans sm:px-4">
      <div className="w-full max-w-[460px] overflow-hidden rounded-[22px] border border-white/70 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f7fbf3] via-white to-[#f3f8f8] px-6 py-6 sm:px-7 sm:py-7">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#4DA528]/12 via-transparent to-[#008080]/12" />
          <div className="relative text-center">
            <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4DA528] to-[#008080] text-white shadow-[0_12px_30px_rgba(77,165,40,0.25)]">
              <Compass className="h-6 w-6" />
            </div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4DA528]">
              🌿 Pravaah Travels
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
              {headerTitle}
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              {headerSubtitle}
            </p>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
          <div className="relative flex rounded-full bg-stone-100 p-1">
            <span
              className={`absolute inset-y-1 w-1/2 rounded-full bg-gradient-to-r from-[#4DA528] to-[#008080] shadow-sm transition-transform duration-300 ${
                isSignUp ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`relative z-10 flex-1 rounded-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] transition-all duration-300 ${
                !isSignUp ? 'text-white' : 'text-stone-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`relative z-10 flex-1 rounded-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] transition-all duration-300 ${
                isSignUp ? 'text-white' : 'text-stone-600'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Chrome className="h-4 w-4 text-rose-500" />
              <span>Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin('github')}
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Github className="h-4 w-4 text-stone-900" />
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-stone-200" />
            <span className="mx-4 flex-shrink text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
              or continue with email
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div role="alert" aria-live="polite" className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-medium text-rose-700 whitespace-pre-line shadow-sm">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                {successMsg}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="E.g. Yash Sharma"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#f8f7f4] py-3 pl-10 pr-4 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-[#008080] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="tel"
                        placeholder="+91 99999 12345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-[#f8f7f4] py-3 pl-10 pr-4 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-[#008080] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                      Preferred Destinations
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Uttarakhand, Ladakh"
                        value={preferredDestinations}
                        onChange={(e) => setPreferredDestinations(e.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-[#f8f7f4] py-3 pl-10 pr-4 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-[#008080] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isResetPassword && (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-[#f8f7f4] py-3 pl-10 pr-4 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                  />
                </div>
              </div>
            )}

            {isResetPassword ? (
              <div className="space-y-4">
                {resetErrorMsg && (
                  <div role="alert" aria-live="polite" className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-medium text-rose-700 whitespace-pre-line shadow-sm">
                    {resetErrorMsg}
                  </div>
                )}
                {resetSuccessMsg && (
                  <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                    {resetSuccessMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#f8f7f4] py-3 pl-10 pr-4 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={closeResetPassword}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4DA528] to-[#008080] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Send Reset Link
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#f8f7f4] py-3 pl-10 pr-4 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                    />
                  </div>
                </div>
                <div className="flex justify-end text-sm font-semibold text-[#008080]">
                  <button
                    type="button"
                    onClick={openResetPassword}
                    className="transition-colors duration-200 hover:text-[#4DA528]"
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            )}

            {isSignUp && !isResetPassword && (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-[#f8f7f4] py-3 pl-10 pr-4 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                  />
                </div>
              </div>
            )}

            {!isResetPassword && (
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4DA528] to-[#008080] px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-[0_12px_30px_rgba(77,165,40,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,128,128,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create Secure Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Verify & Enter Gateway</span>
                  </>
                )}
              </button>
            )}
          </form>

          <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
            <ShieldCheck className="h-4 w-4 text-[#008080]" />
            <span>SSL 256-Bit Encrypted Link</span>
          </div>
        </div>
      </div>
    </div>
  );
}
