import { TravelPackage, GalleryImage } from '../types';

export const SEED_PACKAGES: Omit<TravelPackage, 'id'>[] = [
  {
    title: 'Kedarnath & Badrinath Do Dham Yatra',
    destination: 'Uttarakhand, India',
    location: 'Uttarakhand',
    category: 'Pilgrimage',
    duration: '6 Days / 5 Nights',
    price: 22500,
    shortDescription: 'Seek divine blessings at the sacred shrines of Kedarnath and Badrinath nestled in the majestic Garhwal Himalayas.',
    fullDescription: 'Embark on a holy journey to the two most revered shrines of the Char Dham Yatra. Travel through Haridwar, Rishikesh, Guptkashi, and Joshimath, experiencing the spiritually charged air, ancient temples, and stunning natural beauty. The package covers helicopter or trekking options to Kedarnath, VIP temple entry support, and comfortable mountain lodge accommodations.',
    itinerary: [
      { day: 1, title: 'Haridwar to Guptkashi Drive', description: 'Begin your journey from Haridwar. Drive along the scenic Mandakini river till you reach Guptkashi. Check in to your hotel and prepare for the sacred trek of Kedarnath.' },
      { day: 2, title: 'Guptkashi to Kedarnath Shrine (Trek/Heli)', description: 'Proceed to Sonprayag/Gaurikund and begin your 16km trek to Kedarnath Temple. Alternatively, opt for a seamless helicopter ride. Arrive at Kedarnath and attend the evening Aarti.' },
      { day: 3, title: 'Kedarnath Darshan & Return to Guptkashi', description: 'Wake up early for VIP Abhishek Darshan of the holy Jyotirlinga. Trek back down to Gaurikund and return to Guptkashi for a warm night of rest.' },
      { day: 4, title: 'Guptkashi to Badrinath via Joshimath', description: 'Drive to the sacred temple of Badrinath through scenic mountain roads and forests. Visit the Narasimha Temple at Joshimath on the way. Reach Badrinath, take a dip in Tapt Kund, and seek blessings.' },
      { day: 5, title: 'Badrinath Sightseeing & Drive to Rishikesh', description: 'Explore Mana Village, the last Indian village before the Tibet border, including Vyas Gufa and Bhim Pul. Later, drive down to the yoga capital, Rishikesh.' },
      { day: 6, title: 'Rishikesh Sightseeing & Departure', description: 'Visit Lakshman Jhula, Ram Jhula, and participate in a short morning meditation. Depart with heart-warming spiritual blessings and peace.' }
    ],
    inclusions: [
      '5 Nights accommodation in Premium Lodges and Guest Houses',
      'Pure vegetarian breakfast and dinner daily',
      'Private vehicle for all road transfers from Haridwar',
      'Kedarnath Trekking assistance and permit registration',
      'Experienced local guide well-versed in pilgrimage lore'
    ],
    exclusions: [
      'Helicopter ticket fares (can be arranged on request)',
      'Pony, doli, or porter charges during the trek',
      'Personal expenses, laundry, and telephone calls',
      'Any meals during treks or transit lunch',
      'Travel insurance'
    ],
    featured: true,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Kedarkantha Peak Winter Trek Expedition',
    destination: 'Sankri, Uttarakhand, India',
    location: 'Uttarakhand',
    category: 'Treks',
    duration: '6 Days / 5 Nights',
    price: 9500,
    shortDescription: 'Scale one of India\'s most popular winter treks, featuring majestic pine forests and a 360-degree Himalayan summit view.',
    fullDescription: 'Challenge yourself with the legendary Kedarkantha Trek in Uttarakhand. Known for its perfect snow-covered trails, dense pine forests, frozen lakes, and spectacular campsites like Juda-ka-Talab. Stand at 12,500 feet at the summit to witness an unforgettable sunrise over the Swargarohini, Bandarpoonch, and Black Peak ranges. Guided by certified mountaineering professionals.',
    itinerary: [
      { day: 1, title: 'Drive from Dehradun to Sankri', description: 'Begin the scenic 220 km drive from Dehradun. Pass through Mussoorie, Kempty Falls, and beautiful cedar forests to arrive at the picturesque base village of Sankri.' },
      { day: 2, title: 'Trek from Sankri to Juda-ka-Talab', description: 'Start the trek through dense pine trees and maple forests. Arrive at the iconic frozen alpine lake of Juda-ka-Talab (9,100 ft). Camp overnight under the clear mountain skies.' },
      { day: 3, title: 'Juda-ka-Talab to Kedarkantha Base Camp', description: 'Trek further up through snow trails. Reach the scenic Kedarkantha Base Camp (11,250 ft). Enjoy hot tea and a briefing on summit climbing techniques while surrounded by white peaks.' },
      { day: 4, title: 'Summit Day (12,500 ft) & Return to Hargaon', description: 'Wake up at 2:30 AM for the summit push. Witness a majestic sunrise from the top. Bask in 360-degree mountain views before heading back to the campsite and Hargaon camp.' },
      { day: 5, title: 'Hargaon back to Sankri', description: 'Descend through dense forests and streams back to Sankri. Check into a cozy homestay and celebrate your successful summit victory with fellow trekkers.' },
      { day: 6, title: 'Drive from Sankri to Dehradun', description: 'Depart from Sankri and arrive in Dehradun by evening, taking home the pure energy of the Garhwal Himalayas.' }
    ],
    inclusions: [
      '3 Nights high-altitude dome camping + 2 Nights cozy Sankri homestay',
      'All meals during the trek (hygienic, high-energy vegetarian food)',
      'Professional certified Trek Leader, guides, and kitchen staff',
      'High-quality trekking gear (tents, warm sleeping bags, crampons, gaiters)',
      'Forest entry permits, camping fees, and medical first-aid support'
    ],
    exclusions: [
      'Transport from Dehradun to Sankri (can be co-ordinated on request)',
      'Personal trekking poles, rucksack offloading charges',
      'Tips, gratuity, and mineral water bottles',
      'Any cost arising due to natural calamities or roadblocks'
    ],
    featured: true,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Rishikesh Ultimate Adventure: Bungy & Rafting',
    destination: 'Rishikesh, Uttarakhand, India',
    location: 'Uttarakhand',
    category: 'Adventure',
    duration: '3 Days / 2 Nights',
    price: 12000,
    shortDescription: 'Gear up for India\'s highest bungee jump and a thrilling 16km white-water rafting experience on the holy Ganges River.',
    fullDescription: 'Designed for adrenaline junkies, this high-energy weekend getaway brings you to the adventure capital of India, Rishikesh. Overcome your fears at Mohan Chatti with an 83-meter bungee jump from a cantilever platform. Follow it up with a thrilling 16-kilometer grade III/IV white-water rafting run from Shivpuri to Laxman Jhula, complete with cliff jumping and beach camping under the stars.',
    itinerary: [
      { day: 1, title: 'Arrival, Riverside Camping & Cliff Jumping', description: 'Arrive at your premium luxury riverside campsite in Shivpuri. Settle in, head out for a body-surfing session, and enjoy a warm bonfire night with light music and a buffet dinner.' },
      { day: 2, title: 'The Leap of Faith: Mohan Chatti Bungy Jump', description: 'Drive to Mohan Chatti, home to Jumping Heights. Take the ultimate leap of faith with India\'s highest 83m Bungee Jump under expert New Zealand jump masters. Receive your daredevil certificate!' },
      { day: 3, title: 'White-Water Rafting & Departure', description: 'Gear up for a thrilling 16km rafting expedition down the roaring Ganges. Navigate famous rapids like Roller Coaster, Golf Course, and Club House. End with cliff jumping and proceed back.' }
    ],
    inclusions: [
      '2 Nights stay in Luxury AC Swiss Camps with attached washrooms',
      'All buffet meals (Breakfast, Lunch, and Dinner)',
      '1 Bungee Jump Ticket (83 meters) with Safety briefing and certificate',
      '16 km White Water Rafting run from Shivpuri with high-quality gear',
      'Dedicated adventure guides, lifejackets, and helmet rentals'
    ],
    exclusions: [
      'Video and photography charges at the Bungee site',
      'Transport to and from Rishikesh',
      'Extra activities like Giant Swing or Flying Fox (available as add-ons)',
      'Personal alcoholic beverages and soft drinks'
    ],
    featured: true,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Spiti Valley High Altitude Explorer',
    destination: 'Spiti Valley, Himachal Pradesh, India',
    location: 'Himachal Pradesh',
    category: 'Himachal',
    duration: '8 Days / 7 Nights',
    price: 26000,
    shortDescription: 'A road trip through the high-altitude cold desert of Spiti, visiting ancient monasteries and the world\'s highest villages.',
    fullDescription: 'Drive into the surreal landscapes of Spiti Valley in Himachal Pradesh. Traverse through Rohtang and Kunzum Passes, explore the thousand-year-old Key Monastery, send a postcard from the world\'s highest post office in Hikkim, and spend a peaceful night in homestays of mud-brick villages like Komic and Langza. Camp beside the crescent-shaped Chandratal Lake for a perfect ending.',
    itinerary: [
      { day: 1, title: 'Delhi/Chandigarh to Manali', description: 'Arrive in Manali. Check into your hotel. Spend the day walking around Old Manali, visiting Hidimba Temple, and prepping for the epic trans-Himalayan journey.' },
      { day: 2, title: 'Manali to Kaza via Kunzum Pass', description: 'Cross the majestic Atal Tunnel and head through the rugged terrain of Lahaul Valley. Cross Kunzum Pass (14,931 ft) to enter Spiti Valley. Reach Kaza, the sub-divisional capital.' },
      { day: 3, title: 'Key Monastery & Kibber High Village Tour', description: 'Visit the magnificent Key Gompa, perched spectacularly on a conical hill. Drive further to Kibber and Chicham Bridge, the highest bridge in Asia above a gorge.' },
      { day: 4, title: 'Hikkim, Komic & Langza Expedition', description: 'Explore the high villages: Hikkim (world\'s highest post office), Komic (world\'s highest village connected by motorable road), and Langza (fossil village famous for the giant Buddha statue).' },
      { day: 5, title: 'Pin Valley & Dhankar Monastery', description: 'Drive to Dhankar, the former capital of Spiti, with its cliffside monastery. Later, enter the beautiful Pin Valley National Park, home to the elusive snow leopard.' },
      { day: 6, title: 'Kaza to Chandratal Lake Camping', description: 'Drive to the pristine crescent-shaped Chandratal Lake (Lake of the Moon). Stay in luxury tents near the lake. Enjoy stargazing under zero light pollution.' },
      { day: 7, title: 'Chandratal back to Manali', description: 'Drive back to Manali over Kunzum Pass and Batal. Settle in a premium Manali hotel and unwind.' },
      { day: 8, title: 'Departure from Manali', description: 'Depart Manali with beautiful travel memories of the Middle Land.' }
    ],
    inclusions: [
      '7 Nights accommodation (Manali hotels, Kaza premium homestays, Chandratal camps)',
      'Daily breakfast and dinner (organic local Himachali cuisine)',
      'Dedicated 4x4 vehicle (Innova/Tempo Traveler) for the entire route',
      'Inner Line Permits and green tax clearances',
      'Tour coordinator and emergency medical oxygen support'
    ],
    exclusions: [
      'Travel expenses to reach Manali',
      'Lunch, snacks, and mineral water bottles',
      'Monument entrance fees and monastery donations',
      'Personal adventure activities or paragliding in Manali'
    ],
    featured: false,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Tirthan Valley & Jibhi Alpine Sanctuary',
    destination: 'Tirthan Valley & Jibhi, Himachal Pradesh, India',
    location: 'Himachal Pradesh',
    category: 'Himachal',
    duration: '6 Days / 5 Nights',
    price: 24500,
    shortDescription: 'A slow mountain retreat into pine forests, riverside cedar chalets, and crystal trout streams.',
    fullDescription: 'Unwind in the pristine deodar forests of Tirthan Valley and Jibhi. Stay in handcrafted riverside Kath Kuni chalets, angle for wild brown trout, trek to the sacred Serolsar Lake across Jalori Pass (10,800 ft), and experience authentic mountain hospitality.',
    itinerary: [
      { day: 1, title: 'Arrival in Tirthan Valley', description: 'Arrive at Aut/Naggar and transfer to your riverside cedar chalet in Tirthan Valley. Settle in and enjoy riverside herbal tea.' },
      { day: 2, title: 'Great Himalayan National Park Buffer Walk & Angling', description: 'Guided nature walk into GHNP eco-zone followed by catch-and-release trout angling session.' },
      { day: 3, title: 'Jibhi Pine Woods & Waterfall Sanctuary', description: 'Explore the peaceful village of Jibhi, hidden waterfalls, and ancient stone bridges.' },
      { day: 4, title: 'Jalori Pass & Serolsar Lake Sacred Hike', description: 'Ascend to Jalori Pass (10,800 ft) and hike through oak-rhododendron forest to the crystal sacred Serolsar Lake.' },
      { day: 5, title: 'Sharchi Ancient Hamlet & Timber Architecture', description: 'Visit the cliffside hamlet of Sharchi with traditional multi-tiered Kath Kuni fortresses and organic apple orchards.' },
      { day: 6, title: 'Departure with Mountain Memories', description: 'Farewell Himachali breakfast and transfer for onward journey.' }
    ],
    inclusions: [
      '5 Nights accommodation in Riverside Kath Kuni Chalets',
      'Daily farm-to-table breakfast and traditional Himachali dinners',
      'Private vehicle for transfers and sightseeing',
      'Local nature guide for GHNP trail and Serolsar Lake hike'
    ],
    exclusions: [
      'Travel expenses to reach Aut/Chandigarh',
      'Angling permit fees and personal equipment rental',
      'Lunch and snacks'
    ],
    featured: true,
    active: true,
    customLandingPage: '/himachal-trek',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Himalayan Serenade - Leh Ladakh Odyssey',
    destination: 'Leh Ladakh, India',
    location: 'Ladakh',
    category: 'Ladakh',
    duration: '7 Days / 6 Nights',
    price: 45000,
    shortDescription: 'Traverse through dramatic mountain passes, pristine blue lakes, and mystical Buddhist monasteries.',
    fullDescription: 'Embark on a soul-stirring journey through Ladakh, the land of high passes. Experience the pristine beauty of Pangong Tso Lake, ride double-humped camels in Nubra Valley, drive on the world\'s highest motorable passes, and seek blessings at ancient monasteries. Perfect for adventure lovers, families, and solo explorers looking for peace and adrenaline.',
    itinerary: [
      { day: 1, title: 'Arrival in Leh & Acclimatization', description: 'Arrive at Leh Kushok Bakula Rimpochee Airport. Transfer to your premium hotel. Spend the day resting and acclimatizing to the high altitude of 11,500 feet. Enjoy a peaceful evening stroll around Leh Market.' },
      { day: 2, title: 'Leh Local Sightseeing & Confluence', description: 'Visit the historic Leh Palace, the magnificent Shanti Stupa for panoramic city views. Later, drive to the magnetic hill and witness the spectacular confluence of Indus and Zanskar Rivers at Sangam.' },
      { day: 3, title: 'Leh to Nubra Valley via Khardung La', description: 'Drive to Nubra Valley over Khardung La Pass (17,582 ft) - one of the highest motorable roads in the world. Visit the giant Maitreya Buddha statue at Diskit Monastery and experience double-humped camel riding in Hunder Sand Dunes.' },
      { day: 4, title: 'Nubra Valley to Pangong Lake via Shyok', description: 'Travel to the stunning Pangong Lake, famous for changing its color through shades of blue. Cross the majestic Shyok River route and check into a premium luxury lakeside camp. Enjoy a bonfire under a starry night sky.' },
      { day: 5, title: 'Pangong Lake back to Leh via Chang La', description: 'Wake up to a gorgeous sunrise over Pangong Lake. Drive back to Leh crossing the high Chang La Pass. Visit Hemis Monastery, the biggest and wealthiest monastery in Ladakh, on the way back.' },
      { day: 6, title: 'Day Trip to Sham Valley', description: 'Explore Sham Valley, including Alchi Monastery, known for its unique Indo-Tibetan wall paintings. Visit Pathar Sahib Gurudwara and Hall of Fame Museum dedicated to the Indian soldiers.' },
      { day: 7, title: 'Departure from Leh', description: 'After breakfast, transfer to Leh Airport for your flight back home with memories that flow into journeys forever.' }
    ],
    inclusions: [
      '6 Nights accommodation in Premium Hotels and Lakeside Camps',
      'Daily breakfast and dinner (organic local cuisine and continental)',
      'Inner Line Permits and wildlife fees for restricted areas',
      'Private 4x4 SUV transportation for all sightseeing',
      'Dedicated local tour guide and oxygen cylinder in vehicle'
    ],
    exclusions: [
      'Airfare to and from Leh',
      'Lunch, snacks, and personal mineral water',
      'Camel ride fees, monument entry tickets, and camera charges',
      'Travel insurance and medical emergencies',
      'Tips to drivers and hotel staff'
    ],
    featured: true,
    active: true,
    customLandingPage: '/ladakh',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Chopta Tungnath Trek & Rishikesh Gateway',
    destination: 'Chopta, Uttarakhand, India',
    location: 'Uttarakhand',
    category: 'Uttarakhand',
    duration: '4 Days / 3 Nights',
    price: 11500,
    shortDescription: 'Trek to the world\'s highest Shiva temple in Tungnath and climb Chandrashila Peak for stunning Himalayan panoramas.',
    fullDescription: 'Chopta, affectionately known as the "Mini Switzerland of India," offers a gentle yet breathtaking trail to the sacred Tungnath Temple, situated at 12,070 feet. Push further to the Chandrashila Summit (13,120 feet) for an awe-inspiring 360-degree view of major peaks like Nanda Devi, Trishul, and Chaukhamba. Conclude your trip with a relaxing evening by the Ganges in Rishikesh.',
    itinerary: [
      { day: 1, title: 'Haridwar/Rishikesh to Chopta via Devprayag', description: 'Drive along the beautiful route of Alaknanda and Mandakini rivers confluence at Rudraprayag. Arrive in the scenic meadows of Chopta and stay in a comfortable Swiss camp.' },
      { day: 2, title: 'The High Summit: Tungnath Temple & Chandrashila', description: 'Embark on a beautiful 5km snow-meadow trek. Seek blessings at the 1000-year-old Tungnath Temple (highest Shiva shrine). Push 1.5km further to Chandrashila peak for unparalleled view of the Himalayas.' },
      { day: 3, title: 'Chopta to Rishikesh via Deoria Tal', description: 'Trek to Deoria Tal, a pristine mountain lake reflecting the Chaukhamba peaks. Later, drive back to Rishikesh. Settle into a tranquil ashram/boutique stay.' },
      { day: 4, title: 'Rishikesh Ganga Aarti & Departure', description: 'Enjoy a beautiful sunrise Ganga Aarti at Triveni Ghat. Take home the spiritual tranquility and strength of the mountains.' }
    ],
    inclusions: [
      '3 Nights in Swiss Alpine Camps and premium homestays',
      'All mountain-cooked organic meals (Breakfast, Lunch, Dinner)',
      'Experienced mountain guide and safety marshalls',
      'All local permits and forest fee permissions',
      'Ganga Aarti tour in Rishikesh'
    ],
    exclusions: [
      'Personal trekking poles, shoes, and thermal wear',
      'Rucksack porter charges',
      'Travel expenses to reach Rishikesh',
      'Tips, gratuity, and mineral water bottles'
    ],
    featured: false,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString()
  }
];

export const SEED_GALLERY: Omit<GalleryImage, 'id'>[] = [
  { title: 'Kedarnath Temple Drone View', category: 'Pilgrimage', imageUrl: 'https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=600&q=80', createdAt: new Date().toISOString() },
  { title: 'Kedarkantha Peak Summit Sunrise', category: 'Treks', imageUrl: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=600&q=80', createdAt: new Date().toISOString() },
  { title: 'River Rafting in Rishikesh', category: 'Adventure', imageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80', createdAt: new Date().toISOString() },
  { title: 'Chandra Taal Lake Spiti', category: 'Himachal', imageUrl: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=600&q=80', createdAt: new Date().toISOString() },
  { title: 'Pangong Tso Blue Waters Ladakh', category: 'Ladakh', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', createdAt: new Date().toISOString() },
  { title: 'Chopta Meadows Mini Switzerland', category: 'Uttarakhand', imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&w=600&q=80', createdAt: new Date().toISOString() }
];
