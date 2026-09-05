import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Key, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  correctPassword: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  correctPassword,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validPassword = correctPassword || 'admin';

    if (password.trim() === validPassword.trim()) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
        onLoginSuccess();
      }, 400);
    } else {
      setError('Incorrect password. Please verify and try again.');
    }
  };

  const handleClose = () => {
    setError(null);
    setPassword('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="admin-login-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: 'easeInOut' } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#2D241E]/80 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
        >
          <motion.div
            key="admin-login-dialog"
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 350 } }}
            exit={{
              opacity: 0,
              scale: 0.88,
              y: -15,
              transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
            }}
            className="relative w-full max-w-md bg-[#FDFBF7] rounded-3xl border-2 border-[#E5E1DA] shadow-2xl overflow-hidden text-[#2D241E]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#3F2E23] via-[#4A372C] to-[#2D241E] text-[#FFE8D6] px-6 py-6 border-b border-[#523F33]">
              <button
                id="close-admin-login-btn"
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#FFE8D6] flex items-center justify-center transition-all cursor-pointer focus:outline-none"
                aria-label="Close login dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[#CB997E] text-white flex items-center justify-center mb-3 shadow-md">
                <Lock className="w-6 h-6" />
              </div>

              <h3 id="admin-login-title" className="font-serif text-2xl font-black text-white">
                Admin Authentication
              </h3>
              <p className="text-xs text-[#FFE8D6]/80 mt-1">
                Restricted portal for The Metro's Diner management.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Access granted! Opening Admin Control Panel...</span>
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3F2E23] mb-1.5">
                  Manager Username
                </label>
                <input
                  id="admin-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-4 py-3 text-sm bg-white border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-[#CB997E] focus:ring-2 focus:ring-[#CB997E]/20 text-[#2D241E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3F2E23] mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter admin password"
                    required
                    autoFocus
                    className="w-full px-4 py-3 pr-11 text-sm bg-white border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-[#CB997E] focus:ring-2 focus:ring-[#CB997E]/20 text-[#2D241E]"
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
              </div>

              <div className="p-3 bg-[#FFE8D6]/60 rounded-xl border border-[#E5E1DA] text-[11px] text-[#6B705C] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#CB997E] flex-shrink-0" />
                <span>
                  Default password is <span className="font-bold text-[#3F2E23]">admin</span>. You can change this password at any time inside the Admin Settings.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-1/2 py-3 px-4 rounded-xl border border-[#E5E1DA] text-xs font-bold text-[#6B705C] hover:bg-[#FFE8D6]/40 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="admin-login-submit-btn"
                  type="submit"
                  className="w-1/2 inline-flex items-center justify-center gap-2 bg-[#3F2E23] hover:bg-[#2D241E] active:scale-95 text-[#FFE8D6] font-bold text-sm py-3 px-4 rounded-xl shadow-md cursor-pointer transition-all"
                >
                  <Key className="w-4 h-4 text-[#CB997E]" />
                  <span>Log In</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
