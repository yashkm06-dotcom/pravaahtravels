/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Share2, 
  Check, 
  Copy, 
  MessageSquare, 
  Twitter, 
  Facebook, 
  Mail, 
  X, 
  Mountain
} from 'lucide-react';
import { useRoopkundIntegration } from '../RoopkundIntegrationContext';

interface ShareExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareExpeditionModal: React.FC<ShareExpeditionModalProps> = ({
  isOpen,
  onClose
}) => {
  const { pkg } = useRoopkundIntegration();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const expeditionTitle = `${pkg.title || 'Roopkund Trek'} — details under review | Pravaah Travels`;
  const expeditionSummary = pkg.shortDescription || 'Roopkund expedition details are being reviewed and will be confirmed by Pravaah Travels.';
  const shareUrl = typeof window !== 'undefined'
    ? new URL('/roopkund-trek', window.location.origin).href
    : 'https://pravaahtravels.com/roopkund-trek';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`🏔️ *${expeditionTitle}*\n\n${expeditionSummary}\n\nView the current expedition page:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Viewing the Roopkund expedition preview from Pravaah Travels. Final route and operating details are under review:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${pkg.title || 'Roopkund Trek'} — expedition preview`);
    const body = encodeURIComponent(`Hi,\n\nI thought you might be interested in this Roopkund expedition preview from Pravaah Travels. Route, duration and operating details are still under review.\n\n${expeditionSummary}\n\nView the page here:\n${shareUrl}\n\nWarm regards!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div 
        className="relative w-full max-w-lg bg-[#FAF8F3] text-[#1D2530] rounded-3xl overflow-hidden shadow-2xl border border-[#E2DDD3] my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#1D2530]/5 hover:bg-[#134E35] text-[#1D2530] hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm border border-[#E2DDD3]"
          aria-label="Close share dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-[#E2DDD3]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#134E35]/10 border border-[#134E35]/20 text-[10px] font-oswald tracking-[0.25em] text-[#134E35] uppercase font-bold mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>SHARE EXPEDITION DOSSIER</span>
          </div>

          <h3 id="share-modal-title" className="font-playfair text-xl sm:text-2xl font-bold text-[#1D2530] leading-tight">
            INVITE YOUR <span className="text-[#8F4F38]">TREKKING COHORTS</span>
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm font-nunito text-[#4A5568] leading-relaxed">
            Share the Roopkund preview with trekking partners, friends or family while its operating details remain under review.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Quick Expedition Card Preview */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-black overflow-hidden shrink-0 relative border border-[#E2DDD3]">
              <img 
                src="/images/roopkund/share-preview.jpg" 
                alt="Roopkund Expedition"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-oswald text-[#8F4F38] uppercase tracking-wider font-bold">
                <Mountain className="w-3 h-3" />
                <span>ALTITUDE • DURATION • DIFFICULTY: TBC</span>
              </div>
              <div className="font-playfair text-sm font-bold text-[#1D2530] truncate mt-0.5">
                {pkg.title || 'Roopkund Mystery Trail Expedition'}
              </div>
              <div className="text-xs text-[#4A5568] font-nunito truncate">
                Route details to be confirmed by Pravaah Travels
              </div>
            </div>
          </div>

          {/* Social Share Grid */}
          <div>
            <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-bold mb-2.5">
              INSTANT MESSAGING & SOCIAL CHANNELS
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-[#FAF8F3] text-[#1D2530] border border-[#E2DDD3] shadow-sm transition-all hover:scale-105 active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:shadow-md">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-nunito font-bold">WhatsApp</span>
              </button>

              <button
                onClick={handleTwitterShare}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-[#FAF8F3] text-[#1D2530] border border-[#E2DDD3] shadow-sm transition-all hover:scale-105 active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:shadow-md">
                  <Twitter className="w-4 h-4" />
                </div>
                <span className="text-xs font-nunito font-bold">X (Twitter)</span>
              </button>

              <button
                onClick={handleFacebookShare}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-[#FAF8F3] text-[#1D2530] border border-[#E2DDD3] shadow-sm transition-all hover:scale-105 active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:shadow-md">
                  <Facebook className="w-4 h-4" />
                </div>
                <span className="text-xs font-nunito font-bold">Facebook</span>
              </button>

              <button
                onClick={handleEmailShare}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-[#FAF8F3] text-[#1D2530] border border-[#E2DDD3] shadow-sm transition-all hover:scale-105 active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-[#134E35] text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:shadow-md">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-nunito font-bold">Email</span>
              </button>
            </div>
          </div>

          {/* Copy Direct Link */}
          <div>
            <label className="block text-[11px] font-oswald uppercase tracking-wider text-[#134E35] font-bold mb-1.5">
              OR COPY EXPEDITION LINK
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#E2DDD3] shadow-sm">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-3 py-2 text-xs font-mono text-[#1D2530] focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-oswald font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  copied
                    ? 'bg-[#134E35] text-white'
                    : 'bg-[#8F4F38] hover:bg-[#7A3F2C] text-white active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareExpeditionModal;
