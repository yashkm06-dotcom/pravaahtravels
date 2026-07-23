import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Star, Heart, Compass, ShieldCheck, Map, 
  PlaneTakeoff, Trash2, Search, Sparkles, AlertCircle,
  X, GripVertical, ArrowUp, ArrowDown, Users, Clock, Check, Send,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { TravelPackage, formatPrice, DestinationCategory, WebsiteCMSSettings, PACKAGE_LOCATIONS, PackageLocation, ActivityItem, ActivityChildItem, ActivityRecommendation, FeaturedCategoryItem } from '../types';
import InteractiveRouteMap from './InteractiveRouteMap';
import { db, collection, addDoc } from '../lib/firebase';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { SkeletonCard } from './SkeletonLoader';
import aboutImageVideo from '../assets/about-section/about-us/image-video.png?url';
import enjoyImage from '../assets/about-section/page/enjoy.png';
import founderNameImage from '../assets/about-section/page/name.png';
import avatar10 from '../assets/about-section/avatars/10.jpg';

interface HomeViewProps {
  featuredPackages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  loading: boolean;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
  onSelectCategory: (category: DestinationCategory) => void;
  onSearchByLocation?: (location: string) => void;
  websiteCMS: WebsiteCMSSettings;
  wishlistPackageIds?: string[];
  onToggleWishlist?: (pkg: TravelPackage) => void;
  activities?: ActivityItem[];
  activityItems?: ActivityChildItem[];
  activityRecommendations?: ActivityRecommendation[];
  featuredCategories?: FeaturedCategoryItem[];
  packages?: TravelPackage[];
}

type ActivityDestination = {
  id: string;
  name: string;
  type: string;
  image: string;
  category: DestinationCategory;
  description?: string;
  location?: string;
};

type PackageCardProps = {
  pkg: TravelPackage;
  index: number;
  isWishlisted: boolean;
  onNavigate: (view: string, packageId?: string | null) => void;
  onToggleWishlist?: (pkg: TravelPackage) => void;
  onDeletePackage?: (id: string) => void;
  isAdminLoggedIn?: boolean;
};

const PackageCard = React.memo(function PackageCard({
  pkg,
  index,
  isWishlisted,
  onNavigate,
  onToggleWishlist,
  onDeletePackage,
  isAdminLoggedIn = false,
}: PackageCardProps) {
  const hasOffer = Boolean(pkg.offerPrice && pkg.offerPrice < pkg.price);
  const offerPrice = pkg.offerPrice || pkg.price;
  const discountPercent = hasOffer ? Math.round(((pkg.price - (pkg.offerPrice || pkg.price)) / pkg.price) * 100) : 0;
  const rating = pkg.category === 'Treks' ? 4.8 : pkg.category === 'Adventure' ? 4.7 : 4.9;
  const difficulty = pkg.category === 'Treks' ? 'Moderate' : pkg.category === 'Adventure' ? 'Thrilling' : 'Easy';
  const locationLabel = pkg.location || pkg.destination;

  const handleOpen = () => onNavigate('package-detail', pkg.id);

  return (
    <article className="group wow fadeInUp animated h-full overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_24px_56px_rgba(15,23,42,0.12)]" data-wow-delay={`${(index + 1) / 10}s`}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpen();
          }
        }}
        className="relative block h-[270px] w-full cursor-pointer overflow-hidden bg-stone-100 text-left"
      >
        <img
          src={getTravelImage(pkg.imageUrl)}
          alt={pkg.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={handleTravelImageError}
        />
        <div className="absolute inset-0 bg-linear-to-t from-stone-950/35 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#4DA528] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
            {hasOffer ? 'Limited Offer' : 'Featured'}
          </span>
          {hasOffer ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700">
              -{discountPercent}%
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWishlist?.(pkg);
          }}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-rose-500 shadow-lg transition duration-200 hover:scale-110"
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isWishlisted ? 'Remove package from wishlist' : 'Add package to wishlist'}
        >
          <Heart className={`h-4 w-4 transition ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-rose-500'}`} />
        </button>
        {isAdminLoggedIn && onDeletePackage && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDeletePackage(pkg.id);
            }}
            className="absolute bottom-4 right-4 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
            title="Delete Package"
            aria-label="Delete package"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-[#FF970D]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#D57400]">
            {pkg.category}
          </span>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            {rating.toFixed(1)}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[14px] font-medium text-stone-500">
          <Map className="h-4 w-4 text-[#4DA528]" />
          <span className="truncate">{locationLabel}</span>
        </div>
        <h3 className="mt-4 text-[20px] font-bold leading-tight text-stone-950">
          <button onClick={handleOpen} className="text-left transition hover:text-[#4DA528]">
            {pkg.title}
          </button>
        </h3>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-stone-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1">
            <Clock className="h-4 w-4 text-[#4DA528]" />
            {pkg.duration}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1">
            <Users className="h-4 w-4 text-[#4DA528]" />
            {difficulty}
          </span>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">
          {pkg.shortDescription || pkg.destination}
        </p>
        <div className="mt-6 flex flex-col gap-4 border-t border-stone-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">Starting from</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[22px] font-extrabold text-[#4DA528]">{formatPrice(offerPrice)}</span>
              {hasOffer ? <span className="text-sm text-stone-400 line-through">{formatPrice(pkg.price)}</span> : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-[144px]">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleOpen();
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#4DA528] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a8d1f]"
            >
              Book Now
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleOpen();
              }}
              className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

type RecommendationCardProps = {
  recommendation: ActivityRecommendation;
  linkedPackage?: TravelPackage;
  onNavigate: (view: string, packageId?: string | null) => void;
  index: number;
};

const RecommendationCard = React.memo(function RecommendationCard({ recommendation, linkedPackage, onNavigate, index }: RecommendationCardProps) {
  const imageUrl = recommendation.thumbnailUrl || linkedPackage?.imageUrl || 'https://images.unsplash.com/photo-1516685304081-de7947d419d3?auto=format&fit=crop&w=800&q=80';
  const price = recommendation.price ?? linkedPackage?.offerPrice ?? linkedPackage?.price;
  const rating = recommendation.rating ?? 4.8;
  const duration = recommendation.duration || linkedPackage?.duration || 'Flexible';
  const locationLabel = recommendation.location || linkedPackage?.destination || 'Uttarakhand';
  const badge = recommendation.badge || linkedPackage?.category || 'Recommended';

  const handleOpen = () => {
    if (linkedPackage) {
      onNavigate('package-detail', linkedPackage.id);
      return;
    }
    onNavigate('packages');
  };

  return (
    <article className="group wow fadeInUp animated overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_22px_48px_rgba(15,23,42,0.12)]" data-wow-delay={`${(index + 1) / 10}s`}>
      <div className="relative h-[220px] overflow-hidden">
        <img
          src={getTravelImage(imageUrl)}
          alt={recommendation.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          width="800"
          height="560"
          onError={handleTravelImageError}
        />
        <div className="absolute inset-0 bg-linear-to-t from-stone-950/25 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-800">
          {badge}
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4DA528]">Recommended</span>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            {rating.toFixed(1)}
          </div>
        </div>
        <h3 className="mt-4 text-[20px] font-bold leading-tight text-stone-950">{recommendation.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{recommendation.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
            <Map className="h-4 w-4 text-[#4DA528]" />
            {locationLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
            <Clock className="h-4 w-4 text-[#4DA528]" />
            {duration}
          </span>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-stone-100 pt-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">From</p>
            <p className="mt-1 text-[20px] font-extrabold text-[#4DA528]">{price ? formatPrice(price) : 'On request'}</p>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center justify-center rounded-full bg-[#4DA528] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a8d1f]"
          >
            {linkedPackage ? 'View package' : 'Explore'}
          </button>
        </div>
      </div>
    </article>
  );
});

export default function HomeView({
  featuredPackages,
  onNavigate,
  loading,
  isAdminLoggedIn = false,
  onDeletePackage,
  onSelectCategory,
  onSearchByLocation,
  websiteCMS,
  wishlistPackageIds = [],
  onToggleWishlist,
  activities = [],
  activityItems = [],
  activityRecommendations = [],
  featuredCategories = [],
  packages: packageList = [],
}: HomeViewProps) {
  // Wizard Planner State
  const [plannerCategory, setPlannerCategory] = useState<DestinationCategory>('Pilgrimage');
  const [plannerStyle, setPlannerStyle] = useState<string>('Bespoke Luxury');
  const [plannerDuration, setPlannerDuration] = useState<string>('Medium (5-7 Days)');
  const [plannerLocation, setPlannerLocation] = useState<PackageLocation | string>('Uttarakhand');
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>('All');
  const [plannerGuests, setPlannerGuests] = useState<string>('2');
  const [plannerActivity, setPlannerActivity] = useState<string>('Pilgrimage');
  const [activeActivityId, setActiveActivityId] = useState<string>('');
  const [activeFeaturedSlug, setActiveFeaturedSlug] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([15000, 50000]);
  const priceMin = 5000;
  const priceMax = 120000;
  const locationOptions = PACKAGE_LOCATIONS;

  // AI-Powered Personalized Quiz State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({
    destination: 'Kedarnath & Divine Valley',
    companions: 'Family & Elderlies',
    vibe: 'Peaceful Pilgrimage',
    duration: '5',
    budget: '45000',
    specialRequests: ''
  });

  // AI Gen result state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState('');
  const [activeAiDay, setActiveAiDay] = useState<number | null>(1);
  const [isCustomizingAi, setIsCustomizingAi] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // AI Enquiry submission state
  const [aiEnquiryData, setAiEnquiryData] = useState({
    name: '',
    phone: '',
    email: '',
    travelDate: ''
  });
  const [aiEnquirySubmitting, setAiEnquirySubmitting] = useState(false);
  const [aiEnquirySuccess, setAiEnquirySuccess] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [packagesVisible, setPackagesVisible] = useState(true);

  const whyChooseUs = [
    {
      icon: <Compass className="w-6 h-6 text-[#4DA528]" />,
      title: 'Expert Himalayan Curation',
      description: 'Our itineraries are designed by certified mountain guides and travel specialists who know the safest routes, best view points, and local secrets.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#4DA528]" />,
      title: 'Uncompromised Comfort & Safety',
      description: 'Your safety is our priority. We feature 4x4 private transport, vetted hand-picked premium lodges, and 24/7 on-the-ground support.'
    },
    {
      icon: <Map className="w-6 h-6 text-[#4DA528]" />,
      title: 'A Gentle, Natural Flow',
      description: 'True "Pravaah" means flow. No rushed timings or crowded buses. We focus on slow travel that leaves your soul deeply rejuvenated.'
    }
  ];

  const popularDestinations = useMemo<ActivityDestination[]>(() => {
    const fallbacks: ActivityDestination[] = [
      {
        id: 'activity-uttarakhand-pilgrimages',
        name: 'Uttarakhand Pilgrimages',
        type: 'Spiritual Yatras & Darshan',
        image: 'https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=600&q=80',
        category: 'Pilgrimage' as DestinationCategory,
        location: 'Uttarakhand',
        description: 'Sacred yatra packages across the Garhwal and Kumaon regions.',
      },
      {
        id: 'activity-himalayan-treks',
        name: 'Himalayan Treks',
        type: 'Unexplored Peak Trails',
        image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=600&q=80',
        category: 'Treks' as DestinationCategory,
        location: 'Uttarakhand',
        description: 'High-altitude treks and mountain trail adventures.',
      },
      {
        id: 'activity-rishikesh-rafting',
        name: 'Rishikesh Rafting',
        type: 'Adrenaline & Bungee Jumps',
        image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
        category: 'Adventure' as DestinationCategory,
        location: 'Uttarakhand',
        description: 'River rafting, bungee jumping, and active outdoor thrills.',
      },
      {
        id: 'activity-himachal-ladakh-desert',
        name: 'Himachal & Ladakh Desert',
        type: 'High Passes & Monasteries',
        image: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=600&q=80',
        category: 'Ladakh' as DestinationCategory,
        location: 'Ladakh',
        description: 'Cultural desert circuits and high-altitude panorama.',
      }
    ];

    return activities.length > 0
      ? activities.map((activity) => ({
          id: activity.id,
          name: activity.title,
          type: activity.subtitle,
          image: activity.imageUrl,
          category: activity.category,
          description: activity.description,
          location: activity.location,
        }))
      : fallbacks;
  }, [activities]);

  const featuredCategoryCards = useMemo(() => {
    if (featuredCategories.length > 0) {
      return featuredCategories.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        image: item.imageUrl,
        category: item.category,
        location: item.location,
        packageIds: item.packageIds || [],
        slug: item.slug,
      }));
    }

    return [
      {
        id: 'pilgrimage',
        title: 'Pilgrimage Escapes',
        description: 'Sacred valleys, temple towns, and curated spiritual comfort.',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=600',
        category: 'Pilgrimage' as DestinationCategory,
        location: 'Uttarakhand',
        packageIds: [],
        slug: 'pilgrimage-escapes',
      },
      {
        id: 'treks',
        title: 'Trek & Trails',
        description: 'High-altitude adventures with premium logistics support.',
        image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=600',
        category: 'Treks' as DestinationCategory,
        location: 'Uttarakhand',
        packageIds: [],
        slug: 'trek-trails',
      },
    ];
  }, [featuredCategories]);

  const handleLaunchPlanner = () => {
    // Open the interactive wizard quiz modal
    setShowQuizModal(true);
    setQuizStep(1);
    setAiResult(null);
    setAiError('');
  };

  const handleSearchSubmit = () => {
    const searchFilters = {
      location: plannerLocation,
      bookingType: plannerStyle,
      tourDuration: plannerDuration,
      guests: plannerGuests,
      priceRange,
      activity: plannerActivity
    };

    setActiveLocationFilter(String(plannerLocation));
    onSearchByLocation?.(String(plannerLocation));
    onSelectCategory(plannerCategory);
    return searchFilters;
  };

  const handleHeroCtaClick = () => {
    const link = (websiteCMS.heroCtaLink || 'packages').trim();
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }
    const normalized = link.replace(/^\//, '') || 'packages';
    onNavigate(normalized);
  };

  const heroBackgroundImage = getTravelImage(
    websiteCMS.heroBackgroundImageUrl || 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&q=80&w=1700'
  );

  // AI Generation API Caller
  const handleGenerateAiItinerary = async () => {
    setAiGenerating(true);
    setAiError('');
    setAiResult(null);

    try {
      const response = await fetch('/api/generate-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: quizAnswers.destination,
          duration: quizAnswers.duration,
          budget: quizAnswers.budget,
          vibe: `${quizAnswers.vibe} with ${quizAnswers.companions}`,
          specialRequests: quizAnswers.specialRequests
        })
      });

      if (!response.ok) {
        let msg = 'Our AI models are temporarily busy. Please try again.';
        try {
          const errData = await response.json();
          if (errData?.details) {
            msg = `Itinerary curation failed: ${errData.details}`;
          } else if (errData?.error) {
            msg = `Itinerary curation failed: ${errData.error}`;
          }
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await response.json();
      setAiResult(data);
      setQuizStep(5); // Show result screen
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Unable to curate itinerary. Please verify parameters.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Drag and Drop within AI Generator
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index || !aiResult) return;
    const reordered = [...aiResult.itinerary];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);
    
    // Re-index days sequentially
    const updated = reordered.map((item, idx) => ({
      ...item,
      day: idx + 1
    }));
    
    setAiResult({
      ...aiResult,
      itinerary: updated
    });
    setDraggedIndex(null);
    setActiveAiDay(index + 1);
  };

  const moveAiDay = (index: number, direction: 'up' | 'down') => {
    if (!aiResult) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= aiResult.itinerary.length) return;

    const reordered = [...aiResult.itinerary];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((item, idx) => ({
      ...item,
      day: idx + 1
    }));

    setAiResult({
      ...aiResult,
      itinerary: updated
    });
    setActiveAiDay(targetIndex + 1);
  };

  // Submit enquiry for custom AI plan to Firestore
  const handleAiBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResult) return;
    setAiEnquirySubmitting(true);

    try {
      const payload = {
        name: aiEnquiryData.name,
        phone: aiEnquiryData.phone,
        email: aiEnquiryData.email,
        destination: quizAnswers.destination,
        travelDate: aiEnquiryData.travelDate,
        travelers: String(quizAnswers.companions ?? '').includes('Couple') ? 2 : 4,
        budget: `₹${Number(quizAnswers.budget).toLocaleString('en-IN')}`,
        message: `🤖 PRAVAAH AI CUSTOM TRIP: "${aiResult.title}"\n` + 
                 `Duration: ${aiResult.duration}\n` +
                 `Vibe: ${quizAnswers.vibe}\n` +
                 `Customized Order:\n` + 
                 aiResult.itinerary.map((d: any) => `Day ${d.day}: ${d.title}`).join('\n') +
                 `\nSpecial requirements: ${quizAnswers.specialRequests || 'None'}`,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'enquiries'), payload);
      setAiEnquirySuccess(true);
    } catch (err) {
      console.error(err);
      alert('We could not submit your trip request right now. Please check your connection and try again.');
    } finally {
      setAiEnquirySubmitting(false);
    }
  };

  const enabledActivities = useMemo(() => {
    return activities
      .filter((activity) => activity.enabled !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [activities]);

  const activityTabs = enabledActivities;

  const filteredActivityPackages = useMemo(() => {
    if (!activeActivityId) return [];
    return packageList.filter((pkg) => pkg.activityId === activeActivityId);
  }, [packageList, activeActivityId]);

  const filteredActivityItems = useMemo(() => {
    if (!activeActivityId) return [];
    return activityItems
      .filter((item) => item.activityId === activeActivityId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [activityItems, activeActivityId]);

  const filteredActivityRecommendations = useMemo(() => {
    if (!activeActivityId) return [];
    return activityRecommendations
      .filter((item) => item.activityId === activeActivityId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [activityRecommendations, activeActivityId]);

  const activityTransitionTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (!activeActivityId && activityTabs.length > 0) {
      setActiveActivityId(activityTabs[0].id);
    }
  }, [activityTabs, activeActivityId]);

  useEffect(() => {
    return () => {
      if (activityTransitionTimeout.current) {
        window.clearTimeout(activityTransitionTimeout.current);
      }
    };
  }, []);

  const activeFeaturedCategory = featuredCategoryCards.find((item) => item.slug === activeFeaturedSlug) || featuredCategoryCards[0] || null;

  const itemActivityTitle = (activityId: string) => activities.find((activity) => activity.id === activityId)?.title || 'Activity';

  useEffect(() => {
    if (!activeFeaturedSlug && featuredCategoryCards.length > 0) {
      setActiveFeaturedSlug(featuredCategoryCards[0].slug);
    }
  }, [featuredCategoryCards, activeFeaturedSlug]);

  const scrollToFeaturedPackages = () => {
    document.getElementById('featured-packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleActivityClick = (activityId: string) => {
    if (activityId === activeActivityId) return;

    setPackagesVisible(false);
    if (activityTransitionTimeout.current) {
      window.clearTimeout(activityTransitionTimeout.current);
    }

    activityTransitionTimeout.current = window.setTimeout(() => {
      setActiveActivityId(activityId);
      setPackagesVisible(true);
      activityTransitionTimeout.current = null;
    }, 300);
  };

  const handleFeaturedCategoryClick = (slug: string) => {
    setActiveFeaturedSlug(slug);
    scrollToFeaturedPackages();
  };

  const handlePlannerCategorySelect = (category: DestinationCategory) => {
    setPlannerCategory(category);
    const relatedFeatured = featuredCategoryCards.find((item) => item.category === category);
    if (relatedFeatured) {
      setActiveFeaturedSlug(relatedFeatured.slug);
    } else if (featuredCategoryCards.length > 0) {
      setActiveFeaturedSlug(featuredCategoryCards[0].slug);
    }
  };

  const filteredCategoryPackages = useMemo(() => {
    const packagesSource = packageList || [];
    const linkedPackageIds = Array.isArray(activeFeaturedCategory?.packageIds) ? activeFeaturedCategory.packageIds : [];

    if (linkedPackageIds.length > 0) {
      return packagesSource.filter((pkg) => linkedPackageIds.includes(String(pkg.id ?? '')));
    }

    return packagesSource.filter((pkg) => {
      const matchesFeaturedCategory = activeFeaturedCategory
        ? (activeFeaturedCategory.category && pkg.category === activeFeaturedCategory.category)
          || (activeFeaturedCategory.location && (String(pkg.location ?? '').toLowerCase().includes(String(activeFeaturedCategory.location ?? '').toLowerCase()) || String(pkg.destination ?? '').toLowerCase().includes(String(activeFeaturedCategory.location ?? '').toLowerCase())))
        : false;

      const matchesPlannerCategory = plannerCategory ? pkg.category === plannerCategory : false;
      return matchesFeaturedCategory || matchesPlannerCategory;
    });
  }, [packageList, activeFeaturedCategory, plannerCategory]);

  const activeOfferPackages = filteredCategoryPackages.filter((pkg) => {
    const price = Number(pkg.price);
    const offerPrice = Number(pkg.offerPrice);
    return Number.isFinite(price) && Number.isFinite(offerPrice) && offerPrice > 0 && offerPrice < price;
  });
  const offerPackages = activeOfferPackages.length > 0 ? activeOfferPackages : filteredCategoryPackages;

  const featuredCarouselPackages = useMemo(() => {
    const visible = filteredCategoryPackages.slice(0, 6);
    if (visible.length === 0) return [];
    return visible.slice(featuredIndex, featuredIndex + 3);
  }, [featuredIndex, filteredCategoryPackages]);

  const handlePrevFeatured = () => {
    setFeaturedIndex((prev) => (prev === 0 ? Math.max(0, filteredCategoryPackages.length - 3) : prev - 1));
  };

  const handleNextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1 >= filteredCategoryPackages.length - 2 ? 0 : prev + 1));
  };
  const bestOfferDiscount = activeOfferPackages.length > 0
    ? Math.max(
        ...activeOfferPackages.map((pkg) => {
          const price = Number(pkg.price);
          const offerPrice = Number(pkg.offerPrice);
          return Math.round(((price - offerPrice) / price) * 100);
        })
      )
    : 0;

  return (
    <div id="home-view" className="animate-fade-in overflow-hidden bg-white font-sans">
      <section className="relative min-h-[760px] overflow-hidden bg-[#081E2A] text-white lg:min-h-[820px]" id="home-hero">
        <div className="absolute inset-0 bg-[#081E2A]" />
        <div className="absolute inset-0 bg-linear-to-r from-[#081E2A] via-[#081E2A]/92 to-[#081E2A]/10" />
        <div className="absolute inset-y-0 right-0 hidden w-[57%] overflow-hidden lg:block">
          <img
            src={heroBackgroundImage}
            alt="Himalayan mountain backdrop"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-88"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={handleTravelImageError}
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#081E2A]/74 via-[#081E2A]/16 to-[#081E2A]/4" />
          <div className="absolute inset-0 bg-linear-to-t from-[#081E2A]/48 via-transparent to-white/8" />
          <div className="absolute -left-[18%] top-0 h-full w-[50%] bg-[#081E2A] [clip-path:ellipse(72%_68%_at_0%_50%)]" />
          <div className="absolute -left-[8%] top-[6%] h-[88%] w-[32%] border-l border-white/12 bg-white/8 backdrop-blur-[1px] [clip-path:ellipse(62%_54%_at_0%_50%)]" />

          <div className="absolute right-[12%] top-[94px] h-[640px] w-[430px] overflow-hidden rounded-t-full rounded-b-[220px] border border-white/24 bg-white/10 shadow-[0_36px_90px_rgba(0,0,0,0.38)] backdrop-blur-[2px]">
            <img
              src={getTravelImage('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1050')}
              alt="Traveler enjoying mountain route"
              className="h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              onError={handleTravelImageError}
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#081E2A]/28 via-transparent to-white/10" />
          </div>

          <div className="absolute right-[8%] top-[82px] h-[172px] w-[172px] rounded-full border border-white/35" />
          <div className="absolute right-[10.7%] top-[122px] h-[92px] w-[92px] rounded-full border border-white/22" />
          <div className="absolute right-[39%] top-[134px] h-24 w-24 rotate-12 rounded-[28px] border border-white/16 bg-white/10 backdrop-blur-[2px]" />
          <div className="absolute right-[48%] top-[242px] h-4 w-4 rounded-full bg-[#4DA528] shadow-[0_0_0_16px_rgba(77,165,40,0.18)]" />
          <PlaneTakeoff className="absolute right-[43%] top-[96px] h-16 w-16 -rotate-12 text-white/78" />

          <div className="absolute bottom-[86px] right-[32%] h-[138px] w-[138px] rounded-full bg-[#4DA528] p-[11px] text-white shadow-[0_28px_60px_rgba(0,0,0,0.34)]">
            <div className="flex h-full w-full items-center justify-center rounded-full border border-white/38 text-center">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.18em]">Booking</p>
                <span className="mx-auto mt-3 block h-px w-12 bg-white/72" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-[118px] right-[6%] h-[230px] w-[230px] rounded-full border border-white/15 bg-white/8 blur-[1px]" />
          <div className="absolute bottom-0 right-0 h-48 w-full bg-linear-to-t from-[#081E2A]/55 to-transparent" />
        </div>

        <img
          src={heroBackgroundImage}
          alt="Himalayan mobile tour"
          className="absolute inset-0 h-full w-full object-cover opacity-45 lg:hidden"
          referrerPolicy="no-referrer"
          onError={handleTravelImageError}
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#081E2A] via-[#081E2A]/88 to-[#081E2A]/32 lg:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-white via-white/50 to-transparent" />

        <div className="relative z-10 mx-auto grid min-h-[680px] max-w-[1320px] grid-cols-1 items-center px-4 py-16 sm:min-h-[760px] sm:px-6 sm:py-20 lg:min-h-[820px] lg:grid-cols-[58%_42%] lg:px-8">
          <div className="max-w-[790px] pt-4 lg:pt-0">
            <span className="mb-5 block font-serif text-[34px] italic leading-none text-[#4DA528] sm:text-[46px]">
              Explore the world
            </span>
            <h1 className="text-[58px] font-extrabold leading-[0.98] tracking-[-0.03em] text-white sm:text-[82px] lg:text-[104px] xl:text-[118px]">
              {websiteCMS.heroTitle}
              <span className="block text-[#4DA528]">{websiteCMS.heroTitleAccent}</span>
            </h1>
            <p className="mt-8 max-w-[610px] text-[17px] leading-[1.85] text-white/82 sm:text-[18px]">
              {websiteCMS.heroSubtitle}
            </p>
            <div className="mt-11 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <button
                onClick={handleHeroCtaClick}
                className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[5px] bg-[#4DA528] px-8 py-[18px] text-[15px] font-semibold uppercase tracking-[0.05em] text-white shadow-[0_14px_32px_rgba(77,165,40,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FF970D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf1] sm:w-auto"
              >
                <span className="translate-x-[15px] transition group-hover:translate-x-0">{websiteCMS.heroCtaText}</span>
                <ArrowRight className="h-4 w-4 -translate-x-[15px] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-[5px] px-1 py-[18px] text-[15px] font-semibold text-white transition hover:text-[#4DA528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <span>Who we are</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-28 px-4 sm:px-6 lg:px-8" id="home-search">
        <div className="search-form-widget-slider relative mx-auto max-w-[1180px] rounded-[10px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.14)] sm:p-5">
          <form
            id="search-form-slider"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
          >
            <div className="wd-search flex flex-col overflow-hidden rounded-[7px] border border-stone-200 bg-white lg:flex-row">
              <label className="form-group flex min-h-[104px] flex-1 items-center gap-4 border-b border-stone-200 px-5 py-5 lg:border-b-0 lg:border-r lg:px-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Search className="h-5 w-5" />
                </span>
                <span className="search-bar-group block min-w-0 flex-1">
                  <span className="mb-2 block text-[13px] font-bold text-stone-500">Location</span>
                  <select
                    value={plannerLocation}
                    onChange={(e) => setPlannerLocation(e.target.value)}
                    className="nice-select current w-full appearance-none bg-transparent text-[17px] font-extrabold text-stone-950 outline-none"
                  >
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="form-group flex min-h-[104px] flex-1 items-center gap-4 border-b border-stone-200 px-5 py-5 lg:border-b-0 lg:border-r lg:px-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Heart className="h-5 w-5" />
                </span>
                <span className="search-bar-group block min-w-0 flex-1">
                  <span className="mb-2 block text-[13px] font-bold text-stone-500">Booking Type</span>
                  <select
                    value={plannerStyle}
                    onChange={(e) => setPlannerStyle(e.target.value)}
                    className="nice-select current w-full appearance-none bg-transparent text-[17px] font-extrabold text-stone-950 outline-none"
                  >
                    <option value="Bespoke Luxury">Bespoke Luxury</option>
                    <option value="Family Comfort">Family Comfort</option>
                    <option value="Sacred Slow Travel">Sacred Slow Travel</option>
                    <option value="Adventure Led">Adventure Led</option>
                  </select>
                </span>
              </label>

              <label className="form-group flex min-h-[104px] flex-1 items-center gap-4 border-b border-stone-200 px-5 py-5 lg:border-b-0 lg:border-r lg:px-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Clock className="h-5 w-5" />
                </span>
                <span className="search-bar-group block min-w-0 flex-1">
                  <span className="mb-2 block text-[13px] font-bold text-stone-500">Tour Duration</span>
                  <select
                    value={plannerDuration}
                    onChange={(e) => setPlannerDuration(e.target.value)}
                    className="nice-select current w-full appearance-none bg-transparent text-[17px] font-extrabold text-stone-950 outline-none"
                  >
                    <option value="Short (1-4 Days)">2-4 days tour</option>
                    <option value="Medium (5-7 Days)">3-6 days tour</option>
                    <option value="Long (8+ Days)">5-10 days tour</option>
                  </select>
                </span>
              </label>

              <div className="form-group flex-two flex min-h-[104px] flex-1 items-center gap-4 border-b border-stone-200 px-5 py-5 lg:max-w-[190px] lg:border-b-0 lg:border-r lg:px-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Users className="h-5 w-5" />
                </span>
                <div className="search-bar-group min-w-0 flex-1">
                  <label className="mb-2 block text-[13px] font-bold text-stone-500" htmlFor="home-search-guests">Guests</label>
                  <input
                    id="home-search-guests"
                    type="number"
                    min="1"
                    value={plannerGuests}
                    onChange={(e) => setPlannerGuests(e.target.value)}
                    className="w-full bg-transparent text-[17px] font-extrabold text-stone-950 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-search flex min-h-[104px] cursor-pointer items-center justify-center gap-3 bg-[#4DA528] px-8 text-[15px] font-extrabold uppercase tracking-[0.04em] text-white transition hover:bg-[#FF970D] lg:min-w-[170px]"
              >
                <Search className="h-5 w-5" />
                <span>Search</span>
              </button>
            </div>

          </form>
        </div>
      </section>

      <section className="about-us pb-24 pt-10 sm:pb-28 sm:pt-12 lg:pb-36" id="vitour-about">
        <div className="tf-container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mt-0 grid gap-12 lg:grid-cols-2 lg:items-center lg:pt-8">
            <div>
              <div className="travel-video relative">
                <img src={aboutImageVideo} alt="Adventure experience" className="image-video h-[420px] w-full rounded-[24px] object-cover shadow-[0_20px_48px_rgba(18,38,32,0.12)] sm:h-[520px]" />
                <img src={enjoyImage} alt="" className="mask-enjoy absolute -bottom-8 right-8 hidden rounded-[18px] bg-transparent p-5 shadow-[0_0px_0px_rgba(0,0,0,0.14)] sm:block" />
              </div>
            </div>
            <div>
              <div className="inner-content-about">
                <span className="sub-title-heading text-main mb-15 fadeInUp wow block font-serif text-[32px] italic text-[#4DA528]">Explore the world</span>
                <h2 className="title-heading mb-18 fadeInUp wow mt-5 text-[42px] font-extrabold leading-[1.12] text-stone-950 sm:text-[56px]">
                  Great opportunity for <span className="text-gray font-yes font-serif italic font-medium text-stone-400">adventure</span> & travels
                </h2>
                <p className="des-heading fadeInUp wow mt-6 max-w-xl text-[16px] leading-8 text-stone-600">
                Adventure begins where ordinary ends. Explore hidden valleys, majestic mountains, sacred temples, thrilling bike expeditions, and unforgettable road trips with Pravaah Travels. Every itinerary is carefully planned to give you the perfect balance of comfort, excitement, and authentic local experiences.
                </p>
                <div className="fadeInUp wow mt-9 grid gap-5 sm:grid-cols-2">
                  <div>
                    <div className="icon-box-style3 border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
                      <div className="icon flex-three mb-5 text-[#4DA528]">
                        <svg width="51" height="51" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
                          <g clipPath="url(#clip0_40_471)">
                            <path d="M37.5511 9.06618C37.5511 5.77106 34.8703 3.09027 31.5752 3.09027C28.2801 3.09027 25.5993 5.77106 25.5993 9.06618C25.5993 12.3613 28.2801 15.0421 31.5752 15.0421C34.8703 15.0421 37.5511 12.3613 37.5511 9.06618ZM31.5752 12.0541C29.9277 12.0541 28.5873 10.7137 28.5873 9.06618C28.5873 7.41862 29.9277 6.07823 31.5752 6.07823C33.2228 6.07823 34.5632 7.41862 34.5632 9.06618C34.5632 10.7137 33.2228 12.0541 31.5752 12.0541Z" fill="currentColor" />
                            <path d="M50.2947 10.8487C49.0667 8.96556 46.5591 8.33461 44.586 9.41226L34.279 15.0416C33.3084 15.0416 16.1894 15.0416 15.1914 15.0416V1.49617C15.1914 0.671101 14.5225 0.00219727 13.6974 0.00219727H1.49398C0.668903 0.00219727 0 0.671101 0 1.49617V10.5596C0 11.3847 0.668903 12.0536 1.49398 12.0536H12.2033V49.5026C12.2033 50.3277 12.8722 50.9966 13.6973 50.9966C14.5224 50.9966 15.1913 50.3277 15.1913 49.5026V24.0054H24.1551V46.5147C24.1551 50.399 28.7646 52.4156 31.625 49.8526C34.4825 52.4131 39.0949 50.4048 39.0949 46.5147V23.3212L49.0299 16.8488C51.038 15.5407 51.6042 12.8565 50.2947 10.8487ZM2.98795 9.06556V2.99005H12.2033V9.06556H2.98795ZM34.613 48.0086C33.7892 48.0086 33.119 47.3384 33.119 46.5146C33.119 45.3559 33.119 38.5353 33.119 37.4511C33.119 36.626 32.4501 35.9571 31.625 35.9571C30.7999 35.9571 30.131 36.626 30.131 37.4511V46.5146C30.131 47.3384 29.4608 48.0086 28.637 48.0086C27.8133 48.0086 27.1431 47.3384 27.1431 46.5146V32.9692H36.1069V46.5146C36.1069 47.3384 35.4367 48.0086 34.613 48.0086ZM47.399 14.3452L36.7854 21.2596C36.3622 21.5354 36.1069 22.0063 36.1069 22.5114V29.9812H27.1431V22.5114C27.1431 21.6863 26.4742 21.0174 25.6491 21.0174H15.1913V18.0294C35.5362 17.9654 34.7563 18.1854 35.3764 17.8467L46.0182 12.0346C46.6312 11.6997 47.4104 11.8957 47.7919 12.4809C48.1988 13.1046 48.0231 13.9387 47.399 14.3452Z" fill="currentColor" />
                          </g>
                          <defs>
                            <clipPath id="clip0_40_471"><rect width="51" height="51" fill="white" /></clipPath>
                          </defs>
                        </svg>
                      </div>
                      <h6 className="title mb-10 text-[18px] font-bold text-stone-950">Expert Travel Planning</h6>
                      <p className="des text-[14px] leading-7 text-stone-600">Experienced travel specialists creating seamless itineraries with local expertise and 24/7 support.</p>
                    </div>
                  </div>
                  <div>
                    <div className="icon-box-style3 border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
                      <div className="icon flex-three mb-5 text-[#4DA528]">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
                          <mask id="mask0_40_476" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="40">
                            <path d="M0 0H40V40H0V0Z" fill="white" />
                          </mask>
                          <g mask="url(#mask0_40_476)">
                            <path d="M20 23.125V38.8281H38.8281V12.2656H34.1406" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5.85938 12.2656H1.17188V38.8281H20V23.2031" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M26.9598 9.14062H34.1406V34.1406H26.5035C23.5528 34.1406 20.933 36.0287 20 38.8281" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13.0402 9.14062H5.85938V34.1406H13.4965C16.4472 34.1406 19.067 36.0287 20 38.8281" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 1.17188C14.6974 1.17188 11.3111 6.82758 13.8151 11.5017L20 23.0469L26.1849 11.5017C28.6889 6.82758 25.3027 1.17188 20 1.17188Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22.3438 8.20312C22.3438 9.4975 21.2944 10.5469 20 10.5469C18.7056 10.5469 17.6562 9.4975 17.6562 8.20312C17.6562 6.90875 18.7056 5.85937 20 5.85937C21.2944 5.85937 22.3438 6.90875 22.3438 8.20312Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                        </svg>
                      </div>
                      <h6 className="title mb-10 text-[18px] font-bold text-stone-950">Tailor-Made Experiences</h6>
                      <p className="des text-[14px] leading-7 text-stone-600">Customized holidays designed around your budget, travel style, and dream destinations.</p>
                    </div>
                  </div>
                </div>
                <div className="btn-wrap-about fadeInUp wow mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button onClick={() => onNavigate('about')} className="btn-main inline-flex cursor-pointer items-center justify-center gap-3 rounded-[5px] bg-[#4DA528] px-8 py-[18px] text-[15px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[#FF970D]">
                    <span className="btn-main-text">More about us</span>
                    <span className="iconer"><ArrowRight className="h-4 w-4" /></span>
                  </button>
                  <div className="profile flex items-center gap-3">
                    <div className="image h-12 w-12 overflow-hidden rounded-full">
                      <img src={avatar10} alt="Founder" className="h-full w-full object-cover" />
                    </div>
                    <div className="content">
                      <img src={founderNameImage} alt="Pravaah Curator" className="h-6 w-auto object-contain" />
                      <span className="mt-1 block text-[12px] font-bold uppercase tracking-wider text-[#4DA528]">Ceo & Founder</span>
                    </div>
                  </div>
                </div>
                <div className="map-check fadeInUp wow mt-8 flex items-center gap-3 text-[#4DA528]">
                  <Map className="h-7 w-7" />
                  <span className="text-main font-semibold">Checkout Beautiful Places Arround the World.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tour-package bg-white pb-20 pt-10 sm:pt-12" id="featured-packages">
        <div className="tf-container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="center m0-auto w-text-heading mx-auto mb-12 max-w-3xl text-center">
            <span className="sub-title-heading text-main mb-4 fadeInUp wow font-serif text-[30px] italic text-[#4DA528] sm:text-[32px]">Explore the world</span>
            <h2 className="title-heading fadeInUp wow mt-3 text-[34px] font-extrabold leading-tight text-stone-950 sm:text-[46px] lg:text-[50px]">
              Amazing Featured Tour <span className="text-gray font-yes font-serif italic font-medium text-stone-400">Package</span> the world
            </h2>
          </div>
          <div className="tab-tour-list">
                <ul className="tab-list mb-6 flex flex-wrap justify-center gap-3" id="myTab" role="tablist">
                  {(['Pilgrimage', 'Treks', 'Adventure', 'Himachal', 'Ladakh'] as DestinationCategory[]).map((category) => (
                    <li key={category} className="nav-item" role="presentation">
                      <button
                        className={`nav-link cursor-pointer rounded-full border px-6 py-3 text-[14px] font-bold transition ${
                          plannerCategory === category
                            ? 'active border-[#4DA528] bg-[#4DA528] text-white shadow-lg'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-[#4DA528] hover:text-[#4DA528]'
                        }`}
                        type="button"
                        role="tab"
                        aria-selected={plannerCategory === category}
                        onClick={() => handlePlannerCategorySelect(category)}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
                <ul className="tab-list mb-10 flex flex-wrap justify-center gap-3">
                  {featuredCategoryCards.map((item) => (
                    <li key={item.slug} className="nav-item" role="presentation">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeFeaturedSlug === item.slug}
                        onClick={() => handleFeaturedCategoryClick(item.slug)}
                        className={`nav-link cursor-pointer rounded-full border px-6 py-3 text-[14px] font-bold transition ${
                          activeFeaturedSlug === item.slug
                            ? 'active border-[#4DA528] bg-[#4DA528] text-white shadow-lg'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-[#4DA528] hover:text-[#4DA528]'
                        }`}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="tab-content" id="myTabContent">
                  <div className="tab-pane fade show active" role="tabpanel" tabIndex={0}>
                    {loading ? (
                      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <SkeletonCard key={idx} />
                        ))}
                      </div>
                    ) : filteredCategoryPackages.length === 0 ? (
                      <div className="mx-auto max-w-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
                        <AlertCircle className="mx-auto mb-4 h-8 w-8 text-stone-300" />
                        <p className="text-sm text-stone-500">No packages available for the selected category or featured collection.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 items-stretch gap-7 sm:grid-cols-2 xl:grid-cols-4">
                        {featuredCarouselPackages.length > 0 ? featuredCarouselPackages.map((pkg, idx) => {
                          const isWishlisted = Array.isArray(wishlistPackageIds) ? wishlistPackageIds.includes(String(pkg.id ?? '')) : false;
                          return (
                            <div key={pkg.id} className="h-full">
                              <PackageCard
                                pkg={pkg}
                                index={idx}
                                isWishlisted={isWishlisted}
                                onNavigate={onNavigate}
                                onToggleWishlist={onToggleWishlist}
                                onDeletePackage={onDeletePackage}
                                isAdminLoggedIn={isAdminLoggedIn}
                              />
                            </div>
                          );
                        }) : filteredCategoryPackages.slice(0, 4).map((pkg, idx) => {
                          const isWishlisted = Array.isArray(wishlistPackageIds) ? wishlistPackageIds.includes(String(pkg.id ?? '')) : false;
                          return (
                            <div key={pkg.id} className="h-full">
                              <PackageCard
                                pkg={pkg}
                                index={idx}
                                isWishlisted={isWishlisted}
                                onNavigate={onNavigate}
                                onToggleWishlist={onToggleWishlist}
                                onDeletePackage={onDeletePackage}
                                isAdminLoggedIn={isAdminLoggedIn}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <button onClick={() => onNavigate('packages')} className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-[#4DA528] px-8 py-[16px] text-[14px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#FF970D]">
                    <span>View all tours</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
          </div>
        </div>
      </section>

      <section className="relative tf-widget-activities overflow-hidden bg-[#F4F6F8] py-20">
        <div className="mask-top absolute left-0 top-0 h-24 w-24 rounded-br-full bg-[#4DA528]/10" />
        <div className="mask-bottom absolute bottom-0 right-0 h-28 w-28 rounded-tl-full bg-[#FF970D]/10" />
        <div className="tf-container relative z-index3 mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="center m0-auto w-text-heading mx-auto mb-10 max-w-3xl text-center">
            <span className="sub-title-heading text-main mb-5 font-serif text-[32px] italic text-[#4DA528]">Explore the world</span>
            <h2 className="title-heading mt-4 text-[42px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">Amazing Activities</h2>
            <p className="mt-4 text-lg leading-8 text-stone-600">Experience Adventure</p>
          </div>

          <div className="mb-10 overflow-x-auto pb-3">
            <div className="flex flex-wrap items-center gap-3">
              {activityTabs.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => handleActivityClick(activity.id)}
                  aria-pressed={activity.id === activeActivityId}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 py-3 text-[14px] font-semibold transition duration-300 ${
                    activity.id === activeActivityId
                      ? 'border-transparent bg-[#4DA528] text-white shadow-[0_18px_40px_rgba(74,165,74,0.22)]'
                      : 'border-stone-200 bg-white text-stone-800 hover:border-[#4DA528] hover:text-[#4DA528]'
                  }`}
                >
                  <Compass className="h-4 w-4" />
                  <span className="whitespace-nowrap">{activity.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-6 ${packagesVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3`}>
            {filteredActivityItems.length > 0 ? (
              filteredActivityItems.map((item, idx) => {
                const linkedPackage = packageList.find((pkg) => pkg.id === item.linkedPackageId);
                const imageUrl = item.thumbnailUrl || linkedPackage?.imageUrl || 'https://images.unsplash.com/photo-1516685304081-de7947d419d3?auto=format&fit=crop&w=800&q=80';
                return (
                  <article key={item.id} className="tour-listing wow fadeInUp animated group flex h-full flex-col overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1" data-wow-delay={`${(idx + 1) / 10}s`}>
                    <button type="button" onClick={() => linkedPackage ? onNavigate('package-detail', linkedPackage.id) : undefined} className="tour-listing-image relative block h-[230px] w-full cursor-pointer overflow-hidden bg-stone-100 text-left">
                      <img src={getTravelImage(imageUrl)} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" referrerPolicy="no-referrer" loading="lazy" decoding="async" width="800" height="560" onError={handleTravelImageError} />
                    </button>
                    <div className="tour-listing-content flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="tag-listing inline-block rounded bg-[#FF970D]/12 px-3 py-1 text-[12px] font-bold text-[#D57400]">{linkedPackage?.category || 'Activity'}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (linkedPackage) onToggleWishlist?.(linkedPackage);
                          }}
                          className="icon-bookmark flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-[#4DA528] hover:text-white"
                          title={linkedPackage ? (Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(linkedPackage.id ?? '')) ? 'Remove from Wishlist' : 'Add to Wishlist') : 'Link a package to enable wishlist'}
                        >
                          <Heart className={`h-4 w-4 transition ${linkedPackage && Array.isArray(wishlistPackageIds) && wishlistPackageIds.includes(String(linkedPackage.id ?? '')) ? 'fill-rose-600 text-rose-600' : 'text-rose-500'}`} />
                        </button>
                      </div>
                      <span className="map mt-4 flex items-center gap-2 text-[14px] font-medium text-stone-500">
                        <Map className="h-4 w-4 text-[#4DA528]" />
                        {item.subtitle || (linkedPackage?.destination ?? 'Explore')}
                      </span>
                      <h3 className="title-tour-list mt-3 text-[22px] font-bold leading-tight text-stone-950">
                        <button onClick={() => linkedPackage ? onNavigate('package-detail', linkedPackage.id) : undefined} className="cursor-pointer text-left transition hover:text-[#4DA528]">
                          {item.title}
                        </button>
                      </h3>
                      <div className="mt-3 text-sm text-stone-600">
                        <span className="font-semibold text-stone-900">From {formatPrice(item.startingPrice)}</span>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{item.description}</p>
                      <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-stone-500">Activity</p>
                          <p className="text-sm font-semibold text-stone-900">{itemActivityTitle(item.activityId)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => linkedPackage ? onNavigate('package-detail', linkedPackage.id) : undefined}
                          disabled={!linkedPackage}
                          className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white transition ${linkedPackage ? 'bg-[#4DA528] hover:bg-[#3a8d1f]' : 'bg-stone-300 cursor-not-allowed'}`}
                        >
                          {linkedPackage ? 'View package' : 'No package linked'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : filteredActivityPackages.length === 0 ? (
              <div className="col-span-full rounded-[20px] border border-stone-200 bg-white p-10 text-center text-stone-500 shadow-sm">
                No packages are available for this activity yet.
              </div>
            ) : (
              filteredActivityPackages.map((pkg, idx) => {
                const isWishlisted = Array.isArray(wishlistPackageIds) ? wishlistPackageIds.includes(String(pkg.id ?? '')) : false;
                return (
                  <article key={pkg.id} className="tour-listing wow fadeInUp animated group flex h-full flex-col overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1" data-wow-delay={`${(idx + 1) / 10}s`}>
                    <button type="button" onClick={() => onNavigate('package-detail', pkg.id)} className="tour-listing-image relative block h-[230px] w-full cursor-pointer overflow-hidden bg-stone-100 text-left">
                      <img src={getTravelImage(pkg.imageUrl)} alt={pkg.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" referrerPolicy="no-referrer" loading="lazy" decoding="async" width="800" height="560" onError={handleTravelImageError} />
                    </button>
                    <div className="tour-listing-content flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="tag-listing inline-block rounded bg-[#FF970D]/12 px-3 py-1 text-[12px] font-bold text-[#D57400]">{pkg.category}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist?.(pkg);
                          }}
                          className="icon-bookmark flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-[#4DA528] hover:text-white"
                          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className={`h-4 w-4 transition ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-rose-500'}`} />
                        </button>
                      </div>
                      <span className="map mt-4 flex items-center gap-2 text-[14px] font-medium text-stone-500">
                        <Map className="h-4 w-4 text-[#4DA528]" />
                        {pkg.location || pkg.destination}
                      </span>
                      <h3 className="title-tour-list mt-3 text-[22px] font-bold leading-tight text-stone-950">
                        <button onClick={() => onNavigate('package-detail', pkg.id)} className="cursor-pointer text-left transition hover:text-[#4DA528]">
                          {pkg.title}
                        </button>
                      </h3>
                      <div className="mt-3 text-sm text-stone-600">
                        <span className="font-semibold text-stone-900">{pkg.duration}</span>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{pkg.shortDescription || pkg.destination}</p>
                      <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-stone-500">Starting</p>
                          <p className="text-xl font-bold text-[#4DA528]">{formatPrice(pkg.offerPrice || pkg.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('package-detail', pkg.id)}
                          className="inline-flex items-center justify-center rounded-full bg-[#4DA528] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3a8d1f]"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {filteredActivityRecommendations.length > 0 && (
        <section className="recommendation-section bg-[#f7faf8] py-16">
          <div className="tf-container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
              <div className="mb-10 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Recommended for you</span>
              <h2 className="mt-3 text-[32px] font-extrabold text-stone-950 sm:text-[40px]">Related adventures and must-see experiences</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">These recommendations complement the selected activity and help travelers discover curated packages and experiences.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActivityRecommendations.map((recommendation, index) => {
                const linkedPackage = packageList.find((pkg) => pkg.id === recommendation.linkedPackageId);
                return (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    linkedPackage={linkedPackage}
                    onNavigate={onNavigate}
                    index={index}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {featuredPackages.length > 0 && <section className="offer-package bg-1 relative overflow-hidden bg-white py-20">
        <img src={getTravelImage(popularDestinations[3].image)} alt={popularDestinations[3].name} className="feature-ofer absolute inset-y-0 right-0 hidden h-full w-[34%] object-cover opacity-20 lg:block" referrerPolicy="no-referrer" onError={handleTravelImageError} />
        <div className="tf-container relative z-index3 mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="content">
                <div className="mb-10">
                  <span className="sub-title-heading text-main mb-15 fadeInUp wow font-serif text-[32px] italic text-[#4DA528]">Explore the world</span>
                  <h2 className="title-heading fadeInUp wow mt-4 text-[42px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">Amazing Featured Tour<span className="text-gray font-yes font-serif italic font-medium text-stone-400"> Package</span> the world</h2>
                  <p className="des-heading fadeInUp wow text-[16px] leading-8 text-stone-600">
                    {activeOfferPackages.length > 0
                      ? 'Limited-time offers from the live Pravaah package collection, shown in the Vitour offer package layout.'
                      : 'Featured Pravaah journeys from the live package collection, shown in the Vitour offer package layout.'}
                  </p>
                </div>
                {activeOfferPackages.length > 0 ? (
                  <div className="inner-content flex-three flex items-center gap-5">
                    <div className="offer fadeInUp wow flex h-24 w-24 items-center justify-center rounded-full bg-[#4DA528] text-center text-white">
                      <span className="number text-[28px] font-extrabold leading-none">{bestOfferDiscount} <span className="block text-[13px]">% off</span></span>
                    </div>
                    <p className="font-italic font-serif text-[26px] italic text-stone-950">Discover Great <span className="text-main text-[#4DA528]">Discount</span> Deals Around the World</p>
                  </div>
                ) : (
                  <div className="inner-content flex-three flex items-center gap-5 rounded-[14px] border border-stone-200 bg-[#F7F8F4] p-5">
                    <div className="offer fadeInUp wow flex h-16 w-16 items-center justify-center rounded-full bg-[#4DA528]/12 text-[#4DA528]">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <p className="font-italic font-serif text-[24px] italic text-stone-950">Explore hand-picked <span className="text-main text-[#4DA528]">featured</span> journeys</p>
                  </div>
                )}
                <div className="btn-wap fadeInUp wow mt-8">
                  <button onClick={() => onNavigate('packages')} className="btn-main inline-flex cursor-pointer items-center justify-center gap-3 rounded-[5px] bg-[#4DA528] px-8 py-[18px] text-[15px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[#FF970D]">
                    <span className="btn-main-text">Explore More</span>
                    <span className="iconer"><ArrowRight className="h-4 w-4" /></span>
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="on-week-swipper-wrap relative">
                <div className="swiper offer-package-swipper overflow-hidden relative">
                  <div className="swiper-wrapper grid items-stretch gap-7 md:grid-cols-2">
                    {offerPackages.slice(0, 2).map((pkg) => (
                      <div key={`offer-${pkg.id}`} className="swiper-slide h-full">
                        <article className="tour-listing flex h-full flex-col overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
                          <button type="button" onClick={() => onNavigate('package-detail', pkg.id)} className="tour-listing-image relative block h-[260px] w-full cursor-pointer overflow-hidden text-left">
                            <img src={getTravelImage(pkg.imageUrl)} alt={pkg.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                            <span className="feature absolute left-4 top-4 rounded bg-[#4DA528] px-3 py-1 text-[12px] font-bold text-white">Featured</span>
                          </button>
                          <div className="tour-listing-content flex flex-1 flex-col p-6">
                            <span className="tag-listing inline-block rounded bg-[#FF970D]/12 px-3 py-1 text-[12px] font-bold text-[#D57400]">{pkg.category}</span>
                            <h3 className="title-tour-list mt-4 text-[22px] font-bold leading-tight text-stone-950">{pkg.title}</h3>
                            <div className="flex-two mt-auto flex items-center justify-between pt-5">
                              <p className="text-[14px] text-stone-500">
                                From <span className="price-sale text-[20px] font-extrabold text-[#4DA528]">{formatPrice(pkg.offerPrice || pkg.price)}</span>
                                {pkg.offerPrice && <span className="ml-2 text-xs font-semibold text-stone-400 line-through">{formatPrice(pkg.price)}</span>}
                              </p>
                              <button onClick={() => onNavigate('package-detail', pkg.id)} className="icon-bookmark flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-[#4DA528] hover:text-white">
                                <Heart className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>}

      <section className="relative overflow-hidden bg-[#081E2A] py-20 text-white" id="home-banner-contact">
        <img src={getTravelImage('https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1800&q=80')} alt="Adventure route" className="absolute inset-0 h-full w-full object-cover opacity-30" referrerPolicy="no-referrer" onError={handleTravelImageError} />
        <div className="relative mx-auto grid max-w-[1320px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <span className="font-serif text-[32px] italic text-[#4DA528]">Explore the world</span>
            <h2 className="mt-4 max-w-3xl text-[42px] font-extrabold leading-tight text-white sm:text-[56px]">Ready to travel with real adventure & enjoy natural</h2>
            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
              <button onClick={handleLaunchPlanner} className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4DA528] text-white transition hover:bg-[#FF970D]">
                <Sparkles className="h-7 w-7" />
              </button>
              <address className="not-italic text-[17px] leading-8 text-white/78">
                Contact us at <a href="mailto:pravaahtravels@gmail.com" className="text-[#4DA528]">pravaahtravels@gmail.com</a>
              </address>
            </div>
          </div>
          <div className="hidden items-end justify-end lg:flex">
            <img src={getTravelImage('https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=650&q=80')} alt="Adventure" className="h-[360px] w-[360px] rounded-full object-cover ring-[18px] ring-white/10" referrerPolicy="no-referrer" onError={handleTravelImageError} />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MULTI-STEP AI PERSONALIZATION PLANNER MODAL */}
      {/* ======================================================== */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="ai-planner-quiz">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-stone-150 overflow-hidden my-8">
            
            {/* Header */}
            <div className="bg-[#1f2937] text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                <div>
                  <h4 className="text-lg font-bold tracking-tight">Pravaah AI Trip Curating Engine</h4>
                  <p className="text-[11px] text-stone-300">Co-design an active custom plan on Google Gemini models</p>
                </div>
              </div>
              <button 
                onClick={() => setShowQuizModal(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Multi-step progress bar */}
            {quizStep <= 4 && (
              <div className="bg-stone-50 border-b border-stone-200 px-6 py-3.5 flex justify-between items-center text-xs text-stone-400">
                <div className="flex gap-2 items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 1 ? 'bg-[#4DA528] text-white' : 'bg-stone-200 text-stone-600'}`}>1</span>
                  <span className={quizStep === 1 ? 'text-stone-800 font-bold' : ''}>Focus</span>
                </div>
                <div className="w-8 h-px bg-stone-300"></div>
                <div className="flex gap-2 items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 2 ? 'bg-[#4DA528] text-white' : 'bg-stone-200 text-stone-600'}`}>2</span>
                  <span className={quizStep === 2 ? 'text-stone-800 font-bold' : ''}>Companions</span>
                </div>
                <div className="w-8 h-px bg-stone-300"></div>
                <div className="flex gap-2 items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 3 ? 'bg-[#4DA528] text-white' : 'bg-stone-200 text-stone-600'}`}>3</span>
                  <span className={quizStep === 3 ? 'text-stone-800 font-bold' : ''}>Style Vibe</span>
                </div>
                <div className="w-8 h-px bg-stone-300"></div>
                <div className="flex gap-2 items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 4 ? 'bg-[#4DA528] text-white' : 'bg-stone-200 text-stone-600'}`}>4</span>
                  <span className={quizStep === 4 ? 'text-stone-800 font-bold' : ''}>Duration & Budget</span>
                </div>
              </div>
            )}

            {/* Quiz Step 1: Destination coordinates */}
            {quizStep === 1 && (
              <div className="p-6 md:p-8 space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h5 className="text-base font-serif italic text-stone-800 font-semibold">Where would you like to explore?</h5>
                  <p className="text-xs text-stone-400">Select an existing Himalayan segment or enter a custom destination name.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Kedarnath & Sacred Do Dham',
                    'Manali & Solang Winter Retreat',
                    'Ladakh High Passes',
                    'Rishikesh Rafting & Camps',
                    'Haridwar & Ganga Aarati Retreat'
                  ].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setQuizAnswers({...quizAnswers, destination: loc})}
                      className={`p-4 text-left border rounded-lg text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer ${
                        quizAnswers.destination === loc 
                          ? 'border-[#4DA528] bg-[#4DA528]/5 text-[#4DA528]' 
                          : 'border-stone-200 hover:border-[#4DA528] bg-[#fbfbfa]'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 pt-2">
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest">Custom Segment Choice</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Spiti Valley Trek, Valley of Flowers, Joshimath..."
                    value={quizAnswers.destination}
                    onChange={(e) => setQuizAnswers({...quizAnswers, destination: e.target.value})}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium"
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setQuizStep(2)}
                    className="px-6 py-2.5 bg-[#4DA528] hover:bg-[#3f8f21] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Step 2: Companions */}
            {quizStep === 2 && (
              <div className="p-6 md:p-8 space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h5 className="text-base font-serif italic text-stone-800 font-semibold">Who is joining you on this journey?</h5>
                  <p className="text-xs text-stone-400">Our operator layouts prioritize safety parameters based on group compositions.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Solo Seeking Backpacker',
                    'Couple / Honeymoon Comfort',
                    'Family with Elders & Kids',
                    'Active Group of Friends'
                  ].map((comp) => (
                    <button
                      key={comp}
                      onClick={() => setQuizAnswers({...quizAnswers, companions: comp})}
                      className={`p-4 text-left border rounded-lg text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer ${
                        quizAnswers.companions === comp 
                          ? 'border-[#4DA528] bg-[#4DA528]/5 text-[#4DA528]' 
                          : 'border-stone-200 hover:border-[#4DA528] bg-[#fbfbfa]'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setQuizStep(1)}
                    className="px-5 py-2.5 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider rounded-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setQuizStep(3)}
                    className="px-6 py-2.5 bg-[#4DA528] hover:bg-[#3f8f21] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Step 3: Vibe Choice */}
            {quizStep === 3 && (
              <div className="p-6 md:p-8 space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h5 className="text-base font-serif italic text-stone-800 font-semibold">What is your desired travel style vibe?</h5>
                  <p className="text-xs text-stone-400">Decide whether you want to focus on meditation, mountain challenges, or scenic drives.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Peaceful Pilgrimage', desc: 'Slow tempos, sacred temple darshans, organic meals.' },
                    { title: 'Adventure & Trekking', desc: 'Scenic mountain treks, raft maneuvers, physical milestones.' },
                    { title: 'Relaxing Scenic Leisure', desc: 'Luxury AC transport, premium comfort cottages, sunset viewpoints.' },
                    { title: 'Balanced Mix', desc: 'A blend of temple retreat, gentle walks, and standard comfort.' }
                  ].map((v) => (
                    <button
                      key={v.title}
                      onClick={() => setQuizAnswers({...quizAnswers, vibe: v.title})}
                      className={`p-4 text-left border rounded-lg transition shadow-xs cursor-pointer flex flex-col gap-1.5 ${
                        quizAnswers.vibe === v.title 
                          ? 'border-[#4DA528] bg-[#4DA528]/5' 
                          : 'border-stone-200 hover:border-[#4DA528] bg-[#fbfbfa]'
                      }`}
                    >
                      <span className={`text-xs font-bold tracking-wide ${quizAnswers.vibe === v.title ? 'text-[#4DA528]' : 'text-stone-800'}`}>{v.title}</span>
                      <span className="text-[10px] text-stone-400 font-light">{v.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setQuizStep(2)}
                    className="px-5 py-2.5 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider rounded-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setQuizStep(4)}
                    className="px-6 py-2.5 bg-[#4DA528] hover:bg-[#3f8f21] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Step 4: Duration, Budget & Special Wishes */}
            {quizStep === 4 && (
              <div className="p-6 md:p-8 space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h5 className="text-base font-serif italic text-stone-800 font-semibold">Duration, Budget & Special Requests</h5>
                  <p className="text-xs text-stone-400">Input limits to allow Gemini models to choose the correct hotels & transport routes.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest">Duration (Days)</label>
                    <select
                      value={quizAnswers.duration}
                      onChange={(e) => setQuizAnswers({...quizAnswers, duration: e.target.value})}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 12].map(d => (
                        <option key={d} value={d}>{d} Days / {d-1} Nights</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest">Total Budget Target (INR)</label>
                    <input 
                      type="number" 
                      value={quizAnswers.budget}
                      onChange={(e) => setQuizAnswers({...quizAnswers, budget: e.target.value})}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest">Wishes, Dietary or Hotel preferences (Optional)</label>
                  <textarea
                    rows={2.5}
                    placeholder="E.g. strict pure veg food, no high slopes, helicopter priority booking..."
                    value={quizAnswers.specialRequests}
                    onChange={(e) => setQuizAnswers({...quizAnswers, specialRequests: e.target.value})}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium resize-none"
                  />
                </div>

                {aiError && (
                  <div className="rounded border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                    {aiError}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setQuizStep(3)}
                    className="px-5 py-2.5 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider rounded-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateAiItinerary}
                    disabled={aiGenerating}
                    className="px-6 py-2.5 bg-[#FF970D] hover:bg-[#e6850b] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shadow"
                  >
                    {aiGenerating ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                        <span>Curating Custom Plan...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>Generate with Pravaah AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* AI LOADING WAITING SCREEN */}
            {aiGenerating && (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Sparkles className="w-14 h-14 text-[#4DA528] animate-pulse mb-4" />
                <h4 className="text-lg font-bold text-stone-850">Drafting Bespoke Adventure...</h4>
                <p className="text-xs text-stone-500 max-w-sm mt-1.5 leading-relaxed">
                  Connecting to Google Gemini API securely. Processing your style inputs, curating daily scenic drives, local culinary secrets, and building a fully customized travel itinerary...
                </p>
              </div>
            )}

            {/* Quiz Step 5: AI RESULT OUTPUT SCREEN WITH MAP + DRAG-N-DROP */}
            {quizStep === 5 && aiResult && (
              <div className="max-h-[75vh] overflow-y-auto">
                <div className="p-6 md:p-8 space-y-6">
                  
                  {/* Title Banner */}
                  <div className="bg-gradient-to-r from-stone-900 to-stone-850 text-white p-6 rounded-lg relative">
                    <span className="bg-teal-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full text-teal-100 uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Curated by Pravaah AI
                    </span>
                    <h3 className="text-xl font-serif italic">{aiResult.title}</h3>
                    <p className="text-xs text-stone-300 mt-1 font-light">Custom segment duration: {aiResult.duration} Days | Budget Target: ₹{Number(quizAnswers.budget).toLocaleString('en-IN')}</p>
                  </div>

                  {/* Interactive Route Map */}
                  <InteractiveRouteMap 
                    itinerary={aiResult.itinerary}
                    destination={quizAnswers.destination}
                    category="Custom Segment"
                    activeDay={activeAiDay}
                    onDayClick={(day) => setActiveAiDay(day)}
                  />

                  {/* Drag and Drop Plan Editor */}
                  <div className="bg-white border border-stone-200 rounded p-6 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-stone-850 uppercase tracking-wider">Drag & Drop Custom Itinerary</h4>
                        <p className="text-xs text-stone-400 mt-0.5">Rearrange travel days. The map above will re-route instantly.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomizingAi(!isCustomizingAi)}
                        className={`px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider border rounded-sm transition ${
                          isCustomizingAi 
                            ? 'bg-amber-500 text-white border-amber-600' 
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {isCustomizingAi ? 'Save Arrangement' : 'Customize Order'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {aiResult.itinerary?.map((dayItem: any, index: number) => {
                        const isOpen = activeAiDay === dayItem.day;
                        return (
                          <div
                            key={dayItem.day}
                            draggable={isCustomizingAi}
                            onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                            onDrop={() => handleDrop(index)}
                            className={`border rounded overflow-hidden transition-all duration-200 ${
                              isCustomizingAi
                                ? 'border-amber-300 bg-[#fbfbfa] hover:border-amber-500'
                                : 'border-stone-200 bg-white'
                            }`}
                          >
                            <div 
                              className="p-3 flex items-center justify-between cursor-pointer"
                              onClick={() => {
                                if (!isCustomizingAi) {
                                  setActiveAiDay(dayItem.day);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {isCustomizingAi ? (
                                  <GripVertical className="w-4 h-4 text-amber-500 shrink-0" />
                                ) : (
                                  <span className={`w-8 h-8 font-mono text-[9px] font-extrabold rounded flex items-center justify-center shrink-0 border ${
                                    isOpen ? 'bg-[#4DA528] text-white border-transparent' : 'bg-[#f8f7f4] text-stone-500'
                                  }`}>
                                    D{dayItem.day}
                                  </span>
                                )}
                                <span className="font-serif italic text-stone-800 text-xs font-semibold">{dayItem.title}</span>
                              </div>

                              {isCustomizingAi ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveAiDay(index, 'up')}
                                    className="p-1 border border-stone-200 bg-white rounded text-stone-500 hover:text-[#4DA528] disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === aiResult.itinerary.length - 1}
                                    onClick={() => moveAiDay(index, 'down')}
                                    className="p-1 border border-stone-200 bg-white rounded text-stone-500 hover:text-[#4DA528] disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#4DA528]" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
                                </div>
                              )}
                            </div>

                            {isOpen && !isCustomizingAi && (
                              <div className="p-4 bg-stone-50 border-t border-stone-150 text-stone-600 text-[11.5px] leading-relaxed font-light">
                                {dayItem.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expert local tips and inclusions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-lg space-y-2">
                      <h5 className="text-xs font-bold text-[#4DA528] uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-4 h-4" /> Customized Inclusions
                      </h5>
                      <ul className="space-y-1.5 text-[11px] text-stone-600 font-light">
                        {aiResult.inclusions?.map((inc: string, idx: number) => (
                          <li key={idx} className="flex gap-1.5 items-start">
                            <span className="text-[#4DA528] font-bold shrink-0">✓</span>
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50/40 border border-amber-100/60 p-4 rounded-lg space-y-2">
                      <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500" /> Expert Local Secrets
                      </h5>
                      <ul className="space-y-1.5 text-[11px] text-stone-600 font-light">
                        {aiResult.tips?.map((tip: string, idx: number) => (
                          <li key={idx} className="flex gap-1.5 items-start">
                            <span className="text-amber-500 font-bold shrink-0">★</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* DIRECT BOOKING FORM FOR CUSTOM AI PLAN */}
                  <div className="bg-stone-50 border border-stone-200 p-6 rounded-lg space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="text-base font-serif italic text-stone-850 font-semibold">Book this Customized AI Trip</h4>
                      <p className="text-xs text-stone-400 font-light">Enquire now! Our Himalayan guide will contact you with booking clearances in 24 hrs.</p>
                    </div>

                    {aiEnquirySuccess ? (
                      <div className="bg-[#4DA528]/15 border border-[#4DA528]/30 rounded-lg p-5 text-center space-y-3">
                        <div className="w-10 h-10 bg-[#4DA528] text-white rounded-full flex items-center justify-center mx-auto shadow">
                          <Check className="w-5 h-5" />
                        </div>
                        <h5 className="text-sm font-bold text-stone-800">Booking Enquiry Registered!</h5>
                        <p className="text-xs text-stone-600 leading-relaxed font-light">
                          Your custom AI draft layout has been recorded successfully in Firestore. Pravaah travels support team will contact you on your registered mobile number shortly.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleAiBookingSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Your Name</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Yash Sharma"
                              value={aiEnquiryData.name}
                              onChange={(e) => setAiEnquiryData({...aiEnquiryData, name: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Mobile Number</label>
                            <input 
                              type="tel" 
                              required 
                              placeholder="E.g. +91 98213..."
                              value={aiEnquiryData.phone}
                              onChange={(e) => setAiEnquiryData({...aiEnquiryData, phone: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Email Address</label>
                            <input 
                              type="email" 
                              required 
                              placeholder="you@email.com"
                              value={aiEnquiryData.email}
                              onChange={(e) => setAiEnquiryData({...aiEnquiryData, email: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Target Travel Date</label>
                            <input 
                              type="date" 
                              required 
                              value={aiEnquiryData.travelDate}
                              onChange={(e) => setAiEnquiryData({...aiEnquiryData, travelDate: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#4DA528] font-medium cursor-pointer"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={aiEnquirySubmitting}
                          className="w-full py-3 bg-[#FF970D] hover:bg-[#e6850b] text-white text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1.5 shadow"
                        >
                          {aiEnquirySubmitting ? (
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit Booking Enquiry</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Footer buttons to exit/restart */}
            {quizStep === 5 && (
              <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => { setQuizStep(1); setAiResult(null); }}
                  className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider rounded"
                >
                  Start Over
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-5 py-2 bg-[#4DA528] hover:bg-[#3f8f21] text-white text-xs font-bold uppercase tracking-wider rounded shadow"
                >
                  Exit AI Planner
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
