import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Star, Heart, Compass, ShieldCheck, Map, Calendar, 
  PlaneTakeoff, Trash2, Search, Sparkles, AlertCircle, Quote,
  Sliders, GripVertical, ArrowUp, ArrowDown, X, Users, Clock, ThumbsUp, MessageSquare, Check, Phone, Send, Info,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { TravelPackage, formatPrice, DestinationCategory } from '../types';
import InteractiveRouteMap from './InteractiveRouteMap';
import { db, collection, addDoc, getDocs, query, orderBy, limit } from '../lib/firebase';

interface HomeViewProps {
  featuredPackages: TravelPackage[];
  onNavigate: (view: string, packageId?: string | null) => void;
  loading: boolean;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
  onSelectCategory: (category: DestinationCategory) => void;
}

export default function HomeView({
  featuredPackages,
  onNavigate,
  loading,
  isAdminLoggedIn = false,
  onDeletePackage,
  onSelectCategory,
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
      icon: <Compass className="w-6 h-6 text-[#008080]" />,
      title: 'Expert Himalayan Curation',
      description: 'Our itineraries are designed by certified mountain guides and travel specialists who know the safest routes, best view points, and local secrets.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#008080]" />,
      title: 'Uncompromised Comfort & Safety',
      description: 'Your safety is our priority. We feature 4x4 private transport, vetted hand-picked premium lodges, and 24/7 on-the-ground support.'
    },
    {
      icon: <Map className="w-6 h-6 text-[#008080]" />,
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

  const handleDragOver = (e: React.DragEvent, index: number) => {
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

  return (
    <div id="home-view" className="animate-fade-in bg-[#fbfbfa]">
      
      {/* 1. Hero Section with Live Badges */}
      <section className="relative min-h-[92vh] lg:min-h-[85vh] border-b border-stone-200/60 overflow-hidden flex items-center bg-[#f8f7f4] pb-16 lg:pb-28" id="home-hero">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#008080_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 flex flex-col justify-center">
              <div className="space-y-3">
                <span className="text-[#008080] font-bold text-[10px] uppercase tracking-[0.3em] bg-[#008080]/10 px-3.5 py-1.5 rounded-full inline-block">
                  PREMIUM HIMALAYAN ODYSSEYS
                </span>
                <h2 className="text-4xl sm:text-6xl lg:text-[70px] font-serif text-stone-900 leading-[1.1] tracking-tight">
                  Thoughtful <span className="italic font-normal text-[#008080] font-serif">journeys</span> designed for true seekers
                </h2>
              </div>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-sans font-light max-w-xl">
                Experience the pure flow of travel. Seek blessings at sacred Uttarakhand shrines, conquer spectacular winter treks, plunge into thrilling rafting in Rishikesh, or explore the mystical monasteries of Himachal & Ladakh. 
              </p>

              {/* Verified Trust Seal Badge */}
              <div className="flex flex-wrap items-center gap-4 bg-white border border-stone-200 px-4 py-3 rounded-md shadow-xs max-w-lg">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs border-r border-stone-200 pr-4 shrink-0">
                  <Star className="w-4.5 h-4.5 fill-current" />
                  <span className="text-stone-800 text-xs">TripAdvisor <strong className="text-[#008080]">5.0</strong> Excellent</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span className="text-stone-800 text-xs">Google Ratings <strong className="text-[#008080]">4.9 / 5</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleLaunchPlanner}
                  className="px-8 py-4 bg-[#FF7F50] hover:bg-[#ff6a33] text-white font-bold uppercase tracking-[0.15em] text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 rounded-sm shadow-lg animate-bounce"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Interactive AI Trip Planner</span>
                </button>
              </div>
            </div>

            {/* Right Column Content - Hero Image with Floating Glass Panel */}
            <div className="lg:col-span-5 relative h-[380px] sm:h-[480px] lg:h-[550px] w-full rounded-2xl overflow-hidden group shadow-2xl border-4 border-white">
              <div className="absolute inset-0 bg-stone-900/10 z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&q=80&w=1024"
                alt="Kedarnath Temple Valley"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                referrerPolicy="no-referrer"
                id="hero-main-img"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 border-l-4 border-[#008080] shadow-2xl z-20 rounded-md" id="hero-img-badge">
                <span className="text-[9px] uppercase tracking-widest text-[#008080] mb-1.5 block font-bold">FEATURING EXPEDITIONS</span>
                <h4 className="text-lg sm:text-xl font-serif italic text-stone-900 mb-2 font-medium">Kedarnath & Badrinath Divine Yatra</h4>
                <div className="flex justify-between items-center border-t border-stone-100 pt-3">
                  <span className="text-xs font-semibold text-[#008080]">6 Days • 5 Nights</span>
                  <span className="text-sm font-bold text-stone-950">₹22,500 <span className="text-[9px] font-normal text-stone-400">/ person</span></span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. Popular Styles & Regions */}
      <section className="py-24 bg-white border-b border-stone-200/40" id="popular-destinations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-[#008080] tracking-[0.25em] uppercase block">PRESET MOODS</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              Signature Experiences
            </h3>
            <div className="w-12 h-0.5 bg-[#F4C430] mx-auto" />
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-light">
              Crafted around Uttarakhand's raw nature, divine pilgrimages, high-altitude passes, and spiritual hubs. Select a mood to see curated packages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((dest, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectCategory(dest.category)}
                className="relative h-80 overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl transition-all duration-300 border border-stone-200/60 rounded-md"
              >
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="text-[#F4C430] text-[10px] font-bold uppercase tracking-widest block">{dest.type}</span>
                  <h4 className="text-xl font-serif italic">{dest.name}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-[#008080] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 font-semibold">
                    <span>Explore packages</span>
                    <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Handcrafted Packages */}
      <section className="py-24 bg-[#f8f7f4] border-b border-stone-200/60" id="featured-packages">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#008080] tracking-[0.2em] uppercase block">PREMIUM SELECTION</span>
              <h3 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">Bespoke itineraries of the week</h3>
              <div className="w-12 h-0.5 bg-[#F4C430]" />
            </div>
            <button
              onClick={() => onNavigate('packages')}
              className="text-[#008080] hover:text-[#006666] font-bold flex items-center gap-2 group cursor-pointer text-xs uppercase tracking-widest transition-colors"
            >
              <span>Browse Entire Catalog</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#008080] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : featuredPackages.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200 p-8 rounded">
              <p className="text-stone-400 italic text-xs">No active travel packages have been marked as featured yet.</p>
              <button 
                onClick={() => onNavigate('packages')}
                className="mt-4 inline-flex items-center gap-2 text-[#008080] font-bold text-xs uppercase tracking-widest hover:underline"
              >
                Browse all packages
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredPackages.slice(0, 3).map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="bg-white border border-stone-200/80 rounded overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group rounded-md"
                >
                  <div className="relative h-64 overflow-hidden bg-stone-100">
                    <img 
                      src={pkg.imageUrl} 
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-[#008080] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 shadow-sm">
                      {pkg.category}
                    </div>
                    {isAdminLoggedIn && onDeletePackage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePackage(pkg.id);
                        }}
                        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md hover:scale-105 transition-all cursor-pointer z-30"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {pkg.price && (
                      <div className="absolute bottom-4 right-4 bg-white border border-stone-200 text-stone-800 text-xs font-semibold px-3.5 py-1.5 shadow-md">
                        From <span className="text-[#008080] font-bold text-base">{formatPrice(pkg.price)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[9px] text-[#FF7F50] font-bold uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5 text-[#FF7F50]" />
                        <span>{pkg.duration}</span>
                      </div>
                      <h4 className="text-lg font-serif italic text-stone-900 group-hover:text-[#008080] transition-colors line-clamp-1">
                        {pkg.title}
                      </h4>
                      <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 font-light">
                        {pkg.shortDescription}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{pkg.destination}</span>
                      <button
                        onClick={() => onNavigate('package-detail', pkg.id)}
                        className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-sm"
                      >
                        View Itinerary
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. VERIFIED COMMUNITY REVIEWS & REAL VISUALS (UGC) SECTION */}
      <section className="py-24 bg-white border-b border-stone-100" id="ugc-gallery">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-[#008080] tracking-[0.25em] uppercase block">VERIFIED EXPLORERS</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              Real Visuals from the Field
            </h3>
            <div className="w-12 h-0.5 bg-[#F4C430] mx-auto" />
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-light">
              Customer photos & raw reviews straight from active Himalayan packages. Verified check-ins represent real guest satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ugcPosts.map((post) => (
              <div 
                key={post.id}
                onClick={() => setSelectedUgcPost(post)}
                className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col shadow-xs"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
                  <img 
                    src={post.img} 
                    alt={post.location} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/30 transition-all"></div>
                  
                  {/* Location tag floating */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[9px] font-medium tracking-wide flex items-center gap-1">
                    <Map className="w-3 h-3 text-[#F4C430]" />
                    <span>{post.location}</span>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-[#008080] text-white px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current text-[#F4C430]" />
                    <span>5.0</span>
                  </div>

                  {/* Floating Action Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1 font-bold">
                      <ThumbsUp className="w-4 h-4 fill-white" /> {post.likes}
                    </div>
                    <div className="flex items-center gap-1 font-bold">
                      <MessageSquare className="w-4 h-4 fill-white" /> {post.comments}
                    </div>
                  </div>
                </div>

                {/* Profile Detail */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <img src={post.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-stone-200" referrerPolicy="no-referrer" />
                      <div>
                        <div className="text-xs font-bold text-stone-800 flex items-center gap-1">
                          <span>{post.handle}</span>
                          <span className="w-3.5 h-3.5 bg-sky-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold" title="Verified Customer">✓</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">{post.date}</span>
                      </div>
                    </div>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed line-clamp-2 italic font-light">
                      "{post.caption}"
                    </p>
                  </div>
                  <div className="text-[9.5px] text-[#008080] font-bold uppercase tracking-wider flex items-center gap-1 border-t border-stone-100 pt-3">
                    <span>Read Verified Review Log</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Brand Ethos (Why Choose Us) - Sophisticated Bento Grid style */}
      <section className="py-24 bg-[#f8f7f4] border-b border-stone-100" id="brand-ethos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-[#008080] tracking-[0.25em] uppercase block">THE PRAVAAH WAY</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              Bespoke travel designed to flow
            </h3>
            <div className="w-12 h-0.5 bg-[#F4C430] mx-auto" />
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-light">
              "Pravaah" translates to flow. We believe high-altitude journeys and sacred pilgrimages should have an effortless, life-affirming cadence—safeguarded by experts, rich in authenticity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white border border-stone-200/60 p-8 hover:shadow-lg transition-all duration-300 group rounded-md"
              >
                <div className="w-12 h-12 bg-stone-50 border border-stone-200/80 rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <h5 className="text-lg font-serif italic text-stone-900 mb-3 font-medium">{item.title}</h5>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Traveler Reviews Section - Live and Dynamic */}
      <section className="py-24 bg-white border-b border-stone-200/60" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-[#008080] tracking-[0.25em] uppercase block">TRAVELER REVIEWS</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">Verified Traveler Logs</h3>
            <div className="w-12 h-0.5 bg-[#F4C430] mx-auto" />
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-light">
              Real-time reviews and experiences published directly by our travelers from their Customer Dashboard.
            </p>
          </div>

          {loadingReviews ? (
            <div className="text-center py-12 flex flex-col items-center justify-center space-y-3" id="home-reviews-loader">
              <div className="w-8 h-8 border-2 border-[#008080] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-stone-400 font-light">Loading traveler journals...</p>
            </div>
          ) : liveReviews.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 border border-stone-200 rounded-lg max-w-lg mx-auto p-8 space-y-3" id="home-reviews-empty">
              <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500 font-light">No traveler reviews found. Be the first to share your experience!</p>
              <button
                type="button"
                onClick={() => onNavigate('portal')}
                className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Write a Review
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto" id="home-reviews-grid">
              {liveReviews.map((review) => (
                <div 
                  key={review.id} 
                  className="bg-stone-50 p-8 border border-stone-200/60 rounded-md relative shadow-sm flex flex-col justify-between hover:border-[#008080]/30 transition-all duration-300"
                >
                  <Quote className="absolute right-6 top-6 w-8 h-8 text-stone-150" />
                  <div>
                    <div className="flex gap-1 mb-4 text-[#F4C430]">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'fill-[#F4C430] text-[#F4C430]' : 'text-stone-200'}`} 
                        />
                      ))}
                    </div>
                    
                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light italic mb-6">
                      "{review.comment}"
                    </p>

                    {review.reply && (
                      <div className="mt-2 mb-4 bg-white border-l-2 border-[#008080] p-2.5 rounded-r text-[11px] text-stone-600 italic font-light">
                        <span className="font-bold text-[#008080] uppercase tracking-wider text-[8px] block not-italic mb-0.5">Pravaah Travels:</span>
                        "{review.reply}"
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-stone-150 pt-4 mt-2">
                    <div>
                      <h5 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{review.name}</span>
                        {review.verified && (
                          <span className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold" title="Verified Customer">✓</span>
                        )}
                      </h5>
                      <span className="text-[10px] uppercase text-[#008080] font-bold tracking-widest block mt-0.5">{review.destination}</span>
                    </div>

                    {review.imageUrl && (
                      <img 
                        src={review.imageUrl} 
                        alt="Trip photograph" 
                        className="w-12 h-12 object-cover rounded-md border border-stone-200 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button
              type="button"
              onClick={() => onNavigate('reviews')}
              className="px-6 py-3 border border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-200 cursor-pointer"
            >
              View All Traveler Logs
            </button>
          </div>
        </div>
      </section>

      {/* 7. Bespoke Holiday Planner Form */}
      <section className="relative py-24 bg-stone-900 text-white overflow-hidden border-t border-stone-800" id="home-cta">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1200&q=80")' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6">
          <span className="text-[#F4C430] text-xs font-bold uppercase tracking-[0.3em] block">TAILOR-MADE LUXURY</span>
          <h3 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
            Ready to co-design your custom escape?
          </h3>
          <p className="text-stone-300 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-light">
            Share your preferred dates, group size, or desired peaks. Let our custom designers weave a tailored itinerary that moves perfectly to your rhythm.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('contact')}
              className="px-8 py-4 bg-[#FF7F50] hover:bg-[#ff6a33] text-white font-bold uppercase tracking-[0.15em] text-xs hover:brightness-105 shadow-xl transition-all duration-200 cursor-pointer rounded-sm"
            >
              Get My Custom Itinerary
            </button>
            <button
              onClick={handleLaunchPlanner}
              className="px-8 py-4 border border-stone-400 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-[0.15em] text-xs transition-all duration-200 cursor-pointer rounded-sm"
            >
              Curate with Pravaah AI
            </button>
          </div>
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
              <img src={selectedUgcPost.img} alt="Post visual" className="w-full h-full object-cover" />
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
                    <img src={selectedUgcPost.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-stone-200" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-sm font-bold text-stone-850 flex items-center gap-1">
                        <span>{selectedUgcPost.handle}</span>
                        <span className="w-3.5 h-3.5 bg-sky-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold">✓</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-[#008080] font-bold">{selectedUgcPost.location}</span>
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
                  className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold uppercase tracking-widest text-xs rounded transition flex items-center justify-center gap-1.5"
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
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 1 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>1</span>
                  <span className={quizStep === 1 ? 'text-stone-800 font-bold' : ''}>Focus</span>
                </div>
                <div className="w-8 h-px bg-stone-300"></div>
                <div className="flex gap-2 items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 2 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>2</span>
                  <span className={quizStep === 2 ? 'text-stone-800 font-bold' : ''}>Companions</span>
                </div>
                <div className="w-8 h-px bg-stone-300"></div>
                <div className="flex gap-2 items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 3 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>3</span>
                  <span className={quizStep === 3 ? 'text-stone-800 font-bold' : ''}>Style Vibe</span>
                </div>
                <div className="w-8 h-px bg-stone-300"></div>
                <div className="flex gap-2 items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${quizStep === 4 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>4</span>
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
                          ? 'border-[#008080] bg-[#008080]/5 text-[#008080]' 
                          : 'border-stone-200 hover:border-[#008080] bg-[#fbfbfa]'
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
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setQuizStep(2)}
                    className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1"
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
                          ? 'border-[#008080] bg-[#008080]/5 text-[#008080]' 
                          : 'border-stone-200 hover:border-[#008080] bg-[#fbfbfa]'
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
                    className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1"
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
                          ? 'border-[#008080] bg-[#008080]/5' 
                          : 'border-stone-200 hover:border-[#008080] bg-[#fbfbfa]'
                      }`}
                    >
                      <span className={`text-xs font-bold tracking-wide ${quizAnswers.vibe === v.title ? 'text-[#008080]' : 'text-stone-800'}`}>{v.title}</span>
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
                    className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1"
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
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
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
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium font-mono"
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
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium resize-none"
                  />
                </div>

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
                    className="px-6 py-2.5 bg-[#FF7F50] hover:bg-[#ff6a33] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shadow"
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
                <Sparkles className="w-14 h-14 text-[#008080] animate-pulse mb-4" />
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
                            onDragOver={(e) => handleDragOver(e, index)}
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
                                    isOpen ? 'bg-[#008080] text-white border-transparent' : 'bg-[#f8f7f4] text-stone-500'
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
                                    className="p-1 border border-stone-200 bg-white rounded text-stone-500 hover:text-[#008080] disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === aiResult.itinerary.length - 1}
                                    onClick={() => moveAiDay(index, 'down')}
                                    className="p-1 border border-stone-200 bg-white rounded text-stone-500 hover:text-[#008080] disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#008080]" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
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
                      <h5 className="text-xs font-bold text-[#008080] uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-4 h-4" /> Customized Inclusions
                      </h5>
                      <ul className="space-y-1.5 text-[11px] text-stone-600 font-light">
                        {aiResult.inclusions?.map((inc: string, idx: number) => (
                          <li key={idx} className="flex gap-1.5 items-start">
                            <span className="text-[#008080] font-bold shrink-0">✓</span>
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
                      <div className="bg-[#008080]/15 border border-[#008080]/30 rounded-lg p-5 text-center space-y-3">
                        <div className="w-10 h-10 bg-[#008080] text-white rounded-full flex items-center justify-center mx-auto shadow">
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
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
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
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
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
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Target Travel Date</label>
                            <input 
                              type="date" 
                              required 
                              value={aiEnquiryData.travelDate}
                              onChange={(e) => setAiEnquiryData({...aiEnquiryData, travelDate: e.target.value})}
                              className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium cursor-pointer"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={aiEnquirySubmitting}
                          className="w-full py-3 bg-[#FF7F50] hover:bg-[#ff6a33] text-white text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1.5 shadow"
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
                  className="px-5 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded shadow"
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
