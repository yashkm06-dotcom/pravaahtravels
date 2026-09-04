import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Mountain,
  ShieldCheck,
  Check,
  X,
  Send,
  MessageCircle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  AlertCircle,
  HeartHandshake,
  Users,
  CheckCircle2,
  XCircle,
  Thermometer,
  Wind,
  Phone,
  Mail,
  Share2,
  TrendingUp,
  Info,
  Car,
  Utensils,
  Moon,
} from 'lucide-react';
import type { CustomLandingPageProps } from '../registry';
import { addDoc, collection, db } from '../../../lib/firebase';

export default function LadakhLandingPage({
  pkg,
  business,
  onNavigate,
  onOpenEnquiry,
}: CustomLandingPageProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    travelDate: '',
    travelers: 2,
    message: '',
  });

  const whatsappUrl = business.whatsappUrl(
    `Hello ${business.companyName}, I would like to enquire about the Ladakh 7-Day Overland Journey (Leh, Nubra & Pangong).`,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.phone || !formData.email || !formData.travelDate) {
      setFormError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'enquiries'), {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        message: formData.message || 'Enquiry for 7-Day Ladakh Overland Journey.',
        packageId: pkg?.id || 'ladakh-7d',
        packageName: 'Himalayan Serenade: Leh, Nubra Valley & Pangong Tso',
        destination: 'Ladakh',
        status: 'New',
        createdAt: new Date().toISOString(),
      });
      setSubmitSuccess(true);
    } catch {
      setFormError('Could not send enquiry right now. Please message us on WhatsApp directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const itinerary = [
    {
      day: 1,
      title: 'Arrival in Leh & Mandatory Acclimatization',
      route: 'Leh Kushok Bakula Airport (11,500 ft) → Hotel',
      altitude: '11,500 ft (3,500 m)',
      stay: 'Premium Hotel in Leh',
      meals: 'Dinner included',
      travelTime: '30 mins airport transfer',
      description:
        'Fly into Kushok Bakula Rimpochee Airport in Leh. The dramatic flight over snow-capped Himalayan ranges lands at 11,500 feet. You will be received by our team and transferred to your hotel. The first 24 hours are strictly reserved for resting and acclimatization to allow your body to adapt to the thin air. Drink plenty of water. In the late evening, take a gentle walk through Leh Main Bazaar.',
      highlights: [
        'Scenic trans-Himalayan flight approach into Leh',
        'Acclimatization briefing with trip leader and pulse oximeter check',
        'Evening walk in historic Leh market and Tibetan handicraft lanes',
      ],
    },
    {
      day: 2,
      title: 'Leh Local Heritage, Sangam & Magnetic Hill',
      route: 'Leh → Shey → Thiksey → Sangam Confluence → Leh',
      altitude: '11,500 ft (3,500 m)',
      stay: 'Premium Hotel in Leh',
      meals: 'Breakfast & Dinner included',
      travelTime: '3 to 4 hours driving across the day',
      description:
        'After breakfast, explore the cultural heart of Indus Valley. Visit the 15th-century Thiksey Monastery, perched dramatically on a hill resemblance of Lhasa’s Potala Palace, housing a 49-foot Maitreya Buddha. Later, drive along the Srinagar-Leh highway to witness the stunning confluence of the emerald Indus and muddy Zanskar rivers at Sangam, pass Magnetic Hill, and visit the Gurudwara Pathar Sahib.',
      highlights: [
        'Thiksey Monastery morning prayer hall and rooftop panoramic view',
        'Sangam point: Confluence of Indus and Zanskar rivers',
        'Magnetic Hill gravity illusion point and Hall of Fame memorial',
      ],
    },
    {
      day: 3,
      title: 'Leh to Nubra Valley via Khardung La (17,582 ft)',
      route: 'Leh → Khardung La Pass → Diskit → Hunder',
      altitude: '17,582 ft at pass, descend to 10,000 ft in Nubra',
      stay: 'Deluxe Camp / Resort in Hunder (Nubra)',
      meals: 'Breakfast & Dinner included',
      travelTime: '5 to 6 hours (125 km)',
      description:
        'Start early for the climb to Khardung La, one of the highest motorable mountain passes in the world at 17,582 ft. Stop briefly at the pass for photographs against prayer flags and snowfields before descending into the warm, lush Nubra Valley (Valley of Flowers). Visit the 106-foot tall seated statue of Jampa Buddha at Diskit Monastery and head to the white sand dunes of Hunder for sunset.',
      highlights: [
        'Crossing Khardung La pass at 17,582 ft with 360° Karakoram vistas',
        'Diskit Monastery with ancient frescoes and giant Buddha statue',
        'Sunset over Hunder sand dunes with double-humped Bactrian camels',
      ],
    },
    {
      day: 4,
      title: 'Nubra Valley to Pangong Tso via Shyok River',
      route: 'Hunder → Diskit → Shyok River Route → Pangong Tso (Spangmik)',
      altitude: '13,862 ft (4,225 m) at Pangong Tso',
      stay: 'Lakeside Deluxe Swiss Tents / Cottage at Spangmik',
      meals: 'Breakfast & Dinner included',
      travelTime: '5 to 6 hours (165 km)',
      description:
        'Drive along the wild, dramatic Shyok River route through narrow river gorges and wide gravel plains toward Pangong Tso. As you round the final mountain ridge, the sudden sight of deep sapphire and turquoise water stretching 134 km across the Indo-Tibetan border is breathtaking. Check into your lakeside camp and spend the evening watching the lake change colors under the setting sun.',
      highlights: [
        'Rugged overland drive along the untamed Shyok river bed',
        'First panoramic glimpse of the 134 km long Pangong Lake',
        'Stargazing under crystal-clear high-altitude night skies with zero light pollution',
      ],
    },
    {
      day: 5,
      title: 'Pangong Sunrise to Leh via Chang La Pass (17,688 ft)',
      route: 'Pangong Tso → Tangtse → Chang La Pass → Hemis → Leh',
      altitude: '17,688 ft at Chang La, returning to 11,500 ft in Leh',
      stay: 'Premium Hotel in Leh',
      meals: 'Breakfast & Dinner included',
      travelTime: '5 to 6 hours (160 km)',
      description:
        'Wake early to witness the golden sunrise reflecting over the tranquil waters of Pangong. After a hearty breakfast, begin the journey back to Leh across the high Chang La Pass (17,688 ft). On the descent toward Indus Valley, visit Hemis Monastery, the largest and wealthiest monastery in Ladakh, tucked inside a hidden mountain gorge. Arrive in Leh by late afternoon.',
      highlights: [
        'Unforgettable morning light and reflections over Pangong Tso',
        'Traversing Chang La Pass, guarded by Indian Army checkposts',
        'Exploring the secluded mountain gorge and museum at Hemis Gompa',
      ],
    },
    {
      day: 6,
      title: 'Sham Valley, Alchi Ancient Murals & Rest Day',
      route: 'Leh → Alchi (10,200 ft) → Basgo Fort → Leh',
      altitude: '10,200 ft to 11,500 ft',
      stay: 'Premium Hotel in Leh',
      meals: 'Breakfast & Dinner included',
      travelTime: '3 hours total driving',
      description:
        'A relaxed day driving down into lower Sham Valley to visit the 11th-century Alchi Monastery, famous for having some of the oldest preserved Indo-Tibetan wall frescoes in the world. Stop by the dramatic ruined mud-brick fortress of Basgo. Return to Leh for your farewell dinner and last-minute souvenir shopping for Pashmina shawls, Ladakhi apricots, and handmade prayer flags.',
      highlights: [
        'Alchi Monastery: 1,000-year-old wooden carvings and UNESCO-grade frescoes',
        'Basgo citadel ruins overlooking historic trade routes',
        'Farewell dinner with local Ladakhi butter tea and traditional cuisine',
      ],
    },
    {
      day: 7,
      title: 'Departure from Leh',
      route: 'Hotel → Kushok Bakula Airport (IXL)',
      altitude: '11,500 ft',
      stay: 'Departure',
      meals: 'Breakfast included',
      travelTime: '30 mins airport drop',
      description:
        'After breakfast, our driver will transfer you to Leh Airport for your morning flight back home. Board your flight with indelible memories of high passes, crystal lakes, and the warm smiles of Ladakh.',
      highlights: [
        'Smooth airport drop synchronized with flight departures',
        'Farewell from Pravaah on-ground team',
      ],
    },
  ];

  const elevationProfile = [
    { day: 'D1', label: 'Leh Arrival', alt: '11,500 ft', percent: '45%' },
    { day: 'D2', label: 'Sangam & Sham', alt: '11,500 ft', percent: '45%' },
    { day: 'D3', label: 'Khardung La', alt: '17,582 ft', percent: '100%', peak: true },
    { day: 'D4', label: 'Nubra Dunes', alt: '10,000 ft', percent: '35%' },
    { day: 'D5', label: 'Pangong Tso', alt: '13,862 ft', percent: '65%' },
    { day: 'D6', label: 'Chang La Pass', alt: '17,688 ft', percent: '98%', peak: true },
    { day: 'D7', label: 'Leh Departure', alt: '11,500 ft', percent: '45%' },
  ];

  const faqs = [
    {
      q: 'How does Pravaah manage high altitude and AMS (Acute Mountain Sickness)?',
      a: 'Altitude safety is our top priority. We structure our itinerary with 48 hours of low-exertion acclimatization in Leh before crossing any high passes. Every Pravaah vehicle carries a certified medical oxygen cylinder and first aid kit. Our trip coordinators carry pulse oximeters to check oxygen saturation levels twice daily. We also advise drinking 3-4 liters of water daily and avoiding alcohol during the initial days.',
    },
    {
      q: 'What vehicles are used for the overland journeys?',
      a: 'We use reliable, heavy-duty 4x4 SUVs (such as Toyota Innova Crysta, Mahindra Scorpio, or Force Traveller for small groups) driven by experienced local Ladakhi mountain drivers who know every turn, river crossing, and weather condition on these roads.',
    },
    {
      q: 'What permits are required for Indian and foreign nationals?',
      a: 'Inner Line Permits (ILP) are required for visiting protected areas like Nubra Valley, Khardung La, and Pangong Tso. All permit paperwork, wildlife fees, and red tape clearances are arranged by Pravaah prior to your arrival and are fully included in the package.',
    },
    {
      q: 'What kind of accommodation is provided at Pangong and Nubra?',
      a: 'In Leh, you stay in boutique 3-4 star hotels with heating, hot water, and private bathrooms. In Nubra Valley, you stay in deluxe cottages or semi-permanent luxury tents with attached washrooms. At Pangong Tso, we use high-grade Swiss lakeside dome tents or cottages with warm thermal bedding and dining halls.',
    },
    {
      q: 'Is there mobile network connectivity during the trip?',
      a: 'Only postpaid SIM cards work in Ladakh (Jio and Airtel have the best 4G coverage in Leh and Nubra Valley). At Pangong Lake, connectivity is minimal or absent, providing a genuine digital detox. Our drivers and camps maintain satellite/local emergency contact channels.',
    },
    {
      q: 'What is the best time of year to take this journey?',
      a: 'The prime season for Ladakh overland travel is from mid-May to early October. June to August offers clear sunny days with daytime temperatures around 18°C to 22°C. September brings crisp golden autumn colors with night temperatures dipping near freezing.',
    },
  ];

  return (
    <div className="pravaah-custom-landing min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* ------------------------------------------------------------- */}
      {/* Top Professional Navigation Bar */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors"
          >
            <Mountain className="h-5 w-5 text-cyan-400" />
            <span className="font-serif font-bold text-lg tracking-wide uppercase">
              Pravaah Travels
            </span>
          </button>
          <span className="hidden sm:inline-block text-xs text-slate-400 border-l border-slate-700 pl-3">
            Ladakh Overland Expedition
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp Us
          </a>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md"
          >
            Get Quote / Dates
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 1. SCENE 1: PHOTOGRAPHY-LED HERO (DARK ATMOSPHERIC) */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-end pb-16 px-4 sm:px-8 lg:px-16 overflow-hidden">
        {/* Full-bleed authentic destination photograph */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/ladakh/hero-ladakh-expedition.jpg"
            alt="Pangong Lake deep blue waters surrounded by high Himalayan mountains in Ladakh"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Subtle gradient overlay to ensure WCAG AAA text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-4xl pt-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-4 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            Ladakh, Jammu & Kashmir · 17,582 ft High Pass Journey
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.08] drop-shadow-md">
            Himalayan Serenade: <br className="hidden sm:inline" />
            <span className="text-cyan-300">Leh, Nubra & Pangong Tso</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-100 mt-4 max-w-2xl leading-relaxed font-normal">
            A comprehensive 7-day overland journey through Ladakh’s ancient monasteries, high-altitude desert dunes, and the celestial sapphire waters of Pangong Lake with dedicated acclimatization care.
          </p>

          {/* Quick Key Facts Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mt-8 p-4 rounded-xl bg-slate-950/85 border border-slate-800 backdrop-blur-md">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Duration</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">7 Days / 6 Nights</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Max Elevation</span>
              <p className="text-sm sm:text-base font-bold text-cyan-300 mt-0.5">17,582 ft (Khardung La)</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Starting Price</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">₹45,000 / person</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Best Season</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">May – October</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                document.getElementById('itinerary-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-md text-xs font-semibold uppercase tracking-wider bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-lg flex items-center gap-2"
            >
              View Day-by-Day Itinerary <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-600 transition-all flex items-center gap-2"
            >
              Request Custom Dates & Quote <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. SCENE 2: TRIP AT A GLANCE (WARM MINERAL LIGHT BACKGROUND) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-[#f8fafc] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block mb-1">
              Package Specification
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Trip Overview & Logistics
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Start & End</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Leh (IXL Airport)</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Trip Difficulty</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Moderate (Altitude)</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Group Size</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Small batches (8–12)</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Stay Type</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Hotels & Deluxe Camps</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Transport</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Private 4x4 SUV</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase block">Meal Plan</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Breakfast & Dinner Daily</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. SCENE 3: WHY THIS JOURNEY (LIGHT EDITORIAL SECTION) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#ffffff] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block">
            Why Travel to Ladakh with Pravaah
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-950 tracking-tight leading-snug">
            A route designed around acclimatization, authentic local stays, and unhurried exploration.
          </h2>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
            Many commercial tours rush travellers over Khardung La on Day 2, leading to severe mountain sickness and exhausted journeys. At Pravaah Travels, we plan every hour of this overland circuit to ensure you adapt naturally to the high altitude before heading into remote valleys.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <ShieldCheck className="h-6 w-6 text-cyan-700" />
              <h3 className="text-base font-bold text-slate-900">48-Hour Acclimatization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured resting days in Leh with pulse oximetry monitoring before high pass crossings.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <Users className="h-6 w-6 text-cyan-700" />
              <h3 className="text-base font-bold text-slate-900">Local Mountain Drivers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Experienced native Ladakhi drivers who know every mountain switchback and weather pattern.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <HeartHandshake className="h-6 w-6 text-cyan-700" />
              <h3 className="text-base font-bold text-slate-900">Ethical & Eco-Conscious</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We work directly with family-run homestays and enforce strict leave-no-trace practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. SCENE 4: AUTHENTIC PHOTOGRAPHY GALLERY (ATMOSPHERIC DARK BREAK) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
              Destination Photography
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">
              Landscapes Along the Route
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800">
              <img
                src="/images/ladakh/khardungla-pass.jpg"
                alt="Khardung La Pass 17,582 ft prayer flags and snowy peaks"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase text-cyan-300">17,582 ft</span>
                <p className="text-sm font-bold text-white">Khardung La Pass</p>
              </div>
            </div>

            <div className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800">
              <img
                src="/images/ladakh/nubra-dunes.jpg"
                alt="Nubra Valley Hunder white sand dunes and snow mountains"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase text-cyan-300">10,000 ft</span>
                <p className="text-sm font-bold text-white">Hunder Sand Dunes, Nubra</p>
              </div>
            </div>

            <div className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800">
              <img
                src="/images/ladakh/hemis-monastery.jpg"
                alt="Hemis Monastery cliffside Tibetan Buddhist Gompa"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase text-cyan-300">11,800 ft</span>
                <p className="text-sm font-bold text-white">Hemis & Thiksey Gompas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. SCENE 5: ELEVATION & ROUTE PROGRESSION STRIP */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 px-4 sm:px-8 lg:px-16 bg-[#f1f5f9] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block">
                Altitude Progression
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Route Elevation Profile (Feet Above Sea Level)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 hidden sm:inline">
              Max Peak: 17,582 ft
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center">
            {elevationProfile.map((pt, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-24 w-full bg-slate-200 rounded-lg flex items-end p-1.5 justify-center relative overflow-hidden">
                  <div
                    style={{ height: pt.percent }}
                    className={`w-full rounded-md transition-all ${
                      pt.peak ? 'bg-cyan-600' : 'bg-slate-400'
                    }`}
                  />
                  <span className="absolute top-1 text-[9px] font-mono font-bold text-slate-700">
                    {pt.day}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-900 mt-1.5 block truncate w-full">
                  {pt.alt}
                </span>
                <span className="text-[9px] text-slate-500 hidden sm:block truncate w-full">
                  {pt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. SCENE 6: COMPLETE DAY-BY-DAY ITINERARY (LIGHT READABLE DOSSIER) */}
      {/* ------------------------------------------------------------- */}
      <section id="itinerary-section" className="py-20 px-4 sm:px-8 lg:px-16 bg-[#ffffff] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block mb-1">
                Detailed Expedition Schedule
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900">
                Complete Day-by-Day Itinerary
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Click on any day to expand complete schedule
            </span>
          </div>

          <div className="space-y-3.5">
            {itinerary.map((day) => {
              const isOpen = activeDay === day.day;
              return (
                <div
                  key={day.day}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setActiveDay(isOpen ? 0 : day.day)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-cyan-900 text-cyan-100 font-mono font-bold text-sm shrink-0">
                        0{day.day}
                      </span>
                      <div>
                        <span className="text-[11px] font-mono text-slate-500 uppercase block font-medium">
                          {day.route}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                          {day.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="hidden md:inline-block text-xs font-mono text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-200">
                        {day.altitude}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-slate-700" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 pt-2 border-t border-slate-200 space-y-4 bg-white">
                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {day.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-500 uppercase font-mono text-[10px] block font-bold">Overnight Stay</span>
                          <p className="font-semibold text-slate-900 mt-0.5">{day.stay}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase font-mono text-[10px] block font-bold">Meals Provided</span>
                          <p className="font-semibold text-slate-900 mt-0.5">{day.meals}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase font-mono text-[10px] block font-bold">Travel Duration</span>
                          <p className="font-semibold text-slate-900 mt-0.5">{day.travelTime}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-slate-600 uppercase block mb-2 font-bold">
                          Day Highlights
                        </span>
                        <ul className="space-y-1.5">
                          {day.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                              <Check className="h-4 w-4 text-cyan-700 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. SCENE 7: INCLUSIONS & EXCLUSIONS (LIGHT COMPARISON) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#f8fafc] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block mb-1">
              Transparent Pricing Breakdown
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900">
              What’s Included & What’s Not
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inclusions */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">What’s Included</h3>
              </div>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>6 Nights Accommodation:</strong> 4 nights in premium Leh hotels, 1 night in deluxe Nubra valley camp, 1 night in lakeside Swiss camp at Pangong.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Meal Plan:</strong> Daily breakfast and freshly prepared dinners at all hotels and camps.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Dedicated Private Transport:</strong> Heavy-duty SUV (Innova / Scorpio / Traveller) for all airport transfers and overland sightseeing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>All Permits & Clearances:</strong> Inner Line Permits, environmental green fees, and wildlife sanctuary charges.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Safety & Medical:</strong> Medical oxygen cylinder in vehicle, pulse oximeter monitoring, and first aid support.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Experienced Trip Leader:</strong> Native Ladakhi tour coordinator throughout the circuit.</span>
                </li>
              </ul>
            </div>

            {/* Exclusions */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-rose-800">
                <XCircle className="h-5 w-5 text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">What’s Not Included</h3>
              </div>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Airfare:</strong> Flights to and from Leh (Kushok Bakula Airport).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Lunches & Snacks:</strong> Daily lunches at roadside cafes during travel (approx ₹250–₹400/meal).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Personal Activities:</strong> Double-humped camel rides at Hunder, river rafting in Zanskar, or monument camera tickets.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Travel & Medical Insurance:</strong> Highly recommended to purchase personal high-altitude travel insurance.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Contingency Expenses:</strong> Unforeseen road blocks, landslides, flight cancellations or medical evacuation costs.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. SCENE 8: IS THIS TRIP RIGHT FOR YOU? (SELF-ASSESSMENT BLOCK) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-[#ffffff] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block mb-1">
              Honest Expectation Setting
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Is This Journey Right For You?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-700" />
                You'll Love This Trip If:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li>• You want to experience high-altitude desert landscapes, ancient Buddhist gompas, and turquoise lakes.</li>
                <li>• You appreciate small-group dynamics (8–12 travellers) with local cultural interactions.</li>
                <li>• You value safety-first itinerary pacing with built-in acclimatization.</li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-700" />
                Consider Before Booking:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li>• You will be traveling at altitudes above 11,000 ft (and crossing passes at 17,582 ft).</li>
                <li>• Overland drives can take 5–6 hours over mountain roads and riverbeds.</li>
                <li>• Lake Pangong has sub-zero night temperatures and basic tented setups.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. SCENE 9: THINGS TO KNOW & PACKING CHECKLIST */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#f8fafc] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block mb-1">
              Essential Traveller Preparation
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900">
              Things to Know & Packing Checklist
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Practical Advice */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-cyan-700" />
                Important Altitude & Travel Advice
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <strong className="text-slate-900 block mb-1">Mandatory Day 1 & 2 Acclimatization:</strong>
                  Do not plan heavy physical excursions on arrival day. The sudden jump from sea level to 11,500 ft requires resting and drinking 3–4 liters of fluids.
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <strong className="text-slate-900 block mb-1">Postpaid SIM Cards Only:</strong>
                  Prepaid SIM cards from outside J&K / Ladakh do not work due to telecommunication regulations. Carry an active Airtel or Jio postpaid SIM card.
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <strong className="text-slate-900 block mb-1">Cash & ATMs:</strong>
                  ATMs are available in Leh town but can run out of cash. Carry adequate cash for personal shopping, lunches, and tips, as cards are rarely accepted in Nubra or Pangong.
                </div>
              </div>
            </div>

            {/* Packing List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wind className="h-5 w-5 text-cyan-700" />
                Recommended Packing List
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <strong className="text-cyan-900 block mb-1">Thermal Layers</strong>
                  <p>2 pairs of thermal inners (top & bottom), fleece jacket, and a windproof/waterproof down jacket (-5°C rating).</p>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <strong className="text-cyan-900 block mb-1">Footwear</strong>
                  <p>1 pair of sturdy walking shoes with good grip and 3–4 pairs of woollen socks.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <strong className="text-cyan-900 block mb-1">Sun Protection</strong>
                  <p>UV-400 sunglasses, broad-brim sun hat, high SPF 50+ sunscreen, and moisturizing lip balm.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <strong className="text-cyan-900 block mb-1">Electronics & Power</strong>
                  <p>10,000+ mAh power bank (batteries drain faster in cold weather) and extra camera memory cards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. SCENE 10: FAQS (LIGHT READABLE ACCORDION) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#ffffff] text-[#0f172a] border-b border-slate-200">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold block mb-1">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-100/80 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-cyan-700 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-200 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. SCENE 11: FINAL CALL TO ACTION / ENQUIRY (ATMOSPHERIC DARK) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block">
            Plan Your Journey With Us
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Ready to Experience the High Passes of Ladakh?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            Contact our dedicated destination curator to customize your travel dates, group size, and vehicle preferences.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/20"
            >
              Request Custom Quote / Dates
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-600 hover:bg-emerald-900 transition-all flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Chat Directly on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Booking / Custom Itinerary Modal */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block mb-1">
              Custom Travel Request
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-4">
              Plan Your Ladakh Journey
            </h3>

            {submitSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="inline-flex p-3 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Enquiry Received</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Thank you! A Pravaah Ladakh curator will call or WhatsApp you within 4 hours with detailed itinerary options and pricing.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmitSuccess(false);
                  }}
                  className="mt-2 px-5 py-2 rounded-md text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {formError && (
                  <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded border border-rose-800">
                    {formError}
                  </p>
                )}
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g. Siddharth Verma"
                    className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Travel Month / Date *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.travelDate}
                      onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                      placeholder="E.g. July 2026"
                      className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Travelers
                    </label>
                    <select
                      value={formData.travelers}
                      onChange={(e) => setFormData({ ...formData, travelers: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value={1}>1 Solo Explorer</option>
                      <option value={2}>2 Travelers (Couple/Friends)</option>
                      <option value={4}>4 Travelers (Private SUV)</option>
                      <option value={6}>6+ Travelers</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Special Notes / Preferences
                  </label>
                  <textarea
                    rows={2}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="E.g. Specific dates, elderly travellers needing extra rest"
                    className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-md text-xs font-semibold uppercase tracking-wider bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Sending Enquiry...' : 'Submit Travel Enquiry'} <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
