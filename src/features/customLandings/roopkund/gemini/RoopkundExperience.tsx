/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScrollProgressIndicator } from './components/ScrollProgressIndicator';
import { Navbar } from './components/Navbar';
import { RoopkundHero } from './components/RoopkundHero';
import { MysterySection } from './components/MysterySection';
import { WhyRoopkund } from './components/WhyRoopkund';
import { ExpeditionJourneyPipeline } from './components/ExpeditionJourneyPipeline';
import { TrailPlacesDossier } from './components/TrailPlacesDossier';
import { ItineraryExplorer } from './components/ItineraryExplorer';
import { ElevationProfile } from './components/ElevationProfile';
import { ExperienceSection } from './components/ExperienceSection';
import { PackingChecklist } from './components/PackingChecklist';
import { InclusionsExclusions } from './components/InclusionsExclusions';
import { SafetySection } from './components/SafetySection';
import { WhoIsThisFor } from './components/WhoIsThisFor';
import { WhyPravaah } from './components/WhyPravaah';
import { ExpeditionFAQ } from './components/ExpeditionFAQ';
import { ExpeditionBookingEnquiry } from './components/ExpeditionBookingEnquiry';
import { ExpeditionBookingModal } from './components/ExpeditionBookingModal';
import { ShareExpeditionModal } from './components/ShareExpeditionModal';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('ali-bugyal');
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number>(1);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const handleSelectLocation = (locId: string) => {
    setSelectedPlaceId(locId);
    const placesEl = document.getElementById('places');
    placesEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExploreDayFromPlaces = (dayNumber: number) => {
    setSelectedItineraryDay(dayNumber);
    const itEl = document.getElementById('itinerary');
    itEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExploreTrail = () => {
    const section = document.getElementById('mystery') || document.getElementById('expedition-route');
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenBrochure = () => {
    const packingEl = document.getElementById('packing');
    packingEl?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1D2530] font-sans antialiased selection:bg-[#134E35] selection:text-white">
      {/* Minimal Elegant Scroll Progress Indicator */}
      <ScrollProgressIndicator />

      {/* Dynamic Himalayan Navigation Bar */}
      <Navbar
        onOpenEnquiry={() => setIsEnquiryModalOpen(true)}
        onOpenBrochure={handleOpenBrochure}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      <main>
        {/* Section 1: Hero Experience & Quick Dossier */}
        <RoopkundHero
          onExploreTrail={handleExploreTrail}
          onOpenEnquiry={() => setIsEnquiryModalOpen(true)}
          onOpenShare={() => setIsShareModalOpen(true)}
        />

        {/* Section 2: Dark Archaeological Mystery Section */}
        <MysterySection />

        {/* Section 3: Why This Trail (4 Editorial Pillars) */}
        <WhyRoopkund />

        {/* Section 4: Not A Tour. An Expedition. (11-Stage Corridor) */}
        <ExpeditionJourneyPipeline onSelectLocation={handleSelectLocation} />

        {/* Section 5: Places That Define The Trail (Comprehensive Trail Sanctuary Dossier) */}
        <TrailPlacesDossier
          initialLocationId={selectedPlaceId}
          onExploreDay={handleExploreDayFromPlaces}
        />

        {/* Section 6: The Expedition Journal (8-Day Itinerary Chapters) */}
        <ItineraryExplorer
          selectedDay={selectedItineraryDay}
          onSelectDay={(day) => setSelectedItineraryDay(day)}
        />

        {/* Section 7: Altitude Profile & High-Altitude Acclimatization */}
        <ElevationProfile />

        {/* Section 8: More Than The Destination (Sensory Highlights with Popups) */}
        <ExperienceSection onOpenEnquiry={() => setIsEnquiryModalOpen(true)} />

        {/* Section 10: Pack For The Mountain (Interactive Gear Matrix) */}
        <PackingChecklist />

        {/* Section 11: Inclusions & Exclusions Charter */}
        <InclusionsExclusions />

        {/* Section 12: Respect The Altitude (Safety & Evacuation Protocols) */}
        <SafetySection />

        {/* Section 13: Expedition Advisory & Accordion FAQs (AMS, Physical Fitness, Conservation) */}
        <ExpeditionFAQ
          onOpenEnquiry={() => setIsEnquiryModalOpen(true)}
          onOpenShare={() => setIsShareModalOpen(true)}
        />

        {/* Section 14: Who Should Do This Trek (Suitability Matrix) */}
        <WhoIsThisFor />

        {/* Section 15: Why Pravaah (Small Group Expedition Difference with Popups) */}
        <WhyPravaah onOpenEnquiry={() => setIsEnquiryModalOpen(true)} />

        {/* Section 16: Walk The Mystery Trail & Enquiry/Booking System */}
        <ExpeditionBookingEnquiry />
      </main>

      {/* Brand Footer with Environmental Conservation Statement */}
      <Footer onOpenShare={() => setIsShareModalOpen(true)} />

      {/* Global Interactive Expedition Enquiry Modal Popup */}
      <ExpeditionBookingModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
      />

      {/* Global Share Expedition Modal Dialog */}
      <ShareExpeditionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};

export default App;
