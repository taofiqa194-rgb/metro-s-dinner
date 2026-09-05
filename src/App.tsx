import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Share2,
  Send,
  AlertCircle,
  Loader2,
  Sliders,
  Settings,
  X,
  Lock,
} from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, testConnection } from './lib/firebase';
import { MenuItem, SiteConfig, ReviewItem } from './types';
import { DEFAULT_MENU_ITEMS, DEFAULT_REVIEWS, DEFAULT_SITE_CONFIG } from './data/defaultContent';
import { WelcomePopup } from './components/WelcomePopup';
import { AdminModal } from './components/AdminModal';
import { AdminLoginModal } from './components/AdminLoginModal';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'burgers' | 'fries' | 'sides'>('all');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamic Site Config & Menu Items with LocalStorage Persistence
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('metros_diner_menu');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading saved menu:", e);
    }
    return DEFAULT_MENU_ITEMS;
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem('metros_diner_site_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.restaurantName) {
          const config = { ...DEFAULT_SITE_CONFIG, ...parsed };
          // Automatically update old phone numbers if present from previous sessions
          if (config.phone?.includes('6192594') || config.phone?.includes('0703')) {
            config.phone = "0913 477 9028";
          }
          if (config.whatsappNumber?.includes('6192594') || config.whatsappNumber?.includes('0703')) {
            config.whatsappNumber = "2349134779028";
          }
          return config;
        }
      }
    } catch (e) {
      console.error("Error reading saved site config:", e);
    }
    return DEFAULT_SITE_CONFIG;
  });

  const [reviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);

  // Welcome Pop-up state (shown when visiting homepage)
  const [showWelcomePopup, setShowWelcomePopup] = useState(() => {
    return siteConfig.welcomePopup?.enabled ?? true;
  });

  // Admin Control Panel & Authentication states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('metros_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setShowAdminModal(true);
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    try {
      localStorage.setItem('metros_admin_logged_in', 'true');
    } catch (e) {
      console.error("Failed to store admin login status", e);
    }
    setShowAdminLoginModal(false);
    setShowAdminModal(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('metros_admin_logged_in');
    } catch (e) {
      console.error("Failed to remove admin login status", e);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleSaveMenuItems = (newItems: MenuItem[]) => {
    setMenuItems(newItems);
    try {
      localStorage.setItem('metros_diner_menu', JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save menu to localStorage", e);
    }
  };

  const handleSaveSiteConfig = (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    try {
      localStorage.setItem('metros_diner_site_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error("Failed to save site config to localStorage", e);
    }
  };

  const handleResetDefaults = () => {
    localStorage.removeItem('metros_diner_menu');
    localStorage.removeItem('metros_diner_site_config');
    setMenuItems(DEFAULT_MENU_ITEMS);
    setSiteConfig(DEFAULT_SITE_CONFIG);
  };

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  const getWhatsAppOrderUrl = (itemName?: string, price?: string) => {
    let cleanNumber = (siteConfig.whatsappNumber || "2349134779028").replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '234' + cleanNumber.slice(1);
    }
    if (!cleanNumber) {
      cleanNumber = "2349134779028";
    }
    const base = `https://wa.me/${cleanNumber}`;
    if (itemName && price) {
      const message = encodeURIComponent(`Hello ${siteConfig.restaurantName}! I would like to order: ${itemName} (${price}). Please confirm availability and delivery/pickup time.`);
      return `${base}?text=${message}`;
    }
    const generalMsg = encodeURIComponent(`Hello ${siteConfig.restaurantName}! I would like to view the daily specials and place an order.`);
    return `${base}?text=${generalMsg}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "The Metro's Diner",
        text: "Check out The Metro's Diner in Ilorin for the best burgers & loaded fries!",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nameEl = document.getElementById('customerName') as HTMLInputElement | null;
    const notesEl = document.getElementById('orderNotes') as HTMLTextAreaElement | null;
    const name = (nameEl ? nameEl.value : customerName).trim();
    const notes = (notesEl ? notesEl.value : orderNotes).trim();

    if (!name || !notes) {
      setErrorMessage("Please provide your name and order notes.");
      setSubmissionStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setErrorMessage('');

    try {
      // Save the submission directly into a collection named "incoming_leads"
      await addDoc(collection(db, "incoming_leads"), {
        customerName: name,
        orderNotes: notes,
        timestamp: serverTimestamp()
      });

      setSubmissionStatus('success');
      setCustomerName('');
      setOrderNotes('');
      const formEl = document.getElementById('contactForm') as HTMLFormElement | null;
      if (formEl) formEl.reset();
    } catch (error) {
      console.error("Error adding document: ", error);
      setSubmissionStatus('error');
      setErrorMessage("Something went wrong. Please try placing your order via WhatsApp!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D241E] flex flex-col font-sans pb-24 md:pb-0 selection:bg-[#CB997E] selection:text-white">
      {/* Top Banner Alert / Status (Natural Wood with Sage & Terracotta Accents) */}
      <div className="bg-[#3F2E23] text-[#FFE8D6] text-xs sm:text-sm py-2.5 px-4 border-b border-[#523F33]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CB997E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#CB997E]"></span>
            </span>
            <span className="font-semibold text-[#FFE8D6] truncate">
              {siteConfig.topBannerText || "Open Daily until 11:00 PM • Station Road Service Station, Ilorin"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Re-open Welcome Pop-up for buyers */}
            <button
              id="top-welcome-popup-trigger"
              onClick={() => setShowWelcomePopup(true)}
              className="text-[11px] font-bold bg-[#FFE8D6]/15 hover:bg-[#FFE8D6]/30 text-[#FFE8D6] px-2.5 py-1 rounded-full border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
              title="View Welcome Greetings"
            >
              <Sparkles className="w-3 h-3 text-[#CB997E]" />
              <span className="hidden sm:inline">Welcome Specials</span>
            </button>

            {/* Admin Edit / Portal Trigger */}
            <button
              id="top-admin-trigger-btn"
              onClick={handleOpenAdmin}
              className="text-[11px] font-bold bg-[#CB997E] hover:bg-[#b8856c] text-[#2D241E] px-2.5 py-1 rounded-full transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              title={isAdminLoggedIn ? "Admin Panel (Logged In)" : "Admin Login - Restricted Access"}
            >
              {isAdminLoggedIn ? <Sliders className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{isAdminLoggedIn ? "Admin Panel" : "Admin Login"}</span>
            </button>

            <a
              href={`tel:${siteConfig.phone.replace(/\s+/g, '')}`}
              className="hover:text-[#CB997E] transition-colors flex items-center gap-1.5 font-bold text-xs sm:text-sm"
            >
              <Phone className="w-3.5 h-3.5 text-[#CB997E]" />
              <span className="hidden xs:inline">{siteConfig.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 1. Navigation Bar (Natural Tones Design) */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E5E1DA] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo - Italic Wood Display */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CB997E] to-[#3F2E23] flex items-center justify-center text-white shadow-md shadow-[#3F2E23]/15 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <span className="font-serif italic font-extrabold text-xl sm:text-2xl tracking-tight text-[#3F2E23] block leading-tight">
                {siteConfig.restaurantName}
              </span>
              <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#6B705C] block mt-0.5">
                {siteConfig.tagline}
              </span>
            </div>
          </a>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#3F2E23]">
            <a href="#menu" className="hover:text-[#CB997E] transition-colors">Menu Staples</a>
            <a href="#features" className="hover:text-[#CB997E] transition-colors">Why Metro's</a>
            <a href="#reviews" className="hover:text-[#CB997E] transition-colors flex items-center gap-1.5">
              <span>Reviews</span>
              <span className="bg-[#FFE8D6] text-[#3F2E23] text-[11px] px-2 py-0.5 rounded-full font-bold border border-[#E5E1DA]">
                {siteConfig.averageRating} ★
              </span>
            </a>
            <a href="#contact" className="hover:text-[#CB997E] transition-colors">Pre-Order</a>
            <a href="#location" className="hover:text-[#CB997E] transition-colors">Location & Hours</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleOpenAdmin}
              title={isAdminLoggedIn ? "Admin Portal (Logged In)" : "Admin Portal (Password Required)"}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3F2E23] hover:text-[#CB997E] bg-[#FFE8D6]/70 hover:bg-[#FFE8D6] border border-[#E5E1DA] px-3 py-2 rounded-full transition-all cursor-pointer"
            >
              {isAdminLoggedIn ? (
                <Settings className="w-3.5 h-3.5 text-[#CB997E]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#CB997E]" />
              )}
              <span className="hidden sm:inline">{isAdminLoggedIn ? "Admin" : "Admin Login"}</span>
            </button>

            <button
              onClick={handleShare}
              title="Share restaurant"
              className="p-2.5 text-[#6B705C] hover:text-[#3F2E23] hover:bg-[#FFE8D6]/50 rounded-full transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              id="nav-whatsapp-cta"
              href={getWhatsAppOrderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md shadow-[#25D366]/20 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Order Now</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* 2. Hero Section (Natural Tones Warm Aesthetic) */}
        <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-[#E5E1DA]">
          {/* Subtle Organic Ambient Gradients */}
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-[#FFE8D6]/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-[#CB997E]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Copy & CTAs */}
              <div className="lg:col-span-7 text-center lg:text-left">
                
                {/* 4.9 Stars Rating Badge (Terracotta / Cream styling) */}
                <div className="inline-flex items-center gap-2 bg-[#FFE8D6] border border-[#E5E1DA] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[#3F2E23] mb-6 shadow-xs">
                  <div className="flex items-center text-[#CB997E]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#CB997E] text-[#CB997E]" />
                    ))}
                  </div>
                  <span className="font-bold text-[#3F2E23]">{siteConfig.averageRating} Stars</span>
                  <span className="text-[#6B705C]/40">|</span>
                  <span className="text-[#6B705C] font-medium">{siteConfig.totalReviewsCount} Verified Google Reviews</span>
                </div>

                {/* Main Headline with Serif Elegance */}
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-[#3F2E23] tracking-tight leading-[1.12] mb-5">
                  {siteConfig.heroHeadline}
                </h1>

                {/* Subtitle */}
                <p className="text-[#2D241E]/80 text-base sm:text-lg lg:text-xl font-normal max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                  {siteConfig.heroSubtitle}
                </p>

                {/* Action Row */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <a
                    id="hero-order-whatsapp-btn"
                    href={getWhatsAppOrderUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl shadow-[#25D366]/25 transition-all duration-200"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>Order via WhatsApp</span>
                  </a>

                  <a
                    href="#menu"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFE8D6]/70 hover:bg-[#FFE8D6] active:scale-95 text-[#3F2E23] font-bold text-base px-7 py-4 rounded-2xl border border-[#E5E1DA] transition-all duration-200"
                  >
                    <span>Explore Menu</span>
                    <ArrowRight className="w-4 h-4 text-[#6B705C]" />
                  </a>
                </div>

                {/* Trust Badges in Sage Tone */}
                <div className="mt-8 pt-6 border-t border-[#E5E1DA] flex flex-wrap items-center justify-center lg:justify-start gap-y-3 gap-x-6 text-xs sm:text-sm text-[#6B705C]">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#6B705C] flex-shrink-0" />
                    <span>Always Made Fresh to Order</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#6B705C] flex-shrink-0" />
                    <span>Prompt WhatsApp Response</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#6B705C] flex-shrink-0" />
                    <span>Open Daily 'til 11 PM</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Showcase Visual */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Outer Frame with Natural Tones border and shadow */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#FFE8D6] bg-[#3F2E23] aspect-4/3 sm:aspect-square">
                    <img
                      src={siteConfig.heroMainImage}
                      alt="The Metro's Diner Gourmet Cheeseburger"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2D241E]/85 via-transparent to-transparent pointer-events-none" />

                    {/* Overlay Label */}
                    <div className="absolute bottom-4 left-4 right-4 text-[#FDFBF7]">
                      <span className="inline-block bg-[#CB997E] text-white text-xs uppercase font-extrabold px-2.5 py-1 rounded-md mb-1.5 shadow-xs">
                        Diner Favorite
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl font-black text-white">
                        {menuItems[0]?.name || "Classic Smashed Cheeseburger"}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#FFE8D6]/90 font-medium">
                        From {menuItems[0]?.price || "₦4,500"} • Melted cheddar & caramelized relish
                      </p>
                    </div>
                  </div>

                  {/* Floating badge for Loaded Fries */}
                  <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-[#FDFBF7] rounded-2xl p-3 sm:p-4 shadow-xl border border-[#E5E1DA] flex items-center gap-3 max-w-[240px]">
                    <img
                      src={menuItems[1]?.image || "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=160&q=80"}
                      alt="Metro Loaded Fries"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#3F2E23] truncate">
                        {menuItems[1]?.name || "Metro Loaded Fries"}
                      </p>
                      <p className="text-[12px] text-[#CB997E] font-black">
                        {menuItems[1]?.price || "₦3,800"}
                      </p>
                      <p className="text-[10px] text-[#6B705C]">Cheese sauce & minced beef</p>
                    </div>
                  </div>

                  {/* Rating Bubble */}
                  <div className="absolute -top-4 -right-4 bg-[#FDFBF7] rounded-2xl px-3.5 py-2 shadow-lg border border-[#E5E1DA] flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#CB997E] flex items-center justify-center text-white font-black text-xs">
                      {siteConfig.averageRating}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#3F2E23] leading-tight">Google Maps</p>
                      <p className="text-[10px] text-[#6B705C] font-semibold">Top Rated in Ilorin</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. Features Section (Natural Tones) */}
        <section id="features" className="py-14 sm:py-18 bg-white border-b border-[#E5E1DA]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#6B705C] bg-[#FFE8D6] px-3.5 py-1.5 rounded-full border border-[#E5E1DA]">
                The Metro Quality Standard
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#3F2E23] mt-3 tracking-tight">
                Why Food Lovers In Ilorin Keep Coming Back
              </h2>
              <p className="text-[#6B705C] text-sm sm:text-base mt-2">
                We believe delicious fast food shouldn't compromise on freshness, taste, or portion size.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E5E1DA] hover:border-[#CB997E] hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#FFE8D6] text-[#3F2E23] flex items-center justify-center mb-5 group-hover:bg-[#CB997E] group-hover:text-white transition-colors">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#3F2E23] mb-2">Freshly Made Daily</h3>
                <p className="text-[#6B705C] text-sm leading-relaxed">
                  No stale patties or soggy buns. Every burger patty is seasoned and smashed hot on the griddle upon your order, guaranteeing maximum juiciness and flavor.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E5E1DA] hover:border-[#CB997E] hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#FFE8D6] text-[#3F2E23] flex items-center justify-center mb-5 group-hover:bg-[#CB997E] group-hover:text-white transition-colors">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#3F2E23] mb-2">Affordable Prices</h3>
                <p className="text-[#6B705C] text-sm leading-relaxed">
                  Gourmet taste without breaking the bank. Savor generous Nigerian diner portions and loaded side platters with honest, straightforward Naira pricing.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E5E1DA] hover:border-[#CB997E] hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#FFE8D6] text-[#3F2E23] flex items-center justify-center mb-5 group-hover:bg-[#CB997E] group-hover:text-white transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#3F2E23] mb-2">Fast Pickup & Delivery</h3>
                <p className="text-[#6B705C] text-sm leading-relaxed">
                  Conveniently situated inside the TotalEnergies Station Road station. Pre-order on WhatsApp for zero-wait drive-by pickup or swift delivery straight to your door.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Menu Highlight Section (Natural Tones) */}
        <section id="menu" className="py-16 sm:py-20 bg-[#FDFBF7] border-b border-[#E5E1DA]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#6B705C] bg-[#FFE8D6] px-3.5 py-1.5 rounded-full border border-[#E5E1DA]">
                  Diner Staples & Favorites
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#3F2E23] mt-3 tracking-tight">
                  Handcrafted Menu Highlights
                </h2>
                <p className="text-[#6B705C] text-sm sm:text-base mt-1">
                  Tap "Order on WhatsApp" beside any item to chat directly with our diner kitchen.
                </p>
              </div>

              {/* Category Filter Pills in Natural Tones */}
              <div className="flex items-center gap-1.5 p-1.5 bg-[#FFE8D6]/70 border border-[#E5E1DA] rounded-xl overflow-x-auto">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-[#3F2E23] text-white shadow-xs'
                      : 'text-[#6B705C] hover:text-[#3F2E23]'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setActiveCategory('burgers')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeCategory === 'burgers'
                      ? 'bg-[#3F2E23] text-white shadow-xs'
                      : 'text-[#6B705C] hover:text-[#3F2E23]'
                  }`}
                >
                  Burgers
                </button>
                <button
                  onClick={() => setActiveCategory('fries')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeCategory === 'fries'
                      ? 'bg-[#3F2E23] text-white shadow-xs'
                      : 'text-[#6B705C] hover:text-[#3F2E23]'
                  }`}
                >
                  Crispy & Loaded Fries
                </button>
                <button
                  onClick={() => setActiveCategory('sides')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeCategory === 'sides'
                      ? 'bg-[#3F2E23] text-white shadow-xs'
                      : 'text-[#6B705C] hover:text-[#3F2E23]'
                  }`}
                >
                  Sides & Shakes
                </button>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#E5E1DA] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
                >
                  {/* Item Image with tags */}
                  <div className="relative aspect-4/3 overflow-hidden bg-[#FFE8D6]/40">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {item.popular && (
                        <span className="bg-[#CB997E] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                          Customer Fave
                        </span>
                      )}
                      {item.spicy && (
                        <span className="bg-[#3F2E23] text-[#FFE8D6] text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                          Spicy
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-serif font-bold text-[#3F2E23] text-lg group-hover:text-[#CB997E] transition-colors leading-tight">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-[#6B705C] text-xs line-clamp-3 leading-relaxed mb-4">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E5E1DA]/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-[#6B705C] font-bold block uppercase tracking-wider">Price</span>
                        <span className="font-sans text-xl font-black text-[#CB997E] tracking-tight">
                          {item.price}
                        </span>
                      </div>

                      <a
                        id={`order-item-${item.id}`}
                        href={getWhatsAppOrderUrl(item.name, item.price)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>Order</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom order banner (Earthy Wood to Terracotta Natural Palette) */}
            <div className="mt-12 bg-gradient-to-r from-[#3F2E23] via-[#4A372C] to-[#CB997E] rounded-3xl p-6 sm:p-8 text-[#FFE8D6] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#3F2E23]/15">
              <div className="text-center md:text-left">
                <h3 className="font-serif text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Craving custom toppings or extra melted cheese?
                </h3>
                <p className="text-[#FFE8D6]/90 text-sm sm:text-base mt-1 max-w-xl">
                  Tell our kitchen staff your exact preference on WhatsApp. We cater to custom combo requests and bulk party boxes!
                </p>
              </div>
              <a
                href={getWhatsAppOrderUrl("Custom Diner Order", "Custom")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FFE8D6] text-[#3F2E23] hover:bg-white font-black text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md flex-shrink-0 transition-transform active:scale-95"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366] fill-current" />
                <span>Custom Order on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* 5. Customer Testimonials Section (Applied .review-card background: var(--cream) from Design HTML) */}
        <section id="reviews" className="py-16 sm:py-20 bg-white border-b border-[#E5E1DA]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 text-[#CB997E] mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#CB997E] text-[#CB997E]" />
                ))}
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#3F2E23] tracking-tight">
                Loved by Locals & Google Guides
              </h2>
              <p className="text-[#6B705C] text-sm sm:text-base mt-2">
                Real feedback from patrons who found us on Google Maps and dropped by for their favorite burger fix.
              </p>
            </div>

            {/* Testimonials with var(--cream) background as specified in the Natural Tones design theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-[#FFE8D6] p-6 sm:p-7 rounded-2xl border border-[#E5E1DA] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Rating stars and quote marks */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-[#CB997E]">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#CB997E] text-[#CB997E]" />
                        ))}
                      </div>
                      <span className="text-xs text-[#6B705C] font-medium">{review.date}</span>
                    </div>

                    <p className="font-serif text-[#2D241E] text-base font-medium italic leading-relaxed mb-6">
                      "{review.text}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E5E1DA] flex items-center gap-3">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-[#E5E1DA]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-[#3F2E23] text-sm">{review.author}</h4>
                      </div>
                      <div className="text-[11px] font-bold text-[#6B705C] uppercase tracking-wider mt-0.5">
                        <span>{review.tag}</span> • <span>{review.reviewCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Google Maps Profile Badge Callout in Natural Tones */}
            <div className="mt-10 p-5 bg-[#FDFBF7] rounded-2xl border border-[#E5E1DA] max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#CB997E] text-white flex items-center justify-center flex-shrink-0 font-black">
                  {siteConfig.averageRating}★
                </div>
                <div>
                  <p className="text-sm font-bold text-[#3F2E23]">Rated {siteConfig.averageRating} out of 5 on Google Maps</p>
                  <p className="text-xs text-[#6B705C]">Based on {siteConfig.totalReviewsCount} verified diner reviews in {siteConfig.city}</p>
                </div>
              </div>
              <a
                href={siteConfig.googleMapsLink || "https://maps.google.com/?q=The+Metro%27s+Diner+Emirs+Rd+Ilorin"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#3F2E23] hover:text-[#CB997E] inline-flex items-center gap-1 underline underline-offset-4 transition-colors"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* 6. Online Pre-Orders & Inquiries (Firestore Integration: incoming_leads) */}
        <section id="contact" className="py-16 sm:py-20 bg-[#FDFBF7] border-b border-[#E5E1DA]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#6B705C] bg-[#FFE8D6] px-3.5 py-1.5 rounded-full border border-[#E5E1DA]">
                Direct Kitchen Leads
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#3F2E23] mt-3 tracking-tight">
                Send a Pre-Order or Inquiry
              </h2>
              <p className="text-[#6B705C] text-sm sm:text-base mt-2">
                Have special burger customizations, catering plans, or looking to pre-order? Leave your note below and our team receives it directly.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5E1DA] p-6 sm:p-9 shadow-xs">
              <AnimatePresence>
                {submissionStatus === 'success' && (
                  <motion.div
                    key="submission-success-banner"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.25, ease: 'easeOut' } }}
                    className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#FFE8D6] border border-[#CB997E] text-[#3F2E23] flex items-start justify-between gap-3 shadow-sm overflow-hidden"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#3F2E23]">Awesome! Your request has been sent straight to The Metro's Diner!</h4>
                        <p className="text-xs text-[#6B705C] mt-1">
                          Our kitchen has logged your details in our system. You can also chat directly on WhatsApp for immediate real-time prep status.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSubmissionStatus('idle')}
                            className="text-xs font-bold text-[#3F2E23] hover:text-[#CB997E] underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Send another request
                          </button>
                          <span className="text-[#E5E1DA]">•</span>
                          <a
                            href={getWhatsAppOrderUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#25D366] hover:text-[#1EBE5D] inline-flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>Confirm on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmissionStatus('idle')}
                      className="p-1.5 text-[#6B705C] hover:text-[#3F2E23] rounded-full hover:bg-black/5 transition-colors cursor-pointer flex-shrink-0"
                      aria-label="Dismiss message"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {submissionStatus === 'error' && (
                  <motion.div
                    key="submission-error-banner"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.25, ease: 'easeOut' } }}
                    className="mb-6 p-4 rounded-2xl bg-[#FFE8D6]/40 border border-red-300 text-red-900 flex items-start justify-between gap-3 overflow-hidden"
                  >
                    <div className="flex items-start gap-3.5">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">
                          {errorMessage || "Something went wrong. Please try placing your order via WhatsApp!"}
                        </h4>
                        <p className="text-xs text-red-800/80 mt-1">
                          Our kitchen is always active on WhatsApp for direct instant orders.
                        </p>
                        <a
                          href={getWhatsAppOrderUrl(customerName ? `Order from ${customerName}` : undefined)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>Order directly via WhatsApp</span>
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmissionStatus('idle')}
                      className="p-1.5 text-red-700 hover:text-red-950 rounded-full hover:bg-red-500/10 transition-colors cursor-pointer flex-shrink-0"
                      aria-label="Dismiss error"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Exact form required: id="contactForm", inputs with id="customerName" and id="orderNotes" */}
              <form id="contactForm" onSubmit={handleContactSubmit} className="space-y-5">
                <div>
                  <label htmlFor="customerName" className="block text-xs font-bold uppercase tracking-wider text-[#3F2E23] mb-1.5">
                    Customer Name <span className="text-[#CB997E]">*</span>
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Richard Ogbedo"
                    className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E5E1DA] rounded-xl text-sm text-[#2D241E] placeholder:text-[#6B705C]/50 focus:outline-none focus:border-[#CB997E] focus:ring-1 focus:ring-[#CB997E] transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="orderNotes" className="block text-xs font-bold uppercase tracking-wider text-[#3F2E23]">
                      Order Notes <span className="text-[#CB997E]">*</span>
                    </label>
                    <span className="text-[11px] text-[#6B705C]">Items, customizations, pickup time</span>
                  </div>

                  {/* Quick helper items to tap */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className="text-[10px] uppercase font-bold text-[#6B705C] mr-1">Quick add:</span>
                    {[
                      'Classic Cheeseburger',
                      'Metro Loaded Fries',
                      'Crispy Chicken Burger',
                      'Glazed BBQ Wings',
                      'Hand-Spun Milkshake',
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setOrderNotes((prev) => (prev ? `${prev}, ${item}` : item));
                        }}
                        className="text-[11px] font-medium bg-[#FFE8D6]/60 hover:bg-[#FFE8D6] text-[#3F2E23] px-2.5 py-1 rounded-lg border border-[#E5E1DA] transition-colors cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>

                  <textarea
                    id="orderNotes"
                    name="orderNotes"
                    required
                    rows={4}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. 2 Classic Cheeseburgers with extra cheese, 1 Metro Loaded Fries. Ready for pickup around 7:00 PM."
                    className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E5E1DA] rounded-xl text-sm text-[#2D241E] placeholder:text-[#6B705C]/50 focus:outline-none focus:border-[#CB997E] focus:ring-1 focus:ring-[#CB997E] transition-all resize-y"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-[#6B705C] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6B705C] flex-shrink-0" />
                    <span>Saves directly to incoming_leads collection</span>
                  </p>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      id="submitOrderBtn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3F2E23] hover:bg-[#2D241E] active:scale-95 text-[#FFE8D6] font-bold text-sm px-7 py-3.5 rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#CB997E]" />
                          <span>Sending Request...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-[#CB997E]" />
                          <span>Send to The Metro's Diner</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 7. Footer & Contact Section (Rich Natural Wood Background: var(--wood) #3F2E23) */}
        <section id="location" className="py-16 sm:py-20 bg-[#3F2E23] text-[#FFE8D6]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              
              {/* Location & Details */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-[#CB997E] text-xs font-bold uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Find Us in Ilorin</span>
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-black text-white tracking-tight">
                    The Metro's Diner
                  </h2>
                  <p className="text-[#E5E1DA] text-sm mt-2 leading-relaxed">
                    Conveniently situated right inside the Station Road TotalEnergies service station, opposite key landmarks and quick to access.
                  </p>
                </div>

                {/* Details List */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#2D241E] border border-[#523F33] flex items-center justify-center text-[#CB997E] flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#CB997E] uppercase tracking-wider">Physical Address</h4>
                      <p className="text-sm font-semibold text-[#FDFBF7] mt-0.5 leading-snug">
                        {siteConfig.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#2D241E] border border-[#523F33] flex items-center justify-center text-[#CB997E] flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#CB997E] uppercase tracking-wider">Operating Hours</h4>
                      <p className="text-sm font-semibold text-[#25D366] mt-0.5">
                        {siteConfig.openingHours}
                      </p>
                      <p className="text-xs text-[#E5E1DA]/80">Monday to Sunday (All days)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#2D241E] border border-[#523F33] flex items-center justify-center text-[#CB997E] flex-shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#CB997E] uppercase tracking-wider">Phone & Inquiries</h4>
                      <a
                        href={`tel:${siteConfig.phone.replace(/\s+/g, '')}`}
                        className="text-sm font-bold text-white hover:text-[#CB997E] transition-colors mt-0.5 block"
                      >
                        {siteConfig.phone}
                      </a>
                      <p className="text-xs text-[#E5E1DA]/80">Direct kitchen line & dispatch</p>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-3">
                  <a
                    href={getWhatsAppOrderUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Order on WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 bg-[#2D241E] hover:bg-[#382b22] text-[#FFE8D6] font-bold text-sm px-5 py-3.5 rounded-xl transition-all border border-[#523F33] active:scale-95"
                  >
                    <Phone className="w-4 h-4 text-[#CB997E]" />
                    <span>Call {siteConfig.phone}</span>
                  </a>
                </div>
              </div>

              {/* Map Card Preview / Directions */}
              <div className="lg:col-span-6">
                <div className="bg-[#2D241E] border border-[#523F33] rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-white text-lg">Location Coordinates</h3>
                      <p className="text-xs text-[#E5E1DA]/80">TotalEnergies Station Road • Near Post Office</p>
                    </div>
                    <span className="bg-[#FFE8D6]/10 text-[#FFE8D6] text-xs font-bold px-2.5 py-1 rounded-full border border-[#CB997E]/30">
                      Open Daily
                    </span>
                  </div>

                  {/* Map Graphic Mock / Directions box */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#523F33] aspect-16/9 bg-[#1F1915] flex flex-col items-center justify-center p-6 text-center group">
                    <div className="absolute inset-0 bg-[radial-gradient(#523F33_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-full bg-[#CB997E]/20 text-[#CB997E] flex items-center justify-center mx-auto mb-3 border border-[#CB997E]/40 animate-pulse">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <p className="font-serif text-sm font-bold text-[#FFE8D6]">{siteConfig.restaurantName} Ilorin</p>
                      <p className="text-xs text-[#E5E1DA]/80 mt-0.5">Station Road Service Station</p>
                      
                      <a
                        href={siteConfig.googleMapsLink || "https://maps.google.com/?q=The+Metro%27s+Diner+Emirs+Rd+Ilorin"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 bg-[#CB997E] hover:bg-[#b8856c] text-[#2D241E] text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md"
                      >
                        <span>Get Google Maps Directions</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[#E5E1DA]/70">
                    <span>Landmark: Near Post Office, Emirs Rd</span>
                    <span>Easy Parking Available</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Copyright in Natural Tones */}
            <div className="mt-16 pt-8 border-t border-[#523F33] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E5E1DA]/70">
              <p>© {new Date().getFullYear()} {siteConfig.restaurantName} • TotalEnergies Service Station, {siteConfig.city}.</p>
              <div className="flex flex-wrap items-center gap-5">
                <a href="#menu" className="hover:text-white transition-colors">Menu</a>
                <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
                <a href="#contact" className="hover:text-white transition-colors">Pre-Order</a>
                <a href="#location" className="hover:text-white transition-colors">Find Us</a>
                <button
                  onClick={handleOpenAdmin}
                  className="text-[#CB997E] hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isAdminLoggedIn ? <Settings className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{isAdminLoggedIn ? "Admin Panel" : "Admin Login"}</span>
                </button>
                <a
                  href={getWhatsAppOrderUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:text-[#1EBE5D] font-semibold"
                >
                  WhatsApp Ordering
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Admin Button on Desktop (Bottom Right) */}
      <button
        id="floating-admin-btn"
        onClick={handleOpenAdmin}
        className="fixed bottom-6 right-6 z-40 bg-[#3F2E23] hover:bg-[#2D241E] text-[#FFE8D6] border border-[#523F33] shadow-2xl px-3.5 py-2.5 rounded-full text-xs font-bold transition-all hidden md:flex items-center gap-2 hover:scale-105 active:scale-95 group cursor-pointer"
        title={isAdminLoggedIn ? "Admin Control: Edit all food images, prices, and website details" : "Admin Login: Password Protected Access"}
      >
        <span className={`w-2 h-2 rounded-full ${isAdminLoggedIn ? 'bg-[#25D366] animate-pulse' : 'bg-[#CB997E]'}`}></span>
        {isAdminLoggedIn ? <Sliders className="w-4 h-4 text-[#CB997E]" /> : <Lock className="w-4 h-4 text-[#CB997E]" />}
        <span>{isAdminLoggedIn ? "Admin Panel" : "Admin Login"}</span>
      </button>

      {/* Floating Mobile Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-lg border-t border-[#E5E1DA] p-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <a
            href={`tel:${siteConfig.phone.replace(/\s+/g, '')}`}
            className="flex items-center justify-center p-3.5 rounded-xl bg-[#FFE8D6] text-[#3F2E23] border border-[#E5E1DA] active:scale-95 transition-transform"
            aria-label="Call Diner"
          >
            <Phone className="w-5 h-5 text-[#3F2E23]" />
          </a>
          <a
            id="mobile-floating-whatsapp-btn"
            href={getWhatsAppOrderUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#25D366]/30 transition-all text-sm"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Order via WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Toast Notification for share copy with smooth closing animation */}
      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            key="share-copied-toast"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#3F2E23] text-[#FFE8D6] text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-[#523F33]"
          >
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buyers Welcome Pop-up */}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={() => setShowWelcomePopup(false)}
        config={siteConfig}
        onExploreMenu={() => {
          const el = document.getElementById('menu');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onWhatsAppOrder={() => window.open(getWhatsAppOrderUrl(), '_blank')}
      />

      {/* Admin Login Gateway with Password Protection */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        correctPassword={siteConfig.adminPassword || 'admin'}
      />

      {/* Admin Panel Modal for editing all food images, prices, and site texts */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onLogout={handleAdminLogout}
        menuItems={menuItems}
        onSaveMenuItems={handleSaveMenuItems}
        siteConfig={siteConfig}
        onSaveSiteConfig={handleSaveSiteConfig}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}
