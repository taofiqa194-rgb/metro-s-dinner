export interface MenuItem {
  id: string;
  name: string;
  category: 'burgers' | 'fries' | 'sides';
  price: string;
  rawPrice: number;
  description: string;
  image: string;
  popular?: boolean;
  spicy?: boolean;
}

export interface ReviewItem {
  id: string;
  author: string;
  tag: string;
  reviewCount: string;
  rating: number;
  date: string;
  text: string;
  highlight: string;
  avatar: string;
}

export interface SiteConfig {
  restaurantName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  openingHours: string;
  topBannerText: string;
  heroBadge: string;
  heroHeadline: string;
  heroHeadlineHighlight: string;
  heroSubtitle: string;
  heroMainImage: string;
  loadedFriesBadgePrice: string;
  totalReviewsCount: string;
  averageRating: string;
  welcomePopup: {
    enabled: boolean;
    badge: string;
    title: string;
    message: string;
    promoCode?: string;
    actionText: string;
  };
  adminPassword?: string;
}
