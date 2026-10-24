import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Lock, LogIn, ShieldCheck, User as UserIcon, X } from 'lucide-react';

export interface ActiveSessionUser {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  authMethod: 'firebase_google' | 'credentials';
}

interface AuthLoginModalProps {
  isOpen: boolean;
  initialTab?: 'customer' | 'admin';
  currentUser: ActiveSessionUser | null;
  onClose: () => void;
  onLoginSuccess: (user: ActiveSessionUser, redirectToAdmin?: boolean) => void;
  onFirebaseGoogleLogin: (targetRole: 'customer' | 'admin') => Promise<void>;
  onLogout: () => void;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  initialTab = 'customer',
  currentUser,
  onClose,
  onLoginSuccess,
  onFirebaseGoogleLogin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>(initialTab);
  const [customerMode, setCustomerMode] = useState<'signin' | 'register'>('signin');

  // Customer form state
  const [custName, setCustName] = useState('Aarav Mehta');
  const [custEmail, setCustEmail] = useState('aarav.mehta@example.com');
  const [custPhone, setCustPhone] = useState('9820112233');
  const [custPassword, setCustPassword] = useState('atelier2026');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('bhattacharyadebargha14@gmail.com');
  const [adminPasscode, setAdminPasscode] = useState('ATELIER-ADMIN-2026');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  React.useEffect(() => {
    setActiveTab(initialTab);
    setErrorMsg(null);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!custEmail.trim() || !custEmail.includes('@')) {
      setErrorMsg('Please enter a valid customer email address.');
      return;
    }
    if (custPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    const displayName =
      customerMode === 'register'
        ? custName.trim() || 'Atelier Customer'
        : custEmail.toLowerCase().includes('aarav')
        ? 'Aarav Mehta'
        : custName.trim() || custEmail.split('@')[0];

    onLoginSuccess(
      {
        uid: `cust-${custEmail.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        displayName,
        email: custEmail.trim(),
        phone: custPhone.trim() || '9820112233',
        role: 'customer',
        authMethod: 'credentials',
      },
      false
    );
    onClose();
  }

  function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setErrorMsg('Please enter a valid administrator email address.');
      return;
    }
    if (
      adminPasscode.trim() !== 'ATELIER-ADMIN-2026' &&
      adminPasscode.trim() !== 'admin123' &&
      adminPasscode.trim().length < 6
    ) {
      setErrorMsg('Invalid Admin Security Passcode. Use ATELIER-ADMIN-2026.');
      return;
    }

    onLoginSuccess(
      {
        uid: `admin-${adminEmail.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        displayName:
          adminEmail.toLowerCase() === 'bhattacharyadebargha14@gmail.com'
            ? 'Debargha Bhattacharya (Atelier Admin)'
            : 'Atelier Administrator',
        email: adminEmail.trim(),
        role: 'admin',
        authMethod: 'credentials',
      },
      true
    );
    onClose();
  }

  async function triggerGooglePopup(role: 'customer' | 'admin') {
    setErrorMsg(null);
    setLoadingGoogle(true);
    try {
      await onFirebaseGoogleLogin(role);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Google popup sign-in was blocked or cancelled by the browser. Use the instant credentials sign-in below.'
      );
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <div className="w-full max-w-lg rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
              YOUR FASHION STORE · Identity &amp; Access
            </p>
            <h2
              id="auth-modal-heading"
              className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100"
            >
              Sign In to Your Account
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in modal"
            className="p-1.5 rounded-md text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Tabs: Customer vs Admin */}
        <div className="grid grid-cols-2 border-b border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-950">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customer');
              setErrorMsg(null);
            }}
            className={`py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'customer'
                ? 'border-stone-900 text-stone-900 bg-white dark:border-stone-100 dark:text-stone-100 dark:bg-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Customer Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
            }}
            className={`py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'admin'
                ? 'border-stone-900 text-stone-900 bg-white dark:border-stone-100 dark:text-stone-100 dark:bg-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Console Login</span>
          </button>
        </div>

        {/* Active Session Banner if already signed in */}
        {currentUser && (
          <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Currently signed in as <strong>{currentUser.displayName}</strong> ({currentUser.role.toUpperCase()})
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 text-stone-800 dark:text-stone-200 font-medium"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200"
            >
              {errorMsg}
            </div>
          )}

          {activeTab === 'customer' ? (
            <div className="space-y-4">
              {/* Sub-mode switcher: Sign In vs Create Customer Account */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 dark:text-stone-400">
                  Access saved GPS addresses, live order tracking, and GST invoices.
                </span>
                <button
                  type="button"
                  onClick={() => setCustomerMode((m) => (m === 'signin' ? 'register' : 'signin'))}
                  className="underline font-medium text-stone-900 dark:text-stone-100 whitespace-nowrap ml-2"
                >
                  {customerMode === 'signin' ? 'Create New Account' : 'Existing Customer Sign In'}
                </button>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-3">
                {customerMode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        aria-label="Customer full name"
                        className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        aria-label="Customer mobile number"
                        className="w-full px-3 py-2 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1">Customer Email Address *</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="customer@example.com"
                    aria-label="Customer email address"
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    placeholder="Enter password"
                    aria-label="Customer password"
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {customerMode === 'signin'
                      ? 'Sign In as Customer'
                      : 'Create Customer Account & Sign In'}
                  </span>
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-stone-200 dark:border-stone-800" />
                <span className="shrink mx-3 text-[11px] text-stone-400 uppercase">Or Firebase Auth</span>
                <div className="grow border-t border-stone-200 dark:border-stone-800" />
              </div>

              <button
                type="button"
                disabled={loadingGoogle}
                onClick={() => triggerGooglePopup('customer')}
                className="w-full py-2.5 px-4 text-xs font-medium border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md flex items-center justify-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>
                  {loadingGoogle ? 'Opening Google Sign-In...' : 'Continue with Google (Customer)'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 space-y-1">
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  Atelier Admin &amp; Dispatch Command Access
                </p>
                <p>
                  Sign in with your administrator email and passcode (<code className="font-mono-tabular">ATELIER-ADMIN-2026</code>) or via verified Google Admin account (<code className="font-mono-tabular">bhattacharyadebargha14@gmail.com</code>).
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Administrator Email *</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    aria-label="Administrator email"
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Admin Security Passcode *</label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      aria-label="Admin security passcode"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sign In as Admin &amp; Open Command Center</span>
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-stone-200 dark:border-stone-800" />
                <span className="shrink mx-3 text-[11px] text-stone-400 uppercase">Or Firebase Admin Auth</span>
                <div className="grow border-t border-stone-200 dark:border-stone-800" />
              </div>

              <button
                type="button"
                disabled={loadingGoogle}
                onClick={() => triggerGooglePopup('admin')}
                className="w-full py-2.5 px-4 text-xs font-medium border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {loadingGoogle ? 'Verifying Google Admin...' : 'Continue with Google (Admin)'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
