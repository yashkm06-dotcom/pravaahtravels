import React, { useMemo, useRef, useState, useEffect } from 'react';
import { 
  User, Calendar, Lock, Shield, Sparkles, CheckCircle, CreditCard, 
  Plus, Trash2, ChevronDown, MapPin, LogOut, RefreshCw, 
  Check, X, Info, AlertCircle, Compass, Star,
  AlertTriangle, Briefcase, Heart, MessageCircle, FileText, Download, Upload, Phone, Mail
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db, storage, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, setDoc, serverTimestamp, onSnapshot } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatPrice, type BookingDocumentStatus, type BookingDocumentType, type TripCustomerStatus, type TripOperationDocument } from '../types';
import { triggerSystemEmail } from '../lib/emailClient';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';
import { SkeletonBookingCard } from './SkeletonLoader';

interface CustomerPortalViewProps {
  onLogout: () => void;
  onNavigateToHome: () => void;
  onNavigate?: (view: string, packageId?: string | null) => void;
  onNavigateToPackages?: () => void;
  savedPackagesRefreshKey?: number;
}

// Client side image optimization helper
const resizeAndCompressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 500;
      const MAX_HEIGHT = 500;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const normalizeBookingRecord = (booking: any) => {
  const bookingStatus = String(booking?.bookingStatus || booking?.status || 'Pending').trim();
  const guests = Number((booking?.guests ?? booking?.travelers ?? ((booking?.adults || 0) + (booking?.children || 0))) || 1);
  const totalPrice = Number(booking?.totalPrice ?? booking?.price ?? 0);
  const advancePaid = Number(booking?.advancePaid ?? booking?.advanceReceived ?? 0);
  const remainingBalance = Number(booking?.remainingBalance ?? Math.max(totalPrice - advancePaid, 0));
  const createdAt = booking?.createdAt || new Date().toISOString();
  const updatedAt = booking?.updatedAt || createdAt;

  return {
    ...booking,
    bookingId: booking?.bookingId || `PRV-${new Date(createdAt).getFullYear()}-${String(booking?.id || '').slice(0, 4).toUpperCase()}`,
    customerId: booking?.customerId || booking?.userId || '',
    customerName: booking?.customerName || booking?.userName || 'Traveler',
    email: booking?.email || booking?.customerEmail || '',
    phone: booking?.phone || booking?.customerPhone || '',
    packageId: booking?.packageId || '',
    packageTitle: booking?.packageTitle || booking?.destination || 'Custom Package',
    destination: booking?.destination || '',
    duration: booking?.duration || booking?.packageDuration || '',
    packageImageUrl: booking?.packageImageUrl || booking?.imageUrl || '',
    travelDate: booking?.travelDate || '',
    guests,
    travelers: Number(booking?.travelers ?? guests),
    totalPrice,
    price: Number(booking?.price ?? totalPrice),
    advancePaid,
    remainingBalance,
    paymentDueDate: booking?.paymentDueDate || '',
    paymentHistory: booking?.paymentHistory || [],
    documentStatus: booking?.documentStatus || {},
    tripOperations: booking?.tripOperations || {},
    operationDocuments: booking?.operationDocuments || [],
    tripStatusOverride: booking?.tripStatusOverride || '',
    tripStatus: booking?.tripStatus || '',
    tripManager: booking?.tripManager || {
      name: booking?.assignedTripManager || booking?.assignedStaff || '',
      phone: booking?.tripManagerPhone || '',
      email: booking?.tripManagerEmail || '',
      emergencyContact: booking?.emergencyContact || '',
    },
    bookingStatus,
    paymentStatus: booking?.paymentStatus || 'Pending',
    createdAt,
    updatedAt,
    notes: booking?.notes || [],
  };
};

const BOOKING_DOCUMENT_TYPES: BookingDocumentType[] = ['Passport', 'Aadhaar', 'Visa', 'Medical Certificate', 'Travel Insurance', 'Emergency Contact'];

const normalizePaymentStatus = (status?: string) => {
  const cleanStatus = String(status || 'Pending');
  if (cleanStatus === 'Paid') return 'Paid';
  if (cleanStatus === 'Partial') return 'Partial';
  if (cleanStatus === 'Refunded') return 'Refunded';
  if (cleanStatus === 'Unpaid') return 'Pending';
  return cleanStatus || 'Pending';
};

