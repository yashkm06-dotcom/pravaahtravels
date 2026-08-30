import React, { useEffect, useState } from 'react';
import { isStaging } from '../../../lib/environment';
import type { CustomLandingPageProps } from '../registry';

// 1. All Components (Named Imports from ./components/)
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

export default function RoopkundLandingPage({
  pkg,
  business,
  onNavigate,
}: CustomLandingPageProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('ali-bugyal');
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number>(1);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    const previousScrollPaddingTop = root.style.scrollPaddingTop;
    root.style.scrollPaddingTop = isStaging ? '104px' : '80px';
    return () => {
      root.style.scrollPaddingTop = previousScrollPaddingTop;
    };
  }, []);

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
      {/* Scroll Progress Bar */}
      <ScrollProgressIndicator />

      {/* Navigation Bar */}
      <Navbar
        onOpenEnquiry={() => setIsEnquiryModalOpen(true)}
        onOpenBrochure={handleOpenBrochure}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      <main>
        {/* Hero Section */}
        <RoopkundHero
          onExploreTrail={handleExploreTrail}
          onOpenEnquiry={() => setIsEnquiryModalOpen(true)}
          onOpenShare={() => setIsShareModalOpen(true)}
        />

        {/* Dark Mystery Section */}
        <MysterySection />

        {/* Why This Trail Pillars */}
        <WhyRoopkund />

        {/* 11-Stage Corridor */}
        <ExpeditionJourneyPipeline onSelectLocation={handleSelectLocation} />

        {/* Places Trail Dossier */}
        <TrailPlacesDossier
          initialLocationId={selectedPlaceId}
          onExploreDay={handleExploreDayFromPlaces}
        />

        {/* Itinerary Journal */}
        <ItineraryExplorer
          selectedDay={selectedItineraryDay}
          onSelectDay={(day) => setSelectedItineraryDay(day)}
        />

        {/* Elevation Acclimatization Profile */}
        <ElevationProfile />

        {/* Sensory Highlights */}
        <ExperienceSection onOpenEnquiry={() => setIsEnquiryModalOpen(true)} />

        {/* Gear Checklist */}
        <PackingChecklist />

        {/* Inclusions & Exclusions */}
        <InclusionsExclusions />

        {/* Safety & Medical Protocols */}
        <SafetySection />

        {/* Accordion FAQs */}
        <ExpeditionFAQ
          onOpenEnquiry={() => setIsEnquiryModalOpen(true)}
          onOpenShare={() => setIsShareModalOpen(true)}
        />

        {/* Suitability Matrix */}
        <WhoIsThisFor />

        {/* Why Pravaah */}
        <WhyPravaah onOpenEnquiry={() => setIsEnquiryModalOpen(true)} />

        {/* Enquiry Booking Form */}
        <ExpeditionBookingEnquiry />
      </main>

      {/* Footer */}
      <Footer onOpenShare={() => setIsShareModalOpen(true)} />

      {/* Global Interactive Booking & Share Modals */}
      <ExpeditionBookingModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
      />

      <ShareExpeditionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}