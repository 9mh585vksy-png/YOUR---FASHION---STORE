import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Lock,
  LogOut,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Truck,
  User as UserIcon,
} from 'lucide-react';
import type {
  AddressLabel,
  CartItem,
  Coupon,
  CustomerAddress,
  DeliveryZone,
  NotificationItem,
  Order,
  PaymentMethodType,
  Product,
  ReturnRequest,
} from '../types/store';
import {
  calculateDeliveryQuote,
  calculateOrderTotals,
  validateCustomerAddress,
} from '../utils/commerceRules';
import { InteractiveDeliveryMap } from './InteractiveDeliveryMap';
import { LookbookArtwork } from './LookbookArtwork';

export const CheckoutAndCartView: React.FC<{
  cart: CartItem[];
  products: Product[];
  coupons: Coupon[];
  deliveryZones: DeliveryZone[];
  savedAddresses: CustomerAddress[];
  onUpdateCartQty: (productId: string, variantId: string, qty: number) => void;
  onRemoveCartItem: (productId: string, variantId: string) => void;
  onSaveAddress: (addr: Partial<CustomerAddress>) => Promise<CustomerAddress | null>;
  onOrderCreated: (order: Order) => void;
  onContinueShopping: () => void;
}> = ({
  cart,
  products,
  coupons,
  deliveryZones,
  savedAddresses,
  onUpdateCartQty,
  onRemoveCartItem,
  onSaveAddress,
  onOrderCreated,
  onContinueShopping,
}) => {
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  const [recipientName, setRecipientName] = useState(defaultAddr?.recipientName || 'Aarav Mehta');
  const [email, setEmail] = useState('bhattacharyadebargha14@gmail.com');
  const [phone, setPhone] = useState(defaultAddr?.phone || '9820112233');
  const [addressLabel, setAddressLabel] = useState<AddressLabel>(defaultAddr?.label || 'Home');
  const [houseNumber, setHouseNumber] = useState(defaultAddr?.houseNumber || 'Flat 1102, Sea Breeze Residency');
  const [street, setStreet] = useState(defaultAddr?.street || 'Carter Road');
  const [locality, setLocality] = useState(defaultAddr?.locality || 'Bandra West');
  const [landmark, setLandmark] = useState(defaultAddr?.landmark || 'Opposite Otters Club');
  const [city, setCity] = useState(defaultAddr?.city || 'Mumbai');
  const [stateName, setStateName] = useState(defaultAddr?.state || 'Maharashtra');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '400050');
  const [lat, setLat] = useState<number>(defaultAddr?.lat || 19.0607);
  const [lng, setLng] = useState<number>(defaultAddr?.lng || 72.8235);
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    defaultAddr?.deliveryInstructions || 'Call or share OTP at doorstep.'
  );

  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('express');
  const [couponInput, setCouponInput] = useState('ATELIER15');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('ATELIER15');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('razorpay_upi');
  const [simulateGatewayFailure, setSimulateGatewayFailure] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Hydrate cart items
  const detailedItems = cart
    .map((ci) => {
      const product = products.find((p) => p.id === ci.productId);
      const variant = product?.variants.find((v) => v.id === ci.variantId);
      if (!product || !variant) return null;
      return {
        ...ci,
        product,
        variant,
        unitPriceInr: product.price,
        gstPercent: product.gstPercent,
        lineTotalInr: product.price * ci.quantity,
      };
    })
    .filter(Boolean) as Array<{
    productId: string;
    variantId: string;
    quantity: number;
    product: Product;
    variant: ProductVariant;
    unitPriceInr: number;
    gstPercent: number;
    lineTotalInr: number;
  }>;

  const rawSubtotal = detailedItems.reduce((s, item) => s + item.lineTotalInr, 0);

  const deliveryQuote = calculateDeliveryQuote({
    postalCode,
    customerLat: lat,
    customerLng: lng,
    orderSubtotalInr: rawSubtotal,
    deliverySpeed,
    zones: deliveryZones,
  });

  const activeCoupon =
    coupons.find((c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase() && c.active) || null;

  const totals = calculateOrderTotals({
    items: detailedItems.map((i) => ({
      unitPriceInr: i.unitPriceInr,
      gstPercent: i.gstPercent,
      quantity: i.quantity,
    })),
    coupon: activeCoupon,
    deliveryFeeInr: deliveryQuote.appliedFeeInr,
  });

  function handleSelectSavedAddress(addr: CustomerAddress) {
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setAddressLabel(addr.label);
    setHouseNumber(addr.houseNumber);
    setStreet(addr.street);
    setLocality(addr.locality);
    setLandmark(addr.landmark);
    setCity(addr.city);
    setStateName(addr.state);
    setPostalCode(addr.postalCode);
    setLat(addr.lat);
    setLng(addr.lng);
    setDeliveryInstructions(addr.deliveryInstructions || '');
    setCheckoutError(null);
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutError(null);

    const candidateAddress: CustomerAddress = {
      id: `addr-checkout-${Date.now()}`,
      label: addressLabel,
      recipientName,
      phone,
      houseNumber,
      street,
      locality,
      landmark,
      city,
      state: stateName,
      postalCode,
      country: 'India',
      lat,
      lng,
      deliveryInstructions,
    };

    const addrValidation = validateCustomerAddress(candidateAddress);
    if (!addrValidation.valid) {
      setCheckoutError(addrValidation.errors.join(' '));
      return;
    }

    if (!deliveryQuote.serviceable) {
      setCheckoutError(deliveryQuote.reason || 'Address is outside our serviceable delivery zones.');
      return;
    }

    if (paymentMethod === 'cod' && !deliveryQuote.codEligible) {
      setCheckoutError(deliveryQuote.codIneligibleReason || 'Cash on Delivery is not eligible for this order.');
      return;
    }

    setPlacingOrder(true);
    try {
      let gatewayOrderId: string | undefined;
      let gatewayPaymentId: string | undefined;
      let gatewaySignature: string | undefined;

      // Online payment: 1. Create gateway order on server -> 2. Verify HMAC-SHA256 signature on server
      if (paymentMethod !== 'cod') {
        const createRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountInr: totals.totalAmountInr, currency: 'INR' }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || 'Could not initialize payment gateway.');
        }

        gatewayOrderId = createData.authorizedPaymentPayload.gatewayOrderId;
        gatewayPaymentId = createData.authorizedPaymentPayload.gatewayPaymentId;
        gatewaySignature = createData.authorizedPaymentPayload.signature;

        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gatewayOrderId,
            gatewayPaymentId,
            signature: gatewaySignature,
            simulateFailure: simulateGatewayFailure,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.verified) {
          throw new Error(verifyData.error || 'Online payment verification failed.');
        }
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: recipientName,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: candidateAddress,
          deliverySpeed,
          cartItems: cart,
          couponCode: totals.couponApplied ? activeCoupon?.code : undefined,
          paymentMethod,
          gatewayOrderId,
          gatewayPaymentId,
          gatewaySignature,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Could not place order.');
      }

      setConfirmedOrder(orderData);
      onOrderCreated(orderData);
    } catch (err: any) {
      setCheckoutError(err.message || 'Order placement failed.');
    } finally {
      setPlacingOrder(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-8 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Confirmed &amp; Verified</span>
              </p>
              <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
                Order #{confirmedOrder.orderNumber}
              </h1>
              <p className="text-xs text-stone-500">
                Assigned Delivery Partner: <strong>{confirmedOrder.assignedPartnerName}</strong> ({confirmedOrder.assignedPartnerPhone})
              </p>
            </div>

            <div className="text-right font-mono-tabular">
              <p className="text-xs text-stone-500">Doorstep Delivery OTP</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {confirmedOrder.deliveryOtp}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded bg-stone-50 dark:bg-stone-950 space-y-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">Delivery Destination</p>
              <p>{confirmedOrder.shippingAddress.recipientName} ({confirmedOrder.shippingAddress.phone})</p>
              <p>
                {confirmedOrder.shippingAddress.houseNumber}, {confirmedOrder.shippingAddress.street},{' '}
                {confirmedOrder.shippingAddress.locality}
              </p>
              <p>
                {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state}{' '}
                {confirmedOrder.shippingAddress.postalCode}
              </p>
              <p className="font-mono-tabular text-stone-500">
                GPS: {confirmedOrder.shippingAddress.lat.toFixed(4)}°N, {confirmedOrder.shippingAddress.lng.toFixed(4)}°E · {confirmedOrder.routeDistanceKm} km
              </p>
            </div>

            <div className="p-4 rounded bg-stone-50 dark:bg-stone-950 space-y-1 font-mono-tabular">
              <p className="font-sans font-semibold text-stone-900 dark:text-stone-100">Payment &amp; Tax Receipt</p>
              <p>Method: {confirmedOrder.paymentMethod.toUpperCase()}</p>
              <p>Status: {confirmedOrder.paymentStatus.toUpperCase()}</p>
              <p>Subtotal: ₹{confirmedOrder.subtotalInr.toLocaleString('en-IN')}</p>
              {confirmedOrder.discountInr > 0 && (
                <p className="text-emerald-700">Discount: -₹{confirmedOrder.discountInr.toLocaleString('en-IN')}</p>
              )}
              <p>GST (12%): ₹{confirmedOrder.gstTotalInr.toLocaleString('en-IN')}</p>
              <p>Shipping: ₹{confirmedOrder.deliveryFeeInr.toLocaleString('en-IN')}</p>
              <p className="text-sm font-bold pt-1 border-t border-stone-200 dark:border-stone-800">
                Total: ₹{confirmedOrder.totalAmountInr.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (detailedItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-sm text-stone-500">
          Add garments from the seasonal catalog to calculate GPS delivery routes and complete checkout.
        </p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="px-6 py-2.5 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md"
        >
          Browse Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
        Shopping Bag &amp; GPS-Verified Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Address, Interactive GPS Map, Delivery Speed, Payment */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          {/* Step 1: Saved Addresses & GPS Map Pin */}
          <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
                1. Delivery Location &amp; GPS Pin
              </h2>
              <div className="flex items-center gap-1.5">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                      postalCode === addr.postalCode && locality === addr.locality
                        ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                        : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {addr.label}: {addr.locality} ({addr.postalCode})
                  </button>
                ))}
              </div>
            </div>

            <InteractiveDeliveryMap
              mode="checkout_pin"
              customerLat={lat}
              customerLng={lng}
              customerLabel={`${addressLabel}: ${locality}`}
              routeDistanceKm={deliveryQuote.distanceKm}
              etaMinutes={deliveryQuote.etaMinutes}
              onSelectCoordinates={(newLat, newLng, resolved) => {
                setLat(newLat);
                setLng(newLng);
                if (resolved) {
                  if (resolved.street) setStreet(resolved.street);
                  if (resolved.locality) setLocality(resolved.locality);
                  if (resolved.city) setCity(resolved.city);
                  if (resolved.state) setStateName(resolved.state);
                  if (resolved.postalCode) setPostalCode(resolved.postalCode);
                }
              }}
            />

            {/* Full Address Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium mb-1">Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Mobile Number (10 digits) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email for Receipt *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">House / Flat / Floor No. *</label>
                <input
                  type="text"
                  required
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Street / Road Name *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Locality / Area *</label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Landmark</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">6-Digit PIN Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  aria-label="Checkout 6-digit PIN code"
                  className="w-full px-3 py-2 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500">Address Type:</span>
                {(['Home', 'Work', 'Other'] as AddressLabel[]).map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setAddressLabel(lbl)}
                    className={`px-2.5 py-1 rounded border text-xs ${
                      addressLabel === lbl
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  onSaveAddress({
                    label: addressLabel,
                    recipientName,
                    phone,
                    houseNumber,
                    street,
                    locality,
                    landmark,
                    city,
                    state: stateName,
                    postalCode,
                    country: 'India',
                    lat,
                    lng,
                    deliveryInstructions,
                  })
                }
                className="text-xs underline text-stone-600 dark:text-stone-400 hover:text-stone-900"
              >
                Save to Address Book
              </button>
            </div>
          </div>

          {/* Step 2: Delivery Speed & Payment Method */}
          <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-5">
            <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              2. Shipping Option &amp; Server-Verified Payment
            </h2>

            {/* Delivery Speed Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliverySpeed('standard')}
                className={`p-3.5 rounded-md border text-left transition-colors ${
                  deliverySpeed === 'standard'
                    ? 'border-stone-900 bg-stone-50 dark:border-stone-100 dark:bg-stone-800'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Standard Insured Delivery</span>
                  <span className="font-mono-tabular">
                    {deliveryQuote.standardFeeInr === 0 ? 'FREE' : `₹${deliveryQuote.standardFeeInr}`}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {deliveryQuote.zone?.estimatedDaysStandard || '2–4 Business Days'} · Free above ₹4,999
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySpeed('express')}
                className={`p-3.5 rounded-md border text-left transition-colors ${
                  deliverySpeed === 'express'
                    ? 'border-stone-900 bg-stone-50 dark:border-stone-100 dark:bg-stone-800'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Express Live GPS Courier</span>
                  <span className="font-mono-tabular">₹{deliveryQuote.expressFeeInr}</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {deliveryQuote.estimatedArrivalText} · Route: {deliveryQuote.distanceKm} km
                </p>
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay_upi')}
                className={`p-3 rounded-md border text-left text-xs ${
                  paymentMethod === 'razorpay_upi'
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <p className="font-semibold">Razorpay Instant UPI</p>
                <p className="text-[11px] opacity-80 mt-0.5">GPay, PhonePe, BHIM (Server Verified)</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay_card')}
                className={`p-3 rounded-md border text-left text-xs ${
                  paymentMethod === 'razorpay_card'
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <p className="font-semibold">Credit / Debit Card</p>
                <p className="text-[11px] opacity-80 mt-0.5">Zero raw card storage · Tokenized</p>
              </button>

              <button
                type="button"
                disabled={!deliveryQuote.codEligible}
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-md border text-left text-xs disabled:opacity-40 ${
                  paymentMethod === 'cod'
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <p className="font-semibold">Cash on Delivery (COD)</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {deliveryQuote.codEligible ? 'Pay via Cash/UPI at doorstep' : 'Ineligible for current zone/total'}
                </p>
              </button>
            </div>

            {paymentMethod !== 'cod' && (
              <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={simulateGatewayFailure}
                  onChange={(e) => setSimulateGatewayFailure(e.target.checked)}
                />
                <span>Simulate bank payment decline (for testing payment failure handling)</span>
              </label>
            )}

            {checkoutError && (
              <div
                role="alert"
                className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200"
              >
                {checkoutError}
              </div>
            )}

            <button
              type="submit"
              disabled={placingOrder || !deliveryQuote.serviceable}
              className="w-full py-3.5 px-6 text-sm font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {placingOrder
                  ? 'Verifying & Placing Order...'
                  : `Complete Order — ₹${totals.totalAmountInr.toLocaleString('en-IN')}`}
              </span>
            </button>
          </div>
        </form>

        {/* Right 5 Columns: Cart Items, Coupon Code, and Price Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-4">
            <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Order Summary ({detailedItems.reduce((s, i) => s + i.quantity, 0)} Items)
            </h2>

            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {detailedItems.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-3 flex items-center gap-3">
                  <div className="w-16 h-16 rounded overflow-hidden border border-stone-200 dark:border-stone-800 shrink-0">
                    <LookbookArtwork
                      styleType={item.product.artworkStyle}
                      imageUrl={item.product.images?.[0] || item.product.imageUrl}
                      primaryHex={item.variant.colorHex}
                      secondaryHex={item.product.secondaryColorHex}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Size {item.variant.size} · {item.variant.colorName}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateCartQty(item.productId, item.variantId, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="px-2 py-0.5 text-xs border border-stone-300 dark:border-stone-700 rounded"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono-tabular">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCartQty(
                            item.productId,
                            item.variantId,
                            Math.min(item.variant.stock, item.quantity + 1)
                          )
                        }
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="px-2 py-0.5 text-xs border border-stone-300 dark:border-stone-700 rounded"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveCartItem(item.productId, item.variantId)}
                        aria-label={`Remove ${item.product.name} from bag`}
                        className="text-stone-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular text-xs font-semibold">
                    ₹{item.lineTotalInr.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Bar */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Promo code (ATELIER15, WELCOME500, FREESHIP)"
                  aria-label="Coupon code"
                  className="flex-1 px-3 py-1.5 text-xs font-mono-tabular uppercase border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
                <button
                  type="button"
                  onClick={() => setAppliedCouponCode(couponInput.trim())}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md whitespace-nowrap shrink-0"
                >
                  Apply Coupon
                </button>
              </div>
              {totals.couponMessage && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{totals.couponMessage}</p>
              )}
            </div>

            {/* Itemized Totals Breakdown */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2 text-xs font-mono-tabular">
              <div className="flex justify-between">
                <span className="font-sans text-stone-600 dark:text-stone-400">Bag Subtotal</span>
                <span>₹{totals.subtotalInr.toLocaleString('en-IN')}</span>
              </div>
              {totals.discountInr > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span className="font-sans">Coupon Discount ({activeCoupon?.code})</span>
                  <span>-₹{totals.discountInr.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-sans text-stone-600 dark:text-stone-400">GST (12% Apparel Tax)</span>
                <span>₹{totals.gstTotalInr.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-stone-600 dark:text-stone-400">
                  Delivery ({deliveryQuote.distanceKm} km · {deliverySpeed})
                </span>
                <span>
                  {totals.effectiveDeliveryFeeInr === 0
                    ? 'FREE'
                    : `₹${totals.effectiveDeliveryFeeInr.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between text-base font-bold text-stone-900 dark:text-stone-100">
                <span className="font-sans">Final Total Payable</span>
                <span>₹{totals.totalAmountInr.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OrderTrackingView: React.FC<{
  orders: Order[];
  selectedOrderId: string;
  onSelectOrderId: (id: string) => void;
  wsConnected: boolean;
}> = ({ orders, selectedOrderId, onSelectOrderId, wsConnected }) => {
  const [streamingGps, setStreamingGps] = useState(false);
  const [gpsPingFeedback, setGpsPingFeedback] = useState<string | null>(null);

  const activeOrder =
    orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || orders[0];

  React.useEffect(() => {
    if (!streamingGps || !activeOrder) return;
    const timer = setInterval(() => {
      triggerPartnerGpsStep();
    }, 2500);
    return () => clearInterval(timer);
  }, [streamingGps, activeOrder?.id, activeOrder?.latestAuthorizedLocation?.lat, activeOrder?.latestAuthorizedLocation?.lng]);

  if (!activeOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-stone-500">No orders found to track.</p>
      </div>
    );
  }

  const latestLoc = activeOrder.latestAuthorizedLocation;

  async function triggerPartnerGpsStep() {
    if (!activeOrder) return;
    const curLat = latestLoc?.lat ?? activeOrder.dispatchHub.lat;
    const curLng = latestLoc?.lng ?? activeOrder.dispatchHub.lng;
    const destLat = activeOrder.shippingAddress.lat;
    const destLng = activeOrder.shippingAddress.lng;

    // Step 28% closer toward customer destination along the route (or reset to hub if already at doorstep)
    const dLat = destLat - curLat;
    const dLng = destLng - curLng;
    const distDeg = Math.hypot(dLat, dLng);

    const nextLat =
      distDeg < 0.003
        ? Number((activeOrder.dispatchHub.lat + (destLat - activeOrder.dispatchHub.lat) * 0.25).toFixed(5))
        : Number((curLat + dLat * 0.3).toFixed(5));
    const nextLng =
      distDeg < 0.003
        ? Number((activeOrder.dispatchHub.lng + (destLng - activeOrder.dispatchHub.lng) * 0.25).toFixed(5))
        : Number((curLng + dLng * 0.3).toFixed(5));

    try {
      const res = await fetch('/api/delivery/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          partnerId: activeOrder.assignedPartnerId || 'partner-vikram-01',
          lat: nextLat,
          lng: nextLng,
          source: 'partner_checkpoint',
        }),
      });
      const data = await res.json();
      if (res.ok && data.order?.latestAuthorizedLocation) {
        const loc = data.order.latestAuthorizedLocation;
        setGpsPingFeedback(
          `Live GPS Updated: (${nextLat}°N, ${nextLng}°E) · ${loc.remainingDistanceKm} km to doorstep · ETA ~${loc.estimatedArrivalMinutes} mins`
        );
      } else {
        setGpsPingFeedback(data.error || 'Partner shift GPS sharing is paused.');
        setStreamingGps(false);
      }
    } catch {
      setGpsPingFeedback('Network error requesting GPS telemetry.');
    }
  }

  const LIFECYCLE_STEPS = [
    { key: 'placed', label: '1. Order Placed' },
    { key: 'payment_confirmed', label: '2. Payment Confirmed' },
    { key: 'processing', label: '3. Processing' },
    { key: 'packed', label: '4. Packed' },
    { key: 'ready_for_dispatch', label: '5. Ready for Dispatch' },
    { key: 'shipped', label: '6. Picked Up' },
    { key: 'out_for_delivery', label: '7. Out for Delivery' },
    { key: 'delivered', label: '8. Delivered' },
  ];

  const completedKeys = new Set(activeOrder.statusHistory.map((h) => h.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Live GPS Order Telemetry</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              {wsConnected ? 'Real-Time WebSocket Connected' : 'Syncing State'}
            </span>
          </div>
          <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            Tracking Order #{activeOrder.orderNumber}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={triggerPartnerGpsStep}
            className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 transition-opacity"
          >
            Ping Courier Live GPS Now
          </button>

          <button
            type="button"
            onClick={() => setStreamingGps((s) => !s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              streamingGps
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200'
            }`}
          >
            {streamingGps ? 'Live GPS Stream: ACTIVE (Stop)' : 'Start Live GPS Stream'}
          </button>

          <label className="text-xs text-stone-500">Order:</label>
          <select
            value={activeOrder.id}
            onChange={(e) => onSelectOrderId(e.target.value)}
            aria-label="Select order to track"
            className="px-3 py-1.5 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} — {o.status.toUpperCase()} (₹{o.totalAmountInr.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {gpsPingFeedback && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-900 dark:text-emerald-200"
        >
          {gpsPingFeedback}
        </div>
      )}

      {/* Live Map + Telemetry Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <InteractiveDeliveryMap
            mode="live_tracking"
            customerLat={activeOrder.shippingAddress.lat}
            customerLng={activeOrder.shippingAddress.lng}
            customerLabel={`${activeOrder.shippingAddress.locality} (${activeOrder.shippingAddress.postalCode})`}
            partnerLat={latestLoc?.lat ?? null}
            partnerLng={latestLoc?.lng ?? null}
            partnerName={activeOrder.assignedPartnerName}
            lastUpdatedTimestamp={latestLoc?.timestamp ?? null}
            routeDistanceKm={latestLoc ? latestLoc.remainingDistanceKm : activeOrder.routeDistanceKm}
            etaMinutes={latestLoc ? latestLoc.estimatedArrivalMinutes : activeOrder.estimatedEtaMinutes}
          />

          {/* 8-Step Lifecycle Progress Grid */}
          <div className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3">
            <h2 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Order Lifecycle Progress
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LIFECYCLE_STEPS.map((step) => {
                const isDone = completedKeys.has(step.key as any) || activeOrder.status === 'delivered';
                const isCurrent = activeOrder.status === step.key;
                return (
                  <div
                    key={step.key}
                    className={`p-2.5 rounded border text-xs ${
                      isCurrent
                        ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 font-semibold'
                        : isDone
                        ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-stone-200 dark:border-stone-800 text-stone-400'
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Partner Status, OTP, and Timestamped Audit Timeline */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <p className="text-stone-500">Current Order Status</p>
                <p className="text-base font-semibold text-stone-900 dark:text-stone-100 uppercase">
                  {activeOrder.status.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="text-right font-mono-tabular">
                <p className="text-stone-500">Doorstep OTP</p>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {activeOrder.deliveryOtp}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                Assigned Partner: {activeOrder.assignedPartnerName}
              </p>
              <p className="text-stone-500 font-mono-tabular">{activeOrder.assignedPartnerPhone}</p>
              {latestLoc ? (
                <p className="text-emerald-700 dark:text-emerald-400 font-mono-tabular">
                  Authorized GPS: ({latestLoc.lat.toFixed(4)}, {latestLoc.lng.toFixed(4)}) ·{' '}
                  {latestLoc.remainingDistanceKm} km remaining · ETA ~{latestLoc.estimatedArrivalMinutes} mins
                </p>
              ) : (
                <p className="text-stone-500">
                  Live GPS location is shared only when the delivery partner is on an active delivery shift. Showing latest verified status timestamp.
                </p>
              )}
            </div>
          </div>

          {/* Timestamped Status History */}
          <div className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3">
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Verified Status &amp; GPS Timeline
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {[...activeOrder.statusHistory].reverse().map((entry, idx) => (
                <div key={idx} className="text-xs border-b border-stone-100 dark:border-stone-800 pb-2 last:border-0">
                  <div className="flex items-center justify-between font-medium text-stone-900 dark:text-stone-100">
                    <span>{entry.label}</span>
                    <span className="font-mono-tabular text-[11px] text-stone-500">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 mt-0.5">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyAccountView: React.FC<{
  firebaseUser: { uid: string; displayName: string | null; email: string | null; role?: 'customer' | 'admin' } | null;
  orders: Order[];
  savedAddresses: CustomerAddress[];
  notifications: NotificationItem[];
  returnsList: ReturnRequest[];
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onOpenAuthModal?: (tab: 'customer' | 'admin') => void;
  onTrackOrder: (orderId: string) => void;
  onRequestReturn: (payload: { orderId: string; orderNumber: string; type: 'return' | 'exchange'; reason: string }) => Promise<void>;
}> = ({
  firebaseUser,
  orders,
  savedAddresses,
  notifications,
  returnsList,
  onSignInGoogle,
  onSignOutGoogle,
  onOpenAuthModal,
  onTrackOrder,
  onRequestReturn,
}) => {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [returnReason, setReturnReason] = useState('');
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(orders[0]?.orderNumber || '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            My Atelier Account &amp; Sign-In
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {firebaseUser
              ? `Signed in as ${firebaseUser.displayName || firebaseUser.email} (${(firebaseUser.role || 'customer').toUpperCase()})`
              : 'Guest Preview Mode — Sign in below as a Customer or Administrator'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAuthModal?.('customer')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Customer Login</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAuthModal?.('admin')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-md"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>

          {firebaseUser ? (
            <button
              type="button"
              onClick={onSignOutGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md"
            >
              <span>Google Sign-In</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Order History & Receipts */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Order History &amp; Tax Invoices ({orders.length})
          </h2>

          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <span className="font-mono-tabular text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {order.orderNumber}
                    </span>
                    <span className="mx-2 text-stone-400">·</span>
                    <span className="text-xs text-stone-600 dark:text-stone-400 uppercase">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="mx-2 text-stone-400">·</span>
                    <span className="text-xs font-mono-tabular">
                      OTP: <strong>{order.deliveryOtp}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono-tabular text-sm font-bold">
                      ₹{order.totalAmountInr.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onTrackOrder(order.id)}
                      className="px-3 py-1 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded"
                    >
                      Live GPS Track
                    </button>
                  </div>
                </div>

                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                  {order.items.map((item, i) => (
                    <p key={i}>
                      {item.quantity}× {item.productName} (Size {item.size}, {item.colorName}) —{' '}
                      <span className="font-mono-tabular">₹{item.lineTotalInr.toLocaleString('en-IN')}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Returns & Size Exchanges */}
          <div className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Request a 14-Day Return or Size Exchange
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!returnReason.trim()) return;
                await onRequestReturn({
                  orderId: selectedReturnOrder,
                  orderNumber: selectedReturnOrder,
                  type: 'exchange',
                  reason: returnReason,
                });
                setReturnReason('');
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <select
                value={selectedReturnOrder}
                onChange={(e) => setSelectedReturnOrder(e.target.value)}
                aria-label="Select order for return or exchange"
                className="px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.orderNumber}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Reason (e.g., Exchange Size M for Size L)"
                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
              />
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded"
              >
                Submit Request
              </button>
            </form>
            {returnsList.length > 0 && (
              <div className="pt-2 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                {returnsList.map((r) => (
                  <p key={r.id}>
                    {r.orderNumber}: {r.reason} — <strong>{r.status.toUpperCase()}</strong>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Saved Addresses & Notification Preferences */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Saved GPS Addresses ({savedAddresses.length})
            </h2>
            <div className="space-y-3 text-xs">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="p-3 rounded border border-stone-200 dark:border-stone-800 space-y-0.5">
                  <p className="font-semibold">
                    {addr.label} — {addr.recipientName}
                  </p>
                  <p className="text-stone-600 dark:text-stone-400">
                    {addr.houseNumber}, {addr.street}, {addr.locality}, {addr.city} {addr.postalCode}
                  </p>
                  <p className="font-mono-tabular text-[11px] text-stone-500">
                    GPS: {addr.lat.toFixed(4)}°N, {addr.lng.toFixed(4)}°E
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3 text-xs">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Notification Channels
            </h2>
            <label className="flex items-center justify-between">
              <span>Email Order &amp; Tax Invoices</span>
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between">
              <span>SMS Dispatch &amp; OTP Alerts</span>
              <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between">
              <span>WhatsApp Live Delivery Updates</span>
              <input type="checkbox" checked={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.checked)} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