const getPaymentStatusClasses = (status?: string) => {
  switch (normalizePaymentStatus(status)) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-700';
    case 'Partial':
      return 'bg-sky-100 text-sky-700';
    case 'Refunded':
      return 'bg-stone-100 text-stone-600';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const getDocumentStatusClasses = (status?: BookingDocumentStatus) => {
  switch (status) {
    case 'Verified':
      return 'bg-emerald-100 text-emerald-700';
    case 'Rejected':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const TRIP_STATUS_OPTIONS: TripCustomerStatus[] = ['Upcoming', 'Ready To Travel', 'In Progress', 'Completed', 'Cancelled'];

const getTripStatusClasses = (status: TripCustomerStatus) => {
  switch (status) {
    case 'Ready To Travel':
      return 'bg-emerald-100 text-emerald-700';
    case 'In Progress':
      return 'bg-sky-100 text-sky-700';
    case 'Completed':
      return 'bg-teal-100 text-teal-700';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const getBookingStatusBadgeClasses = (bookingStatus: string) => {
  switch (bookingStatus) {
    case 'Contacted':
      return 'bg-sky-100 text-sky-700';
    case 'Confirmed':
      return 'bg-emerald-100 text-emerald-700';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-700';
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const getBookingWhatsAppUrl = (booking: any) => {
  const bookingId = booking?.bookingId || 'PRV-2026-0001';
  const packageTitle = booking?.packageTitle || 'your package';
  const message = `Hello Pravaah Travels,%0AI have submitted my booking.%0ABooking ID: ${bookingId}%0APackage: ${packageTitle}%0APlease confirm my booking.`;
  return `https://wa.me/919999999999?text=${message}`;
};

type PopularRouteRegion = 'Uttarakhand' | 'Himachal' | 'Kashmir' | 'Ladakh' | 'Sikkim';

interface TrekRouteDefinition {
  id: string;
  name: string;
  region: PopularRouteRegion;
  latitude: number;
  longitude: number;
  elevation: string;
  aliases: string[];
  helicopterApplicable?: boolean;
}

interface RouteWeatherIntel {
  routeId: string;
  condition: string;
  temperature: string;
  feelsLike: string;
  wind: string;
  rainProbability: string;
  snowProbability: string;
  snowAlert: string;
  routeStatus: string;
  landslideRisk: 'Low' | 'Moderate' | 'High';
  helicopterStatus: string;
  bestTrekWindow: string;
  packingSuggestions: string;
  permitInformation: string;
  lastUpdated: string;
  source: string;
}

interface RouteWeatherState {
  loading?: boolean;
  data?: RouteWeatherIntel;
  error?: string;
}

const ROUTE_WEATHER_CACHE_MS = 10 * 60 * 1000;
const routeWeatherCache = new Map<string, { expiresAt: number; data: RouteWeatherIntel }>();

const POPULAR_TREK_ROUTES: TrekRouteDefinition[] = [
  {
    id: 'kedarnath-trek',
    name: 'Kedarnath Trek Route',
    region: 'Uttarakhand',
    latitude: 30.7346,
    longitude: 79.0669,
    elevation: '3,583 m',
    aliases: ['kedarnath', 'gaurikund', 'sonprayag', 'rudraprayag', 'uttarakhand', 'char dham', 'chardham'],
    helicopterApplicable: true,
  },
  {
    id: 'badrinath-mana',
    name: 'Badrinath - Mana Route',
    region: 'Uttarakhand',
    latitude: 30.7433,
    longitude: 79.4938,
    elevation: '3,300 m',
    aliases: ['badrinath', 'mana', 'joshimath', 'chamoli', 'uttarakhand', 'char dham', 'chardham'],
  },
  {
    id: 'hemkund-valley-flowers',
    name: 'Hemkund Sahib - Valley of Flowers',
    region: 'Uttarakhand',
    latitude: 30.7005,
    longitude: 79.6151,
    elevation: '4,329 m',
    aliases: ['hemkund', 'valley of flowers', 'ghangaria', 'govindghat', 'uttarakhand'],
    helicopterApplicable: true,
  },
  {
    id: 'gangotri-gaumukh',
    name: 'Gangotri - Gaumukh Trail',
    region: 'Uttarakhand',
    latitude: 30.9944,
    longitude: 78.9398,
    elevation: '4,023 m',
    aliases: ['gangotri', 'gaumukh', 'gomukh', 'tapovan', 'uttarakhand', 'char dham', 'chardham'],
  },
  {
    id: 'yamunotri-route',
    name: 'Yamunotri Dham Route',
    region: 'Uttarakhand',
    latitude: 31.014,
    longitude: 78.46,
    elevation: '3,293 m',
    aliases: ['yamunotri', 'janki chatti', 'barkot', 'uttarakhand', 'char dham', 'chardham'],
  },
  {
    id: 'triund-dharamshala',
    name: 'Triund - Dharamshala Trail',
    region: 'Himachal',
    latitude: 32.255,
    longitude: 76.331,
    elevation: '2,850 m',
    aliases: ['triund', 'dharamshala', 'mcleodganj', 'kangra', 'himachal'],
  },
  {
    id: 'hampta-pass',
    name: 'Hampta Pass Trek',
    region: 'Himachal',
    latitude: 32.281,
    longitude: 77.432,
    elevation: '4,270 m',
    aliases: ['hampta', 'manali', 'chandratal', 'himachal'],
  },
  {
    id: 'rohtang-manali',
    name: 'Manali - Rohtang Pass',
    region: 'Himachal',
    latitude: 32.371,
    longitude: 77.246,
    elevation: '3,978 m',
    aliases: ['rohtang', 'manali', 'atal tunnel', 'solang', 'himachal'],
  },
  {
    id: 'spiti-kaza',
    name: 'Spiti Valley - Kaza Route',
    region: 'Himachal',
    latitude: 32.225,
    longitude: 78.071,
    elevation: '3,800 m',
    aliases: ['spiti', 'kaza', 'key monastery', 'chandratal', 'himachal'],
  },
  {
    id: 'amarnath-pahalgam',
    name: 'Amarnath - Pahalgam Route',
    region: 'Kashmir',
    latitude: 34.214,
    longitude: 75.501,
    elevation: '3,888 m',
    aliases: ['amarnath', 'pahalgam', 'baltal', 'kashmir'],
    helicopterApplicable: true,
  },
  {
    id: 'gulmarg-route',
    name: 'Gulmarg Alpine Route',
    region: 'Kashmir',
    latitude: 34.048,
    longitude: 74.38,
    elevation: '2,650 m',
    aliases: ['gulmarg', 'apharwat', 'kashmir'],
  },
  {
    id: 'sonamarg-zojila',
    name: 'Sonamarg - Zoji La Route',
    region: 'Kashmir',
    latitude: 34.274,
    longitude: 75.296,
    elevation: '3,528 m',
    aliases: ['sonamarg', 'zoji', 'zojila', 'kashmir', 'ladakh'],
  },
  {
    id: 'khardung-la',
    name: 'Leh - Khardung La',
    region: 'Ladakh',
    latitude: 34.278,
    longitude: 77.604,
    elevation: '5,359 m',
    aliases: ['khardung', 'leh', 'nubra', 'ladakh'],
  },
  {
    id: 'pangong-route',
    name: 'Leh - Pangong Lake Route',
    region: 'Ladakh',
    latitude: 33.759,
    longitude: 78.667,
    elevation: '4,225 m',
    aliases: ['pangong', 'chang la', 'leh', 'ladakh'],
  },
  {
    id: 'markha-valley',
    name: 'Markha Valley Trek',
    region: 'Ladakh',
    latitude: 33.988,
    longitude: 77.745,
    elevation: '5,200 m',
    aliases: ['markha', 'hemmis', 'leh', 'ladakh'],
  },
  {
    id: 'goecha-la',
    name: 'Goecha La Trek',
    region: 'Sikkim',
    latitude: 27.369,
    longitude: 88.224,
    elevation: '4,940 m',
    aliases: ['goecha', 'yuksom', 'kanchenjunga', 'sikkim'],
  },
  {
    id: 'nathula-route',
    name: 'Gangtok - Nathula Pass',
    region: 'Sikkim',
    latitude: 27.386,
    longitude: 88.831,
    elevation: '4,310 m',
    aliases: ['nathula', 'gangtok', 'tsomgo', 'sikkim'],
  },
  {
    id: 'gurudongmar-route',
    name: 'Lachen - Gurudongmar Lake',
    region: 'Sikkim',
    latitude: 28.025,
    longitude: 88.705,
    elevation: '5,430 m',
    aliases: ['gurudongmar', 'lachen', 'north sikkim', 'sikkim'],
  },
];

const normalizeRouteText = (value: unknown) => String(value ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const weatherCodeToCondition = (code?: number) => {
  if (code === undefined) return 'Weather unavailable';
  if ([0].includes(code)) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain expected';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snowfall likely';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm risk';
  return 'Variable mountain weather';
};

const getLandslideRisk = (precipitationSum: number, rainProbability: number, currentRain: number): RouteWeatherIntel['landslideRisk'] => {
  if (precipitationSum >= 35 || rainProbability >= 75 || currentRain >= 8) return 'High';
  if (precipitationSum >= 12 || rainProbability >= 45 || currentRain >= 2) return 'Moderate';
  return 'Low';
};

const getSnowAlert = (snowfall: number, temperature: number, rainProbability: number) => {
  if (snowfall > 0) return `Active snowfall signal (${snowfall.toFixed(1)} cm forecast)`;
  if (temperature <= 2 && rainProbability >= 35) return 'Possible snow/ice at higher elevation';
  return 'No snowfall signal from weather model';
};

const getRouteStatusLabel = (risk: RouteWeatherIntel['landslideRisk']) => {
  if (risk === 'High') return 'Official status unavailable.';
  if (risk === 'Moderate') return 'Official status unavailable.';
  return 'Official status unavailable.';
};

const getHelicopterStatusLabel = (route: TrekRouteDefinition, windSpeed: number, rainProbability: number) => {
  if (!route.helicopterApplicable) return 'Not applicable for this route';
  if (windSpeed >= 35 || rainProbability >= 65) return 'Official status unavailable.';
  return 'Official status unavailable.';
};

const getSnowProbabilityLabel = (snowfall: number, temperature: number, rainProbability: number) => {
  if (snowfall > 0) return 'Snowfall expected';
  if (temperature <= 2 && rainProbability >= 35) return 'Possible at higher elevation';
  return 'Low signal';
};

const getBestTrekWindowLabel = (risk: RouteWeatherIntel['landslideRisk'], condition: string) => {
  const normalized = condition.toLowerCase();
  if (risk === 'High' || normalized.includes('thunderstorm')) return 'Wait for a calmer weather window';
  if (risk === 'Moderate' || normalized.includes('rain') || normalized.includes('snow')) return 'Late morning after a local route check';
  return 'Morning departures look most comfortable';
};

const getPackingSuggestionsLabel = (risk: RouteWeatherIntel['landslideRisk'], snowAlert: string, rainProbability: number, temperature: number) => {
  if (snowAlert.toLowerCase().includes('active') || snowAlert.toLowerCase().includes('possible')) {
    return 'Thermal layers, waterproof boots, gloves, sunglasses, and a compact rain shell.';
  }
  if (risk !== 'Low' || rainProbability >= 45) {
    return 'Rain shell, dry bags, warm layer, trekking pole, and traction-friendly shoes.';
  }
  if (temperature <= 8) {
    return 'Warm fleece, wind layer, sunscreen, sunglasses, and hydration salts.';
  }
  return 'Light layers, sunscreen, sunglasses, reusable bottle, and comfortable trail shoes.';
};

const fetchRouteWeather = async (route: TrekRouteDefinition, signal?: AbortSignal): Promise<RouteWeatherIntel> => {
  const cached = routeWeatherCache.get(route.id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const params = new URLSearchParams({
    latitude: String(route.latitude),
    longitude: String(route.longitude),
    current: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m',
    daily: 'precipitation_probability_max,precipitation_sum,snowfall_sum,wind_speed_10m_max',
    forecast_days: '1',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error('Weather feed unavailable');
  }

  const payload = await response.json();
  const current = payload.current || {};
  const daily = payload.daily || {};
  const temperature = Number(current.temperature_2m ?? 0);
  const feelsLike = Number(current.apparent_temperature ?? temperature);
  const windSpeed = Number(current.wind_speed_10m ?? daily.wind_speed_10m_max?.[0] ?? 0);
  const windGust = Number(current.wind_gusts_10m ?? windSpeed);
  const rainProbability = Number(current.precipitation_probability ?? daily.precipitation_probability_max?.[0] ?? 0);
  const precipitationSum = Number(daily.precipitation_sum?.[0] ?? current.precipitation ?? 0);
  const currentRain = Number(current.rain ?? current.precipitation ?? 0);
  const snowfall = Number(current.snowfall ?? daily.snowfall_sum?.[0] ?? 0);
  const landslideRisk = getLandslideRisk(precipitationSum, rainProbability, currentRain);
  const condition = weatherCodeToCondition(Number(current.weather_code ?? daily.weather_code?.[0]));
  const snowAlert = getSnowAlert(snowfall, temperature, rainProbability);

  const data: RouteWeatherIntel = {
    routeId: route.id,
    condition,
    temperature: `${Math.round(temperature)}°C`,
    feelsLike: `${Math.round(feelsLike)}°C`,
    wind: `${Math.round(windSpeed)} km/h${windGust > windSpeed ? `, gusts ${Math.round(windGust)} km/h` : ''}`,
    rainProbability: `${Math.round(rainProbability)}%`,
    snowProbability: getSnowProbabilityLabel(snowfall, temperature, rainProbability),
    snowAlert,
    routeStatus: getRouteStatusLabel(landslideRisk),
    landslideRisk,
    helicopterStatus: getHelicopterStatusLabel(route, windSpeed, rainProbability),
    bestTrekWindow: getBestTrekWindowLabel(landslideRisk, condition),
    packingSuggestions: getPackingSuggestionsLabel(landslideRisk, snowAlert, rainProbability, temperature),
    permitInformation: 'Official status unavailable.',
    lastUpdated: current.time ? new Date(current.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    source: 'Forecast feed',
  };

  routeWeatherCache.set(route.id, {
    expiresAt: Date.now() + ROUTE_WEATHER_CACHE_MS,
    data,
  });
  return data;
};

const findMatchingRoutes = (rawText: unknown) => {
  const text = normalizeRouteText(rawText);
  if (!text) return [];
  return POPULAR_TREK_ROUTES.filter((route) => {
    const routeName = normalizeRouteText(route.name);
    return routeName.includes(text) || route.aliases.some((alias) => {
      const normalizedAlias = normalizeRouteText(alias);
      return text.includes(normalizedAlias) || normalizedAlias.includes(text);
    });
  });
};

const getRiskBadgeClasses = (risk?: RouteWeatherIntel['landslideRisk']) => {
  switch (risk) {
    case 'High':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'Moderate':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
};

const getRouteDisplayName = (route: TrekRouteDefinition) => route.name
  .replace(/\s+(Trek Route|Dham Route|Route|Trek|Trail)$/i, '')
  .trim();

const getWeatherEmoji = (data?: RouteWeatherIntel, hasError = false) => {
  if (hasError) return '⛰';
  const condition = data?.condition.toLowerCase() || '';
  if (condition.includes('snow')) return '❄';
  if (condition.includes('thunderstorm')) return '⛈';
  if (condition.includes('rain') || condition.includes('drizzle')) return '🌧';
  if (condition.includes('fog')) return '🌫';
  if (condition.includes('cloud')) return '⛅';
  if (condition.includes('clear')) return '☀';
  return data ? '🌤' : '🏔';
};

const getRouteStatusTone = (data?: RouteWeatherIntel, hasError = false) => {
  if (hasError) return { label: 'Paused', classes: 'border-stone-200 bg-stone-100 text-stone-600', dot: 'bg-stone-400' };
  if (!data) return { label: 'Updating', classes: 'border-sky-200 bg-sky-50 text-sky-700', dot: 'bg-sky-500' };
  const snowAlert = data.snowAlert.toLowerCase();
  if (snowAlert.includes('active') || snowAlert.includes('possible')) {
    return { label: 'Snow Zone', classes: 'border-sky-200 bg-sky-50 text-sky-700', dot: 'bg-sky-500' };
  }
  if (data.landslideRisk === 'High' || data.landslideRisk === 'Moderate' || data.condition.toLowerCase().includes('rain')) {
    return { label: 'Rain Alert', classes: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
  }
  return { label: 'Stable', classes: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
};

const getRouteImage = () => getTravelImage();

const getPackingChips = (data?: RouteWeatherIntel) => {
  const fallback = ['🧥 Jacket', '🥾 Trek Shoes', '☀ Sunglasses', '💧 Water'];
  if (!data) return fallback;

  const suggestions = data.packingSuggestions.toLowerCase();
  const chips = new Set<string>();
  if (suggestions.includes('thermal') || suggestions.includes('warm') || suggestions.includes('fleece')) chips.add('🧥 Jacket');
  if (suggestions.includes('boots') || suggestions.includes('shoes')) chips.add('🥾 Trek Shoes');
  if (suggestions.includes('gloves')) chips.add('🧤 Gloves');
  if (suggestions.includes('sunglasses')) chips.add('☀ Sunglasses');
  if (suggestions.includes('rain')) chips.add('🌧 Rain Shell');
  if (suggestions.includes('hydration') || suggestions.includes('bottle')) chips.add('💧 Water');
  if (suggestions.includes('pole')) chips.add('🦯 Trek Pole');
  return Array.from(chips).slice(0, 6);
};

const RouteCardSkeleton = () => (
  <div className="min-w-[245px] rounded-[24px] border border-white/70 bg-white/75 p-3 shadow-[0_16px_42px_rgba(18,38,32,0.08)] backdrop-blur md:min-w-0">
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-[20px] bg-stone-200" />
      <div className="h-4 w-28 rounded-full bg-stone-200" />
      <div className="h-8 w-full rounded-full bg-stone-100" />
    </div>
  </div>
);

const RouteWeatherCard = ({
  route,
  state,
  compact = false,
  onView,
}: {
  route: TrekRouteDefinition;
  state?: RouteWeatherState;
  compact?: boolean;
  onView: () => void;
}) => {
  if (state?.loading) {
    return <RouteCardSkeleton />;
  }

  const data = state?.data;
  const statusTone = getRouteStatusTone(data, Boolean(state?.error));
  const displayName = getRouteDisplayName(route);
  const handleCompactKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!compact) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onView();
    }
  };

  return (
    <article
      role={compact ? 'button' : undefined}
      tabIndex={compact ? 0 : undefined}
      onClick={compact ? onView : undefined}
      onKeyDown={handleCompactKeyDown}
      className={`group relative flex shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/85 p-3 shadow-[0_16px_42px_rgba(18,38,32,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.16)] focus:outline-none focus:ring-2 focus:ring-[#4DA528]/45 ${compact ? 'min-w-[190px] cursor-pointer sm:min-w-[205px]' : 'min-w-[250px] md:min-w-0'}`}
    >
      <div className={`relative overflow-hidden rounded-[20px] ${compact ? 'h-32' : 'h-36'}`}>
        <img
          src={getRouteImage()}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleTravelImageError}
        />
        <div className="absolute inset-0 bg-linear-to-t from-stone-950/75 via-stone-950/25 to-white/10" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] backdrop-blur ${statusTone.classes}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
            {statusTone.label}
          </span>
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-2xl leading-none text-white shadow-sm backdrop-blur">
          {getWeatherEmoji(data, Boolean(state?.error))}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <h4 className={`${compact ? 'text-base' : 'text-lg'} font-extrabold leading-tight drop-shadow`}>{displayName}</h4>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-2xl font-extrabold tracking-tight">{data?.temperature || '--'}</span>
            <span className="truncate text-[11px] font-bold text-white/78">{route.region}</span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-stone-500">
          <MapPin className="h-3.5 w-3.5 text-[#4DA528]" />
          <span>{route.elevation}</span>
        </div>
      )}

      {!compact && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-full bg-stone-950 px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-[#4DA528]"
          >
            📍 View
          </button>
          <button
            type="button"
            className="rounded-full border border-stone-200 bg-white px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-stone-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            ❤️ Save
          </button>
          <button
            type="button"
            className="rounded-full border border-stone-200 bg-white px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-stone-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            🔔 Follow
          </button>
        </div>
      )}

      {state?.error && !compact && (
        <p className="mt-3 text-xs leading-5 text-stone-500">Live weather is unavailable right now. Please check again shortly.</p>
      )}
    </article>
  );
};

const RouteDetailModal = ({
  route,
  state,
  onClose,
}: {
  route: TrekRouteDefinition;
  state?: RouteWeatherState;
  onClose: () => void;
}) => {
  const data = state?.data;
  const statusTone = getRouteStatusTone(data, Boolean(state?.error));
  const displayName = getRouteDisplayName(route);
  const packingChips = getPackingChips(data);
  const informationItems = [
    ['Road Status', data?.routeStatus || 'Official status unavailable.'],
    ['Permit Status', data?.permitInformation || 'Official status unavailable.'],
    ['Helicopter Status', data?.helicopterStatus || (route.helicopterApplicable ? 'Official status unavailable.' : 'Not applicable for this route')],
  ];
  const infoTiles = [
    ['🌬 Wind', data?.wind || '--'],
    ['🌧 Rain', data?.rainProbability || '--'],
    ['❄ Snow', data?.snowProbability || '--'],
    ['🧭 Best Trek Window', data?.bestTrekWindow || 'Weather update unavailable'],
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center overflow-hidden bg-stone-950/68 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expedition-route-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-[30px] border border-white/70 bg-[#fbfaf5] shadow-2xl sm:max-w-2xl sm:rounded-[30px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/70 bg-white/80 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Journey Conditions</p>
            <h3 id="expedition-route-title" className="mt-1 text-xl font-extrabold text-stone-950">{displayName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-200 bg-white p-2 text-stone-500 transition hover:bg-stone-100"
            aria-label="Close route details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="relative overflow-hidden rounded-[26px] bg-[#081E2A] p-5 text-white shadow-[0_22px_55px_rgba(8,30,42,0.2)]">
            <img
              src={getRouteImage()}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleTravelImageError}
            />
            <div className="absolute inset-0 bg-linear-to-br from-[#081E2A] via-[#081E2A]/86 to-[#4DA528]/55" />
            <div className="relative flex items-start justify-between gap-5">
              <div>
                <span className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/78">{route.region}</span>
                <div className="mt-5 flex items-end gap-4">
                  <div className="text-6xl leading-none drop-shadow">{getWeatherEmoji(data, Boolean(state?.error))}</div>
                  <div>
                    <p className="text-5xl font-extrabold tracking-tight">{data?.temperature || '--'}</p>
                    <p className="mt-1 text-sm font-semibold text-white/78">{data?.condition || 'Weather update unavailable'}</p>
                  </div>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-white/72">
                  <MapPin className="h-4 w-4" />
                  <span>{route.elevation}</span>
                </p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${statusTone.classes}`}>
                <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
                {statusTone.label}
              </span>
            </div>
          </div>

          {state?.error ? (
            <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              Weather updates are unavailable right now. Please try again shortly.
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            {infoTiles.map(([label, value]) => (
              <div key={label} className="rounded-[20px] border border-stone-200 bg-white p-4 shadow-[0_12px_35px_rgba(18,38,32,0.05)]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-400">{label}</p>
                <p className="mt-2 text-sm font-extrabold leading-6 text-stone-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[22px] border border-stone-200 bg-white p-5 shadow-[0_12px_35px_rgba(18,38,32,0.05)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Packing Suggestions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {packingChips.map((chip) => (
                <span key={chip} className="rounded-full border border-stone-200 bg-[#fffdf8] px-3 py-2 text-xs font-extrabold text-stone-800 shadow-sm">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-stone-200 bg-white p-5 shadow-[0_12px_35px_rgba(18,38,32,0.05)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Travel Information</p>
            <div className="mt-4 grid gap-3">
              {informationItems.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 rounded-[16px] bg-[#f6f7f2] px-4 py-3">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-stone-500">{label}</span>
                  <span className="max-w-[55%] text-right text-sm font-semibold leading-6 text-stone-950">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            <span>Last Updated</span>
            <span>{data?.lastUpdated || 'Pending'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-full bg-stone-950 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#4DA528] sm:hidden"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CustomerPortalView({ onLogout, onNavigateToHome, onNavigate, onNavigateToPackages, savedPackagesRefreshKey = 0 }: CustomerPortalViewProps) {
  // Auth state
  const [user, setUser] = useState(auth.currentUser);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'emailLink'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Email Link (Passwordless) Auth states
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [needEmailConfirmation, setNeedEmailConfirmation] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  
  // Custom Platform configuration for Web, Android, iOS to demonstrate passwordless settings
  const [androidPackageName, setAndroidPackageName] = useState('com.pravaahtravels.android');
  const [iosBundleId, setIosBundleId] = useState('com.pravaahtravels.ios');
  const [showPlatformConfigGuide, setShowPlatformConfigGuide] = useState(false);

  // Active tab inside logged-in portal
  const [activeTab, setActiveTab] = useState<'bookings' | 'ai-assistant' | 'private-vault' | 'reviews' | 'saved-packages' | 'travel-history' | 'profile'>('bookings');

  // Bookings list
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);
  const [tripSearch, setTripSearch] = useState('');
  const [documentUploadingKey, setDocumentUploadingKey] = useState<string | null>(null);

  // Booking Modal
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [newBookingDest, setNewBookingDest] = useState('');
  const [newBookingDate, setNewBookingDate] = useState('');
  const [newBookingBudget, setNewBookingBudget] = useState(50000);
  const [newBookingRequests, setNewBookingRequests] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const [newBookingName, setNewBookingName] = useState('');
  const [newBookingPhone, setNewBookingPhone] = useState('');
  const [newBookingWhatsApp, setNewBookingWhatsApp] = useState('');
  const [newBookingEmail, setNewBookingEmail] = useState('');
  const [newBookingPackage, setNewBookingPackage] = useState('');
  const [newBookingAdults, setNewBookingAdults] = useState(2);
  const [newBookingChildren, setNewBookingChildren] = useState(0);
  const [newBookingPickupCity, setNewBookingPickupCity] = useState('');

  // Prefill when booking modal opens
  useEffect(() => {
    if (showNewBookingModal && user) {
      setNewBookingName(user.displayName || '');
      setNewBookingEmail(user.email || '');
      setNewBookingPackage('Custom Holiday Package');
    }
  }, [showNewBookingModal, user]);

  // Payment Simulation Modal
  const [payingBooking, setPayingBooking] = useState<any | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCardNum, setPaymentCardNum] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const paymentResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (paymentResetTimeoutRef.current) {
        clearTimeout(paymentResetTimeoutRef.current);
      }
    };
  }, []);

  // Private Vault Data
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [showAddVaultModal, setShowAddVaultModal] = useState(false);
  const [vaultTitle, setVaultTitle] = useState('');
  const [vaultContent, setVaultContent] = useState('');
  const [vaultCategory, setVaultCategory] = useState<'Passport' | 'Insurance' | 'Emergency' | 'Checklist' | 'Other'>('General Notes' as any);
  const [vaultSubmitting, setVaultSubmitting] = useState(false);

  // AI Itinerary Assistant State
  const [aiDest, setAiDest] = useState('');
  const [aiDuration, setAiDuration] = useState('5');
  const [aiBudget, setAiBudget] = useState('50000');
  const [aiVibe, setAiVibe] = useState('Balanced');
  const [aiRequests, setAiRequests] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState('');
  const [savedAiItineraries, setSavedAiItineraries] = useState<any[]>([]);
  const [savingAi, setSavingAi] = useState(false);

  // Saved Packages States
  const [savedPackages, setSavedPackages] = useState<any[]>([]);
  const [savedPackagesLoading, setSavedPackagesLoading] = useState(false);
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);

  // Live Trek & Route Intelligence
  const [personalizedWeatherByRouteId, setPersonalizedWeatherByRouteId] = useState<Record<string, RouteWeatherState>>({});
  const [popularWeatherByRouteId, setPopularWeatherByRouteId] = useState<Record<string, RouteWeatherState>>({});
  const [popularRoutesActivated, setPopularRoutesActivated] = useState(false);
  const [routeWeatherOffline, setRouteWeatherOffline] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const popularRoutesRef = useRef<HTMLDivElement | null>(null);

  // Profile States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileWhatsApp, setProfileWhatsApp] = useState('');
  const [profilePrefDest, setProfilePrefDest] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Review submission states
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDestination, setReviewDestination] = useState('');
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchSavedPackages = (uid: string) => {
    setSavedPackagesLoading(true);
    const q = query(
      collection(db, 'users', uid, 'private'),
      where('type', '==', 'saved_package')
    );

    return onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setSavedPackages(fetched);
      setSavedPackagesLoading(false);
    }, (err: any) => {
      console.error('Error fetching saved packages:', err);
      setSavedPackagesLoading(false);
    });
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const uRef = doc(db, 'users', uid);
      const uSnap = await getDoc(uRef);
      if (uSnap.exists()) {
        const uData = uSnap.data();
        setProfileName(uData.name || '');
        setProfilePhone(uData.phone || '');
        setProfileWhatsApp(uData.whatsapp || '');
        setProfilePrefDest(uData.preferredDestinations || '');
      } else {
        setProfileName(auth.currentUser?.displayName || '');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      const uRef = doc(db, 'users', user.uid);
      await setDoc(uRef, {
        name: profileName,
        phone: profilePhone,
        whatsapp: profileWhatsApp,
        preferredDestinations: profilePrefDest,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Profile updated securely!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('We could not save your profile right now. Please try again in a moment.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRemoveSavedPackage = async (savedPkgId: string) => {
    if (!user || !confirm('Are you sure you want to remove this saved package?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private', savedPkgId));
      fetchSavedPackages(user.uid);
    } catch (err: any) {
      console.error('Error deleting saved package:', err);
      alert('We could not remove that saved package. Please try again in a moment.');
    }
  };

  // Listen to Auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchCustomerBookings(currentUser.uid);
        fetchPrivateVault(currentUser.uid);
        fetchSavedAiItineraries(currentUser.uid);
        fetchSavedPackages(currentUser.uid);
        fetchUserProfile(currentUser.uid);
        fetchRecentCustomerEnquiries(currentUser.email || '');
      } else {
        setRecentEnquiries([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setSavedPackages([]);
      return;
    }

    const unsubscribe = fetchSavedPackages(user.uid);
    return () => unsubscribe?.();
  }, [savedPackagesRefreshKey, user?.uid]);

  const personalizedRoutes = useMemo(() => {
    const routeMap = new Map<string, TrekRouteDefinition>();
    const addInterestRoutes = (value: unknown) => {
      findMatchingRoutes(value).forEach((route) => {
        if (!routeMap.has(route.id)) {
          routeMap.set(route.id, route);
        }
      });
    };

    const now = new Date();
    const isActiveBooking = (booking: any) => {
      const status = String(booking?.bookingStatus || booking?.status || 'Pending');
      return !['Cancelled', 'Completed'].includes(status);
    };
    const isUpcomingBooking = (booking: any) => {
      if (!isActiveBooking(booking) || !booking?.travelDate) return false;
      const travelDate = new Date(booking.travelDate);
      travelDate.setHours(23, 59, 59, 999);
      return travelDate.getTime() >= now.getTime();
    };

    const addBooking = (booking: any) => {
      addInterestRoutes(booking.destination);
      addInterestRoutes(booking.packageTitle);
    };

    bookings.filter(isActiveBooking).forEach(addBooking);
    bookings.filter(isUpcomingBooking).forEach(addBooking);
    savedPackages.forEach((saved) => {
      addInterestRoutes(saved.destination);
      addInterestRoutes(saved.title);
    });
    vaultDocs
      .filter((item: any) => item?.type === 'saved_package')
      .forEach((saved: any) => {
        addInterestRoutes(saved.destination);
        addInterestRoutes(saved.title);
      });
    recentEnquiries.forEach((enquiry: any) => {
      addInterestRoutes(enquiry.destination);
      addInterestRoutes(enquiry.packageName);
    });

    return Array.from(routeMap.values()).slice(0, 4);
  }, [bookings, savedPackages, vaultDocs, recentEnquiries]);

  const popularRoutes = useMemo(() => {
    const personalizedIds = new Set(personalizedRoutes.map((route) => route.id));
    return POPULAR_TREK_ROUTES.filter((route) => !personalizedIds.has(route.id));
  }, [personalizedRoutes]);

  const personalizedRouteIds = personalizedRoutes.map((route) => route.id).join('|');
  const popularRouteIds = popularRoutes.map((route) => route.id).join('|');

  useEffect(() => {
    const syncOnlineState = () => setRouteWeatherOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    syncOnlineState();
    window.addEventListener('online', syncOnlineState);
    window.addEventListener('offline', syncOnlineState);
    return () => {
      window.removeEventListener('online', syncOnlineState);
      window.removeEventListener('offline', syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (personalizedRoutes.length === 0) {
      setPersonalizedWeatherByRouteId({});
      return;
    }

    const controller = new AbortController();
    setPersonalizedWeatherByRouteId((prev) => {
      const next = { ...prev };
      personalizedRoutes.forEach((route) => {
        if (!next[route.id]?.data) {
          next[route.id] = { loading: true };
        }
      });
      return next;
    });

    personalizedRoutes.forEach((route) => {
      fetchRouteWeather(route, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setPersonalizedWeatherByRouteId((prev) => ({ ...prev, [route.id]: { data } }));
        })
        .catch((error: any) => {
          if (controller.signal.aborted) return;
          setPersonalizedWeatherByRouteId((prev) => ({
            ...prev,
            [route.id]: { error: error?.message || 'Weather unavailable' },
          }));
        });
    });

    return () => controller.abort();
  }, [personalizedRouteIds]);

  useEffect(() => {
    if (popularRoutesActivated) return;
    const node = popularRoutesRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setPopularRoutesActivated(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setPopularRoutesActivated(true);
        observer.disconnect();
      }
    }, { rootMargin: '240px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [popularRoutesActivated]);

  useEffect(() => {
    if (!popularRoutesActivated || popularRoutes.length === 0) return;

    const controller = new AbortController();
    setPopularWeatherByRouteId((prev) => {
      const next = { ...prev };
      popularRoutes.forEach((route) => {
        if (!next[route.id]?.data) {
          next[route.id] = { loading: true };
        }
      });
      return next;
    });

    popularRoutes.forEach((route) => {
      fetchRouteWeather(route, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setPopularWeatherByRouteId((prev) => ({ ...prev, [route.id]: { data } }));
        })
        .catch((error: any) => {
          if (controller.signal.aborted) return;
          setPopularWeatherByRouteId((prev) => ({
            ...prev,
            [route.id]: { error: error?.message || 'Weather unavailable' },
          }));
        });
    });

    return () => controller.abort();
  }, [popularRoutesActivated, popularRouteIds]);

  useEffect(() => {
    if (!selectedRouteId || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedRouteId]);

  // Check for email sign-in link on mount
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setIsVerifyingLink(true);
      const savedEmail = window.sessionStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        setNeedEmailConfirmation(true);
        setIsVerifyingLink(false);
      } else {
        handleCompleteSignInWithEmailLink(savedEmail);
      }
    }
  }, []);

  const handleCompleteSignInWithEmailLink = async (emailToConfirm: string) => {
    setIsVerifyingLink(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      const result = await signInWithEmailLink(auth, emailToConfirm.trim(), window.location.href);
      window.sessionStorage.removeItem('emailForSignIn');
      setAuthSuccess('Successfully signed in using secure passwordless email link!');
      setUser(result.user);
      // Clean query parameters from URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (err: any) {
      console.error('Email link sign in error:', err);
      let errMsg = err.message || String(err);
      if (err.code === 'auth/invalid-action-code') {
        errMsg = 'The sign-in link is invalid or has expired. Please request a new one.';
      }
      setAuthError(errMsg);
    } finally {
      setIsVerifyingLink(false);
      setNeedEmailConfirmation(false);
    }
  };

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    // Keep redirect path matching the current origin
    const redirectUrl = window.location.origin + window.location.pathname;

    const actionCodeSettings = {
      url: redirectUrl,
      handleCodeInApp: true,
      iOS: {
        bundleId: iosBundleId || 'com.pravaahtravels.ios'
      },
      android: {
        packageName: androidPackageName || 'com.pravaahtravels.android',
        installApp: true,
        minimumVersion: '12'
      }
    };

    try {
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.sessionStorage.setItem('emailForSignIn', email.trim());
      setAuthSuccess(`A passwordless sign-in link has been sent to ${email.trim()}. Click the link in your email to authenticate securely.`);
    } catch (err: any) {
      console.error('Passwordless send error:', err);
      let errMsg = err.message || String(err);
      if (err.code === 'auth/unauthorized-domain') {
        errMsg = `The domain ${window.location.host} is not in your authorized domains list in Firebase Console. Please add it to Authentication -> Settings -> Authorized Domains.`;
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // ----------------------------------------------------
  // AUTHENTICATION LOGIC
  // ----------------------------------------------------
  const ensureUserProfile = async (user: FirebaseUser, provider: 'password' | 'google' | 'github', profileDisplayName: string) => {
    const userDocRef = doc(db, 'users', user.uid);
    const existingUserDoc = await getDoc(userDocRef);

    if (existingUserDoc.exists()) {
      return;
    }

    const resolvedDisplayName = profileDisplayName.trim() || user.displayName || user.email?.split('@')[0] || 'Traveler';

    await setDoc(userDocRef, {
      displayName: resolvedDisplayName,
      email: user.email || '',
      photoURL: user.photoURL || '',
      provider,
      createdAt: serverTimestamp(),
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    setAuthLoading(true);

    try {
      if (authTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthSuccess('Logged in successfully!');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const profileName = displayName.trim() || email.split('@')[0];

        if (userCred.user) {
          await updateProfile(userCred.user, { displayName: profileName });
          await ensureUserProfile(userCred.user, 'password', profileName);
        }

        setAuthSuccess('Account created successfully!');
      }
    } catch (err: any) {
      console.error('Customer Auth Error:', err);
      let msg = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email address or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already in use. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new GithubAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      await ensureUserProfile(result.user, providerName, result.user.displayName || 'Traveler');
      setAuthSuccess(`Logged in securely via ${providerName === 'google' ? 'Google' : 'GitHub'}!`);
    } catch (err: any) {
      console.error('Social login failed:', err);
      setAuthError(err.message || String(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  // ----------------------------------------------------
  // ----------------------------------------------------
  // DATA FETCHING (FIRESTORE) WITH LOCALSTORAGE FALLBACKS
  // ----------------------------------------------------
  const [portalError, setPortalError] = useState('');

  // ----------------------------------------------------
  // ----------------------------------------------------
  // DATA FETCHING (FIRESTORE)
  // ----------------------------------------------------
  const fetchCustomerBookings = async (uid: string) => {
    setBookingsLoading(true);
    setPortalError('');
    try {
      const currentEmail = (auth.currentUser?.email || user?.email || '').trim();
      const emailCandidates = Array.from(new Set([currentEmail, currentEmail.toLowerCase()].filter(Boolean)));
      const bookingQueries = [
        query(collection(db, 'bookings'), where('userId', '==', uid)),
        query(collection(db, 'bookings'), where('customerId', '==', uid)),
        ...emailCandidates.flatMap((email) => [
          query(collection(db, 'bookings'), where('customerEmail', '==', email)),
          query(collection(db, 'bookings'), where('email', '==', email)),
        ]),
      ];
      const snapshots = await Promise.all(bookingQueries.map((bookingQuery) => getDocs(bookingQuery)));
      const bookingMap = new Map<string, any>();
      snapshots.forEach((snapshot) => {
        snapshot.docs.forEach((bookingDoc) => {
          bookingMap.set(bookingDoc.id, {
            id: bookingDoc.id,
            ...bookingDoc.data()
          });
        });
      });
      const fetched = Array.from(bookingMap.values()).map(normalizeBookingRecord);
      // Sort client side
      fetched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(fetched);
    } catch (err: any) {
      console.error('Error fetching bookings from Firestore:', err);
      setPortalError(`Failed to fetch bookings: ${err.message || String(err)}`);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchPrivateVault = async (uid: string) => {
    setVaultLoading(true);
    setPortalError('');
    try {
      // Fetch from /users/{userId}/private
      const q = collection(db, 'users', uid, 'private');
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((item: any) => item.type !== 'ai_itinerary');
      setVaultDocs(fetched);
    } catch (err: any) {
      console.error('Error fetching private vault from Firestore:', err);
      setPortalError(`Failed to fetch private vault: ${err.message || String(err)}`);
      setVaultDocs([]);
    } finally {
      setVaultLoading(false);
    }
  };

  const fetchSavedAiItineraries = async (uid: string) => {
    setPortalError('');
    try {
      const q = query(
        collection(db, 'users', uid, 'private'),
        where('type', '==', 'ai_itinerary')
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedAiItineraries(fetched);
    } catch (err: any) {
      console.error('Error fetching saved itineraries from Firestore:', err);
      setPortalError(`Failed to fetch saved itineraries: ${err.message || String(err)}`);
      setSavedAiItineraries([]);
    }
  };

  const fetchRecentCustomerEnquiries = async (userEmail: string) => {
    const rawEmail = userEmail.trim();
    const cleanEmail = rawEmail.toLowerCase();
    const emailsToCheck = Array.from(new Set([rawEmail, cleanEmail].filter(Boolean)));
    if (emailsToCheck.length === 0) {
      setRecentEnquiries([]);
      return;
    }

    try {
      const snapshots = await Promise.all(
        emailsToCheck.map((candidateEmail) => getDocs(query(
          collection(db, 'enquiries'),
          where('email', '==', candidateEmail)
        )))
      );
      const fetched = snapshots
        .flatMap((snapshot) => snapshot.docs)
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        .filter((item: any, index, allItems) => allItems.findIndex((candidate: any) => candidate.id === item.id) === index)
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 8);
      setRecentEnquiries(fetched);
    } catch (err: any) {
      console.warn('Recent enquiries unavailable for route personalization:', err);
      setRecentEnquiries([]);
    }
  };

  // ----------------------------------------------------
  // SUBMIT ACTIONS
  // ----------------------------------------------------
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setBookingSubmitting(true);
    const bookingData = {
      bookingId: `PRV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      customerId: user.uid,
      customerName: newBookingName,
      email: newBookingEmail,
      phone: newBookingPhone,
      packageId: '',
      packageTitle: newBookingPackage || 'Custom Package / Personalized Trip',
      travelDate: newBookingDate,
      guests: Number(newBookingAdults) + Number(newBookingChildren),
      totalPrice: Number(newBookingBudget) || 0,
      bookingStatus: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.uid,
      customerPhone: newBookingPhone,
      customerWhatsApp: newBookingWhatsApp,
      customerEmail: newBookingEmail,
      destination: newBookingDest,
      adults: Number(newBookingAdults),
      children: Number(newBookingChildren),
      pickupCity: newBookingPickupCity,
      budget: `₹${newBookingBudget.toLocaleString('en-IN')}`,
      price: Number(newBookingBudget) || 0,
      specialRequests: newBookingRequests,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      notes: [],
      assignedStaff: '',
      followUpDate: ''
    };

    try {
      await addDoc(collection(db, 'bookings'), bookingData);

      // Trigger automatic transactional emails
      triggerSystemEmail('booking-received', bookingData.customerEmail, {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        packageTitle: bookingData.packageTitle,
        travelDate: bookingData.travelDate,
        adults: bookingData.adults,
        children: bookingData.children,
        pickupCity: bookingData.pickupCity,
        budget: bookingData.budget,
        specialRequests: bookingData.specialRequests
      });

      triggerSystemEmail('new-booking', 'yash.km06@gmail.com', {
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        customerWhatsApp: bookingData.customerWhatsApp,
        packageTitle: bookingData.packageTitle,
        travelDate: bookingData.travelDate,
        adults: bookingData.adults,
        children: bookingData.children,
        pickupCity: bookingData.pickupCity,
        budget: bookingData.budget,
        specialRequests: bookingData.specialRequests
      });

    } catch (err: any) {
      console.error('Firestore booking submission failed:', err);
      alert(`Booking submission failed: ${err.message || String(err)}`);
    } finally {
      setShowNewBookingModal(false);
      setNewBookingDest('');
      setNewBookingDate('');
      setNewBookingRequests('');
      setNewBookingPhone('');
      setNewBookingWhatsApp('');
      setNewBookingPickupCity('');
      setNewBookingChildren(0);
      setNewBookingAdults(2);
      setBookingSubmitting(false);
      fetchCustomerBookings(user.uid);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    if (!user) return;
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, { status: 'Cancelled' });

      // Trigger booking-cancelled email notification
      const cancelledBooking = bookings.find(b => b.id === bookingId);
      if (cancelledBooking) {
        triggerSystemEmail('booking-cancelled', cancelledBooking.customerEmail || cancelledBooking.email || user.email || '', {
          customerName: cancelledBooking.customerName || user.displayName || 'Traveler',
          bookingId: bookingId,
          packageTitle: cancelledBooking.packageTitle,
          travelDate: cancelledBooking.travelDate
        });
      }
    } catch (err: any) {
      console.error('Firestore cancel failed:', err);
      alert(`Failed to cancel booking: ${err.message || String(err)}`);
    }
    fetchCustomerBookings(user.uid);
  };

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking || !user) return;

    setPaymentLoading(true);
    try {
      const docRef = doc(db, 'bookings', payingBooking.id);
      await updateDoc(docRef, { paymentStatus: 'Paid', status: 'Confirmed' });

      // Trigger booking-confirmed email notification
      triggerSystemEmail('booking-confirmed', payingBooking.customerEmail || payingBooking.email || user.email || '', {
        customerName: payingBooking.customerName || user.displayName || 'Traveler',
        bookingId: payingBooking.id,
        packageTitle: payingBooking.packageTitle,
        travelDate: payingBooking.travelDate
      });

      setPaymentSuccess(true);
      if (paymentResetTimeoutRef.current) {
        clearTimeout(paymentResetTimeoutRef.current);
      }
      paymentResetTimeoutRef.current = setTimeout(() => {
        setPayingBooking(null);
        setPaymentSuccess(false);
        setPaymentCardNum('');
        setPaymentExpiry('');
        setPaymentCvv('');
        fetchCustomerBookings(user.uid);
      }, 2000);
    } catch (err: any) {
      console.error('Firestore payment failed:', err);
      alert(`Payment submission failed: ${err.message || String(err)}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAddVaultDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vaultTitle || !vaultContent) return;

    setVaultSubmitting(true);
    const docData = {
      userId: user.uid,
      title: vaultTitle,
      content: vaultContent,
      category: vaultCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'users', user.uid, 'private'), docData);
    } catch (err: any) {
      console.error('Firestore vault save failed:', err);
      alert(`Failed to save document to Private Vault: ${err.message || String(err)}`);
    } finally {
      setShowAddVaultModal(false);
      setVaultTitle('');
      setVaultContent('');
      setVaultSubmitting(false);
      fetchPrivateVault(user.uid);
    }
  };

  const handleDeleteVaultDoc = async (docId: string) => {
    if (!user || !window.confirm('Delete this record permanently from your private vault?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'private', docId));
    } catch (err: any) {
      console.error('Firestore delete failed:', err);
      alert(`Failed to delete document: ${err.message || String(err)}`);
    }
    fetchPrivateVault(user.uid);
  };

  // ----------------------------------------------------
  // GEMINI AI PERSONALIZED ITINERARY GENERATOR
  // ----------------------------------------------------
  const handleGenerateAiItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError('');
    setAiResult(null);

    if (!aiDest) {
      setAiError('Please enter a destination.');
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch('/api/generate-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: aiDest,
          duration: aiDuration,
          budget: aiBudget,
          vibe: aiVibe,
          specialRequests: aiRequests
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || 'Server error generating package.');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error('AI Gen Error:', err);
      setAiError(err.message || 'The AI planner was unable to generate your package. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiItinerary = async () => {
    if (!user || !aiResult) return;
    setSavingAi(true);

    const docData = {
      userId: user.uid,
      type: 'ai_itinerary',
      title: aiResult.title,
      destination: aiDest,
      duration: aiResult.duration,
      budget: Number(aiBudget),
      vibe: aiVibe,
      itinerary: aiResult.itinerary,
      inclusions: aiResult.inclusions,
      exclusions: aiResult.exclusions,
      tips: aiResult.tips,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'users', user.uid, 'private'), docData);
      alert('Custom AI package saved securely to your Private Vault!');
    } catch (err: any) {
      console.error('Firestore save AI failed:', err);
      alert(`Failed to save AI package: ${err.message || String(err)}`);
    } finally {
      setSavingAi(false);
      fetchSavedAiItineraries(user.uid);
    }
  };

  const getTripDocumentsForBooking = (booking: any) => {
    const bookingId = String(booking?.id || '');
    const bookingNumber = String(booking?.bookingId || '');
    return vaultDocs.filter((item: any) => {
      const itemBookingId = String(item.bookingId || '');
      const itemBookingNumber = String(item.bookingNumber || '');
      return item.type === 'trip_document'
        && (itemBookingId === bookingId || itemBookingId === bookingNumber || itemBookingNumber === bookingNumber);
    });
  };

  const getTripDocumentStatus = (booking: any, documentType: BookingDocumentType): BookingDocumentStatus => {
    const existingDocument = getTripDocumentsForBooking(booking).find((item: any) => item.documentType === documentType);
    return (existingDocument?.documentStatus || booking?.documentStatus?.[documentType] || 'Pending') as BookingDocumentStatus;
  };

  const getTripManager = (booking: any) => ({
    name: booking?.tripOperations?.coordinatorName || booking?.tripManager?.name || booking?.assignedTripManager || booking?.assignedStaff || 'Pravaah Trip Desk',
    phone: booking?.tripOperations?.coordinatorPhone || booking?.tripManager?.phone || booking?.customerWhatsApp || '',
    email: booking?.tripManager?.email || '',
    emergencyContact: booking?.tripOperations?.emergencyContact || booking?.tripManager?.emergencyContact || booking?.customerPhone || '',
  });

  const getCustomerTripStatus = (booking: any): TripCustomerStatus => {
    const overrideStatus = booking?.tripStatusOverride || booking?.tripStatus;
    if (TRIP_STATUS_OPTIONS.includes(overrideStatus)) return overrideStatus;
    const bookingStatus = String(booking?.bookingStatus || booking?.status || 'Pending');
    if (bookingStatus === 'Cancelled') return 'Cancelled';
    if (bookingStatus === 'Completed' || bookingStatus === 'Trip Completed' || booking?.tripChecklist?.tripCompleted) return 'Completed';
    const departure = booking?.travelDate || booking?.departureDate;
    const departureTime = departure ? new Date(departure).getTime() : 0;
    if (departureTime && departureTime <= Date.now()) return 'In Progress';
    const checklist = booking?.tripChecklist || {};
    const ready = Boolean(
      checklist.bookingConfirmed
        && checklist.remainingPaymentReceived
        && checklist.documentsVerified
        && checklist.hotelAssigned
        && checklist.vehicleAssigned
        && checklist.driverAssigned
        && checklist.coordinatorAssigned
        && checklist.itineraryShared
        && checklist.customerBriefed
    );
    return ready ? 'Ready To Travel' : 'Upcoming';
  };

  const getSmartBookingStatus = (booking: any) => {
    const status = String(booking?.bookingStatus || booking?.status || 'Pending');
    if (['Completed', 'Trip Completed'].includes(status)) return booking?.reviewSubmitted ? 'Review Submitted' : 'Review Pending';
    if (['Pending', 'Contacted'].includes(status)) return 'Payment Pending';
    const remainingBalance = Number(booking?.remainingBalance ?? Math.max(Number(booking?.totalPrice ?? booking?.price ?? 0) - Number(booking?.advancePaid ?? booking?.advanceReceived ?? 0), 0));
    if (remainingBalance > 0) return 'Payment Pending';
    const documents = BOOKING_DOCUMENT_TYPES.map((documentType) => getTripDocumentStatus(booking, documentType));
    if (documents.some((documentStatus) => documentStatus !== 'Verified')) return 'Documents Pending';
    const travelTime = booking?.travelDate ? new Date(booking.travelDate).getTime() : 0;
    if (travelTime && travelTime <= Date.now()) return 'Trip Started';
    return 'Trip Ready';
  };

  const getBookingTimelineSteps = (booking: any) => {
    const status = String(booking?.bookingStatus || booking?.status || 'Pending');
    const remainingBalance = Number(booking?.remainingBalance ?? Math.max(Number(booking?.totalPrice ?? booking?.price ?? 0) - Number(booking?.advancePaid ?? booking?.advanceReceived ?? 0), 0));
    const documentsVerified = BOOKING_DOCUMENT_TYPES.every((documentType) => getTripDocumentStatus(booking, documentType) === 'Verified');
    const travelTime = booking?.travelDate ? new Date(booking.travelDate).getTime() : 0;
    const completedTrip = ['Completed', 'Trip Completed'].includes(status);
    const confirmed = ['Confirmed', 'Completed', 'Trip Completed'].includes(status);
    const tripStatus = getCustomerTripStatus(booking);
    const checklist = booking?.tripChecklist || {};

    return [
      { label: 'Enquiry', complete: Boolean(booking?.enquiryId || booking?.createdAt) },
      { label: 'Booking', complete: confirmed },
      { label: 'Payment Verified', complete: remainingBalance <= 0 || Boolean(checklist.remainingPaymentReceived) || normalizePaymentStatus(booking?.paymentStatus) === 'Paid' },
      { label: 'Documents Approved', complete: documentsVerified || Boolean(checklist.documentsVerified) },
      { label: 'Trip Ready', complete: tripStatus === 'Ready To Travel' || tripStatus === 'In Progress' || tripStatus === 'Completed' },
      { label: 'Pickup', complete: Boolean(checklist.customerBriefed && booking?.tripOperations?.pickupLocation && booking?.tripOperations?.pickupTime) },
      { label: 'Journey Started', complete: tripStatus === 'In Progress' || tripStatus === 'Completed' || Boolean(travelTime && travelTime <= Date.now()) },
      { label: 'Journey Completed', complete: completedTrip || tripStatus === 'Completed' },
      { label: 'Review Submitted', complete: Boolean(booking?.reviewSubmitted) },
    ];
  };

  const handleDownloadItinerary = (booking: any) => {
    const itineraryText = [
      'Pravaah Travels Itinerary',
      `Booking ID: ${booking.bookingId || booking.id}`,
      `Package: ${booking.packageTitle || 'Custom Package'}`,
      `Destination: ${booking.destination || 'Flexible'}`,
      `Departure: ${booking.travelDate || 'Flexible'}`,
      `Travellers: ${booking.guests || booking.travelers || 1}`,
      '',
      'A detailed itinerary will be shared by your trip manager once finalized.',
    ].join('\n');
    const blob = new Blob([itineraryText], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `${booking.bookingId || booking.id || 'pravaah-trip'}-itinerary.txt`;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleUploadTripDocument = async (booking: any, documentType: BookingDocumentType, file?: File) => {
    if (!user || !file) return;
    const uploadKey = `${booking.id}-${documentType}`;
    setDocumentUploadingKey(uploadKey);
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const storagePath = `users/${user.uid}/tripDocuments/${booking.id}/${Date.now()}-${cleanFileName}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      const now = new Date().toISOString();
      await addDoc(collection(db, 'users', user.uid, 'private'), {
        userId: user.uid,
        type: 'trip_document',
        title: `${documentType} - ${booking.packageTitle || 'Trip'}`,
        content: file.name,
        category: documentType === 'Travel Insurance' ? 'Insurance' : documentType === 'Emergency Contact' ? 'Emergency' : documentType === 'Passport' ? 'Passport' : 'Other',
        bookingId: booking.id,
        bookingNumber: booking.bookingId || '',
        packageTitle: booking.packageTitle || '',
        documentType,
        documentStatus: 'Pending',
        status: 'Pending',
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await fetchPrivateVault(user.uid);
    } catch (err: any) {
      console.error('Trip document upload failed:', err);
      setPortalError(`Failed to upload document: ${err.message || String(err)}`);
    } finally {
      setDocumentUploadingKey(null);
    }
  };

  // ----------------------------------------------------
  // SUB-RENDER: LOGIN / REGISTER FORMS
  // ----------------------------------------------------
  if (isVerifyingLink) {
    return (
      <div className="relative flex min-h-[86vh] items-center justify-center overflow-hidden bg-stone-950 px-4 py-16 font-sans" id="verifying-link-box">
        <img
          src="https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1800&q=80"
          alt="Himalayan pass"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/92 via-stone-950/70 to-stone-950/35" />
        <div className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/12 p-8 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 ring-1 ring-white/15">
            <RefreshCw className="h-9 w-9 animate-spin text-[#5eead4]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#fbbf24]">Secure portal</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Securing Your Connection</h2>
          <p className="mt-3 text-sm leading-7 text-stone-200">Checking secure sign-in link... Please wait while we authenticate your session.</p>
        </div>
      </div>
    );
  }

  if (needEmailConfirmation) {
    return (
      <div className="relative flex min-h-[86vh] items-center justify-center overflow-hidden bg-stone-950 px-4 py-16 font-sans" id="email-confirm-box">
        <img
          src="https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=1800&q=80"
          alt="Sacred Himalayan valley"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/92 via-stone-950/72 to-stone-950/35" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/14 p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-[#fbbf24] ring-1 ring-white/15">
              <Lock className="h-7 w-7 stroke-[2]" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#fbbf24]">Passwordless access</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Confirm Your Email</h2>
            <p className="mt-2 text-sm leading-7 text-stone-200">Please enter your email address to complete signing in with your email link.</p>
          </div>

          {authError && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200/60 bg-rose-50/95 p-4 text-xs font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleCompleteSignInWithEmailLink(confirmEmail); }} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-200">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/92 px-4 py-3.5 text-sm font-semibold text-stone-900 shadow-inner focus:border-[#5eead4] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingLink}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0f766e] py-3.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_38px_rgba(15,118,110,0.32)] transition hover:-translate-y-1 hover:bg-[#0d5f59] disabled:opacity-60"
            >
              {isVerifyingLink ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Verify & Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-[86vh] items-center overflow-hidden bg-stone-950 px-4 py-10 font-sans sm:px-6 lg:px-8" id="customer-login-box">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80"
          alt="Luxury Himalayan landscape"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-950/95 via-stone-950/75 to-stone-950/35" />
        <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-transparent to-stone-950/20" />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_520px]">
          <div className="hidden max-w-2xl space-y-7 text-white lg:block">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#fbbf24] backdrop-blur-md">
              Pravaah Private Portal
            </span>
            <div className="space-y-5">
              <h1 className="text-6xl font-semibold leading-[1.02] tracking-tight">
                Your journeys, documents, and memories in one secure place.
              </h1>
              <p className="max-w-xl text-base leading-8 text-stone-200">
                Sign in to manage bookings, open your private travel vault, save AI-designed itineraries, and publish verified trip stories.
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Calendar className="mb-2 h-5 w-5 text-[#5eead4]" />
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">Bookings</span>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Lock className="mb-2 h-5 w-5 text-[#fbbf24]" />
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">Vault</span>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Sparkles className="mb-2 h-5 w-5 text-[#f97350]" />
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-300">AI Trips</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[2rem] border border-white/15 bg-white/14 p-4 text-white shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-6">
            <div className="rounded-[1.5rem] bg-white/94 p-5 text-stone-950 shadow-2xl sm:p-7">
              {/* Upper Brand */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0f766e]/10 text-[#0f766e] ring-1 ring-[#0f766e]/15">
                  <User className="h-7 w-7 stroke-[2]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#0f766e]">Luxury Travel Workspace</span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Customer Portal</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-stone-500">Access secure bookings, travel documents & personalized AI packages</p>
              </div>

              {/* Tab switchers */}
              <div className="mb-6 grid grid-cols-3 rounded-full bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`rounded-full py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                    authTab === 'login' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('emailLink'); setAuthError(''); setAuthSuccess(''); }}
                  className={`rounded-full py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                    authTab === 'emailLink' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Email Link
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`rounded-full py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                    authTab === 'register' ? 'bg-white text-[#0f766e] shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Status Box */}
              {authError && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Passwordless Email Link Form */}
              {authTab === 'emailLink' ? (
                <form onSubmit={handleSendEmailLink} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                    <p className="mt-2 text-xs leading-6 text-stone-500">We'll email you a secure link to log in instantly without passwords.</p>
                  </div>

                  {/* Custom Platform Configurations */}
                  <div className="mt-4 space-y-4 rounded-3xl border border-stone-200 bg-[#fffaf1] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center text-xs font-extrabold text-stone-800">
                        <Shield className="mr-2 h-4 w-4 text-[#0f766e]" />
                        Redirect Platform Settings
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-stone-500 shadow-sm">Android & Apple</span>
                    </div>
                    <p className="text-xs leading-6 text-stone-500">
                      These package details will be packaged into the Firebase Dynamic/App Link settings to open your native apps natively.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-stone-500">Android Package Name</label>
                        <input
                          type="text"
                          value={androidPackageName}
                          onChange={(e) => setAndroidPackageName(e.target.value)}
                          placeholder="com.example.android"
                          className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 font-mono text-[11px] font-medium focus:border-[#0f766e] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-stone-500">Apple iOS Bundle ID</label>
                        <input
                          type="text"
                          value={iosBundleId}
                          onChange={(e) => setIosBundleId(e.target.value)}
                          placeholder="com.example.ios"
                          className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 font-mono text-[11px] font-medium focus:border-[#0f766e] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0f766e] py-3.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_38px_rgba(15,118,110,0.24)] transition hover:-translate-y-1 hover:bg-[#0d5f59] disabled:opacity-60"
                  >
                    {authLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>Send Secure Passwordless Link</span>
                    )}
                  </button>

                  {/* Instruction Guides toggle */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setShowPlatformConfigGuide(!showPlatformConfigGuide)}
                      className="cursor-pointer text-xs font-extrabold text-[#0f766e] underline decoration-[#0f766e]/30 underline-offset-4 hover:text-[#0d5f59]"
                    >
                      {showPlatformConfigGuide ? 'Hide Setup Guide for Web, Android & Apple iOS' : 'Show Setup Guide for Web, Android & Apple iOS'}
                    </button>
                  </div>

                  {showPlatformConfigGuide && (
                    <div className="mt-4 animate-fadeIn space-y-4 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-xs text-stone-800">
                      <h4 className="flex border-b border-stone-200 pb-2 font-extrabold text-[#0f766e]">
                        <Info className="mr-2 h-4 w-4" /> Multi-Platform Passwordless Authentication Configuration Guide
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">1. Firebase Console Enablement</span>
                          <p className="text-[11px] leading-relaxed text-stone-500">
                            Go to <strong className="font-semibold text-stone-700">Authentication &gt; Sign-in method</strong>. Enable <strong className="font-semibold text-stone-700">Email/Password</strong>, check <strong className="font-semibold text-stone-700">Email link (passwordless sign-in)</strong>, and click Save.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">2. Web Configuration</span>
                          <p className="mb-2 text-[11px] leading-relaxed text-stone-500">
                            Authorized Domains: In Firebase, go to <strong className="font-semibold text-stone-700">Authentication &gt; Settings &gt; Authorized Domains</strong> and ensure your web URL (e.g., <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">{window.location.host}</code>) is allowed.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">3. Android Setup (App Links)</span>
                          <p className="space-y-1 text-[11px] leading-relaxed text-stone-500">
                            <span className="block">- <strong className="font-semibold text-stone-700">Fingerprints:</strong> In Firebase Project Settings, add your Android App with Package Name <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">{androidPackageName}</code> and add SHA-1 / SHA-256 signatures.</span>
                            <span className="block">- <strong className="font-semibold text-stone-700">Assets Link:</strong> Place your <code className="font-mono text-[10px]">assetlinks.json</code> in your domain's <code className="font-mono text-[10px]">.well-known/assetlinks.json</code> location to match your fingerprints.</span>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                          <span className="mb-1 block font-bold text-stone-700">4. Apple iOS Setup (Universal Links)</span>
                          <p className="space-y-1 text-[11px] leading-relaxed text-stone-500">
                            <span className="block">- <strong className="font-semibold text-stone-700">Bundle ID & Team ID:</strong> Add an iOS App inside Firebase console with Bundle ID <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">{iosBundleId}</code> and add your App Store ID and Apple Team ID.</span>
                            <span className="block">- <strong className="font-semibold text-stone-700">AASA:</strong> Deploy your <code className="font-mono text-[10px]">apple-app-site-association</code> file to <code className="font-mono text-[10px]">.well-known/apple-app-site-association</code> domain file.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-5">
                  {authTab === 'register' && (
                    <div className="rounded-3xl border border-[#0f766e]/15 bg-[#0f766e]/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-stone-900">
                        <User className="h-4 w-4 text-[#0f766e]" />
                        Premium traveler profile
                      </div>
                      <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Yash Sharma"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fffaf1] px-4 py-3.5 text-sm font-semibold text-stone-900 transition focus:border-[#0f766e] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0f766e] py-3.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_18px_38px_rgba(15,118,110,0.24)] transition hover:-translate-y-1 hover:bg-[#0d5f59] disabled:opacity-60"
                  >
                    {authLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{authTab === 'login' ? 'Sign In Securely' : 'Register Account'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Social Authentication Row */}
              <div className="relative my-7 text-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-200"></span>
                </div>
                <span className="relative bg-white px-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-stone-400">Or Continue With</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-xs font-extrabold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e]/30 hover:bg-[#fffaf1]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-xs font-extrabold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e]/30 hover:bg-[#fffaf1]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-stone-200 bg-[#fffaf1] p-4 text-[11px] leading-6 text-stone-600">
                <strong className="text-stone-900">Security Highlight:</strong> We employ a strict user matching design. Booking details and private documents can ONLY be read by you. Not even our travel operators can break into your Private Vault.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // PORTAL LOGGED-IN VIEW
  // ----------------------------------------------------
  const portalUserName = profileName || user.displayName || user.email?.split('@')[0] || 'Traveler';
  const portalAvatarInitial = portalUserName.charAt(0).toUpperCase();
  const currentDateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
  const confirmedTrips = bookings.filter(b => b.status === 'Confirmed');
  const completedTrips = confirmedTrips.length;
  const upcomingBookings = bookings.filter(b => b.status !== 'Cancelled' && b.status !== 'Completed');
  const pendingEnquiries = bookings.filter(b => b.status === 'Pending' || b.status === 'New Lead' || b.status === 'New').length;
  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Recently';
  const getBookingImage = (booking: any) => {
    const savedMatch = savedPackages.find(saved => saved.title === booking.packageTitle || saved.destination === booking.destination);
    return getTravelImage(booking.imageUrl || booking.packageImageUrl || savedMatch?.imageUrl);
  };
  const normalizedBookings = bookings.map(normalizeBookingRecord);
  const filteredTripBookings = normalizedBookings.filter((booking) => {
    const searchText = tripSearch.trim().toLowerCase();
    if (!searchText) return true;
    return [
      booking.packageTitle,
      booking.bookingId,
      booking.destination,
    ].some((value) => String(value || '').toLowerCase().includes(searchText));
  });
  const visiblePersonalizedRoutes = personalizedRoutes.slice(0, 3);
  const visiblePopularRoutes = popularRoutes.slice(0, 6);
  const selectedExpeditionRoute = selectedRouteId
    ? POPULAR_TREK_ROUTES.find((route) => route.id === selectedRouteId)
    : undefined;
  const selectedExpeditionState = selectedRouteId
    ? personalizedWeatherByRouteId[selectedRouteId] || popularWeatherByRouteId[selectedRouteId]
    : undefined;
  const mountainStatusCounts = POPULAR_TREK_ROUTES.reduce((counts, route) => {
    const routeData = (personalizedWeatherByRouteId[route.id] || popularWeatherByRouteId[route.id])?.data;
    if (!routeData) return counts;
    const statusLabel = getRouteStatusTone(routeData).label;
    if (statusLabel === 'Rain Alert') counts.rain += 1;
    if (statusLabel === 'Snow Zone') counts.snow += 1;
    if (statusLabel === 'Stable') counts.stable += 1;
    return counts;
  }, { stable: 0, rain: 0, snow: 0 });
  const journeyTimelineItems = ['Booking Confirmed ✔', 'Mountain Conditions', 'Packing Ready', 'Departure Day', 'Enjoy Your Trek'];

  return (
    <div className="min-h-screen bg-[#f6f7f2] px-4 py-8 font-sans sm:px-6 lg:px-8" id="customer-portal-active-root">
      <div className="mx-auto max-w-7xl space-y-8">
      
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#081E2A] p-5 text-white shadow-[0_24px_70px_rgba(8,30,42,0.24)] sm:p-7 lg:p-8">
        <img
          src={getTravelImage('https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1800&q=80')}
          alt="Luxury mountain dashboard"
          className="absolute inset-0 h-full w-full object-cover opacity-38"
          referrerPolicy="no-referrer"
          onError={handleTravelImageError}
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#081E2A] via-[#081E2A]/86 to-[#081E2A]/45" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="rounded-[20px] border border-white/14 bg-white/10 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/25 bg-[#4DA528] text-3xl font-extrabold text-white shadow-xl">
                {user.photoURL ? (
                  <img src={getTravelImage(user.photoURL)} alt={portalUserName} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                ) : (
                  <span>{portalAvatarInitial}</span>
                )}
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#4DA528] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white">Customer Portal</span>
                  <span className="flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"><Shield className="mr-1.5 h-3.5 w-3.5 text-emerald-300" /> Secure</span>
                </div>
                <p className="font-serif text-[28px] italic leading-none text-[#4DA528]">Welcome back</p>
                <h1 className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight text-white sm:text-[44px]">{portalUserName}</h1>
                <p className="mt-2 text-sm text-white/72">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[18px] border border-white/14 bg-white/10 p-5 backdrop-blur-md">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55">Today</span>
              <p className="mt-2 text-xl font-bold text-white">{currentDateLabel}</p>
              <p className="mt-2 text-sm leading-6 text-white/68">Your bookings, vault, saved trips, and reviews are ready in one luxury travel dashboard.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onNavigateToHome}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
              >
                <Compass className="h-4 w-4" />
                <span>Browse Packages</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[5px] border border-white/20 bg-white/10 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-white/18"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" id="customer-dashboard-stats">
        {[
          ['Upcoming Bookings', upcomingBookings.length, Calendar, 'from-[#4DA528]/12 to-white'],
          ['Completed Trips', completedTrips, Briefcase, 'from-[#FF970D]/14 to-white'],
          ['Wishlist', savedPackages.length, Heart, 'from-rose-100 to-white'],
          ['Reviews', reviewSuccess ? 1 : 0, Star, 'from-amber-100 to-white'],
          ['Pending Enquiries', pendingEnquiries, AlertCircle, 'from-sky-100 to-white'],
        ].map(([label, value, Icon, tone]) => {
          const StatIcon = Icon as typeof Calendar;
          return (
            <div key={label as string} className={`group rounded-[18px] border border-stone-200 bg-linear-to-br ${tone as string} p-5 shadow-[0_12px_35px_rgba(18,38,32,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(18,38,32,0.12)]`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500">{label as string}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4DA528] shadow-sm">
                  <StatIcon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-5 text-3xl font-extrabold text-stone-950">{value as number}</p>
            </div>
          );
        })}
      </section>

      {portalError && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-sm">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-600 animate-bounce" />
          <span>Firestore Error: {portalError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto rounded-[18px] border border-stone-200 bg-white p-2 shadow-[0_12px_35px_rgba(18,38,32,0.06)]">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'bookings' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Calendar className="w-4.5 h-4.5" />
          <span>My Bookings & Requests ({bookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-assistant')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'ai-assistant' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5 text-teal-500 animate-pulse" />
          <span>AI Travel Assistant (Personalized)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('private-vault')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'private-vault' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Lock className="w-4.5 h-4.5 text-amber-500" />
          <span>Confidential Private Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved-packages')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'saved-packages' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Heart className="w-4.5 h-4.5 text-rose-500 fill-current" />
          <span>Wishlist ({savedPackages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('travel-history')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'travel-history' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Briefcase className="w-4.5 h-4.5 text-[#008080]" />
          <span>Travel History ({bookings.filter(b => b.status === 'Confirmed').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'profile' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <User className="w-4.5 h-4.5 text-teal-600" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'reviews' 
              ? 'bg-[#4DA528] text-white shadow-sm' 
              : 'text-stone-500 hover:bg-[#f6f7f2] hover:text-stone-850'
          }`}
        >
          <Star className="w-4.5 h-4.5 text-[#F4C430] fill-current" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'bookings' && (
        <div className="space-y-8" id="bookings-panel">
          <div className="rounded-[18px] border border-emerald-200/70 bg-emerald-50/70 p-5 shadow-sm" id="emergency-support-grid">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800">Emergency & Ground Support</h4>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[8.5px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Support Desk</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-800">Direct WhatsApp Helpline</h3>
                <p className="max-w-3xl text-xs font-light leading-relaxed text-stone-600">
                  For official road closures, permits, helicopter operations, or emergency logistics, confirm with the Pravaah support desk and the relevant government/operator source before departure.
                </p>
              </div>

              <a
                href="https://wa.me/919999999999?text=Hi%20Pravaah%20Travels,%20I%20am%20registered%20on%20the%20Customer%20Portal%20and%20need%20immediate%20trip%20assistance."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-emerald-600 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-emerald-700 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Get Help on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Bookings Title Header */}
          <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-linear-to-br from-white via-[#fffdf8] to-[#eef7ec] p-4 shadow-[0_18px_55px_rgba(18,38,32,0.08)] sm:p-5" id="my-trips-section">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#4DA528]/10" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">My Trips</span>
                <h3 className="mt-2 text-2xl font-extrabold text-stone-950">Your travel command center</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-500">Track booking confirmations, trip managers, documents, and payment progress from one premium dashboard.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 sm:min-w-[280px]">
                  <span className="sr-only">Search bookings</span>
                  <Compass className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={tripSearch}
                    onChange={(event) => setTripSearch(event.target.value)}
                    placeholder="Search package, booking ID, destination"
                    className="w-full rounded-[12px] border border-stone-200 bg-white/85 py-3 pl-10 pr-3 text-sm text-stone-700 shadow-sm focus:border-[#4DA528] focus:outline-none focus:ring-2 focus:ring-[#4DA528]/20"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(true)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow transition hover:-translate-y-0.5 hover:bg-[#FF970D]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Request Custom Package</span>
                </button>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="relative mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <SkeletonBookingCard key={idx} />
                ))}
              </div>
            ) : normalizedBookings.length === 0 ? (
              <div className="relative mt-6 overflow-hidden rounded-[22px] border border-dashed border-stone-300 bg-white/82 p-10 text-center shadow-sm">
                <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#4DA528]/10 to-transparent" />
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                  <Compass className="h-10 w-10" />
                </div>
                <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">No trips yet</h4>
                <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">
                  Request a custom package or save an itinerary and your confirmed bookings will appear here automatically.
                </p>
                <div className="relative mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={() => setShowNewBookingModal(true)} className="rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]">
                    Request a Trip
                  </button>
                  <button type="button" onClick={() => setActiveTab('ai-assistant')} className="rounded-[5px] border border-stone-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">
                    Open AI Planner
                  </button>
                </div>
              </div>
            ) : filteredTripBookings.length === 0 ? (
              <div className="relative mt-6 rounded-[22px] border border-dashed border-stone-300 bg-white/82 p-8 text-center shadow-sm">
                <h4 className="text-lg font-extrabold text-stone-900">No matching trips found</h4>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">Try a package name, destination, or booking ID from your confirmed travel records.</p>
                <button type="button" onClick={() => setTripSearch('')} className="mt-5 rounded-[5px] border border-stone-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="relative mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {filteredTripBookings.map((booking) => {
                  const tripManager = getTripManager(booking);
                  const smartStatus = getSmartBookingStatus(booking);
                  const tripStatus = getCustomerTripStatus(booking);
                  const remainingBalance = Number(booking.remainingBalance ?? 0);
                  const managerContact = tripManager.phone
                    ? `https://wa.me/${String(tripManager.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${tripManager.name || 'Pravaah Trip Desk'}, I need assistance with booking ${booking.bookingId || booking.id}.`)}`
                    : getBookingWhatsAppUrl(booking);

                  return (
                    <article
                      key={booking.id}
                      className="group overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_18px_50px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(18,38,32,0.14)]"
                    >
                      <div className="relative h-48 overflow-hidden bg-stone-100">
                        <img
                          src={getBookingImage(booking)}
                          alt={booking.packageTitle || booking.destination || 'Travel package'}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={handleTravelImageError}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-stone-950/75 via-stone-950/10 to-transparent" />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${getBookingStatusBadgeClasses(booking.bookingStatus)}`}>
                            {booking.bookingStatus}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${getPaymentStatusClasses(booking.paymentStatus)}`}>
                            {normalizePaymentStatus(booking.paymentStatus)}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${getTripStatusClasses(tripStatus)}`}>
                            {tripStatus}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/72">{booking.bookingId}</p>
                          <h4 className="mt-1 line-clamp-2 text-xl font-extrabold text-white">{booking.packageTitle}</h4>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
                          <div className="rounded-[14px] bg-stone-50 p-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Departure</p>
                            <p className="mt-1 font-semibold text-stone-900">{booking.travelDate || 'Flexible'}</p>
                          </div>
                          <div className="rounded-[14px] bg-stone-50 p-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Duration</p>
                            <p className="mt-1 font-semibold text-stone-900">{booking.duration || 'Custom duration'}</p>
                          </div>
                          <div className="rounded-[14px] bg-stone-50 p-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Travellers</p>
                            <p className="mt-1 font-semibold text-stone-900">{booking.guests || booking.travelers || 1}</p>
                          </div>
                          <div className="rounded-[14px] bg-stone-50 p-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Remaining</p>
                            <p className="mt-1 font-semibold text-stone-900">{formatPrice(remainingBalance)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-stone-100 bg-[#fffdf8] p-3">
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#4DA528]">Smart Status</p>
                            <p className="mt-1 text-sm font-bold text-stone-900">{smartStatus}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Trip Manager</p>
                            <p className="mt-1 text-sm font-bold text-stone-900">{tripManager.name}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingDetails(booking)}
                            className="rounded-[5px] border border-stone-200 bg-white px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadItinerary(booking)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-stone-200 bg-white px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Itinerary
                          </button>
                          <a
                            href={managerContact}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-[5px] bg-emerald-600 px-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-700"
                          >
                            Contact Manager
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section ref={popularRoutesRef} className="animate-fade-in overflow-hidden rounded-[28px] border border-white/70 bg-linear-to-br from-white via-[#fffdf8] to-[#eaf5e4] p-3 shadow-[0_18px_50px_rgba(18,38,32,0.1)] sm:p-4 lg:p-5" id="expedition-center">
            <div className="relative overflow-hidden rounded-[24px] bg-[#081E2A] p-4 text-white sm:p-5">
              <img
                src={getRouteImage()}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-25"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleTravelImageError}
              />
              <div className="absolute inset-0 bg-linear-to-br from-[#081E2A] via-[#123c3a]/92 to-[#4DA528]/60" />
              <div className="absolute -right-14 -top-20 h-44 w-44 rounded-full border border-white/10 bg-white/10" />
              <div className="relative grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55">For {portalUserName}</p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">🏔 Journey Companion</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/76">Everything you need before your next Himalayan adventure.</p>
                </div>

                <div className="rounded-[22px] border border-white/14 bg-white/12 p-3 backdrop-blur-md sm:p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55">Mountain Status</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {[
                      [`🟢 ${mountainStatusCounts.stable} Stable Routes`, 'border-emerald-300/40 bg-emerald-400/15 text-emerald-50'],
                      [`🟡 ${mountainStatusCounts.rain} Rain Alerts`, 'border-amber-300/40 bg-amber-400/15 text-amber-50'],
                      [`🔵 ${mountainStatusCounts.snow} Snow Zones`, 'border-sky-300/40 bg-sky-400/15 text-sky-50'],
                    ].map(([label, classes]) => (
                      <span key={label} className={`rounded-full border px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] ${classes}`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {routeWeatherOffline && (
              <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Live updates are paused while you are offline.</span>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-5">
              {visiblePersonalizedRoutes.length > 0 ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-stone-900">Personalized Routes</h4>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-500 shadow-sm">Top 3</span>
                  </div>
                  <div className="scrollbar-none -mx-2 grid auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto px-2 pb-2 md:mx-0 md:grid-flow-row md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
                    {visiblePersonalizedRoutes.map((route) => (
                      <RouteWeatherCard
                        key={route.id}
                        route={route}
                        state={personalizedWeatherByRouteId[route.id]}
                        onView={() => setSelectedRouteId(route.id)}
                      />
                    ))}
                  </div>

                  <div className="mt-4 rounded-[22px] border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur">
                    <div className="scrollbar-none flex items-center gap-3 overflow-x-auto">
                      {journeyTimelineItems.map((item, index) => (
                        <React.Fragment key={item}>
                          <div className="flex min-w-max items-center gap-2 rounded-full border border-stone-200 bg-[#fffdf8] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-stone-700">
                            <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-[#4DA528]' : 'bg-stone-300'}`} />
                            <span>{item}</span>
                          </div>
                          {index < journeyTimelineItems.length - 1 && <span className="text-stone-300">↓</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/75 p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4DA528]/10 text-3xl">🏔</div>
                  <h4 className="mt-4 text-lg font-extrabold text-stone-950">No adventure planned yet.</h4>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-stone-500">
                    Save a package, create a booking or send an enquiry and we'll automatically prepare live route intelligence for your journey.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToPackages || onNavigateToHome}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#FF970D] sm:w-auto"
                  >
                    Explore Packages
                  </button>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-stone-900">Popular Trek & Pilgrimage Routes</h4>
                  <span className="hidden rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-500 shadow-sm sm:inline-flex">Swipe to explore</span>
                </div>
                <div className="scrollbar-none -mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
                  {visiblePopularRoutes.map((route) => (
                    <RouteWeatherCard
                      key={route.id}
                      route={route}
                      state={popularWeatherByRouteId[route.id]}
                      compact
                      onView={() => setSelectedRouteId(route.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {selectedBookingDetails && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-2xl">
            <div className="relative overflow-hidden border-b border-stone-100 bg-[#071d28] p-5 text-white">
              <img
                src={getBookingImage(selectedBookingDetails)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-25"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleTravelImageError}
              />
              <div className="absolute inset-0 bg-linear-to-r from-[#071d28] via-[#071d28]/90 to-[#4DA528]/45" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9fe870]">Booking Details</p>
                  <h3 className="mt-1 text-2xl font-extrabold text-white">{selectedBookingDetails.packageTitle}</h3>
                  <p className="mt-2 text-sm text-white/68">{selectedBookingDetails.bookingId} • {selectedBookingDetails.destination || 'Flexible destination'}</p>
                </div>
                <button type="button" onClick={() => setSelectedBookingDetails(null)} className="rounded-full border border-white/20 bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-150px)] space-y-5 overflow-y-auto bg-[#fcfbf9] p-5">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Trip Snapshot</p>
                      <h4 className="mt-2 text-xl font-extrabold text-stone-950">{selectedBookingDetails.packageTitle}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${getBookingStatusBadgeClasses(selectedBookingDetails.bookingStatus)}`}>
                        {selectedBookingDetails.bookingStatus}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${getPaymentStatusClasses(selectedBookingDetails.paymentStatus)}`}>
                        {normalizePaymentStatus(selectedBookingDetails.paymentStatus)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${getTripStatusClasses(getCustomerTripStatus(selectedBookingDetails))}`}>
                        {getCustomerTripStatus(selectedBookingDetails)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
                    <div className="rounded-[14px] bg-stone-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Departure Date</p>
                      <p className="mt-1 font-semibold text-stone-900">{selectedBookingDetails.travelDate || 'Flexible'}</p>
                    </div>
                    <div className="rounded-[14px] bg-stone-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Duration</p>
                      <p className="mt-1 font-semibold text-stone-900">{selectedBookingDetails.duration || 'Custom duration'}</p>
                    </div>
                    <div className="rounded-[14px] bg-stone-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Travellers</p>
                      <p className="mt-1 font-semibold text-stone-900">{selectedBookingDetails.guests || selectedBookingDetails.travelers || 1}</p>
                    </div>
                    <div className="rounded-[14px] bg-stone-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">Smart Status</p>
                      <p className="mt-1 font-semibold text-stone-900">{getSmartBookingStatus(selectedBookingDetails)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Trip Manager</p>
                  {(() => {
                    const manager = getTripManager(selectedBookingDetails);
                    return (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4DA528]/10 text-[#4DA528]">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-stone-950">{manager.name}</p>
                            <p className="text-xs text-stone-500">Assigned Coordinator</p>
                          </div>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <a href={manager.phone ? `tel:${manager.phone}` : undefined} className={`flex items-center gap-2 rounded-[12px] border border-stone-100 bg-stone-50 px-3 py-2 ${manager.phone ? 'text-stone-700 hover:text-[#4DA528]' : 'pointer-events-none text-stone-400'}`}>
                            <Phone className="h-4 w-4" />
                            {manager.phone || 'Phone unavailable'}
                          </a>
                          <a href={manager.email ? `mailto:${manager.email}` : undefined} className={`flex items-center gap-2 rounded-[12px] border border-stone-100 bg-stone-50 px-3 py-2 ${manager.email ? 'text-stone-700 hover:text-[#4DA528]' : 'pointer-events-none text-stone-400'}`}>
                            <Mail className="h-4 w-4" />
                            {manager.email || 'Email unavailable'}
                          </a>
                          <p className="flex items-center gap-2 rounded-[12px] border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            <AlertCircle className="h-4 w-4" />
                            Emergency: {manager.emergencyContact || 'Support desk will assign before departure'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <section className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Trip Details</p>
                    <h4 className="mt-1 text-lg font-extrabold text-stone-950">Ground arrangements for your journey</h4>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${getTripStatusClasses(getCustomerTripStatus(selectedBookingDetails))}`}>
                    {getCustomerTripStatus(selectedBookingDetails)}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Coordinator', selectedBookingDetails.tripOperations?.coordinatorName || getTripManager(selectedBookingDetails).name],
                    ['Coordinator Phone', selectedBookingDetails.tripOperations?.coordinatorPhone || getTripManager(selectedBookingDetails).phone || 'To be shared'],
                    ['Driver', selectedBookingDetails.tripOperations?.driverName || 'To be assigned'],
                    ['Vehicle', selectedBookingDetails.tripOperations?.vehicleDetails || 'To be assigned'],
                    ['Hotel', selectedBookingDetails.tripOperations?.hotelName || 'To be assigned'],
                    ['Pickup Location', selectedBookingDetails.tripOperations?.pickupLocation || 'To be shared'],
                    ['Pickup Time', selectedBookingDetails.tripOperations?.pickupTime || 'To be shared'],
                    ['Emergency Contact', selectedBookingDetails.tripOperations?.emergencyContact || getTripManager(selectedBookingDetails).emergencyContact || 'Support desk'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[14px] border border-stone-100 bg-stone-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-stone-100 pt-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Trip Documents</p>
                  {(selectedBookingDetails.operationDocuments || []).length === 0 ? (
                    <p className="mt-3 rounded-[14px] border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">Final itinerary and vouchers will appear here once your operations team uploads them.</p>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {(selectedBookingDetails.operationDocuments as TripOperationDocument[]).map((documentItem) => (
                        <a
                          key={documentItem.id || documentItem.fileUrl}
                          href={documentItem.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group rounded-[14px] border border-stone-200 bg-[#fffdf8] p-3 transition hover:-translate-y-0.5 hover:border-[#4DA528] hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-stone-900">{documentItem.title || documentItem.type}</p>
                              <p className="mt-1 line-clamp-1 text-xs text-stone-500">{documentItem.fileName}</p>
                            </div>
                            <Download className="h-4 w-4 text-[#4DA528]" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Booking Timeline</p>
                    <h4 className="mt-1 text-lg font-extrabold text-stone-950">Trip readiness journey</h4>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-stone-500">{getSmartBookingStatus(selectedBookingDetails)}</span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {getBookingTimelineSteps(selectedBookingDetails).map((step, index) => (
                    <div key={step.label} className={`rounded-[16px] border p-3 ${step.complete ? 'border-[#4DA528]/25 bg-[#4DA528]/8' : 'border-stone-200 bg-stone-50'}`}>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${step.complete ? 'bg-[#4DA528] text-white' : 'bg-stone-200 text-stone-500'}`}>
                        {step.complete ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                      </div>
                      <p className="mt-3 text-sm font-extrabold text-stone-900">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Payment Tracking</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex justify-between rounded-[12px] bg-stone-50 px-3 py-2"><span>Total Amount</span><strong>{formatPrice(selectedBookingDetails.totalPrice || selectedBookingDetails.price || 0)}</strong></div>
                    <div className="flex justify-between rounded-[12px] bg-stone-50 px-3 py-2"><span>Advance Paid</span><strong>{formatPrice(selectedBookingDetails.advancePaid || selectedBookingDetails.advanceReceived || 0)}</strong></div>
                    <div className="flex justify-between rounded-[12px] bg-stone-50 px-3 py-2"><span>Remaining Amount</span><strong>{formatPrice(selectedBookingDetails.remainingBalance || 0)}</strong></div>
                    <div className="flex justify-between rounded-[12px] bg-stone-50 px-3 py-2"><span>Payment Due Date</span><strong>{selectedBookingDetails.paymentDueDate || 'To be assigned'}</strong></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(selectedBookingDetails.paymentHistory || []).length > 0 ? selectedBookingDetails.paymentHistory.map((payment: any) => (
                      <div key={payment.id || `${payment.label}-${payment.createdAt}`} className="rounded-[12px] border border-stone-100 bg-[#fffdf8] p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-stone-900">{payment.label || 'Payment recorded'}</span>
                          <strong>{formatPrice(payment.amount || 0)}</strong>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">{payment.method || 'Manual'} • {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN') : 'Date pending'}</p>
                      </div>
                    )) : <p className="rounded-[12px] border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">No payment history has been recorded yet.</p>}
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Document Vault</p>
                  <div className="mt-4 grid gap-3">
                    {BOOKING_DOCUMENT_TYPES.map((documentType) => {
                      const uploadedDocument = getTripDocumentsForBooking(selectedBookingDetails).find((item: any) => item.documentType === documentType);
                      const status = getTripDocumentStatus(selectedBookingDetails, documentType);
                      const uploadKey = `${selectedBookingDetails.id}-${documentType}`;
                      return (
                        <div key={documentType} className="rounded-[14px] border border-stone-100 bg-stone-50 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[#4DA528]" />
                              <div>
                                <p className="text-sm font-bold text-stone-900">{documentType}</p>
                                <p className="text-xs text-stone-500">{uploadedDocument?.fileName || 'Upload required'}</p>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] ${getDocumentStatusClasses(status)}`}>
                              {status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {uploadedDocument?.fileUrl && (
                              <a href={uploadedDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-[8px] border border-stone-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">
                                View File
                              </a>
                            )}
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] bg-[#4DA528] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-[#FF970D]">
                              {documentUploadingKey === uploadKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                              {uploadedDocument ? 'Replace' : 'Upload'}
                              <input
                                type="file"
                                className="sr-only"
                                disabled={documentUploadingKey === uploadKey}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  void handleUploadTripDocument(selectedBookingDetails, documentType, file);
                                  event.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Booking Notes</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                    {(selectedBookingDetails.notes && selectedBookingDetails.notes.length > 0)
                      ? selectedBookingDetails.notes.map((note: any) => `• ${note.text}`).join('\n')
                      : 'No notes have been added for this booking yet.'}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4DA528]">Actions</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => handleDownloadItinerary(selectedBookingDetails)} className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-stone-200 bg-white px-3 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-700 transition hover:border-[#4DA528] hover:text-[#4DA528]">
                      <Download className="h-3.5 w-3.5" />
                      Download Itinerary
                    </button>
                    <a href={getBookingWhatsAppUrl(selectedBookingDetails)} target="_blank" rel="noopener noreferrer" className="rounded-[8px] bg-emerald-600 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-700">
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedExpeditionRoute && (
        <RouteDetailModal
          route={selectedExpeditionRoute}
          state={selectedExpeditionState}
          onClose={() => setSelectedRouteId(null)}
        />
      )}

      {/* AI Assistant Tab */}
      {activeTab === 'ai-assistant' && (
        <div className="space-y-6 animate-fade-in" id="ai-assistant-panel">
          <div>
            <h3 className="text-lg font-bold text-stone-850 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
              <span>Personalized AI Package Designer</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Let Pravaah AI design a custom trip matching your precise budget, style, and travel desires</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="bg-white p-6 rounded-xl border border-stone-150 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-850 uppercase tracking-wider border-b border-stone-100 pb-2">Plan Preferences</h4>
              
              <form onSubmit={handleGenerateAiItinerary} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Destination / Regions</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Manali & Solang Valley"
                    value={aiDest}
                    onChange={(e) => setAiDest(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Duration (Days)</label>
                    <select
                      value={aiDuration}
                      onChange={(e) => setAiDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((d) => (
                        <option key={d} value={d}>{d} Days</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Vibe / Style</label>
                    <select
                      value={aiVibe}
                      onChange={(e) => setAiVibe(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                    >
                      <option value="Adventure">Adventure & Trekking</option>
                      <option value="Pilgrimage">Peaceful Pilgrimage</option>
                      <option value="Cultural">Local Culture & Heritage</option>
                      <option value="Leisure">Relaxing Leisure</option>
                      <option value="Balanced">Balanced Mix</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Total Budget Target (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={aiBudget}
                    onChange={(e) => setAiBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Wishes / Constraints (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="E.g. strict vegetarian dining, avoid rough high-altitude treks, scenic drives preferred"
                    value={aiRequests}
                    onChange={(e) => setAiRequests(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] resize-none"
                  />
                </div>

                {aiError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded text-[11px] font-semibold flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center justify-center space-x-1"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                      <span>Drafting Custom Itinerary...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Craft Personalized Trip</span>
                    </>
                  )}
                </button>
              </form>

              {/* Saved custom itineraries list */}
              {savedAiItineraries.length > 0 && (
                <div className="pt-4 border-t border-stone-100">
                  <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Saved Bespoke Packages</h5>
                  <div className="space-y-2">
                    {savedAiItineraries.map((itinerary) => (
                      <button
                        key={itinerary.id}
                        type="button"
                        onClick={() => setAiResult(itinerary)}
                        className="w-full text-left p-2.5 bg-stone-50 border border-stone-200 rounded text-xs hover:border-[#008080] transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-stone-700 truncate mr-2">{itinerary.title}</span>
                        <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Output Display */}
            <div className="lg:col-span-2 space-y-6">
              {aiLoading ? (
                <div className="bg-white rounded-xl border border-stone-150 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[400px]">
                  <Sparkles className="w-12 h-12 text-[#008080] animate-pulse mb-4" />
                  <h4 className="text-base font-bold text-stone-800">Drafting Bespoke Adventure...</h4>
                  <p className="text-xs text-stone-500 max-w-sm mt-1.5 leading-relaxed">
                    Connecting to Google Gemini API securely. Processing your style inputs, curating daily scenic drives, local culinary secrets, and building a fully customized travel itinerary...
                  </p>
                </div>
              ) : aiResult ? (
                <div className="bg-white rounded-xl border border-stone-200 shadow-md overflow-hidden">
                  
                  {/* Banner */}
                  <div className="bg-[#008080] text-white p-6 relative">
                    <div className="absolute right-4 top-4 bg-teal-600/30 text-[10px] font-bold px-2 py-1 rounded-md text-teal-100 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Gemini Custom Plan
                    </div>
                    <span className="text-xs text-teal-100 font-bold uppercase tracking-wider block">{aiResult.duration} ({aiVibe})</span>
                    <h4 className="text-xl font-extrabold tracking-tight mt-1">{aiResult.title}</h4>
                    <p className="text-xs text-teal-100/90 mt-1">Tailored for Budget: {formatPrice(Number(aiBudget))}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Actions bar */}
                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="text-[11px] text-stone-400">Save this to access anytime in your portal</span>
                      <button
                        type="button"
                        onClick={handleSaveAiItinerary}
                        disabled={savingAi}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save to Profile</span>
                      </button>
                    </div>

                    {/* Itinerary */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-bold text-stone-850 uppercase tracking-wider">Daily Travel Log</h5>
                      <div className="relative border-l-2 border-stone-200 pl-4 ml-2 space-y-4 py-2">
                        {aiResult.itinerary?.map((item: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-[#008080]" />
                            <h6 className="text-xs font-bold text-stone-850">Day {item.day || idx + 1}: {item.title}</h6>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Inclusions / Exclusions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-100 pt-6">
                      <div className="bg-emerald-50/40 p-4 rounded-lg border border-emerald-100">
                        <h6 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center">
                          <Check className="w-4 h-4 mr-1.5" /> What Is Included
                        </h6>
                        <ul className="space-y-1.5 text-xs text-emerald-950">
                          {aiResult.inclusions?.map((inc: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span>•</span>
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-stone-50 p-4 rounded-lg border border-stone-150">
                        <h6 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5 flex items-center">
                          <Info className="w-4 h-4 mr-1.5" /> Excluded Items
                        </h6>
                        <ul className="space-y-1.5 text-xs text-stone-600">
                          {aiResult.exclusions?.map((exc: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span>•</span>
                              <span>{exc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Expert Tips */}
                    {aiResult.tips && aiResult.tips.length > 0 && (
                      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-lg">
                        <h6 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2.5 flex items-center">
                          <Star className="w-4 h-4 mr-1.5 text-amber-600" /> Expert Local Tips
                        </h6>
                        <ul className="space-y-1.5 text-xs text-stone-700">
                          {aiResult.tips.map((tip: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-amber-500 font-bold">★</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl border border-stone-200 border-dashed p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                  <Compass className="w-12 h-12 text-stone-300 mb-3 animate-spin-slow" />
                  <h4 className="text-sm font-bold text-stone-600">Your AI itinerary awaits</h4>
                  <p className="text-xs text-stone-500 max-w-sm mt-1 leading-relaxed">
                    Fill in your favorite holiday coordinates on the left and tap "Craft Personalized Trip" to watch Gemini draft a premium customized adventure!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Private Vault Tab */}
      {activeTab === 'private-vault' && (
        <div className="space-y-6 animate-fade-in" id="private-vault-panel">
          
          <div className="relative overflow-hidden rounded-[22px] border border-amber-200 bg-[#fff8e8] p-5 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-6">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/20" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 shrink-0 rounded-[14px] bg-amber-100 p-3 text-amber-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-700">Encrypted Travel Locker</span>
                <h4 className="mt-1 text-xl font-extrabold text-stone-950">Zero-Knowledge Private Travel Vault</h4>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-amber-900/75">
                  Save confidential travel insurance policies, credit card emergency limits, flight coordinates, and passport copies safely. 
                  Protected strictly by Firestore rules; <strong>Not even Pravaah Travels operators can view this information</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVaultModal(true)}
              className="flex shrink-0 items-center space-x-1 rounded-[5px] bg-amber-700 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow transition-all hover:-translate-y-0.5 hover:bg-[#FF970D]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
            </div>
          </div>

          {vaultLoading ? (
            <div className="rounded-[18px] border border-stone-200 bg-white py-14 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-stone-500">Decrypting vault documents...</p>
            </div>
          ) : vaultDocs.length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-amber-200 bg-white p-10 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-amber-100 to-transparent" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Lock className="h-10 w-10" />
              </div>
              <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">Vault is empty</h4>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">Save secure backups of travel credentials for emergency retrieval anywhere.</p>
              <button
                type="button"
                onClick={() => setShowAddVaultModal(true)}
                className="relative mt-6 rounded-[5px] bg-amber-700 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
              >
                Add Secure Record
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {vaultDocs.map((doc) => (
                <div key={doc.id} className="relative overflow-hidden rounded-[18px] border border-stone-200 bg-white p-5 shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(18,38,32,0.12)]">
                  <div className="absolute right-4 top-4 text-amber-100">
                    <Lock className="h-16 w-16" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                        {doc.category || 'General Notes'}
                      </span>
                      <h4 className="mt-3 text-lg font-extrabold text-stone-950">{doc.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteVaultDoc(doc.id)}
                      className="relative rounded p-1 text-stone-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                      title="Delete securely"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <p className="mt-4 select-all whitespace-pre-wrap rounded-[12px] border border-stone-100 bg-[#f6f7f2] p-4 font-mono text-xs leading-relaxed text-stone-600">
                    {doc.content}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-[9px] text-stone-400">
                    <span>Saved: {new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center text-amber-600"><Lock className="w-3 h-3 mr-0.5" /> Local Rules Restrict Read</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Saved Packages Tab */}
      {activeTab === 'saved-packages' && (
        <div className="space-y-6 animate-fade-in" id="saved-packages-panel">
          <div className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-6">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Wishlist</span>
            <h3 className="mt-2 flex items-center gap-2 text-xl font-extrabold text-stone-950 sm:text-2xl">
              <Heart className="w-5 h-5 text-rose-500 fill-current" />
              <span>Your Wishlist</span>
            </h3>
            <p className="mt-1 text-sm text-stone-500">Quickly access and request bookings for tour packages you bookmarked.</p>
          </div>

          {savedPackagesLoading ? (
            <div className="rounded-[18px] border border-stone-200 bg-white py-14 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#008080] animate-spin mx-auto mb-2" />
              <p className="text-xs text-stone-500">Retrieving saved packages...</p>
            </div>
          ) : savedPackages.length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-rose-100 to-transparent" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Heart className="h-10 w-10 fill-current" />
              </div>
              <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">No saved packages yet</h4>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">
                Browse our selection of pilgrimage and adventure itineraries, and tap the heart icon on any package page to bookmark it here!
              </p>
              <button
                type="button"
                onClick={onNavigateToPackages || onNavigateToHome}
                className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D] sm:w-auto"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Packages</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedPackages.map((saved) => (
                <div key={saved.id} className="group flex flex-col justify-between overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]">
                  <div>
                    <div className="relative h-48 overflow-hidden">
                    <img 
                      src={getTravelImage(saved.imageUrl)} 
                      alt={saved.title} 
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={handleTravelImageError}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/55 to-transparent" />
                    <span className="absolute left-4 top-4 rounded bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528]">
                      {saved.duration || 'Flexible Days'}
                    </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="text-lg font-extrabold leading-tight text-stone-950">{saved.title}</h4>
                      {saved.destination && (
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{saved.destination}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col gap-3 border-t border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-[9px] text-stone-400 block uppercase tracking-wider">Target Budget</span>
                      <span className="text-lg font-extrabold text-[#4DA528]">{formatPrice(saved.price)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewBookingDest(saved.destination || '');
                          setNewBookingPackage(saved.title || '');
                          setNewBookingBudget(saved.price || 50000);
                          setShowNewBookingModal(true);
                        }}
                        className="rounded-[5px] bg-[#4DA528] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-[#FF970D]"
                      >
                        Book Now
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate?.('package-detail', saved.packageId || saved.id)}
                        className="rounded-[5px] border border-stone-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-600 transition hover:border-[#4DA528] hover:text-[#4DA528]"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSavedPackage(saved.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Travel History Tab */}
      {activeTab === 'travel-history' && (
        <div className="space-y-6 animate-fade-in" id="travel-history-panel">
          <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)]">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Travel Journal</span>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-stone-950">
              <Briefcase className="w-5 h-5 text-[#008080]" />
              <span>Your Himalayan Travel History</span>
            </h3>
            <p className="mt-1 text-sm text-stone-500">Relive and browse your verified, completed expeditions with Pravaah Travels.</p>
          </div>

          {bookings.filter(b => b.status === 'Confirmed').length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#4DA528]/10 to-transparent" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#4DA528]/10 text-[#4DA528]">
                <Compass className="h-10 w-10" />
              </div>
              <h4 className="relative mt-5 text-xl font-extrabold text-stone-900">No travel history detected</h4>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-stone-500">
                Once you complete your customized pilgrimage or scenic packages with us, your confirmed routes and completed dates will show up in this history pipeline!
              </p>
            </div>
          ) : (
            <div className="relative ml-0 space-y-6 border-l-2 border-[#4DA528]/30 py-2 pl-6 sm:ml-4">
              {bookings.filter(b => b.status === 'Confirmed').map((trip) => (
                <div key={trip.id} className="relative max-w-4xl overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_14px_38px_rgba(18,38,32,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]">
                  {/* Timeline point */}
                  <div className="absolute -left-[31px] top-8 z-10 h-3 w-3 rounded-full border-2 border-white bg-[#4DA528] shadow-xs" />
                  
                  <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                    <div className="relative h-48 md:h-full">
                      <img
                        src={getBookingImage(trip)}
                        alt={trip.destination || trip.packageTitle || 'Travel history'}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleTravelImageError}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-stone-950/55 to-transparent md:bg-linear-to-r" />
                    </div>
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <span className="rounded bg-emerald-50 px-3 py-1 text-[10px] font-bold tracking-wide text-emerald-800">
                        Verified Travel Log
                      </span>
                      <h4 className="text-xl font-extrabold text-stone-950">{trip.packageTitle}</h4>
                      <p className="flex items-center gap-1 text-sm text-stone-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Traveled on: {trip.travelDate}</span>
                      </p>
                      {trip.destination && (
                        <p className="flex items-center gap-1 text-sm text-stone-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{trip.destination}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewDestination(trip.destination || '');
                          setReviewComment(`My trip to ${trip.destination} with Pravaah Travels was fantastic. Everything was organized perfectly.`);
                          setActiveTab('reviews');
                        }}
                        className="rounded-[5px] bg-[#4DA528]/10 px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[#4DA528] transition-colors hover:bg-[#4DA528] hover:text-white"
                      >
                        Write traveler review
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in" id="profile-settings-panel">
          <div className="relative overflow-hidden rounded-[22px] bg-[#081E2A] p-6 text-white shadow-[0_20px_55px_rgba(8,30,42,0.18)] sm:p-8">
            <img
              src={getTravelImage('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80')}
              alt="Profile travel background"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
              referrerPolicy="no-referrer"
              onError={handleTravelImageError}
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#081E2A] via-[#081E2A]/88 to-[#081E2A]/55" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-[#4DA528] text-4xl font-extrabold shadow-xl">
                  {user.photoURL ? (
                    <img src={getTravelImage(user.photoURL)} alt={portalUserName} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={handleTravelImageError} />
                  ) : (
                    <span>{portalAvatarInitial}</span>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Traveler Profile</span>
                  <h3 className="mt-2 text-3xl font-extrabold text-white">{portalUserName}</h3>
                  <p className="mt-1 text-sm text-white/72">{user.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[470px]">
                {[
                  ['Phone', profilePhone || 'Not added'],
                  ['WhatsApp', profileWhatsApp || 'Not added'],
                  ['Member Since', memberSince],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[14px] border border-white/14 bg-white/10 p-4 backdrop-blur-md">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">{label}</span>
                    <p className="mt-2 truncate text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
            <div className="mb-6">
              <h4 className="text-xl font-extrabold text-stone-950">Secure Profile Settings</h4>
              <p className="mt-1 text-sm text-stone-500">Manage your personal coordinates and favorite destinations for customized trips.</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="E.g. +91 98765 43210"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="E.g. +91 98765 43210"
                      value={profileWhatsApp}
                      onChange={(e) => setProfileWhatsApp(e.target.value)}
                      className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Preferred Himalayan Destinations</label>
                  <input
                    type="text"
                    placeholder="E.g. Kedarnath, Spiti, Chardham"
                    value={profilePrefDest}
                    onChange={(e) => setProfilePrefDest(e.target.value)}
                    className="w-full rounded-[12px] border border-stone-200 bg-[#f6f7f2] px-4 py-3 text-sm focus:border-[#4DA528] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                <span className="text-[10px] text-stone-400 font-light">Last sync: Real-time Firestore Database</span>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex items-center space-x-1.5 rounded-[5px] bg-[#4DA528] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow transition-all hover:bg-[#FF970D]"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews and Feedback Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-fade-in" id="customer-reviews-tab">
          <div className="relative overflow-hidden rounded-[22px] border border-stone-200 bg-white p-6 shadow-[0_14px_38px_rgba(18,38,32,0.08)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#4DA528]/10 to-transparent" />
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="relative space-y-2 text-center">
                <span className="inline-block rounded-full bg-[#4DA528]/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#4DA528]">
                  Share Your Experience
                </span>
                <h3 className="font-serif text-3xl font-light text-stone-950 sm:text-4xl">
                  Write Your <span className="font-serif font-normal italic text-[#4DA528]">Traveler Log</span>
                </h3>
                <p className="mx-auto max-w-md text-sm font-light leading-7 text-stone-500">
                  Document your mountain journeys across Uttarakhand and Himachal Pradesh. Your reviews appear instantly on the homepage reviews section!
                </p>
              </div>

              {reviewSuccess ? (
                <div className="animate-fade-in space-y-4 rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4DA528] text-white shadow">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-xl font-extrabold text-stone-900">Review Published Successfully!</h4>
                  <p className="mx-auto max-w-sm text-sm font-light leading-7 text-stone-600">
                    Your direct customer experience has been published to the homepage reviews section. Thank you for choosing Pravaah Travels!
                  </p>
                  <button 
                    type="button"
                    onClick={() => setReviewSuccess(false)}
                    className="rounded-[5px] bg-stone-900 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-stone-850"
                  >
                    Write Another Review
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reviewDestination.trim()) {
                    alert('Please enter or select a traversed destination.');
                    return;
                  }
                  if (!reviewComment.trim()) {
                    alert('Please enter your review details.');
                    return;
                  }

                  setReviewSubmitting(true);
                  try {
                    let finalImageUrl = '';
                    if (reviewImagePreview) {
                      finalImageUrl = await resizeAndCompressImage(reviewImagePreview);
                    }

                    const payload = {
                      name: user?.displayName || user?.email?.split('@')[0] || 'Verified Guest',
                      rating: Number(reviewRating),
                      comment: reviewComment.trim(),
                      destination: reviewDestination.trim(),
                      imageUrl: finalImageUrl,
                      verified: true,
                      createdAt: new Date().toISOString()
                    };

                    await addDoc(collection(db, 'reviews'), payload);

                    // Trigger automated email alert to admin
                    triggerSystemEmail('new-review', 'yash.km06@gmail.com', {
                      customerName: payload.name,
                      destination: payload.destination,
                      rating: payload.rating,
                      comment: payload.comment,
                      imageUrl: payload.imageUrl || null
                    });

                    setReviewSuccess(true);
                    setReviewComment('');
                    setReviewDestination('');
                    setReviewImagePreview(null);
                    setReviewRating(5);
                  } catch (err) {
                    console.error('Error submitting review:', err);
                    alert('Failed to publish review to database.');
                  } finally {
                    setReviewSubmitting(false);
                  }
                }} className="space-y-5">
                  
                  {/* Destination Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Traversed Destination</label>
                    <input 
                      type="text" 
                      required
                      placeholder="E.g. Kedarnath (Sacred Valleys)"
                      value={reviewDestination}
                      onChange={(e) => setReviewDestination(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] font-medium"
                    />
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Log Rating</label>
                    <div className="flex items-center gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isLight = reviewHoverRating !== null ? val <= reviewHoverRating : val <= reviewRating;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setReviewRating(val)}
                            onMouseEnter={() => setReviewHoverRating(val)}
                            onMouseLeave={() => setReviewHoverRating(null)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star 
                              className={`w-6 h-6 transition-colors ${
                                isLight ? 'text-[#F4C430] fill-current' : 'text-stone-200'
                              }`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Area */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Your Experience</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Share your spiritual or adventurous details. Let future travelers know about the road pacing, boutique cottage comfort, and coordination help!"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-[#008080] leading-relaxed resize-none"
                    />
                  </div>

                  {/* Image Drag & Drop File Upload */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Upload Trip Photograph (Optional)</label>
                    
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReviewImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                      className="border border-dashed border-stone-300 hover:border-[#008080] rounded-lg p-5 text-center cursor-pointer bg-stone-50/50 transition-colors relative"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReviewImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {reviewImagePreview ? (
                        <div className="space-y-2">
                          <img 
                            src={reviewImagePreview} 
                            alt="Selected trip photography" 
                            className="max-h-40 mx-auto rounded shadow-sm border border-stone-200 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[10px] text-stone-400">Tap or drag again to replace image</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-stone-600">Drag & drop your scenic photo here</span>
                          <span className="block text-[10px] text-stone-400">or click to browse your devices (JPEG, PNG, WEBP)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1"
                    >
                      {reviewSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                          <span>Publishing Trip Log...</span>
                        </>
                      ) : (
                        <span>Publish Review to Live Directory</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* MODALS */}
      {showNewBookingModal && (
        <div className="fixed inset-0 bg-[#000000]/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="new-booking-modal">
          <div className="bg-[#fcfbf9] border border-stone-250 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto font-sans flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#008080] text-white p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="absolute top-5 right-5 text-white/85 hover:text-white hover:rotate-90 transition-all duration-300 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF7F50] bg-white/10 px-2 py-0.5 rounded-sm">Premium Traveler Club</span>
              <h3 className="text-lg font-serif italic text-white mt-1">Request Custom Trip Planning</h3>
              <p className="text-xs text-stone-100 font-light mt-1">
                Fill in the details below. Our travel operator will contact you manually to draft your itinerary.
              </p>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              
              {/* Grid for Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Yash Kumar"
                    value={newBookingName}
                    onChange={(e) => setNewBookingName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={newBookingEmail}
                    onChange={(e) => setNewBookingEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Grid for Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="E.g. +91 98765 43210"
                    value={newBookingPhone}
                    onChange={(e) => setNewBookingPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp contact"
                    value={newBookingWhatsApp}
                    onChange={(e) => setNewBookingWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Destination & Package Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="Spiti, Ladakh, Spiti, etc."
                    value={newBookingDest}
                    onChange={(e) => setNewBookingDest(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Package / Theme Title</label>
                  <input
                    type="text"
                    placeholder="Custom Holiday Tour"
                    value={newBookingPackage}
                    onChange={(e) => setNewBookingPackage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Date, Adults, Children */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={newBookingDate}
                    onChange={(e) => setNewBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Adults * (12+ yrs)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newBookingAdults}
                    onChange={(e) => setNewBookingAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Children (0-11 yrs)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newBookingChildren}
                    onChange={(e) => setNewBookingChildren(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Pickup City & Budget Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 font-sans">Pickup City</label>
                  <input
                    type="text"
                    placeholder="E.g. Delhi, Chandigarh"
                    value={newBookingPickupCity}
                    onChange={(e) => setNewBookingPickupCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Budget Limit (INR)</label>
                  <input
                    type="number"
                    required
                    min={5000}
                    value={newBookingBudget}
                    onChange={(e) => setNewBookingBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Special travel/hotel requirements</label>
                <textarea
                  rows={2}
                  placeholder="Include any preferred hotels, meal specifications or route requests..."
                  value={newBookingRequests}
                  onChange={(e) => setNewBookingRequests(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-250 rounded text-xs focus:outline-none focus:border-[#008080]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 font-sans">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
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
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {payingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="payment-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-100 overflow-hidden">
            
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold">Secure Card Checkout</h4>
                <p className="text-xs text-teal-100">Booking: {payingBooking.packageTitle}</p>
              </div>
              <CreditCard className="w-8 h-8 opacity-45" />
            </div>

            {paymentSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3.5]" />
                </div>
                <h4 className="text-base font-bold text-stone-850">Payment Successful!</h4>
                <p className="text-xs text-stone-500">Your trip is now confirmed and verified. Booking status updated in Firestore.</p>
              </div>
            ) : (
              <form onSubmit={handleMakePayment} className="p-5 space-y-4">
                <div className="bg-stone-50 p-3 rounded border border-stone-200 flex justify-between text-xs font-semibold">
                  <span className="text-stone-500">Total Dues Payment:</span>
                  <span className="text-[#008080]">{formatPrice(payingBooking.price)}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Yash Sharma"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4111 2222 3333 4444"
                    value={paymentCardNum}
                    onChange={(e) => setPaymentCardNum(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={paymentExpiry}
                      onChange={(e) => setPaymentExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">CVV Code</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      placeholder="•••"
                      value={paymentCvv}
                      onChange={(e) => setPaymentCvv(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-teal-600 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setPayingBooking(null)}
                    className="px-4 py-2 border border-stone-200 rounded text-stone-600 hover:text-stone-850 hover:bg-stone-50 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded shadow flex items-center space-x-1"
                  >
                    {paymentLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Complete Checkout</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VAULT MODAL */}
      {showAddVaultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-vault-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-100 overflow-hidden">
            
            <div className="bg-amber-700 text-white p-5 flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <h4 className="text-base font-bold">Add Vault Document</h4>
            </div>

            <form onSubmit={handleAddVaultDoc} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Document Category</label>
                <select
                  value={vaultCategory}
                  onChange={(e) => setVaultCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-amber-700"
                >
                  <option value="Passport">Passport Details</option>
                  <option value="Insurance">Travel Insurance Policies</option>
                  <option value="Emergency">Emergency Contact Numbers</option>
                  <option value="Checklist">Travel checklists & Lists</option>
                  <option value="Other">Confidential Travel Notes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Document / Note Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Yash Passport Details"
                  value={vaultTitle}
                  onChange={(e) => setVaultTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-amber-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Confidential Information / Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="E.g. Passport Number: Z918239, Issue Date: 12/03/2024, Expire Date: 11/03/2034, Emergency Contact: Mom +91..."
                  value={vaultContent}
                  onChange={(e) => setVaultContent(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none focus:border-amber-700 resize-none font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddVaultModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded text-stone-600 hover:text-stone-850 hover:bg-stone-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vaultSubmitting}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded shadow flex items-center space-x-1"
                >
                  {vaultSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Encrypt & Store</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
