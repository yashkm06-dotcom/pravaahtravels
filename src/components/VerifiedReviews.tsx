import { useState, useEffect } from 'react';
import { 
  Star, MapPin, MessageSquare, X, Sparkles, Filter
} from 'lucide-react';
import { db, collection, getDocs, query, orderBy } from '../lib/firebase';
import { Review } from '../types';

interface VerifiedReviewsProps {
  onNavigate?: (view: string) => void;
}

export default function VerifiedReviews({ onNavigate }: VerifiedReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtering states
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [selectedDestFilter, setSelectedDestFilter] = useState<string>('all');

  // Expanded review image modal
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Fetch reviews from Firestore
  const fetchReviews = async () => {
    setIsLoading(true);
    const pathForFetch = 'reviews';
    try {
      const q = query(collection(db, pathForFetch), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedReviews: Review[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({
          id: doc.id,
          ...doc.data()
        } as Review);
      });
      setReviews(fetchedReviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Filtered Reviews list
  const filteredReviews = reviews.filter(r => {
    // Only Approved Reviews appear publicly. Fallback to Approved for seed/legacy data that lacks a status
    const status = r.status || 'Approved';
    if (status !== 'Approved') return false;
    
    const matchRating = selectedRatingFilter === 'all' || r.rating === Number(selectedRatingFilter);
    const matchDest = selectedDestFilter === 'all' || String(r.destination ?? '').toLowerCase().includes(String(selectedDestFilter ?? '').toLowerCase());
    return matchRating && matchDest;
  });

  return (
    <div className="bg-[#F7F8F4] py-20" id="verified-reviews-root">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        
        {/* Decorative Top header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4" id="reviews-header">
          <span className="text-[10px] bg-[#4DA528]/10 text-[#4DA528] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Traveler Reviews</span>
          </span>
          <h2 className="text-[38px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">
            Traveler Logs & Verified Experiences
          </h2>
          <div className="w-16 h-0.5 bg-[#FF970D] mx-auto" />
          <p className="text-stone-500 text-sm sm:text-base leading-7">
            Read raw reviews, real trip photography, and star ratings verified straight from active mountain itineraries in Uttarakhand and Himachal Pradesh.
          </p>
        </div>

        {/* CTA banner for submitting review inside profile */}
        <div className="bg-[#081E2A] text-white rounded-[12px] p-6 sm:p-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10 shadow-lg animate-fade-in">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#4DA528]">Exclusively for Pravaah Travelers</span>
            <h4 className="text-lg sm:text-xl font-extrabold">Have you traversed Uttarakhand or Himachal Pradesh with us?</h4>
            <p className="text-xs text-teal-200/85 max-w-2xl font-light leading-relaxed">
              To guarantee 100% authenticity, review submission has been moved directly inside the Customer Portal. Simply log in, navigate to the "Write a Review" tab, and share your experience with other pilgrims!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('portal')}
            className="px-6 py-3 bg-[#4DA528] hover:bg-[#FF970D] text-white text-[10px] font-bold uppercase tracking-widest rounded-[5px] shadow-md hover:shadow-lg shrink-0 transition-all cursor-pointer"
          >
            Go to Customer Portal
          </button>
        </div>

        {/* Reviews Feed Section */}
        <div className="space-y-6" id="reviews-feed-panel">
          
          {/* Filters Row */}
          <div className="bg-white border border-stone-200 rounded-[12px] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#4DA528]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">Filter traveler logs</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Rating Filter */}
              <select
                value={selectedRatingFilter}
                onChange={(e) => setSelectedRatingFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-[10px] text-xs focus:outline-none focus:border-[#4DA528] font-medium"
              >
                <option value="all">All Stars</option>
                <option value="5">5 Stars only</option>
                <option value="4">4 Stars only</option>
                <option value="3">3 Stars</option>
              </select>

              {/* Destination Search/Filter */}
              <input 
                type="text" 
                placeholder="Search destination..."
                value={selectedDestFilter === 'all' ? '' : selectedDestFilter}
                onChange={(e) => setSelectedDestFilter(e.target.value || 'all')}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-[10px] text-xs focus:outline-none focus:border-[#4DA528] placeholder-stone-400 font-medium"
              />
            </div>
          </div>

          {/* Loading/Listing Status */}
          {isLoading ? (
            <div className="bg-white border border-stone-200 rounded-[12px] p-12 text-center flex flex-col items-center justify-center space-y-4" id="review-loading-card">
              <div className="w-10 h-10 border-2 border-[#4DA528] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-stone-500 font-light font-sans">Retrieving verified logs from Firestore database...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-[12px] p-12 text-center flex flex-col items-center justify-center space-y-3" id="review-empty-card">
              <MessageSquare className="w-10 h-10 text-stone-300" />
              <h4 className="text-sm font-bold text-stone-700">No logs match your filters</h4>
              <p className="text-xs text-stone-400 font-light max-w-sm leading-normal">
                No traveler reviews match these specifications yet. Clear your search filter to see other logs!
              </p>
              <button
                onClick={() => {
                  setSelectedRatingFilter('all');
                  setSelectedDestFilter('all');
                }}
                className="px-4 py-2 border border-stone-200 text-stone-600 hover:border-[#4DA528] hover:text-[#4DA528] text-[10px] font-bold uppercase tracking-wider rounded-[5px]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="reviews-cards-list">
              {filteredReviews.map((review) => (
                <div 
                  key={review.id}
                  className="bg-white border border-stone-200 rounded-[12px] p-6 shadow-sm hover:border-[#4DA528]/50 transition-all flex flex-col justify-between group h-full"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="text-[#4DA528] font-bold text-base flex items-center gap-1.5">
                          <span>{review.name}</span>
                          {review.verified && (
                            <span className="w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[7.5px] font-extrabold" title="Verified Customer">✓</span>
                          )}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{review.destination}</span>
                        </span>
                      </div>

                      {/* Stars count */}
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'text-[#F4C430] fill-[#F4C430]' : 'text-stone-200'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-light italic">
                      "{review.comment}"
                    </p>
                  </div>

                  {/* Display image attachment if present */}
                  {review.imageUrl && (
                    <div className="relative mt-4 group cursor-zoom-in" onClick={() => setExpandedImage(review.imageUrl || null)}>
                      <div className="absolute inset-0 bg-black/10 rounded-[10px] group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[9px] text-stone-850 font-bold uppercase tracking-wider rounded-full shadow border border-stone-200">Expand Photo</span>
                      </div>
                      <img
                        src={review.imageUrl}
                        alt={`${review.name}'s trip`}
                        className="w-full aspect-video rounded-[10px] object-cover border border-stone-200 shadow-inner"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  {/* Display admin reply if present */}
                  {review.reply && (
                    <div className="mt-4 bg-[#fbfaf8] border-l-2 border-[#4DA528] p-3 rounded-r-lg shadow-3xs text-xs font-sans">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[#4DA528] uppercase tracking-wider text-[9px] flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#4DA528]" />
                          <span>Pravaah Travels Reply</span>
                        </span>
                        {review.replyAt && (
                          <span className="text-[8px] font-mono text-stone-400 font-light">
                            {new Date(review.replyAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-700 italic font-light">
                        "{review.reply}"
                      </p>
                    </div>
                  )}

                  <div className="text-[9px] text-stone-400 font-light uppercase tracking-widest font-mono mt-4 border-t border-stone-100 pt-3">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* PHOTO EXPANSION LIGHTBOX MODAL */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setExpandedImage(null)}
          id="photo-expansion-modal"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden bg-black/20 border border-stone-800 rounded-xl shadow-2xl">
            <button 
              type="button"
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 p-2 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full shadow border border-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={expandedImage} 
              alt="Himalayan view expanded" 
              className="w-full h-full max-h-[80vh] object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
}
