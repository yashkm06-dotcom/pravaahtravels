import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, collection, getDocs, query, orderBy, deleteDoc, doc, getDoc } from './lib/firebase';
import { SEED_GALLERY } from './lib/seedData';
import { MessageCircle, Sparkles, Compass } from 'lucide-react';
import { TravelPackage, Enquiry, GalleryImage, DestinationCategory, WebsiteCMSSettings, DEFAULT_WEBSITE_CMS } from './types';

// Component imports
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import PackagesView from './components/PackagesView';
import PackageDetailView from './components/PackageDetailView';
import DestinationsView from './components/DestinationsView';
import GalleryView from './components/GalleryView';
import ContactView from './components/ContactView';
import AdminLoginView from './components/AdminLoginView';
import AdminDashboardView from './components/AdminDashboardView';
import CustomerPortalView from './components/CustomerPortalView';
import AiCuratorView from './components/AiCuratorView';
import VerifiedReviews from './components/VerifiedReviews';
import SEO from './components/SEO';

interface RouteState {
  view: string;
  packageId: string | null;
}

const getRouteStateFromUrl = (): RouteState => {
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    return { view: 'home', packageId: null };
  }
  if (path.startsWith('/package/')) {
    const parts = path.split('/');
    const packageId = parts[2] || null;
    return { view: 'package-detail', packageId };
  }
  const cleanPath = path.replace(/^\//, ''); // remove leading slash
  if (cleanPath === 'review' || cleanPath === 'reviews') {
    return { view: 'reviews', packageId: null };
  }
  const allowedViews = [
    'destinations',
    'packages',
    'gallery',
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
  if (view === 'package-detail' && packageId) return `/package/${packageId}`;
  if (view === 'reviews') return '/review'; // as explicitly requested
  return `/${view}`;
};

export default function App() {
  // Views navigation - initialized dynamically from the URL path
  const [currentView, setCurrentView] = useState<string>(() => {
    return getRouteStateFromUrl().view;
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(() => {
    return getRouteStateFromUrl().packageId;
  });
  const [prefilledCategory, setPrefilledCategory] = useState<string>('All');

  // Firebase auth state
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser) {
      const email = currentAuthUser.email?.trim().toLowerCase() || '';
      return (
        email === 'yash.km06@gmail.com' ||
        email === 'admin@pravaahtravels.com' ||
        email.endsWith('@pravaahtravels.com')
      );
    }
    return false;
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser) {
      const email = currentAuthUser.email?.trim().toLowerCase() || '';
      const isApproved =
        email === 'yash.km06@gmail.com' ||
        email === 'admin@pravaahtravels.com' ||
        email.endsWith('@pravaahtravels.com');
      return isApproved ? email : '';
    }
    return '';
  });

  // Firestore collections data
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [websiteCMS, setWebsiteCMS] = useState<WebsiteCMSSettings>(DEFAULT_WEBSITE_CMS);

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

    // 1. Fetch Packages
    let fetchedPackages: TravelPackage[] = [];
    const packagesColName = 'packages';
    try {
      const packagesCol = collection(db, packagesColName);
      const packagesQuery = query(packagesCol, orderBy('createdAt', 'desc'));
      const packagesSnapshot = await getDocs(packagesQuery);
      fetchedPackages = packagesSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as TravelPackage[];
    } catch (err: any) {
      console.warn('Error fetching packages from Firestore:', err);
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, packagesColName);
      }
    }

    setPackages(fetchedPackages);

    // 2. Fetch Gallery
    let fetchedGallery: GalleryImage[] = [];
    const galleryColName = 'gallery';
    try {
      const galleryCol = collection(db, galleryColName);
      const galleryQuery = query(galleryCol, orderBy('createdAt', 'desc'));
      const gallerySnapshot = await getDocs(galleryQuery);
      fetchedGallery = gallerySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as GalleryImage[];
    } catch (err: any) {
      console.warn('Error fetching gallery from Firestore, falling back to local pre-seeded data:', err);
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, galleryColName);
      }
    }

    // Fallback to local gallery if database is empty or still seeding
    if (fetchedGallery.length === 0) {
      fetchedGallery = SEED_GALLERY.map((img, idx) => ({
        id: `seed-gallery-${idx}`,
        order: idx,
        ...img,
      })) as unknown as GalleryImage[];
    }
    fetchedGallery.sort((a, b) => {
      const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    setGallery(fetchedGallery);

    // 4. Fetch Website CMS settings
    try {
      const cmsSnap = await getDoc(doc(db, 'siteSettings', 'main'));
      if (cmsSnap.exists()) {
        setWebsiteCMS({
          ...DEFAULT_WEBSITE_CMS,
          ...cmsSnap.data(),
        } as WebsiteCMSSettings);
      } else {
        setWebsiteCMS(DEFAULT_WEBSITE_CMS);
      }
    } catch (err: any) {
      console.warn('Error fetching website CMS settings, using defaults:', err);
      if (err.message?.includes('permission') || err.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, 'siteSettings/main');
      }
      setWebsiteCMS(DEFAULT_WEBSITE_CMS);
    }

    // 5. Fetch Enquiries (Only if admin is logged in, else security rules blocks it)
    const enquiriesColName = 'enquiries';
    try {
      const currentAuthUser = auth.currentUser;
      const email = currentAuthUser?.email || null;
      const cleanEmail = email?.trim().toLowerCase() || '';
      const isAdmin =
        cleanEmail === 'yash.km06@gmail.com' ||
        cleanEmail === 'admin@pravaahtravels.com' ||
        cleanEmail.endsWith('@pravaahtravels.com');

      if (isAdmin) {
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const cleanEmail = user.email?.trim().toLowerCase() || '';
        const isApproved =
          cleanEmail === 'yash.km06@gmail.com' ||
          cleanEmail === 'admin@pravaahtravels.com' ||
          cleanEmail.endsWith('@pravaahtravels.com');

        if (isApproved) {
          setIsAdminLoggedIn(true);
          setAdminEmail(cleanEmail);
        } else {
          setIsAdminLoggedIn(false);
          setAdminEmail('');
        }
      } else {
        setCurrentUser(null);
        setIsAdminLoggedIn(false);
        setAdminEmail('');
      }
      // Re-trigger database fetching
      fetchAllData();
    });

    return () => unsubscribe();
  }, [fetchAllData]);

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

  // ----------------------------------------------------
  // ACTIONS / HANDLERS
  // ----------------------------------------------------
  const handleNavigate = (view: string, packageId: string | null = null) => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'admin-dashboard' && !isAdminLoggedIn) {
      setCurrentView('admin-login');
      return;
    }

    if (view === 'portal' && !currentUser) {
      setCurrentView('admin-login');
      return;
    }

    setCurrentView(view);
    setSelectedPackageId(packageId);
  };

  const handleSelectCategory = (category: DestinationCategory) => {
    setPrefilledCategory(category);
    setCurrentView('packages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (selectedPackageId === id) {
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
    return packages.filter((p) => p.featured && p.active);
  }, [packages]);

  const activeSelectedPackage = useMemo(() => {
    if (!selectedPackageId) return null;
    return packages.find((p) => p.id === selectedPackageId) || null;
  }, [packages, selectedPackageId]);

  // Generate dynamic WhatsApp contact url containing page context
  const getWhatsAppUrl = () => {
    const phone = "919999999999";
    let text = "Hi Pravaah Travels support team! ";

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
        if (activeSelectedPackage) {
          text += `I am viewing the tour details of the package "${activeSelectedPackage.title}" (ID: ${activeSelectedPackage.id}). I'd like to ask about custom pricing and dates for this exact tour.`;
        } else {
          text += "I am viewing tour package details and would like custom guidance on your high-altitude routes.";
        }
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

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-800 font-sans" id="app-root">
      <SEO
        title={websiteCMS.seoTitle}
        description={websiteCMS.seoDescription}
        keywords={websiteCMS.seoKeywords}
        ogImage={websiteCMS.heroBackgroundImageUrl}
      />
      
      {/* Hide header on full-screen admin dashboard */}
      {currentView !== 'admin-dashboard' && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          isAdminLoggedIn={isAdminLoggedIn}
          currentUser={currentUser}
          onAdminLogout={handleAdminLogout}
          websiteCMS={websiteCMS}
        />
      )}

      {/* Main viewport block */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            featuredPackages={featuredPackages}
            onNavigate={handleNavigate}
            loading={loadingData}
            isAdminLoggedIn={isAdminLoggedIn}
            onDeletePackage={handleDeletePackage}
            onSelectCategory={handleSelectCategory}
            websiteCMS={websiteCMS}
          />
        )}

        {currentView === 'destinations' && (
          <DestinationsView onSelectCategory={handleSelectCategory} />
        )}

        {currentView === 'packages' && (
          <PackagesView
            packages={packages}
            onNavigate={handleNavigate}
            loading={loadingData}
            isAdminLoggedIn={isAdminLoggedIn}
            onDeletePackage={handleDeletePackage}
            prefilledCategory={prefilledCategory}
            onResetPrefilledCategory={() => setPrefilledCategory('All')}
          />
        )}

        {currentView === 'package-detail' && activeSelectedPackage && (
          <PackageDetailView
            pkg={activeSelectedPackage}
            onBack={() => handleNavigate('packages')}
            onEnquirySuccess={fetchAllData}
            isAdminLoggedIn={isAdminLoggedIn}
            onDeletePackage={handleDeletePackage}
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

        {currentView === 'gallery' && (
          <GalleryView gallery={gallery} loading={loadingData} />
        )}

        {currentView === 'reviews' && (
          <VerifiedReviews onNavigate={handleNavigate} />
        )}

        {currentView === 'about' && <AboutView />}

        {currentView === 'ai-curator' && (
          <AiCuratorView 
            onNavigateToHome={() => handleNavigate('home')} 
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'contact' && (
          <ContactView onEnquirySuccess={fetchAllData} />
        )}

        {currentView === 'portal' && (
          <CustomerPortalView 
            onLogout={handleAdminLogout} 
            onNavigateToHome={() => handleNavigate('home')} 
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLoginView
            onLoginSuccess={(isAdmin) => {
              if (isAdmin) {
                handleNavigate('admin-dashboard');
              } else {
                handleNavigate('portal');
              }
            }}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboardView
            packages={packages}
            enquiries={enquiries}
            gallery={gallery}
            adminEmail={adminEmail}
            onLogout={handleAdminLogout}
            onNavigatePublic={() => handleNavigate('home')}
            onRefreshData={fetchAllData}
            websiteCMS={websiteCMS}
          />
        )}
      </main>

      {/* Hide footer on full-screen admin dashboard */}
      {currentView !== 'admin-dashboard' && (
        <Footer onNavigate={handleNavigate} websiteCMS={websiteCMS} gallery={gallery} />
      )}

      {/* Floating Action Buttons Vertical Stack */}
      {currentView !== 'admin-dashboard' && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" id="floating-actions-stack">
          
          {/* Trip Planner (AI Curator) Floating Button */}
          <button
            type="button"
            onClick={() => handleNavigate('ai-curator')}
            className={`flex items-center gap-2.5 bg-stone-900 hover:bg-[#008080] text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer relative border border-stone-800 group ${currentView === 'ai-curator' ? 'bg-[#008080]' : ''}`}
          >
            {/* Ambient Pulse */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500"></span>
            </span>

            <Sparkles className="w-5 h-5 text-teal-400 group-hover:text-white transition-colors duration-200 animate-pulse" />
            
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300 group-hover:text-white leading-none">Trip Planner</span>
              <span className="text-[8.5px] text-stone-400 group-hover:text-teal-100 font-light leading-none mt-0.5">
                AI Custom Itinerary
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
