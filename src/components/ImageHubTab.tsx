import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  FolderPlus,
  Compass,
} from 'lucide-react';
import { MenuItem } from '../types';

export interface SavedImageItem {
  id: string;
  label: string;
  url: string;
  isCustom?: boolean;
}

interface ImageHubTabProps {
  menuItems: MenuItem[];
  onApplyImageToDish: (dishId: string, imageUrl: string) => void;
  onApplyImageToHero: (imageUrl: string) => void;
  onCreateDishWithImage: (imageUrl: string, label?: string) => void;
  savedImages: SavedImageItem[];
  onAddImageToLibrary: (item: SavedImageItem) => void;
  onDeleteImageFromLibrary: (id: string) => void;
  presets: Array<{ label: string; url: string }>;
}

export const ImageHubTab: React.FC<ImageHubTabProps> = ({
  menuItems,
  onApplyImageToDish,
  onApplyImageToHero,
  onCreateDishWithImage,
  savedImages,
  onAddImageToLibrary,
  onDeleteImageFromLibrary,
  presets,
}) => {
  // Paster state
  const [inputUrl, setInputUrl] = useState('');
  const [imageLabel, setImageLabel] = useState('');
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [selectedTarget, setSelectedTarget] = useState<string>(menuItems[0]?.id || 'hero');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleUrlChange = (val: string) => {
    setInputUrl(val);
    if (!val.trim()) {
      setLoadStatus('idle');
    } else {
      setLoadStatus('loading');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          handleUrlChange(text.trim());
          showToast("Pasted link from clipboard!");
          return;
        }
      }
    } catch {
      // restricted in some iframe environments
    }
    const manual = window.prompt("Paste your copied image link here:");
    if (manual && manual.trim()) {
      handleUrlChange(manual.trim());
      showToast("Pasted image link!");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setInputUrl(dataUrl);
        setImageLabel(file.name.replace(/\.[^/.]+$/, ''));
        setLoadStatus('success');
        showToast("Image file uploaded and ready to apply!");
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so user can pick the same file again if desired
    e.target.value = '';
  };

  const handleApplyImage = () => {
    if (!inputUrl.trim()) {
      showToast("Please paste an image link or upload a photo first!");
      return;
    }

    if (selectedTarget === 'hero') {
      onApplyImageToHero(inputUrl);
      showToast("Image applied to Hero Main Banner!");
    } else if (selectedTarget === 'new-dish') {
      onCreateDishWithImage(inputUrl, imageLabel.trim() || 'New Diner Dish');
      showToast("New dish created with this image!");
    } else {
      const targetDish = menuItems.find((d) => d.id === selectedTarget);
      onApplyImageToDish(selectedTarget, inputUrl);
      showToast(`Image applied to "${targetDish?.name || 'Dish'}"!`);
    }

    // Also auto-save to library if it's a valid link and not already there
    if (!savedImages.some((img) => img.url === inputUrl)) {
      onAddImageToLibrary({
        id: `img-${Date.now()}`,
        label: imageLabel.trim() || 'Custom Uploaded Photo',
        url: inputUrl,
        isCustom: true,
      });
    }
  };

  const handleSaveToLibraryOnly = () => {
    if (!inputUrl.trim()) {
      showToast("Please enter an image link first!");
      return;
    }
    if (savedImages.some((img) => img.url === inputUrl)) {
      showToast("This image is already in your library!");
      return;
    }
    onAddImageToLibrary({
      id: `img-${Date.now()}`,
      label: imageLabel.trim() || 'Saved Food Photo',
      url: inputUrl,
      isCustom: true,
    });
    showToast("Photo saved to your image library!");
  };

  const handleCopyLink = (url: string, id: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      showToast("Image link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast("Could not copy link automatically.");
    }
  };

  const handleQuickApplyLibraryItem = (url: string, targetId: string, itemLabel: string) => {
    if (targetId === 'hero') {
      onApplyImageToHero(url);
      showToast(`"${itemLabel}" set as Hero Main Banner!`);
    } else if (targetId === 'new-dish') {
      onCreateDishWithImage(url, itemLabel);
      showToast(`Created new dish with "${itemLabel}"!`);
    } else {
      const dish = menuItems.find((d) => d.id === targetId);
      onApplyImageToDish(targetId, url);
      showToast(`"${itemLabel}" applied to ${dish?.name || 'dish'}!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-3 bg-[#25D366] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Guide Banner */}
      <div className="bg-gradient-to-r from-[#FFE8D6] to-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-[#E5E1DA] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#3F2E23] flex items-center justify-center text-[#FFE8D6]">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#3F2E23]">
                Image Link & Uploader Hub
              </h3>
            </div>
            <p className="text-xs text-[#6B705C] mt-1 max-w-2xl">
              Copy any image link from Google, Instagram, Pinterest, or any website, paste it here to test the live preview, and apply it directly to any dish or banner on your diner website!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FFE8D6] text-[#3F2E23] border border-[#E5E1DA] font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-[#CB997E]" />
              <span>Upload from Phone/PC</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* 3 Step Visual Tips */}
        <div className="mt-4 pt-4 border-t border-[#E5E1DA]/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/80 p-3 rounded-xl border border-[#E5E1DA]/60">
            <div className="text-[11px] font-black uppercase text-[#CB997E] flex items-center gap-1">
              <span>Step 1</span>
            </div>
            <p className="text-xs text-[#3F2E23] font-semibold mt-0.5">
              Find a food picture on Google, Instagram, or any site.
            </p>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[#E5E1DA]/60">
            <div className="text-[11px] font-black uppercase text-[#CB997E] flex items-center gap-1">
              <span>Step 2</span>
            </div>
            <p className="text-xs text-[#3F2E23] font-semibold mt-0.5">
              Right-click (or tap & hold on phone) & tap <strong className="text-[#3F2E23]">&ldquo;Copy Image Address&rdquo;</strong>.
            </p>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[#E5E1DA]/60">
            <div className="text-[11px] font-black uppercase text-[#CB997E] flex items-center gap-1">
              <span>Step 3</span>
            </div>
            <p className="text-xs text-[#3F2E23] font-semibold mt-0.5">
              Paste the link below, preview it live, and click <strong className="text-[#25D366]">&ldquo;Apply to Dish&rdquo;</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* Main Paste & Test Card */}
      <div className="bg-white rounded-2xl border-2 border-[#CB997E]/60 p-4 sm:p-6 shadow-sm space-y-5">
        <h4 className="font-serif font-bold text-base text-[#3F2E23] flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-[#CB997E]" />
          <span>Paste & Test Image Link</span>
        </h4>

        {/* URL Input Row with Paste & Clear Buttons */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#3F2E23]">
            Image Web Address / URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste link here e.g. https://images.unsplash.com/... or https://i.imgur.com/..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FDFBF7] border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-[#CB997E] pr-20"
              />
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => handleUrlChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B705C] hover:text-[#3F2E23] px-2 py-1 bg-gray-100 rounded-md cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex items-center justify-center gap-1.5 bg-[#FFE8D6] hover:bg-[#CB997E] text-[#3F2E23] hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-[#E5E1DA] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Copy className="w-4 h-4" />
              <span>Paste from Clipboard</span>
            </button>
          </div>
        </div>

        {/* Optional Label */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B705C] mb-1">
            Photo Title / Description (Optional)
          </label>
          <input
            type="text"
            value={imageLabel}
            onChange={(e) => setImageLabel(e.target.value)}
            placeholder="e.g. Delicious Gourmet Smash Burger"
            className="w-full max-w-md px-3 py-2 text-xs bg-[#FDFBF7] border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#CB997E]"
          />
        </div>

        {/* Live Preview Box & Destination Picker */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-[#E5E1DA]">
          {/* Image Preview Box */}
          <div className="md:col-span-5 space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#3F2E23]">
              Live Preview
            </span>
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#FFE8D6]/30 border-2 border-dashed border-[#E5E1DA] flex items-center justify-center">
              {inputUrl.trim() ? (
                <>
                  <img
                    src={inputUrl}
                    alt="Preview test"
                    referrerPolicy="no-referrer"
                    onLoad={() => setLoadStatus('success')}
                    onError={() => setLoadStatus('error')}
                    className="w-full h-full object-cover"
                  />
                  {loadStatus === 'loading' && (
                    <div className="absolute inset-0 bg-[#3F2E23]/60 flex items-center justify-center text-white text-xs font-bold backdrop-blur-xs gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading image link...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-6 space-y-2 text-[#6B705C]">
                  <ImageIcon className="w-10 h-10 mx-auto text-[#CB997E]/60" />
                  <p className="text-xs font-semibold">
                    Paste an image link or upload a photo to see the live preview here.
                  </p>
                </div>
              )}
            </div>

            {/* Status indicator */}
            {inputUrl.trim() && (
              <div>
                {loadStatus === 'success' && (
                  <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs font-bold text-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Photo loaded successfully! It is valid and ready to show.</span>
                  </div>
                )}
                {loadStatus === 'error' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Could not load image from this URL.</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      Make sure you copied the direct <em>Image Address</em> (ends in .jpg, .png, .webp, or from Unsplash/Imgur) and not the webpage URL.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Destination Selector & Apply Action */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3F2E23]">
                Where do you want to place this image?
              </label>

              <div className="space-y-2.5">
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs sm:text-sm font-bold bg-[#FDFBF7] border-2 border-[#CB997E]/50 rounded-xl focus:outline-none focus:border-[#CB997E] text-[#3F2E23]"
                >
                  <optgroup label="Diner Menu Dishes">
                    {menuItems.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        Dish: {dish.name} ({dish.price})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Website Sections">
                    <option value="hero">Hero Section: Main Header Banner</option>
                    <option value="new-dish">+ Add as a Brand New Dish to Menu</option>
                  </optgroup>
                </select>

                <p className="text-[11px] text-[#6B705C] leading-relaxed">
                  Choosing an existing dish will instantly replace its photo on the diner menu. Choosing &ldquo;Hero Section&rdquo; updates the large photo at the top of the diner website.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E1DA] flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleApplyImage}
                disabled={!inputUrl.trim()}
                className={`inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer ${
                  inputUrl.trim()
                    ? 'bg-[#25D366] hover:bg-[#1EBE5D] text-white active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Apply Image to Website Now</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToLibraryOnly}
                disabled={!inputUrl.trim()}
                className="inline-flex items-center gap-1.5 bg-[#FFE8D6] hover:bg-[#CB997E] text-[#3F2E23] hover:text-white font-bold text-xs px-3.5 py-3 rounded-xl border border-[#E5E1DA] transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Save to Library</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Image Library & Presets */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1DA] pb-2">
          <div>
            <h4 className="font-serif font-bold text-base text-[#3F2E23] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#CB997E]" />
              <span>Image Library & Preset Diner Photos ({savedImages.length + presets.length})</span>
            </h4>
            <p className="text-xs text-[#6B705C] mt-0.5">
              Click &ldquo;Copy Link&rdquo; to paste anywhere, or use the quick apply button to place on any dish instantly.
            </p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {/* Custom Saved Images */}
          {savedImages.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-xl border border-[#E5E1DA] overflow-hidden shadow-xs hover:border-[#CB997E] transition-all group flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#FFE8D6]/30 overflow-hidden">
                <img
                  src={img.url}
                  alt={img.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = presets[0].url;
                  }}
                />
                {img.isCustom && (
                  <span className="absolute top-1.5 left-1.5 bg-[#CB997E] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                    My Upload
                  </span>
                )}
              </div>

              <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-xs text-[#3F2E23] truncate" title={img.label}>
                    {img.label}
                  </h5>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-[#E5E1DA]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(img.url, img.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-[#FDFBF7] hover:bg-[#FFE8D6] text-[#3F2E23] border border-[#E5E1DA] font-bold text-[10px] py-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === img.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#25D366]" />
                          <span className="text-[#25D366]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#CB997E]" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInputUrl(img.url);
                        setImageLabel(img.label);
                        setLoadStatus('success');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-[#FFE8D6] hover:bg-[#CB997E] text-[#3F2E23] hover:text-white font-bold text-[10px] py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                      title="Load in Tester"
                    >
                      Use
                    </button>

                    {img.isCustom && (
                      <button
                        type="button"
                        onClick={() => onDeleteImageFromLibrary(img.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Remove from saved library"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Quick Target Select */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleQuickApplyLibraryItem(img.url, e.target.value, img.label);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full text-[10px] font-semibold bg-[#FDFBF7] border border-[#E5E1DA] rounded-md p-1 text-[#6B705C] cursor-pointer"
                  >
                    <option value="" disabled>
                      Apply directly to...
                    </option>
                    <option value="hero">Hero Main Banner</option>
                    <option value="new-dish">+ New Menu Dish</option>
                    {menuItems.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Default Presets */}
          {presets.map((preset, idx) => (
            <div
              key={`preset-${idx}`}
              className="bg-white rounded-xl border border-[#E5E1DA] overflow-hidden shadow-xs hover:border-[#CB997E] transition-all group flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#FFE8D6]/30 overflow-hidden">
                <img
                  src={preset.url}
                  alt={preset.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-1.5 left-1.5 bg-[#3F2E23]/80 text-[#FFE8D6] text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  Diner Preset
                </span>
              </div>

              <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                <h5 className="font-bold text-xs text-[#3F2E23] truncate" title={preset.label}>
                  {preset.label}
                </h5>

                <div className="space-y-1.5 pt-1 border-t border-[#E5E1DA]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(preset.url, `preset-${idx}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-[#FDFBF7] hover:bg-[#FFE8D6] text-[#3F2E23] border border-[#E5E1DA] font-bold text-[10px] py-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      {copiedId === `preset-${idx}` ? (
                        <>
                          <Check className="w-3 h-3 text-[#25D366]" />
                          <span className="text-[#25D366]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#CB997E]" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInputUrl(preset.url);
                        setImageLabel(preset.label);
                        setLoadStatus('success');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-[#FFE8D6] hover:bg-[#CB997E] text-[#3F2E23] hover:text-white font-bold text-[10px] py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                      title="Load in Tester"
                    >
                      Use
                    </button>
                  </div>

                  {/* Quick Target Select */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleQuickApplyLibraryItem(preset.url, e.target.value, preset.label);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full text-[10px] font-semibold bg-[#FDFBF7] border border-[#E5E1DA] rounded-md p-1 text-[#6B705C] cursor-pointer"
                  >
                    <option value="" disabled>
                      Apply directly to...
                    </option>
                    <option value="hero">Hero Main Banner</option>
                    <option value="new-dish">+ New Menu Dish</option>
                    {menuItems.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
