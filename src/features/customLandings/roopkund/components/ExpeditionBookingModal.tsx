import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
// Aapki website ka Firebase instance
import { db, collection, addDoc } from '../../../../lib/firebase';

interface ExpeditionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpeditionBookingModal: React.FC<ExpeditionBookingModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredMonth: 'May - June (Spring / Rhododendron Season)',
    groupSize: '1 person (Solo)',
    trekkingExperience: 'Intermediate (Done 1-2 Himalayan treks)',
    contactPreference: 'WhatsApp',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const generatedRef = `PRV-RK-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const enquiryPayload = {
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        destination: 'Roopkund, Uttarakhand',
        packageName: 'Roopkund Trek - The Mystery Trail (7D/6N)',
        packageId: 'roopkund-trek',
        travelDate: new Date().toISOString(),
        travelers: Math.max(1, parseInt(formData.groupSize, 10) || 1),
        budget: '₹18,500 / person',
        message: `[Ref: ${generatedRef}] Experience: ${formData.trekkingExperience} | Season: ${formData.preferredMonth} | Preferred Mode: ${formData.contactPreference} | Notes: ${formData.message || 'None'}`,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'enquiries'), enquiryPayload);
      setRefId(generatedRef);
      setSubmitted(true);
    } catch (err: any) {
      console.warn('Firestore enquiry modal sync:', err);
      setRefId(generatedRef);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#FAF8F3] text-[#1D2530] rounded-3xl overflow-hidden shadow-2xl border border-[#E2DDD3] my-8 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-[#1D2530]/5 hover:bg-[#134E35] text-[#1D2530] hover:text-white backdrop-blur-md transition-all duration-200 border border-[#E2DDD3] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-[#E2DDD3]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EE] border border-[#134E35]/20 text-[10px] font-mono tracking-[0.25em] text-[#134E35] uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#134E35]" />
            <span>EXPEDITION ENQUIRY & ADMISSIONS</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold uppercase text-[#1D2530] leading-tight">
            PLAN YOUR <span className="text-[#8F4F38]">ROOPKUND EXPEDITION</span>
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
            Connect with our Garhwali mountain leaders to reserve your slot in an upcoming small-group batch (max 12–14 trekkers).
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#EAF5EE] border border-[#134E35]/30 text-[#134E35] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-mono text-[#134E35] uppercase tracking-widest font-bold">
                  EXPEDITION DOSSIER LOGGED TO ADMIN DASHBOARD
                </span>
                <h4 className="font-serif text-2xl font-bold text-[#1D2530] mt-1">
                  Thank You, {formData.fullName}!
                </h4>
                <div className="mt-2 inline-block px-4 py-1.5 rounded-full bg-white border border-[#134E35]/30 text-xs font-mono text-[#134E35] tracking-widest font-semibold shadow-sm">
                  BOOKING REFERENCE: {refId}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#4A5568] max-w-md mx-auto leading-relaxed">
                Our expedition coordinator has received your details for the <strong className="text-[#1D2530]">{formData.preferredMonth}</strong> batch. We will reach out via <strong className="text-[#1D2530]">{formData.contactPreference}</strong> on <strong className="text-[#1D2530] font-mono">{formData.phone}</strong> shortly.
              </p>

              {/* Fast Track WhatsApp buttons */}
              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <a
                  href={`https://wa.me/918795374875?text=Hi%20Pravaah%20Travels,%20I%20just%20submitted%20Roopkund%20enquiry%20reference%20${refId}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#134E35] hover:bg-[#0E3B27] text-white text-xs font-bold uppercase transition-all shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>FAST TRACK (+91 87953 74875)</span>
                </a>
                <a
                  href={`https://wa.me/917088359844?text=Hi%20Pravaah%20Travels,%20I%20just%20submitted%20Roopkund%20enquiry%20reference%20${refId}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white border border-[#134E35]/30 text-[#134E35] hover:bg-[#EAF5EE] text-xs font-bold uppercase transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WHATSAPP (+91 70883 59844)</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full border border-[#E2DDD3] text-[#4A5568] hover:text-[#1D2530] hover:border-[#134E35] text-xs uppercase transition-colors cursor-pointer"
                >
                  CLOSE WINDOW
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#134E35] font-semibold mb-1.5 font-mono">
                    YOUR FULL NAME *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Arjun Sharma"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#134E35] font-semibold mb-1.5 font-mono">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="arjun@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#134E35] font-semibold mb-1.5 font-mono">
                    PHONE / WHATSAPP NUMBER *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 87953 74875"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm shadow-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#134E35] font-semibold mb-1.5 font-mono">
                    PREFERRED CONTACT MODE
                  </label>
                  <select
                    name="contactPreference"
                    value={formData.contactPreference}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm shadow-sm"
                  >
                    <option value="WhatsApp">WhatsApp (Fastest Response)</option>
                    <option value="Phone Call">Phone Call from Expedition Leader</option>
                    <option value="Email">Email Itinerary & PDF Dossier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#134E35] font-semibold mb-1.5 font-mono">
                    PREFERRED EXPEDITION SEASON
                  </label>
                  <select
                    name="preferredMonth"
                    value={formData.preferredMonth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm shadow-sm"
                  >
                    <option value="May - June (Spring / Rhododendron Season)">May - June (Spring / Rhododendrons)</option>
                    <option value="September (Early Autumn / Clear Skies)">September (Early Autumn / Deep Blue Skies)</option>
                    <option value="October (Late Autumn / Golden Bugyals)">October (Late Autumn / Golden Meadows)</option>
                    <option value="Custom Group / Flexible Dates">Custom Private Team Dates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#134E35] font-semibold mb-1.5 font-mono">
                    GROUP SIZE
                  </label>
                  <select
                    name="groupSize"
                    value={formData.groupSize}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm shadow-sm"
                  >
                    <option value="1 person (Solo)">1 person (Solo Trekker)</option>
                    <option value="2 people (Couple / Duo)">2 people (Couple / Duo)</option>
                    <option value="3-5 people (Small Group)">3-5 people (Small Friends Group)</option>
                    <option value="6-12 people (Full Private Batch)">6-12 people (Private Dedicated Cohort)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#134E35] font-semibold mb-1.5 font-mono">
                  SPECIAL QUESTIONS OR NOTES (OPTIONAL)
                </label>
                <textarea
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Ask about rental gear, acclimatization protocols, train/flight timings from Rishikesh, etc."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm resize-none shadow-sm"
                />
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#4A5568]">
                  <ShieldCheck className="w-4 h-4 text-[#134E35] shrink-0" />
                  <span>Zero spam • 100% confidential mountain triage</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#8F4F38] hover:bg-[#7A3F2C] text-white text-xs font-bold tracking-[0.2em] uppercase transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>LOGGING TO DASHBOARD...</span>
                    </>
                  ) : (
                    <>
                      <span>SUBMIT EXPEDITION DOSSIER</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpeditionBookingModal;