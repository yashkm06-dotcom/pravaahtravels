import type { TravelPackage } from '../types';
import { PRODUCTION_SITE_ORIGIN } from './seoSitemap';
import { getPackageNavigationTarget } from './packageRoute';
import type { BusinessProfile } from './businessProfile';

export interface ResolvedPackageSeo {
  title: string;
  displayTitle: string;
  seoTitle: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogImage: string;
  heroImageAlt: string;
  schemaMarkup: Record<string, unknown>;
  robots: string;
}

/**
 * Curated, fact-checked package content enhancements: elevated, human-written, search-intent-aligned
 * display titles, SEO titles, and descriptive summaries strictly grounded in factual itinerary data.
 */
export const ENHANCED_PACKAGE_CONTENT: Record<string, {
  displayTitle?: string;
  seoTitle?: string;
  description?: string;
}> = {
  'amazing-thailand-bangkok-chiang-mai-and-phuket': {
    displayTitle: 'Thailand: Bangkok, Chiang Mai & Phuket',
    seoTitle: 'Thailand Tour: Bangkok Temples, Chiang Mai Heritage & Phuket Beaches',
    description: 'Explore Thailand across 9 days from Bangkok’s royal temples and floating markets to Chiang Mai’s Lanna heritage and Phuket’s Andaman coast.',
  },
  'auli-snow-escape-skiing-and-himalayan-cable-car-views': {
    displayTitle: 'Auli Skiing & Cable Car Himalayan Tour',
    seoTitle: 'Auli Skiing & Cable Car Tour: Snow Slopes & Nanda Devi Views',
    description: 'Experience beginner-friendly skiing on Auli’s snow slopes, Asia’s longest ropeway from Joshimath, and panoramic vistas of Nanda Devi.',
  },
  'bali-family-holiday-culture-nature-and-beach-fun-for-all-ages': {
    displayTitle: 'Bali Family Vacation',
    seoTitle: 'Bali Family Vacation: Safari Park, Waterbom & Beach Resorts',
    description: 'A relaxed family holiday in Bali featuring safari adventures, gentle cultural workshops, waterparks, and safe beachfront resort stays.',
  },
  'bali-highlights-classic-ubud-kintamani-seminyak-and-uluwatu-tour': {
    displayTitle: 'Bali: Ubud, Kintamani, Seminyak & Uluwatu',
    seoTitle: 'Bali Tour: Ubud Culture, Mount Batur Volcano & Uluwatu Sunset',
    description: 'Explore Bali’s iconic sights across 6 days including Ubud rice terraces, Mount Batur viewpoints in Kintamani, Seminyak beaches, and Uluwatu cliff temple.',
  },
  'bali-honeymoon-escape-private-villas-in-ubud-sidemen-and-nusa-dua': {
    displayTitle: 'Bali Honeymoon: Ubud, Sidemen & Nusa Dua Villas',
    seoTitle: 'Bali Honeymoon: Private Pool Villas in Ubud, Sidemen & Nusa Dua',
    description: 'An intimate Bali honeymoon featuring private pool villas among Ubud’s jungles, scenic Sidemen valley terraces, and beachfront luxury in Nusa Dua.',
  },
  'bali-nusa-penida-escape-island-hopping-cliffs-and-hidden-lagoons': {
    displayTitle: 'Bali & Nusa Penida Island Tour',
    seoTitle: 'Bali & Nusa Penida Island Tour: Kelingking Beach & Snorkeling',
    description: 'Combine Bali’s cultural highlights with dramatic coastal cliffs, manta ray snorkeling, and turquoise waters of Nusa Penida and Broken Beach.',
  },
  'bangkok-pattaya-compact-thailand-city-and-beach-break': {
    displayTitle: 'Bangkok & Pattaya City & Beach Tour',
    seoTitle: 'Bangkok & Pattaya Tour: City Temples, Nightlife & Coral Island',
    description: 'A 4-day Thailand getaway combining Bangkok’s historic temples and shopping with Pattaya’s seaside water sports and Coral Island cruise.',
  },
  'buran-ghati-trek': {
    displayTitle: 'Buran Ghati Trek',
    seoTitle: 'Buran Ghati Trek | Himalayan Pass Expedition',
    description: 'Cross the Buran Ghati pass from Janglik to Barua through Himachal Pradesh forests, Dayara meadows, Chandernahan glacial lakes, and snow descents.',
  },
  'char-dham-yatra-yamunotri-gangotri-kedarnath-and-badrinath': {
    displayTitle: 'Uttarakhand Char Dham Yatra',
    seoTitle: 'Uttarakhand Char Dham Yatra: Yamunotri, Gangotri, Kedarnath & Badrinath',
    description: 'A complete 10-day sacred pilgrimage across the Garhwal Himalayas visiting Yamunotri, Gangotri, Kedarnath, and Badrinath with dedicated vehicle and local guidance.',
  },
  'chopta-tungnath-chandrashila-trek': {
    displayTitle: 'Chopta, Tungnath & Chandrashila Trek',
    seoTitle: 'Chopta Tungnath & Chandrashila Trek: Highest Shiva Temple Summit',
    description: 'Trek through alpine rhododendron forests from Chopta to the ancient Tungnath temple (3,680m) and the panoramic 360-degree Himalayan summit of Chandrashila.',
  },
  'complete-bali-explorer-ubud-north-bali-nusa-penida-and-the-south-coast': {
    displayTitle: 'Bali & Nusa Penida Grand Island Explorer',
    seoTitle: 'Complete Bali Explorer: Ubud, North Bali Waterfalls & Nusa Penida',
    description: 'An 8-day Bali expedition combining Ubud culture, Bedugul and northern waterfalls, dramatic Nusa Penida island cliffs, and vibrant southern beaches.',
  },
  'complete-ladakh-explorer-nubra-pangong-tso-moriri-and-monasteries': {
    displayTitle: 'Ladakh: Nubra, Pangong & Tso Moriri Circuit',
    seoTitle: 'Ladakh Circuit: Khardung La, Nubra Valley, Pangong Tso & Tso Moriri',
    description: 'An expansive 9-day Ladakh journey over Khardung La to Nubra Valley, Pangong Tso, and the remote high-altitude waters of Tso Moriri lake in Changthang.',
  },
  'complete-thailand-explorer-bangkok-to-chiang-mai-and-islands': {
    displayTitle: 'Thailand: Bangkok, Chiang Mai, Phuket & Krabi',
    seoTitle: 'Thailand Grand Tour: Bangkok, Ayutthaya, Chiang Mai, Phuket & Krabi',
    description: 'A 12-day journey across Thailand covering Bangkok temples, historic Ayutthaya, Chiang Mai mountain culture, Phuket island viewpoints, and Krabi’s Railay coast.',
  },
  'complete-vietnam-explorer-hanoi-to-mekong-delta-north-south-journey': {
    displayTitle: 'Vietnam: Hanoi to the Mekong Delta',
    seoTitle: 'Complete Vietnam Explorer: Hanoi, Halong, Hue, Hoi An & Mekong Delta',
    description: 'A grand journey through Vietnam from north to south covering Hanoi, Halong Bay, imperial Hue, ancient Hoi An, Saigon, and the waterways of the Mekong Delta.',
  },
  'da-nang-and-hoi-an-golden-bridge-beaches-and-lantern-heritage-break': {
    displayTitle: 'Da Nang & Hoi An: Golden Bridge & Coastal Heritage',
    seoTitle: 'Da Nang & Hoi An Golden Bridge Tour: Central Vietnam Coast',
    description: 'Explore Central Vietnam with the iconic Golden Bridge at Ba Na Hills, My Khe Beach, and the UNESCO-listed ancient streets and lantern boats of Hoi An.',
  },
  'dharamshala-bir-billing-paragliding-and-tibetan-culture-tour': {
    displayTitle: 'Dharamshala & Bir Billing Paragliding Tour',
    seoTitle: 'Dharamshala & Bir Billing Tour: Dalai Lama Temple & Tandem Paragliding',
    description: 'Experience Tibetan heritage at McLeodganj, serene Kangra tea estates, and world-renowned tandem paragliding flights from the take-off point at Billing.',
  },
  'do-dham-yatra-kedarnath-and-badrinath-pilgrimage': {
    displayTitle: 'Do Dham Yatra: Kedarnath & Badrinath',
    seoTitle: 'Do Dham Yatra Package: Kedarnath & Badrinath Sacred Circuit',
    description: 'A spiritually enriching 6-day pilgrimage linking the holy shrines of Kedarnath and Badrinath with scenic Garhwal valley routes and experienced local guidance.',
  },
  'dubai-and-abu-dhabi-explorer-twin-emirates-culture-and-modern-city-tour': {
    displayTitle: 'Dubai & Abu Dhabi Twin Emirates Tour',
    seoTitle: 'Dubai & Abu Dhabi Tour: Sheikh Zayed Mosque & City Highlights',
    description: 'A twin-city journey combining Dubai’s futuristic landmarks and desert safari with Abu Dhabi’s grand Sheikh Zayed Mosque and cultural Louvre museum.',
  },
  'dubai-budget-escape-affordable-city-and-desert-holiday': {
    displayTitle: 'Dubai Budget Tour: City & Desert Safari',
    seoTitle: 'Dubai Budget Tour: Dhow Cruise, Souks, Burj Khalifa & Desert Safari',
    description: 'An accessible 4-day Dubai holiday featuring city highlights, a traditional Creek abra boat ride, gold and spice souks, and an evening desert safari with BBQ.',
  },
  'dubai-family-vacation-theme-parks-aquariums-and-fun-for-all-ages': {
    displayTitle: 'Dubai Family Vacation: Theme Parks & Aquariums',
    seoTitle: 'Dubai Family Vacation: Aquaventure, Dubai Mall & Desert Safari',
    description: 'A family vacation in Dubai featuring Dubai Aquarium & Underwater Zoo, Aquaventure Waterpark at Atlantis, desert dunes, and city sights.',
  },
  'dubai-honeymoon-escape-private-desert-yacht-and-spa-romance': {
    displayTitle: 'Dubai Honeymoon: Private Yacht & Desert Romance',
    seoTitle: 'Dubai Honeymoon Package: Private Desert Camp & Marina Yacht',
    description: 'An elegant honeymoon in Dubai with private sunset yacht sailing along the Marina, candlelit desert dining under Arabian stars, and luxury city suites.',
  },
  'dubai-luxury-holiday-burj-khalifa-marina-and-palm-jumeirah-premium-experience': {
    displayTitle: 'Dubai Luxury: Burj Khalifa, Marina & Palm Jumeirah',
    seoTitle: 'Dubai Luxury Tour: Burj Khalifa, Palm Jumeirah & Marina Yacht',
    description: 'Experience modern Arabian luxury across 5 days with Burj Khalifa skyline views, private desert safari, Palm Jumeirah resorts, and marina yacht cruise.',
  },
  'hanle-turtuk-expedition-dark-sky-reserve-and-border-village': {
    displayTitle: 'Ladakh: Hanle Dark Sky Reserve & Turtuk',
    seoTitle: 'Hanle Dark Sky & Turtuk Expedition: Remote Ladakh Border Circuit',
    description: 'Venture off the beaten path to gaze at crystal-clear galactic skies at the Hanle Dark Sky Reserve and experience Balti culture in the northern border village of Turtuk.',
  },
  'hanoi-and-halong-bay-north-vietnam-old-quarter-and-luxury-cruise-escape': {
    displayTitle: 'Hanoi & Halong Bay Luxury Cruise',
    seoTitle: 'Hanoi & Halong Bay Luxury Cruise: North Vietnam Journey',
    description: 'Discover North Vietnam across 5 days with Hanoi’s French Quarter, bustling street food lanes, and an overnight boutique cruise among Halong Bay’s limestone karsts.',
  },
  'harshil-hidden-himalayas-offbeat-valley-escape': {
    displayTitle: 'Harshil Valley: Offbeat Himalayan Escape',
    seoTitle: 'Harshil Valley Tour: Bhagirathi River, Deodar Forests & Gangotri',
    description: 'Discover the untouched serenity of Harshil along the Bhagirathi River with deodar forest walks, Gartang Gali cliff trail, and sacred Gangotri shrine.',
  },
  'himachal-honeymoon-shimla-manali-and-private-romance': {
    displayTitle: 'Himachal Honeymoon: Shimla & Manali',
    seoTitle: 'Himachal Honeymoon Package: Romantic Stays in Shimla & Manali',
    description: 'Celebrate your honeymoon amidst pine-forested slopes, private apple-orchard cottages, candlelit dinners, and Himalayan valley panoramas in Shimla and Manali.',
  },
  'himalayan-luxury-escape-wellness-and-serenity-retreat': {
    displayTitle: 'Himalayan Wellness & Serenity Retreat',
    seoTitle: 'Himalayan Wellness Retreat: Luxury Spa, Yoga & Mountain Serenity',
    description: 'Recharge at a luxury Himalayan wellness resort with guided yoga, holistic Ayurvedic therapies, organic gourmet dining, and tranquil forest surroundings.',
  },
  'jibhi-tirthan-valley-quiet-riverside-retreat': {
    displayTitle: 'Jibhi & Tirthan Valley Riverside Retreat',
    seoTitle: 'Jibhi & Tirthan Valley Tour: Great Himalayan National Park Gateway',
    description: 'Escape to pine-covered valleys, handcrafted wooden homestays, Jalori Pass, Serolsar Lake, and pristine trout streams in Himachal’s serene Tirthan sector.',
  },
  'jim-corbett-and-nainital-wildlife-and-hill-station-combo': {
    displayTitle: 'Jim Corbett Safari & Nainital Tour',
    seoTitle: 'Jim Corbett Safari & Nainital Tour: Wildlife & Kumaon Hills Combo',
    description: 'Combine open-jeep tiger safaris across Jim Corbett National Park with peaceful boating and colonial hill-station charm in Nainital.',
  },
  'kasol-tosh-parvati-valley-backpacker-escape': {
    displayTitle: 'Kasol & Tosh: Parvati Valley Tour',
    seoTitle: 'Kasol & Tosh Tour: Parvati Valley Riverside & Village Trails',
    description: 'Unwind along the glacial Parvati River in Kasol, exploring riverside cafes, Manikaran hot springs, and cedar forest trails leading to the mountain hamlet of Tosh.',
  },
  'kedarnath-dham-yatra-focused-pilgrimage-package': {
    displayTitle: 'Kedarnath Dham Yatra',
    seoTitle: 'Kedarnath Dham Yatra Package: Guptkashi, Sonprayag & Shrine Trek',
    description: 'A devoted 4-day pilgrimage journey to the sacred shrine of Lord Kedarnath situated high in the Garhwal Himalayas beneath the Kedardome peak.',
  },
  'kinnaur-kalpa-chitkul-last-village-on-the-old-hindustan-tibet-road': {
    displayTitle: 'Kinnaur, Kalpa & Chitkul: Sangla Valley Tour',
    seoTitle: 'Kinnaur, Kalpa & Chitkul Tour: Historic Indo-Tibetan Highway Route',
    description: 'Travel the dramatic river gorges of Kinnaur to apple orchards in Kalpa with views of sacred Kinner Kailash and India’s last inhabited village at Chitkul.',
  },
  'ladakh-bike-expedition-manali-to-leh-via-khardung-la': {
    displayTitle: 'Manali to Leh Motorcycle Expedition',
    seoTitle: 'Manali to Leh Motorcycle Expedition: High Himalayan Passes & Khardung La',
    description: 'The bucket-list ride across legendary mountain passes including Baralacha La, Tanglang La, and Khardung La, exploring Nubra Valley and Pangong Lake.',
  },
  'leh-ladakh-highlights-nubra-pangong-and-monasteries': {
    displayTitle: 'Leh Ladakh: Nubra Valley & Pangong Lake',
    seoTitle: 'Leh Ladakh Highlights Tour: Nubra Sand Dunes & Pangong Tso',
    description: 'The classic Ladakh circuit over Khardung La to the double-humped camel dunes of Nubra Valley, Diskit Monastery, and the shifting blue waters of Pangong Tso.',
  },
  'leh-nubra-pangong-extended-valley-and-lake-circuit': {
    displayTitle: 'Leh, Nubra & Pangong Extended Circuit',
    seoTitle: 'Nubra Pangong Package: Extended Ladakh Valley & Lake Circuit',
    description: 'A comprehensive 7-day extended Ladakh itinerary with extra nights in Nubra Valley, Hunder sand dunes, Diskit, and lakeside sunrise at Pangong Tso.',
  },
  'luxury-ladakh-premium-himalayan-escape': {
    displayTitle: 'Luxury Ladakh Himalayan Experience',
    seoTitle: 'Luxury Ladakh Tour: Boutique Glamping in Nubra & Private Pangong',
    description: 'Experience the rugged splendor of Ladakh in refined comfort with luxury boutique camps in Nubra, private guided monastery tours, and gourmet mountain dining.',
  },
  'maldives-all-inclusive-complete-worry-free-island-holiday': {
    displayTitle: 'Maldives All-Inclusive Island Resort',
    seoTitle: 'Maldives All-Inclusive Holiday: Private Island Resort & Water Sports',
    description: 'A fixed-cost luxury holiday at an all-inclusive Maldives private island resort with all meals, beverage package, snorkeling, and excursions included.',
  },
  'maldives-honeymoon-romantic-overwater-villa-escape': {
    displayTitle: 'Maldives Honeymoon: Overwater Villa Experience',
    seoTitle: 'Maldives Honeymoon Package: Overwater Villa, Spa & Sunset Cruise',
    description: 'An intimate Maldives honeymoon with private overwater villa living, turquoise lagoon dips, couple’s spa therapies, and private beach dinners.',
  },
  'maldives-luxury-escape-ultra-premium-private-island-retreat': {
    displayTitle: 'Maldives Private Island Luxury Retreat',
    seoTitle: 'Maldives Private Island Retreat: Ultra-Luxury Villas & Butler Service',
    description: 'An elite retreat on an exclusive private island in the Maldives featuring bespoke overwater residences, dedicated butler service, and private yacht charters.',
  },
  'maldives-water-villa-escape-overwater-bungalow-getaway': {
    displayTitle: 'Maldives Overwater Villa Holiday',
    seoTitle: 'Maldives Overwater Villa Tour: Direct Lagoon Access & Reef Snorkeling',
    description: 'Wake up above the turquoise ocean in a private Maldives overwater villa with direct ladder access into vibrant coral reefs and marine life.',
  },
  'manali-adventure-paragliding-trekking-and-river-rafting': {
    displayTitle: 'Manali Adventure: Rafting, Paragliding & Trek',
    seoTitle: 'Manali Adventure Package: Beas Rafting, Solang Paragliding & Kheerganga Trek',
    description: 'An action-packed Manali trip featuring white-water rafting on the Beas River, tandem paragliding in Solang Valley, and the Kheerganga trek with hot springs.',
  },
  'nainital-mussoorie-twin-hill-station-getaway': {
    displayTitle: 'Nainital & Mussoorie Twin Hill Tour',
    seoTitle: 'Nainital & Mussoorie Tour: Kumaon Lakes & Garhwal Mountain Views',
    description: 'Experience Uttarakhand’s most beloved hill retreats across 6 days, pairing the emerald lakes of Nainital with Mussoorie’s scenic waterfalls and viewpoints.',
  },
  'phuket-and-krabi-island-escape': {
    displayTitle: 'Phuket & Krabi Island Explorer',
    seoTitle: 'Phuket & Krabi Tour: Phi Phi Islands, Railay Beach & Four Island Tour',
    description: 'An island adventure across Thailand’s Andaman coast combining Phuket’s vibrant beaches and Phi Phi Islands with Krabi’s limestone cliffs and Railay Beach.',
  },
  'pravaah-privilege-himalayas-grand-uttarakhand-and-ladakh-journey': {
    displayTitle: 'Grand Himalayan Journey: Uttarakhand & Ladakh',
    seoTitle: 'Grand Himalayan Journey: Luxury Uttarakhand & Ladakh Flagship Tour',
    description: 'A 14-day flagship expedition across the Himalayas connecting sacred Garhwal valleys and Auli snow peaks with the high-altitude moonscapes of Ladakh.',
  },
  'pravaah-privilege-ladakh-flagship-luxury-high-altitude-journey': {
    displayTitle: 'Privilege Ladakh: Flagship Luxury Journey',
    seoTitle: 'Pravaah Privilege Ladakh: Flagship Luxury High Altitude Tour',
    description: 'Pravaah Travels’ premier Ladakh experience with luxury heritage accommodations, private oxygen-equipped logistics, and bespoke cultural curation.',
  },
  'pravaah-privilege-uttarakhand-flagship-luxury-himalayan-journey': {
    displayTitle: 'Privilege Uttarakhand: Luxury Himalayan Tour',
    seoTitle: 'Pravaah Privilege Uttarakhand: Flagship Luxury Himalayan Journey',
    description: 'An exclusive journey across Uttarakhand featuring the region’s finest wellness retreats, private Himalayan chalets, and customized spiritual experiences.',
  },
  'ramayana-trail-sacred-sites-of-sri-lanka': {
    displayTitle: 'Sri Lanka Ramayana Trail',
    seoTitle: 'Sri Lanka Ramayana Trail: Sita Amman Temple, Ravana Caves & Ashoka Vatika',
    description: 'A cultural pilgrimage tracing the sacred epic across Sri Lanka, including Sita Amman Temple, Ashok Vatika in Nuwara Eliya, and Ravana Falls in Ella.',
  },
  'rishikesh-adventure-escape-river-rafting-camping-and-yoga': {
    displayTitle: 'Rishikesh: Rafting, Camping & Yoga Retreat',
    seoTitle: 'Rishikesh Adventure Package: Ganga River Rafting & Riverside Camps',
    description: 'Experience the adventure and wellness capital with Ganga white-water rafting, Shivpuri riverside camping, Neer Garh waterfall trek, and Ganga Aarti.',
  },
  'roopkund-trek': {
    displayTitle: 'Roopkund Trek',
    seoTitle: 'Roopkund Trek | High-Altitude Glacial Lake Expedition',
    description: 'Explore the legendary Roopkund Trek in Uttarakhand. Trek through Garhwal forests, Bedni Bugyal alpine meadows, and high glacial terrain beneath Mount Trishul.',
  },
  'scenic-sri-lanka-wildlife-waterfalls-and-ancient-cities': {
    displayTitle: 'Sri Lanka: Sigiriya, Ella Waterfalls & Yala Safari',
    seoTitle: 'Sri Lanka Tour: Sigiriya Rock Fortress, Ella Waterfalls & Yala Leopard Safari',
    description: 'Discover Sri Lanka across 9 days featuring the Sigiriya rock fortress, Anuradhapura ruins, scenic hill country waterfalls in Ella, and leopard safaris in Yala.',
  },
  'shimla-manali-classic-himachal-hill-station-tour': {
    displayTitle: 'Shimla & Manali Hill Station Tour',
    seoTitle: 'Shimla & Manali Tour Package: Mall Road, Solang Valley & Atal Tunnel',
    description: 'A classic 6-day Himachal retreat covering colonial heritage on Shimla’s Ridge, scenic Kullu valley drives, Solang Valley viewpoints, and Atal Tunnel.',
  },
  'signature-adventure-collection-ultimate-himalayan-expedition': {
    displayTitle: 'Manali to Leh Multi-Sport Himalayan Expedition',
    seoTitle: 'Manali to Leh Multi-Sport Expedition: Beas Rafting, Trek & Motorcycling',
    description: 'A 10-day multi-sport expedition combining Beas River rafting and Kheerganga trekking with a high-altitude motorcycle ride to Leh, Nubra, and Pangong.',
  },
  'singapore-and-malaysia-twin-city-state-explorer': {
    displayTitle: 'Singapore & Malaysia Twin Country Tour',
    seoTitle: 'Singapore & Malaysia Tour: Marina Bay, Petronas Towers & Batu Caves',
    description: 'Explore Southeast Asia’s dynamic twin destinations, from Singapore’s futuristic Marina Bay to Kuala Lumpur’s Petronas Towers, Batu Caves, and Genting.',
  },
  'singapore-highlights-gardens-marina-bay-and-city-icons': {
    displayTitle: 'Singapore City Highlights',
    seoTitle: 'Singapore Highlights Tour: Marina Bay Sands, Sentosa & City Icons',
    description: 'Discover Singapore across 5 days including Gardens by the Bay, Marina Bay Sands SkyPark, Sentosa Island, Chinatown, and cultural heritage precincts.',
  },
  'singapore-sentosa-family-fun-and-island-adventure': {
    displayTitle: 'Singapore & Sentosa Family Holiday',
    seoTitle: 'Singapore Sentosa Family Holiday: Universal Studios & S.E.A. Aquarium',
    description: 'An exciting family vacation featuring Universal Studios Singapore, S.E.A. Aquarium, Gardens by the Bay, and Sentosa beachfront attractions.',
  },
  'spiti-valley-expedition-cold-desert-circuit-via-kinnaur': {
    displayTitle: 'Spiti Valley Circuit via Kinnaur',
    seoTitle: 'Spiti Valley Circuit Expedition: Kinnaur, Kaza & Chandratal Lake',
    description: 'Cross high mountain passes on a 9-day Spiti Valley expedition through Kinnaur, ancient Key and Tabo Monasteries in Kaza, and the turquoise waters of Chandratal.',
  },
  'sri-lanka-highlights-colombo-kandy-and-coastal-galle': {
    displayTitle: 'Sri Lanka: Colombo, Kandy & Galle Fort',
    seoTitle: 'Sri Lanka Highlights: Temple of the Tooth, Tea Country & Galle Fort',
    description: 'Experience the culture of Sri Lanka with Kandy’s Temple of the Tooth, scenic hill country tea plantations in Nuwara Eliya, and UNESCO-listed Galle Fort.',
  },
  'thailand-family-vacation-bangkok-and-phuket': {
    displayTitle: 'Thailand Family Vacation: Bangkok & Phuket',
    seoTitle: 'Thailand Family Holiday: Bangkok Temples, Safari World & Phuket Coast',
    description: 'A family vacation across Thailand pairing Bangkok’s grand temples and theme parks with Phuket’s tranquil beaches, island excursions, and family resorts.',
  },
  'thailand-highlights-bangkok-pattaya-and-phuket': {
    displayTitle: 'Thailand: Bangkok, Pattaya & Phuket',
    seoTitle: 'Thailand Highlights Tour: Bangkok Temples, Coral Island & Phuket',
    description: 'The complete Thailand circuit across 7 days covering Bangkok’s Grand Palace, Pattaya’s Coral Island beach break, and Phuket’s scenic Andaman viewpoints.',
  },
  'thailand-honeymoon-escape-bangkok-and-phuket': {
    displayTitle: 'Thailand Honeymoon: Bangkok & Phuket',
    seoTitle: 'Thailand Honeymoon Package: Phuket Private Villas & Bangkok Romance',
    description: 'A romantic honeymoon in Thailand featuring luxury riverside stays in Bangkok, private island cruising in Phuket, candlelit dinners, and couple’s spas.',
  },
  'valley-of-flowers-and-hemkund-sahib-trek': {
    displayTitle: 'Valley of Flowers & Hemkund Sahib Trek',
    seoTitle: 'Valley of Flowers & Hemkund Sahib Trek: UNESCO Alpine Meadow',
    description: 'Walk through vibrant blooming meadows in the UNESCO World Heritage Valley of Flowers and ascend to the revered high-altitude glacial lake at Hemkund Sahib (4,329m).',
  },
  'vietnam-highlights-hanoi-halong-bay-da-nang-and-hoi-an-grand-tour': {
    displayTitle: 'Vietnam: Hanoi, Halong Bay, Da Nang & Hoi An',
    seoTitle: 'Vietnam Grand Tour: Hanoi, Halong Bay, Da Nang & Hoi An',
    description: 'Experience the essence of Vietnam across 7 days from Hanoi and an overnight Halong Bay cruise to Da Nang’s Golden Bridge and lantern-lit Hoi An ancient town.',
  },
  'vietnam-honeymoon-escape-private-cruise-beach-and-romance': {
    displayTitle: 'Vietnam Honeymoon: Da Nang, Hoi An & Halong Bay Cruise',
    seoTitle: 'Vietnam Honeymoon: Private Halong Cruise, Golden Bridge & Hoi An',
    description: 'Celebrate your honeymoon with beachfront luxury in Da Nang, a romantic lantern boat in Hoi An, Ba Na Hills Golden Bridge, and a private Halong Bay balcony cruise.',
  },
};

