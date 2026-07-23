import React, { useState } from 'react';
import { 
  Sparkles, Compass, Users, Star, 
  ArrowRight, ArrowLeft, Send, Check, AlertCircle, RefreshCw,
  GripVertical, ArrowUp, ArrowDown, ChevronUp, ChevronDown, CheckCircle
} from 'lucide-react';
import { db, collection, addDoc } from '../lib/firebase';
import InteractiveRouteMap from './InteractiveRouteMap';

interface AiCuratorViewProps {
  onNavigateToHome: () => void;
  onNavigate: (view: string, packageId?: string | null) => void;
}

export default function AiCuratorView({ onNavigateToHome }: AiCuratorViewProps) {
  // Wizard flow states
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [companions, setCompanions] = useState('Couple / Honeymoon Comfort');
  const [vibe, setVibe] = useState('Spiritual & Sacred (Quiet Darshan, Temples, Ganga Aarti)');
  const [duration, setDuration] = useState('5');
  const [budget, setBudget] = useState('45000');
  const [specialRequests, setSpecialRequests] = useState('');

  // AI loading and output states
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [isReordering, setIsReordering] = useState(false);

  // Direct booking enquiry states
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryTravelDate, setEnquiryTravelDate] = useState('');
  const [isEnquirySubmitting, setIsEnquirySubmitting] = useState(false);
  const [isEnquirySuccess, setIsEnquirySuccess] = useState(false);

  // Popular pre-filled options
  const popularDestinations = [
    'Kedarnath & Sacred Badrinath (Do Dham)',
    'Rishikesh Rafting & Yoga Valley',
    'Manali & Solang Winter Retreat',
    'Leh Ladakh Wilderness High Passes',
    'Auli Skiing & Scenic Peaks',
    'Spiti Valley Adventure Tour'
  ];

  const travelVibes = [
    { title: 'Spiritual & Sacred (Quiet Darshan, Temples, Ganga Aarti)', desc: 'Peaceful, temple focus, senior-friendly paced walks.' },
    { title: 'High Adventure & Trekking (Rafting, Camping, Peak Climbs)', desc: 'Thrill-packed routes, dynamic climbing, alpine camps.' },
    { title: 'Relaxing & Scenic (Boutique Valley Stays, Forest Trails)', desc: 'Scenic vistas, slow-paced drives, premium cottages.' },
    { title: 'Luxury Wellness & Yoga (Spa, Himalayan Healing, Private Helis)', desc: 'High-end wellness retreats, personalized yoga, heli luxury.' }
  ];

  const companionTypes = [
    'Solo Seeking Explorer',
    'Couple / Honeymoon Comfort',
    'Family with Elders & Kids',
    'Active Group of Friends'
  ];

  // Call the secure Gemini endpoint on the server
  const handleGenerate = async () => {
    if (!destination.trim()) {
      setErrorMsg('Please specify a destination or choose one of our signature options.');
      return;
    }
    
    setIsGenerating(true);
    setErrorMsg('');
    setAiResult(null);

    const requestPayload = {
      destination,
      duration,
      budget,
      vibe,
      specialRequests
    };
    
    console.log('[AI CURATOR REQUEST] Dispatching itinerary curation request to backend API', {
      payload: requestPayload,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch('/api/generate-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log(`[AI CURATOR RESPONSE] Received response status code: ${response.status} (${response.statusText})`);

      if (!response.ok) {
        let msg = 'Server returned an error generating your custom itinerary.';
        let details = null;
        try {
          const errData = await response.json();
          details = errData;
          if (errData?.details) {
            msg = `Itinerary curation failed: ${errData.details}`;
          } else if (errData?.error) {
            msg = `Itinerary curation failed: ${errData.error}`;
          }
        } catch (jsonErr) {
          console.warn('[AI CURATOR ERROR PARSE] Failed to parse JSON error body from response', jsonErr);
        }
        
        const curationError = new Error(msg);
        console.error('[AI CURATOR FAILURE] Non-OK API Response received from backend', {
          status: response.status,
          statusText: response.statusText,
          errorBody: details,
          message: msg
        });
        throw curationError;
      }

      const data = await response.json();
      console.log('[AI CURATOR SUCCESS] Itinerary generated successfully!', {
        title: data.title,
        duration: data.duration,
        daysCount: data.itinerary?.length,
        inclusionsCount: data.inclusions?.length,
        exclusionsCount: data.exclusions?.length
      });

      setAiResult(data);
      if (data.itinerary && data.itinerary.length > 0) {
        setActiveDay(data.itinerary[0].day);
      }
      setStep(5); // Go to results screen
    } catch (err: any) {
      console.error('[AI CURATOR EXCEPTION] An error occurred in handleGenerate processing pipeline:', {
        errorMessage: err.message || err,
        errorStack: err.stack,
        requestPayload
      });
      setErrorMsg(err.message || 'We faced an issue contacting Gemini API. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reordering itinerary days (Exactly matching HomeView draggable functionality)
  const moveDay = (index: number, direction: 'up' | 'down') => {
    if (!aiResult || !aiResult.itinerary) return;
    const newItinerary = [...aiResult.itinerary];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItinerary.length) return;

    // Swap days
    const temp = newItinerary[index];
    newItinerary[index] = newItinerary[targetIndex];
    newItinerary[targetIndex] = temp;

    // Recalculate day numbers sequentially
    const updatedItinerary = newItinerary.map((dayItem, idx) => ({
      ...dayItem,
      day: idx + 1
    }));

    setAiResult({
      ...aiResult,
      itinerary: updatedItinerary
    });
    setActiveDay(updatedItinerary[0].day);
  };

  // Submit enquiry directly to Firestore db
  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryPhone || !enquiryEmail || !enquiryTravelDate) {
      alert('Please fill out all contact fields.');
      return;
    }

    setIsEnquirySubmitting(true);
    try {
      const payload = {
        name: enquiryName,
        phone: enquiryPhone,
        email: enquiryEmail,
        destination: destination,
        travelDate: enquiryTravelDate,
        travelers: String(companions ?? '').includes('Couple') ? 2 : String(companions ?? '').includes('Solo') ? 1 : 4,
        budget: `₹${Number(budget).toLocaleString('en-IN')}`,
        message: `🤖 STANDALONE AI CURATOR PACKAGE: "${aiResult.title}"\n` + 
                 `Duration: ${aiResult.duration}\n` +
                 `Selected Vibe: ${vibe}\n` +
                 `Companions: ${companions}\n` +
                 `Reordered Itinerary Sequence:\n` + 
                 aiResult.itinerary.map((d: any) => `Day ${d.day}: ${d.title}`).join('\n') +
                 `\nSpecial Wishes/Food Notes: ${specialRequests || 'None'}`,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'enquiries'), payload);
      setIsEnquirySuccess(true);
    } catch (err) {
      console.error('Error writing enquiry to database:', err);
      alert('Failed to register enquiry. Please verify network connectivity.');
    } finally {
      setIsEnquirySubmitting(false);
    }
  };

  // Manual fallback enquiry states and handlers
  const [isManualEnquirySuccess, setIsManualEnquirySuccess] = useState(false);
  const [isManualEnquirySubmitting, setIsManualEnquirySubmitting] = useState(false);

  const handleManualFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryPhone || !enquiryEmail || !enquiryTravelDate) {
      alert('Please fill out all contact fields.');
      return;
    }

    setIsManualEnquirySubmitting(true);
    try {
      const payload = {
        name: enquiryName,
        phone: enquiryPhone,
        email: enquiryEmail,
        destination: destination,
        travelDate: enquiryTravelDate,
        travelers: String(companions ?? '').includes('Couple') ? 2 : String(companions ?? '').includes('Solo') ? 1 : 4,
        budget: `₹${Number(budget).toLocaleString('en-IN')}`,
        message: `🏔️ MANUAL CURATION FALLBACK REQUEST\n` + 
                 `Destination Spot: ${destination}\n` +
                 `Duration: ${duration} Days\n` +
                 `Selected Vibe/Mood: ${vibe}\n` +
                 `Companions: ${companions}\n` +
                 `Special Wishes/Food Notes: ${specialRequests || 'None'}\n` +
                 `Note: Automated AI curator fallback triggered because the AI models were experiencing peak demand levels.`,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'enquiries'), payload);
      setIsManualEnquirySuccess(true);
    } catch (err) {
      console.error('Error writing manual fallback enquiry to database:', err);
      alert('Failed to register fallback enquiry. Please verify network connectivity.');
    } finally {
      setIsManualEnquirySubmitting(false);
    }
  };

  const getWhatsAppFallbackUrl = () => {
    const text = `Hello Pravaah Travels! I am interested in custom-designing a trip to ${destination || 'the Himalayas'}.\n\n` +
                 `• Duration: ${duration} Days\n` +
                 `• Vibe/Mood: ${vibe}\n` +
                 `• Companions: ${companions}\n` +
                 `• Target Budget: INR ${Number(budget).toLocaleString('en-IN')}\n` +
                 `• Special requests: ${specialRequests || 'None'}\n\n` +
                 `Could you please help me plan this itinerary manually? Thank you!`;
    return `https://wa.me/919999999999?text=${encodeURIComponent(text)}`;
  };

  const startOver = () => {
    setStep(1);
    setAiResult(null);
    setIsEnquirySuccess(false);
    setIsManualEnquirySuccess(false);
    setEnquiryName('');
    setEnquiryPhone('');
    setEnquiryEmail('');
    setEnquiryTravelDate('');
    setErrorMsg('');
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen py-10" id="ai-curator-view-root">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb back navigation */}
        <div className="mb-8 flex items-center justify-between" id="ai-curator-nav">
          <button 
            onClick={onNavigateToHome}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-[#008080] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <span className="text-[10px] bg-[#008080]/15 text-[#008080] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Pravaah AI Platform</span>
          </span>
        </div>

        {/* Hero Section Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden mb-10" id="curator-hero">
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#008080] rounded-full blur-3xl opacity-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-[#F4C430] text-[10px] font-bold uppercase tracking-[0.3em] block">Co-Design with AI</span>
            <h1 className="text-3xl sm:text-5xl font-serif font-light leading-tight">
              Bespoke Himalayan <br />
              <span className="italic text-[#008080] font-normal font-serif">Curator Engine</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
              Weave your specific travel goals, comfort preferences, budget constraints, and pacing vibes directly into Google's latest Gemini models. Receive a fully interactive, custom daily route instantly.
            </p>
          </div>
        </div>

        {/* Outer Form Wizard Content */}
        {step <= 4 && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm max-w-4xl mx-auto" id="quiz-wizard-card">
            
            {/* Step Indicators */}
            <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex justify-between items-center text-[10px] sm:text-xs text-stone-400 font-bold uppercase tracking-wider">
              <div className="flex gap-2 items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${step === 1 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>1</span>
                <span className={step === 1 ? 'text-stone-800' : ''}>Focus Spot</span>
              </div>
              <div className="w-6 sm:w-12 h-px bg-stone-300"></div>
              <div className="flex gap-2 items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${step === 2 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>2</span>
                <span className={step === 2 ? 'text-stone-800' : ''}>Companions</span>
              </div>
              <div className="w-6 sm:w-12 h-px bg-stone-300"></div>
              <div className="flex gap-2 items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${step === 3 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>3</span>
                <span className={step === 3 ? 'text-stone-800' : ''}>Vibe Mood</span>
              </div>
              <div className="w-6 sm:w-12 h-px bg-stone-300"></div>
              <div className="flex gap-2 items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${step === 4 ? 'bg-[#008080] text-white' : 'bg-stone-200 text-stone-600'}`}>4</span>
                <span className={step === 4 ? 'text-stone-800' : ''}>Pacing & Cost</span>
              </div>
            </div>

            {/* ERROR DISPLAY & FALLBACK MANUAL BOOKING STATE */}
            {errorMsg && (
              <div className="space-y-4">
                {/* Traditional Alert Banner */}
                <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-850 rounded-lg text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold">Automated Curation Unreachable:</span>
                    <p className="mt-0.5">{errorMsg}</p>
                  </div>
                </div>

                {/* Highly Polished Backup Curation UI Card */}
                <div className="mx-6 mb-6 border border-teal-200 bg-teal-50/20 rounded-xl p-5 sm:p-7 space-y-6" id="ai-curator-fallback-box">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-[#008080] animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8.5px] bg-teal-500/10 text-[#008080] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block">Live Human Backup Coordinator</span>
                      <h3 className="text-sm sm:text-base font-serif italic text-stone-850 font-bold">Speak Directly with Rajesh or a Senior Expedition Coordinator</h3>
                      <p className="text-xs text-stone-600 leading-relaxed font-light">
                        Our automated AI curation servers are experiencing peak seasonal demand. No worries—our expert Himalayan travel advisors are ready to design your customized package manually with the exact parameters you selected!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-stone-200">
                    {/* Option 1: Quick WhatsApp Connect */}
                    <div className="bg-white p-4 rounded-lg border border-stone-150 space-y-3.5 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Instant WhatsApp Consultation</span>
                        </h4>
                        <p className="text-[11px] text-stone-500 font-light leading-relaxed">
                          Securely send your current form choices ({destination || 'Himalayan Spot'}, {duration} Days, {vibe.split(' (')[0]}) directly to our helpdesk on WhatsApp.
                        </p>
                      </div>

                      <a
                        href={getWhatsAppFallbackUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all shadow hover:shadow-md cursor-pointer mt-1"
                      >
                        <span>Connect on WhatsApp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Option 2: Manual Curation Request Form */}
                    <div className="bg-white p-4 rounded-lg border border-stone-150 space-y-3.5 shadow-xs">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-[#FF7F50]" />
                          <span>Submit a Manual Enquiry</span>
                        </h4>
                        <p className="text-[11px] text-stone-500 font-light leading-relaxed">
                          We will custom-design your premium Himalayan itinerary and reach out with tailored pricing and accommodation details.
                        </p>
                      </div>

                      {isManualEnquirySuccess ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-center text-[11px] text-emerald-800 font-semibold flex items-center justify-center gap-1.5 animate-fade-in">
                          <Check className="w-3.5 h-3.5" />
                          <span>Request Registered Successfully!</span>
                        </div>
                      ) : (
                        <form onSubmit={handleManualFallbackSubmit} className="space-y-2 pt-0.5">
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              required 
                              placeholder="Your Name"
                              value={enquiryName}
                              onChange={(e) => setEnquiryName(e.target.value)}
                              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-[11px] focus:outline-none focus:border-[#008080] font-medium placeholder-stone-400"
                            />
                            <input 
                              type="tel" 
                              required 
                              placeholder="Mobile No"
                              value={enquiryPhone}
                              onChange={(e) => setEnquiryPhone(e.target.value)}
                              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-[11px] focus:outline-none focus:border-[#008080] font-medium placeholder-stone-400"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="email" 
                              required 
                              placeholder="Email Address"
                              value={enquiryEmail}
                              onChange={(e) => setEnquiryEmail(e.target.value)}
                              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-[11px] focus:outline-none focus:border-[#008080] font-medium placeholder-stone-400"
                            />
                            <input 
                              type="date" 
                              required 
                              value={enquiryTravelDate}
                              onChange={(e) => setEnquiryTravelDate(e.target.value)}
                              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-[11px] text-stone-500 focus:outline-none focus:border-[#008080] font-medium cursor-pointer"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isManualEnquirySubmitting}
                            className="w-full py-1.5 bg-[#FF7F50] hover:bg-[#ff6a33] disabled:opacity-50 text-white text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                          >
                            {isManualEnquirySubmitting ? (
                              <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Request Bespoke Plan</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: DESTINATION SELECTION */}
            {step === 1 && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-serif italic text-stone-850 font-medium">Where would you like to flow next?</h3>
                  <p className="text-xs text-stone-400 font-light">Select from our signature Himalayan sectors, or type in any specific valley/town you wish to traverse.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {popularDestinations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDestination(loc)}
                      className={`p-4 text-left border rounded-lg text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer ${
                        destination === loc 
                          ? 'border-[#008080] bg-[#008080]/5 text-[#008080]' 
                          : 'border-stone-200 hover:border-[#008080] bg-[#fbfbfa]'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 pt-4 border-t border-stone-150">
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest">Custom Segment or Route Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Chopta Tungnath Trek, Joshimath, Valley of Flowers, Dharamshala..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium placeholder-stone-400 shadow-inner"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => {
                      if (!destination.trim()) {
                        setErrorMsg('Please specify a destination or choose one of our signature options.');
                        return;
                      }
                      setErrorMsg('');
                      setStep(2);
                    }}
                    className="px-6 py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>Choose Companions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: COMPANION SELECTION */}
            {step === 2 && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-serif italic text-stone-850 font-medium">Who will accompany you on this journey?</h3>
                  <p className="text-xs text-stone-400 font-light">Group composition drastically affects mountain safety protocols, buffer schedules, and hotel selection.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {companionTypes.map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setCompanions(comp)}
                      className={`p-4 text-left border rounded-lg text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer ${
                        companions === comp 
                          ? 'border-[#008080] bg-[#008080]/5 text-[#008080]' 
                          : 'border-stone-200 hover:border-[#008080] bg-[#fbfbfa]'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider rounded"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>Select Travel Vibe</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VIBE SELECTION */}
            {step === 3 && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-serif italic text-stone-850 font-medium">What is the desired pacing & signature focus?</h3>
                  <p className="text-xs text-stone-400 font-light">Choose the focus that matches your mental state. Gemini will tailor the sightseeing options and luxury accents accordingly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {travelVibes.map((v) => (
                    <button
                      key={v.title}
                      type="button"
                      onClick={() => setVibe(v.title)}
                      className={`p-4 text-left border rounded-lg transition shadow-xs cursor-pointer flex flex-col gap-1.5 ${
                        vibe === v.title 
                          ? 'border-[#008080] bg-[#008080]/5' 
                          : 'border-stone-200 hover:border-[#008080] bg-[#fbfbfa]'
                      }`}
                    >
                      <span className={`text-xs font-bold tracking-wide ${vibe === v.title ? 'text-[#008080]' : 'text-stone-800'}`}>{v.title.split(' (')[0]}</span>
                      <span className="text-[10px] text-stone-400 font-light leading-normal">{v.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider rounded"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>Configure Pricing & Days</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DURATION, BUDGET & PERSONALIZATION */}
            {step === 4 && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-serif italic text-stone-850 font-medium">Configure Pacing, Budget & Preferences</h3>
                  <p className="text-xs text-stone-400 font-light">Input your constraints to allow Gemini models to select real regional hotels, vehicle classes, and tour guidelines.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Duration (Days)</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14].map(d => (
                        <option key={d} value={d}>{d} Days / {d-1} Nights</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Target Budget limit (INR - Total)</label>
                    <input 
                      type="number" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Special preferences, Medical/Dietary or Stay preferences (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="E.g. elderly-friendly walking paths, strict Jain pure-veg meals, organic farm stays, deluxe SUV transport required..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium resize-none placeholder-stone-400 shadow-inner"
                  />
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-3 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider rounded"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-7 py-3 bg-[#FF7F50] hover:bg-[#ff6a33] text-white text-xs font-bold uppercase tracking-widest rounded-md flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Curating Bespoke Plan...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>Curate with Pravaah AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* LOADING SCREEN */}
        {isGenerating && (
          <div className="bg-white border border-stone-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-sm max-w-4xl mx-auto" id="loading-state">
            <div className="w-16 h-16 bg-teal-50 border border-teal-150 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Sparkles className="w-8 h-8 text-[#008080] animate-spin-slow" />
            </div>
            <h3 className="text-lg font-serif italic text-stone-850 font-bold mb-2">Connecting to Google Gemini API...</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed font-light mb-6">
              Processing destination terrains, evaluating route clearances, matching {companions.toLowerCase()} guidelines, and building a premium, custom local experience conforming to your budget of ₹{Number(budget).toLocaleString('en-IN')}.
            </p>
            <div className="w-48 h-1 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#008080] rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* RESULT DISPLAY */}
        {step === 5 && aiResult && (
          <div className="space-y-10 animate-fade-in" id="ai-result-panel">
            
            {/* Generated Header Banner */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-850 text-white p-8 rounded-xl shadow-md relative overflow-hidden">
              <div className="absolute right-4 top-4 flex items-center gap-1.5 bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Curated</span>
              </div>

              <div className="max-w-2xl space-y-2">
                <span className="text-[#F4C430] text-[9px] font-bold uppercase tracking-[0.2em]">Bespoke Route Package</span>
                <h2 className="text-2xl sm:text-3xl font-serif italic">{aiResult.title}</h2>
                <p className="text-stone-300 text-xs font-light">
                  Custom Itinerary Duration: <strong className="text-white">{aiResult.duration}</strong> | Budget Target: <strong className="text-white">₹{Number(budget).toLocaleString('en-IN')}</strong> | Vibe: <strong className="text-white">{vibe.split(' (')[0]}</strong>
                </p>
              </div>
            </div>

            {/* Interactive Procedural Map Section */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-stone-850 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-5 h-5 text-[#008080]" />
                  <span>Interactive Route Coordinates Map</span>
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">Click any day marker in the interactive map or the list below to review local stops, routes, and travel times.</p>
              </div>

              <InteractiveRouteMap 
                itinerary={aiResult.itinerary}
                destination={destination}
                category="AI Custom Package"
                activeDay={activeDay}
                onDayClick={(day) => setActiveDay(day)}
              />
            </div>

            {/* Daily Itinerary Timeline with re-ordering */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-150 pb-5">
                <div>
                  <h3 className="text-sm font-bold text-stone-850 uppercase tracking-wider">Day-by-Day Journey Flow</h3>
                  <p className="text-xs text-stone-400 font-light mt-0.5">Click to expand sensory insights. Swap day orders with control buttons to adjust your route.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReordering(!isReordering)}
                  className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest border transition rounded ${
                    isReordering 
                      ? 'bg-amber-500 text-white border-amber-600' 
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {isReordering ? 'Save Day Sequence' : 'Rearrange Days'}
                </button>
              </div>

              <div className="space-y-4">
                {aiResult.itinerary?.map((dayItem: any, index: number) => {
                  const isOpen = activeDay === dayItem.day;
                  return (
                    <div 
                      key={dayItem.day}
                      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                        isReordering 
                          ? 'border-amber-300 bg-amber-50/10' 
                          : isOpen 
                            ? 'border-[#008080] bg-teal-50/5' 
                            : 'border-stone-200 hover:border-[#008080]/60 bg-white'
                      }`}
                    >
                      {/* Accordion header bar */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer select-none"
                        onClick={() => {
                          if (!isReordering) {
                            setActiveDay(dayItem.day);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {isReordering ? (
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-amber-500" />
                              <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-mono font-bold flex items-center justify-center">D{dayItem.day}</span>
                            </div>
                          ) : (
                            <span className={`w-9 h-9 text-[10px] font-mono font-extrabold border rounded-xl flex items-center justify-center transition-all ${
                              isOpen ? 'bg-[#008080] text-white border-transparent shadow' : 'bg-stone-100 text-stone-500 border-stone-200'
                            }`}>
                              D{dayItem.day}
                            </span>
                          )}
                          <div>
                            <h4 className="text-sm font-serif italic text-stone-850 font-bold">{dayItem.title}</h4>
                          </div>
                        </div>

                        {isReordering ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveDay(index, 'up')}
                              className="p-1.5 border border-stone-200 bg-white text-stone-500 hover:text-[#008080] disabled:opacity-30 rounded cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === aiResult.itinerary.length - 1}
                              onClick={() => moveDay(index, 'down')}
                              className="p-1.5 border border-stone-200 bg-white text-stone-500 hover:text-[#008080] disabled:opacity-30 rounded cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-[#008080]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanded description */}
                      {isOpen && !isReordering && (
                        <div className="p-5 bg-stone-50/50 border-t border-stone-150 space-y-3">
                          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">{dayItem.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Inclusions, Exclusions & Safety/Local Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Inclusions */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold text-emerald-850 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Custom Inclusions</span>
                </h4>
                <div className="w-8 h-0.5 bg-emerald-200" />
                <ul className="space-y-2 text-[11.5px] text-stone-600 font-light leading-relaxed">
                  {aiResult.inclusions?.map((inc: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold text-rose-850 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
                  <span>Standard Exclusions</span>
                </h4>
                <div className="w-8 h-0.5 bg-rose-200" />
                <ul className="space-y-2 text-[11.5px] text-stone-600 font-light leading-relaxed">
                  {aiResult.exclusions?.map((exc: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-rose-500 font-bold">✕</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips & Local Secrets */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold text-amber-850 uppercase tracking-widest flex items-center gap-1.5">
                  <Star className="w-4.5 h-4.5 text-amber-500" />
                  <span>Expert Local Tips</span>
                </h4>
                <div className="w-8 h-0.5 bg-amber-200" />
                <ul className="space-y-2 text-[11.5px] text-stone-600 font-light leading-relaxed">
                  {aiResult.tips?.map((tip: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-amber-500 font-bold">★</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* DIRECT FIRESTORE BOOKING SUBMISSION */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6" id="lead-enquiry-form">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-lg sm:text-xl font-serif italic text-stone-850 font-bold">Lock in this Personalized Route</h3>
                <p className="text-xs text-stone-400 font-light">Register your customized AI itinerary in our database. Our veteran Himalayan coordinator will review safety parameters, permit conditions, and get back to you with custom clearances within 24 hours.</p>
              </div>

              {isEnquirySuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center max-w-lg mx-auto space-y-4 shadow-sm animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-stone-800">Itinerary Registered!</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    Your bespoke itinerary, custom daily order, and special preferences have been stored securely. Rajesh Sharma or one of our Lead Logistics Sherpas will call/email you on your provided contacts shortly!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="max-w-2xl mx-auto space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Yash Sharma"
                        value={enquiryName}
                        onChange={(e) => setEnquiryName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium placeholder-stone-300"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Mobile Number</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="E.g. +91 9999999999"
                        value={enquiryPhone}
                        onChange={(e) => setEnquiryPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium placeholder-stone-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="you@example.com"
                        value={enquiryEmail}
                        onChange={(e) => setEnquiryEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium placeholder-stone-300"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Target Travel Date</label>
                      <input 
                        type="date" 
                        required 
                        value={enquiryTravelDate}
                        onChange={(e) => setEnquiryTravelDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium text-stone-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isEnquirySubmitting}
                      className="w-full py-3.5 bg-[#FF7F50] hover:bg-[#ff6a33] text-white text-xs font-bold uppercase tracking-widest rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-xl transition-all"
                    >
                      {isEnquirySubmitting ? (
                        <div className="w-5 h-5 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Booking Enquiry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center bg-stone-100 p-6 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={startOver}
                className="px-5 py-2.5 border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider rounded"
              >
                Plan Another Trip
              </button>
              
              <button
                type="button"
                onClick={onNavigateToHome}
                className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded shadow cursor-pointer"
              >
                Back to Home Screen
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
