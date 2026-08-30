/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { EnquiryFormData } from '../types';
import { useRoopkundIntegration } from '../RoopkundIntegrationContext';

export const ExpeditionBookingEnquiry: React.FC = () => {
  const { business, submitEnquiry } = useRoopkundIntegration();
  const [formData, setFormData] = useState<EnquiryFormData>({
    fullName: '',
    email: '',
    phone: '',
    preferredMonth: 'Details to be confirmed',
    groupSize: '1 person (Solo)',
    trekkingExperience: 'Some previous trekking experience',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmissionError('');
    try {
      const referenceId = await submitEnquiry(formData);
      setRefId(referenceId);
      setSubmitted(true);
    } catch (error) {
      console.error('Roopkund enquiry submission failed:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Unable to submit your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="booking" className="py-24 sm:py-32 bg-[#0D1812] text-white relative overflow-hidden">
      {/* Topographic Glow Texture */}
      <div className="absolute inset-0 bg-dark-noise opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#134E35]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E5C378]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-oswald tracking-[0.25em] text-[#E5C378] uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#E5C378]" />
            <span>EXPEDITION ENQUIRY</span>
          </div>

          <h2 className="font-playfair text-4xl sm:text-6xl font-bold tracking-[0.04em] uppercase text-white leading-tight">
            WALK THE <span className="text-[#E5C378]">MYSTERY TRAIL</span>
          </h2>

          <p className="mt-4 text-base sm:text-xl font-garamond italic text-white/80 max-w-2xl mx-auto">
            “Ask Pravaah Travels for the verified route, dates and operating details.”
          </p>
        </div>

        {/* 2-Column Booking Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Concierge Contacts & Trust Signals */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#14231B] rounded-3xl p-8 border border-[#253D30] shadow-xl space-y-6">
              <h3 className="font-playfair text-2xl font-bold uppercase text-white">
                Direct Expedition Desk
              </h3>
              <p className="text-xs sm:text-sm text-white/70 font-nunito leading-relaxed">
                Prefer discussing possible dates or group requirements directly with Pravaah Travels? Connect via phone, WhatsApp or email:
              </p>

              <div className="space-y-4 pt-2">
                {/* WhatsApp Direct */}
                <a
                  href={business.whatsappUrl('Hi Pravaah Travels, I am interested in the Roopkund Trek.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-[#253D30] hover:border-[#E5C378] text-white transition-all group"
                >
                  <div className="p-3 rounded-xl bg-[#134E35] text-white group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-oswald text-[#E5C378] uppercase tracking-wider font-bold">
                      VERIFIED WHATSAPP
                    </div>
                    <div className="text-sm font-semibold font-nunito">
                      {business.whatsapp || 'Details to be confirmed'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#E5C378] ml-auto group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Direct Phone */}
                <a
                  href={business.phoneHref || undefined}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-[#253D30] hover:border-[#E5C378] text-white transition-all group"
                >
                  <div className="p-3 rounded-xl bg-white/10 text-[#E5C378] group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-oswald text-[#E5C378] uppercase tracking-wider font-bold">
                      EXPEDITION HOTLINE
                    </div>
                    <div className="text-sm font-semibold font-nunito">
                      {business.phone || 'Details to be confirmed'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#E5C378] ml-auto group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Direct Email */}
                <a
                  href={business.email ? `mailto:${business.email}` : undefined}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-[#253D30] hover:border-[#E5C378] text-white transition-all group"
                >
                  <div className="p-3 rounded-xl bg-white/10 text-[#E5C378] group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-oswald text-[#E5C378] uppercase tracking-wider font-bold">
                      OFFICIAL ENQUIRIES
                    </div>
                    <div className="text-sm font-semibold font-nunito">
                      {business.email || 'Details to be confirmed'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#E5C378] ml-auto group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Expedition Safety Guarantee Badge */}
            <div className="p-6 rounded-3xl bg-[#14231B] border border-[#253D30] flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-[#E5C378] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider">
                  Expedition Details
                </h4>
                <p className="text-xs text-white/60 font-nunito mt-1 leading-relaxed">
                  Group size, operating plan, support arrangements and expedition protocols are subject to final confirmation by Pravaah Travels.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Expedition Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#14231B] rounded-3xl p-8 sm:p-10 border border-[#253D30] shadow-2xl">
              
              {submitted ? (
                <div className="py-12 text-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 rounded-full bg-[#134E35] text-[#E5C378] flex items-center justify-center mx-auto border border-[#E5C378]/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <div>
                    <div className="text-xs font-oswald uppercase text-[#E5C378] tracking-widest font-bold">
                      DOSSIER RECEIVED • {refId}
                    </div>
                    <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-white uppercase mt-1">
                      Your Expedition Request is Logged
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-white/75 font-nunito max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="text-[#E5C378] font-semibold">{formData.fullName}</span>. Pravaah Travels has received your enquiry and will follow up using the contact details you provided.
                  </p>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          fullName: '',
                          email: '',
                          phone: '',
                          preferredMonth: 'Details to be confirmed',
                          groupSize: '1 person (Solo)',
                          trekkingExperience: 'Some previous trekking experience',
                          message: '',
                        });
                      }}
                      className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-[#134E35] text-xs font-oswald uppercase tracking-wider font-bold text-white transition-colors"
                    >
                      SUBMIT ANOTHER ENQUIRY
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="text-xs font-oswald text-[#E5C378] tracking-widest uppercase font-bold">
                      EXPEDITION ENQUIRY
                    </div>
                    <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-white uppercase mt-1">
                      Ask About The Trail
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-oswald uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        maxLength={120}
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Yash Sharma"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs font-nunito focus:outline-none focus:border-[#E5C378] transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-oswald uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        maxLength={254}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Yash@domain.com"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs font-nunito focus:outline-none focus:border-[#E5C378] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div>
                      <label className="block text-[10px] font-oswald uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        PHONE / WHATSAPP NUMBER *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        minLength={7}
                        maxLength={24}
                        pattern="[0-9+() .-]{7,24}"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={business.phone || '+91 phone number'}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs font-nunito focus:outline-none focus:border-[#E5C378] transition-colors"
                      />
                    </div>

                    {/* Preferred Month */}
                    <div>
                      <label className="block text-[10px] font-oswald uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        PREFERRED SEASON / MONTH
                      </label>
                      <select
                        name="preferredMonth"
                        value={formData.preferredMonth}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-black/80 border border-[#253D30] text-white text-xs font-nunito focus:outline-none focus:border-[#E5C378] transition-colors"
                      >
                        <option value="Details to be confirmed">Details to be confirmed</option>
                        <option value="Discuss seasonal options">Discuss seasonal options</option>
                        <option value="Flexible / Custom Dates">Flexible / custom dates</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Group Size */}
                    <div>
                      <label className="block text-[10px] font-oswald uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        EXPEDITION GROUP SIZE
                      </label>
                      <select
                        name="groupSize"
                        value={formData.groupSize}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-black/80 border border-[#253D30] text-white text-xs font-nunito focus:outline-none focus:border-[#E5C378] transition-colors"
                      >
                        <option value="1 person (Solo)">1 person (Solo Adventurer)</option>
                        <option value="2 people (Pair)">2 people (Pair / Friends)</option>
                        <option value="3-5 people (Small Group)">3-5 people (Small Group)</option>
                        <option value="6+ people (Private Expedition)">6+ people (Private Expedition)</option>
                      </select>
                    </div>

                    {/* Trekking Experience */}
                    <div>
                      <label className="block text-[10px] font-oswald uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                        TREKKING EXPERIENCE
                      </label>
                      <select
                        name="trekkingExperience"
                        value={formData.trekkingExperience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-black/80 border border-[#253D30] text-white text-xs font-nunito focus:outline-none focus:border-[#E5C378] transition-colors"
                      >
                        <option value="First trekking experience">First trekking experience</option>
                        <option value="Some previous trekking experience">Some previous trekking experience</option>
                        <option value="Extensive previous trekking experience">Extensive previous trekking experience</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[10px] font-oswald uppercase tracking-wider text-[#E5C378] mb-1.5 font-bold">
                      SPECIAL INQUIRIES OR DIETARY PREFERENCES (OPTIONAL)
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={4500}
                      placeholder="Let us know about your fitness schedule, gear requirements, or group preferences..."
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#253D30] text-white placeholder-white/30 text-xs font-nunito focus:outline-none focus:border-[#E5C378] transition-colors"
                    />
                  </div>

                  {submissionError && (
                    <p role="alert" className="sr-only">
                      {submissionError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-[#134E35] text-white font-raleway text-xs uppercase font-bold tracking-[0.2em] hover:bg-[#185F41] transition-all shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] border border-white/20"
                  >
                    <span>TALK TO OUR EXPEDITION TEAM</span>
                    <Send className="w-4 h-4 text-[#E5C378]" />
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