/**
 * Clean and normalize a string by removing invalid whitespace or noise.
 */
export const cleanText = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

/**
 * Generates an optimized, descriptive image alt text for package images.
 */
export const getPackageImageAlt = (
  pkg: TravelPackage,
  context: 'hero' | 'card' | 'gallery' = 'hero',
  imageIndex?: number,
): string => {
  const displayTitle = resolvePackageDisplayTitle(pkg);
  const location = cleanText(pkg.location || pkg.destination, 'Himalayas');

  if (context === 'card') {
    return `${displayTitle} - Travel tour package in ${location}`;
  }
  if (context === 'gallery') {
    const idx = imageIndex != null ? ` (Photo ${imageIndex + 1})` : '';
    return `${displayTitle} scenery and itinerary landscape in ${location}${idx}`;
  }
  return `${displayTitle} scenic view and travel experience in ${location}`;
};

export const sanitizePackageSeoTitle = (title: string): string => {
  return String(title || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\|\s*Pravaah Travels\s*$/i, '')
    .trim();
};

export const getPackageTripTypeLabel = (pkg: TravelPackage): string => {
  const cat = String(pkg.category || '').toLowerCase();
  if (cat.includes('trek')) return 'Trek Expedition';
  if (cat.includes('ladakh')) return 'High-Altitude Himalayan Tour';
  if (cat.includes('uttrakhand') || cat.includes('uttarakhand')) return 'Uttarakhand Tour Package';
  if (cat.includes('himachal')) return 'Himachal Holiday Tour';
  if (cat.includes('international')) return 'International Holiday Package';
  return 'Curated Travel Experience';
};

