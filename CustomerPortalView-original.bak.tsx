import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Lock, Shield, Sparkles, CheckCircle, CreditCard, 
  Plus, Trash2, ChevronDown, MapPin, LogOut, RefreshCw, 
  FileText, Key, Check, X, Info, AlertCircle, Compass, Star, Eye,
  CloudSun, AlertTriangle, Thermometer, Briefcase, Map, Heart
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth, db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc, setDoc } from '../lib/firebase';
import { formatPrice } from '../types';
import { triggerSystemEmail } from '../lib/emailClient';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';

interface CustomerPortalViewProps {
  onLogout: () => void;
  onNavigateToHome: () => void;
}

// Client side image optimization helper
const resizeAndCompressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 500;
      const MAX_HEIGHT = 500;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function CustomerPortalView({ onLogout, onNavigateToHome }: CustomerPortalViewProps) {
  // Auth state
  const [user, setUser] = useState(auth.currentUser);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'emailLink'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Email Link (Passwordless) Auth states
  const [emailLinkSentTo, setEmailLinkSentTo] = useState('');
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [needEmailConfirmation, setNeedEmailConfirmation] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  
  // Custom Platform configuration for Web, Android, iOS to demonstrate passwordless settings
  const [androidPackageName, setAndroidPackageName] = useState('com.pravaahtravels.android');
  const [iosBundleId, setIosBundleId] = useState('com.pravaahtravels.ios');
  const [showPlatformConfigGuide, setShowPlatformConfigGuide] = useState(false);

  // Active tab inside logged-in portal
  const [activeTab, setActiveTab] = useState<'bookings' | 'ai-assistant' | 'private-vault' | 'reviews' | 'saved-packages' | 'travel-history' | 'profile'>('bookings');

  // Bookings list
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Real-time travel/weather alerts state
  const [weatherAlert, setWeatherAlert] = useState<any | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Booking Modal
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [newBookingDest, setNewBookingDest] = useState('');
  const [newBookingDate, setNewBookingDate] = useState('');
  const [newBookingTravelers, setNewBookingTravelers] = useState(1);
  const [newBookingBudget, setNewBookingBudget] = useState(50000);
  const [newBookingRequests, setNewBookingRequests] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const [newBookingName, setNewBookingName] = useState('');
  const [newBookingPhone, setNewBookingPhone] = useState('');
  const [newBookingWhatsApp, setNewBookingWhatsApp] = useState('');
  const [newBookingEmail, setNewBookingEmail] = useState('');
  const [newBookingPackage, setNewBookingPackage] = useState('');
  const [newBookingAdults, setNewBookingAdults] = useState(2);
  const [newBookingChildren, setNewBookingChildren] = useState(0);
  const [newBookingPickupCity, setNewBookingPickupCity] = useState('');

  // Prefill when booking modal opens
  useEffect(() => {
    if (showNewBookingModal && user) {
      setNewBookingName(user.displayName || '');
      setNewBookingEmail(user.email || '');
      setNewBookingPackage('Custom Holiday Package');
    }
  }, [showNewBookingModal, user]);

  // Payment Simulation Modal
  const [payingBooking, setPayingBooking] = useState<any | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCardNum, setPaymentCardNum] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Private Vault Data
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [showAddVaultModal, setShowAddVaultModal] = useState(false);
  const [vaultTitle, setVaultTitle] = useState('');
  const [vaultContent, setVaultContent] = useState('');
  const [vaultCategory, setVaultCategory] = useState<'Passport' | 'Insurance' | 'Emergency' | 'Checklist' | 'Other'>('General Notes' as any);
  const [vaultSubmitting, setVaultSubmitting] = useState(false);

  // AI Itinerary Assistant State
  const [aiDest, setAiDest] = useState('');
  const [aiDuration, setAiDuration] = useState('5');
  const [aiBudget, setAiBudget] = useState('50000');
  const [aiVibe, setAiVibe] = useState('Balanced');
  const [aiRequests, setAiRequests] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState('');
  const [savedAiItineraries, setSavedAiItineraries] = useState<any[]>([]);
  const [savingAi, setSavingAi] = useState(false);

  // Saved Packages States
  const [savedPackages, setSavedPackages] = useState<any[]>([]);
  const [savedPackagesLoading, setSavedPackagesLoading] = useState(false);

  // Profile States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileWhatsApp, setProfileWhatsApp] = useState('');
  const [profilePrefDest, setProfilePrefDest] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Review submission states
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDestination, setReviewDestination] = useState('');
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchSavedPackages = async (uid: string) => {
    setSavedPackagesLoading(true);
    try {
      const q = query(
        collection(db, 'users', uid, 'private'),
        where('type', '==', 'saved_package')
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedPackages(fetched);
    } catch (err: any) {
      console.error('Error fetching saved packages:', err);
    } finally {
      setSavedPackagesLoading(false);
    }
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const uRef = doc(db, 'users', uid);
      const uSnap = await getDoc(uRef);
      if (uSnap.exists()) {
        const uData = uSnap.data();
        setProfileName(uData.name || '');
        setProfilePhone(uData.phone || '');
        setProfileWhatsApp(uData.whatsapp || '');
        setProfilePrefDest(uData.preferredDestinations || '');
      } else {
        setProfileName(auth.currentUser?.displayName || '');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      const uRef = doc(db, 'users', user.uid);
      await setDoc(uRef, {
        name: profileName,
        phone: profilePhone,
        whatsapp: profileWhatsApp,
        preferredDestinations: profilePrefDest,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Profile updated securely!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(`Failed to save profile: ${err.message}`);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRemoveSavedPackage = async (savedPkgId: string) => {
    if (!user || !confirm('Are you sure you want to remove this saved package?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private', savedPkgId));
      fetchSavedPackages(user.uid);
    } catch (err: any) {
      console.error('Error deleting saved package:', err);
      alert('Failed to remove saved package.');
    }
  };

  // Listen to Auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchCustomerBookings(currentUser.uid);
        fetchPrivateVault(currentUser.uid);
        fetchSavedAiItineraries(currentUser.uid);
        fetchSavedPackages(currentUser.uid);
        fetchUserProfile(currentUser.uid);
      }
    });
    return () => unsub();
  }, []);

  // Compute next upcoming trip helper
  const getNextUpcomingTrip = () => {
    if (!bookings || bookings.length === 0) return null;
    const now = new Date();
    
    // Filter active bookings (not cancelled) with a travelDate
    const active = bookings.filter(b => b.status !== 'Cancelled' && b.travelDate);
    if (active.length === 0) return null;

    // Sort by travelDate ascending
    const sorted = [...active].sort((a: any, b: any) => {
      const dateA = new Date(a.travelDate).getTime();
      const dateB = new Date(b.travelDate).getTime();
      return dateA - dateB;
    });

    // Find the first one that is today or in the future
    const futureTrip = sorted.find((b: any) => {
      const tDate = new Date(b.travelDate);
      tDate.setHours(23, 59, 59, 999);
      return tDate.getTime() >= now.getTime();
    });

    // Fallback to closest trip
    return futureTrip || sorted[0] || null;
  };

  const nextTrip = getNextUpcomingTrip();

  // Fetch weather alerts for the next upcoming trip
  useEffect(() => {
    if (!nextTrip || !nextTrip.destination) {
      setWeatherAlert(null);
      return;
    }

    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError('');
      try {
        console.log(`[CLIENT] Fetching real-time travel alerts for: ${nextTrip.destination}`);
        const response = await fetch(`/api/weather-alerts?destination=${encodeURIComponent(nextTrip.destination)}`);
        if (!response.ok) {
          throw new Error('Could not retrieve regional weather.');
        }
        const data = await response.json();
        setWeatherAlert(data);
      } catch (err: any) {
        console.warn('Error fetching travel weather:', err);
        setWeatherError(err.message || 'Failed to load live travel alerts.');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [nextTrip?.destination]);

  // Check for email sign-in link on mount
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setIsVerifyingLink(true);
      const savedEmail = window.sessionStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        setNeedEmailConfirmation(true);
        setIsVerifyingLink(false);
      } else {
        handleCompleteSignInWithEmailLink(savedEmail);
      }
    }
  }, []);

  const handleCompleteSignInWithEmailLink = async (emailToConfirm: string) => {
    setIsVerifyingLink(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const result = await signInWithEmailLink(auth, emailToConfirm.trim(), window.location.href);
      window.sessionStorage.removeItem('emailForSignIn');
      setAuthSuccess('Successfully signed in using secure passwordless email link!');
      setUser(result.user);
      // Clean query parameters from URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (err: any) {
      console.error('Email link sign in error:', err);
      let errMsg = err.message || String(err);
      if (err.code === 'auth/invalid-action-code') {
        errMsg = 'The sign-in link is invalid or has expired. Please request a new one.';
      }
      setAuthError(errMsg);
    } finally {
      setIsVerifyingLink(false);
      setNeedEmailConfirmation(false);
    }
  };

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    // Keep redirect path matching the current origin
    const redirectUrl = window.location.origin + window.location.pathname;

    const actionCodeSettings = {
      url: redirectUrl,
      handleCodeInApp: true,
      iOS: {
        bundleId: iosBundleId || 'com.pravaahtravels.ios'
      },
      android: {
        packageName: androidPackageName || 'com.pravaahtravels.android',
        installApp: true,
        minimumVersion: '12'
      }
    };

    try {
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.sessionStorage.setItem('emailForSignIn', email.trim());
      setEmailLinkSentTo(email.trim());
      setAuthSuccess(`A passwordless sign-in link has been sent to ${email.trim()}. Click the link in your email to authenticate securely.`);
    } catch (err: any) {
      console.error('Passwordless send error:', err);
      let errMsg = err.message || String(err);
      if (err.code === 'auth/unauthorized-domain') {
        errMsg = `The domain ${window.location.host} is not in your authorized domains list in Firebase Console. Please add it to Authentication -> Settings -> Authorized Domains.`;
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // ----------------------------------------------------
  // AUTHENTICATION LOGIC
  // ----------------------------------------------------
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    setAuthLoading(true);

    try {
      if (authTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthSuccess('Logged in successfully!');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Save display name as fallback
        if (displayName && userCred.user) {
          // Keep display name local if needed, or simply update state
          setAuthSuccess('Account created successfully!');
        }
      }
    } catch (err: any) {
      console.error('Customer Auth Error:', err);
      let msg = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email address or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already in use. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new GithubAuthProvider();
      
      await signInWithPopup(auth, provider);
      setAuthSuccess(`Logged in securely via ${providerName === 'google' ? 'Google' : 'GitHub'}!`);
    } catch (err: any) {
      console.error('Social login failed:', err);
      setAuthError(err.message || String(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  // ----------------------------------------------------
  // ----------------------------------------------------
  // DATA FETCHING (FIRESTORE) WITH LOCALSTORAGE FALLBACKS
  // ----------------------------------------------------
  const [portalError, setPortalError] = useState('');

  // ----------------------------------------------------
  // ----------------------------------------------------
  // DATA FETCHING (FIRESTORE)
  // ----------------------------------------------------
  const fetchCustomerBookings = async (uid: string) => {
    setBookingsLoading(true);
    setPortalError('');
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', uid)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort client side
      fetched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(fetched);
    } catch (err: any) {
      console.error('Error fetching bookings from Firestore:', err);
      setPortalError(`Failed to fetch bookings: ${err.message || String(err)}`);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchPrivateVault = async (uid: string) => {
    setVaultLoading(true);
    setPortalError('');
    try {
      // Fetch from /users/{userId}/private
      const q = collection(db, 'users', uid, 'private');
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((item: any) => item.type !== 'ai_itinerary');
      setVaultDocs(fetched);
    } catch (err: any) {
      console.error('Error fetching private vault from Firestore:', err);
      setPortalError(`Failed to fetch private vault: ${err.message || String(err)}`);
      setVaultDocs([]);
    } finally {
      setVaultLoading(false);
    }
  };

  const fetchSavedAiItineraries = async (uid: string) => {
    setPortalError('');
    try {
      const q = query(
        collection(db, 'users', uid, 'private'),
        where('type', '==', 'ai_itinerary')
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedAiItineraries(fetched);
    } catch (err: any) {
      console.error('Error fetching saved itineraries from Firestore:', err);
      setPortalError(`Failed to fetch saved itineraries: ${err.message || String(err)}`);
      setSavedAiItineraries([]);
    }
  };

  // ----------------------------------------------------
  // SUBMIT ACTIONS
  // ----------------------------------------------------
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setBookingSubmitting(true);
    const bookingData = {
      userId: user.uid,
      customerName: newBookingName,
      customerPhone: newBookingPhone,
      customerWhatsApp: newBookingWhatsApp,
      customerEmail: newBookingEmail,
      destination: newBookingDest,
      packageTitle: newBookingPackage || 'Custom Package / Personalized Trip',
      travelDate: newBookingDate,
      adults: Number(newBookingAdults),
      children: Number(newBookingChildren),
      pickupCity: newBookingPickupCity,
      budget: `₹${newBookingBudget.toLocaleString('en-IN')}`,
      price: 0,
      specialRequests: newBookingRequests,
      status: 'New Lead', // CRM Status initial value
      paymentStatus: 'Unpaid',
      createdAt: new Date().toISOString(),
      notes: [],
      assignedStaff: '',
      followUpDate: ''
    };

    try {
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Trigger automatic transactional emails
      triggerSystemEmail('booking-received', bookingData.customerEmail, {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        packageTitle: bookingData.packageTitle,
        travelDate: bookingData.travelDate,
        adults: bookingData.adults,
        children: bookingData.children,
        pickupCity: bookingData.pickupCity,
        budget: bookingData.budget,
        specialRequests: bookingData.specialRequests
      });

      triggerSystemEmail('new-booking', 'yash.km06@gmail.com', {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        customerWhatsApp: bookingData.customerWhatsApp,
        packageTitle: bookingData.packageTitle,
        travelDate: bookingData.travelDate,
        adults: bookingData.adults,
        children: bookingData.children,
        pickupCity: bookingData.pickupCity,
        budget: bookingData.budget,
        specialRequests: bookingData.specialRequests
      });

    } catch (err: any) {
      console.error('Firestore booking submission failed:', err);
      alert(`Booking submission failed: ${err.message || String(err)}`);
    } finally {
      setShowNewBookingModal(false);
      setNewBookingDest('');
      setNewBookingDate('');
      setNewBookingTravelers(1);
      setNewBookingRequests('');
      setNewBookingPhone('');
      setNewBookingWhatsApp('');
      setNewBookingPickupCity('');
      setNewBookingChildren(0);
      setNewBookingAdults(2);
      setBookingSubmitting(false);
      fetchCustomerBookings(user.uid);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    if (!user) return;
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, { status: 'Cancelled' });

      // Trigger booking-cancelled email notification
      const cancelledBooking = bookings.find(b => b.id === bookingId);
      if (cancelledBooking) {
        triggerSystemEmail('booking-cancelled', cancelledBooking.customerEmail || cancelledBooking.email || user.email || '', {
          customerName: cancelledBooking.customerName || user.displayName || 'Traveler',
          bookingId: bookingId,
          packageTitle: cancelledBooking.packageTitle,
          travelDate: cancelledBooking.travelDate
        });
      }
    } catch (err: any) {
      console.error('Firestore cancel failed:', err);
      alert(`Failed to cancel booking: ${err.message || String(err)}`);
    }
    fetchCustomerBookings(user.uid);
  };

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking || !user) return;

    setPaymentLoading(true);
    try {
      const docRef = doc(db, 'bookings', payingBooking.id);
      await updateDoc(docRef, { paymentStatus: 'Paid', status: 'Confirmed' });

      // Trigger booking-confirmed email notification
      triggerSystemEmail('booking-confirmed', payingBooking.customerEmail || payingBooking.email || user.email || '', {
        customerName: payingBooking.customerName || user.displayName || 'Traveler',
        bookingId: payingBooking.id,
        packageTitle: payingBooking.packageTitle,
        travelDate: payingBooking.travelDate
      });

      setPaymentSuccess(true);
      setTimeout(() => {
        setPayingBooking(null);
        setPaymentSuccess(false);
        setPaymentCardNum('');
        setPaymentExpiry('');
        setPaymentCvv('');
        fetchCustomerBookings(user.uid);
      }, 2000);
    } catch (err: any) {
      console.error('Firestore payment failed:', err);
      alert(`Payment submission failed: ${err.message || String(err)}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAddVaultDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vaultTitle || !vaultContent) return;

    setVaultSubmitting(true);
    const docData = {
      userId: user.uid,
      title: vaultTitle,
      content: vaultContent,
      category: vaultCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'users', user.uid, 'private'), docData);
    } catch (err: any) {
      console.error('Firestore vault save failed:', err);
      alert(`Failed to save document to Private Vault: ${err.message || String(err)}`);
    } finally {
      setShowAddVaultModal(false);
      setVaultTitle('');
      setVaultContent('');
      setVaultSubmitting(false);
      fetchPrivateVault(user.uid);
    }
  };

  const handleDeleteVaultDoc = async (docId: string) => {
    if (!user || !window.confirm('Delete this record permanently from your private vault?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private', docId));
    } catch (err: any) {
      console.error('Firestore delete failed:', err);
      alert(`Failed to delete document: ${err.message || String(err)}`);
    }
    fetchPrivateVault(user.uid);
  };

  // ----------------------------------------------------
  // GEMINI AI PERSONALIZED ITINERARY GENERATOR
  // ----------------------------------------------------
  const handleGenerateAiItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError('');
    setAiResult(null);

    if (!aiDest) {
      setAiError('Please enter a destination.');
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch('/api/generate-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: aiDest,
          duration: aiDuration,
          budget: aiBudget,
          vibe: aiVibe,
          specialRequests: aiRequests
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || 'Server error generating package.');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error('AI Gen Error:', err);
      setAiError(err.message || 'The AI planner was unable to generate your package. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiItinerary = async () => {
    if (!user || !aiResult) return;
    setSavingAi(true);

    const docData = {
      userId: user.uid,
      type: 'ai_itinerary',
      title: aiResult.title,
      destination: aiDest,
      duration: aiResult.duration,
      budget: Number(aiBudget),
      vibe: aiVibe,
      itinerary: aiResult.itinerary,
      inclusions: aiResult.inclusions,
      exclusions: aiResult.exclusions,
      tips: aiResult.tips,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'users', user.uid, 'private'), docData);
      alert('Custom AI package saved securely to your Private Vault!');
    } catch (err: any) {
      console.error('Firestore save AI failed:', err);
      alert(`Failed to save AI package: ${err.message || String(err)}`);
    } finally {
      setSavingAi(false);
      fetchSavedAiItineraries(user.uid);
    }
  };

  // ----------------------------------------------------
  // SUB-RENDER: LOGIN / REGISTER FORMS
  // ----------------------------------------------------
  if (isVerifyingLink) {
    return (
      <div className="relative flex min-h-[86vh] items-center justify-center overflow-hidden bg-stone-950 px-4 py-16 font-sans" id="verifying-link-box">
        <img
          src="https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1800&q=80"
          alt="Himalayan pass"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/92 via-stone-950/70 to-stone-950/35" />
        <div className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/12 p-8 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 ring-1 ring-white/15">
            <RefreshCw className="h-9 w-9 animate-spin text-[#5eead4]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#fbbf24]">Secure portal</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Securing Your Connection</h2>
          <p className="mt-3 text-sm leading-7 text-stone-200">Checking secure sign-in link... Please wait while we authenticate your session.</p>
        </div>
      </div>
    );
  }

  if (needEmailConfirmation) {
    return (
      <div className="relative flex min-h-[86vh] items-center justify-center overflow-hidden bg-stone-950 px-4 py-16 font-sans" id="email-confirm-box">
        <img
          src="https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=1800&q=80"
          alt="Sacred Himalayan valley"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/92 via-stone-950/72 to-stone-950/35" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/14 p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-[#fbbf24] ring-1 ring-white/15">
              <Lock className="h-7 w-7 stroke-[2]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#fbbf24]">Passwordless access</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Confirm Your Email</h2>
            <p className="mt-2 text-sm leading-7 text-stone-200">Please enter your email address to complete signing in with your email link.</p>
          </div>

          {authError && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200/60 bg-rose-50/95 p-4 text-xs font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleCompleteSignInWithEmailLink(confirmEmail); }} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-200">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/92 px-4 py-3.5 text-sm font-semibold text-stone-900 shadow-inner focus:border-[#5eead4] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingLink}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0f766e] py-3.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_38px_rgba(15,118,110,0.32)] transition hover:-translate-y-1 hover:bg-[#0d5f59] disabled:opacity-60"
            >
              {isVerifyingLink ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Verify & Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-[86vh] items-center overflow-hidden bg-stone-950 px-4 py-10 font-sans sm:px-6 lg:px-8" id="customer-login-box">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80"
          alt="Luxury Himalayan landscape"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/95 via-stone-950/75 to-stone-950/35" />
        <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-transparent to-stone-950/20" />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_520px]">
          <div className="hidden max-w-2xl space-y-7 text-white lg:block">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#fbbf24] backdrop-blur-md">
              Pravaah Private Portal
            </span>
            <div className="space-y-5">
              <h1 className="text-6xl font-semibold leading-[1.02] tracking-tight">
                Your journeys, documents, and memories in one secure place.
              </h1>
              <p className="max-w-xl text-base leading-8 text-stone-200">
                Sign in to manage bookings, open your private travel vault, save AI-designed itineraries, and publish verified trip stories.
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Calendar className="mb-2 h-5 w-5 text-[#5eead4]" />
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">Bookings</span>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Lock className="mb-2 h-5 w-5 text-[#fbbf24]" />
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">Vault</span>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Sparkles className="mb-2 h-5 w-5 text-[#f97350]" />
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">AI Trips</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[2rem] border border-white/15 bg-white/14 p-4 text-white shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-6">
            <div className="rounded-[1.5rem] bg-white/94 p-5 text-stone-950 shadow-2xl sm:p-7">
              {/* Upper Brand */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0f766e]/10 text-[#0f766e] ring-1 ring-[#0f766e]/15">
                  <User className="h-7 w-7 stroke-[2]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#0f766e]">Luxury Travel Workspace</span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Customer Portal</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-stone-500">Access secure bookings, travel documents & personalized AI packages</p>
              </div>

              {/* Tab switchers */}
              <div className="mb-6 grid grid-cols-3 rounded-full bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`rounded-full py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                    authTab === 'login' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('emailLink'); setAuthError(''); setAuthSuccess(''); }}
                  className={`rounded-full py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                    authTab === 'emailLink' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Email Link
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`rounded-full py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                    authTab === 'register' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Status Box */}
              {authError && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Passwordless Email Link Form */}
              {authTab === 'emailLink' ? (
                <form onSubmit={handleSendEmailLink} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                    <p className="mt-2 text-xs leading-6 text-stone-500">We'll email you a secure link to log in instantly without passwords.</p>
                  </div>

                  {/* Custom Platform Configurations */}
                  <div className="mt-4 space-y-4 rounded-3xl border border-stone-200 bg-[#fffaf1] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center text-xs font-extrabold text-stone-800">
                        <Shield className="mr-2 h-4 w-4 text-[#0f766e]" />
                        Redirect Platform Settings
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-stone-500 shadow-sm">Android & Apple</span>
                    </div>
                    <p className="text-xs leading-6 text-stone-500">
                      These package details will be packaged into the Firebase Dynamic/App Link settings to open your native apps natively.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-stone-500">Android Package Name</label>
                        <input
                          type="text"
                          value={androidPackageName}
                          onChange={(e) => setAndroidPackageName(e.target.value)}
                          placeholder="com.example.android"
                          className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 font-mono text-[11px] font-medium focus:border-[#0f766e] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-stone-500">Apple iOS Bundle ID</label>
                        <input
                          type="text"
                          value={iosBundleId}
                          onChange={(e) => setIosBundleId(e.target.value)}
                          placeholder="com.example.ios"
                          className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 font-mono text-[11px] font-medium focus:border-[#0f766e] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0f766e] py-3.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_38px_rgba(15,118,110,0.24)] transition hover:-translate-y-1 hover:bg-[#0d5f59] disabled:opacity-60"
                  >
                    {authLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>Send Secure Passwordless Link</span>
                    )}
                  </button>

                  {/* Instruction Guides toggle */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setShowPlatformConfigGuide(!showPlatformConfigGuide)}
                      className="cursor-pointer text-xs font-extrabold text-[#0f766e] underline decoration-[#0f766e]/30 underline-offset-4 hover:text-[#0d5f59]"
                    >
                      {showPlatformConfigGuide ? 'Hide Setup Guide for Web, Android & Apple iOS' : 'Show Setup Guide for Web, Android & Apple iOS'}
                    </button>
                  </div>

                  {showPlatformConfigGuide && (
                    <div className="mt-4 animate-fadeIn space-y-4 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-xs text-stone-800">
                      <h4 className="flex border-b border-stone-200 pb-2 font-extrabold text-[#0f766e]">
                        <Info className="mr-2 h-4 w-4" /> Multi-Platform Passwordless Authentication Configuration Guide
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">1. Firebase Console Enablement</span>
                          <p className="text-[11px] leading-relaxed text-stone-500">
                            Go to <strong className="font-semibold text-stone-700">Authentication &gt; Sign-in method</strong>. Enable <strong className="font-semibold text-stone-700">Email/Password</strong>, check <strong className="font-semibold text-stone-700">Email link (passwordless sign-in)</strong>, and click Save.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">2. Web Configuration</span>
                          <p className="mb-2 text-[11px] leading-relaxed text-stone-500">
                            Authorized Domains: In Firebase, go to <strong className="font-semibold text-stone-700">Authentication &gt; Settings &gt; Authorized Domains</strong> and ensure your web URL (e.g., <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">{window.location.host}</code>) is allowed.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">3. Android Setup (App Links)</span>
                          <p className="space-y-1 text-[11px] leading-relaxed text-stone-500">
                            <span className="block">- <strong className="font-semibold text-stone-700">Fingerprints:</strong> In Firebase Project Settings, add your Android App with Package Name <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">{androidPackageName}</code> and add SHA-1 / SHA-256 signatures.</span>
                            <span className="block">- <strong className="font-semibold text-stone-700">Assets Link:</strong> Place your <code className="font-mono text-[10px]">assetlinks.json</code> in your domain's <code className="font-mono text-[10px]">.well-known/assetlinks.json</code> location to match your fingerprints.</span>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">4. Apple iOS Setup (Universal Links)</span>
                          <p className="space-y-1 text-[11px] leading-relaxed text-stone-500">
                            <span className="block">- <strong className="font-semibold text-stone-700">Bundle ID & Team ID:</strong> Add an iOS App inside Firebase console with Bundle ID <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">{iosBundleId}</code> and add your App Store ID and Apple Team ID.</span>
                            <span className="block">- <strong className="font-semibold text-stone-700">AASA:</strong> Deploy your <code className="font-mono text-[10px]">apple-app-site-association</code> file to <code className="font-mono text-[10px]">.well-known/apple-app-site-association</code> domain file.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-5">
                  {authTab === 'register' && (
                    <div className="rounded-3xl border border-[#0f766e]/15 bg-[#0f766e]/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-stone-900">
                        <User className="h-4 w-4 text-[#0f766e]" />
                        Premium traveler profile
                      </div>
                      <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Yash Sharma"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0f766e] py-3.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_38px_rgba(15,118,110,0.24)] transition hover:-translate-y-1 hover:bg-[#0d5f59] disabled:opacity-60"
                  >
                    {authLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{authTab === 'login' ? 'Sign In Securely' : 'Register Account'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Social Authentication Row */}
              <div className="relative my-7 text-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-200"></span>
                </div>
                <span className="relative bg-white px-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-stone-400">Or Continue With</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-xs font-extrabold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e]/30 hover:bg-[#fffaf1]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-xs font-extrabold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e]/30 hover:bg-[#fffaf1]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-stone-200 bg-[#fffaf1] p-4 text-[11px] leading-6 text-stone-600">
                <strong className="text-stone-900">Security Highlight:</strong> We employ a strict user matching design. Booking details and private documents can ONLY be read by you. Not even our travel operators can break into your Private Vault.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // PORTAL LOGGED-IN VIEW
  // ----------------------------------------------------
  const portalUserName = profileName || user.displayName || user.email?.split('@')[0] || 'Traveler';
  const portalAvatarInitial = portalUserName.charAt(0).toUpperCase();
  const currentDateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
  const confirmedTrips = bookings.filter(b => b.status === 'Confirmed');
  const completedTrips = confirmedTrips.length;
  const upcomingBookings = bookings.filter(b => b.status !== 'Cancelled' && b.status !== 'Completed');
  const pendingEnquiries = bookings.filter(b => b.status === 'Pending' || b.status === 'New Lead' || b.status === 'New').length;
  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Recently';
  const getBookingImage = (booking: any) => {
    const savedMatch = savedPackages.find(saved => saved.title === booking.packageTitle || saved.destination === booking.destination);
    return getTravelImage(booking.imageUrl || booking.packageImageUrl || savedMatch?.imageUrl);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f2] px-4 py-8 font-sans sm:px-6 lg:px-8" id="customer-portal-active-root">
      <div className="mx-auto max-w-7xl space-y-8">
      
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#081E2A] p-5 text-white shadow-[0_24px_70px_rgba(8,30,42,0.24)] sm:p-7 lg:p-8">
        <img
          src={getTravelImage('https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1800&q=80')}
          alt="Luxury mountain dashboard"
          className="absolute inset-0 h-full w-full object-cover opacity-38"
          referrerPolicy="no-referrer"
          onError={handleTravelImageError}
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#081E2A] via-[#081E2A]/86 to-[#081E2A]/45" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="rounded-[20px] border border-white/14 bg-white/10 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/25 bg-[#4DA528] text-3xl font-extrabold text-white shadow-xl">
                {user.photoURL ? (
                  <img src={getTravelImage(user.photoURL)} alt={portalUserName} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                ) : (
                  <span>{portalAvatarInitial}</span>
                )}
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#4DA528] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white">Customer Portal</span>
                  <span className="flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"><Shield className="mr-1.5 h-3.5 w-3.5 text-emerald-300" /> Secure</span>
                </div>
                <p className="font-serif text-[28px] italic leading-none text-[#4DA528]">Welcome back</p>
                <h1 className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight text-white sm:text-[44px]">{portalUserName}</h1>
                <p className="mt-2 text-sm text-white/72">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[18px] border border-white/14 bg-white/10 p-5 backdrop-blur-md">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55">Today</span>
              <p className="mt-2 text-xl font-bold text-white">{currentDateLabel}</p>
              <p className="mt-2 text-sm leading-6 text-white/68">Your bookings, vault, saved trips, and reviews are ready in one luxury travel dashboard.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onNavigateToHome}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
              >
                <Compass className="h-4 w-4" />
                <span>Browse Packages</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[5px] border border-white/20 bg-white/10 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-white/18"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" id="customer-dashboard-stats">
        {[
          ['Upcoming Bookings', upcomingBookings.length, Calendar, 'from-[#4DA528]/12 to-white'],
          ['Completed Trips', completedTrips, Briefcase, 'from-[#FF970D]/14 to-white'],
          ['Wishlist', savedPackages.length, Heart, 'from-rose-100 to-white'],
          ['Reviews', reviewSuccess ? 1 : 0, Star, 'from-amber-100 to-white'],
          ['Pending Enquiries', pendingEnquiries, AlertCircle, 'from-sky-100 to-white'],
        ].map(([label, value, Icon, tone]) => {
          const StatIcon = Icon as typeof Calendar;
          return (
            <div key={label as string} className={`group rounded-[18px] border border-stone-200 bg-linear-to-br ${tone as string} p-5 shadow-[0_12px_35px_rgba(18,38,32,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(18,38,32,0.12)]`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500">{label as string}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4DA528] shadow-sm">
                  <StatIcon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-5 text-3xl font-extrabold text-stone-950">{value as number}</p>
            </div>
          );
        })}
      </section>

      {portalError && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-sm">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-600 animate-bounce" />
          <span>Firestore Error: {portalError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto rounded-[18px] border border-stone-200 bg-white p-2 shadow-[0_12px_35px_rgba(18,38,32,0.06)]">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'bookings' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Calendar className="w-4.5 h-4.5" />
          <span>My Bookings & Requests ({bookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-assistant')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'ai-assistant' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5 text-teal-500 animate-pulse" />
          <span>AI Travel Assistant (Personalized)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('private-vault')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'private-vault' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Lock className="w-4.5 h-4.5 text-amber-500" />
          <span>Confidential Private Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved-packages')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'saved-packages' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Heart className="w-4.5 h-4.5 text-rose-500 fill-current" />
          <span>Saved Packages ({savedPackages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('travel-history')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'travel-history' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Briefcase className="w-4.5 h-4.5 text-[#008080]" />
          <span>Travel History ({bookings.filter(b => b.status === 'Confirmed').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'profile' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <User className="w-4.5 h-4.5 text-teal-600" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'reviews' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Star className="w-4.5 h-4.5 text-[#F4C430] fill-current" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'bookings' && (
        <div className="space-y-8" id="bookings-panel">
          
          {/* REAL-TIME TRAVEL ALERTS BANNER */}
          <div className="border border-stone-200 bg-stone-50 rounded-xl p-5 shadow-xs" id="realtime-weather-alerts-banner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#008080]/10 text-[#008080] rounded-lg">
                  <CloudSun className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] bg-[#008080]/15 text-[#008080] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">Pravaah Live Radar</span>
                  <h3 className="text-sm font-bold text-stone-850 flex items-center gap-1.5 mt-0.5">
                    <span>Real-time Regional Travel Alerts</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </h3>
                </div>
              </div>

              {nextTrip && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!nextTrip.destination) return;
                    setWeatherLoading(true);
                    setWeatherError('');
                    try {
                      const response = await fetch(`/api/weather-alerts?destination=${encodeURIComponent(nextTrip.destination)}`);
                      if (!response.ok) throw new Error('Could not update weather.');
                      const data = await response.json();
                      setWeatherAlert(data);
                    } catch (err: any) {
                      setWeatherError(err.message || 'Failed to update travel weather.');
                    } finally {
                      setWeatherLoading(false);
                    }
                  }}
                  disabled={weatherLoading}
                  className="px-3 py-1.5 border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 cursor-pointer self-start md:self-auto"
                >
                  <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                  <span>Update Safety Feeds</span>
                </button>
              )}
            </div>

            {weatherLoading ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-[#008080] animate-spin mx-auto" />
                <p className="text-xs text-stone-500 font-light">Contacting Himalayan meteorological satellites for {nextTrip?.destination}...</p>
              </div>
            ) : !nextTrip ? (
              <div className="py-6 flex flex-col items-center text-center max-w-lg mx-auto space-y-3">
                <Compass className="w-8 h-8 text-stone-300" />
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-widest">No Active Upcoming Trips Detected</h4>
                  <p className="text-xs text-stone-500 font-light leading-relaxed mt-1">
                    Book an upcoming package or request a custom itinerary to receive real-time, AI-powered weather feeds, safety radar advisories, and packing recommendations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai-assistant')}
                  className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all shadow cursor-pointer"
                >
                  Configure AI Trip
                </button>
              </div>
            ) : weatherError ? (
              <div className="py-6 flex flex-col items-center text-center max-w-md mx-auto space-y-3">
                <AlertCircle className="w-7 h-7 text-rose-500" />
                <div>
                  <p className="text-xs text-rose-800 font-semibold">{weatherError}</p>
                  <p className="text-[11px] text-stone-500 font-light mt-0.5">Please check your network connection or try updating manually.</p>
                </div>
              </div>
            ) : weatherAlert ? (
              <div className="pt-5 space-y-5" id="weather-alert-active-content">
                {/* Weather alert status card */}
                <div className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  weatherAlert.safetyStatus === 'Safe' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-950' :
                  weatherAlert.safetyStatus === 'Caution advised' ? 'bg-amber-500/5 border-amber-500/20 text-amber-950' :
                  'bg-rose-500/5 border-rose-500/20 text-rose-950'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${
                      weatherAlert.safetyStatus === 'Safe' ? 'bg-emerald-500/10 text-emerald-600' :
                      weatherAlert.safetyStatus === 'Caution advised' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-rose-500/10 text-rose-600'
                    }`}>
                      {weatherAlert.safetyStatus === 'Safe' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-none">Upcoming Trip Destination</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider leading-none ${
                          weatherAlert.safetyStatus === 'Safe' ? 'bg-emerald-500/15 text-emerald-700' :
                          weatherAlert.safetyStatus === 'Caution advised' ? 'bg-amber-500/15 text-amber-700' :
                          'bg-rose-500/15 text-rose-700'
                        }`}>
                          {weatherAlert.safetyStatus}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-stone-850 mt-1">{weatherAlert.destination}</h4>
                      <p className="text-xs text-stone-500 font-light mt-0.5">
                        Scheduled departure: <strong className="font-semibold text-stone-700">{nextTrip.travelDate}</strong> ({nextTrip.packageTitle})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 border-stone-200/60 pt-3 md:pt-0 shrink-0">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-150">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      <div className="text-left">
                        <span className="text-[8px] text-stone-400 font-bold uppercase tracking-wider block leading-none">Temperature</span>
                        <span className="text-xs font-bold text-stone-850 leading-none inline-block mt-0.5">{weatherAlert.temperature}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-150">
                      <CloudSun className="w-4 h-4 text-blue-500" />
                      <div className="text-left">
                        <span className="text-[8px] text-stone-400 font-bold uppercase tracking-wider block leading-none">Condition</span>
                        <span className="text-xs font-bold text-stone-850 leading-none inline-block mt-0.5 truncate max-w-[120px]">{weatherAlert.condition}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3.5 rounded-lg border border-stone-150 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-stone-400" />
                        <span>Landslide Risk</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                        weatherAlert.landslideRisk === 'Low' ? 'bg-emerald-50 text-emerald-700' :
                        weatherAlert.landslideRisk === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {weatherAlert.landslideRisk} Risk
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-800 pt-1">Route Safety Index</p>
                    <p className="text-[11px] text-stone-500 font-light leading-relaxed">
                      Safety checks run 3x daily. High monsoon or freezing zones are dynamically mapped by our logistics scouts.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-stone-150 space-y-1">
                    <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Map className="w-3 h-3 text-stone-400" />
                      <span>Highway Route Status</span>
                    </span>
                    <p className="text-xs font-bold text-stone-800 leading-tight pt-1">{weatherAlert.routeStatus}</p>
                    <p className="text-[11px] text-stone-500 font-light leading-relaxed">
                      Main mountain passes, local bypasses and road conditions for state and national highways.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-stone-150 space-y-1">
                    <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-stone-400" />
                      <span>Packing & Gear Guide</span>
                    </span>
                    <p className="text-xs font-bold text-stone-800 leading-tight pt-1">{weatherAlert.packingRecommendation}</p>
                    <p className="text-[11px] text-stone-500 font-light leading-relaxed">
                      Himalayan weather fluctuates swiftly. Ensure correct gear is ready for higher passes.
                    </p>
                  </div>
                </div>

                {/* Final safety recommendation banner */}
                <div className="p-3 bg-stone-100 border border-stone-200/60 rounded-lg flex items-start gap-2 text-[11px] text-stone-600 font-light leading-relaxed">
                  <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-700">Pravaah Expedition Advisory:</span> {weatherAlert.advisoryMessage}
                    <span className="block text-[9px] text-stone-400 font-bold uppercase mt-1 font-sans">Satellite Feed Sync: {weatherAlert.lastUpdated}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-stone-500 font-light">Loading custom travel feed for {nextTrip.destination}...</p>
              </div>
            )}
          </div>
          
          {/* LIVE STATUS TRACKER & WEATHER ALERTS (UGC & HEALTH ALERTS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="emergency-support-grid">
            
            {/* Live Weather & Route Feed */}
            <div className="bg-stone-900 text-stone-100 rounded-xl p-5 border border-stone-800 relative overflow-hidden shadow-md">
              {/* Decorative radar pulses */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>Live Radar</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Himalayan Route Feeds</span>
                  </h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed font-light">Real-time weather, landslide and helicopter clearances for current active zones.</p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-stone-800">
                  <div className="flex items-start justify-between text-xs font-light">
                    <span className="text-stone-400 font-bold">Kedarnath Temple Route:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>🌤️ Clear skies (Permits running)</span>
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-xs font-light">
                    <span className="text-stone-400 font-bold">Rishikesh Rafting Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>🌊 Water levels normal (All clear)</span>
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-xs font-light">
                    <span className="text-stone-400 font-bold">Rohtang & Manali Valley:</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <span>❄️ Light Frost (Passes clear)</span>
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-xs font-light">
                    <span className="text-stone-400 font-bold">VIP Dehradun Heli Shuttle:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>🚁 On Schedule</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Emergency Support Box */}
            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Emergency & Ground Support</h4>
                  <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[8.5px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Online 24/7</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-800">Direct WhatsApp Helpline</h3>
                <p className="text-xs text-stone-600 leading-relaxed font-light">
                  Are you in the middle of a trip or need immediate logistics adjustments? Speak directly with <strong>Rajesh Sharma</strong>, our veteran Senior Himalayan Coordinator.
                </p>
              </div>

              <div className="pt-4 border-t border-emerald-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" 
                    alt="Coordinator" 
                    className="w-9 h-9 rounded-full border border-emerald-200 shadow-xs shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-stone-800">Rajesh Sharma</h5>
                    <span className="text-[10px] text-stone-400 font-light">Lead Logistics Sherpa</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/919999999999?text=Hi%20Pravaah%20Travels,%20I%20am%20registered%20on%20the%20Customer%20Portal%20and%20need%20immediate%20trip%20assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[10px] rounded transition shadow-md flex items-center gap-1 cursor-pointer w-full sm:w-auto text-center justify-center shrink-0"
                >
                  <span className="font-bold">Get Help on WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bookings Title Header */}
          <div className="flex flex-col gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">My Bookings</span>
              <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Your Booking Orders</h3>
              <p className="mt-1 text-sm text-stone-500">Track upcoming journeys, confirmations, requests, and dues.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewBookingModal(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
            >
              <Plus className="w-4 h-4" />
              <span>Request Custom Package</span>
            </button>
          </div>

          {bookingsLoading ? (
            <div className="rounded-[18px] border border-stone-200 bg-white py-14 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#008080] animate-spin mx-auto mb-2" />
              <p className="text-xs text-stone-500">Retrieving secure records from Firestore...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#4DA528]/10 to-transparent" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                <Compass className="h-10 w-10" />
              </div>
              <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">No bookings yet</h4>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">
                You haven't requested any custom trip packages yet. Create a personalized trip using our AI engine or request a booking now!
              </p>
              <div className="relative mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" onClick={() => setShowNewBookingModal(true)} className="rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]">
                  Request a Trip
                </button>
                <button type="button" onClick={() => setActiveTab('ai-assistant')} className="rounded-[5px] border border-stone-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">
                  Open AI Planner
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {bookings.map((booking) => {
                const isExpanded = expandedBookingId === booking.id;
                return (
                  <div 
                    key={booking.id}
                    className="group overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]"
                  >
                    <div className="relative h-52 overflow-hidden bg-stone-100">
                      <img
                        src={getBookingImage(booking)}
                        alt={booking.destination || booking.packageTitle || 'Travel booking'}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={handleTravelImageError}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-stone-950/70 via-transparent to-transparent" />
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <span className={`rounded bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                          booking.status === 'Confirmed' ? 'text-emerald-700' :
                          booking.status === 'Cancelled' ? 'text-rose-700' : 'text-amber-700'
                        }`}>
                          {booking.status}
                        </span>
                        <span className="rounded bg-[#4DA528] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                          {booking.paymentStatus || 'Unpaid'}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-white/75">
                          <MapPin className="h-4 w-4 text-[#4DA528]" />
                          {booking.destination || 'Custom Destination'}
                        </p>
                        <h4 className="mt-2 line-clamp-2 text-2xl font-extrabold leading-tight">{booking.packageTitle}</h4>
                      </div>
                    </div>

                    {/* Header Clickbar */}
                    <div 
                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                      className="flex cursor-pointer flex-col gap-4 p-5 transition-colors hover:bg-[#fffaf1] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-[12px] bg-stone-50 p-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Date</span>
                          <p className="mt-1 font-bold text-stone-900">{booking.travelDate || 'Flexible'}</p>
                        </div>
                        <div className="rounded-[12px] bg-stone-50 p-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Travelers</span>
                          <p className="mt-1 font-bold text-stone-900">{booking.travelers || ((booking.adults || 0) + (booking.children || 0)) || 1}</p>
                        </div>
                        <div className="col-span-2 rounded-[12px] bg-stone-50 p-3 sm:col-span-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Price</span>
                          <p className="mt-1 font-extrabold text-[#4DA528]">{formatPrice(booking.price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{new Date(booking.createdAt).toLocaleDateString()}</span>
                        <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expandable contents */}
                    {isExpanded && (
                      <div className="border-t border-stone-100 bg-stone-50/50 p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Financials card */}
                          <div className="bg-white border border-stone-150 p-4 rounded-lg">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Package Price</span>
                            <span className="text-xl font-bold text-[#008080]">{formatPrice(booking.price)}</span>
                            
                            <div className="border-t border-stone-100 my-3 pt-3 flex items-center justify-between">
                              <span className="text-xs text-stone-500">Dues Payment:</span>
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                booking.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {booking.paymentStatus}
                              </span>
                            </div>

                            {booking.paymentStatus !== 'Paid' && booking.status !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => setPayingBooking(booking)}
                                className="w-full mt-3 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded transition-colors flex items-center justify-center space-x-1 shadow-xs"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span>Complete Payment</span>
                              </button>
                            )}
                          </div>

                          {/* Request description */}
                          <div className="bg-white border border-stone-150 p-4 rounded-lg md:col-span-2 space-y-3">
                            <div>
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Special Requests</span>
                              <p className="text-xs text-stone-700 mt-1 whitespace-pre-wrap">
                                {booking.specialRequests || 'No special requests submitted.'}
                              </p>
                            </div>

                            {booking.status === 'Pending' && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-bold"
                                >
                                  Cancel Booking Request
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI Assistant Tab */}
      {activeTab === 'ai-assistant' && (
        <div className="space-y-6 animate-fade-in" id="ai-assistant-panel">
          <div>
            <h3 className="text-lg font-bold text-stone-850 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
              <span>Personalized AI Package Designer</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Let Pravaah AI design a custom trip matching your precise budget, style, and travel desires</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="bg-white p-6 rounded-xl border border-stone-150 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-850 uppercase tracking-wider border-b border-stone-100 pb-2">Plan Preferences</h4>
              
              <form onSubmit={handleGenerateAiItinerary} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Destination / Regions</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Manali & Solang Valley"
                    value={aiDest}
                    onChange={(e) => setAiDest(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Duration (Days)</label>
                    <select
                      value={aiDuration}
                      onChange={(e) => setAiDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((d) => (
                        <option key={d} value={d}>{d} Days</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Vibe / Style</label>
                    <select
                      value={aiVibe}
                      onChange={(e) => setAiVibe(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                    >
                      <option value="Adventure">Adventure & Trekking</option>
                      <option value="Pilgrimage">Peaceful Pilgrimage</option>
                      <option value="Cultural">Local Culture & Heritage</option>
                      <option value="Leisure">Relaxing Leisure</option>
                      <option value="Balanced">Balanced Mix</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Total Budget Target (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={aiBudget}
                    onChange={(e) => setAiBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Wishes / Constraints (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="E.g. strict vegetarian dining, avoid rough high-altitude treks, scenic drives preferred"
                    value={aiRequests}
                    onChange={(e) => setAiRequests(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] resize-none"
                  />
                </div>

                {aiError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded text-[11px] font-semibold flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center justify-center space-x-1"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                      <span>Drafting Custom Itinerary...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Craft Personalized Trip</span>
                    </>
                  )}
                </button>
              </form>

              {/* Saved custom itineraries list */}
              {savedAiItineraries.length > 0 && (
                <div className="pt-4 border-t border-stone-100">
                  <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Saved Bespoke Packages</h5>
                  <div className="space-y-2">
                    {savedAiItineraries.map((itinerary) => (
                      <button
                        key={itinerary.id}
                        type="button"
                        onClick={() => setAiResult(itinerary)}
                        className="w-full text-left p-2.5 bg-stone-50 border border-stone-200 rounded text-xs hover:border-[#008080] transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-stone-700 truncate mr-2">{itinerary.title}</span>
                        <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Output Display */}
            <div className="lg:col-span-2 space-y-6">
              {aiLoading ? (
                <div className="bg-white rounded-xl border border-stone-150 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[400px]">
                  <Sparkles className="w-12 h-12 text-[#008080] animate-pulse mb-4" />
                  <h4 className="text-base font-bold text-stone-800">Drafting Bespoke Adventure...</h4>
                  <p className="text-xs text-stone-500 max-w-sm mt-1.5 leading-relaxed">
                    Connecting to Google Gemini API securely. Processing your style inputs, curating daily scenic drives, local culinary secrets, and building a fully customized travel itinerary...
                  </p>
                </div>
              ) : aiResult ? (
                <div className="bg-white rounded-xl border border-stone-200 shadow-md overflow-hidden">
                  
                  {/* Banner */}
                  <div className="bg-[#008080] text-white p-6 relative">
                    <div className="absolute right-4 top-4 bg-teal-600/30 text-[10px] font-bold px-2 py-1 rounded-md text-teal-100 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Gemini Custom Plan
                    </div>
                    <span className="text-xs text-teal-100 font-bold uppercase tracking-wider block">{aiResult.duration} ({aiVibe})</span>
                    <h4 className="text-xl font-extrabold tracking-tight mt-1">{aiResult.title}</h4>
                    <p className="text-xs text-teal-100/90 mt-1">Tailored for Budget: {formatPrice(Number(aiBudget))}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Actions bar */}
                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="text-[11px] text-stone-400">Save this to access anytime in your portal</span>
                      <button
                        type="button"
                        onClick={handleSaveAiItinerary}
                        disabled={savingAi}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save to Profile</span>
                      </button>
                    </div>

                    {/* Itinerary */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-bold text-stone-850 uppercase tracking-wider">Daily Travel Log</h5>
                      <div className="relative border-l-2 border-stone-200 pl-4 ml-2 space-y-4 py-2">
                        {aiResult.itinerary?.map((item: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-[#008080]" />
                            <h6 className="text-xs font-bold text-stone-850">Day {item.day || idx + 1}: {item.title}</h6>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Inclusions / Exclusions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-100 pt-6">
                      <div className="bg-emerald-50/40 p-4 rounded-lg border border-emerald-100">
                        <h6 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center">
                          <Check className="w-4 h-4 mr-1.5" /> What Is Included
                        </h6>
                        <ul className="space-y-1.5 text-xs text-emerald-950">
                          {aiResult.inclusions?.map((inc: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span>•</span>
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-stone-50 p-4 rounded-lg border border-stone-150">
                        <h6 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5 flex items-center">
                          <Info className="w-4 h-4 mr-1.5" /> Excluded Items
                        </h6>
                        <ul className="space-y-1.5 text-xs text-stone-600">
                          {aiResult.exclusions?.map((exc: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span>•</span>
                              <span>{exc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Expert Tips */}
                    {aiResult.tips && aiResult.tips.length > 0 && (
                      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-lg">
                        <h6 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2.5 flex items-center">
                          <Star className="w-4 h-4 mr-1.5 text-amber-600" /> Expert Local Tips
                        </h6>
                        <ul className="space-y-1.5 text-xs text-stone-700">
                          {aiResult.tips.map((tip: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-amber-500 font-bold">★</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl border border-stone-200 border-dashed p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                  <Compass className="w-12 h-12 text-stone-300 mb-3 animate-spin-slow" />
                  <h4 className="text-sm font-bold text-stone-600">Your AI itinerary awaits</h4>
                  <p className="text-xs text-stone-500 max-w-sm mt-1 leading-relaxed">
                    Fill in your favorite holiday coordinates on the left and tap "Craft Personalized Trip" to watch Gemini draft a premium customized adventure!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Private Vault Tab */}
      {activeTab === 'private-vault' && (
        <div className="space-y-6 animate-fade-in" id="private-vault-panel">
          
          <div className="relative overflow-hidden rounded-[22px] border border-amber-200 bg-[#fff8e8] p-5 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-6">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/20" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 shrink-0 rounded-[14px] bg-amber-100 p-3 text-amber-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-700">Encrypted Travel Locker</span>
                <h4 className="mt-1 text-xl font-extrabold text-stone-950">Zero-Knowledge Private Travel Vault</h4>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-amber-900/75">
                  Save confidential travel insurance policies, credit card emergency limits, flight coordinates, and passport copies safely. 
                  Protected strictly by Firestore rules; <strong>Not even Pravaah Travels operators can view this information</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVaultModal(true)}
              className="flex shrink-0 items-center space-x-1 rounded-[5px] bg-amber-700 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow transition-all hover:-translate-y-0.5 hover:bg-[#FF970D]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
            </div>
          </div>

          {vaultLoading ? (
            <div className="rounded-[18px] border border-stone-200 bg-white py-14 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-stone-500">Decrypting vault documents...</p>
            </div>
          ) : vaultDocs.length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-amber-200 bg-white p-10 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-amber-100 to-transparent" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Lock className="h-10 w-10" />
              </div>
              <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">Vault is empty</h4>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">Save secure backups of travel credentials for emergency retrieval anywhere.</p>
              <button
                type="button"
                onClick={() => setShowAddVaultModal(true)}
                className="relative mt-6 rounded-[5px] bg-amber-700 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
              >
                Add Secure Record
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {vaultDocs.map((doc) => (
                <div key={doc.id} className="relative overflow-hidden rounded-[18px] border border-stone-200 bg-white p-5 shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(18,38,32,0.12)]">
                  <div className="absolute right-4 top-4 text-amber-100">
                    <Lock className="h-16 w-16" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                        {doc.category || 'General Notes'}
                      </span>
                      <h4 className="mt-3 text-lg font-extrabold text-stone-950">{doc.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteVaultDoc(doc.id)}
                      className="relative rounded p-1 text-stone-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                      title="Delete securely"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <p className="mt-4 select-all whitespace-pre-wrap rounded-[12px] border border-stone-100 bg-[#f6f7f2] p-4 font-mono text-xs leading-relaxed text-stone-600">
                    {doc.content}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-[9px] text-stone-400">
                    <span>Saved: {new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center text-amber-600"><Lock className="w-3 h-3 mr-0.5" /> Local Rules Restrict Read</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Saved Packages Tab */}
      {activeTab === 'saved-packages' && (
        <div className="space-y-6 animate-fade-in" id="saved-packages-panel">
          <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Wishlist</span>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-stone-950">
              <Heart className="w-5 h-5 text-rose-500 fill-current" />
              <span>Your Saved & Bookmarked Packages</span>
            </h3>
            <p className="mt-1 text-sm text-stone-500">Quickly access and request bookings for tour packages you bookmarked.</p>
          </div>

          {savedPackagesLoading ? (
            <div className="rounded-[18px] border border-stone-200 bg-white py-14 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#008080] animate-spin mx-auto mb-2" />
              <p className="text-xs text-stone-500">Retrieving saved packages...</p>
            </div>
          ) : savedPackages.length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-rose-100 to-transparent" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Heart className="h-10 w-10 fill-current" />
              </div>
              <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">No saved packages yet</h4>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">
                Browse our selection of pilgrimage and adventure itineraries, and tap the heart icon on any package page to bookmark it here!
              </p>
              <button
                type="button"
                onClick={onNavigateToHome}
                className="relative mt-6 inline-flex items-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
              >
                <Compass className="w-4 h-4" />
                <span>Browse Packages</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedPackages.map((saved) => (
                <div key={saved.id} className="group flex flex-col justify-between overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]">
                  <div>
                    <div className="relative h-48 overflow-hidden">
                    <img 
                      src={getTravelImage(saved.imageUrl)} 
                      alt={saved.title} 
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={handleTravelImageError}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/55 to-transparent" />
                    <span className="absolute left-4 top-4 rounded bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528]">
                      {saved.duration || 'Flexible Days'}
                    </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="text-lg font-extrabold leading-tight text-stone-950">{saved.title}</h4>
                      {saved.destination && (
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{saved.destination}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-stone-100 p-4">
                    <div>
                      <span className="text-[9px] text-stone-400 block uppercase tracking-wider">Target Budget</span>
                      <span className="text-lg font-extrabold text-[#4DA528]">{formatPrice(saved.price)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewBookingDest(saved.destination || '');
                          setNewBookingPackage(saved.title || '');
                          setNewBookingBudget(saved.price || 50000);
                          setShowNewBookingModal(true);
                        }}
                        className="rounded-[5px] bg-[#4DA528] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                      >
                        Book Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSavedPackage(saved.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Travel History Tab */}
      {activeTab === 'travel-history' && (
        <div className="space-y-6 animate-fade-in" id="travel-history-panel">
          <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Travel Journal</span>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-stone-950">
              <Briefcase className="w-5 h-5 text-[#008080]" />
              <span>Your Himalayan Travel History</span>
            </h3>
            <p className="mt-1 text-sm text-stone-500">Relive and browse your verified, completed expeditions with Pravaah Travels.</p>
          </div>

          {bookings.filter(b => b.status === 'Confirmed').length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#4DA528]/10 to-transparent" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                <Compass className="h-10 w-10" />
              </div>
              <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">No travel history detected</h4>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">
                Once you complete your customized pilgrimage or scenic packages with us, your confirmed routes and completed dates will show up in this history pipeline!
              </p>
            </div>
          ) : (
            <div className="relative ml-4 space-y-6 border-l-2 border-[#4DA528]/30 py-2 pl-6">
              {bookings.filter(b => b.status === 'Confirmed').map((trip, idx) => (
                <div key={trip.id} className="relative max-w-4xl overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]">
                  {/* Timeline point */}
                  <div className="absolute -left-[31px] top-8 z-10 h-3 w-3 rounded-full border-2 border-white bg-[#4DA528] shadow-xs" />
                  
                  <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                    <div className="relative h-48 md:h-full">
                      <img
                        src={getBookingImage(trip)}
                        alt={trip.destination || trip.packageTitle || 'Travel history'}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleTravelImageError}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-stone-950/55 to-transparent md:bg-linear-to-r" />
                    </div>
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <span className="rounded bg-emerald-50 px-3 py-1 text-[10px] font-bold tracking-wide text-emerald-800">
                        Verified Travel Log
                      </span>
                      <h4 className="text-xl font-extrabold text-stone-950">{trip.packageTitle}</h4>
                      <p className="flex items-center gap-1 text-sm text-stone-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Traveled on: {trip.travelDate}</span>
                      </p>
                      {trip.destination && (
                        <p className="flex items-center gap-1 text-sm text-stone-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{trip.destination}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewDestination(trip.destination || '');
                          setReviewComment(`My trip to ${trip.destination} with Pravaah Travels was fantastic. Everything was organized perfectly.`);
                          setActiveTab('reviews');
                        }}
                        className="rounded-[5px] bg-[#4DA528]/10 px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528] transition-colors hover:bg-[#4DA528] hover:text-white"
                      >
                        Write traveler review
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in" id="profile-settings-panel">
          <div className="relative overflow-hidden rounded-[22px] bg-[#081E2A] p-6 text-white shadow-[0_20px_55px_rgba(8,30,42,0.18)] sm:p-8">
            <img
              src={getTravelImage('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80')}
              alt="Profile travel background"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
              referrerPolicy="no-referrer"
              onError={handleTravelImageError}
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#081E2A] via-[#081E2A]/88 to-[#081E2A]/55" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-[#4DA528] text-4xl font-extrabold shadow-xl">
                  {user.photoURL ? (
                    <img src={getTravelImage(user.photoURL)} alt={portalUserName} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                  ) : (
                    <span>{portalAvatarInitial}</span>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Traveler Profile</span>
                  <h3 className="mt-2 text-3xl font-extrabold text-white">{portalUserName}</h3>
                  <p className="mt-1 text-sm text-white/72">{user.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[470px]">
                {[
                  ['Phone', profilePhone || 'Not added'],
                  ['WhatsApp', profileWhatsApp || 'Not added'],
                  ['Member Since', memberSince],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[14px] border border-white/14 bg-white/10 p-4 backdrop-blur-md">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">{label}</span>
                    <p className="mt-2 truncate text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
            <div className="mb-6">
              <h4 className="text-xl font-extrabold text-stone-950">Secure Profile Settings</h4>
              <p className="mt-1 text-sm text-stone-500">Manage your personal coordinates and favorite destinations for customized trips.</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="E.g. +91 98765 43210"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="E.g. +91 98765 43210"
                      value={profileWhatsApp}
                      onChange={(e) => setProfileWhatsApp(e.target.value)}
                      className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Preferred Himalayan Destinations</label>
                  <input
                    type="text"
                    placeholder="E.g. Kedarnath, Spiti, Chardham"
                    value={profilePrefDest}
                    onChange={(e) => setProfilePrefDest(e.target.value)}
                    className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                <span className="text-[10px] text-stone-400 font-light">Last sync: Real-time Firestore Database</span>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex items-center space-x-1.5 rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow transition-all hover:bg-[#FF970D]"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews and Feedback Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-fade-in" id="customer-reviews-tab">
          <div className="relative overflow-hidden rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#4DA528]/10 to-transparent" />
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="relative space-y-2 text-center">
                <span className="inline-block rounded-full bg-[#4DA528]/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#4DA528]">
                  Share Your Experience
                </span>
                <h3 className="font-serif text-3xl font-light text-stone-950 sm:text-4xl">
                  Write Your <span className="font-serif font-normal italic text-[#4DA528]">Traveler Log</span>
                </h3>
                <p className="mx-auto max-w-md text-sm font-light leading-7 text-stone-500">
                  Document your mountain journeys across Uttarakhand and Himachal Pradesh. Your reviews appear instantly on the homepage reviews section!
                </p>
              </div>

              {reviewSuccess ? (
                <div className="animate-fade-in space-y-4 rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4DA528] text-white shadow">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-xl font-extrabold text-stone-900">Review Published Successfully!</h4>
                  <p className="mx-auto max-w-sm text-sm font-light leading-7 text-stone-600">
                    Your direct customer experience has been published to the homepage reviews section. Thank you for choosing Pravaah Travels!
                  </p>
                  <button 
                    type="button"
                    onClick={() => setReviewSuccess(false)}
                    className="rounded-[5px] bg-stone-900 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-stone-850"
                  >
                    Write Another Review
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reviewDestination.trim()) {
                    alert('Please enter or select a traversed destination.');
                    return;
                  }
                  if (!reviewComment.trim()) {
                    alert('Please enter your review details.');
                    return;
                  }

                  setReviewSubmitting(true);
                  try {
                    let finalImageUrl = '';
                    if (reviewImagePreview) {
                      finalImageUrl = await resizeAndCompressImage(reviewImagePreview);
                    }

                    const payload = {
                      name: user?.displayName || user?.email?.split('@')[0] || 'Verified Guest',
                      rating: Number(reviewRating),
                      comment: reviewComment.trim(),
                      destination: reviewDestination.trim(),
                      imageUrl: finalImageUrl,
                      verified: true,
                      createdAt: new Date().toISOString()
                    };

                    await addDoc(collection(db, 'reviews'), payload);

                    // Trigger automated email alert to admin
                    triggerSystemEmail('new-review', 'yash.km06@gmail.com', {
                      customerName: payload.name,
                      destination: payload.destination,
                      rating: payload.rating,
                      comment: payload.comment,
                      imageUrl: payload.imageUrl || null
                    });

                    setReviewSuccess(true);
                    setReviewComment('');
                    setReviewDestination('');
                    setReviewImagePreview(null);
                    setReviewRating(5);
                  } catch (err) {
                    console.error('Error submitting review:', err);
                    alert('Failed to publish review to database.');
                  } finally {
                    setReviewSubmitting(false);
                  }
                }} className="space-y-5">
                  
                  {/* Destination Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Traversed Destination</label>
                    <input 
                      type="text" 
                      required
                      placeholder="E.g. Kedarnath (Sacred Valleys)"
                      value={reviewDestination}
                      onChange={(e) => setReviewDestination(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
                    />
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Log Rating</label>
                    <div className="flex items-center gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isLight = reviewHoverRating !== null ? val <= reviewHoverRating : val <= reviewRating;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setReviewRating(val)}
                            onMouseEnter={() => setReviewHoverRating(val)}
                            onMouseLeave={() => setReviewHoverRating(null)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star 
                              className={`w-6 h-6 transition-colors ${
                                isLight ? 'text-[#F4C430] fill-current' : 'text-stone-200'
                              }`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Area */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Your Experience</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Share your spiritual or adventurous details. Let future travelers know about the road pacing, boutique cottage comfort, and coordination help!"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] leading-relaxed resize-none"
                    />
                  </div>

                  {/* Image Drag & Drop File Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Upload Trip Photograph (Optional)</label>
                    
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReviewImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                      className="border border-dashed border-stone-300 hover:border-[#008080] rounded-lg p-5 text-center cursor-pointer bg-stone-50/50 transition-colors relative"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReviewImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {reviewImagePreview ? (
                        <div className="space-y-2">
                          <img 
                            src={reviewImagePreview} 
                            alt="Selected trip photography" 
                            className="max-h-40 mx-auto rounded shadow-sm border border-stone-200 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[10px] text-stone-400">Tap or drag again to replace image</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-stone-600">Drag & drop your scenic photo here</span>
                          <span className="block text-[10px] text-stone-400">or click to browse your devices (JPEG, PNG, WEBP)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1"
                    >
                      {reviewSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                          <span>Publishing Trip Log...</span>
                        </>
                      ) : (
                        <span>Publish Review to Live Directory</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* MODALS */}
      {showNewBookingModal && (
        <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="new-booking-modal">
          <div className="bg-[#fcfbf9] border border-stone-250 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto font-sans flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#008080] text-white p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="absolute top-5 right-5 text-white/85 hover:text-white hover:rotate-90 transition-all duration-300 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF7F50] bg-white/10 px-2 py-0.5 rounded-sm">Premium Traveler Club</span>
              <h3 className="text-lg font-serif italic text-white mt-1">Request Custom Trip Planning</h3>
              <p className="text-xs text-stone-100 font-light mt-1">
                Fill in the details below. Our travel operator will contact you manually to draft your itinerary.
              </p>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              
              {/* Grid for Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Yash Kumar"
                    value={newBookingName}
                    onChange={(e) => setNewBookingName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={newBookingEmail}
                    onChange={(e) => setNewBookingEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Grid for Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="E.g. +91 98765 43210"
                    value={newBookingPhone}
                    onChange={(e) => setNewBookingPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp contact"
                    value={newBookingWhatsApp}
                    onChange={(e) => setNewBookingWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Destination & Package Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="Spiti, Ladakh, Spiti, etc."
                    value={newBookingDest}
                    onChange={(e) => setNewBookingDest(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Package / Theme Title</label>
                  <input
                    type="text"
                    placeholder="Custom Holiday Tour"
                    value={newBookingPackage}
                    onChange={(e) => setNewBookingPackage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Date, Adults, Children */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={newBookingDate}
                    onChange={(e) => setNewBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Adults * (12+ yrs)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newBookingAdults}
                    onChange={(e) => setNewBookingAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Children (0-11 yrs)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newBookingChildren}
                    onChange={(e) => setNewBookingChildren(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Pickup City & Budget Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 font-sans">Pickup City</label>
                  <input
                    type="text"
                    placeholder="E.g. Delhi, Chandigarh"
                    value={newBookingPickupCity}
                    onChange={(e) => setNewBookingPickupCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Budget Limit (INR)</label>
                  <input
                    type="number"
                    required
                    min={5000}
                    value={newBookingBudget}
                    onChange={(e) => setNewBookingBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Special travel/hotel requirements</label>
                <textarea
                  rows={2}
                  placeholder="Include any preferred hotels, meal specifications or route requests..."
                  value={newBookingRequests}
                  onChange={(e) => setNewBookingRequests(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 font-sans">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-4 py-2 border border-stone-250 hover:bg-stone-50 rounded text-stone-600 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="px-6 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded shadow-sm hover:shadow transition disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                >
                  {bookingSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {payingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="payment-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-100 overflow-hidden">
            
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold">Secure Card Checkout</h4>
                <p className="text-xs text-teal-100">Booking: {payingBooking.packageTitle}</p>
              </div>
              <CreditCard className="w-8 h-8 opacity-45" />
            </div>

            {paymentSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3.5]" />
                </div>
                <h4 className="text-base font-bold text-stone-850">Payment Successful!</h4>
                <p className="text-xs text-stone-500">Your trip is now confirmed and verified. Booking status updated in Firestore.</p>
              </div>
            ) : (
              <form onSubmit={handleMakePayment} className="p-5 space-y-4">
                <div className="bg-stone-50 p-3 rounded border border-stone-200 flex justify-between text-xs font-semibold">
                  <span className="text-stone-500">Total Dues Payment:</span>
                  <span className="text-[#008080]">{formatPrice(payingBooking.price)}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Yash Sharma"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4111 2222 3333 4444"
                    value={paymentCardNum}
                    onChange={(e) => setPaymentCardNum(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={paymentExpiry}
                      onChange={(e) => setPaymentExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">CVV Code</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      placeholder="•••"
                      value={paymentCvv}
                      onChange={(e) => setPaymentCvv(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setPayingBooking(null)}
                    className="px-4 py-2 border border-stone-200 rounded text-stone-600 hover:text-stone-850 hover:bg-stone-50 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded shadow flex items-center space-x-1"
                  >
                    {paymentLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Complete Checkout</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VAULT MODAL */}
      {showAddVaultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-vault-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-100 overflow-hidden">
            
            <div className="bg-amber-700 text-white p-5 flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <h4 className="text-base font-bold">Add Vault Document</h4>
            </div>

            <form onSubmit={handleAddVaultDoc} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Document Category</label>
                <select
                  value={vaultCategory}
                  onChange={(e) => setVaultCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-amber-700"
                >
                  <option value="Passport">Passport Details</option>
                  <option value="Insurance">Travel Insurance Policies</option>
                  <option value="Emergency">Emergency Contact Numbers</option>
                  <option value="Checklist">Travel checklists & Lists</option>
                  <option value="Other">Confidential Travel Notes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Document / Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Yash Passport Details"
                  value={vaultTitle}
                  onChange={(e) => setVaultTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Confidential Information / Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="E.g. Passport Number: Z918239, Issue Date: 12/03/2024, Expire Date: 11/03/2034, Emergency Contact: Mom +91..."
                  value={vaultContent}
                  onChange={(e) => setVaultContent(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-amber-700 resize-none font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddVaultModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded text-stone-600 hover:text-stone-850 hover:bg-stone-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vaultSubmitting}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded shadow flex items-center space-x-1"
                >
                  {vaultSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Encrypt & Store</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
