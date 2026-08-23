import React, { useState } from 'react';
import { Send, Mail, Phone, MapPin, Check, Compass, Clock, AlertCircle } from 'lucide-react';
import { db, collection, addDoc } from '../lib/firebase';
import { Enquiry } from '../types';

interface ContactViewProps {
  onEnquirySuccess: () => void;
}

export default function ContactView({ onEnquirySuccess }: ContactViewProps) {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    destination: '',
    travelDate: '',
    travelers: 2,
    budget: '₹20,000 - ₹50,000',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'travelers' ? parseInt(value) || 1 : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    // Field Checks
    if (!formData.name || !formData.phone || !formData.email || !formData.destination || !formData.travelDate) {
      setErrorMsg('Please fill in all required fields marked with *');
      setSubmitting(false);
      return;
    }

    try {
      const enquiryPayload: Omit<Enquiry, 'id'> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        destination: formData.destination,
        travelDate: formData.travelDate,
        travelers: formData.travelers,
        budget: formData.budget,
        message: formData.message || 'Hi, I want to discuss a customized package.',
        status: 'New',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'enquiries'), enquiryPayload);
      setSubmitSuccess(true);
      onEnquirySuccess();
    } catch (error) {
      console.error('Error creating contact enquiry:', error);
      setErrorMsg('Failed to submit enquiry. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const officeHours = [
    { days: 'Monday - Friday', hours: '09:00 AM - 07:00 PM' },
    { days: 'Saturday', hours: '10:00 AM - 04:00 PM' },
    { days: 'Sunday', hours: 'Emergency Support Only' }
  ];

  return (
    <div id="contact-view" className="animate-fade-in bg-[#F7F8F4] py-20">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-extrabold text-[#4DA528] tracking-[0.2em] uppercase">Plan with Experts</span>
          <h2 className="text-[38px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">
            Initiate Your Custom Holiday Flow
          </h2>
          <div className="w-16 h-0.5 bg-[#FF970D] mx-auto mt-3" />
          <p className="text-stone-500 text-sm sm:text-base leading-7 max-w-md mx-auto">
            Fill out our structured holiday planner form, and get assigned to a dedicated travel curator within hours.
          </p>
        </div>

        {/* Splits: Form Left, details Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form: Column 7 */}
          <div className="lg:col-span-7 bg-white border border-stone-200 p-6 sm:p-8 rounded-[12px] shadow-[0_14px_38px_rgba(18,38,32,0.08)]" id="contact-form-card">
            {submitSuccess ? (
              <div className="text-center py-12 space-y-4 animate-fade-in">
                <div className="w-12 h-12 bg-[#4DA528] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-stone-950">Enquiry Received!</h3>
                <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-light">
                  Thank you for submitting your custom holiday plan. A holiday curator from Pravaah Travels will review your dates and destination, draft a preliminary itinerary, and connect with you shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      destination: '',
                      travelDate: '',
                      travelers: 2,
                      budget: '₹20,000 - ₹50,000',
                      message: ''
                    });
                  }}
                  className="rounded-[5px] px-6 py-3 bg-[#4DA528] hover:bg-[#FF970D] text-white text-[10px] font-bold uppercase tracking-wider transition"
                >
                  Plan Another Custom Trip
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <h3 className="text-xl font-extrabold text-stone-950 border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#4DA528] animate-spin-slow" />
                  <span>Custom Holiday Planner Form</span>
                </h3>

                {errorMsg && (
                  <div role="alert" className="flex items-start gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-800 focus:outline-none focus:border-[#4DA528] font-medium"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="E.g. +91 98765..."
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-800 focus:outline-none focus:border-[#4DA528] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-800 focus:outline-none focus:border-[#4DA528] font-medium"
                    />
                  </div>

                  {/* Destination */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Where to? (Destination) *</label>
                    <input
                      type="text"
                      name="destination"
                      required
                      placeholder="E.g. Leh Ladakh, South Goa"
                      value={formData.destination}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-800 focus:outline-none focus:border-[#4DA528] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Approx. Travel Date *</label>
                    <input
                      type="date"
                      name="travelDate"
                      required
                      value={formData.travelDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-800 font-medium transition focus:border-[#4DA528] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/20 cursor-pointer"
                    />
                  </div>

                  {/* Travelers */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">No. of Travelers *</label>
                    <input
                      type="number"
                      name="travelers"
                      required
                      min="1"
                      value={formData.travelers}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-800 focus:outline-none focus:border-[#4DA528] font-medium"
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
                    className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-700 focus:outline-none focus:border-[#4DA528] font-medium cursor-pointer"
                  >
                    <option value="Under ₹20,000">Under ₹20,000</option>
                    <option value="₹20,000 - ₹50,000">₹20,000 - ₹50,000</option>
                    <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                    <option value="₹1,00,000 - ₹2,00,000">₹1,00,000 - ₹2,00,000</option>
                    <option value="₹2,00,000+">₹2,00,000+ (Ultra Premium)</option>
                  </select>
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#333333] uppercase tracking-wider">Describe Your Perfect Journey</label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="E.g. We are a family of four looking for premium vegetarian dining options in Ladakh, with slow travel itinerary..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#F7F8F4] border border-stone-200 rounded-[12px] text-sm text-stone-800 focus:outline-none focus:border-[#4DA528] font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-[5px] py-4 bg-[#4DA528] hover:bg-[#FF970D] text-white font-bold uppercase tracking-wider text-xs transition-all duration-200 shadow-[0_10px_24px_rgba(77,165,40,0.16)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA528]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8f4] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Details to Curators</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Details Column: Column 5 */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick Contacts Card */}
            <div className="bg-stone-900 text-white rounded-[12px] p-6 sm:p-8 space-y-6 shadow-md" id="contact-details-card">
              <h3 className="text-xl font-extrabold border-b border-stone-800 pb-4 text-[#FF970D]">
                Pravaah Headquarters
              </h3>
              
              <ul className="space-y-6 text-sm">
                <li className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-[#4DA528] shrink-0 mt-1" />
                  <div className="space-y-1">
                    <strong className="block text-white font-bold text-sm">Office Address</strong>
                    <span className="text-stone-300 font-light leading-relaxed block text-xs">
                      402, Signature Towers, Sector 30, Gurugram, Haryana - 122001, India
                    </span>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-[#4DA528] shrink-0 mt-1" />
                  <div className="space-y-1">
                    <strong className="block text-white font-bold text-sm">Direct Hotlines</strong>
                    <a href="tel:+919876543210" className="hover:text-[#F4C430] transition text-stone-300 font-light block text-xs">
                      +91 98765 43210
                    </a>
                    <a href="tel:+911244098765" className="hover:text-[#F4C430] transition text-stone-300 font-light block text-xs">
                      +91 124 4098765 (Office desk)
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-[#4DA528] shrink-0 mt-1" />
                  <div className="space-y-1">
                    <strong className="block text-white font-bold text-sm">Email Addresses</strong>
                    <a href="mailto:info@pravaahtravels.com" className="hover:text-[#F4C430] transition text-stone-300 font-light block text-xs">
                      info@pravaahtravels.com
                    </a>
                    <a href="mailto:bookings@pravaahtravels.com" className="hover:text-[#F4C430] transition text-stone-300 font-light block text-xs">
                      bookings@pravaahtravels.com
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Support / Office Hours Card */}
            <div className="bg-white border border-stone-200 rounded-[12px] p-6 sm:p-8 space-y-4 shadow-xs" id="office-hours-card">
              <h4 className="text-base font-extrabold text-stone-950 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#4DA528]" />
                <span>Office Curating Hours</span>
              </h4>
              <div className="space-y-3 text-xs sm:text-sm">
                {officeHours.map((h, i) => (
                  <div key={i} className="flex justify-between border-b border-stone-100 pb-2 last:border-0 last:pb-0 font-light text-stone-600">
                    <span>{h.days}</span>
                    <span className="text-[#333333] font-bold text-xs">{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
