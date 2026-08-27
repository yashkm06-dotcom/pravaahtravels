import type { TravelPackage } from '../../../types';
import { addDoc, collection, db } from '../../../lib/firebase';

export interface RoopkundEnquiryInput {
  fullName: string;
  phone: string;
  email: string;
  preferredMonth: string;
  groupSize: string;
  trekkingExperience: string;
  contactPreference?: string;
  message: string;
}

const PHONE_PATTERN = /^[0-9+() .-]{7,24}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const groupSizeToTravelers = (groupSize: string) => {
  if (groupSize.startsWith('2')) return 2;
  if (groupSize.startsWith('3')) return 3;
  if (groupSize.startsWith('6')) return 6;
  return 1;
};

const requireLength = (label: string, value: string, min: number, max: number) => {
  if (value.length < min || value.length > max) {
    throw new Error(`${label} must be between ${min} and ${max} characters.`);
  }
};

export const submitRoopkundEnquiry = async (
  pkg: TravelPackage,
  input: RoopkundEnquiryInput,
) => {
  const name = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const destination = String(pkg.destination || pkg.location || pkg.title || 'Roopkund Trek').trim();
  const packageId = String(pkg.id || '').trim();
  const packageName = String(pkg.title || 'Roopkund Trek').trim();

  requireLength('Name', name, 1, 120);
  requireLength('Phone', phone, 7, 24);
  requireLength('Email', email, 3, 254);
  requireLength('Destination', destination, 1, 160);
  requireLength('Package ID', packageId, 0, 160);
  requireLength('Package name', packageName, 1, 200);

  if (!PHONE_PATTERN.test(phone)) {
    throw new Error('Enter a valid phone or WhatsApp number.');
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const message = [
    `Preferred season: ${input.preferredMonth}`,
    `Selected group range: ${input.groupSize}`,
    `Trekking experience: ${input.trekkingExperience}`,
    input.contactPreference ? `Preferred contact method: ${input.contactPreference}` : '',
    input.message.trim() ? `Traveller notes: ${input.message.trim()}` : '',
    'Source: Roopkund custom landing',
  ].filter(Boolean).join('\n');

  requireLength('Message', message, 0, 5000);

  const reference = await addDoc(collection(db, 'enquiries'), {
    name,
    phone,
    email,
    destination,
    travelDate: 'Flexible dates',
    travelers: groupSizeToTravelers(input.groupSize),
    budget: '',
    message,
    packageId,
    packageName,
    status: 'New',
    createdAt: new Date().toISOString(),
  });

  return reference.id;
};
