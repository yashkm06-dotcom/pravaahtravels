import { Award, Compass, Heart, Shield, Users } from 'lucide-react';

export default function AboutView() {
  const values = [
    {
      icon: <Compass className="w-6 h-6 text-[#4DA528]" />,
      title: 'The Flow of Travel',
      description: 'We believe that travel is not a checklist of monuments, but an uninterrupted flow of sights, scents, and connections.'
    },
    {
      icon: <Shield className="w-6 h-6 text-[#4DA528]" />,
      title: 'Flawless Reliability',
      description: 'No surprises or hidden fees. We vet every driver, inspect every room, and provide transparent contracts.'
    },
    {
      icon: <Users className="w-6 h-6 text-[#4DA528]" />,
      title: 'Community First',
      description: 'We prioritize local homesteads, native guides, and carbon-efficient routes to support local ecosystems.'
    }
  ];

  return (
    <div id="about-view" className="animate-fade-in bg-[#F7F8F4] py-20">
      {/* Hero Header */}
      <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-extrabold text-[#4DA528] tracking-[0.2em] uppercase block">Our Story</span>
          <h2 className="text-[38px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">
            We exist to bring back the magic of slow holidays
          </h2>
          <div className="w-16 h-0.5 bg-[#FF970D] mx-auto" />
          <p className="text-stone-600 text-sm sm:text-base leading-8">
            Founded by a collective of seasoned travel writers and field experts, Pravaah Travels was born out of a desire to create holidays with actual soul.
          </p>
        </div>

        {/* Narrative & Image Block */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-extrabold text-stone-950">
              The Journey of "Pravaah"
            </h3>
            <p className="text-sm leading-8 text-stone-600">
              In a world dominated by flash sales, rigid 15-minute photo stops, and cookie-cutter tourist coaches, we found that people were coming back from holidays more exhausted than when they left.
            </p>
            <p className="text-sm leading-8 text-stone-600">
              We asked: *What if a holiday had no rigid agenda?* What if we designed itineraries that prioritized morning walks, long local lunches, organic spice farm tours, and premium comfort, without rushing? 
            </p>
            <p className="text-sm leading-8 text-stone-600">
              That was the spark. We named ourselves <strong className="font-semibold text-[#4DA528]">Pravaah</strong> (which means Flow in Sanskrit) to dedicate our brand to seamless, rejuvenating journeys. We select only those hotels and local partners who share our ethos of quiet luxury, deep respect for nature, and warm local hospitality.
            </p>
          </div>
          <div className="relative aspect-[4/3] rounded-[12px] overflow-hidden border border-stone-200/60 shadow-[0_14px_38px_rgba(18,38,32,0.12)]">
            <img 
              src="https://images.unsplash.com/photo-1516690561799-46d8f74f90f6?auto=format&fit=crop&w=1200&q=80" 
              alt="Himalayan Tea Trails" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-[#4DA528]/10 mix-blend-multiply" />
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="mt-20 bg-white py-20 border-y border-stone-200/60" id="about-values">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-extrabold text-[#4DA528] tracking-[0.2em] uppercase block">Our Commitments</span>
            <h4 className="text-[34px] font-extrabold text-stone-950">The Values We Live By</h4>
            <div className="w-16 h-0.5 bg-[#FF970D] mx-auto mt-3" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <div key={idx} className="flex h-full flex-col bg-[#F7F8F4] border border-stone-200 rounded-[12px] p-8 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="w-12 h-12 bg-white border border-stone-200 rounded-[10px] flex items-center justify-center shadow-xs">
                  {val.icon}
                </div>
                <h5 className="text-xl font-bold text-stone-950">{val.title}</h5>
                <p className="text-sm leading-7 text-stone-600">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 text-center space-y-12 pt-20">
        <h4 className="text-sm font-bold tracking-[0.2em] uppercase text-[#4DA528]">
          Recognition & Security
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center">
          <div className="flex h-full flex-col items-center gap-2 rounded-[12px] p-6 bg-white border border-stone-200 shadow-xs">
            <Award className="w-8 h-8 text-[#F4C430]" />
            <span className="text-sm font-semibold text-stone-800">Govt. Registered</span>
            <span className="text-xs text-stone-400 font-light">Ministry of Tourism approved</span>
          </div>
          <div className="flex h-full flex-col items-center gap-2 rounded-[12px] p-6 bg-white border border-stone-200 shadow-xs">
            <Heart className="w-8 h-8 text-[#FF970D]" />
            <span className="text-sm font-semibold text-stone-800">4.9 Star Rating</span>
            <span className="text-xs text-stone-400 font-light">Over 500+ happy families</span>
          </div>
          <div className="flex h-full flex-col items-center gap-2 rounded-[12px] p-6 bg-white border border-stone-200 shadow-xs">
            <Shield className="w-8 h-8 text-[#4DA528]" />
            <span className="text-sm font-semibold text-stone-800">100% Insured</span>
            <span className="text-xs text-stone-400 font-light">Secure booking protection</span>
          </div>
          <div className="flex h-full flex-col items-center gap-2 rounded-[12px] p-6 bg-white border border-stone-200 shadow-xs">
            <Users className="w-8 h-8 text-stone-600" />
            <span className="text-sm font-semibold text-stone-800">Bespoke Options</span>
            <span className="text-xs text-stone-400 font-light">Tailored corporate & private travel</span>
          </div>
        </div>
      </section>
    </div>
  );
}
