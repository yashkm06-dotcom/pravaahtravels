export interface DestinationWaypoint {
  id: string;
  name: string;
  altitudeFt: number;
  dayNumber: number;
  coordinates: [number, number, number];
  description: string;
  landscapeType: string;
  highlights: string[];
}

export interface DestinationStoryChapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  narrative: string;
  dayRange: string;
  altitudeInfo: string;
  highlight: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface DestinationItineraryDay {
  dayNumber: number;
  title: string;
  route: string;
  distanceKm: number;
  driveTime: string;
  stayLocation: string;
  altitudeFt: number;
  description: string;
  highlights: string[];
  meals: string;
}

export interface DestinationExperience {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  tags: string[];
}

export interface DestinationData {
  slug: string;
  title: string;
  tagline: string;
  concept: string;
  kicker: string;
  region: string;
  state: string;
  duration: string;
  days: number;
  nights: number;
  startingPrice: number;
  maxAltitudeFt: number;
  bestSeason: string;
  idealFor: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
  accentColor: string;
  themeType: 'celestial-ladakh' | 'alpine-himachal';
  waypoints: DestinationWaypoint[];
  chapters: DestinationStoryChapter[];
  itinerary: DestinationItineraryDay[];
  experiences: DestinationExperience[];
  inclusions: string[];
  exclusions: string[];
  preparationGuide: {
    title: string;
    items: string[];
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}
