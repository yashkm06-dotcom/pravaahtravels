import React, { useState } from 'react';
import { Compass, ShieldCheck, Mail, Lock, LogIn, UserPlus, Shield, User, Sparkles, Chrome, Github } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AdminLoginViewProps {
  onLoginSuccess: (isAdmin: boolean) => void;
}

export default function AdminLoginView({ onLoginSuccess }: AdminLoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const checkIsAdmin = (emailAddress: string) => {
    const cleanEmail = emailAddress.trim().toLowerCase();
    return (
      cleanEmail === 'yash.km06@gmail.com' ||
      cleanEmail === 'admin@pravaahtravels.com' ||
      cleanEmail.endsWith('@pravaahtravels.com')
    );
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

    try {
      const emailVal = email.trim();
      const isAdmin = checkIsAdmin(emailVal);

      if (isSignUp) {
        // Create new account
        await createUserWithEmailAndPassword(auth, emailVal, password);
        setSuccessMsg(
          isAdmin
            ? 'Administrator registered successfully! Directing to Operator Panel...'
            : 'Traveler account registered successfully! Entering Traveler Portal...'
        );
        setTimeout(() => {
          onLoginSuccess(isAdmin);
        }, 1200);
      } else {
        // Logging in existing user
        await signInWithEmailAndPassword(auth, emailVal, password);
        setSuccessMsg(
          isAdmin
            ? 'Administrator verified! Entering Operator Panel...'
            : 'Welcome back! Opening your Travel Dashboard...'
        );
        setTimeout(() => {
          onLoginSuccess(isAdmin);
        }, 1000);
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
      const isAdmin = checkIsAdmin(emailVal);

      setSuccessMsg(
        isAdmin
          ? 'Securely authenticated via social login as Admin! Redirecting...'
          : 'Securely authenticated! Redirecting to your Travel Dashboard...'
      );

      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(isAdmin);
      }, 1000);
    } catch (err: any) {
      console.error('Social login failed:', err);
      setErrorMsg(err.message || String(err));
      setLoading(false);
    }
  };

  return (
    <div id="unified-login-view" className="animate-fade-in py-16 flex items-center justify-center bg-[#f8f7f4] min-h-[85vh] px-4 font-sans">
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-lg p-8 shadow-md space-y-8">
        
        {/* Logo/Brand */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-[#008080] rounded-full flex items-center justify-center text-white mx-auto shadow-md">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#333333] tracking-tight">
            Pravaah Travels Gateway
          </h2>
          <p className="text-xs text-stone-500 font-light max-w-sm mx-auto">
            A single gateway for both operators and premium travelers. Enter your email to access your personalized workspace.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-100 p-1 rounded-md">
          <button
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-center rounded-sm transition cursor-pointer ${
              !isSignUp ? 'bg-white text-[#008080] shadow-xs' : 'text-stone-400 hover:text-stone-600'
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
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-center rounded-sm transition cursor-pointer ${
              isSignUp ? 'bg-white text-[#008080] shadow-xs' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Social Sign-in Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSocialLogin('google')}
            type="button"
            className="flex items-center justify-center gap-2 py-2 px-3 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 rounded text-xs text-stone-700 font-medium transition cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-rose-500" />
            <span>Google</span>
          </button>
          <button
            onClick={() => handleSocialLogin('github')}
            type="button"
            className="flex items-center justify-center gap-2 py-2 px-3 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 rounded text-xs text-stone-700 font-medium transition cursor-pointer"
          >
            <Github className="w-4 h-4 text-stone-900" />
            <span>GitHub</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-4 text-stone-400 text-[10px] uppercase font-bold tracking-widest">or email login</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded text-xs font-semibold animate-shake whitespace-pre-line">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="E.g. Yash Sharma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold uppercase tracking-wider text-xs rounded transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Secure Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Verify & Enter Gateway</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-2 justify-center text-[10px] text-stone-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#008080]" />
          <span>SSL 256-Bit Encrypted Link</span>
        </div>

      </div>
    </div>
  );
}