/**
 * Returns the elevated, human-written customer facing title for display.
 */
export const resolvePackageDisplayTitle = (pkg: TravelPackage): string => {
  if (pkg?.id && ENHANCED_PACKAGE_CONTENT[pkg.id]?.displayTitle) {
    return ENHANCED_PACKAGE_CONTENT[pkg.id].displayTitle!;
  }
  return pkg?.title || '';
};

/**
 * Generates or cleans the SEO title for a package.
 */
export const resolvePackageSeoTitle = (pkg: TravelPackage): string => {
  if (pkg?.id && ENHANCED_PACKAGE_CONTENT[pkg.id]?.seoTitle) {
    return ENHANCED_PACKAGE_CONTENT[pkg.id].seoTitle!;
  }

  const custom = sanitizePackageSeoTitle(pkg.seoTitle || '');
  if (custom && custom.length >= 10 && !custom.includes('|')) return custom;

  const displayTitle = resolvePackageDisplayTitle(pkg);
  const destinationContext = pkg.destination || pkg.location || '';
  const tripType = getPackageTripTypeLabel(pkg);
  
  if (destinationContext && !displayTitle.toLowerCase().includes(destinationContext.toLowerCase())) {
    return `${displayTitle} | ${destinationContext} ${tripType}`;
  }
  return `${displayTitle} | ${tripType}`;
};

