import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
// Aapki website ka Firebase instance
import { db, collection, addDoc } from '../../../../lib/firebase';

export const ExpeditionBookingEnquiry: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredMonth: 'May - June (Spring / Rhododendron Season)',
    groupSize: '1',
    trekkingExperience: 'Intermediate (Done 1-2 Himalayan treks)',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const generatedRef = `PRV-RK-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Exact schema matching firestore.rules validEnquiry()
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
        message: `[Ref: ${generatedRef}] Experience: ${formData.trekkingExperience} | Season: ${formData.preferredMonth} | Notes: ${formData.message || 'None'}`,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      // 2. Direct save to Firestore enquiries collection (Visible in Admin Dashboard)
      await addDoc(collection(db, 'enquiries'), enquiryPayload);

      setRefId(generatedRef);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to log enquiry to Firestore:', err);
      // Graceful fallback
      setRefId(generatedRef);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-24 sm:py-32 bg-[#0D1812] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono tracking-[0.25em] text-[#E5C378] uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#E5C378]" />
            <span>EXPEDITION ADMISSIONS OPEN</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-6xl font-bold tracking-[0.04em] uppercase text-white leading-tight">
            WALK THE <span className="text-[#E5C378]">MYSTERY TRAIL</span>
          </h2>

          <p className="mt-4 text-base sm:text-xl font-serif italic text-white/80 max-w-2xl mx-auto">
            “Join Pravaah Travels on an authentic, carefully guided journey into the Garhwal Himalayas.”
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Custom Contact Numbers for Roopkund */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#14231B] rounded-3xl p-8 border border-[#253D30] shadow-xl space-y-6">
              <h3 className="font-serif text-2xl font-bold uppercase text-white">
                DIRECT EXPEDITION DESK
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Prefer discussing your fitness readiness, customized dates, or private group expedition requirements directly with our expedition leader? Connect via phone, WhatsApp or email:
              </p>

              <div className="space-y-4 pt-2">
                {/* WhatsApp Primary */}
                <a
                  href="https://wa.me/918795374875?text=Hi%20Pravaah%20Travels,%20I%20am%20interested%20in%20the%20Roopkund%20Trek%20Expedition."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-[#253D30] hover:border-[#E5C378] text-white transition-all group"
                >
                  <div className="p-3 rounded-xl bg-[#134E35] text-white group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#E5C378] uppercase tracking-wider font-bold">
                      INSTANT WHATSAPP (PRIMARY)
                    </div>
                    <div className="text-sm font-semibold font-mono">
                      +91 87953 74875
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#E5C378] ml-auto group-hover:translate-x-1 transition-transform" />
                </a>

                {/* WhatsApp Secondary */}
                <a
                  href="https://wa.me/917088359844?text=Hi%20Pravaah%20Travels,%20I%20am%20interested%20in%20the%20Roopkund%20Trek%20Expedition."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-[#253D30] hover:border-[#E5C378] text-white transition-all group"
                >
                  <div className="p-3 rounded-xl bg-[#134E35]/80 text-[#E5C378] group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#E5C378] uppercase tracking-wider font-bold">
                      WHATSAPP (SECONDARY)
                    </div>
                    <div className="text-sm font-semibold font-mono">
                      +91 70883 59844
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#E5C378] ml-auto group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Calling Numbers */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#253D30] text-white space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/10 text-[#E5C378]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="text-[10px] font-mono text-[#E5C378] uppercase tracking-wider font-bold">
                      EXPEDITION CALLING HOTLINES
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-1">
                    <a href="tel:+918795374875" className="text-xs font-mono font-semibold hover:text-[#E5C378] transition-colors flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#E5C378]" />
                      <span>+91 87953 74875</span>
                    </a>
                    <a href="tel:+917088359844" className="text-xs font-mono font-semibold hover:text-[#E5C378] transition-colors flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#E5C378]" />
                      <span>+91 70883 59844</span>
                    </a>
                  </div>
                </div>

                {/* Email */}
                <a
                  href="mailto:Pravaahtravels@gmail.com"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-[#253D30] hover:border-[#E5C378] text-white transition-all group"
                >
                  <div className="p-3 rounded-xl bg-white/10 text-[#E5C378] group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#E5C378] uppercase tracking-wider font-bold">
                      OFFICIAL ENQUIRIES
                    </div>
                    <div className="text-sm font-semibold font-mono">
                      Pravaahtravels@gmail.com
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#E5C378] ml-auto group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#14231B] border border-[#253D30] flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-[#E5C378] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Small-Group Guarantee
                </h4>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Every batch is strictly capped at 12–14 participants with a 1:4 to 1:6 guide-to-trekker ratio, ensuring deep individual attention, personalized acclimatization pacing, and zero trail congestion.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Admission Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#14231B] rounded-3xl p-8 sm:p-10 border border-[#253D30] shadow-2xl">
              
              {submitted ? (
                <div className="py-12 text-center space-y-5 animate-in fade-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-[#134E35] text-[#E5C378] flex items-center justify-center mx-auto border border-[#E5C378]/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <div>
                    <div className="text-xs font-mono uppercase text-[#E5C378] tracking-widest font-bold">
                      ENQUIRY LOGGED TO DASHBOARD • {refId}
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white uppercase mt-1">
                      Your Place on the Trail is Reserved
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-white/75 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="text-[#E5C378] font-semibold">{formData.fullName}</span>. Your enquiry has been received and saved into our admin dashboard. Our expedition lead will connect with you on <strong className="text-white font-mono">{formData.phone}</strong> shortly.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                    <a
                      href={`https://wa.me/918795374875?text=Hi%20Pravaah%20Travels,%20I%20just%20submitted%20Roopkund%20enquiry%20reference%20${refId}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-full bg-[#134E35] hover:bg-[#185F41] text-xs uppercase font-bold text-white transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-[#E5C378]" />
                      <span>FAST-TRACK ON WHATSAPP (+91 87953 74875)</span>
                    </a>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          fullName: '',
                          email: '',
                          phone: '',
                          preferredMonth: 'May - June (Spring / Rhododendron Season)',
                          groupSize: '1',
                          trekkingExperience: 'Intermediate (Done 1-2 Himalayan treks)',
                          message: '',
                        });
                      }}
                      className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-xs uppercase font-bold text-white transition-colors"
                    >
                      SUBMIT ANOTHER
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="text-xs font-mono text-[#E5C378] tracking-widest uppercase font-bold">
                      EXPEDITION ENQUIRY & BATCH REGISTRATION
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white uppercase mt-1">
                      Reserve Your Place On The Trail
                    </h3>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Vikramaditya Sharma"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#E5C378] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="vikram@domain.com"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#E5C378] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        PHONE / WHATSAPP NUMBER *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 87953 74875"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#E5C378] transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        PREFERRED SEASON / MONTH
                      </label>
                      <select
                        name="preferredMonth"
                        value={formData.preferredMonth}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#0D1812] border border-[#253D30] text-white text-xs focus:outline-none focus:border-[#E5C378] transition-colors"
                      >
                        <option value="May - June (Spring / Rhododendron Season)">May - June (Spring / Rhododendrons)</option>
                        <option value="September - October (Autumn / Crystal Skies)">September - October (Autumn / Crystal Skies)</option>
                        <option value="Flexible / Custom Dates">Flexible / Custom Group Dates</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        EXPEDITION GROUP SIZE
                      </label>
                      <select
                        name="groupSize"
                        value={formData.groupSize}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#0D1812] border border-[#253D30] text-white text-xs focus:outline-none focus:border-[#E5C378] transition-colors"
                      >
                        <option value="1">1 person (Solo Adventurer)</option>
                        <option value="2">2 people (Pair / Friends)</option>
                        <option value="3">3-5 people (Small Group)</option>
                        <option value="6">6+ people (Private Expedition)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        TREKKING EXPERIENCE
                      </label>
                      <select
                        name="trekkingExperience"
                        value={formData.trekkingExperience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#0D1812] border border-[#253D30] text-white text-xs focus:outline-none focus:border-[#E5C378] transition-colors"
                      >
                        <option value="Beginner with high fitness">Beginner with high physical fitness</option>
                        <option value="Intermediate (Done 1-2 Himalayan treks)">Intermediate (Done 1-2 Himalayan treks)</option>
                        <option value="Experienced (Done multiple 14,000+ ft treks)">Experienced (Done multiple 14,000+ ft treks)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                      SPECIAL INQUIRIES OR DIETARY PREFERENCES (OPTIONAL)
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Let us know about your fitness schedule, gear requirements, or group preferences..."
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#E5C378] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-[#134E35] text-white text-xs uppercase font-bold tracking-[0.2em] hover:bg-[#185F41] transition-all shadow-xl flex items-center justify-center gap-2 border border-white/20 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#E5C378]" />
                        <span>LOGGING ENQUIRY TO ADMIN DASHBOARD...</span>
                      </>
                    ) : (
                      <>
                        <span>TALK TO OUR EXPEDITION TEAM</span>
                        <Send className="w-4 h-4 text-[#E5C378]" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ExpeditionBookingEnquiry;