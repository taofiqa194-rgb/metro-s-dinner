import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Image as ImageIcon,
  DollarSign,
  Edit3,
  Sliders,
  Check,
  Flame,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Lock,
  LogOut,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Undo2,
  AlertTriangle,
} from 'lucide-react';
import { MenuItem, SiteConfig } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  menuItems: MenuItem[];
  onSaveMenuItems: (items: MenuItem[]) => void;
  siteConfig: SiteConfig;
  onSaveSiteConfig: (config: SiteConfig) => void;
  onResetDefaults: () => void;
}

// Preset food images for rapid replacement if admin doesn't have an external URL handy
const FOOD_IMAGE_PRESETS = [
  { label: 'Smash Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Double Bacon Burger', url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Crispy Chicken Burger', url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Loaded Cheesy Fries', url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80' },
  { label: 'Golden Crinkle Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80' },
  { label: 'Crispy Wings', url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Chicken Tenders', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80' },
  { label: 'Diner Milkshake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cheesy Hot Dogs', url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Iced Drinks & Soda', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80' },
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  menuItems,
  onSaveMenuItems,
  siteConfig,
  onSaveSiteConfig,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'site' | 'popup' | 'security'>('menu');
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [config, setConfig] = useState<SiteConfig>(siteConfig);
  const [adminPasswordInput, setAdminPasswordInput] = useState(siteConfig.adminPassword || 'admin');
  const [showPassword, setShowPassword] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [passwordToast, setPasswordToast] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [selectedPresetTargetId, setSelectedPresetTargetId] = useState<string | null>(null);

  // New Dish Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('₦4,000');
  const [newDishCategory, setNewDishCategory] = useState<'burgers' | 'fries' | 'sides'>('burgers');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishImage, setNewDishImage] = useState(FOOD_IMAGE_PRESETS[0].url);
  const [newDishPopular, setNewDishPopular] = useState(false);
  const [newDishSpicy, setNewDishSpicy] = useState(false);
  const [showNewPresetPicker, setShowNewPresetPicker] = useState(false);

  // Delete & Reset Confirmations
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [actionToast, setActionToast] = useState<{ message: string; undoItem?: MenuItem } | null>(null);

  // Sync state when props change or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setItems(menuItems);
      setConfig(siteConfig);
      setAdminPasswordInput(siteConfig.adminPassword || 'admin');
      setPasswordError(null);
      setConfirmDeleteId(null);
      setShowResetConfirm(false);
    }
  }, [isOpen, menuItems, siteConfig]);

  const handleUpdateItem = (id: string, field: keyof MenuItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updatedItem = { ...item, [field]: value };
        if (field === 'price') {
          const raw = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(raw) && raw > 0) {
            updatedItem.rawPrice = raw;
          }
        }
        return updatedItem;
      })
    );
  };

  const handleCreateNewDish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = newDishName.trim() || 'New Diner Dish';
    let finalPrice = newDishPrice.trim() || '₦4,000';
    if (!finalPrice.startsWith('₦') && !isNaN(Number(finalPrice.replace(/,/g, '')))) {
      finalPrice = `₦${finalPrice}`;
    }
    const rawPriceNum = parseInt(finalPrice.replace(/[^0-9]/g, ''), 10) || 4000;

    const newItem: MenuItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      category: newDishCategory,
      price: finalPrice,
      rawPrice: rawPriceNum,
      description: newDishDesc.trim() || 'Freshly prepared at The Metro\'s Diner with authentic recipe.',
      image: newDishImage.trim() || FOOD_IMAGE_PRESETS[0].url,
      popular: newDishPopular,
      spicy: newDishSpicy,
    };

    const updated = [newItem, ...items];
    setItems(updated);
    onSaveMenuItems(updated);

    // Reset Form
    setNewDishName('');
    setNewDishPrice('₦4,000');
    setNewDishDesc('');
    setNewDishPopular(false);
    setNewDishSpicy(false);
    setShowAddForm(false);
    setShowNewPresetPicker(false);

    setActionToast({ message: `"${newItem.name}" added to menu and saved!` });
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleQuickAdd = () => {
    const newItem: MenuItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: "New Delicious Dish",
      category: 'burgers',
      price: "₦4,000",
      rawPrice: 4000,
      description: "Freshly prepared with authentic diner ingredients and house sauce.",
      image: FOOD_IMAGE_PRESETS[0].url,
      popular: false,
      spicy: false,
    };
    const updated = [newItem, ...items];
    setItems(updated);
    onSaveMenuItems(updated);
    setActionToast({ message: `New dish created at top of menu! You can edit its details below.` });
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleConfirmDelete = (id: string) => {
    const itemToDelete = items.find((item) => item.id === id);
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    onSaveMenuItems(updated);
    setConfirmDeleteId(null);

    setActionToast({
      message: `"${itemToDelete?.name || 'Dish'}" removed from menu.`,
      undoItem: itemToDelete,
    });
    setTimeout(() => setActionToast(null), 5000);
  };

  const handleUndoDelete = () => {
    if (actionToast?.undoItem) {
      const restored = [actionToast.undoItem, ...items];
      setItems(restored);
      onSaveMenuItems(restored);
      setActionToast(null);
    }
  };

  const handleSaveAll = () => {
    const updatedConfig = {
      ...config,
      adminPassword: adminPasswordInput.trim() || 'admin',
    };
    onSaveMenuItems(items);
    onSaveSiteConfig(updatedConfig);
    setConfig(updatedConfig);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleSavePasswordOnly = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!adminPasswordInput.trim()) {
      setPasswordError("Admin password cannot be empty!");
      return;
    }
    const updatedConfig = {
      ...config,
      adminPassword: adminPasswordInput.trim(),
    };
    onSaveSiteConfig(updatedConfig);
    setConfig(updatedConfig);
    setPasswordToast(true);
    setTimeout(() => setPasswordToast(false), 3000);
  };

  const handleApplyPresetImage = (url: string) => {
    if (selectedPresetTargetId === 'hero') {
      setConfig({ ...config, heroMainImage: url });
      setSelectedPresetTargetId(null);
    } else if (selectedPresetTargetId) {
      handleUpdateItem(selectedPresetTargetId, 'image', url);
      setSelectedPresetTargetId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="admin-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#2D241E]/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-portal-title"
        >
          <motion.div
            key="admin-modal-window"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 350 } }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 15,
              transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }}
            className="relative w-full max-w-5xl h-[90vh] bg-[#FDFBF7] rounded-3xl border-2 border-[#E5E1DA] shadow-2xl flex flex-col overflow-hidden text-[#2D241E]"
          >
            {/* Admin Header */}
            <div className="bg-[#3F2E23] text-[#FFE8D6] px-6 py-4 flex items-center justify-between border-b border-[#523F33] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#CB997E] text-white flex items-center justify-center font-black">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="admin-portal-title" className="font-serif text-xl sm:text-2xl font-black text-white leading-tight">
                    Admin Control Panel
                  </h2>
                  <p className="text-xs text-[#E5E1DA]/80">
                    Change food images, update prices, and customize everything on the website
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  id="admin-logout-btn"
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#2D241E] hover:bg-black text-[#FFE8D6] font-bold text-xs px-3 py-2 rounded-xl transition-all border border-[#523F33] cursor-pointer"
                  title="Log out and protect Admin portal"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#CB997E]" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>

                <button
                  id="admin-save-top-btn"
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-1.5 bg-[#CB997E] hover:bg-[#b8856c] active:scale-95 text-[#2D241E] font-black text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  id="admin-close-modal-btn"
                  onClick={onClose}
                  className="p-2 text-[#FFE8D6] hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  aria-label="Close Admin Modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-[#E5E1DA] px-6 flex items-center gap-2 overflow-x-auto flex-shrink-0">
              <button
                onClick={() => setActiveTab('menu')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'menu'
                    ? 'border-[#CB997E] text-[#3F2E23]'
                    : 'border-transparent text-[#6B705C] hover:text-[#3F2E23]'
                }`}
              >
                <Flame className="w-4 h-4 text-[#CB997E]" />
                <span>Food Menu, Images & Prices ({items.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('site')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'site'
                    ? 'border-[#CB997E] text-[#3F2E23]'
                    : 'border-transparent text-[#6B705C] hover:text-[#3F2E23]'
                }`}
              >
                <Edit3 className="w-4 h-4 text-[#CB997E]" />
                <span>Website Text & Details</span>
              </button>

              <button
                onClick={() => setActiveTab('popup')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'popup'
                    ? 'border-[#CB997E] text-[#3F2E23]'
                    : 'border-transparent text-[#6B705C] hover:text-[#3F2E23]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#CB997E]" />
                <span>Welcome Pop-up</span>
              </button>

              <button
                id="admin-security-tab-btn"
                onClick={() => setActiveTab('security')}
                className={`py-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-[#CB997E] text-[#3F2E23]'
                    : 'border-transparent text-[#6B705C] hover:text-[#3F2E23]'
                }`}
              >
                <Lock className="w-4 h-4 text-[#CB997E]" />
                <span>Password & Security</span>
              </button>
            </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: MENU ITEMS & PRICES */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFE8D6]/70 p-4 sm:p-5 rounded-2xl border border-[#E5E1DA]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#3F2E23]">
                    Food Dishes, Images, Prices & Descriptions
                  </h3>
                  <p className="text-xs text-[#6B705C] mt-0.5">
                    Add new items, remove dishes, or change photos and prices. Changes are saved immediately and update on the diner website.
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  <button
                    id="admin-quick-add-dish-btn"
                    type="button"
                    onClick={handleQuickAdd}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FFE8D6] text-[#3F2E23] border border-[#E5E1DA] font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                    title="Instantly add a template dish to the menu"
                  >
                    <Plus className="w-4 h-4 text-[#CB997E]" />
                    <span>Quick Add</span>
                  </button>
                  <button
                    id="admin-add-food-btn"
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex items-center gap-1.5 bg-[#3F2E23] hover:bg-[#2D241E] text-[#FFE8D6] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 text-[#CB997E]" />
                    <span>{showAddForm ? 'Close Add Form' : 'Add New Food Dish'}</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Add New Dish Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form
                      onSubmit={handleCreateNewDish}
                      className="bg-white rounded-2xl border-2 border-[#CB997E] p-4 sm:p-6 shadow-md space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#E5E1DA] pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FFE8D6] flex items-center justify-center text-[#CB997E]">
                            <Plus className="w-4 h-4" />
                          </div>
                          <h4 className="font-serif font-bold text-[#3F2E23] text-base">
                            Create New Food Item
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="text-[#6B705C] hover:text-[#3F2E23] p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Image Preview & URL */}
                        <div className="md:col-span-4 space-y-2">
                          <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#FFE8D6]/40 border border-[#E5E1DA]">
                            <img
                              src={newDishImage}
                              alt="New dish preview"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = FOOD_IMAGE_PRESETS[0].url;
                              }}
                            />
                            <span className="absolute bottom-2 left-2 bg-[#3F2E23]/80 text-[#FFE8D6] text-[10px] font-bold px-2 py-0.5 rounded-md">
                              New Dish Photo
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B705C] mb-1">
                              Image URL
                            </label>
                            <input
                              type="url"
                              value={newDishImage}
                              onChange={(e) => setNewDishImage(e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 text-xs bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowNewPresetPicker(!showNewPresetPicker)}
                            className="text-[11px] font-bold text-[#CB997E] hover:text-[#3F2E23] flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{showNewPresetPicker ? 'Hide Image Presets' : 'Choose Preset Diner Photo'}</span>
                          </button>

                          {showNewPresetPicker && (
                            <div className="p-2 bg-[#FFE8D6]/40 rounded-xl border border-[#E5E1DA] grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                              {FOOD_IMAGE_PRESETS.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => {
                                    setNewDishImage(preset.url);
                                    setShowNewPresetPicker(false);
                                  }}
                                  className="text-[10px] text-left p-1.5 bg-white hover:bg-[#FFE8D6] rounded-md border border-[#E5E1DA] truncate cursor-pointer transition-colors"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Name, Category, Price, Description */}
                        <div className="md:col-span-8 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3F2E23] mb-1">
                                Dish Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={newDishName}
                                onChange={(e) => setNewDishName(e.target.value)}
                                placeholder="e.g. Double Smokey Cheeseburger"
                                className="w-full px-3 py-2 text-sm font-bold bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#CB997E] mb-1">
                                Price (Naira) *
                              </label>
                              <input
                                type="text"
                                required
                                value={newDishPrice}
                                onChange={(e) => setNewDishPrice(e.target.value)}
                                placeholder="e.g. ₦4,500"
                                className="w-full px-3 py-2 text-sm font-black text-[#CB997E] bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B705C] mb-1">
                                Category
                              </label>
                              <select
                                value={newDishCategory}
                                onChange={(e) => setNewDishCategory(e.target.value as any)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                              >
                                <option value="burgers">Burgers</option>
                                <option value="fries">Fries</option>
                                <option value="sides">Sides & Shakes</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2 pt-5">
                              <input
                                type="checkbox"
                                id="new-dish-popular"
                                checked={newDishPopular}
                                onChange={(e) => setNewDishPopular(e.target.checked)}
                                className="w-4 h-4 accent-[#CB997E] rounded cursor-pointer"
                              />
                              <label
                                htmlFor="new-dish-popular"
                                className="text-xs font-bold text-[#3F2E23] cursor-pointer"
                              >
                                Customer Fave Badge
                              </label>
                            </div>

                            <div className="flex items-center gap-2 pt-5">
                              <input
                                type="checkbox"
                                id="new-dish-spicy"
                                checked={newDishSpicy}
                                onChange={(e) => setNewDishSpicy(e.target.checked)}
                                className="w-4 h-4 accent-[#3F2E23] rounded cursor-pointer"
                              />
                              <label
                                htmlFor="new-dish-spicy"
                                className="text-xs font-bold text-[#3F2E23] cursor-pointer"
                              >
                                Spicy Flavor Badge
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B705C] mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={newDishDesc}
                              onChange={(e) => setNewDishDesc(e.target.value)}
                              placeholder="Ingredients, toppings, preparation notes..."
                              className="w-full px-3 py-2 text-xs bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E] resize-y"
                            />
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setShowAddForm(false)}
                              className="px-4 py-2 text-xs font-bold text-[#6B705C] hover:text-[#3F2E23] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                            >
                              <Check className="w-4 h-4" />
                              <span>Add Dish to Menu</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Items List */}
              <div className="grid grid-cols-1 gap-6">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#E5E1DA] p-4 sm:p-5 shadow-xs hover:border-[#CB997E] transition-colors"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Food Image Preview & URL */}
                      <div className="lg:col-span-4 space-y-2.5">
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#FFE8D6]/40 border border-[#E5E1DA] group">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // fallback image if broken url
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <span className="absolute bottom-2 left-2 bg-[#3F2E23]/80 text-[#FFE8D6] text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                            Preview #{idx + 1}
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B705C] mb-1">
                            Food Image URL
                          </label>
                          <input
                            type="url"
                            value={item.image}
                            onChange={(e) => handleUpdateItem(item.id, 'image', e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-2 text-xs bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                          />
                        </div>

                        {/* Quick pick from diner presets */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPresetTargetId(
                                selectedPresetTargetId === item.id ? null : item.id
                              )
                            }
                            className="text-[11px] font-bold text-[#CB997E] hover:text-[#3F2E23] flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>
                              {selectedPresetTargetId === item.id
                                ? 'Hide Quick Presets'
                                : 'Choose From Preset Food Images'}
                            </span>
                          </button>

                          {selectedPresetTargetId === item.id && (
                            <div className="mt-2 p-2 bg-[#FFE8D6]/40 rounded-xl border border-[#E5E1DA] grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                              {FOOD_IMAGE_PRESETS.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleApplyPresetImage(preset.url)}
                                  className="text-[10px] text-left p-1.5 bg-white hover:bg-[#FFE8D6] rounded-md border border-[#E5E1DA] truncate cursor-pointer transition-colors"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Food Name, Price, Category, Description */}
                      <div className="lg:col-span-8 space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Name */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3F2E23] mb-1">
                              Food Dish Name
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 text-sm font-bold bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                            />
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#CB997E] mb-1">
                              Price (Naira)
                            </label>
                            <input
                              type="text"
                              value={item.price}
                              onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                              placeholder="e.g. ₦4,500"
                              className="w-full px-3 py-2 text-sm font-black text-[#CB997E] bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Category */}
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B705C] mb-1">
                              Category
                            </label>
                            <select
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'category', e.target.value as any)
                              }
                              className="w-full px-3 py-2 text-xs font-semibold bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                            >
                              <option value="burgers">Burgers</option>
                              <option value="fries">Fries</option>
                              <option value="sides">Sides & Shakes</option>
                            </select>
                          </div>

                          {/* Popular toggle */}
                          <div className="flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              id={`popular-${item.id}`}
                              checked={!!item.popular}
                              onChange={(e) => handleUpdateItem(item.id, 'popular', e.target.checked)}
                              className="w-4 h-4 accent-[#CB997E] rounded cursor-pointer"
                            />
                            <label
                              htmlFor={`popular-${item.id}`}
                              className="text-xs font-bold text-[#3F2E23] cursor-pointer"
                            >
                              Customer Fave Badge
                            </label>
                          </div>

                          {/* Spicy toggle */}
                          <div className="flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              id={`spicy-${item.id}`}
                              checked={!!item.spicy}
                              onChange={(e) => handleUpdateItem(item.id, 'spicy', e.target.checked)}
                              className="w-4 h-4 accent-[#3F2E23] rounded cursor-pointer"
                            />
                            <label
                              htmlFor={`spicy-${item.id}`}
                              className="text-xs font-bold text-[#3F2E23] cursor-pointer"
                            >
                              Spicy Flavor Badge
                            </label>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B705C] mb-1">
                            Dish Description
                          </label>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'description', e.target.value)
                            }
                            className="w-full px-3 py-2 text-xs bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E] resize-y"
                          />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex justify-end">
                          {confirmDeleteId === item.id ? (
                            <div className="flex flex-wrap items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl animate-in fade-in">
                              <span className="text-xs font-bold text-red-700">Delete &ldquo;{item.name}&rdquo;?</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(item.id)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-colors"
                              >
                                Yes, Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="bg-white hover:bg-gray-100 text-[#3F2E23] border border-gray-300 font-bold text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove this dish</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL WEBSITE CONTENT */}
          {activeTab === 'site' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#3F2E23]">
                  Edit Restaurant Text, Phone & Location
                </h3>
                <p className="text-xs text-[#6B705C]">
                  Update contact numbers, address, top banner announcement, and hero section.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={config.restaurantName}
                    onChange={(e) => setConfig({ ...config, restaurantName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Phone Number (Display)
                  </label>
                  <input
                    type="text"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    WhatsApp Order Number (e.g. 2349134779028 or 09134779028)
                  </label>
                  <input
                    type="text"
                    value={config.whatsappNumber}
                    onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={config.openingHours}
                    onChange={(e) => setConfig({ ...config, openingHours: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Top Banner Alert Message
                  </label>
                  <input
                    type="text"
                    value={config.topBannerText}
                    onChange={(e) => setConfig({ ...config, topBannerText: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Full Physical Address
                  </label>
                  <input
                    type="text"
                    value={config.address}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Hero Section Headline
                  </label>
                  <input
                    type="text"
                    value={config.heroHeadline}
                    onChange={(e) => setConfig({ ...config, heroHeadline: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Hero Section Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={config.heroSubtitle}
                    onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Hero Main Showcase Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={config.heroMainImage}
                      onChange={(e) => setConfig({ ...config, heroMainImage: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPresetTargetId(
                          selectedPresetTargetId === 'hero' ? null : 'hero'
                        )
                      }
                      className="px-3 py-2 bg-[#FFE8D6] text-[#3F2E23] text-xs font-bold rounded-lg border border-[#E5E1DA] hover:bg-[#CB997E] hover:text-white transition-colors cursor-pointer"
                    >
                      Presets
                    </button>
                  </div>

                  {selectedPresetTargetId === 'hero' && (
                    <div className="mt-2 p-2 bg-[#FFE8D6]/40 rounded-xl border border-[#E5E1DA] grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FOOD_IMAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyPresetImage(preset.url)}
                          className="text-[11px] p-2 bg-white hover:bg-[#FFE8D6] rounded-lg border border-[#E5E1DA] truncate cursor-pointer transition-colors text-left"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WELCOME POPUP SETTINGS */}
          {activeTab === 'popup' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#3F2E23]">
                  Welcome Pop-up Customization
                </h3>
                <p className="text-xs text-[#6B705C]">
                  Configure the pop-up that appears automatically when buyers visit the website.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFE8D6]/50 border border-[#E5E1DA] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#3F2E23]">Enable Welcome Pop-up</h4>
                  <p className="text-xs text-[#6B705C]">
                    When turned on, visitors will see this welcome modal and can cancel it to continue.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.welcomePopup.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        welcomePopup: {
                          ...config.welcomePopup,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Pop-up Badge
                  </label>
                  <input
                    type="text"
                    value={config.welcomePopup.badge}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        welcomePopup: {
                          ...config.welcomePopup,
                          badge: e.target.value,
                        },
                      })
                    }
                    placeholder="Welcome to The Metro's Diner"
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Pop-up Title
                  </label>
                  <input
                    type="text"
                    value={config.welcomePopup.title}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        welcomePopup: {
                          ...config.welcomePopup,
                          title: e.target.value,
                        },
                      })
                    }
                    placeholder="Fresh, Sizzling & Made to Order in Ilorin! 🍔✨"
                    className="w-full px-3 py-2 text-sm font-bold bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Pop-up Welcome Message
                  </label>
                  <textarea
                    rows={3}
                    value={config.welcomePopup.message}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        welcomePopup: {
                          ...config.welcomePopup,
                          message: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1">
                    Primary Action Button Text
                  </label>
                  <input
                    type="text"
                    value={config.welcomePopup.actionText}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        welcomePopup: {
                          ...config.welcomePopup,
                          actionText: e.target.value,
                        },
                      })
                    }
                    placeholder="Explore Full Menu"
                    className="w-full px-3 py-2 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-[#FFE8D6]/60 p-5 rounded-2xl border border-[#E5E1DA]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#3F2E23] text-[#FFE8D6] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#CB997E]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#3F2E23]">
                      Admin Access & Security Settings
                    </h3>
                    <p className="text-xs text-[#6B705C]">
                      Manage who can log into the Admin Control Panel to change dishes, photos, and prices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] shadow-xs space-y-5">
                <h4 className="text-sm font-bold text-[#3F2E23] uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#CB997E]" />
                  <span>Update Admin Password</span>
                </h4>

                <form onSubmit={handleSavePasswordOnly} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3F2E23] mb-1.5">
                      New Admin Password
                    </label>
                    <div className="relative">
                      <input
                        id="update-admin-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="Enter new admin password"
                        className="w-full px-4 py-3 pr-12 text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-[#CB997E] text-[#2D241E] font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B705C] hover:text-[#3F2E23] p-1 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#6B705C] mt-1.5">
                      Choose a password that only trusted diner managers know.
                    </p>
                    {passwordError && (
                      <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{passwordError}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      id="save-admin-password-btn"
                      type="submit"
                      className="inline-flex items-center gap-2 bg-[#3F2E23] hover:bg-[#2D241E] active:scale-95 text-[#FFE8D6] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-[#CB997E]" />
                      <span>Save New Password</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-4 bg-[#FDFBF7] rounded-2xl border border-[#E5E1DA] text-xs text-[#6B705C] space-y-2">
                <p className="font-bold text-[#3F2E23] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                  <span>Security Recommendations:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Keep this password private so unauthorized visitors cannot edit your menu or prices.</li>
                  <li>When you are finished updating dishes or photos, click the <span className="font-bold text-[#3F2E23]">Log Out</span> button at the top right of this panel to lock it.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-[#E5E1DA] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          {showResetConfirm ? (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl animate-in fade-in">
              <span className="text-xs font-bold text-red-800">Reset all food & settings to defaults?</span>
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                  onClose();
                  setShowResetConfirm(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                Yes, Reset All
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="bg-white hover:bg-gray-100 text-[#3F2E23] border border-gray-300 font-bold text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-bold text-[#6B705C] hover:text-red-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All to Diner Defaults</span>
            </button>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E5E1DA] text-xs font-bold text-[#3F2E23] hover:bg-[#FFE8D6]/40 cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 bg-[#3F2E23] hover:bg-[#2D241E] active:scale-95 text-[#FFE8D6] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Save className="w-4 h-4 text-[#CB997E]" />
              <span>Apply & Save All Changes</span>
            </button>
          </div>
        </div>

        {/* Action toast (Dish added, dish deleted with undo) */}
        {actionToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-[#3F2E23] text-[#FFE8D6] text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border border-[#CB997E]">
            <span>{actionToast.message}</span>
            {actionToast.undoItem && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="inline-flex items-center gap-1 bg-[#CB997E] text-[#2D241E] font-black text-[11px] px-2.5 py-1 rounded-full hover:bg-white transition-colors cursor-pointer"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="text-[#FFE8D6]/70 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toast confirmation */}
        {saveToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#25D366] text-white text-xs font-black px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 z-30">
            <Check className="w-4 h-4" />
            <span>All food images, prices, and website content saved successfully!</span>
          </div>
        )}

        {passwordToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#25D366] text-white text-xs font-black px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 z-30">
            <Check className="w-4 h-4" />
            <span>Admin password updated successfully!</span>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