/**
 * Generates the search-engine-friendly meta description for a package.
 */
export const resolvePackageSeoDescription = (pkg: TravelPackage): string => {
  if (pkg?.id && ENHANCED_PACKAGE_CONTENT[pkg.id]?.description) {
    return ENHANCED_PACKAGE_CONTENT[pkg.id].description!;
  }

  if (pkg.seoDescription && pkg.seoDescription.trim().length >= 40) {
    return pkg.seoDescription.trim();
  }

  const desc = pkg.shortDescription || pkg.fullDescription || (pkg as any).description || '';
  const cleaned = desc
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  if (cleaned.length >= 60 && cleaned.length <= 170) {
    return cleaned;
  }
  if (cleaned.length > 170) {
    return `${cleaned.slice(0, 160).trim()}...`;
  }

  const displayTitle = resolvePackageDisplayTitle(pkg);
  const duration = pkg.duration ? ` over ${pkg.duration}` : '';
  const destination = pkg.destination ? ` in ${pkg.destination}` : '';
  return `Explore the ${displayTitle}${duration}${destination}. Curated itineraries, transparent pricing, and local expertise with Pravaah Travels.`;
};

/**
 * Generates valid JSON-LD Structured Data Schema for TouristTrip / Product.
 */
export const buildPackageJsonLd = ({
  pkg,
  canonicalUrl,
  business,
  displayTitle,
  description,
  ogImage,
}: {
  pkg: TravelPackage;
  canonicalUrl: string;
  business: BusinessProfile;
  displayTitle: string;
  description: string;
  ogImage: string;
}): Record<string, unknown> => {
  const numericPrice = Number(pkg.offerPrice || pkg.price || 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': canonicalUrl,
    name: displayTitle,
    description,
    url: canonicalUrl,
    image: ogImage,
    touristType: [pkg.category, pkg.bookingType || 'Small Group'].filter(Boolean),
    offers: {
      '@type': 'Offer',
      price: numericPrice > 0 ? numericPrice : undefined,
      priceCurrency: 'INR',
      availability: pkg.active !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
      validFrom: '2025-01-01',
      seller: {
        '@type': 'TravelAgency',
        name: business.companyName,
        telephone: business.phone,
        email: business.email,
        url: PRODUCTION_SITE_ORIGIN,
      },
    },
    provider: {
      '@type': 'TravelAgency',
      name: business.companyName,
      telephone: business.phone,
      email: business.email,
      url: PRODUCTION_SITE_ORIGIN,
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address,
        addressLocality: 'Uttarakhand',
        addressCountry: 'IN',
      },
    },
    itinerary: Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0
      ? {
        '@type': 'ItemList',
        numberOfItems: pkg.itinerary.length,
        itemListElement: pkg.itinerary.map((day: any, idx: number) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: day.title || `Day ${day.day || idx + 1}`,
          description: day.description || '',
        })),
      }
      : undefined,
  };
};

