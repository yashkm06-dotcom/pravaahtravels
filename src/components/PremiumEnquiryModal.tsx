import { useEffect, useRef, useState } from 'react';
import { Check, Compass, Mail, MapPin, Send, Users, X } from 'lucide-react';
import { addDoc, collection, db } from '../lib/firebase';
import { Enquiry, TravelPackage } from '../types';

interface PremiumEnquiryModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; packageContext?: TravelPackage | null; }
const initialForm = { name: '', phone: '', email: '', destination: '', travelDate: '', adults: 2, children: 0, budget: 'Rs. 20,000 - Rs. 50,000', travelType: 'Family Comfort', preferredContactMethod: 'Phone Call', message: '' };

export default function PremiumEnquiryModal({ isOpen, onClose, onSuccess, packageContext = null }: PremiumEnquiryModalProps) {
  const firstField = useRef<HTMLInputElement>(null);
  const [present, setPresent] = useState(isOpen);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setPresent(true);
      setForm((prev) => ({ ...prev, destination: packageContext?.destination || prev.destination, message: prev.message || (packageContext ? `Hi, I would like to discuss the ${packageContext.title} journey.` : '') }));
      setSuccess(false);
      setError('');
      return undefined;
    }
    if (!present) return undefined;
    const timer = window.setTimeout(() => setPresent(false), 300);
    return () => window.clearTimeout(timer);
  }, [isOpen, packageContext, present]);

  useEffect(() => {
    if (!present) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => { if (isOpen) firstField.current?.focus(); }, 40);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.clearTimeout(focusTimer); window.removeEventListener('keydown', closeOnEscape); };
  }, [isOpen, onClose, present]);

  if (!present) return null;
  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = event.target; setForm((prev) => ({ ...prev, [name]: name === 'adults' || name === 'children' ? Math.max(0, Number(value) || 0) : value })); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.destination.trim() || !form.travelDate || form.adults < 1) { setError('Please complete the required fields before sending your enquiry.'); return; } setSubmitting(true); try { const payload: Omit<Enquiry, 'id'> = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), destination: form.destination.trim(), travelDate: form.travelDate, travelers: Number(form.adults) + Number(form.children), budget: form.budget, message: [form.message.trim() || 'Hi, I want to discuss a customized travel plan.', `Travel type: ${form.travelType}`, `Preferred contact: ${form.preferredContactMethod}`, `Adults: ${form.adults}`, `Children: ${form.children}`].join('\n'), ...(packageContext ? { packageId: packageContext.id, packageName: packageContext.title } : {}), status: 'New', createdAt: new Date().toISOString() }; await addDoc(collection(db, 'enquiries'), payload); onSuccess(); setSuccess(true); setForm(initialForm); } catch { setError('We could not send your enquiry right now. Please check your connection and try again.'); } finally { setSubmitting(false); } };
  return <div className={`pravaah-enquiry-overlay ${isOpen ? 'is-open' : 'is-closing'}`} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}><div className="pravaah-enquiry-dialog pravaah-enquiry-dialog--general" role="dialog" aria-modal="true" aria-labelledby="general-enquiry-title"><div className="pravaah-enquiry-dialog__intro"><button type="button" className="pravaah-icon-button pravaah-icon-button--light" onClick={onClose} aria-label="Close enquiry"><X className="h-5 w-5" aria-hidden="true" /></button><span className="pravaah-kicker pravaah-kicker--light">{packageContext ? 'Journey enquiry' : 'Start a route'}</span><h2 id="general-enquiry-title">Plan a trip<br /><em>{packageContext ? packageContext.title : 'that feels like yours.'}</em></h2><p>Share a few essentials and the Pravaah travel desk will shape a thoughtful first draft around them.</p><div><p><Compass className="h-4 w-4" aria-hidden="true" />Local route knowledge</p><p><MapPin className="h-4 w-4" aria-hidden="true" />Flexible destinations and pace</p></div></div><form className="pravaah-enquiry-form" onSubmit={submit}><div className="pravaah-enquiry-form__heading"><span className="pravaah-kicker">Travel details</span><h3>Let us start with the basics.</h3></div>{error && <div className="pravaah-form-error" role="alert">{error}</div>}{success ? <div className="pravaah-form-success"><Check className="h-5 w-5" aria-hidden="true" /><h3>Your enquiry is on its way.</h3><p>We will be in touch shortly with a human first draft.</p><button type="button" className="pravaah-button pravaah-button--dark" onClick={onClose}>Close</button></div> : <><div className="pravaah-form-grid"><label>Name *<input ref={firstField} name="name" value={form.name} onChange={update} required /></label><label>Phone *<input name="phone" type="tel" value={form.phone} onChange={update} required /></label><label>Email *<input name="email" type="email" value={form.email} onChange={update} required /></label><label>Destination *<input name="destination" value={form.destination} onChange={update} placeholder="Uttarakhand, Ladakh..." required /></label><label>Travel date *<input name="travelDate" type="date" value={form.travelDate} onChange={update} required /></label><label>Budget<select name="budget" value={form.budget} onChange={update}><option>Rs. 20,000 - Rs. 50,000</option><option>Rs. 50,000 - Rs. 1,00,000</option><option>Rs. 1,00,000 - Rs. 2,50,000</option><option>Rs. 2,50,000+</option></select></label><label><span className="inline-flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" />Adults</span><input name="adults" type="number" min="1" value={form.adults} onChange={update} /></label><label>Children<input name="children" type="number" min="0" value={form.children} onChange={update} /></label></div><label className="pravaah-form-full">Anything we should know?<textarea name="message" value={form.message} onChange={update} rows={4} placeholder="Your pace, interests, or accessibility needs..." /></label><button type="submit" disabled={submitting} className="pravaah-button pravaah-button--copper pravaah-button--wide">{submitting ? 'Sending your enquiry...' : 'Send enquiry'} <Send className="h-4 w-4" aria-hidden="true" /></button><p className="pravaah-form-footnote"><Mail className="h-4 w-4" aria-hidden="true" />No checkout. Just a clear conversation.</p></>}</form></div></div>;
}
