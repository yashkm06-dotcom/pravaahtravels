/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mountain, ShieldCheck } from 'lucide-react';
import { ELEVATION_PROFILE_DATA } from '../data/roopkundData';
import type { ElevationPoint } from '../types';

export const ElevationProfile: React.FC = () => {
  const [activePoint, setActivePoint] = useState<ElevationPoint>(
    () => ELEVATION_PROFILE_DATA.find((p) => p.isPeak) || ELEVATION_PROFILE_DATA[0]
  );

  // Compute SVG coordinates
  const width = 1000;
  const height = 340;
  const paddingX = 60;
  const paddingY = 50;

  const minAlt = 0;
  const maxAlt = 100;

  // Filter trail checkpoints for the graph
  const points = ELEVATION_PROFILE_DATA;

  const getX = (index: number) => {
    return paddingX + (index / (points.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (alt: number) => {
    return height - paddingY - ((alt - minAlt) / (maxAlt - minAlt)) * (height - 2 * paddingY);
  };

  // Generate SVG path line and area
  const pathD = points.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.altitudeFeet);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  return (
    <section id="elevation" className="py-24 sm:py-32 bg-[#F4EFE6] text-[#1D2530] relative overflow-hidden border-t border-[#E2DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold">
              ILLUSTRATIVE ELEVATION CURVE • VALUES UNDER REVIEW
            </span>
            <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.03em] uppercase text-[#1D2530] mt-2">
              ALTITUDE <span className="text-[#8F4F38]">PROFILE</span>
            </h2>
          </div>

          <div className="text-xs sm:text-sm font-garamond italic text-[#4A5568] max-w-md text-pretty">
            The original chart silhouette is retained for the approved visual design. It is not a factual profile; all elevations, distances and stages are to be confirmed.
          </div>
        </div>

        {/* Elevation SVG Visualizer Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DDD3] shadow-md">
          
          {/* Top Active Stat Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2DDD3] pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#EAF5EE] border border-[#134E35]/20 text-[#134E35]">
                <Mountain className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-oswald uppercase text-[#8F4F38] tracking-widest font-bold">
                  CHECKPOINT DETAILS (STAGE {activePoint.day})
                </div>
                <div className="font-playfair text-xl sm:text-2xl font-bold text-[#1D2530]">
                  {activePoint.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-[10px] font-oswald tracking-wider uppercase text-[#64748B]">ALTITUDE</div>
                <div className="text-xl sm:text-2xl font-oswald font-bold text-[#134E35] tracking-wide">
                  TO BE CONFIRMED
                </div>
              </div>

              <div>
                <div className="text-[10px] font-oswald tracking-wider uppercase text-[#64748B]">ECOLOGICAL ZONE</div>
                <div className="text-xs sm:text-sm font-nunito font-bold text-[#1D2530]">
                  {activePoint.zone}
                </div>
              </div>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="relative w-full overflow-x-auto">
            <div className="min-w-[720px]">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                <defs>
                  {/* Elevation Area Gradient */}
                  <linearGradient id="elevationGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#134E35" stopOpacity="0.25" />
                    <stop offset="60%" stopColor="#134E35" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#FAF8F3" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#134E35" />
                    <stop offset="50%" stopColor="#8F4F38" />
                    <stop offset="70%" stopColor="#134E35" />
                    <stop offset="100%" stopColor="#134E35" />
                  </linearGradient>
                </defs>

                {/* Altitude Grid Reference Lines */}
                {[29.411765, 58.823529, 88.235294].map((alt) => {
                  const y = getY(alt);
                  return (
                    <g key={alt}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="#E2DDD3"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill="#64748B"
                        fontSize="10"
                        fontFamily="Oswald"
                      >
                        TBC
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area Beneath Elevation Curve */}
                <path d={areaD} fill="url(#elevationGrad)" />

                {/* Elevation Curve Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points on Line */}
                {points.map((pt, idx) => {
                  const x = getX(idx);
                  const y = getY(pt.altitudeFeet);
                  const isSelected = activePoint.id === pt.id;
                  const isPeak = pt.isPeak;

                  return (
                    <g
                      key={pt.id}
                      className="cursor-pointer group"
                      onClick={() => setActivePoint(pt)}
                    >
                      {/* Vertical Guideline */}
                      <line
                        x1={x}
                        y1={y}
                        x2={x}
                        y2={height - paddingY}
                        stroke={isSelected ? '#134E35' : '#E2DDD3'}
                        strokeWidth={isSelected ? '1.5' : '0.75'}
                        strokeDasharray={isSelected ? 'none' : '2 2'}
                      />

                      {/* Waypoint Dot */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isPeak ? (isSelected ? 9 : 7) : (isSelected ? 7 : 4.5)}
                        fill={isPeak ? '#8F4F38' : isSelected ? '#134E35' : '#C5A880'}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        className="transition-all duration-200 group-hover:scale-125 shadow-sm"
                      />

                      {/* Peak Callout Label */}
                      {isPeak && (
                        <g transform={`translate(${x}, ${y - 24})`}>
                          <rect
                            x="-58"
                            y="-14"
                            width="116"
                            height="20"
                            rx="10"
                            fill="#8F4F38"
                            stroke="#8F4F38"
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="9"
                            fontFamily="Oswald"
                            fontWeight="bold"
                          >
                            OBJECTIVE • ALT TBC
                          </text>
                        </g>
                      )}

                      {/* X Axis Location Label */}
                      <text
                        x={x}
                        y={height - paddingY + 20}
                        textAnchor="middle"
                        fill={isSelected ? '#134E35' : '#64748B'}
                        fontSize="9"
                        fontFamily="Nunito"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {pt.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Educational Altitude Advisory Banner */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#FAF8F3] border border-[#E2DDD3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#134E35]/10 text-[#134E35] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-oswald uppercase tracking-wider text-[#1D2530] font-bold">
                  ELEVATION INFORMATION UNDER REVIEW
                </div>
                <div className="text-xs text-[#4A5568] font-nunito mt-0.5">
                  The final altitude profile, acclimatization plan, monitoring approach and health requirements will be confirmed separately. This graphic is not medical guidance.
                </div>
              </div>
            </div>

            <div className="text-xs font-garamond italic text-[#134E35] shrink-0 font-semibold">
              “Final expedition details will be confirmed before booking.”
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ElevationProfile;
