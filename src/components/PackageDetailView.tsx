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

  return (
    <div id="package-detail-view" className="animate-fade-in py-12 bg-[#f8f7f4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#008080] hover:text-[#006666] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to curated packages</span>
        </button>

        {/* Header Block */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="bg-[#008080] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
                {pkg.category}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#008080]" />
                <span>{pkg.destination}</span>
              </div>
            </div>
            {isAdminLoggedIn && onDeletePackage && (
              <button
                onClick={() => onDeletePackage(pkg.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider transition rounded shadow cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Package</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-normal text-[#333333] tracking-tight leading-tight">
            {pkg.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-6 text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#FF7F50]" />
                <span>{pkg.duration}</span>
              </div>
              {pkg.price && (
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[#008080]" />
                  <span>Starts from <strong className="text-[#008080] font-bold text-xs">{formatPrice(pkg.price)}</strong> per traveler</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setBookingSuccess(false);
                setBookingError('');
                setIsBookingModalOpen(true);
              }}
              className="sm:self-center px-6 py-3 bg-[#FF7F50] hover:bg-[#ff6a33] text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Book This Holiday (No Payment)</span>
            </button>
          </div>
        </div>

        {/* Main Content & Sticky Form Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: General Details, Itinerary, Inclusions */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Banner Image */}
            <div className="h-96 md:h-[450px] rounded overflow-hidden shadow-sm bg-stone-100 border border-stone-200">
              <img 
                src={pkg.imageUrl} 
                alt={pkg.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Description */}
            <div className="bg-white border border-stone-200 rounded p-6 md:p-8 space-y-4 shadow-xs">
              <h3 className="text-xl font-serif italic text-[#333333]">About the Holiday</h3>
              <div className="w-12 h-0.5 bg-[#F4C430]" />
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-light">
                {pkg.fullDescription || pkg.shortDescription}
              </p>
            </div>

            {/* Interactive Route Maps visualizer */}
            <InteractiveRouteMap 
              itinerary={localItinerary} 
              destination={pkg.destination} 
              category={pkg.category}
              activeDay={activeDay}
              onDayClick={(day) => setActiveDay(day)}
            />

            {/* Day Wise Itinerary */}
            <div className="bg-white border border-stone-200 rounded p-6 md:p-8 space-y-6 shadow-xs" id="custom-itinerary-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-serif italic text-[#333333]">Day-Wise Plan</h3>
                  <p className="text-xs text-stone-400 font-light">Click a day to focus its spot coordinate on the map above.</p>
                </div>
                
                {/* Drag-and-Drop / Interactive Toggle */}
                <button
                  type="button"
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer border ${
                    isCustomizing 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md' 
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>{isCustomizing ? 'Lock Customized Order' : 'Customize Plan (Drag-n-Drop)'}</span>
                </button>
              </div>
              <div className="w-12 h-0.5 bg-[#F4C430] -mt-4" />
              
              {isCustomizing && (
                <div className="bg-amber-50/60 border border-amber-200/50 p-4 rounded text-xs text-stone-700 leading-relaxed font-light flex items-start gap-2.5 animate-fade-in">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
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
                        className={`border rounded overflow-hidden transition-all duration-300 ${
                          isCustomizing 
                            ? 'border-amber-300 shadow-sm hover:shadow-md hover:border-amber-500 bg-[#fbfbfa]' 
                            : isOpen 
                              ? 'border-[#008080]/60 ring-1 ring-[#008080]/10 shadow-sm'
                              : 'border-stone-200 bg-white'
                        }`}
                      >
                        <div
                          className={`w-full flex items-center justify-between p-4 text-left transition ${
                            isCustomizing ? 'cursor-grab' : 'cursor-pointer hover:bg-stone-50'
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
                              <div className="p-1 text-amber-500 hover:text-amber-700 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4.5 h-4.5" />
                              </div>
                            ) : (
                              <span className={`w-9 h-9 font-mono text-[10px] font-extrabold rounded-sm flex items-center justify-center shrink-0 shadow-xs border transition-colors ${
                                isOpen ? 'bg-[#008080] text-white border-transparent' : 'bg-[#f8f7f4] text-stone-600 border-stone-200'
                              }`}>
                                D{dayItem.day}
                              </span>
                            )}
                            
                            <span className="font-serif italic text-stone-850 text-xs sm:text-sm font-medium">
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
                                className="p-1 border border-stone-200 bg-white text-stone-500 hover:text-[#008080] hover:bg-stone-50 rounded disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === localItinerary.length - 1}
                                onClick={() => moveDay(index, 'down')}
                                className="p-1 border border-stone-200 bg-white text-stone-500 hover:text-[#008080] hover:bg-stone-50 rounded disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-[#008080]" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                            </div>
                          )}
                        </div>
                        
                        {isOpen && !isCustomizing && (
                          <div className="p-5 bg-white border-t border-stone-150 text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-light animate-fade-in">
                            {dayItem.description}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-stone-400 text-xs italic font-light">No itinerary has been entered for this package.</p>
                )}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="bg-white border border-stone-200 rounded p-6 md:p-8 space-y-4 shadow-xs">
                <h4 className="text-base font-serif italic text-[#008080] flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#008080]" />
                  <span>Inclusions</span>
                </h4>
                <div className="w-8 h-0.5 bg-[#008080]" />
                <ul className="space-y-3">
                  {pkg.inclusions && pkg.inclusions.length > 0 ? (
                    pkg.inclusions.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-xs sm:text-sm text-stone-600 items-start font-light">
                        <Check className="w-3.5 h-3.5 text-[#008080] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-stone-400 text-xs italic">Contact Pravaah for custom inclusions</li>
                  )}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="bg-white border border-stone-200 rounded p-6 md:p-8 space-y-4 shadow-xs">
                <h4 className="text-base font-serif italic text-rose-800 flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-600" />
                  <span>Exclusions</span>
                </h4>
                <div className="w-8 h-0.5 bg-rose-800" />
                <ul className="space-y-3">
                  {pkg.exclusions && pkg.exclusions.length > 0 ? (
                    pkg.exclusions.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-xs sm:text-sm text-stone-600 items-start font-light">
                        <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-stone-400 text-xs italic">General personal bills excluded</li>
                  )}
                </ul>
              </div>
            </div>

          </div>

          {/* Right: Sticky Enquiry Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-stone-200 rounded shadow-md p-6 space-y-6" id="detail-enquiry-card">
              
              {/* Box Heading */}
              <div className="space-y-1 pb-3 border-b border-stone-100">
                <h3 className="text-lg font-serif italic text-[#333333]">Flow into Journey</h3>
                <p className="text-xs text-stone-400 font-light leading-relaxed">
                  Enquire today, and get a customized draft itinerary within 24 hours.
                </p>
              </div>

              {submitSuccess ? (
                <div className="bg-[#008080]/10 border border-[#008080]/20 rounded p-5 text-center space-y-3 animate-fade-in">
                  <div className="w-10 h-10 bg-[#008080] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif italic text-[#333333] text-base">Enquiry Submitted!</h4>
                  <p className="text-stone-600 text-xs leading-relaxed font-light">
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
                    className="w-full py-2 bg-[#008080] hover:bg-[#006666] text-white text-[10px] font-bold uppercase tracking-wider rounded transition"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="E.g. Yash Kumar"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
                    />
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="E.g. +91 98765..."
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Email ID *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
                      />
                    </div>
                  </div>

                  {/* Date & Travelers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Travel Date *</label>
                      <input
                        type="date"
                        name="travelDate"
                        required
                        value={formData.travelDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Travelers *</label>
                      <input
                        type="number"
                        name="travelers"
                        required
                        min="1"
                        max="100"
                        value={formData.travelers}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Est. Budget per Person</label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-700 focus:outline-none focus:border-[#008080] font-medium cursor-pointer"
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
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Special Requests</label>
                    <textarea
                      name="message"
                      rows={2}
                      placeholder="Any specific hotel category, dietary preference..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#f8f7f4] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-[#008080] font-medium"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#FF7F50] hover:bg-[#ff6a33] text-white font-bold uppercase tracking-wider text-xs rounded transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Holiday Enquiry</span>
                        <Send className="w-3.5 h-3.5" />
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
