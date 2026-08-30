import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { auth, db, collection, getDocs, query, orderBy, deleteDoc, doc, getDoc, onSnapshot, where, addDoc } from './lib/firebase';
import { MessageCircle, Sparkles, Compass } from 'lucide-react';
import { TravelPackage, Enquiry, GalleryImage, WebsiteCMSSettings, ActivityItem, ActivityChildItem, ActivityRecommendation, FeaturedCategoryItem, BlogPost, DEFAULT_WEBSITE_CMS } from './types';

// Component imports
import Header from './components/Header';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import SEO from './components/SEO';
import PremiumEnquiryModal from './components/PremiumEnquiryModal';
import CookieConsent from './components/CookieConsent';
import SkeletonLoader from './components/SkeletonLoader';
import GoogleReviews, { GoogleReviewsCache } from './components/GoogleReviews';
import { isStaging } from './lib/environment';
import {
  getCustomLandingRegistration,
  getRegisteredCustomLandingPath,
} from './features/customLandings/registry';
import {
  getPackageNavigationTarget,
  getPackageRouteSegment,
  packageMatchesRouteSegment,
} from './utils/packageRoute';
import { resolveBusinessProfile } from './utils/businessProfile';
import { getNameFromNearbyPlaceSlug } from './utils/nearbyPlaceDetails';

const HomeView = lazy(() => import('./components/HomeView'));
const AboutView = lazy(() => import('./components/AboutView'));
const PackagesView = lazy(() => import('./components/PackagesView'));
const PackageDetailView = lazy(() => import('./components/PackageDetailView'));
const AttractionDetailView = lazy(() => import('./components/AttractionDetailView'));
const DestinationsView = lazy(() => import('./components/DestinationsView'));
const GalleryView = lazy(() => import('./components/GalleryView'));
const ContactView = lazy(() => import('./components/ContactView'));
const AdminDashboardView = lazy(() => import('./components/AdminDashboardView'));
const CustomerPortalView = lazy(() => import('./components/CustomerPortalView'));
const AiCuratorView = lazy(() => import('./components/AiCuratorView'));
const VerifiedReviews = lazy(() => import('./components/VerifiedReviews'));
const BlogsView = lazy(() => import('./components/BlogsView'));
const BlogDetailView = lazy(() => import('./components/BlogDetailView'));

const RouteViewFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center bg-[#fffaf1] px-4 py-16">
    <div className="w-full max-w-5xl rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(18,38,32,0.08)] sm:p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded-full bg-stone-200" />
        <div className="h-8 w-2/3 rounded bg-stone-200" />
        <div className="h-4 w-full rounded bg-stone-100" />
        <div className="h-4 w-5/6 rounded bg-stone-100" />
        <div className="grid gap-4 pt-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-48 rounded-[16px] bg-stone-100" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface RouteState {
  view: string;
  packageId: string | null;
}

interface PackageFilterSelection {
  search?: string;
  category?: string;
  location?: string;
  destination?: string;
  bookingType?: string;
  availability?: string;
}

const getPackageCanonicalUrl = (pkg: Pick<TravelPackage, 'id' | 'title' | 'customLandingPage'>) => {
  const target = getPackageNavigationTarget(pkg);
  if (target.view === 'custom-landing') {
    return `https://pravaahtravels.com${target.path}`;
  }
  if (typeof window === 'undefined') return target.path;
  return `${window.location.origin}${target.path}`;
};

const getRouteStateFromUrl = (): RouteState => {
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    return { view: 'home', packageId: null };
  }
  if (path === '/admin' || path.startsWith('/admin/')) {
    return { view: 'admin-dashboard', packageId: null };
  }
  if (path.startsWith('/attraction/')) {
    const parts = path.split('/');
    const placeSlug = parts[2] ? decodeURIComponent(parts[2]) : null;
    return { view: 'attraction-detail', packageId: placeSlug };
  }
  if (path.startsWith('/package/')) {
    const parts = path.split('/');
    const packageId = parts[2] || null;
    return { view: 'package-detail', packageId };
  }
  if (path.startsWith('/packages/')) {
    const parts = path.split('/');
    const packageSlug = parts[2] ? decodeURIComponent(parts[2]) : null;
    return { view: 'package-detail', packageId: packageSlug };
  }
  if (path.startsWith('/blogs/')) {
    const parts = path.split('/');
    const blogSlug = parts[2] ? decodeURIComponent(parts[2]) : null;
    return { view: 'blog-detail', packageId: blogSlug };
  }
  if (getCustomLandingRegistration(path)) {
    return { view: 'custom-landing', packageId: path };
  }
  const cleanPath = path.replace(/^\//, ''); // remove leading slash
  if (cleanPath === 'review' || cleanPath === 'reviews') {
    return { view: 'reviews', packageId: null };
  }
  const allowedViews = [
    'destinations',
    'packages',
    'gallery',
    'blogs',
    'about',
    'ai-curator',
    'contact',
    'portal',
    'admin-login',
    'admin-dashboard'
  ];
  if (allowedViews.includes(cleanPath)) {
    return { view: cleanPath, packageId: null };
  }
  return { view: 'home', packageId: null };
};

const getUrlFromRouteState = (view: string, packageId: string | null): string => {
  if (view === 'home') return '/';
  if (view === 'package-detail' && packageId) return `/packages/${packageId}`;
  if (view === 'attraction-detail' && packageId) return `/attraction/${packageId}`;
  if (view === 'blog-detail' && packageId) return `/blogs/${packageId}`;
  if (view === 'custom-landing' && getRegisteredCustomLandingPath(packageId)) return packageId as string;
  if (view === 'reviews') return '/review'; // as explicitly requested
  if (view === 'admin-dashboard' && (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/'))) {
    return window.location.pathname;
  }
  return `/${view}`;
};

export default function App() {
  // Views navigation - initialized dynamically from the URL path
  const [currentView, setCurrentView] = useState<string>(() => {
    return getRouteStateFromUrl().view;
  });
  const [savedPackagesRefreshKey, setSavedPackagesRefreshKey] = useState(0);
  const [wishlistPackages, setWishlistPackages] = useState<any[]>([]);
  const [wishlistToast, setWishlistToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingWishlistPackage, setPendingWishlistPackage] = useState<TravelPackage | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(() => {
    return getRouteStateFromUrl().packageId;
  });
  const [prefilledCategory, setPrefilledCategory] = useState<string>('All');
  const [selectedPackageLocation, setSelectedPackageLocation] = useState<string>('All');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quotePackage, setQuotePackage] = useState<TravelPackage | null>(null);
  const [pendingPostLoginView, setPendingPostLoginView] = useState<string | null>(null);

  // Firebase auth state
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [authResolved, setAuthResolved] = useState(false);

  // Firestore collections data
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityChildItem[]>([]);
  const [activityRecommendations, setActivityRecommendations] = useState<ActivityRecommendation[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<FeaturedCategoryItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReviewsCache | null>(null);
  const googleReviewsLoadedRef = useRef(false);
  const [websiteCMS, setWebsiteCMS] = useState<WebsiteCMSSettings>({} as WebsiteCMSSettings);

  // Loading states
  const [loadingData, setLoadingData] = useState(true);

  // ----------------------------------------------------
  // FETCH FIRESTORE DATA & ERROR HANDLING TYPES
  // ----------------------------------------------------
  // Declaring Firestore error helpers according to Zero-Trust hardening guidelines
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
      tenantId?: string | null;
      providerInfo?: {
        providerId?: string | null;
        email?: string | null;
      }[];
    };
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid || null,
        email: auth.currentUser?.email || null,
        emailVerified: auth.currentUser?.emailVerified || null,
        isAnonymous: auth.currentUser?.isAnonymous || null,
        tenantId: auth.currentUser?.tenantId || null,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  const fetchAllData = useCallback(async () => {
    setLoadingData(true);

    const fetchAllCollections = async () => {
      const [packagesSnapshot, gallerySnapshot, cmsSnap, activitiesSnapshot, activityItemsSnapshot, activityRecommendationsSnapshot, featuredCategoriesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'packages'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc'))),
        getDoc(doc(db, 'siteSettings', 'main')),
        getDocs(query(collection(db, 'activities'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'activityItems'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'activityRecommendations'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'featuredCategories'), orderBy('order', 'asc'))),
      ]);

      const fetchedPackages = packagesSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        location: docSnap.data().location || 'Uttarakhand',
      })) as TravelPackage[];
      setPackages(fetchedPackages);

      const fetchedGallery: GalleryImage[] = gallerySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as GalleryImage[];
      fetchedGallery.sort((a, b) => {
        const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setGallery(fetchedGallery);

      if (cmsSnap.exists()) {
        setWebsiteCMS(cmsSnap.data() as WebsiteCMSSettings);
      } else {
        setWebsiteCMS({} as WebsiteCMSSettings);
      }

      const fetchedActivities = activitiesSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as ActivityItem[];
      setActivities(fetchedActivities.filter((item) => item.enabled !== false));

      const fetchedActivityItems = activityItemsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as ActivityChildItem[];
      setActivityItems(fetchedActivityItems.filter((item) => item.enabled !== false));

      const fetchedActivityRecommendations = activityRecommendationsSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as ActivityRecommendation[];
      setActivityRecommendations(fetchedActivityRecommendations.filter((item) => item.enabled !== false));

      const fetchedFeaturedCategories = featuredCategoriesSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as FeaturedCategoryItem[];
      setFeaturedCategories(fetchedFeaturedCategories.filter((item) => item.enabled !== false));
    };

    try {
      await fetchAllCollections();
    } catch (err: any) {
      console.warn('Error fetching application data from Firestore:', err);
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, 'app-data');
      }
    }

    try {
      const blogsSnapshot = await getDocs(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')));
      const fetchedBlogPosts = blogsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as BlogPost[];
      setBlogPosts(fetchedBlogPosts);
    } catch (err: any) {
      console.warn('Error fetching blogs from Firestore:', err);
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, 'blogs');
      }
    }

    if (!googleReviewsLoadedRef.current) {
      googleReviewsLoadedRef.current = true;
      try {
        const snapshot = await getDoc(doc(db, 'googleReviews', 'main'));
        setGoogleReviews(snapshot.exists() ? snapshot.data() as GoogleReviewsCache : null);
      } catch (err) {
        console.warn('Error fetching cached Google reviews:', err);
        setGoogleReviews(null);
      }
    }

    // 7. Fetch Enquiries (Only if admin is logged in, else security rules blocks it)
    const enquiriesColName = 'enquiries';
    try {
      const currentAuthUser = auth.currentUser;
      const token = currentAuthUser ? await getIdTokenResult(currentAuthUser) : null;
      if (token?.claims.admin === true) {
        const enquiriesCol = collection(db, enquiriesColName);
        const enquiriesSnapshot = await getDocs(enquiriesCol);
        const fetchedEnquiries = enquiriesSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Enquiry[];
        setEnquiries(fetchedEnquiries);
      }
    } catch (err: any) {
      console.warn('Error fetching enquiries from Firestore:', err);
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, enquiriesColName);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  // ----------------------------------------------------
  // AUTHENTICATION LISTENER
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthResolved(false);
      if (user) {
        setCurrentUser(user);
        const token = await getIdTokenResult(user).catch(() => null);
        if (token?.claims.admin === true) {
          setIsAdminLoggedIn(true);
          setAdminEmail(user.email?.trim().toLowerCase() || user.uid);
        } else {
          setIsAdminLoggedIn(false);
          setAdminEmail('');
        }
      } else {
        setCurrentUser(null);
        setIsAdminLoggedIn(false);
        setAdminEmail('');
      }
      setAuthResolved(true);
      // Re-trigger database fetching
      fetchAllData();
    });

    return () => unsubscribe();
  }, [fetchAllData]);

  useEffect(() => {
    if (!authResolved || currentView !== 'admin-dashboard') return;
    if (!isAdminLoggedIn) {
      setCurrentView(currentUser ? 'home' : 'admin-login');
      setSelectedPackageId(null);
    }
  }, [authResolved, currentUser, currentView, isAdminLoggedIn]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setWishlistPackages([]);
      return;
    }

    const wishlistQuery = query(
      collection(db, 'users', currentUser.uid, 'private'),
      where('type', '==', 'saved_package')
    );

    const unsubscribe = onSnapshot(wishlistQuery, (snapshot) => {
      const nextWishlist = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setWishlistPackages(nextWishlist);
    }, (error) => {
      console.error('Wishlist listener error:', error);
      setWishlistToast({ type: 'error', message: 'Unable to sync Wishlist right now.' });
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!wishlistToast) return;
    const timeout = window.setTimeout(() => setWishlistToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [wishlistToast]);

  // ----------------------------------------------------
  // URL ROUTING SYNCHRONIZER & POPSTATE LISTENER
  // ----------------------------------------------------
  // Sync state changes to browser address bar URL path
  useEffect(() => {
    const newUrl = getUrlFromRouteState(currentView, selectedPackageId);
    if (window.location.pathname !== newUrl) {
      window.history.pushState(null, '', newUrl);
    }
  }, [currentView, selectedPackageId]);

  // Handle browser Back / Forward (popstate) button clicks
  useEffect(() => {
    const handlePopState = () => {
      const { view, packageId } = getRouteStateFromUrl();
      setCurrentView(view);
      setSelectedPackageId(packageId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!loginModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseLoginModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loginModalOpen]);

  // ----------------------------------------------------
  // ACTIONS / HANDLERS
  // ----------------------------------------------------
  const handlePackageSaved = useCallback(() => {
    setSavedPackagesRefreshKey((prev) => prev + 1);
  }, []);

  const handleOpenQuoteModal = useCallback((pkg?: TravelPackage) => {
    setQuotePackage(pkg || null);
    setQuoteModalOpen(true);
  }, []);

  const handleCloseQuoteModal = useCallback(() => {
    setQuoteModalOpen(false);
    setQuotePackage(null);
  }, []);

  const handleToggleWishlist = useCallback(async (pkg: TravelPackage) => {
    if (!pkg?.id) return;

    const activeUser = currentUser || auth.currentUser;
    if (!activeUser) {
      setPendingWishlistPackage(pkg);
      setPendingPostLoginView(currentView);
      setLoginModalOpen(true);
      return;
    }

    const existingWishlistItem = wishlistPackages.find((item: any) => String(item.packageId) === String(pkg.id));

    try {
      if (existingWishlistItem) {
        await deleteDoc(doc(db, 'users', activeUser.uid, 'private', existingWishlistItem.id));
        setWishlistToast({ type: 'success', message: 'Removed from Wishlist' });
      } else {
        await addDoc(collection(db, 'users', activeUser.uid, 'private'), {
          type: 'saved_package',
          packageId: pkg.id,
          title: pkg.title,
          destination: pkg.destination,
          imageUrl: pkg.imageUrl || '',
          duration: pkg.duration,
          price: pkg.price || 0,
          createdAt: new Date().toISOString(),
        });
        setWishlistToast({ type: 'success', message: 'Package added to Wishlist ❤️' });
      }
      setSavedPackagesRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
      setWishlistToast({ type: 'error', message: 'Unable to update Wishlist right now.' });
    }
  }, [currentUser, currentView, wishlistPackages]);

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
    setPendingPostLoginView(null);
    if (currentView === 'admin-login') {
      setCurrentView('home');
    }
  };

  const handleNavigate = (view: string, packageId: string | null = null) => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'admin-dashboard' && !isAdminLoggedIn) {
      setPendingPostLoginView('admin-dashboard');
      setLoginModalOpen(true);
      return;
    }

    if (view === 'portal' && !currentUser) {
      setPendingPostLoginView('portal');
      setLoginModalOpen(true);
      return;
    }

    if (view === 'admin-login') {
      setPendingPostLoginView(null);
      setLoginModalOpen(true);
      return;
    }

    setCurrentView(view);
    setSelectedPackageId(packageId);
  };

  const openPackagesWithFilters = useCallback((filters: PackageFilterSelection, preserveExisting = false) => {
    const params = preserveExisting ? new URLSearchParams(window.location.search) : new URLSearchParams();

    const setOrDelete = (key: string, value?: string) => {
      const normalized = String(value ?? '').trim();
      if (normalized && normalized !== 'All') {
        params.set(key, normalized);
      } else {
        params.delete(key);
      }
    };

    if ('search' in filters) setOrDelete('search', filters.search);
    if ('category' in filters) setOrDelete('category', filters.category);
    if ('location' in filters) setOrDelete('location', filters.location);
    if ('destination' in filters) setOrDelete('destination', filters.destination);
    if ('bookingType' in filters) setOrDelete('type', filters.bookingType);
    if ('availability' in filters) setOrDelete('availability', filters.availability);

    const queryString = params.toString();
    window.history.pushState(null, '', `/packages${queryString ? `?${queryString}` : ''}`);

    setPrefilledCategory(params.get('category') || 'All');
    setSelectedPackageLocation(params.get('location') || 'All');
    setCurrentView('packages');
    setSelectedPackageId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectCategory = (category: string) => {
    openPackagesWithFilters({ category }, window.location.pathname === '/packages');
  };

  const handleSearchByLocation = (location: string) => {
    openPackagesWithFilters({ location }, false);
  };

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAdminLoggedIn(false);
      setAdminEmail('');
      setCurrentView('home');
      await fetchAllData();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this travel package permanently?')) return;
    try {
      await deleteDoc(doc(db, 'packages', id));
      const deletedPackage = packages.find((item) => item.id === id);
      if (
        selectedPackageId === id ||
        (deletedPackage && selectedPackageId === getPackageRouteSegment(deletedPackage))
      ) {
        setSelectedPackageId(null);
        setCurrentView('packages');
      }
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting package:', err);
      alert(`Failed to delete package: ${err.message || String(err)}`);
    }
  };

  // ----------------------------------------------------
  // COMPUTED PROPERTIES / SUB-STATES
  // ----------------------------------------------------
  const featuredPackages = useMemo(() => {
    return packages.filter((p) => p.featured && p.active !== false);
  }, [packages]);

  const wishlistPackageIds = useMemo(() => {
    return wishlistPackages.map((item: any) => String(item.packageId));
  }, [wishlistPackages]);

  const activeSelectedPackage = useMemo(() => {
    if (!selectedPackageId) return null;
    if (currentView === 'custom-landing') {
      const customPath = getRegisteredCustomLandingPath(selectedPackageId);
      if (!customPath) return null;
      const matchingPackages = packages.filter((pkg) => (
        pkg.active !== false
        && getRegisteredCustomLandingPath(pkg.customLandingPage) === customPath
      ));
      return matchingPackages.length === 1 ? matchingPackages[0] : null;
    }
    const normalizedPackageId = decodeURIComponent(String(selectedPackageId));
    return packages.find((pkg) => packageMatchesRouteSegment(pkg, normalizedPackageId)) || null;
  }, [currentView, packages, selectedPackageId]);

  const publishedBlogPosts = useMemo(
    () => blogPosts.filter((post) => post.status === 'Publish'),
    [blogPosts],
  );

  const activeSelectedBlogPost = useMemo(() => {
    if (currentView !== 'blog-detail' || !selectedPackageId) return null;
    const normalizedSlug = decodeURIComponent(String(selectedPackageId));
    return publishedBlogPosts.find((post) => (
      post.slug === normalizedSlug || String(post.id) === normalizedSlug
    )) || null;
  }, [currentView, publishedBlogPosts, selectedPackageId]);

  const businessProfile = useMemo(() => resolveBusinessProfile(websiteCMS), [websiteCMS]);
  const customLandingRegistration = currentView === 'custom-landing'
    ? getCustomLandingRegistration(selectedPackageId)
    : null;
  const CustomLandingComponent = customLandingRegistration?.component;
  const isImmersiveCustomLanding = customLandingRegistration?.shell === 'immersive';

  const pageSeo = useMemo(() => {
    const baseUrl = typeof window === 'undefined' ? 'https://pravaahtravels.com' : window.location.origin;
    const structuredDataBaseUrl = currentView === 'custom-landing'
      ? 'https://pravaahtravels.com'
      : baseUrl;
    const fallbackTitle = websiteCMS.seoTitle || DEFAULT_WEBSITE_CMS.seoTitle;
    const fallbackDescription = websiteCMS.seoDescription || DEFAULT_WEBSITE_CMS.seoDescription;
    const fallbackKeywords = websiteCMS.seoKeywords || DEFAULT_WEBSITE_CMS.seoKeywords;
    const fallbackImage = websiteCMS.heroBackgroundImageUrl || DEFAULT_WEBSITE_CMS.heroBackgroundImageUrl;
    const phone = businessProfile.phone;
    const address = businessProfile.address;

    const viewMeta: Record<string, { title: string; description: string; canonicalPath: string }> = {
      home: {
        title: fallbackTitle,
        description: fallbackDescription,
        canonicalPath: '/',
      },
      packages: {
        title: 'Premium Travel Packages',
        description: 'Browse Pravaah Travels packages with curated itineraries, destinations, pricing, and enquiry support.',
        canonicalPath: '/packages',
      },
      destinations: {
        title: 'Destinations',
        description: 'Explore pilgrimage, adventure, family, luxury, wildlife, and Himalayan destinations with Pravaah Travels.',
        canonicalPath: '/destinations',
      },
      gallery: {
        title: 'Travel Gallery',
        description: 'View Pravaah Travels destination photography, tour galleries, and real Himalayan journey moments.',
        canonicalPath: '/gallery',
      },
      blogs: {
        title: `Travel Blog | ${businessProfile.companyName}`,
        description: `Read ${businessProfile.companyName} travel guides, destination tips, and Himalayan journey stories.`,
        canonicalPath: '/blogs',
      },
      'blog-detail': {
        title: activeSelectedBlogPost ? `${activeSelectedBlogPost.title} | ${businessProfile.companyName}` : `Travel Blog | ${businessProfile.companyName}`,
        description: activeSelectedBlogPost?.seoDescription || `Read ${businessProfile.companyName} travel guides and destination stories.`,
        canonicalPath: activeSelectedBlogPost ? `/blogs/${activeSelectedBlogPost.slug || activeSelectedBlogPost.id}` : '/blogs',
      },
      about: {
        title: 'About Pravaah Travels',
        description: 'Learn about Pravaah Travels, our local travel expertise, and premium Himalayan journey planning.',
        canonicalPath: '/about',
      },
      contact: {
        title: 'Contact Pravaah Travels',
        description: 'Contact Pravaah Travels for custom packages, enquiries, bookings, and support.',
        canonicalPath: '/contact',
      },
      reviews: {
        title: 'Verified Travel Reviews',
        description: 'Read verified Pravaah Travels customer reviews, ratings, and destination experiences.',
        canonicalPath: '/review',
      },
      portal: {
        title: 'Customer Portal',
        description: 'Access your Pravaah Travels bookings, saved packages, reviews, and travel dashboard.',
        canonicalPath: '/portal',
      },
      'attraction-detail': {
        title: `${getNameFromNearbyPlaceSlug(selectedPackageId || '') || 'Destination Place'} Travel Guide`,
        description: `Explore location details, directions, and visitor information for ${getNameFromNearbyPlaceSlug(selectedPackageId || '') || 'this destination place'}.`,
        canonicalPath: `/attraction/${selectedPackageId || ''}`,
      },
    };

    const activeMeta = viewMeta[currentView] || viewMeta.home;
    const title = activeSelectedBlogPost
      ? `${activeSelectedBlogPost.title} | ${businessProfile.companyName}`
      : activeSelectedPackage?.seoTitle || activeSelectedPackage?.title || activeMeta.title;
    const description = activeSelectedBlogPost?.seoDescription || activeSelectedPackage?.seoDescription || activeSelectedPackage?.shortDescription || activeMeta.description;
    const canonicalUrl = activeSelectedPackage
      ? getPackageCanonicalUrl(activeSelectedPackage)
      : `${baseUrl}${activeMeta.canonicalPath}`;
    const customLandingOgImage = customLandingRegistration?.seoImagePath
      ? new URL(customLandingRegistration.seoImagePath, `${structuredDataBaseUrl}/`).href
      : '';
    const ogImage = customLandingOgImage || activeSelectedBlogPost?.featuredImageUrl || activeSelectedPackage?.packageBannerUrl || activeSelectedPackage?.imageUrl || fallbackImage;
    const packageOfferPrice = Number(activeSelectedPackage?.offerPrice ?? activeSelectedPackage?.price);
    const hasPublishedPackageOffer = Number.isFinite(packageOfferPrice) && packageOfferPrice > 0;

    const schemaMarkup = activeSelectedPackage ? {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TravelAgency',
          name: businessProfile.companyName,
          url: structuredDataBaseUrl,
          image: ogImage,
          telephone: phone,
          email: businessProfile.email,
          address,
        },
        {
          '@type': 'TouristTrip',
          additionalType: 'TourPackage',
          name: activeSelectedPackage.title,
          description,
          image: ogImage,
          url: canonicalUrl,
          touristType: activeSelectedPackage.category,
          itinerary: activeSelectedPackage.itinerary?.map((day) => ({
            '@type': 'ItemList',
            name: `Day ${day.day}: ${day.title}`,
            description: day.description,
          })),
          ...(hasPublishedPackageOffer ? {
            offers: {
              '@type': 'Offer',
              price: packageOfferPrice,
              priceCurrency: 'INR',
              availability: activeSelectedPackage.active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          } : {}),
        },
      ],
    } : currentView === 'blog-detail' && activeSelectedBlogPost ? {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TravelAgency',
          name: businessProfile.companyName,
          url: structuredDataBaseUrl,
          image: ogImage,
          telephone: phone,
          email: businessProfile.email,
          address,
        },
        {
          '@type': 'BlogPosting',
          headline: activeSelectedBlogPost.title,
          description,
          image: ogImage,
          url: canonicalUrl,
          datePublished: activeSelectedBlogPost.createdAt,
          dateModified: activeSelectedBlogPost.updatedAt || activeSelectedBlogPost.createdAt,
          author: { '@type': 'Person', name: activeSelectedBlogPost.author || businessProfile.companyName },
          publisher: {
            '@type': 'Organization',
            name: businessProfile.companyName,
            logo: {
              '@type': 'ImageObject',
              url: businessProfile.logoUrl || DEFAULT_WEBSITE_CMS.logoUrl,
            },
          },
          articleSection: activeSelectedBlogPost.category,
          keywords: (activeSelectedBlogPost.tags || []).join(', '),
        },
      ],
    } : {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      name: businessProfile.companyName,
      url: structuredDataBaseUrl,
      image: ogImage,
      description,
      telephone: phone,
      email: businessProfile.email,
      address,
    };

    return {
      title,
      description,
      keywords: activeSelectedPackage
        ? `${activeSelectedPackage.title}, ${activeSelectedPackage.destination}, ${activeSelectedPackage.category}, ${fallbackKeywords}`
        : activeSelectedBlogPost
          ? `${activeSelectedBlogPost.title}, ${activeSelectedBlogPost.category}, ${(activeSelectedBlogPost.tags || []).join(', ')}, ${activeSelectedBlogPost.seoKeywords || fallbackKeywords}`
          : fallbackKeywords,
      canonicalUrl,
      ogImage,
      schemaMarkup,
    };
  }, [activeSelectedBlogPost, activeSelectedPackage, businessProfile, currentView, customLandingRegistration, selectedPackageId, websiteCMS]);

  const showLoginModal = loginModalOpen || currentView === 'admin-login';

  // Generate dynamic WhatsApp contact url containing page context
  const getWhatsAppUrl = () => {
    let text = `Hi ${businessProfile.companyName} support team! `;

    switch (currentView) {
      case 'home':
        text += "I am currently browsing your Home Page. I would love to explore custom travel options for Uttarakhand and Himachal Pradesh!";
        break;
      case 'destinations':
        text += "I am currently viewing the Destinations catalog. I am interested in exploring customized travel options for one of your scenic mountain sectors.";
        break;
      case 'packages':
        text += "I am currently viewing the Tour Packages catalog. I'd love to ask about your ready-made and customizable Himalayan itineraries.";
        break;
      case 'package-detail':
      case 'custom-landing':
        if (activeSelectedPackage) {
          text += `I am viewing the tour details of the package "${activeSelectedPackage.title}" (ID: ${activeSelectedPackage.id}). I'd like to ask about custom pricing and dates for this exact tour.`;
        } else {
          text += "I am viewing tour package details and would like custom guidance on your high-altitude routes.";
        }
        break;
      case 'attraction-detail':
        text += `I am viewing the destination guide for "${getNameFromNearbyPlaceSlug(selectedPackageId || '') || 'this nearby place'}". I would like help including this place in my trip.`;
        break;
      case 'ai-curator':
        text += "I am currently using your 'Pravaah AI Curator Engine' and would like to speak to a Senior Himalayan Sherpa/Logistics Coordinator directly!";
        break;
      case 'gallery':
        text += "I am viewing your Gallery and travel diaries. The scenic photos look spectacular! I want to plan a custom trip.";
        break;
      case 'reviews':
        text += "I am viewing your Verified Guest Logs and traveler feedback diaries. The mountain journals look amazing! I want to plan a trip with you.";
        break;
      case 'about':
        text += "I am reading about the heritage and team of Pravaah Travels. I'd love to connect to discuss custom group travel plans.";
        break;
      case 'contact':
        text += "I am viewing the Contact Us page. I would like to establish direct, quick support on WhatsApp with your travel team.";
        break;
      case 'portal':
        text += "I am currently logged into my Customer Portal dashboard and would like to enquire about my current bookings or ask for logistics support.";
        break;
      default:
        text += "I am currently browsing the Pravaah Travels website and would love to consult with a veteran coordinator about customized travel packages.";
    }

    return businessProfile.whatsappUrl(text);
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-800 font-sans" id="app-root">
      {isStaging && (
        <div className="sticky top-0 z-[100] bg-amber-400 px-3 py-1 text-center text-xs font-bold tracking-[0.18em] text-stone-950">
          STAGING / TEST ENVIRONMENT
        </div>
      )}
      <SEO
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalUrl={pageSeo.canonicalUrl}
        ogImage={pageSeo.ogImage}
        ogType={activeSelectedPackage ? 'travel' : currentView === 'attraction-detail' || currentView === 'blog-detail' ? 'article' : 'website'}
        schemaMarkup={pageSeo.schemaMarkup}
        siteName={businessProfile.companyName}
      />
      {currentView !== 'admin-dashboard' && !isImmersiveCustomLanding && <CookieConsent />}
      
      {/* Hide header on full-screen admin dashboard */}
      {currentView !== 'admin-dashboard' && !isImmersiveCustomLanding && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          isAdminLoggedIn={isAdminLoggedIn}
          currentUser={currentUser}
          onAdminLogout={handleAdminLogout}
          websiteCMS={websiteCMS}
          packages={packages}
        />
      )}

      {/* Main viewport block */}
      <main className="flex-1">
        <Suspense fallback={<RouteViewFallback />}>
          {currentView === 'home' && (
            <HomeView
              featuredPackages={featuredPackages}
              onNavigate={handleNavigate}
              loading={loadingData}
              isAdminLoggedIn={isAdminLoggedIn}
              onDeletePackage={handleDeletePackage}
              onSelectCategory={handleSelectCategory}
              onSearchByLocation={handleSearchByLocation}
              websiteCMS={websiteCMS}
              activities={activities}
              activityItems={activityItems}
              activityRecommendations={activityRecommendations}
              featuredCategories={featuredCategories}
              packages={packages}
              wishlistPackageIds={wishlistPackageIds}
              onToggleWishlist={handleToggleWishlist}
              blogPosts={publishedBlogPosts}
              googleReviews={googleReviews}
            />
          )}

          {currentView === 'destinations' && (
            <DestinationsView
              onSelectCategory={handleSelectCategory}
              onSelectFilter={(filters) => openPackagesWithFilters(filters, false)}
              packages={packages}
              featuredCategories={featuredCategories}
              loading={loadingData}
            />
          )}

          {currentView === 'packages' && (
            <PackagesView
              packages={packages}
              onNavigate={handleNavigate}
              loading={loadingData}
              isAdminLoggedIn={isAdminLoggedIn}
              onDeletePackage={handleDeletePackage}
              prefilledCategory={prefilledCategory}
              selectedLocationFilter={selectedPackageLocation}
              onResetPrefilledCategory={() => setPrefilledCategory('All')}
              onPackageSaved={handlePackageSaved}
              wishlistPackageIds={wishlistPackageIds}
              onToggleWishlist={handleToggleWishlist}
              websiteCMS={websiteCMS}
            />
          )}

          {currentView === 'package-detail' && activeSelectedPackage && (
            <PackageDetailView
              pkg={activeSelectedPackage}
              onBack={() => handleNavigate('packages')}
              onEnquirySuccess={fetchAllData}
              isAdminLoggedIn={isAdminLoggedIn}
              onDeletePackage={handleDeletePackage}
              onPackageSaved={handlePackageSaved}
              wishlistPackageIds={wishlistPackageIds}
              onToggleWishlist={handleToggleWishlist}
              onNavigate={handleNavigate}
              packages={packages}
              websiteCMS={websiteCMS}
              googleReviews={googleReviews}
            />
          )}

          {currentView === 'package-detail' && !loadingData && !activeSelectedPackage && (
            <div className="flex min-h-[520px] items-center justify-center bg-white px-4 py-20 text-center">
              <div className="max-w-md">
                <Compass className="mx-auto h-12 w-12 text-[#4DA528]" />
                <h1 className="mt-5 text-3xl font-extrabold text-stone-950">Package not found</h1>
                <p className="mt-3 text-sm leading-7 text-stone-500">This package may have been removed or unpublished.</p>
                <button
                  type="button"
                  onClick={() => handleNavigate('packages')}
                  className="mt-6 rounded-[5px] bg-[#4DA528] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                >
                  Browse Packages
                </button>
              </div>
            </div>
          )}

          {currentView === 'custom-landing' && CustomLandingComponent && activeSelectedPackage && (
            <CustomLandingComponent
              pkg={activeSelectedPackage}
              business={businessProfile}
              onNavigate={handleNavigate}
              onOpenEnquiry={handleOpenQuoteModal}
            />
          )}

          {currentView === 'custom-landing' && !loadingData && (!CustomLandingComponent || !activeSelectedPackage) && (
            <div className="flex min-h-[70vh] items-center justify-center bg-[#faf8f3] px-4 py-20 text-center">
              <div className="max-w-lg rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(18,38,32,0.10)]">
                <Compass className="mx-auto h-12 w-12 text-[#4DA528]" />
                <h1 className="mt-5 text-3xl font-extrabold text-stone-950">Expedition page unavailable</h1>
                <p className="mt-3 text-sm leading-7 text-stone-500">
                  This custom page is not currently connected to an active package.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate('packages')}
                  className="mt-6 rounded-[5px] bg-[#4DA528] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                >
                  Browse Packages
                </button>
              </div>
            </div>
          )}

          {currentView === 'gallery' && (
            <GalleryView gallery={gallery} loading={loadingData} />
          )}

          {currentView === 'attraction-detail' && (
            <AttractionDetailView placeSlug={selectedPackageId} />
          )}

          {currentView === 'blogs' && (
            <BlogsView blogPosts={blogPosts} onNavigate={handleNavigate} loading={loadingData} />
          )}

          {currentView === 'blog-detail' && activeSelectedBlogPost && (
            <BlogDetailView post={activeSelectedBlogPost} allPosts={publishedBlogPosts} onNavigate={handleNavigate} />
          )}

          {currentView === 'blog-detail' && loadingData && !activeSelectedBlogPost && (
            <SkeletonLoader />
          )}

          {currentView === 'blog-detail' && !loadingData && !activeSelectedBlogPost && (
            <div className="flex min-h-[520px] items-center justify-center bg-white px-4 py-20 text-center">
              <div className="max-w-md">
                <Compass className="mx-auto h-12 w-12 text-[#4DA528]" />
                <h1 className="mt-5 text-3xl font-extrabold text-stone-950">Article not found</h1>
                <p className="mt-3 text-sm leading-7 text-stone-500">This article may have been removed or unpublished.</p>
                <button
                  type="button"
                  onClick={() => handleNavigate('blogs')}
                  className="mt-6 rounded-[5px] bg-[#4DA528] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                >
                  Browse Articles
                </button>
              </div>
            </div>
          )}

          {currentView === 'reviews' && (
            <VerifiedReviews onNavigate={handleNavigate} />
          )}

          {currentView === 'about' && <AboutView />}

          {currentView === 'ai-curator' && (
            <AiCuratorView 
              onNavigateToHome={() => handleNavigate('home')} 
              onNavigate={handleNavigate}
              websiteCMS={websiteCMS}
            />
          )}

          {currentView === 'contact' && (
            <ContactView onEnquirySuccess={fetchAllData} websiteCMS={websiteCMS} />
          )}

          {currentView === 'portal' && (
            <CustomerPortalView 
              onLogout={handleAdminLogout} 
              onNavigateToHome={() => handleNavigate('home')} 
              onNavigate={handleNavigate}
              onNavigateToPackages={() => handleNavigate('packages')}
              savedPackagesRefreshKey={savedPackagesRefreshKey}
              packages={packages}
              websiteCMS={websiteCMS}
            />
          )}

          {currentView === 'admin-dashboard' && authResolved && isAdminLoggedIn && (
            <AdminDashboardView
              packages={packages}
              enquiries={enquiries}
              gallery={gallery}
              activities={activities}
              adminEmail={adminEmail}
              onLogout={handleAdminLogout}
              onNavigatePublic={() => handleNavigate('home')}
              onRefreshData={fetchAllData}
              websiteCMS={websiteCMS}
            />
          )}
        </Suspense>
      </main>

      {wishlistToast && (
        <div className={`fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur ${wishlistToast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#081E2A] text-white'}`}>
          {wishlistToast.message}
        </div>
      )}

      {showLoginModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/70 px-4 py-6 backdrop-blur-sm"
          onClick={handleCloseLoginModal}
        >
          <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={handleCloseLoginModal}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
              aria-label="Close login dialog"
            >
              ×
            </button>
            <LoginModal
              onLoginSuccess={(isAdmin) => {
                setLoginModalOpen(false);
                if (isAdmin) {
                  setCurrentView('admin-dashboard');
                } else {
                  const targetView = pendingPostLoginView || 'portal';
                  setCurrentView(targetView);
                  setSelectedPackageId(targetView === 'package-detail' ? selectedPackageId : null);
                  if (pendingWishlistPackage) {
                    window.setTimeout(() => {
                      if (auth.currentUser) {
                        void handleToggleWishlist(pendingWishlistPackage);
                      }
                    }, 80);
                  }
                }
                setPendingPostLoginView(null);
                setPendingWishlistPackage(null);
              }}
            />
          </div>
        </div>
      )}

      <PremiumEnquiryModal
        isOpen={quoteModalOpen}
        onClose={handleCloseQuoteModal}
        onSuccess={fetchAllData}
        packageContext={quotePackage}
      />

      {/* Hide footer on full-screen admin dashboard */}
      {currentView !== 'admin-dashboard' && !isImmersiveCustomLanding && (
        <Footer onNavigate={handleNavigate} websiteCMS={websiteCMS} gallery={gallery} loading={loadingData} />
      )}

      {/* Floating Action Buttons Vertical Stack */}
      {currentView !== 'admin-dashboard' && !isImmersiveCustomLanding && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" id="floating-actions-stack">
          
          {/* Premium Enquiry Floating Button */}
          <button
            type="button"
            onClick={() => handleOpenQuoteModal()}
            className="flex items-center gap-2.5 rounded-full border border-[#4DA528]/40 bg-stone-900 px-4 py-3 text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:bg-[#4DA528] hover:shadow-xl sm:px-5 sm:py-3.5 cursor-pointer relative group"
          >
            {/* Ambient Pulse */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4DA528] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#4DA528]"></span>
            </span>

            <Sparkles className="w-5 h-5 text-[#4DA528] group-hover:text-white transition-colors duration-200 animate-pulse" />
            
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300 group-hover:text-white leading-none">Plan Your Trip</span>
              <span className="text-[8.5px] text-stone-400 group-hover:text-white/80 font-light leading-none mt-0.5">
                Get Free Quote
              </span>
            </div>
          </button>

          {/* Chat with us (WhatsApp) Floating Button */}
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[#008080] hover:bg-[#006666] text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer relative border border-[#008080]/30 group"
          >
            {/* Emerald Breathing Pulse */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>

            <MessageCircle className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors duration-200" />
            
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-100 group-hover:text-white leading-none">Chat with us</span>
              <span className="text-[8.5px] text-stone-200 group-hover:text-teal-100 font-light leading-none mt-0.5">
                On WhatsApp
              </span>
            </div>
          </a>

          {/* Contact Us Floating Button */}
          <button
            type="button"
            onClick={() => handleNavigate('contact')}
            className={`flex items-center gap-2.5 bg-stone-900 hover:bg-[#008080] text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer relative border border-stone-800 group ${currentView === 'contact' ? 'bg-[#008080]' : ''}`}
          >
            {/* Amber Breathing Pulse */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>

            <Compass className="w-5 h-5 text-amber-400 group-hover:text-white transition-colors duration-200" />
            
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300 group-hover:text-white leading-none">Contact Us</span>
              <span className="text-[8.5px] text-stone-400 group-hover:text-teal-100 font-light leading-none mt-0.5">
                Direct Inquiry
              </span>
            </div>
          </button>

        </div>
      )}

    </div>
  );
}
