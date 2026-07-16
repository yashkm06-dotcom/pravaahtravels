import { Compass, ArrowRight } from 'lucide-react';
import { DestinationCategory } from '../types';
import { getTravelImage, handleTravelImageError } from '../utils/imageFallback';

interface DestinationsViewProps {
  onSelectCategory: (category: DestinationCategory) => void;
}

export default function DestinationsView({ onSelectCategory }: DestinationsViewProps) {
  const categories = [
    {
      id: 'Pilgrimage' as DestinationCategory,
      title: 'Sacred Pilgrimage Yatras',
      description: 'Embrace high spiritual energies at divine shrines like Kedarnath and Badrinath, nestled in the holy peaks of Uttarakhand.',
      image: 'https://images.unsplash.com/photo-1626830503244-3d2ac0493ae0?auto=format&fit=crop&w=800&q=80',
      count: 'Divine & Spiritual'
    },
    {
      id: 'Treks' as DestinationCategory,
      title: 'High-Altitude Treks',
      description: 'Ascend snow-covered pine forests and majestic summits like Kedarkantha Peak, Chopta, and pristine valleys.',
      image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=800&q=80',
      count: 'Alpine Expeditions'
    },
    {
      id: 'Adventure' as DestinationCategory,
      title: 'Rishikesh Extreme Adventure',
      description: 'Face the wild rapids of the holy Ganges with white-water rafting, and feel the ultimate rush with India\'s highest bungee jumping.',
      image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
      count: 'Thrill & Adrenaline'
    },
    {
      id: 'Himachal' as DestinationCategory,
      title: 'Himachal Passages',
      description: 'Breathtaking drives through high desert valleys like Spiti, ancient cliff monasteries, and peaceful snow retreats.',
      image: 'https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=800&q=80',
      count: 'Himalayan Escapes'
    },
    {
      id: 'Ladakh' as DestinationCategory,
      title: 'Ladakh Odysseys',
      description: 'Venture into high-altitude cold deserts, ride double-humped camels in Nubra, and witness the magic of pristine Pangong Tso.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      count: 'High Pass Adventures'
    },
    {
      id: 'Uttarakhand' as DestinationCategory,
      title: 'Uttarakhand Meadows & Escapes',
      description: 'Lush green alpine meadows of Chopta, tranquil river retreats, and pristine lakes under towering peaks.',
      image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&w=800&q=80',
      count: 'Meadows & Lakes'
    }
  ];

  return (
    <div id="destinations-view" className="animate-fade-in bg-[#f8f7f4] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#008080] tracking-[0.2em] uppercase">Travel Styles</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#333333] tracking-tight">
            Discover by Destination Category
          </h2>
          <div className="w-16 h-0.5 bg-[#F4C430] mx-auto mt-3" />
          <p className="text-stone-500 text-xs sm:text-sm font-light max-w-xl mx-auto">
            Choose your preferred travel mood. Click any card to instantly view all matching premium holiday packages.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="bg-white rounded overflow-hidden border border-stone-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
            >
              {/* Image banner */}
              <div className="relative h-56 overflow-hidden bg-stone-100">
                <img 
                  src={getTravelImage(cat.image)} 
                  alt={cat.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleTravelImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-[#008080] px-3 py-1 shadow-sm">
                    {cat.count}
                  </span>
                </div>
              </div>

              {/* Text Area */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-serif italic text-[#333333] group-hover:text-[#008080] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-stone-500 text-xs sm:text-sm leading-relaxed line-clamp-3 font-light">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[#008080] font-bold text-[11px] uppercase tracking-wider">
                  <span>Explore matching packages</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
