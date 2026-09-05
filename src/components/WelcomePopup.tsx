import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, MapPin, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import { SiteConfig } from '../types';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onExploreMenu: () => void;
  onWhatsAppOrder: () => void;
}

export const WelcomePopup: React.FC<WelcomePopupProps> = ({
  isOpen,
  onClose,
  config,
  onExploreMenu,
  onWhatsAppOrder,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="welcome-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#2D241E]/70 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
        >
          <motion.div
            key="welcome-popup-dialog"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: 'spring', damping: 26, stiffness: 350 },
            }}
            exit={{
              opacity: 0,
              scale: 0.88,
              y: 20,
              transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }}
            className="relative w-full max-w-lg bg-[#FDFBF7] rounded-3xl border-2 border-[#E5E1DA] shadow-2xl overflow-hidden text-[#2D241E]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Decorative Header Banner */}
            <div className="relative bg-gradient-to-r from-[#3F2E23] via-[#4A372C] to-[#CB997E] text-[#FFE8D6] px-6 py-5">
              {/* Close button at top right */}
              <button
                id="close-welcome-popup-btn"
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close welcome popup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="inline-flex items-center gap-1.5 bg-[#FFE8D6]/20 text-[#FFE8D6] text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFE8D6]" />
                  {config.welcomePopup.badge || "Welcome to The Metro's Diner"}
                </span>
                <span className="text-xs bg-[#25D366] text-white font-bold px-2 py-0.5 rounded-full">
                  Open Now
                </span>
              </div>

              <h3
                id="welcome-modal-title"
                className="font-serif text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug pr-8"
              >
                {config.welcomePopup.title || "Fresh, Sizzling & Made to Order in Ilorin! 🍔"}
              </h3>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-7 space-y-5">
              <p className="text-[#6B705C] text-sm sm:text-base leading-relaxed">
                {config.welcomePopup.message ||
                  "Thank you for visiting! Enjoy handcrafted smash burgers, signature loaded crinkle-cut fries, and crispy zesty chicken prepared fresh daily."}
              </p>

              {/* Highlights Box */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FFE8D6]/60 border border-[#E5E1DA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#CB997E] text-white flex items-center justify-center flex-shrink-0 font-black text-xs">
                    4.9★
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3F2E23]">Top Rated</p>
                    <p className="text-[11px] text-[#6B705C]">Google Maps Ilorin</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#3F2E23] text-[#FFE8D6] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-[#CB997E]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#3F2E23]">Open Daily</p>
                    <p className="text-[11px] text-[#6B705C]">Until 11:00 PM</p>
                  </div>
                </div>
              </div>

              {/* Location quick reminder */}
              <div className="flex items-center gap-2 text-xs text-[#6B705C]">
                <MapPin className="w-4 h-4 text-[#CB997E] flex-shrink-0" />
                <span className="truncate">Station Road Service Station (TotalEnergies), Emirs Rd, Ilorin</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  id="welcome-explore-menu-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreMenu();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#3F2E23] hover:bg-[#2D241E] active:scale-95 text-[#FFE8D6] font-black text-base py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer"
                >
                  <span>{config.welcomePopup.actionText || "Explore Menu & Specials"}</span>
                  <ArrowRight className="w-4 h-4 text-[#CB997E]" />
                </button>

                <button
                  id="welcome-whatsapp-order-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    onWhatsAppOrder();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold text-sm py-3 px-6 rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Quick Order on WhatsApp</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    id="welcome-dismiss-btn"
                    type="button"
                    onClick={onClose}
                    className="text-xs font-semibold text-[#6B705C] hover:text-[#3F2E23] underline underline-offset-4 transition-colors cursor-pointer py-1"
                  >
                    No thanks, continue browsing website
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
