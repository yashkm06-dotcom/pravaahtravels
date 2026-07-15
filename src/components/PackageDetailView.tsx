import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, IndianRupee, Check, X, Send, Users, 
  ChevronDown, ChevronUp, Trash2, GripVertical, Sliders, ArrowUp, ArrowDown, Sparkles, Phone, Mail, Compass, HelpCircle, CheckCircle2, Heart
} from 'lucide-react';
import { TravelPackage, Enquiry, formatPrice } from '../types';
import { db, collection, addDoc, auth, getDocs, query, where, deleteDoc, doc } from '../lib/firebase';
import { triggerSystemEmail } from '../lib/emailClient';
import InteractiveRouteMap from './InteractiveRouteMap';

interface PackageDetailViewProps {
  pkg: TravelPackage;
  onBack: () => void;
  onEnquirySuccess: () => void;
  isAdminLoggedIn?: boolean;
  onDeletePackage?: (id: string) => void;
}

export default function PackageDetailView({
  pkg,
  onBack,
  onEnquirySuccess,
  isAdminLoggedIn = false,
  onDeletePackage,
}: PackageDetailViewProps) {
  // Accordion state for itinerary days
  const [activeDay, setActiveDay] = useState<number | null>(1);
  
  // Local editable itinerary for custom sorting/swapping (Drag and Drop)
  const [localItinerary, setLocalItinerary] = useState<any[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync with package when it changes
  useEffect(() => {
    if (pkg && pkg.itinerary) {
      setLocalItinerary([...pkg.itinerary]);
    }
  }, [pkg]);

  // Form submission state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    travelDate: '',
    travelers: 2,
    budget: '₹20,000 - ₹50,000',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Scroll to top when package changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pkg]);

  // Booking Request State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    destination: pkg?.destination || '',
    packageTitle: pkg?.title || '',
    travelDate: '',
    adults: 2,
    children: 0,
    pickupCity: '',
    budget: pkg ? `₹${pkg.price?.toLocaleString('en-IN') || '20,000'}` : '₹20,000 - ₹50,000',
    specialRequests: ''
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Prefill logged in user details when booking modal opens
  useEffect(() => {
    if (isBookingModalOpen) {
      const user = auth.currentUser;
      if (user) {
        setBookingForm(prev => ({
          ...prev,
          name: user.displayName || prev.name || '',
          email: user.email || prev.email || '',
        }));
      }
    }
  }, [isBookingModalOpen]);

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: name === 'adults' || name === 'children' ? parseInt(value) || 0 : value
    }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingError('');

    if (!bookingForm.name || !bookingForm.phone || !bookingForm.whatsapp || !bookingForm.email || !bookingForm.travelDate) {
      setBookingError('Please fill in all required fields.');
      setBookingSubmitting(false);
      return;
    }

    try {
      const user = auth.currentUser;
      const bookingData = {
        userId: user ? user.uid : 'guest',
        customerName: bookingForm.name,
        customerPhone: bookingForm.phone,
        customerWhatsApp: bookingForm.whatsapp,
        customerEmail: bookingForm.email,
        destination: bookingForm.destination,
        packageTitle: bookingForm.packageTitle,
        packageId: pkg.id,
        travelDate: bookingForm.travelDate,
        adults: Number(bookingForm.adults),
        children: Number(bookingForm.children),
        pickupCity: bookingForm.pickupCity,
        budget: bookingForm.budget,
        price: pkg.price || 0,
        specialRequests: bookingForm.specialRequests,
        status: 'New Lead', // CRM Status initial value
        paymentStatus: 'Unpaid',
        createdAt: new Date().toISOString(),
        notes: [],
        assignedStaff: '',
        followUpDate: ''
      };

      await addDoc(collection(db, 'bookings'), bookingData);

      // Trigger automated email notifications
      triggerSystemEmail('booking-received', bookingForm.email, {
        customerName: bookingForm.name,
        customerEmail: bookingForm.email,
        customerPhone: bookingForm.phone,
        packageTitle: pkg.title,
        travelDate: bookingForm.travelDate,
        adults: Number(bookingForm.adults),
        children: Number(bookingForm.children),
        pickupCity: bookingForm.pickupCity,
        budget: formatPrice(Number(bookingForm.budget) || 0),
        specialRequests: bookingForm.specialRequests
      });

      triggerSystemEmail('new-booking', 'yash.km06@gmail.com', { // Fallback to yash.km06@gmail.com or primary email
        customerName: bookingForm.name,
        customerEmail: bookingForm.email,
        customerPhone: bookingForm.phone,
        customerWhatsApp: bookingForm.phone,
        packageTitle: pkg.title,
        travelDate: bookingForm.travelDate,
        adults: Number(bookingForm.adults),
        children: Number(bookingForm.children),
        pickupCity: bookingForm.pickupCity,
        budget: formatPrice(Number(bookingForm.budget) || 0),
        specialRequests: bookingForm.specialRequests
      });

      setBookingSuccess(true);
      if (onEnquirySuccess) onEnquirySuccess();
    } catch (err: any) {
      console.error('Error submitting booking request:', err);
      setBookingError(`Submission failed: ${err.message || String(err)}`);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'travelers' ? parseInt(value) || 1 : value
    }));
  };

  const toggleDay = (day: number) => {
    setActiveDay((prev) => (prev === day ? null : day));
  };

  // Reordering functions for Drag and Drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...localItinerary];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);
    
    // Re-index days sequentially
    const updated = reordered.map((item, idx) => ({
      ...item,
      day: idx + 1
    }));
    
    setLocalItinerary(updated);
    setDraggedIndex(null);
    setActiveDay(index + 1);

    // Update enquiry form text
    setFormData(prev => ({
      ...prev,
      message: `Hi, I have customized the plan for the "${pkg.title}". Here is my custom day order:\n` + 
        updated.map(d => `Day ${d.day}: ${d.title}`).join('\n')
    }));
  };

  // Mobile reorder click assistants
  const moveDay = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localItinerary.length) return;

    const reordered = [...localItinerary];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((item, idx) => ({
      ...item,
      day: idx + 1
    }));

    setLocalItinerary(updated);
    setActiveDay(targetIndex + 1);

    setFormData(prev => ({
      ...prev,
      message: `Hi, I have customized the plan for the "${pkg.title}". Here is my custom day order:\n` + 
        updated.map(d => `Day ${d.day}: ${d.title}`).join('\n')
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    // Basic Validation
    if (!formData.name || !formData.phone || !formData.email || !formData.travelDate) {
      setErrorMsg('Please fill in all required fields marked with *');
      setSubmitting(false);
      return;
    }

    try {
      const enquiryPayload: Omit<Enquiry, 'id'> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        destination: pkg.destination,
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        budget: formData.budget,
        message: formData.message || `Hi, I am interested in booking the "${pkg.title}" package. Please share details.`,
        packageId: pkg.id,
        packageName: pkg.title,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'enquiries'), enquiryPayload);

      // Trigger automated email notifications
      triggerSystemEmail('enquiry-received', formData.email, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        destination: pkg.destination,
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        budget: formData.budget,
        message: formData.message || `Hi, I am interested in booking the "${pkg.title}" package. Please share details.`
      });

      triggerSystemEmail('new-enquiry', 'yash.km06@gmail.com', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        destination: pkg.destination,
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        budget: formData.budget,
        message: formData.message || `Hi, I am interested in booking the "${pkg.title}" package. Please share details.`
      });

      setSubmitSuccess(true);
      onEnquirySuccess();
    } catch (error) {
      console.error('Error creating enquiry:', error);
      setErrorMsg('Something went wrong. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const packageGalleryImages = [
    pkg.packageBannerUrl || pkg.imageUrl,
    ...(pkg.galleryImages || [])
  ].filter(Boolean);

  return (
    <div id="package-detail-view" className="animate-fade-in overflow-hidden bg-[#fffaf1]">
      <section className="relative min-h-[72vh] overflow-hidden bg-stone-950 text-white">
        <img
          src={pkg.packageBannerUrl || pkg.imageUrl}
          alt={pkg.title}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/90 via-stone-950/62 to-stone-950/12" />
        <div className="absolute inset-0 bg-linear-to-t from-stone-950/78 via-transparent to-stone-950/18" />

        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-4 py-12 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="mb-10 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur-md transition hover:bg-white/18"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to packages</span>
          </button>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
            <div className="max-w-4xl space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#f59e0b] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-950">
                  {pkg.category}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5 text-[#5eead4]" />
                  {pkg.destination}
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {pkg.title}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-stone-200 sm:text-base">
                  {pkg.shortDescription}
                </p>
              </div>

              <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <Calendar className="mb-2 h-5 w-5 text-[#fbbf24]" />
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">Duration</span>
                  <strong className="mt-1 block text-sm text-white">{pkg.duration}</strong>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <Users className="mb-2 h-5 w-5 text-[#5eead4]" />
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">Travel Style</span>
                  <strong className="mt-1 block text-sm text-white">{pkg.category}</strong>
                </div>
                <div className="col-span-2 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:col-span-1">
                  <IndianRupee className="mb-2 h-5 w-5 text-[#f97350]" />
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">Starts From</span>
                  <strong className="mt-1 block text-sm text-white">{formatPrice(pkg.price)}</strong>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/18 bg-white/12 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#fbbf24]">Offline booking request</span>
              <div className="mt-3 rounded-3xl bg-white p-5 text-stone-950">
                <span className="text-xs font-bold text-stone-500">Starting from</span>
                <div className="mt-1 text-3xl font-extrabold text-[#0f766e]">{formatPrice(pkg.price)}</div>
                <p className="mt-3 text-xs leading-6 text-stone-500">No online payment required. Submit your details and the Pravaah team will coordinate dates, route, hotels, and final pricing.</p>
                <button
                  onClick={() => {
                    setBookingSuccess(false);
                    setBookingError('');
                    setIsBookingModalOpen(true);
                  }}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f97350] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_16px_35px_rgba(249,115,80,0.28)] transition hover:-translate-y-1 hover:bg-[#ea5f3c]"
                >
                  <Compass className="h-4 w-4" />
                  <span>Book This Holiday</span>
                </button>
              </div>
              {isAdminLoggedIn && onDeletePackage && (
                <button
                  onClick={() => onDeletePackage(pkg.id)}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Package</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">

        {/* Main Content & Sticky Form Split */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left: General Details, Itinerary, Inclusions */}
          <div className="space-y-8 lg:col-span-2">

            {/* Description */}
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">About the holiday</span>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">A closer look at this journey</h3>
              <p className="mt-5 whitespace-pre-line text-sm leading-8 text-stone-600">
                {pkg.fullDescription || pkg.shortDescription}
              </p>
            </div>

            {packageGalleryImages.length > 0 && (
              <div className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-[0_18px_50px_rgba(18,38,32,0.08)]" id="package-gallery">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative h-72 overflow-hidden rounded-[1.5rem] md:col-span-2 md:h-96">
                    <img
                      src={packageGalleryImages[0]}
                      alt={`${pkg.title} gallery lead`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/45 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <span className="rounded-full bg-white/18 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md">Gallery</span>
                      <h3 className="mt-3 text-2xl font-semibold">{pkg.destination}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
                    {(packageGalleryImages.slice(1, 3).length > 0 ? packageGalleryImages.slice(1, 3) : packageGalleryImages.slice(0, 2)).map((imageUrl, idx) => (
                      <div key={`${imageUrl}-${idx}`} className="h-34 overflow-hidden rounded-[1.5rem] bg-stone-100 md:h-[184px]">
                        <img
                          src={imageUrl}
                          alt={`${pkg.title} gallery ${idx + 1}`}
                          className="h-full w-full object-cover transition duration-700 hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Route Maps visualizer */}
            <InteractiveRouteMap 
              itinerary={localItinerary} 
              destination={pkg.destination} 
              category={pkg.category}
              activeDay={activeDay}
              onDayClick={(day) => setActiveDay(day)}
            />

            {/* Day Wise Itinerary */}
            <div className="space-y-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8" id="custom-itinerary-section">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">Day-wise route</span>
                  <h3 className="text-3xl font-semibold tracking-tight text-stone-950">Interactive itinerary</h3>
                  <p className="text-sm leading-6 text-stone-500">Click a day to focus its spot coordinate on the map above.</p>
                </div>
                
                {/* Drag-and-Drop / Interactive Toggle */}
                <button
                  type="button"
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] transition ${
                    isCustomizing 
                      ? 'border-amber-600 bg-amber-500 text-white shadow-md' 
                      : 'border-stone-200 bg-[#fffaf1] text-stone-700 hover:border-[#0f766e] hover:text-[#0f766e]'
                  }`}
                >
                  <Sliders className="h-4 w-4" />
                  <span>{isCustomizing ? 'Lock Customized Order' : 'Customize Plan (Drag-n-Drop)'}</span>
                </button>
              </div>
              
              {isCustomizing && (
                <div className="flex animate-fade-in items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-stone-700">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <strong>Interactive Drag & Drop Mode Active:</strong> Rearrange your travel days! 
                    Hover over a day card and drag it using the <strong>Grip Vertical</strong> handles, or click the 
                    <strong> Up/Down</strong> keys. The coordinate lines on the map above will re-route instantly!
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {localItinerary && localItinerary.length > 0 ? (
                  localItinerary.map((dayItem, index) => {
                    const isOpen = activeDay === dayItem.day;
                    return (
                      <div 
                        key={dayItem.day}
                        draggable={isCustomizing}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
                          isCustomizing 
                            ? 'border-amber-300 bg-[#fffaf1] shadow-sm hover:border-amber-500 hover:shadow-md' 
                            : isOpen 
                              ? 'border-[#0f766e]/60 shadow-sm ring-1 ring-[#0f766e]/10'
                              : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div
                          className={`flex w-full items-center justify-between p-4 text-left transition sm:p-5 ${
                            isCustomizing ? 'cursor-grab' : 'cursor-pointer hover:bg-[#fffaf1]'
                          }`}
                          onClick={() => {
                            if (!isCustomizing) {
                              toggleDay(dayItem.day);
                              setActiveDay(dayItem.day);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4">
                            {/* Drag Handle or Index marker */}
                            {isCustomizing ? (
                              <div className="cursor-grab p-1 text-amber-500 hover:text-amber-700 active:cursor-grabbing">
                                <GripVertical className="h-4.5 w-4.5" />
                              </div>
                            ) : (
                              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border font-mono text-[10px] font-extrabold shadow-sm transition-colors ${
                                isOpen ? 'border-transparent bg-[#0f766e] text-white' : 'border-stone-200 bg-[#fffaf1] text-stone-600'
                              }`}>
                                D{dayItem.day}
                              </span>
                            )}
                            
                            <span className="text-sm font-semibold leading-snug text-stone-900 sm:text-base">
                              {dayItem.title}
                            </span>
                          </div>

                          {/* Control arrows for mobile / non-drag reordering */}
                          {isCustomizing ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveDay(index, 'up')}
                                className="cursor-pointer rounded-full border border-stone-200 bg-white p-1 text-stone-500 hover:bg-stone-50 hover:text-[#0f766e] disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === localItinerary.length - 1}
                                onClick={() => moveDay(index, 'down')}
                                className="cursor-pointer rounded-full border border-stone-200 bg-white p-1 text-stone-500 hover:bg-stone-50 hover:text-[#0f766e] disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-[#0f766e]" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                            </div>
                          )}
                        </div>
                        
                        {isOpen && !isCustomizing && (
                          <div className="animate-fade-in border-t border-stone-100 bg-[#fffaf1] p-5 text-sm leading-8 text-stone-600">
                            {dayItem.description}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm italic text-stone-400">No itinerary has been entered for this package.</p>
                )}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Inclusions */}
              <div className="space-y-5 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8">
                <h4 className="flex items-center gap-2 text-xl font-semibold text-[#0f766e]">
                  <Check className="h-5 w-5 text-[#0f766e]" />
                  <span>Inclusions</span>
                </h4>
                <ul className="space-y-3">
                  {pkg.inclusions && pkg.inclusions.length > 0 ? (
                    pkg.inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-3 text-sm leading-6 text-stone-700">
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#0f766e]" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm italic text-stone-400">Contact Pravaah for custom inclusions</li>
                  )}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="space-y-5 rounded-[2rem] border border-rose-100 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8">
                <h4 className="flex items-center gap-2 text-xl font-semibold text-rose-700">
                  <X className="h-5 w-5 text-rose-600" />
                  <span>Exclusions</span>
                </h4>
                <ul className="space-y-3">
                  {pkg.exclusions && pkg.exclusions.length > 0 ? (
                    pkg.exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 rounded-2xl bg-rose-50/70 p-3 text-sm leading-6 text-stone-700">
                        <X className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm italic text-stone-400">General personal bills excluded</li>
                  )}
                </ul>
              </div>
            </div>

            {pkg.highlights && pkg.highlights.length > 0 && (
              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">Highlights</span>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {pkg.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-2xl bg-[#fffaf1] p-4 text-sm leading-6 text-stone-700">
                      <Heart className="mt-1 h-4 w-4 shrink-0 text-[#f97350]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pkg.faqs && pkg.faqs.length > 0 && (
              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(18,38,32,0.08)] md:p-8" id="package-faqs">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">FAQ</span>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Questions before you go</h3>
                <div className="mt-6 space-y-3">
                  {pkg.faqs.map((faq, idx) => (
                    <div key={idx} className="rounded-3xl border border-stone-200 bg-[#fffaf1] p-5">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-[#0f766e]" />
                        <div>
                          <h4 className="text-sm font-extrabold text-stone-950">{faq.question}</h4>
                          <p className="mt-2 text-sm leading-7 text-stone-600">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right: Sticky Enquiry Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(18,38,32,0.14)]" id="detail-enquiry-card">
              
              {/* Box Heading */}
              <div className="space-y-2 border-b border-stone-100 pb-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">Plan with us</span>
                <h3 className="text-2xl font-semibold text-stone-950">Flow into journey</h3>
                <p className="text-sm leading-7 text-stone-500">
                  Enquire today, and get a customized draft itinerary within 24 hours.
                </p>
                <div className="rounded-3xl bg-[#fffaf1] p-4">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Starts from</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#0f766e]">{formatPrice(pkg.price)}</div>
                </div>
              </div>

              {submitSuccess ? (
                <div className="animate-fade-in space-y-4 rounded-3xl border border-[#0f766e]/20 bg-[#0f766e]/10 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f766e] text-white shadow-sm">
                    <Check className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-stone-950">Enquiry submitted</h4>
                  <p className="text-sm leading-7 text-stone-600">
                    Thank you for reaching out to Pravaah Travels. Our travel expert will call you shortly on the provided contact number.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        travelDate: '',
                        travelers: 2,
                        budget: '₹20,000 - ₹50,000',
                        message: ''
                      });
                    }}
                    className="w-full rounded-full bg-[#0f766e] py-3 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#0d5f59]"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="E.g. Yash Kumar"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="E.g. +91 98765..."
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Email ID *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Date & Travelers */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Travel Date *</label>
                      <input
                        type="date"
                        name="travelDate"
                        required
                        value={formData.travelDate}
                        onChange={handleInputChange}
                        className="w-full cursor-pointer rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Travelers *</label>
                      <input
                        type="number"
                        name="travelers"
                        required
                        min="1"
                        max="100"
                        value={formData.travelers}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Est. Budget per Person</label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full cursor-pointer rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    >
                      <option value="Under ₹20,000">Under ₹20,000</option>
                      <option value="₹20,000 - ₹50,000">₹20,000 - ₹50,000</option>
                      <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                      <option value="₹1,00,000 - ₹2,00,000">₹1,00,000 - ₹2,00,000</option>
                      <option value="₹2,00,000+">₹2,00,000+ (Premium Custom)</option>
                    </select>
                  </div>

                  {/* Note */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Special Requests</label>
                    <textarea
                      name="message"
                      rows={2}
                      placeholder="Any specific hotel category, dietary preference..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-stone-800 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f97350] py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#ea5f3c] disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Submit Holiday Enquiry</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* BOOKING REQUEST MODAL (12 Fields, No Payment Gateway) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="booking-request-modal">
          <div className="bg-[#fcfbf9] border border-stone-250 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto font-sans flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#008080] text-white p-6 relative shrink-0">
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white hover:rotate-90 transition-all duration-300 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF7F50] bg-white/10 px-2 py-0.5 rounded-sm">Step-Free Offline Coordination</span>
              <h3 className="text-xl font-serif italic text-white mt-2">Book Your Holiday</h3>
              <p className="text-xs text-stone-100 font-light mt-1">
                Request custom travel planning for <strong className="font-bold">{pkg.title}</strong>. No payment/deposit is required to book.
              </p>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center space-y-4 animate-fade-in flex-1 flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-[#008080]/10 text-[#008080] rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-serif italic text-stone-900 text-xl">Booking Request Logged!</h4>
                <div className="max-w-xs text-xs text-stone-600 leading-relaxed font-light space-y-2">
                  <p>Thank you, <strong className="font-bold text-stone-900">{bookingForm.name}</strong>.</p>
                  <p>Your booking request code is being processed. An administrator will call or WhatsApp you within 2-4 business hours to finalize the travel itinerary and pricing details.</p>
                </div>
                <div className="bg-stone-50 border border-stone-150 p-3 rounded text-[11px] text-stone-500 font-mono w-full text-left space-y-1">
                  <div>• Package: {bookingForm.packageTitle}</div>
                  <div>• Travel Date: {bookingForm.travelDate}</div>
                  <div>• Contact: {bookingForm.phone} / {bookingForm.whatsapp}</div>
                </div>
                <button
                  onClick={() => {
                    setBookingSuccess(false);
                    setIsBookingModalOpen(false);
                  }}
                  className="px-6 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded transition shadow-sm cursor-pointer"
                >
                  Return to Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                {bookingError && (
                  <div className="bg-rose-50 border border-rose-155 text-rose-700 p-3 rounded text-xs font-semibold">
                    {bookingError}
                  </div>
                )}

                {/* Grid for Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Your Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="E.g. Yash Kumar"
                      value={bookingForm.name}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="your@email.com"
                      value={bookingForm.email}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                    />
                  </div>
                </div>

                {/* Grid for Phone & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Mobile Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="E.g. +91 98765 43210"
                      value={bookingForm.phone}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">WhatsApp Number *</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      required
                      placeholder="WhatsApp contact"
                      value={bookingForm.whatsapp}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                    />
                  </div>
                </div>

                {/* Grid for Destination & Package */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Destination</label>
                    <input
                      type="text"
                      name="destination"
                      readOnly
                      disabled
                      value={bookingForm.destination}
                      className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded text-xs text-stone-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Package Selected</label>
                    <input
                      type="text"
                      name="packageTitle"
                      readOnly
                      disabled
                      value={bookingForm.packageTitle}
                      className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded text-xs text-stone-500 font-medium"
                    />
                  </div>
                </div>

                {/* Grid for Date, Adults, Children */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Travel Date *</label>
                    <input
                      type="date"
                      name="travelDate"
                      required
                      value={bookingForm.travelDate}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider font-sans">Adults * (12+ yrs)</label>
                    <input
                      type="number"
                      name="adults"
                      required
                      min="1"
                      value={bookingForm.adults}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Children (0-11 yrs)</label>
                    <input
                      type="number"
                      name="children"
                      required
                      min="0"
                      value={bookingForm.children}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                    />
                  </div>
                </div>

                {/* Grid for Pickup City & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider font-sans">Pickup City</label>
                    <input
                      type="text"
                      name="pickupCity"
                      placeholder="E.g. Delhi NCR, Chandigarh"
                      value={bookingForm.pickupCity}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Desired Budget</label>
                    <select
                      name="budget"
                      value={bookingForm.budget}
                      onChange={handleBookingInputChange}
                      className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-[#333333] focus:outline-none focus:border-[#008080] font-medium shadow-2xs cursor-pointer"
                    >
                      <option value="Under ₹20,000">Under ₹20,000</option>
                      <option value="₹20,000 - ₹50,000">₹20,000 - ₹50,000</option>
                      <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                      <option value="₹1,00,000 - ₹2,00,000">₹1,00,000 - ₹2,00,000</option>
                      <option value="₹2,00,000+">₹2,00,000+ (Premium Custom)</option>
                    </select>
                  </div>
                </div>

                {/* Special Requests */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Special Requests</label>
                  <textarea
                    name="specialRequests"
                    rows={2}
                    placeholder="E.g. Double bed, vegetarian meals, wheelchair assistance..."
                    value={bookingForm.specialRequests}
                    onChange={handleBookingInputChange}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs text-stone-850 focus:outline-none focus:border-[#008080] font-medium shadow-2xs"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
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
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm Booking Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
