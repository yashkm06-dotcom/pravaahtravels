/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
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
import { useRoopkundIntegration } from '../RoopkundIntegrationContext';

const INITIAL_FORM_DATA = {
  fullName: '',
  email: '',
  phone: '',
  preferredMonth: 'Details to be confirmed',
  groupSize: '1 person (Solo)',
  trekkingExperience: 'Some previous trekking experience',
  contactPreference: 'WhatsApp',
  message: '',
};

interface ExpeditionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpeditionBookingModal: React.FC<ExpeditionBookingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { business, submitEnquiry } = useRoopkundIntegration();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM_DATA);
      setSubmitted(false);
      setRefId('');
      setSubmitting(false);
      setSubmissionError('');
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#FAF8F3] text-[#1D2530] rounded-3xl overflow-hidden shadow-2xl border border-[#E2DDD3] my-8 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-[#1D2530]/5 hover:bg-[#134E35] text-[#1D2530] hover:text-white backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 border border-[#E2DDD3]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-[#E2DDD3]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EE] border border-[#134E35]/20 text-[10px] font-oswald tracking-[0.25em] text-[#134E35] uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#134E35]" />
            <span>EXPEDITION ENQUIRY</span>
          </div>

          <h3 id="enquiry-modal-title" className="font-playfair text-2xl sm:text-3xl font-bold uppercase text-[#1D2530] leading-tight">
            PLAN YOUR <span className="text-[#8F4F38]">ROOPKUND EXPEDITION</span>
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-[#4A5568] font-nunito leading-relaxed text-pretty">
            Share your plans with Pravaah Travels and ask about current dates, group details and expedition availability.
          </p>
        </div>

        {/* Form or Submitted View */}
        <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#EAF5EE] border border-[#134E35]/30 text-[#134E35] flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-oswald text-[#134E35] uppercase tracking-widest font-bold">
                  EXPEDITION DOSSIER INITIATED
                </span>
                <h4 className="font-playfair text-2xl font-bold text-[#1D2530] mt-1">
                  Thank You, {formData.fullName}!
                </h4>
                <div className="mt-2 inline-block px-4 py-1.5 rounded-full bg-white border border-[#134E35]/30 text-xs font-oswald text-[#134E35] tracking-widest font-semibold shadow-sm">
                  ENQUIRY REFERENCE: {refId}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#4A5568] font-nunito max-w-md mx-auto leading-relaxed">
                Pravaah Travels has received your enquiry for <strong className="text-[#1D2530]">{formData.preferredMonth}</strong>. The team will follow up via <strong className="text-[#1D2530]">{formData.contactPreference}</strong> after reviewing your request.
              </p>

              {/* Direct WhatsApp Fast Track */}
              <div className="pt-4">
                <a
                  href={business.whatsappUrl(`Hi Pravaah Travels, I just submitted Roopkund enquiry reference ${refId}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#134E35] hover:bg-[#0E3B27] text-white text-xs font-oswald font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>INSTANT CHAT ON WHATSAPP</span>
                </a>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full border border-[#E2DDD3] text-[#4A5568] hover:text-[#1D2530] hover:border-[#134E35] text-xs font-oswald font-semibold tracking-wider uppercase transition-colors"
                >
                  CLOSE WINDOW
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
                    YOUR FULL NAME *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    maxLength={120}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Arjun Sharma"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm placeholder:text-[#A0AEC0] transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={254}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="arjun@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm placeholder:text-[#A0AEC0] transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Phone & Contact Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
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
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm placeholder:text-[#A0AEC0] transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
                    PREFERRED CONTACT MODE
                  </label>
                  <select
                    name="contactPreference"
                    value={formData.contactPreference}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm transition-colors shadow-sm"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Phone Call">Phone call</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              {/* Preferred Season & Group Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
                    PREFERRED EXPEDITION SEASON
                  </label>
                  <select
                    name="preferredMonth"
                    value={formData.preferredMonth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm transition-colors shadow-sm"
                  >
                    <option value="Details to be confirmed">Details to be confirmed</option>
                    <option value="Discuss seasonal options">Discuss seasonal options</option>
                    <option value="Subject to final expedition confirmation">Subject to final expedition confirmation</option>
                    <option value="Custom Group / Flexible Dates">Flexible / custom dates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
                    GROUP SIZE
                  </label>
                  <select
                    name="groupSize"
                    value={formData.groupSize}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm transition-colors shadow-sm"
                  >
                    <option value="1 person (Solo)">1 person (Solo Trekker)</option>
                    <option value="2 people (Couple / Duo)">2 people (Couple / Duo)</option>
                    <option value="3-5 people (Small Group)">3-5 people (Small Friends Group)</option>
                    <option value="6-12 people (Full Private Batch)">6-12 people (Private Dedicated Cohort)</option>
                  </select>
                </div>
              </div>

              {/* Trekking Experience */}
              <div>
                <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
                  YOUR MOUNTAIN / TREKKING BACKGROUND
                </label>
                <select
                  name="trekkingExperience"
                  value={formData.trekkingExperience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm transition-colors shadow-sm"
                >
                  <option value="First trekking experience">First trekking experience</option>
                  <option value="Some previous trekking experience">Some previous trekking experience</option>
                  <option value="Extensive previous trekking experience">Extensive previous trekking experience</option>
                  <option value="Formal mountaineering training">Formal mountaineering training</option>
                </select>
              </div>

              {/* Message / Custom Requirements */}
              <div>
                <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-semibold mb-1.5">
                  SPECIAL QUESTIONS OR DIETARY / FITNESS NOTES (OPTIONAL)
                </label>
                <textarea
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={4500}
                  placeholder="Ask about dates, gear, travel coordination, or other expedition details."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#E2DDD3] focus:border-[#134E35] focus:outline-none text-[#1D2530] text-sm placeholder:text-[#A0AEC0] transition-colors resize-none shadow-sm"
                />
              </div>

              {/* Trust Badge & Submit Button */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#4A5568] font-nunito">
                  <ShieldCheck className="w-4 h-4 text-[#134E35] shrink-0" />
                  <span>Your details are used to respond to this enquiry</span>
                </div>

                {submissionError && (
                  <p role="alert" className="sr-only">
                    {submissionError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#8F4F38] hover:bg-[#7A3F2C] text-white text-xs font-oswald font-bold tracking-[0.2em] uppercase transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <span>SUBMIT EXPEDITION DOSSIER</span>
                  <ArrowRight className="w-4 h-4" />
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
