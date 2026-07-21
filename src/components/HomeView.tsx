import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Star, Heart, Compass, ShieldCheck, Map, 
  PlaneTakeoff, Trash2, Search, Sparkles, AlertCircle, Quote,
  Sliders, GripVertical, ArrowUp, ArrowDown, X, Users, Clock, MessageSquare, Check, Send,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { TravelPackage, formatPrice, DestinationCategory, WebsiteCMSSettings } from '../types';
import InteractiveRouteMap from './InteractiveRouteMap';
import { db, collection, addDoc, getDocs, query, orderBy, limit } from '../lib/firebase';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';

interface HomeViewProps {
  featuredPackages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  loading: boolean;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
  onSelectCategory: (category: DestinationCategory) => void;
  websiteCMS: WebsiteCMSSettings;
}

export default function HomeView({
  featuredPackages,
  onNavigate,
  loading,
  isAdminLoggedIn = false,
  onDeletePackage,
  onSelectCategory,
  websiteCMS,
}: HomeViewProps) {
  // Wizard Planner State
  const [plannerCategory, setPlannerCategory] = useState<DestinationCategory>('Pilgrimage');
  const [plannerStyle, setPlannerStyle] = useState<string>('Bespoke Luxury');
  const [plannerDuration, setPlannerDuration] = useState<string>('Medium (5-7 Days)');

  // Dynamic live reviews
  const [liveReviews, setLiveReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchLiveReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const reviewsList: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status || 'Approved';
          if (status === 'Approved') {
            reviewsList.push({ id: doc.id, ...data });
          }
        });
        setLiveReviews(reviewsList.slice(0, 4));
      } catch (err) {
        console.error('Error fetching homepage reviews:', err);
        // Fallback reviews
        setLiveReviews([
          {
            id: 'fb-1',
            name: 'Anjali Deshmukh',
            rating: 5,
            comment: 'The Kedarnath Do Dham journey with Pravaah Travels was spiritually transforming and meticulously executed. Our senior-friendly schedule had perfect buffer stops, pure veg meals, and clean medical kits. Rajesh Sharma coordinated everything beautifully.',
            destination: 'Kedarnath (Sacred Valleys)',
            imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800',
            verified: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'fb-2',
            name: 'Rohan Mehra',
            rating: 5,
            comment: 'Thrill of rafting in Rishikesh combined with elite yoga instruction was mindblowing. The riverside alpine camp was clean, safe, and of absolute premium class. Highly recommend Pravaah for active high-altitude excursions!',
            destination: 'Rishikesh (Ganga Valley)',
            imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
            verified: true,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'fb-3',
            name: 'Vikram & Shalini Malhotra',
            rating: 4,
            comment: 'Superb honeymoon stay in a boutique cottage overlooking the Manali valley. Very romantic, private, and we got a premium luxury 4x4 SUV at our service. Highly helpful drivers on the steep mountain curves.',
            destination: 'Manali & Solang valley',
            imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800',
            verified: true,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchLiveReviews();
  }, []);

  // UGC Interactive lightbox state
  const [selectedUgcPost, setSelectedUgcPost] = useState<any | null>(null);

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

  const popularDestinations = [
    {
      name: 'Uttarakhand Pilgrimages',
      type: 'Spiritual Yatras & Darshan',
      image: 'https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=600&q=80',
      category: 'Pilgrimage' as DestinationCategory,
    },
    {
      name: 'Himalayan Treks',
      type: 'Unexplored Peak Trails',
      image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=600&q=80',
      category: 'Treks' as DestinationCategory,
    },
    {
      name: 'Rishikesh Rafting',
      type: 'Adrenaline & Bungee Jumps',
      image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
      category: 'Adventure' as DestinationCategory,
    },
    {
      name: 'Himachal & Ladakh Desert',
      type: 'High Passes & Monasteries',
      image: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=600&q=80',
      category: 'Ladakh' as DestinationCategory,
    }
  ];

  const ugcPosts = [
    {
      id: 'ugc-1',
      handle: '@aditya_treks',
      location: 'Kedarnath Peak Viewpoint',
      img: 'https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=600&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      likes: '1.2k',
      comments: '142',
      caption: 'Staring at the majestic peaks behind Kedarnath Temple at 6:00 AM. Stiff winds, organic tea, and absolute bliss! Pravaah managed our VIP passes so seamlessly.',
      rating: 5,
      date: '2 days ago'
    },
    {
      id: 'ugc-2',
      handle: '@ hiking_anya',
      location: 'Rishikesh River Camp',
      img: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      likes: '942',
      comments: '88',
      caption: 'After a thrilling 16km raft ride down the wild Ganges, we checked into this incredible luxury Swiss tent camp. Hot showers and organic bonfire dinner! ⛺🌊',
      rating: 5,
      date: '5 days ago'
    },
    {
      id: 'ugc-3',
      handle: '@sharma_escapes',
      location: 'Rohtang Pass Passages',
      img: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=600&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      likes: '2.4k',
      comments: '310',
      caption: 'Pure flow (Pravaah) at 13,000 feet. No hurried tourist buses, slow mountain tracks, hand-picked stops. Truly designed for peace of mind. Check them out!',
      rating: 5,
      date: '1 week ago'
    }
  ];

  const handleLaunchPlanner = () => {
    // Open the interactive wizard quiz modal
    setShowQuizModal(true);
    setQuizStep(1);
    setAiResult(null);
    setAiError('');
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
        travelers: quizAnswers.companions.includes('Couple') ? 2 : 4,
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
      alert('Failed to register enquiry. Please check connection.');
    } finally {
      setAiEnquirySubmitting(false);
    }
  };

  const averageRating = liveReviews.length > 0
    ? (liveReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / liveReviews.length).toFixed(1)
    : '0.0';
  const activeOfferPackages = featuredPackages.filter((pkg) => {
    const price = Number(pkg.price);
    const offerPrice = Number(pkg.offerPrice);
    return Number.isFinite(price) && Number.isFinite(offerPrice) && offerPrice > 0 && offerPrice < price;
  });
  const offerPackages = activeOfferPackages.length > 0 ? activeOfferPackages : featuredPackages;
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

        <div className="relative z-10 mx-auto grid min-h-[760px] max-w-[1320px] grid-cols-1 items-center px-4 py-20 sm:px-6 lg:min-h-[820px] lg:grid-cols-[58%_42%] lg:px-8">
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
                className="group inline-flex cursor-pointer items-center justify-center gap-3 rounded-[5px] bg-[#4DA528] px-8 py-[18px] text-[15px] font-semibold uppercase tracking-[0.05em] text-white transition hover:bg-[#FF970D]"
              >
                <span className="translate-x-[15px] transition group-hover:translate-x-0">{websiteCMS.heroCtaText}</span>
                <ArrowRight className="h-4 w-4 -translate-x-[15px] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-[5px] px-1 py-[18px] text-[15px] font-semibold text-white transition hover:text-[#4DA528]"
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
              onSelectCategory(plannerCategory);
            }}
          >
            <div className="wd-search flex flex-col overflow-hidden rounded-[7px] border border-stone-200 bg-white lg:flex-row">
              <label className="form-group flex min-h-[104px] flex-1 items-center gap-4 border-b border-stone-200 px-5 py-5 lg:border-b-0 lg:border-r lg:px-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Search className="h-5 w-5" />
                </span>
                <span className="search-bar-group block min-w-0 flex-1">
                  <span className="mb-2 block text-[13px] font-bold text-stone-500">Destination</span>
                  <select
                    value={plannerCategory}
                    onChange={(e) => setPlannerCategory(e.target.value as DestinationCategory)}
                    className="nice-select current w-full appearance-none bg-transparent text-[17px] font-extrabold text-stone-950 outline-none"
                  >
                    <option value="Pilgrimage">Pilgrimage</option>
                    <option value="Treks">Treks</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Himachal">Himachal</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
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
                    type="text"
                    value="0"
                    readOnly
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

            <div className="wd-search-form grid gap-5 border-x border-b border-stone-200 bg-[#F7F8F4] px-5 py-5 md:grid-cols-[1.4fr_1fr_1fr] lg:px-7">
              <div className="group-price">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-stone-500">
                  <Sliders className="h-4 w-4 text-[#4DA528]" />
                  Price Range
                </div>
                <div className="widget-price">
                  <div className="relative h-1.5 rounded-full bg-stone-200" id="slider-range">
                    <span className="absolute left-[15%] right-[20%] top-0 h-full rounded-full bg-[#4DA528]" />
                    <span className="absolute left-[15%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#4DA528] shadow" />
                    <span className="absolute right-[20%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#4DA528] shadow" />
                  </div>
                  <div className="slider-labels mt-3 flex justify-between text-[13px] font-semibold text-stone-500">
                    <div>
                      <input type="hidden" name="min-value" value="" readOnly />
                      <span id="slider-range-value1">Flexible</span>
                    </div>
                    <div>
                      <input type="hidden" name="max-value" value="" readOnly />
                      <span id="slider-range-value2">Premium</span>
                    </div>
                  </div>
                </div>
              </div>

              <label className="search-bar-group">
                <span className="mb-3 block text-[13px] font-bold text-stone-500">Activities</span>
                <select
                  value={plannerStyle}
                  onChange={(e) => setPlannerStyle(e.target.value)}
                  className="nice-select current w-full rounded-[5px] border border-stone-200 bg-white px-4 py-3 text-[15px] font-bold text-stone-950 outline-none"
                >
                  <option value="Bespoke Luxury">Bespoke Luxury</option>
                  <option value="Family Comfort">Family Comfort</option>
                  <option value="Sacred Slow Travel">Sacred Slow Travel</option>
                  <option value="Adventure Led">Adventure Led</option>
                </select>
              </label>

              <label className="search-bar-group">
                <span className="mb-3 block text-[13px] font-bold text-stone-500">Destination</span>
                <select
                  value={plannerCategory}
                  onChange={(e) => setPlannerCategory(e.target.value as DestinationCategory)}
                  className="nice-select current w-full rounded-[5px] border border-stone-200 bg-white px-4 py-3 text-[15px] font-bold text-stone-950 outline-none"
                >
                  <option value="Pilgrimage">Pilgrimage</option>
                  <option value="Treks">Treks</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Himachal">Himachal</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                </select>
              </label>
            </div>
          </form>
        </div>
      </section>

      <section className="about-us pb-10 pt-6 sm:pb-12 sm:pt-8" id="vitour-about">
        <div className="tf-container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="image-list flex-three flex -space-x-4">
                {ugcPosts.map((post) => (
                  <button key={post.id} type="button" onClick={() => setSelectedUgcPost(post)} className="item h-14 w-14 overflow-hidden rounded-full border-4 border-white shadow-md">
                    <img src={getTravelImage(post.avatar)} alt={post.handle} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                  </button>
                ))}
                <div className="icon item flex-five flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#4DA528] text-white shadow-md">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <p className="client fadeInUp wow text-[18px] font-semibold text-stone-800">Explore the Unseen Parts Of uttrakhand</p>
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="travel-video relative">
                <img src={getTravelImage(popularDestinations[0].image)} alt={popularDestinations[0].name} className="image-video h-[420px] w-full rounded-[24px] object-cover sm:h-[520px]" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                <div className="video-wrap">
                  <button type="button" onClick={handleLaunchPlanner} className="widget-icon-video widget-videos flex-five z-index3 absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#4DA528] text-white shadow-[0_20px_45px_rgba(0,0,0,0.25)] transition hover:bg-[#FF970D]">
                    <Sparkles className="h-8 w-8" />
                  </button>
                </div>
                <div className="mask-video tf-anime-rorate absolute -right-6 top-10 hidden h-24 w-24 rounded-full border-[18px] border-[#4DA528]/20 sm:block" />
                <div className="mask-enjoy absolute -bottom-8 right-8 hidden rounded-[18px] bg-white p-5 shadow-[0_18px_45px_rgba(0,0,0,0.14)] sm:block">
                  <span className="font-serif text-3xl italic text-[#4DA528]">enjoy</span>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Natural Flow</p>
                </div>
              </div>
            </div>
            <div>
              <div className="inner-content-about">
                <span className="sub-title-heading text-main mb-15 fadeInUp wow block font-serif text-[32px] italic text-[#4DA528]">Explore the Unseen Part Of uttrakhand With us</span>
                <h2 className="title-heading mb-18 fadeInUp wow mt-5 text-[42px] font-extrabold leading-[1.12] text-stone-950 sm:text-[56px]">
                  Great opportunity for <span className="text-gray font-yes font-serif italic font-medium text-stone-400">adventure</span> & travels
                </h2>
                <p className="des-heading fadeInUp wow mt-6 max-w-xl text-[16px] leading-8 text-stone-600">
                  Welcome to Pravaah Travels. We build reliable, premium, human-paced journeys across sacred valleys, riverside camps, mountain roads, and high-altitude retreats.
                </p>
                <div className="fadeInUp wow mt-9 grid gap-5 sm:grid-cols-2">
                  {whyChooseUs.slice(0, 2).map((item) => (
                    <div key={item.title}>
                      <div className="icon-box-style3 border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
                        <div className="icon flex-three mb-5 text-[#4DA528]">{item.icon}</div>
                        <h6 className="title mb-10 text-[18px] font-bold text-stone-950">{item.title}</h6>
                        <p className="des text-[14px] leading-7 text-stone-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex-three btn-wrap-about fadeInUp wow mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button onClick={() => onNavigate('about')} className="btn-main inline-flex cursor-pointer items-center justify-center gap-3 rounded-[5px] bg-[#4DA528] px-8 py-[18px] text-[15px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[#FF970D]">
                    <span className="btn-main-text">More about us</span>
                    <span className="iconer"><ArrowRight className="h-4 w-4" /></span>
                  </button>
                  <div className="profile flex-three flex items-center gap-3">
                    <div className="image h-12 w-12 overflow-hidden rounded-full">
                      <img src={getTravelImage(ugcPosts[0].avatar)} alt={ugcPosts[0].handle} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                    </div>
                    <div className="content">
                      <p className="font-serif text-[20px] italic text-stone-950">Pravaah Curator</p>
                      <span className="text-main text-[12px] font-bold uppercase tracking-wider text-[#4DA528]">Ceo & Founder</span>
                    </div>
                  </div>
                </div>
                <div className="map-check flex-three fadeInUp wow flex items-center gap-3 text-[#4DA528]">
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
          <div className="center m0-auto w-text-heading mx-auto mb-10 max-w-3xl text-center">
            <span className="sub-title-heading text-main mb-15 fadeInUp wow font-serif text-[32px] italic text-[#4DA528]">Explore the world</span>
            <h2 className="title-heading fadeInUp wow mt-4 text-[42px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">
              Amazing Featured Tour <span className="text-gray font-yes font-serif italic font-medium text-stone-400">Package</span> the world
            </h2>
          </div>
          <div className="tab-tour-list">
                <ul className="tab-list mb-10 flex flex-wrap justify-center gap-3" id="myTab" role="tablist">
                  {(['Pilgrimage', 'Treks', 'Adventure', 'Himachal', 'Ladakh'] as DestinationCategory[]).map((category) => (
                    <li key={category} className="nav-item" role="presentation">
                      <button
                        className={`nav-link cursor-pointer rounded-full border px-6 py-3 text-[14px] font-bold transition ${
                          plannerCategory === category
                            ? 'active border-[#4DA528] bg-[#4DA528] text-white'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-[#4DA528] hover:text-[#4DA528]'
                        }`}
                        type="button"
                        role="tab"
                        aria-selected={plannerCategory === category}
                        onClick={() => onSelectCategory(category)}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="tab-content" id="myTabContent">
                  <div className="tab-pane fade show active" role="tabpanel" tabIndex={0}>
                    {loading ? (
                      <div className="flex justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#4DA528] border-t-transparent" />
                      </div>
                    ) : featuredPackages.length === 0 ? (
                      <div className="mx-auto max-w-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
                        <AlertCircle className="mx-auto mb-4 h-8 w-8 text-stone-300" />
                        <p className="text-sm text-stone-500">No active travel packages have been marked as featured yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 items-stretch gap-7 sm:grid-cols-2 xl:grid-cols-4">
                        {featuredPackages.slice(0, 4).map((pkg, idx) => (
                          <div key={pkg.id} className="h-full">
                            <article className="tour-listing wow fadeInUp animated group flex h-full flex-col overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-2" data-wow-delay={`${(idx + 1) / 10}s`}>
                              <button type="button" onClick={() => onNavigate('package-detail', pkg.id)} className="tour-listing-image relative block h-[270px] w-full cursor-pointer overflow-hidden bg-stone-100 text-left">
                                <div className="badge-top flex-two absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
                                  <span className="feature rounded bg-[#4DA528] px-3 py-1 text-[12px] font-bold text-white">Featured</span>
                                  <div className="badge-media flex-five flex gap-2">
                                    <span className="media rounded bg-white/90 px-3 py-1 text-[12px] font-bold text-stone-800">{idx + 2}</span>
                                    <span className="media rounded bg-white/90 px-3 py-1 text-[12px] font-bold text-stone-800">{liveReviews.length || 1}</span>
                                  </div>
                                </div>
                                <img src={getTravelImage(pkg.imageUrl)} alt={pkg.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                                {isAdminLoggedIn && onDeletePackage && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeletePackage(pkg.id);
                                    }}
                                    className="absolute bottom-4 right-4 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
                                    title="Delete Package"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </button>
                              <div className="tour-listing-content flex flex-1 flex-col p-6">
                                <span className="tag-listing inline-block rounded bg-[#FF970D]/12 px-3 py-1 text-[12px] font-bold text-[#D57400]">{pkg.category}</span>
                                <span className="map mt-4 flex items-center gap-2 text-[14px] font-medium text-stone-500">
                                  <Map className="h-4 w-4 text-[#4DA528]" />
                                  {pkg.destination}
                                </span>
                                <h3 className="title-tour-list mt-3">
                                  <button onClick={() => onNavigate('package-detail', pkg.id)} className="line-clamp-2 cursor-pointer text-left text-[22px] font-bold leading-tight text-stone-950 transition hover:text-[#4DA528]">
                                    {pkg.title}
                                  </button>
                                </h3>
                                <div className="review mt-4 flex items-center gap-1 text-[#FF970D]">
                                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                                  <span className="ml-2 text-[13px] font-medium text-stone-500">({liveReviews.length || 1} Review)</span>
                                </div>
                                <div className="icon-box flex-three mt-5 flex items-center justify-between border-y border-stone-100 py-4 text-[14px] text-stone-600">
                                  <div className="icons flex-three flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#4DA528]" />
                                    <span>{pkg.duration}</span>
                                  </div>
                                  <div className="icons flex-three flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[#4DA528]" />
                                    <span>12 Person</span>
                                  </div>
                                </div>
                                <div className="flex-two mt-auto flex items-center justify-between pt-5">
                                  <div className="price-box flex-three">
                                    <p className="text-[14px] text-stone-500">From <span className="price-sale text-[20px] font-extrabold text-[#4DA528]">{formatPrice(pkg.price)}</span></p>
                                  </div>
                                  <button onClick={() => onNavigate('package-detail', pkg.id)} className="icon-bookmark flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-[#4DA528] hover:text-white">
                                    <Heart className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </article>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <button onClick={() => onNavigate('packages')} className="btn-main inline-flex cursor-pointer items-center justify-center gap-3 rounded-[5px] bg-[#4DA528] px-8 py-[18px] text-[15px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[#FF970D]">
                    <span className="btn-main-text">View all tour</span>
                    <span className="iconer"><ArrowRight className="h-4 w-4" /></span>
                  </button>
                </div>
          </div>
        </div>
      </section>

      <section className="relative tf-widget-activities overflow-hidden bg-[#F4F6F8] py-20">
        <div className="mask-top absolute left-0 top-0 h-24 w-24 rounded-br-full bg-[#4DA528]/10" />
        <div className="mask-bottom absolute bottom-0 right-0 h-28 w-28 rounded-tl-full bg-[#FF970D]/10" />
        <div className="tf-container relative z-index3 mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="clip-text text-center text-[54px] font-extrabold uppercase leading-none text-stone-200 sm:text-[90px]">Activities</div>
          </div>
              <ul className="nav-tabs-activities flex gap-3 overflow-x-auto pb-3 md:flex-wrap md:justify-center md:overflow-visible md:pb-0" id="myTablist" role="tablist">
                {popularDestinations.map((dest, idx) => (
                  <li key={`${dest.name}-activity-${idx}`} className="shrink-0" role="presentation">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={idx === 0}
                      onClick={() => onSelectCategory(dest.category)}
                      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-3 text-center text-[13px] font-bold transition ${
                        idx === 0 ? 'active border-[#4DA528] bg-[#4DA528] text-white' : 'border-stone-200 bg-white text-stone-800 hover:border-[#4DA528] hover:text-[#4DA528]'
                      }`}
                    >
                      <span className="icon flex h-8 w-8 items-center justify-center rounded-full bg-current/10">
                        <Compass className="h-5 w-5" />
                      </span>
                      <span className="whitespace-nowrap">{dest.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="tab-content mt-10" id="myTabContents">
                <div className="tab-pane fade show active" role="tabpanel" tabIndex={0}>
                  <div className="tabs-activities-content flex flex-col overflow-hidden rounded-[18px] bg-[#081E2A] lg:flex-row">
                    <div className="activities-image lg:w-1/2">
                      <img src={getTravelImage(popularDestinations[1].image)} alt={popularDestinations[1].name} className="h-[360px] w-full object-cover lg:h-full" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                    </div>
                    <div className="activities-content relative flex-1 p-8 sm:p-12">
                      <span className="sub-title text-white/70">Welcome to Pravaah</span>
                      <h3 className="title-activitis mt-4 max-w-xl text-[34px] font-extrabold leading-tight text-white sm:text-[48px]">Real adventure & enjoy your dream tours</h3>
                      <div className="flex-three mt-8 flex flex-col gap-4 text-white sm:flex-row">
                        <div className="icon-list-wrap flex-three flex items-center gap-3">
                          <Check className="h-5 w-5 text-[#4DA528]" />
                          <span className="icon-lists">Real adventure Feel</span>
                        </div>
                        <div className="icon-list-wrap flex-three flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-[#4DA528]" />
                          <span className="icon-lists">Comfort & Secure trip</span>
                        </div>
                      </div>
                      <div className="btn-wrap-activitis flex-three mt-10 flex items-center gap-4">
                        <button type="button" onClick={handleLaunchPlanner} className="icon-activitis flex-five flex h-12 w-12 items-center justify-center rounded-full bg-[#4DA528] text-white">
                          <ArrowRight className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={() => onNavigate('packages')} className="get-start text-white">Get Started Today</button>
                      </div>
                      <div className="mask-tab absolute bottom-8 right-8 h-20 w-20 rounded-full border border-white/10" />
                    </div>
                  </div>
                </div>
              </div>
        </div>
      </section>

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

      <section className="widget-counter relative bg-[#4DA528] py-14 text-white sm:py-16" id="home-statistics">
        <div className="counter-top absolute left-0 top-0 h-20 w-20 rounded-br-full bg-white/10" />
        <div className="counter-bottom absolute bottom-0 right-0 h-20 w-20 rounded-tl-full bg-white/10" />
        <div className="tf-container relative mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="cta-wrap flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="image fadeInLeft wow h-20 w-20 overflow-hidden rounded-full border-4 border-white/20">
                <img src={getTravelImage(popularDestinations[2].image)} alt={popularDestinations[2].name} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
              </div>
              <div className="content">
                <h2 className="title-call mb-18 fadeInUp wow text-[30px] font-extrabold leading-tight text-white sm:text-[34px]">Ready to adventure and enjoy natural</h2>
                <p className="des fadeInUp wow text-white/80">Explore Uttarakhand with guides who respect the mountains.</p>
              </div>
            </div>
            <div>
              <div className="callt-to-action-button fadeInRight wow lg:text-end">
                <button onClick={() => onNavigate('packages')} className="get-call inline-flex cursor-pointer rounded-[5px] bg-white px-7 py-4 text-[14px] font-bold uppercase text-[#4DA528] transition hover:bg-[#FF970D] hover:text-white">Let's get started</button>
              </div>
            </div>
          </div>
          <div className="relative z-index3 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {[
              [featuredPackages.length, 'Happy Traveller'],
              [`${averageRating}`, 'Total Positive Reviews'],
              [popularDestinations.length, 'Tour Completed'],
              [liveReviews.length || 0, 'Awards Won'],
            ].map(([value, label]) => (
              <div key={label} className="wow fadeInUp animated min-w-0">
                <div className="tf-counter center tf-countto h-full rounded-[14px] bg-white/10 p-5 text-center ring-1 ring-white/10 sm:p-6">
                  <div className="icon mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                    <PlaneTakeoff className="h-8 w-8" />
                  </div>
                  <div className="number-counter block text-[34px] font-extrabold leading-none sm:text-[44px]">{value}</div>
                  <span className="line mx-auto my-3 block h-px w-16 bg-white/45" />
                  <p className="title-counter text-[16px] font-bold leading-6">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="widget-destination py-14 sm:py-20" id="popular-destinations">
        <div className="tf-container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="center m0-auto w-text-heading mx-auto mb-10 max-w-3xl text-center">
            <span className="sub-title-heading text-main mb-15 fadeInUp wow font-serif text-[32px] italic text-[#4DA528]">Explore the world</span>
            <h2 className="title-heading fadeInUp wow mt-4 text-[42px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">We provide top tourist destinations</h2>
          </div>
          <div className="grid-three-destination grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularDestinations.map((dest, idx) => (
              <div key={dest.name} className="tf-widget-destination wow fadeInUp animated h-full">
                <button type="button" onClick={() => onSelectCategory(dest.category)} className="destination-imgae group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[12px] text-left shadow-[0_14px_38px_rgba(0,0,0,0.12)]">
                  <span className="tour absolute left-5 top-5 z-10 rounded bg-[#4DA528] px-3 py-1 text-[12px] font-bold text-white">{idx + 3} tours</span>
                  <img src={getTravelImage(dest.image)} alt={dest.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                  <span className="absolute inset-0 bg-linear-to-t from-black/74 via-black/18 to-transparent" />
                  <span className="destination-content absolute inset-x-0 bottom-0 p-6 text-white">
                    <span className="nation text-[15px] font-medium uppercase text-white/76">{dest.name}</span>
                    <span className="btn-destination flex-two mt-3 flex items-center justify-between">
                      <span className="title text-[22px] font-bold">View all tours</span>
                      <span className="btn-view flex-five flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#4DA528] transition group-hover:bg-[#4DA528] group-hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F8] py-20" id="testimonials">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="relative hidden min-h-[520px] md:block">
            <img src={getTravelImage('https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80')} alt="Traveler testimonial" className="absolute left-0 top-0 h-[350px] w-[72%] rounded-[20px] object-cover shadow-xl" referrerPolicy="no-referrer" onError={handleTravelImageError} />
            <img src={getTravelImage('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=700&q=80')} alt="Traveler testimonial" className="absolute bottom-0 right-0 h-[320px] w-[70%] rounded-[20px] object-cover shadow-xl" referrerPolicy="no-referrer" onError={handleTravelImageError} />
          </div>
          <div>
            <span className="font-serif text-[32px] italic text-[#4DA528]">Travelers say</span>
            <h2 className="mt-4 text-[42px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">What our clients say about us</h2>
            {loadingReviews ? (
              <div className="mt-12 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-[#4DA528] border-t-transparent animate-spin" />
                <span className="text-stone-500">Loading traveler journals...</span>
              </div>
            ) : liveReviews.length === 0 ? (
              <div className="mt-12 bg-white p-8 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
                <MessageSquare className="mb-4 h-8 w-8 text-stone-300" />
                <p className="text-stone-600">No traveler reviews found. Be the first to share your experience.</p>
              </div>
            ) : (
              <div className="mt-10 grid gap-6">
                {liveReviews.slice(0, 3).map((review) => (
                  <article key={review.id} className="relative bg-white p-8 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
                    <Quote className="absolute right-8 top-8 h-12 w-12 text-[#4DA528]/15" />
                    <div className="profile mb-4">
                      <h3 className="text-[24px] font-bold text-stone-950">{review.name}</h3>
                      <span className="text-[13px] font-bold uppercase tracking-widest text-[#4DA528]">{review.destination}</span>
                    </div>
                    <p className="max-w-2xl text-[16px] leading-8 text-stone-600">"{review.comment}"</p>
                    <span className="my-6 block h-px w-full bg-stone-100" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex gap-1 text-[#FF970D]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-stone-200'}`} />
                        ))}
                      </div>
                      <img src={getTravelImage(review.imageUrl)} alt="Trip photograph" className="h-14 w-14 rounded-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

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

      <section className="relative z-10 -mb-24 px-4 sm:px-6 lg:px-8" id="home-cta">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-6 rounded-[14px] bg-[#4DA528] p-8 text-white shadow-[0_20px_55px_rgba(0,0,0,0.16)] md:flex-row">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/16">
              <PlaneTakeoff className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-[28px] font-extrabold leading-tight sm:text-[34px]">Ready to adventure and enjoy natural</h2>
              <p className="mt-2 text-[15px] text-white/82">Plan your custom Himalayan flow with Pravaah's travel curators.</p>
            </div>
          </div>
          <button onClick={() => onNavigate('contact')} className="shrink-0 cursor-pointer rounded-[5px] bg-white px-8 py-4 text-[15px] font-bold text-[#4DA528] transition hover:bg-[#FF970D] hover:text-white">
            Let,s get started
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* UGC POST DETAIL LIGHTBOX MODAL */}
      {/* ======================================================== */}
      {selectedUgcPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="ugc-lightbox">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-stone-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
            
            {/* Left: Image */}
            <div className="relative aspect-square md:aspect-auto md:h-[550px] bg-stone-900 flex items-center justify-center">
              <img src={getTravelImage(selectedUgcPost.img)} alt="Post visual" className="w-full h-full object-cover" onError={handleTravelImageError} />
              <button 
                onClick={() => setSelectedUgcPost(null)}
                className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Right: Comments, Reviews and details */}
            <div className="p-6 md:p-8 flex flex-col justify-between h-[450px] md:h-[550px] space-y-4">
              <div className="space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img src={getTravelImage(selectedUgcPost.avatar)} alt="avatar" className="w-10 h-10 rounded-full border border-stone-200" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                    <div>
                      <div className="text-sm font-bold text-stone-850 flex items-center gap-1">
                        <span>{selectedUgcPost.handle}</span>
                        <span className="w-3.5 h-3.5 bg-sky-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold">✓</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-[#4DA528] font-bold">{selectedUgcPost.location}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedUgcPost(null)}
                    className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-750 transition-colors hidden md:block"
                  >
                    <X className="w-5.5 h-5.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-0.5 text-[#F4C430]">
                    {[...Array(selectedUgcPost.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-light italic">
                    "{selectedUgcPost.caption}"
                  </p>
                </div>

                {/* Simulated Verified Comments */}
                <div className="border-t border-stone-100 pt-4 space-y-3">
                  <h5 className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Verified Comments</h5>
                  <div className="space-y-2">
                    <div className="text-xs bg-stone-50 p-2.5 border border-stone-150 rounded text-stone-600 leading-relaxed font-light">
                      <strong className="text-stone-800">@praveen_sharma:</strong> Stunner of a shot! Did you hire helicopter from Dehradun?
                    </div>
                    <div className="text-xs bg-stone-50 p-2.5 border border-stone-150 rounded text-stone-600 leading-relaxed font-light">
                      <strong className="text-stone-800">@hiking_anya:</strong> @praveen_sharma Yes! Pravaah managed the heli slots. Seamless VIP lounge check-ins. Definitely worth the bespoke comfort pack!
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setSelectedUgcPost(null);
                    onNavigate('packages');
                  }}
                  className="w-full py-3 bg-[#4DA528] hover:bg-[#3f8f21] text-white font-bold uppercase tracking-widest text-xs rounded transition flex items-center justify-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Browse Similar Curated Escapes</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

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