/**
 * Resolves full SEO metadata and JSON-LD schema for any TravelPackage.
 */
export const resolvePackageSeo = ({
  pkg,
  business,
  isStaging = false,
}: {
  pkg: TravelPackage;
  business: BusinessProfile;
  isStaging?: boolean;
}): ResolvedPackageSeo => {
  const target = getPackageNavigationTarget(pkg);
  const canonicalUrl = `${PRODUCTION_SITE_ORIGIN}${target.path}`;
  const displayTitle = resolvePackageDisplayTitle(pkg);
  const seoTitle = resolvePackageSeoTitle(pkg);
  const description = resolvePackageSeoDescription(pkg);
  const ogImage = pkg.packageBannerUrl || pkg.heroImage || pkg.imageUrl || `${PRODUCTION_SITE_ORIGIN}/images/buran-ghati/hero-buran-ghati.webp`;
  const heroImageAlt = getPackageImageAlt(pkg, 'hero');

  const destinationKeywords = [
    displayTitle,
    pkg.title,
    pkg.destination,
    pkg.location,
    pkg.country,
    pkg.category,
    pkg.duration,
  ].filter((item): item is string => Boolean(item && typeof item === 'string' && item.trim()));

  const schemaMarkup = buildPackageJsonLd({
    pkg,
    canonicalUrl,
    business,
    displayTitle,
    description,
    ogImage,
  });

  return {
    title: seoTitle,
    displayTitle,
    seoTitle,
    description,
    keywords: destinationKeywords.join(', '),
    canonicalUrl,
    ogImage,
    heroImageAlt,
    schemaMarkup,
    robots: isStaging ? 'noindex, nofollow, noarchive, nosnippet' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  };
};
