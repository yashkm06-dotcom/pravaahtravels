import { useState } from 'react';
import { ArrowDown, Mountain, Route, Timer } from 'lucide-react';
import { BURAN_ITINERARY } from '../data/buranGhatiData';

export function BuranGhatiItinerary() {
  const [activeDay, setActiveDay] = useState(6);
  const selected = BURAN_ITINERARY.find((day) => day.day === activeDay) || BURAN_ITINERARY[0];

  return (
    <section className="buran-section buran-itinerary" id="itinerary" aria-labelledby="buran-itinerary-heading">
      <div className="buran-container">
        <div className="buran-section-heading buran-section-heading--split">
          <div>
            <p className="buran-kicker">THE EXPEDITION JOURNAL</p>
            <h2 id="buran-itinerary-heading">Seven days, six shifts in terrain.</h2>
          </div>
          <p className="buran-section-intro">The route earns its climax. Every day moves from a familiar Himalayan texture into a more exposed, more elemental landscape.</p>
        </div>

        <div className="buran-itinerary-shell">
          <div className="buran-itinerary-rail" role="tablist" aria-label="Buran Ghati itinerary days">
            {BURAN_ITINERARY.map((day) => (
              <button
                key={day.day}
                type="button"
                role="tab"
                aria-selected={activeDay === day.day}
                aria-controls="buran-day-panel"
                className={`buran-day-tab ${activeDay === day.day ? 'is-active' : ''}`}
                onClick={() => setActiveDay(day.day)}
              >
                <span className="buran-day-number">{String(day.day).padStart(2, '0')}</span>
                <span className="buran-day-place">{day.place}</span>
              </button>
            ))}
          </div>

          <div className="buran-itinerary-panel" id="buran-day-panel" role="tabpanel" tabIndex={0}>
            <div className="buran-itinerary-panel__topline">
              <span>DAY {String(selected.day).padStart(2, '0')}</span>
              <ArrowDown aria-hidden="true" size={16} />
              <span>{selected.terrain}</span>
            </div>
            <h3>{selected.title}</h3>
            <p>{selected.summary}</p>
            {selected.highlights && selected.highlights.length > 0 && (
              <ul className="buran-itinerary-highlights" aria-label="Day highlights">
                {selected.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
              </ul>
            )}
            <div className="buran-itinerary-meta">
              <span><Timer aria-hidden="true" size={16} /> {selected.duration}</span>
              <span><Mountain aria-hidden="true" size={16} /> {selected.elevation}</span>
              <span><Route aria-hidden="true" size={16} /> {selected.place}</span>
            </div>
            {(selected.stay || selected.meals) && (
              <div className="buran-itinerary-stay">
                {selected.stay && <span><strong>Stay</strong>{selected.stay}</span>}
                {selected.meals && <span><strong>Meals</strong>{selected.meals}</span>}
              </div>
            )}
            {selected.note && <p className="buran-itinerary-note">{selected.note}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
