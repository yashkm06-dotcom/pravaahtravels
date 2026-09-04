import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Trees,
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
  Fish,
  Home,
  Coffee,
  Sun,
  TrendingUp,
} from 'lucide-react';
import type { CustomLandingPageProps } from '../registry';
import { addDoc, collection, db } from '../../../lib/firebase';

export default function HimachalLandingPage({
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
    `Hello ${business.companyName}, I would like to enquire about the Himachal Alpine Retreat (Tirthan Valley & Jibhi, 6 Days).`,
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
        message: formData.message || 'Enquiry for 6-Day Himachal Alpine Retreat.',
        packageId: pkg?.id || 'himachal-6d',
        packageName: 'Tirthan Valley & Jibhi Alpine Sanctuary',
        destination: 'Himachal Pradesh',
        status: 'New',
        createdAt: new Date().toISOString(),
      });
      setSubmitSuccess(true);
    } catch {
      setFormError('Could not send enquiry. Please contact us on WhatsApp directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const itinerary = [
    {
      day: 1,
      title: 'Arrival in Tirthan Valley & Riverside Welcome',
      route: 'Aut Tunnel / Naggar → Tirthan Valley (Gushaini)',
      altitude: '5,200 ft (1,585 m)',
      stay: 'Riverside Kath Kuni Wooden Chalet',
      meals: 'Dinner included',
      travelTime: '1.5 to 2 hours drive from Aut',
      description:
        'Arrive at Aut Tunnel or Naggar and meet our driver for a scenic drive along the rushing Tirthan River into the buffer zone of the Great Himalayan National Park. Check into your riverside handcrafted Kath Kuni cedar chalet in Gushaini. Spend the afternoon relaxing by the riverbank, listening to the crystal glacier meltwater, and sipping fresh rhododendron blossom tea.',
      highlights: [
        'Check-in to traditional wooden cedar chalet right beside the river',
        'Orientation walk through local orchards and pine groves',
        'Fireside welcome dinner featuring fresh local Himachali Siddu and walnut chutney',
      ],
    },
    {
      day: 2,
      title: 'Great Himalayan National Park Eco-Trail & Trout Waters',
      route: 'Gushaini → GHNP Gate / Rolla Trail → Gushaini',
      altitude: '5,200 ft to 6,800 ft',
      stay: 'Riverside Kath Kuni Wooden Chalet',
      meals: 'Breakfast & Dinner included',
      travelTime: 'Short 15 min drive to trailhead + 4-hour forest hike',
      description:
        'Embark on a guided morning nature walk into the UNESCO World Heritage Great Himalayan National Park buffer zone. Walk along shaded mossy trails flanked by century-old deodars and wild walnut trees. In the afternoon, try catch-and-release fly fishing for wild Himalayan brown trout under the supervision of our certified local angling guide.',
      highlights: [
        'Forest bathing under 100-foot ancient deodar cedar canopy',
        'Birdwatching: Monal pheasant and Western Tragopan habitats',
        'Guided brown trout angling session in pristine glacial pools',
      ],
    },
    {
      day: 3,
      title: 'Jibhi Pine Woods, Hidden Waterfalls & Traditional Villages',
      route: 'Tirthan → Jibhi (6,800 ft) → Mini Thailand → Jibhi',
      altitude: '6,800 ft (2,070 m)',
      stay: 'Handcrafted Cedar Cottage in Jibhi',
      meals: 'Breakfast & Dinner included',
      travelTime: '45 mins scenic drive',
      description:
        'Drive through winding mountain pine roads to the picturesque village of Jibhi. Explore the multi-tiered Jibhi waterfalls connected by rustic wooden bridges, and visit the serene "Mini Thailand" river canyon where crystal waters flow between giant moss-covered granite boulders. Spend a quiet evening visiting local mountain cafes and artisanal bakeries.',
      highlights: [
        'Walk through hidden pine forest trails and wooden footbridges',
        'Photography at the natural rock canyon of Mini Thailand',
        'Leisurely mountain cafe culture and local woodcraft studios',
      ],
    },
    {
      day: 4,
      title: 'Jalori Pass (10,800 ft) & Sacred Serolsar Lake Trek',
      route: 'Jibhi → Jalori Pass → Serolsar Lake (5 km hike) → Jibhi',
      altitude: '10,800 ft (3,290 m) at Jalori Pass',
      stay: 'Handcrafted Cedar Cottage in Jibhi',
      meals: 'Breakfast & Dinner included',
      travelTime: '30 mins drive to pass + 4 hours round-trip hike',
      description:
        'Ascend to Jalori Pass at 10,800 feet, offering 360-degree panoramic vistas of the snow-clad Pir Panjal and Great Himalayan ranges. From the pass, begin a gentle 5 km forest hike through dense oak and blooming rhododendron trees toward Serolsar Lake—a sacred emerald water body revered as the seat of local deity Buddhi Nagin. The water remains impeccably clean, guarded by sacred birds.',
      highlights: [
        '360-degree high-ridge Himalayan panoramic viewpoint at Jalori Pass',
        'Scenic nature trail through ancient moss-draped oak forests',
        'Visiting the crystal sacred waters and temple of Serolsar Lake',
      ],
    },
    {
      day: 5,
      title: 'Ancient Timber Architecture: Sharchi & Chehni Kothi',
      route: 'Jibhi → Sharchi Village → Chehni Kothi Tower → Tirthan',
      altitude: '7,500 ft',
      stay: 'Riverside Kath Kuni Wooden Chalet',
      meals: 'Breakfast & Dinner included',
      travelTime: '3 hours total driving',
      description:
        'Explore the architectural marvels of the valley. Visit the 1,500-year-old Chehni Kothi, an imposing 45-meter high multi-tiered stone-and-timber castle tower that has survived centuries of Himalayan earthquakes. Later, head up to the untouched mountain hamlet of Sharchi, surrounded by tiered apple orchards and traditional wooden cattle houses.',
      highlights: [
        'Chehni Kothi: The tallest indigenous timber-and-stone structure in the Western Himalayas',
        'Walking through Sharchi village to meet local Himachali weavers and farmers',
        'Farewell mountain dinner around a riverside bonfire',
      ],
    },
    {
      day: 6,
      title: 'Farewell Mountain Breakfast & Departure',
      route: 'Tirthan Valley → Aut Tunnel / Chandigarh',
      altitude: '5,200 ft',
      stay: 'Departure',
      meals: 'Breakfast included',
      travelTime: 'Drop to Aut (1.5 hrs) / Chandigarh (6–7 hrs)',
      description:
        'Enjoy a final relaxed breakfast on the riverside terrace with freshly baked breads, organic orchard honey, and mountain coffee. Transfer to Aut Tunnel for onward bus connections or Chandigarh airport/station with refreshed spirits and timeless mountain memories.',
      highlights: [
        'Relaxed morning riverside walk and local organic breakfast',
        'Smooth private transfer to onward departure points',
      ],
    },
  ];

  const elevationProfile = [
    { day: 'D1', label: 'Tirthan River', alt: '5,200 ft', percent: '48%' },
    { day: 'D2', label: 'GHNP Forest', alt: '6,200 ft', percent: '57%' },
    { day: 'D3', label: 'Jibhi Woods', alt: '6,800 ft', percent: '62%' },
    { day: 'D4', label: 'Jalori Pass', alt: '10,800 ft', percent: '100%', peak: true },
    { day: 'D5', label: 'Sharchi Hamlet', alt: '7,500 ft', percent: '69%' },
    { day: 'D6', label: 'Aut Departure', alt: '5,200 ft', percent: '48%' },
  ];

  const faqs = [
    {
      q: 'How is this trip different from crowded commercial Manali or Shimla tours?',
      a: 'Tirthan Valley and Jibhi are peaceful, eco-sensitive valleys preserved within the buffer zone of the Great Himalayan National Park. Unlike commercial tourist towns, you will not find crowded malls or noisy traffic. You experience authentic silence, clean rivers, handcrafted wooden chalets, and unhurried nature walks.',
    },
    {
      q: 'How difficult is the Jalori Pass & Serolsar Lake hike?',
      a: 'The hike from Jalori Pass to Serolsar Lake is 5 km each way with a gentle, gradual gradient through shaded oak and rhododendron forest. It is suitable for beginners, families, and regular walkers. Good walking shoes with grip are recommended.',
    },
    {
      q: 'What kind of food is served during the retreat?',
      a: 'We emphasize farm-to-table, freshly cooked local cuisine. You will enjoy authentic Himachali delicacies like Siddu with ghee, Madra, Babru, fresh local trout, organic orchard jams, and homemade mountain dishes, along with standard North Indian and continental breakfast options.',
    },
    {
      q: 'How do we reach Tirthan Valley?',
      a: 'The nearest airport is Bhuntar (Kullu) 50 km away. Alternatively, most travellers take an overnight luxury Volvo bus from Delhi/Chandigarh to Aut Tunnel, where our private vehicle meets and transfers you directly to the chalet in 1.5 hours.',
    },
    {
      q: 'Is there mobile network and WiFi in the chalets?',
      a: 'Yes, Airtel and Jio 4G work reliably across Tirthan Valley and Jibhi. Our chalets also provide high-speed optical fiber WiFi, making it ideal for creative work or peaceful stays.',
    },
  ];

  return (
    <div className="pravaah-custom-landing min-h-screen bg-[#07130e] text-[#f2fbf7] font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* ------------------------------------------------------------- */}
      {/* Top Navigation Bar */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#050f0b]/95 backdrop-blur-md border-b border-emerald-900/40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors"
          >
            <Trees className="h-5 w-5 text-emerald-400" />
            <span className="font-serif font-bold text-lg tracking-wide uppercase">
              Pravaah Travels
            </span>
          </button>
          <span className="hidden sm:inline-block text-xs text-emerald-300/60 border-l border-emerald-800/60 pl-3">
            Himachal Alpine Sanctuary
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
            className="px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md"
          >
            Get Quote / Dates
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 1. SCENE 1: PHOTOGRAPHY-LED HERO (DARK FOREST ATMOSPHERE) */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-end pb-16 px-4 sm:px-8 lg:px-16 overflow-hidden">
        {/* Full-bleed authentic destination photograph */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/himachal/hero-himachal-alpine.jpg"
            alt="Towering pine and cedar forests in Tirthan Valley Himachal Pradesh"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07130e] via-[#07130e]/70 to-[#07130e]/30" />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-4xl pt-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#05110c]/90 border border-emerald-800 text-emerald-300 text-xs font-mono uppercase tracking-wider mb-4 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            Tirthan Valley & Jibhi · Great Himalayan National Park Buffer
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.08] drop-shadow-md">
            Himachal Alpine Sanctuary: <br className="hidden sm:inline" />
            <span className="text-emerald-300">Tirthan Valley, Jibhi & Jalori Pass</span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-100 mt-4 max-w-2xl leading-relaxed">
            A quiet 6-day mountain retreat into fragrant deodar forests, handcrafted riverside cedar chalets, trout streams, and sacred ridge trails at 10,800 feet.
          </p>

          {/* Quick Key Facts Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mt-8 p-4 rounded-xl bg-[#05110c]/85 border border-emerald-900/50 backdrop-blur-md">
            <div>
              <span className="text-[11px] font-mono text-emerald-400/80 uppercase block">Duration</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">6 Days / 5 Nights</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400/80 uppercase block">High Point</span>
              <p className="text-sm sm:text-base font-bold text-emerald-300 mt-0.5">10,800 ft (Jalori Pass)</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400/80 uppercase block">Starting Price</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">₹24,500 / person</p>
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400/80 uppercase block">Ideal Season</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">March – November</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                document.getElementById('itinerary-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-md text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-lg flex items-center gap-2"
            >
              View Day-by-Day Itinerary <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-md text-xs font-semibold uppercase tracking-wider bg-[#0a1e16] text-white hover:bg-emerald-950 border border-emerald-700 transition-all flex items-center gap-2"
            >
              Request Chalet Options & Quote <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. SCENE 2: TRIP AT A GLANCE (WARM CREAM LIGHT SECTION) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-[#faf8f5] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block mb-1">
              Retreat Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Trip Details & Sanctuary Logistics
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Base Hub</span>
              <p className="text-sm font-bold text-stone-900 mt-1">Aut / Naggar</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Trip Style</span>
              <p className="text-sm font-bold text-stone-900 mt-1">Slow Nature Retreat</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Group Size</span>
              <p className="text-sm font-bold text-stone-900 mt-1">Couples / Families (2–8)</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Stay Style</span>
              <p className="text-sm font-bold text-stone-900 mt-1">Riverside Chalets</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Transport</span>
              <p className="text-sm font-bold text-stone-900 mt-1">Private SUV</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-[11px] font-mono text-stone-500 uppercase block">Food Experience</span>
              <p className="text-sm font-bold text-stone-900 mt-1">Farm-to-Table</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. SCENE 3: WHY CHOOSE THIS RETREAT? (LIGHT EDITORIAL) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#ffffff] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block">
            Why Choose Tirthan Valley with Pravaah
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-snug">
            An authentic, slow-paced Himalayan escape away from mass tourism and commercial resorts.
          </h2>
          <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
            Nestled inside the serene Kullu district beside the crystal-clear Tirthan River, this retreat combines the peaceful comfort of traditional Kath Kuni wooden chalets with gentle nature trails, brown trout fly fishing, and ancient pine forest walks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
              <Home className="h-6 w-6 text-emerald-700" />
              <h3 className="text-base font-bold text-stone-900">Handcrafted Chalets</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Traditional cedar wood and stone architecture with private riverside balconies and fireplaces.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
              <Trees className="h-6 w-6 text-emerald-700" />
              <h3 className="text-base font-bold text-stone-900">GHNP Wilderness</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct access to UNESCO World Heritage eco-trails, ancient deodars, and wild trout waters.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
              <Coffee className="h-6 w-6 text-emerald-700" />
              <h3 className="text-base font-bold text-stone-900">Unhurried Pacing</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                No rushed bus tours. Enjoy lazy riverside mornings, orchard walks, and local culinary feasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. SCENE 4: DESTINATION PHOTOGRAPHY (DARK SCENIC PAUSE) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#050f0b] text-white border-b border-emerald-950">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
              Alpine Photography
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">
              Vistas of Tirthan, Jibhi & Serolsar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-[#07130e] border border-emerald-900/40">
              <img
                src="/images/himachal/tirthan-river.jpg"
                alt="Tirthan river crystal trout waters in Himachal Pradesh"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050f0b]/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase text-emerald-300">5,200 ft</span>
                <p className="text-sm font-bold text-white">The Living Tirthan River</p>
              </div>
            </div>

            <div className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-[#07130e] border border-emerald-900/40">
              <img
                src="/images/himachal/cedar-chalet.jpg"
                alt="Handcrafted Kath Kuni wooden cedar chalet in Jibhi"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050f0b]/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase text-emerald-300">6,800 ft</span>
                <p className="text-sm font-bold text-white">Kath Kuni Riverside Chalets</p>
              </div>
            </div>

            <div className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-[#07130e] border border-emerald-900/40">
              <img
                src="/images/himachal/jalori-ridge.jpg"
                alt="Jalori Pass 10,800 ft panoramic ridge and sacred trail"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050f0b]/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase text-emerald-300">10,800 ft</span>
                <p className="text-sm font-bold text-white">Jalori Pass & Sacred Lake Trail</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. SCENE 5: ELEVATION & ROUTE PROGRESSION */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 px-4 sm:px-8 lg:px-16 bg-[#f5f1eb] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block">
                Valley Altitude Progression
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                Valley & Ridge Elevation Profile (Feet Above Sea Level)
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500 hidden sm:inline">
              Max Peak: 10,800 ft (Jalori Pass)
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-4 text-center">
            {elevationProfile.map((pt, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-24 w-full bg-stone-200 rounded-lg flex items-end p-1.5 justify-center relative overflow-hidden">
                  <div
                    style={{ height: pt.percent }}
                    className={`w-full rounded-md transition-all ${
                      pt.peak ? 'bg-emerald-700' : 'bg-stone-400'
                    }`}
                  />
                  <span className="absolute top-1 text-[9px] font-mono font-bold text-stone-700">
                    {pt.day}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-stone-900 mt-1.5 block truncate w-full">
                  {pt.alt}
                </span>
                <span className="text-[9px] text-stone-500 hidden sm:block truncate w-full">
                  {pt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. SCENE 6: COMPLETE DAY-BY-DAY ITINERARY (WARM LIGHT DOSSIER) */}
      {/* ------------------------------------------------------------- */}
      <section id="itinerary-section" className="py-20 px-4 sm:px-8 lg:px-16 bg-[#faf8f5] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block mb-1">
                Day-by-Day Schedule
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900">
                6-Day Alpine Itinerary
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-500">
              Click on any day to expand complete schedule
            </span>
          </div>

          <div className="space-y-3.5">
            {itinerary.map((day) => {
              const isOpen = activeDay === day.day;
              return (
                <div
                  key={day.day}
                  className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveDay(isOpen ? 0 : day.day)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-900 text-emerald-100 font-mono font-bold text-sm shrink-0">
                        0{day.day}
                      </span>
                      <div>
                        <span className="text-[11px] font-mono text-stone-500 uppercase block font-medium">
                          {day.route}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">
                          {day.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="hidden md:inline-block text-xs font-mono text-stone-700 bg-stone-100 px-3 py-1 rounded-md border border-stone-200">
                        {day.altitude}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-stone-700" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 pt-2 border-t border-stone-100 space-y-4 bg-stone-50/50">
                      <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                        {day.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-white border border-stone-200 text-xs">
                        <div>
                          <span className="text-stone-500 uppercase font-mono text-[10px] block font-bold">Overnight Stay</span>
                          <p className="font-semibold text-stone-900 mt-0.5">{day.stay}</p>
                        </div>
                        <div>
                          <span className="text-stone-500 uppercase font-mono text-[10px] block font-bold">Meals Provided</span>
                          <p className="font-semibold text-stone-900 mt-0.5">{day.meals}</p>
                        </div>
                        <div>
                          <span className="text-stone-500 uppercase font-mono text-[10px] block font-bold">Travel Duration</span>
                          <p className="font-semibold text-stone-900 mt-0.5">{day.travelTime}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-stone-600 uppercase block mb-2 font-bold">
                          Day Highlights
                        </span>
                        <ul className="space-y-1.5">
                          {day.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-stone-700 flex items-start gap-2">
                              <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
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
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#ffffff] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block mb-1">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900">
              What’s Included & What’s Not
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inclusions */}
            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">What’s Included</h3>
              </div>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-stone-700">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>5 Nights Handcrafted Accommodation:</strong> 3 nights in riverside Kath Kuni chalet in Tirthan + 2 nights in wooden pine cottage in Jibhi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Farm-to-Table Meals:</strong> Daily wholesome breakfast and freshly prepared Himachali dinners.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Dedicated Private Transport:</strong> Private vehicle for all transfers from Aut/Naggar and sightseeing across Jibhi and Jalori.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Guided Wilderness Walks:</strong> Certified local nature guide for GHNP eco-trail and Serolsar Lake trek.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Permissions & Entry:</strong> Great Himalayan National Park eco-zone visitor clearances.</span>
                </li>
              </ul>
            </div>

            {/* Exclusions */}
            <div className="p-6 sm:p-8 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-rose-900">
                <XCircle className="h-5 w-5 text-rose-700" />
                <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wider">What’s Not Included</h3>
              </div>
              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-stone-700">
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Long-distance Travel:</strong> Flight / Volvo bus fares to and from Aut / Chandigarh / Delhi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Lunches & Cafe Bills:</strong> Lunches at local mountain bakeries and cafes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Angling Permits:</strong> Daily trout fishing permit issued by Himachal Fisheries Dept (approx ₹100/day) and rod rentals.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Personal Expenses:</strong> Room heaters (if extra requested), laundry, and tips.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. SCENE 8: IS THIS TRIP RIGHT FOR YOU? */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-[#faf8f5] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block mb-1">
              Honest Expectation Setting
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Is This Retreat Right For You?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-6 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-700" />
                You'll Love This Retreat If:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                <li>• You want a peaceful, unhurried mountain break surrounded by rivers and cedar woods.</li>
                <li>• You enjoy gentle nature walking, birdwatching, and authentic Himachali culinary feasts.</li>
                <li>• You are traveling as a couple, family, or solo traveler seeking quiet sanctuary.</li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-700" />
                Consider Before Booking:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                <li>• This is not a bustling city tour with night markets or shopping malls.</li>
                <li>• The Jalori Pass hike to Serolsar Lake is 5 km each way (gentle forest walking).</li>
                <li>• Mountain roads in the valley have natural curves and narrow timber sections.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. SCENE 9: PREPARATION & PACKING CHECKLIST */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#ffffff] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block mb-1">
              Retreat Preparation
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900">
              Things to Know & Packing Checklist
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Advice */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-emerald-700" />
                Useful Valley Information
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-stone-700">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 shadow-sm">
                  <strong className="text-stone-900 block mb-1">Weather & Temperature:</strong>
                  Spring and summer (April to June) have warm pleasant days (20°C–25°C) and cool evenings. Autumn (September to November) offers crisp mountain air with evenings dropping to 8°C–12°C.
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 shadow-sm">
                  <strong className="text-stone-900 block mb-1">Network Connectivity:</strong>
                  Both Airtel and Jio 4G provide good reception. All our partner chalets feature high-speed optical fiber WiFi.
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 shadow-sm">
                  <strong className="text-stone-900 block mb-1">ATMs & Card Acceptance:</strong>
                  The nearest reliable ATMs are in Banjar town (8 km from Tirthan). Keep moderate cash handy for village shops and cafes.
                </div>
              </div>
            </div>

            {/* Packing */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Wind className="h-5 w-5 text-emerald-700" />
                Recommended Packing List
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
                <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 shadow-sm">
                  <strong className="text-emerald-900 block mb-1">Comfortable Layers</strong>
                  <p>Light woollen sweater, windcheater jacket, comfortable cotton shirts, and comfortable walking trousers.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 shadow-sm">
                  <strong className="text-emerald-900 block mb-1">Footwear</strong>
                  <p>1 pair of broken-in hiking/walking shoes with good rubber traction for forest trails and Serolsar lake walk.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 shadow-sm">
                  <strong className="text-emerald-900 block mb-1">Sun & River Essentials</strong>
                  <p>Polarized sunglasses (useful for river clarity), sun hat, refillable water bottle, and light raincoat.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 shadow-sm">
                  <strong className="text-emerald-900 block mb-1">Personal Care</strong>
                  <p>Insect repellent, personal medications, motion sickness pills for mountain roads, and moisturizer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. SCENE 10: FAQS (LIGHT READABLE ACCORDION) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#faf8f5] text-[#1c1917] border-b border-stone-200">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold block mb-1">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900">
              Common Questions About the Retreat
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-stone-900">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-emerald-700 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-700 leading-relaxed border-t border-stone-100 bg-stone-50/50">
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
      {/* 11. SCENE 11: FINAL CTA (ATMOSPHERIC DARK FOREST) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-[#07130e] to-[#040a07] text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">
            Escape to the Valley
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Ready to Unwind in Tirthan & Jibhi?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed max-w-xl mx-auto">
            Speak directly with our mountain retreat coordinator to customize your travel dates, chalet selections, and special preferences.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20"
            >
              Request Custom Chalet Quote
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
      {/* Booking Modal */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#071710] border border-emerald-700/60 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-md bg-[#0a2318] text-emerald-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-1">
              Custom Retreat Enquiry
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-4">
              Plan Your Himachal Escape
            </h3>

            {submitSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="inline-flex p-3 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Retreat Enquiry Received</h4>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Thank you! Our Himachal retreat specialist will call or WhatsApp you within 4 hours with bespoke chalet options and custom dates.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmitSuccess(false);
                  }}
                  className="mt-2 px-5 py-2 rounded-md text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
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
                  <label className="block text-[11px] font-mono text-emerald-200 uppercase mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g. Ananya Roy"
                    className="w-full px-3.5 py-2 rounded-md bg-[#050f0b] border border-emerald-900/80 text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-emerald-200 uppercase mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-md bg-[#050f0b] border border-emerald-900/80 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-emerald-200 uppercase mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full px-3.5 py-2 rounded-md bg-[#050f0b] border border-emerald-900/80 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-emerald-200 uppercase mb-1">
                      Travel Month / Date *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.travelDate}
                      onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                      placeholder="E.g. October 2026"
                      className="w-full px-3.5 py-2 rounded-md bg-[#050f0b] border border-emerald-900/80 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-emerald-200 uppercase mb-1">
                      Travelers
                    </label>
                    <select
                      value={formData.travelers}
                      onChange={(e) => setFormData({ ...formData, travelers: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-md bg-[#050f0b] border border-emerald-900/80 text-sm text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      <option value={1}>1 Solo Explorer</option>
                      <option value={2}>2 Travelers (Couple)</option>
                      <option value={4}>4 Travelers (Family Chalet)</option>
                      <option value={6}>6+ Travelers</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-emerald-200 uppercase mb-1">
                    Special Preferences / Chalet Style
                  </label>
                  <textarea
                    rows={2}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="E.g. Riverside balcony, angling guide, private bonfire"
                    className="w-full px-3.5 py-2 rounded-md bg-[#050f0b] border border-emerald-900/80 text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-md text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Sending Request...' : 'Submit Retreat Request'} <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
