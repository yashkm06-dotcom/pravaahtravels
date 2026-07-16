import React, { useState, useMemo } from 'react';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { GalleryImage } from '../types';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';

interface GalleryViewProps {
  gallery: GalleryImage[];
  loading: boolean;
}

export default function GalleryView({ gallery, loading }: GalleryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);

  const categories = ['All', 'Pilgrimage', 'Treks', 'Adventure', 'Himachal', 'Ladakh', 'Uttarakhand'];

  const filteredGallery = useMemo(() => {
    if (selectedCategory === 'All') return gallery;
    return gallery.filter((item) => item.category === selectedCategory);
  }, [gallery, selectedCategory]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIdx === null) return;
    setActiveImageIdx((prev) => (prev! === 0 ? filteredGallery.length - 1 : prev! - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeImageIdx === null) return;
    setActiveImageIdx((prev) => (prev! === filteredGallery.length - 1 ? 0 : prev! + 1));
  };

  return (
    <div id="gallery-view" className="animate-fade-in bg-[#f8f7f4] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#008080] tracking-[0.2em] uppercase">Visual Journeys</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#333333] tracking-tight">
            Our Experiential Gallery
          </h2>
          <div className="w-16 h-0.5 bg-[#F4C430] mx-auto mt-3" />
          <p className="text-stone-500 text-xs sm:text-sm font-light max-w-xl mx-auto">
            A picture is worth a thousand memories. Click any image to launch our high-definition lightbox.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2" id="gallery-filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#008080] text-white border-[#008080] shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#008080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded p-8 space-y-3">
            <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-stone-400 text-xs font-light">No images have been uploaded to this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="gallery-grid">
            {filteredGallery.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveImageIdx(idx)}
                className="relative h-64 rounded-sm overflow-hidden border border-stone-200 shadow-xs group cursor-pointer hover:shadow-md transition-all duration-300"
              >
                <img
                  src={getTravelImage(item.imageUrl)}
                  alt={item.title || 'Travel Photo'}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleTravelImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Overlay details */}
                <div className="absolute bottom-5 left-5 right-5 text-white transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-between items-end gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-[#F4C430] uppercase tracking-widest block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-serif italic line-clamp-1">{item.title || 'Untitled Journey'}</h4>
                  </div>
                  <div className="p-2 bg-white/20 backdrop-blur-xs border border-white/20 rounded-sm text-white">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Elegant Lightbox Modal */}
        {activeImageIdx !== null && filteredGallery[activeImageIdx] && (
          <div
            className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 animate-fade-in"
            onClick={() => setActiveImageIdx(null)}
            id="gallery-lightbox"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveImageIdx(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 text-white hover:bg-white/20 rounded-sm transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Nav */}
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-sm transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Main Lightbox Frame */}
            <div
              className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getTravelImage(filteredGallery[activeImageIdx].imageUrl)}
                alt={filteredGallery[activeImageIdx].title}
                className="max-w-full max-h-[70vh] object-contain rounded-sm shadow-2xl"
                referrerPolicy="no-referrer"
                onError={handleTravelImageError}
              />
              <div className="text-center text-white space-y-1 px-4">
                <span className="text-xs font-bold text-[#F4C430] uppercase tracking-widest block">
                  {filteredGallery[activeImageIdx].category}
                </span>
                <h3 className="text-base font-serif italic text-white">
                  {filteredGallery[activeImageIdx].title || 'Untitled Journey'}
                </h3>
              </div>
            </div>

            {/* Right Nav */}
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-sm transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
