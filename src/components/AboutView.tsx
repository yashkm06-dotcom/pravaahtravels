import { Award, Compass, Heart, Shield, Users } from 'lucide-react';

export default function AboutView() {
  const values = [
    {
      icon: <Compass className="w-6 h-6 text-[#008080]" />,
      title: 'The Flow of Travel',
      description: 'We believe that travel is not a checklist of monuments, but an uninterrupted flow of sights, scents, and connections.'
    },
    {
      icon: <Shield className="w-6 h-6 text-[#008080]" />,
      title: 'Flawless Reliability',
      description: 'No surprises or hidden fees. We vet every driver, inspect every room, and provide transparent contracts.'
    },
    {
      icon: <Users className="w-6 h-6 text-[#008080]" />,
      title: 'Community First',
      description: 'We prioritize local homesteads, native guides, and carbon-efficient routes to support local ecosystems.'
    }
  ];

  return (
    <div id="about-view" className="animate-fade-in py-16 bg-[#f8f7f4] space-y-24">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold text-[#008080] tracking-[0.2em] uppercase block">Our Story</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#333333] tracking-tight">
            We exist to bring back the magic of slow holidays
          </h2>
          <div className="w-16 h-0.5 bg-[#F4C430] mx-auto" />
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-light">
            Founded by a collective of seasoned travel writers and field experts, Pravaah Travels was born out of a desire to create holidays with actual soul.
          </p>
        </div>

        {/* Narrative & Image Block */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-serif italic text-[#333333]">
              The Journey of "Pravaah"
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">
              In a world dominated by flash sales, rigid 15-minute photo stops, and cookie-cutter tourist coaches, we found that people were coming back from holidays more exhausted than when they left.
            </p>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">
              We asked: *What if a holiday had no rigid agenda?* What if we designed itineraries that prioritized morning walks, long local lunches, organic spice farm tours, and premium comfort, without rushing? 
            </p>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">
              That was the spark. We named ourselves <strong className="font-semibold text-[#008080]">Pravaah</strong> (which means Flow in Sanskrit) to dedicate our brand to seamless, rejuvenating journeys. We select only those hotels and local partners who share our ethos of quiet luxury, deep respect for nature, and warm local hospitality.
            </p>
          </div>
          <div className="relative h-96 rounded overflow-hidden border border-stone-200/60 shadow-md">
            <img 
              src="https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1200&q=80" 
              alt="Himalayan Tea Trails" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[#008080]/10 mix-blend-multiply" />
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white py-20 border-y border-stone-200/60" id="about-values">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-[#008080] tracking-[0.2em] uppercase block">Our Commitments</span>
            <h4 className="text-3xl font-serif font-normal text-[#333333]">The Values We Live By</h4>
            <div className="w-16 h-0.5 bg-[#F4C430] mx-auto mt-3" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <div key={idx} className="bg-[#f8f7f4] border border-stone-200 p-8 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="w-12 h-12 bg-white border border-stone-200 rounded flex items-center justify-center shadow-xs">
                  {val.icon}
                </div>
                <h5 className="text-lg font-serif italic text-[#333333]">{val.title}</h5>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12 pb-8">
        <h4 className="text-sm font-bold tracking-[0.2em] uppercase text-[#008080]">
          Recognition & Security
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center">
          <div className="flex flex-col items-center gap-2 p-6 bg-white border border-stone-200 rounded shadow-xs">
            <Award className="w-8 h-8 text-[#F4C430]" />
            <span className="text-sm font-semibold text-stone-800">Govt. Registered</span>
            <span className="text-xs text-stone-400 font-light">Ministry of Tourism approved</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-6 bg-white border border-stone-200 rounded shadow-xs">
            <Heart className="w-8 h-8 text-[#FF7F50]" />
            <span className="text-sm font-semibold text-stone-800">4.9 Star Rating</span>
            <span className="text-xs text-stone-400 font-light">Over 500+ happy families</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-6 bg-white border border-stone-200 rounded shadow-xs">
            <Shield className="w-8 h-8 text-[#008080]" />
            <span className="text-sm font-semibold text-stone-800">100% Insured</span>
            <span className="text-xs text-stone-400 font-light">Secure booking protection</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-6 bg-white border border-stone-200 rounded shadow-xs">
            <Users className="w-8 h-8 text-stone-600" />
            <span className="text-sm font-semibold text-stone-800">Bespoke Options</span>
            <span className="text-xs text-stone-400 font-light">Tailored corporate & private travel</span>
          </div>
        </div>
      </section>
    </div>
  );
}

