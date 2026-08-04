import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Compass,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { db, collection, addDoc } from '../lib/firebase';
import { Enquiry } from '../types';

interface PremiumEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialFormState = {
  name: '',
  phone: '',
  email: '',
  destination: '',
  travelDate: '',
  adults: 2,
  children: 0,
  budget: 'Rs. 20,000 - Rs. 50,000',
  travelType: 'Original',
  preferredContactMethod: 'Phone Call',
  message: '',
};

export default function PremiumEnquiryModal({ isOpen, onClose, onSuccess }: PremiumEnquiryModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const successTimeoutRef = useRef<number | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => firstFieldRef.current?.focus(), 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('aria-hidden'));

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'adults' || name === 'children' ? Math.max(0, Number(value) || 0) : value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.destination.trim() || !formData.travelDate) {
      return 'Please fill in all required fields.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (formData.phone.replace(/\D/g, '').length < 7) {
      return 'Please enter a valid phone number.';
    }

    if (formData.adults < 1) {
      return 'At least one adult traveler is required.';
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setSubmitting(true);

    const travelers = Number(formData.adults) + Number(formData.children);
    const detailMessage = [
      formData.message.trim() || 'Hi, I want to discuss a customized travel plan.',
      '',
      `Travel type: ${formData.travelType}`,
      `Preferred contact method: ${formData.preferredContactMethod}`,
      `Adults: ${formData.adults}`,
      `Children: ${formData.children}`,
    ].join('\n');

    try {
      const enquiryPayload: Omit<Enquiry, 'id'> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        destination: formData.destination.trim(),
        travelDate: formData.travelDate,
        travelers,
        budget: formData.budget,
        message: detailMessage,
        status: 'New',
        source: 'Premium Enquiry',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'enquiries'), enquiryPayload);
      onSuccess();
      setFormData(initialFormState);
      setSuccessMessage('Your travel request has been sent. Our curator will contact you shortly.');
      successTimeoutRef.current = window.setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1800);
    } catch (error) {
      console.error('Error creating floating enquiry:', error);
      setErrorMessage('We could not submit your enquiry right now. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-stone-950/72 px-4 py-6 backdrop-blur-md animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-enquiry-title"
        aria-describedby="premium-enquiry-description"
        className="relative w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_34px_100px_rgba(0,0,0,0.38)]"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/90 text-stone-700 shadow-sm transition hover:bg-white hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Close enquiry form"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid max-h-[90vh] overflow-y-auto lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="relative min-h-[280px] overflow-hidden bg-[#081E2A] p-7 text-white sm:p-9">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80")' }}
            />
            <div className="absolute inset-0 bg-linear-to-br from-[#081E2A] via-[#081E2A]/88 to-[#4DA528]/35" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                  <Compass className="h-3.5 w-3.5 text-[#4DA528]" />
                  Free quote
                </span>
                <h2 id="premium-enquiry-title" className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  Plan your next unforgettable journey.
                </h2>
                <p id="premium-enquiry-description" className="mt-4 text-sm leading-7 text-white/72">
                  Share a few details and a Pravaah travel curator will prepare a tailored route, hotel, and transport plan.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-white/78">
                {['Expert route planning', 'Custom budget guidance', 'Fast callback support'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-[16px] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
                    <CheckCircle2 className="h-4 w-4 text-[#4DA528]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7 lg:p-9">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#4DA528]">Travel enquiry</span>
              <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Get a premium trip quote</h3>
              <p className="mt-1 text-sm leading-6 text-stone-500">Required fields are marked with an asterisk.</p>
            </div>

            {successMessage && (
              <div className="flex items-start gap-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-3 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  <User className="h-3.5 w-3.5 text-[#4DA528]" />
                  Full Name *
                </span>
                <input ref={firstFieldRef} name="name" value={formData.name} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  <Phone className="h-3.5 w-3.5 text-[#4DA528]" />
                  Phone Number *
                </span>
                <input type="tel" name="phone" value={formData.phone} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  <Mail className="h-3.5 w-3.5 text-[#4DA528]" />
                  Email Address *
                </span>
                <input type="email" name="email" value={formData.email} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  <MapPin className="h-3.5 w-3.5 text-[#4DA528]" />
                  Destination *
                </span>
                <input name="destination" value={formData.destination} onChange={handleFieldChange} placeholder="Uttarakhand, Ladakh, Himachal..." className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  <CalendarDays className="h-3.5 w-3.5 text-[#4DA528]" />
                  Travel Dates *
                </span>
                <input type="date" name="travelDate" value={formData.travelDate} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  <Wallet className="h-3.5 w-3.5 text-[#4DA528]" />
                  Budget
                </span>
                <select name="budget" value={formData.budget} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15">
                  <option>Rs. 20,000 - Rs. 50,000</option>
                  <option>Rs. 50,000 - Rs. 1,00,000</option>
                  <option>Rs. 1,00,000 - Rs. 2,50,000</option>
                  <option>Rs. 2,50,000+</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                  <Users className="h-3.5 w-3.5 text-[#4DA528]" />
                  Adults
                </span>
                <input type="number" min="1" name="adults" value={formData.adults} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Children</span>
                <input type="number" min="0" name="children" value={formData.children} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Travel Type</span>
                <select name="travelType" value={formData.travelType} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15">
                  <option>Standard</option>
                  <option>Original</option>
                  <option>Luxury</option>
                  <option>Premium</option>
                  <option>Corporate Group</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Preferred Contact</span>
                <select name="preferredContactMethod" value={formData.preferredContactMethod} onChange={handleFieldChange} className="h-12 w-full rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15">
                  <option>Phone Call</option>
                  <option>WhatsApp</option>
                  <option>Email</option>
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">Additional Message</span>
              <textarea name="message" value={formData.message} onChange={handleFieldChange} rows={4} placeholder="Hotel preference, pace, pickup city, special requests..." className="w-full resize-none rounded-[14px] border border-stone-200 bg-[#fffaf1] px-4 py-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#4DA528] focus:bg-white focus:ring-2 focus:ring-[#4DA528]/15" />
            </label>

            <div className="flex flex-col gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-6 text-stone-500">We reuse the existing enquiry system and send this request to the Pravaah travel team.</p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#4DA528] px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_16px_34px_rgba(77,165,40,0.2)] transition hover:-translate-y-0.5 hover:bg-[#FF970D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
