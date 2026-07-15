import { MapPin, Compass, ArrowRight, ShieldCheck, Clock, Navigation } from 'lucide-react';

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

interface InteractiveRouteMapProps {
  itinerary: ItineraryDay[];
  destination: string;
  category?: string;
  activeDay: number | null;
  onDayClick: (day: number) => void;
}

export default function InteractiveRouteMap({
  itinerary,
  destination,
  category = 'General',
  activeDay,
  onDayClick
}: InteractiveRouteMapProps) {
  // If no itinerary, render a fallback placeholder
  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="h-64 bg-stone-100 rounded border border-stone-200 flex flex-col items-center justify-center p-6 text-center">
        <Compass className="w-10 h-10 text-stone-400 mb-2 animate-pulse" />
        <p className="text-xs text-stone-500 font-light">Unable to render route map. No days planned yet.</p>
      </div>
    );
  }

  // Generate procedural coordinates for each day to map on a 2D canvas (SVG width: 500, height: 320)
  // We'll stagger them to look like a realistic winding mountain trail.
  const nodes = itinerary.map((dayItem, index) => {
    const totalDays = itinerary.length;
    
    // Winding path calculation
    let x = 60 + (380 / Math.max(1, totalDays - 1)) * index;
    // Introduce a beautiful sine-wave offset to make it look like a real winding mountain road
    let y = 140 + Math.sin((index / (totalDays - 1 || 1)) * Math.PI * 1.8) * 80;
    
    // Slight random offset based on day title length to avoid overlapping
    const titleSeed = dayItem.title.length;
    y += (titleSeed % 3 === 0 ? 15 : titleSeed % 3 === 1 ? -15 : 0);

    // Keep within safe bounds
    y = Math.max(45, Math.min(275, y));
    x = Math.max(40, Math.min(460, x));

    // Extract a mock sightseeing point / hotel name from the title/description
    let spotLabel = 'Day Stop';
    let spotType: 'hotel' | 'sightseeing' | 'activity' | 'view' = 'sightseeing';

    const titleLower = dayItem.title.toLowerCase();
    const descLower = dayItem.description.toLowerCase();

    if (titleLower.includes('arrival') || titleLower.includes('reach') || titleLower.includes('check')) {
      spotLabel = 'Hotel Check-in';
      spotType = 'hotel';
    } else if (titleLower.includes('trek') || titleLower.includes('climb') || titleLower.includes('hike')) {
      spotLabel = 'Trek Start/Peak';
      spotType = 'view';
    } else if (titleLower.includes('raft') || titleLower.includes('bungee') || titleLower.includes('adventure')) {
      spotLabel = 'Thrills Point';
      spotType = 'activity';
    } else if (titleLower.includes('temple') || titleLower.includes('darshan') || titleLower.includes('spiritual') || titleLower.includes('ganga')) {
      spotLabel = 'Sacred Spot';
      spotType = 'sightseeing';
    } else {
      // Find a proper noun or capitalize words as spot label
      const words = dayItem.title.split(' ');
      if (words.length > 2) {
        spotLabel = words.slice(1, 3).join(' ').replace(/[^a-zA-Z\s]/g, '');
      } else {
        spotLabel = dayItem.title;
      }
    }

    // Generate random mock distance & time
    const distanceSeed = (index * 47) % 65 + 25; // 25 to 90 km
    const timeSeedHours = Math.floor(distanceSeed / 25) + 1;
    const timeSeedMins = (distanceSeed * 3) % 45 + 10;

    return {
      day: dayItem.day,
      title: dayItem.title,
      spotLabel,
      spotType,
      x,
      y,
      distance: `${distanceSeed} km`,
      time: `${timeSeedHours}h ${timeSeedMins}m`
    };
  });

  // Calculate connections (lines between nodes)
  const connections = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const start = nodes[i];
    const end = nodes[i + 1];
    connections.push({
      id: `conn-${i}`,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      distance: end.distance,
      time: end.time
    });
  }

  return (
    <div className="bg-white border border-stone-200 rounded p-5 space-y-4 shadow-xs" id="interactive-route-map">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[#008080] font-bold text-[10px] uppercase tracking-wider">
            <Navigation className="w-3.5 h-3.5 text-[#008080] animate-pulse" />
            <span>Curated Route Visualization</span>
          </div>
          <h4 className="text-base font-serif italic text-stone-800 mt-0.5">Himalayan Spot Connector</h4>
        </div>
        <div className="flex gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest bg-stone-50 px-3 py-1 rounded">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
            <span>Hotels</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#008080] block"></span>
            <span>Spot Points</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-[#f5f4ef] rounded-lg overflow-hidden border border-stone-200/60 p-1 min-h-[340px] select-none">
        
        {/* Subtle contour topological maps background (crafted in raw CSS/SVG) */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Custom SVG Drawing layer */}
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 500 320" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Soft shadow filter */}
            <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
            
            {/* Linear Gradient for paths */}
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF7F50" />
              <stop offset="100%" stopColor="#008080" />
            </linearGradient>

            {/* Glowing marker glow */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Draw connecting roads */}
          {connections.map((conn, idx) => (
            <g key={conn.id}>
              {/* Thick dark under-path */}
              <line 
                x1={conn.x1} 
                y1={conn.y1} 
                x2={conn.x2} 
                y2={conn.y2} 
                stroke="#e2dfd5" 
                strokeWidth="5" 
                strokeLinecap="round" 
              />
              
              {/* Highlighted active flow road */}
              <line 
                x1={conn.x1} 
                y1={conn.y1} 
                x2={conn.x2} 
                y2={conn.y2} 
                stroke="url(#route-gradient)" 
                strokeWidth="3.5" 
                strokeDasharray="6, 5" 
                strokeLinecap="round"
                className="animate-route-flow"
                style={{ animation: 'dash 15s linear infinite' }}
              />

              {/* Inter-day stats label (distance/time) placed directly in middle of connection */}
              <foreignObject
                x={(conn.x1 + conn.x2) / 2 - 35}
                y={(conn.y1 + conn.y2) / 2 - 10}
                width="70"
                height="20"
                className="overflow-visible"
              >
                <div className="bg-white/95 backdrop-blur-xs border border-stone-200 px-1 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[7.5px] text-center font-mono font-medium text-stone-500 scale-90">
                  {conn.distance} • {conn.time}
                </div>
              </foreignObject>
            </g>
          ))}

          {/* Highlight active node on map */}
          {activeDay && nodes.map((node) => {
            if (node.day !== activeDay) return null;
            return (
              <circle 
                key={`glow-${node.day}`}
                cx={node.x} 
                cy={node.y} 
                r="18" 
                fill="#008080" 
                fillOpacity="0.12" 
                filter="url(#glow)"
                className="animate-ping"
                style={{ animationDuration: '3s' }}
              />
            );
          })}
        </svg>

        {/* Floating Mountain Region Banner */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs border border-stone-200 px-3 py-1.5 rounded shadow-xs z-10">
          <div className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">TERRAIN MAP</div>
          <div className="text-xs font-serif font-semibold text-[#008080]">{destination} Expedition</div>
        </div>

        {/* Render Interactive Nodes */}
        {nodes.map((node) => {
          const isActive = activeDay === node.day;
          return (
            <div
              key={node.day}
              onClick={() => onDayClick(node.day)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
                position: 'absolute'
              }}
              className="z-10 group cursor-pointer"
            >
              {/* Day Node Circle */}
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-mono text-[10.5px] border-2 shadow-md transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#008080] text-white border-white scale-110 shadow-lg' 
                    : node.spotType === 'hotel'
                      ? 'bg-amber-500 text-white border-white hover:scale-105'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-[#008080] hover:scale-105'
                }`}
              >
                D{node.day}
              </div>

              {/* Floating Spot Label under node */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded whitespace-nowrap text-[9px] font-medium font-serif italic border transition-all duration-300 shadow-xs pointer-events-none ${
                  isActive
                    ? 'bg-stone-900 text-white border-stone-900 opacity-100 scale-100'
                    : 'bg-white/90 text-stone-600 border-stone-200/80 opacity-80 group-hover:opacity-100 group-hover:scale-102'
                }`}
              >
                {node.spotLabel}
              </div>
            </div>
          );
        })}

        {/* Compass visual in bottom right */}
        <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none">
          <Compass className="w-14 h-14 text-stone-400 stroke-[1]" />
        </div>
      </div>

      {/* Current Active Day Highlights */}
      {activeDay && nodes.find((n) => n.day === activeDay) && (() => {
        const selected = nodes.find((n) => n.day === activeDay)!;
        return (
          <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-md space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#008080] text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm">DAY {selected.day} COORDINATE</span>
                <span className="text-stone-850 font-serif italic text-xs font-semibold">{selected.spotLabel}</span>
              </div>
              <div className="text-[10px] text-[#FF7F50] font-bold flex items-center gap-1 font-mono uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Drive: {selected.time} ({selected.distance})</span>
              </div>
            </div>
            <p className="text-stone-600 text-[11.5px] leading-relaxed font-light">
              {selected.title}: Includes travel routing through key scenic regions with customizable rest stops. Click other days to track the flow.
            </p>
          </div>
        );
      })()}
    </div>
  );
}
