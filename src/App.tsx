/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Heart,
  MapPin,
  Moon,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Truck,
} from 'lucide-react';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_COUPONS,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_RETURNS,
  INITIAL_SAVED_ADDRESSES,
  INITIAL_SUPPORT_TICKETS,
} from './data/seedCatalog';
import type {
  AuditLogEntry,
  CartItem,
  Coupon,
  CustomerAddress,
  DeliveryPartner,
  DeliveryZone,
  NotificationItem,
  Order,
  OrderLifecycleStatus,
  Product,
  ProductVariant,
  ReturnRequest,
  SupportTicket,
} from './types/store';
import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  syncAuthenticatedUserToFirestore,
  syncProductMetadataToFirestore,
} from './lib/firebase';
import {
  AboutAndSupportView,
  HomeView,
  ProductDetailModal,
  ShopView,
} from './components/StorefrontViews';
import {
  CheckoutAndCartView,
  MyAccountView,
  OrderTrackingView,
} from './components/CheckoutAndTrackingViews';
import {
  AdminDashboardView,
  DeliveryPartnerDashboardView,
} from './components/AdminAndPartnerViews';
import { AuthLoginModal, type ActiveSessionUser } from './components/AuthLoginModal';

export type ActivePage =
  | 'home'
  | 'shop'
  | 'checkout'
  | 'tracking'
  | 'account'
  | 'about'
  | 'support'
  | 'admin'
  | 'partner';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  // Store State (initialized with deterministic seed data and synced with Express + WebSocket server)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(INITIAL_DELIVERY_ZONES);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>(INITIAL_DELIVERY_PARTNERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [returnsList, setReturnsList] = useState<ReturnRequest[]>(INITIAL_RETURNS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>(INITIAL_SAVED_ADDRESSES);

  // Shopping Bag, Wishlist, and Navigation Filters
  const [cart, setCart] = useState<CartItem[]>([
    {
      productId: 'prod-linen-overshirt',
      variantId: 'var-101-m-olive',
      quantity: 1,
    },
  ]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prod-silk-trench']);
  const [selectedShopCategory, setSelectedShopCategory] = useState<string>('All');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string>('ord-1042');
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Authenticated User State (supports both Firebase Google Auth & Customer/Admin Credentials)
  const [sessionUser, setSessionUser] = useState<ActiveSessionUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'admin'>('customer');

  function openLoginModal(tab: 'customer' | 'admin') {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // Listen for GMP Quota Event
  useEffect(() => {
    const onQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  // Listen for Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isAdminEmail = user.email?.toLowerCase() === 'bhattacharyadebargha14@gmail.com';
        setSessionUser({
          uid: user.uid,
          displayName: user.displayName || user.email || 'Atelier User',
          email: user.email || 'client@example.com',
          role: isAdminEmail ? 'admin' : 'customer',
          authMethod: 'firebase_google',
        });
        syncAuthenticatedUserToFirestore(user).catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  // Fetch initial state from backend & connect real-time WebSocket
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.products) setProducts(data.products);
        if (data.deliveryZones) setDeliveryZones(data.deliveryZones);
        if (data.coupons) setCoupons(data.coupons);
        if (data.deliveryPartners) setDeliveryPartners(data.deliveryPartners);
        if (data.orders) setOrders(data.orders);
        if (data.notifications) setNotifications(data.notifications);
        if (data.returnsList) setReturnsList(data.returnsList);
        if (data.supportTickets) setSupportTickets(data.supportTickets);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.savedAddresses) setSavedAddresses(data.savedAddresses);
      })
      .catch(() => {});

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connectWs() {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWs, 4000);
        };
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'order:created') {
              const created = msg.payload as Order;
              setOrders((prev) => (prev.some((o) => o.id === created.id) ? prev : [created, ...prev]));
            } else if (msg.type === 'order:updated') {
              const updated = msg.payload as Order;
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            } else if (msg.type === 'location:updated') {
              const updatedOrder = msg.payload?.order as Order | undefined;
              if (updatedOrder) {
                setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
              }
            } else if (msg.type === 'product:updated') {
              setProducts(msg.payload as Product[]);
            } else if (msg.type === 'notification:created') {
              const notif = msg.payload as NotificationItem;
              setNotifications((prev) => (prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev]));
            } else if (msg.type === 'audit:created') {
              const entry = msg.payload as AuditLogEntry;
              setAuditLogs((prev) => (prev.some((a) => a.id === entry.id) ? prev : [entry, ...prev]));
            }
          } catch {
            // Ignore malformed socket message
          }
        };
      } catch {
        setWsConnected(false);
      }
    }

    connectWs();
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  // Handlers
  function handleToggleWishlist(productId: string) {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  function handleAddToCart(product: Product, variant: ProductVariant, quantity: number) {
    if (variant.stock <= 0) {
      triggerToast(`Size ${variant.size} is out of stock.`);
      return;
    }
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product.id && i.variantId === variant.id
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Math.min(variant.stock, next[existingIndex].quantity + quantity),
        };
        return next;
      }
      return [...prev, { productId: product.id, variantId: variant.id, quantity }];
    });
    triggerToast(`Added ${product.name} (Size ${variant.size}) to Shopping Bag.`);
  }

  function handleUpdateCartQty(productId: string, variantId: string, qty: number) {
    if (qty <= 0) {
      handleRemoveCartItem(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i
      )
    );
  }

  function handleRemoveCartItem(productId: string, variantId: string) {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  }

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Inject JSON-LD Schema.org Structured Data
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'YOUR FASHION STORE',
    description:
      'Luxury contemporary menswear, womenswear, and ethnic wear with real-time GPS delivery tracking.',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Cash on Delivery',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot 14, Kala Ghoda Design Precinct, Fort',
      addressLocality: 'Mumbai',
      addressRegion: 'MH',
      postalCode: '400001',
      addressCountry: 'IN',
    },
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />

        {/* Google Maps Platform Quota Notice (Only shown if gmp-quota-exceeded fires) */}
        {gmpQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs text-center sticky top-0 z-50">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-4 bg-white/95 dark:bg-stone-950/95 backdrop-blur border-b border-stone-200 dark:border-stone-800">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setActivePage('home');
            }}
            className="font-serif-display text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap shrink-0"
          >
            YOUR FASHION STORE
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300"
          >
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                setActivePage('home');
              }}
              className={`hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'home' ? 'text-stone-900 dark:text-white underline underline-offset-4' : ''
              }`}
            >
              Home
            </a>
            <a
              href="#shop"
              onClick={(e) => {
                e.preventDefault();
                setActivePage('shop');
              }}
              className={`hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'shop' ? 'text-stone-900 dark:text-white underline underline-offset-4' : ''
              }`}
            >
              Shop Catalog
            </a>
            <a
              href="#tracking"
              onClick={(e) => {
                e.preventDefault();
                setActivePage('tracking');
              }}
              className={`hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'tracking' ? 'text-stone-900 dark:text-white underline underline-offset-4' : ''
              }`}
            >
              Track Order
            </a>
            <a
              href="#account"
              onClick={(e) => {
                e.preventDefault();
                setActivePage('account');
              }}
              className={`hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'account' ? 'text-stone-900 dark:text-white underline underline-offset-4' : ''
              }`}
            >
              My Account
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                setActivePage('about');
              }}
              className={`hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'about' ? 'text-stone-900 dark:text-white underline underline-offset-4' : ''
              }`}
            >
              About Atelier
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setActivePage('checkout')}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 font-mono-tabular"
            >
              Shopping Bag ({totalBagCount})
            </button>
          </div>
        </header>

        {/* Secondary Workspace Toolbar (Role Switcher, Search Suggestions, Notifications, Theme) */}
        <div className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Role / Portal Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-stone-500 whitespace-nowrap shrink-0">Workspace Mode:</span>
            <button
              type="button"
              onClick={() => setActivePage('home')}
              className={`px-2.5 py-1 rounded font-medium whitespace-nowrap shrink-0 ${
                !['admin', 'partner'].includes(activePage)
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              Customer Storefront
            </button>
            <button
              type="button"
              onClick={() => setActivePage('admin')}
              className={`px-2.5 py-1 rounded font-medium whitespace-nowrap shrink-0 ${
                activePage === 'admin'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              Admin Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActivePage('partner')}
              className={`px-2.5 py-1 rounded font-medium whitespace-nowrap shrink-0 ${
                activePage === 'partner'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              Delivery Partner Portal
            </button>
            <button
              type="button"
              onClick={() => setActivePage('support')}
              className={`px-2.5 py-1 rounded font-medium whitespace-nowrap shrink-0 ${
                activePage === 'support'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              Contact &amp; Support
            </button>
          </div>

          {/* Right Utilities: Customer/Admin Login, Search, Notifications, Dark Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {sessionUser ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {sessionUser.role === 'admin' ? 'ADMIN' : 'CUSTOMER'}: {sessionUser.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => openLoginModal(sessionUser.role === 'admin' ? 'customer' : 'admin')}
                  className="underline text-[11px] text-stone-700 dark:text-stone-300 ml-1"
                >
                  Switch
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (sessionUser.authMethod === 'firebase_google') {
                      await signOut(auth).catch(() => {});
                    }
                    setSessionUser(null);
                    triggerToast('Signed out.');
                  }}
                  className="underline text-[11px] text-rose-700 dark:text-rose-300 ml-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openLoginModal('customer')}
                  className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 whitespace-nowrap shrink-0"
                >
                  Customer Login
                </button>
                <button
                  type="button"
                  onClick={() => openLoginModal('admin')}
                  className="px-2.5 py-1 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium hover:opacity-90 whitespace-nowrap shrink-0"
                >
                  Admin Login
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActivePage('shop');
              }}
              className="relative"
            >
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  if (activePage !== 'shop') setActivePage('shop');
                }}
                placeholder="Search linen, trench, hoodie..."
                aria-label="Global product search"
                className="pl-8 pr-3 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 w-44 sm:w-52"
              />
            </form>

            <button
              type="button"
              onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
              aria-label={`Notifications (${notifications.length})`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 font-mono-tabular whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts ({notifications.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Notifications Dropdown Panel */}
        {showNotificationsDrawer && (
          <div className="border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 px-6 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Real-Time Order &amp; GPS Notifications</span>
              <button
                type="button"
                onClick={() => setShowNotificationsDrawer(false)}
                className="text-xs underline"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{n.title}</span>
                    <span className="font-mono-tabular text-[10px] text-stone-500 uppercase">
                      {n.channel}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium shadow-lg"
          >
            {toastMessage}
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1">
          {activePage === 'home' && (
            <HomeView
              products={products}
              wishlistIds={wishlistIds}
              deliveryZones={deliveryZones}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onOpenProductDetail={(p) => setActiveModalProduct(p)}
              onNavigateShopCategory={(cat) => {
                setSelectedShopCategory(cat);
                setActivePage('shop');
              }}
              onOpenTracking={() => setActivePage('tracking')}
            />
          )}

          {activePage === 'shop' && (
            <ShopView
              products={products}
              wishlistIds={wishlistIds}
              deliveryZones={deliveryZones}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onOpenProductDetail={(p) => setActiveModalProduct(p)}
              onNavigateShopCategory={(cat) => setSelectedShopCategory(cat)}
              selectedCategory={selectedShopCategory}
              onSelectCategory={setSelectedShopCategory}
              searchQuery={globalSearchQuery}
              onSearchChange={setGlobalSearchQuery}
            />
          )}

          {activePage === 'checkout' && (
            <CheckoutAndCartView
              cart={cart}
              products={products}
              coupons={coupons}
              deliveryZones={deliveryZones}
              savedAddresses={savedAddresses}
              onUpdateCartQty={handleUpdateCartQty}
              onRemoveCartItem={handleRemoveCartItem}
              onSaveAddress={async (addr) => {
                const res = await fetch('/api/addresses', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(addr),
                });
                if (res.ok) {
                  const created = await res.json();
                  setSavedAddresses((prev) => [created, ...prev]);
                  triggerToast('Saved address to address book.');
                  return created;
                }
                return null;
              }}
              onOrderCreated={(newOrder) => {
                setOrders((prev) => (prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]));
                setSelectedTrackingOrderId(newOrder.id);
                setCart([]);
                triggerToast(`Order ${newOrder.orderNumber} placed!`);
              }}
              onContinueShopping={() => setActivePage('shop')}
            />
          )}

          {activePage === 'tracking' && (
            <OrderTrackingView
              orders={orders}
              selectedOrderId={selectedTrackingOrderId}
              onSelectOrderId={setSelectedTrackingOrderId}
              wsConnected={wsConnected}
            />
          )}

          {activePage === 'account' && (
            <MyAccountView
              firebaseUser={sessionUser}
              orders={orders}
              savedAddresses={savedAddresses}
              notifications={notifications}
              returnsList={returnsList}
              onOpenAuthModal={(tab) => openLoginModal(tab)}
              onSignInGoogle={async () => {
                try {
                  await signInWithPopup(auth, googleProvider);
                  triggerToast('Signed in with Google.');
                } catch (err: any) {
                  openLoginModal('customer');
                }
              }}
              onSignOutGoogle={async () => {
                if (sessionUser?.authMethod === 'firebase_google') {
                  await signOut(auth).catch(() => {});
                }
                setSessionUser(null);
                triggerToast('Signed out.');
              }}
              onTrackOrder={(orderId) => {
                setSelectedTrackingOrderId(orderId);
                setActivePage('tracking');
              }}
              onRequestReturn={async (payload) => {
                const res = await fetch('/api/returns', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  const created = await res.json();
                  setReturnsList((prev) => [created, ...prev]);
                  triggerToast('Return / exchange request submitted.');
                }
              }}
            />
          )}

          {(activePage === 'about' || activePage === 'support') && (
            <AboutAndSupportView
              mode={activePage}
              supportTickets={supportTickets}
              onSubmitTicket={async (ticket) => {
                const res = await fetch('/api/support', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(ticket),
                });
                if (res.ok) {
                  const created = await res.json();
                  setSupportTickets((prev) => [created, ...prev]);
                  triggerToast('Support request logged.');
                }
              }}
            />
          )}

          {activePage === 'admin' && (
            <AdminDashboardView
              products={products}
              orders={orders}
              deliveryPartners={deliveryPartners}
              deliveryZones={deliveryZones}
              auditLogs={auditLogs}
              currentUser={sessionUser}
              onOpenAdminLogin={() => openLoginModal('admin')}
              onCreateProduct={async (payload) => {
                const res = await fetch('/api/products', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  const created = await res.json();
                  setProducts((prev) => (prev.some((p) => p.id === created.id) ? prev : [created, ...prev]));
                  syncProductMetadataToFirestore(created).catch(() => {});
                  triggerToast(`Published "${created.name}" with ${created.images?.length || 0} picture(s)`);
                }
              }}
              onUpdateProduct={async (productId, updates) => {
                const res = await fetch(`/api/products/${productId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                  syncProductMetadataToFirestore(updated).catch(() => {});
                  triggerToast(`Updated "${updated.name}"`);
                }
              }}
              onDeleteProduct={async (productId) => {
                const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
                if (res.ok) {
                  setProducts((prev) => prev.filter((p) => p.id !== productId));
                  triggerToast('Product deleted.');
                }
              }}
              onUpdateOrderStatus={async (orderId, payload) => {
                const res = await fetch(`/api/orders/${orderId}/status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                  triggerToast(`Updated order ${updated.orderNumber}`);
                }
              }}
              onUpdateZone={async (zoneId, updates) => {
                const res = await fetch(`/api/zones/${zoneId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setDeliveryZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
                }
              }}
            />
          )}

          {activePage === 'partner' && (
            <DeliveryPartnerDashboardView
              partners={deliveryPartners}
              orders={orders}
              onTogglePartnerShiftAndConsent={async (partnerId, updates) => {
                const res = await fetch(`/api/partners/${partnerId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setDeliveryPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }
              }}
              onBroadcastAuthorizedGps={async (payload) => {
                const res = await fetch('/api/delivery/location', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.error || 'Failed to transmit GPS coordinates.');
                }
                if (data.order) {
                  setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
                }
              }}
              onCompleteDeliveryWithOtp={async (orderId, payload) => {
                const res = await fetch(`/api/orders/${orderId}/complete-delivery`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.error || 'Could not complete delivery.');
                }
                setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
              }}
              onReportDeliveryFailure={async (orderId, reason, partnerName) => {
                const res = await fetch(`/api/orders/${orderId}/status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: 'failed',
                    actorName: partnerName,
                    actorRole: 'delivery_partner',
                    note: reason,
                  }),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                }
              }}
            />
          )}
        </main>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={activeModalProduct}
          deliveryZones={deliveryZones}
          isWishlisted={activeModalProduct ? wishlistIds.includes(activeModalProduct.id) : false}
          onClose={() => setActiveModalProduct(null)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onSubmitReview={async (productId, review) => {
            const res = await fetch(`/api/products/${productId}/reviews`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(review),
            });
            if (res.ok) {
              const createdReview = await res.json();
              setProducts((prev) =>
                prev.map((p) =>
                  p.id === productId ? { ...p, reviews: [createdReview, ...p.reviews] } : p
                )
              );
              setActiveModalProduct((prev) =>
                prev && prev.id === productId
                  ? { ...prev, reviews: [createdReview, ...prev.reviews] }
                  : prev
              );
              triggerToast('Review published!');
            }
          }}
        />

        {/* Dual-Role Customer & Admin Login Modal */}
        <AuthLoginModal
          isOpen={authModalOpen}
          initialTab={authModalTab}
          currentUser={sessionUser}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={(user, redirectToAdmin) => {
            setSessionUser(user);
            if (redirectToAdmin) {
              setActivePage('admin');
              triggerToast(`Signed in as Administrator (${user.displayName}).`);
            } else {
              triggerToast(`Welcome back, ${user.displayName}!`);
            }
          }}
          onFirebaseGoogleLogin={async (targetRole) => {
            const cred = await signInWithPopup(auth, googleProvider);
            const u = cred.user;
            setSessionUser({
              uid: u.uid,
              displayName: u.displayName || u.email || 'Atelier User',
              email: u.email || 'client@example.com',
              role: targetRole,
              authMethod: 'firebase_google',
            });
            if (targetRole === 'admin') {
              setActivePage('admin');
            }
            triggerToast(`Signed in via Google (${targetRole.toUpperCase()}).`);
          }}
          onLogout={async () => {
            if (sessionUser?.authMethod === 'firebase_google') {
              await signOut(auth).catch(() => {});
            }
            setSessionUser(null);
            setAuthModalOpen(false);
            triggerToast('Signed out.');
          }}
        />

        {/* Quiet Editorial Footer */}
        <footer className="border-t border-stone-200 dark:border-stone-800 py-8 px-6 text-xs text-stone-500">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-serif-display font-bold text-stone-900 dark:text-stone-100">
                YOUR FASHION STORE
              </span>{' '}
              · Plot 14, Kala Ghoda Design Precinct, Mumbai 400001 · All prices in Indian Rupees (₹)
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => setActivePage('about')} className="hover:underline">
                Privacy &amp; Terms
              </button>
              <button type="button" onClick={() => setActivePage('support')} className="hover:underline">
                Shipping &amp; Returns
              </button>
              <button type="button" onClick={() => setActivePage('tracking')} className="hover:underline">
                Live Order Tracking
              </button>
              <button type="button" onClick={() => setActivePage('admin')} className="hover:underline">
                Admin Console
              </button>
              <button type="button" onClick={() => setActivePage('partner')} className="hover:underline">
                Delivery Partner App
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
