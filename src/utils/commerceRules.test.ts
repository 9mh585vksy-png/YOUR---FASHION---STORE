import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeliveryEtaMinutes,
  calculateDeliveryQuote,
  calculateOrderTotals,
  calculateRouteDistanceKm,
  generatePaymentSignature,
  isDuplicatePaymentCallback,
  validateAndDeductVariantStock,
  validateCoordinates,
  validateCustomerAddress,
  verifyPaymentSignature,
} from './commerceRules';
import type { Coupon, DeliveryZone, ProductVariant } from '../types/store';

const TEST_ZONES: DeliveryZone[] = [
  {
    id: 'zone-metro-mumbai',
    name: 'Mumbai Metro Same-Day GPS Zone',
    code: 'MUM-METRO',
    pinPrefixes: ['400'],
    baseFeeInr: 60,
    perKmRateInr: 4,
    expressSurchargeInr: 120,
    freeDeliveryMinOrderInr: 4999,
    codAllowed: true,
    maxCodOrderInr: 25000,
    estimatedDaysStandard: '1–2 Days (Live GPS Tracked)',
    estimatedHoursExpress: 'Same-Day 2–4 Hours (Live GPS)',
    maxRadiusKm: 45,
  },
  {
    id: 'zone-tier1-ncr-blr',
    name: 'Metro Express Hub (Delhi NCR / Bengaluru)',
    code: 'TIER1-EXPRESS',
    pinPrefixes: ['110', '560'],
    baseFeeInr: 99,
    perKmRateInr: 2,
    expressSurchargeInr: 180,
    freeDeliveryMinOrderInr: 4999,
    codAllowed: true,
    maxCodOrderInr: 15000,
    estimatedDaysStandard: '2–3 Days',
    estimatedHoursExpress: 'Next-Day Air Express',
    maxRadiusKm: 2000,
  },
];

test('validateCoordinates enforces valid latitude and longitude ranges', () => {
  assert.equal(validateCoordinates(18.9281, 72.8328).valid, true);
  assert.equal(validateCoordinates(95, 72.8328).valid, false);
  assert.equal(validateCoordinates(18.9281, -195).valid, false);
  assert.equal(validateCoordinates(NaN, 72.8328).valid, false);
});

test('validateCustomerAddress catches missing fields, invalid PINs, and bad phone numbers', () => {
  const validAddr = validateCustomerAddress({
    recipientName: 'Aarav Mehta',
    phone: '9876543210',
    houseNumber: '402, Sea Breeze',
    street: 'Carter Road',
    locality: 'Bandra West',
    landmark: 'Near Joggers Park',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400050',
    country: 'India',
    lat: 19.0607,
    lng: 72.8235,
  });
  assert.equal(validAddr.valid, true);
  assert.equal(validAddr.errors.length, 0);

  const invalidAddr = validateCustomerAddress({
    recipientName: 'A',
    phone: '12345',
    houseNumber: '',
    street: 'Rd',
    locality: '',
    city: 'Mumbai',
    state: 'MH',
    postalCode: '00123',
    lat: 190,
    lng: 72,
  });
  assert.equal(invalidAddr.valid, false);
  assert.ok(invalidAddr.errors.length >= 4);
});

test('calculateRouteDistanceKm and calculateDeliveryEtaMinutes return realistic road distance and ETA', () => {
  // Kala Ghoda (18.9281, 72.8328) to Bandra West (19.0607, 72.8235)
  const distKm = calculateRouteDistanceKm(18.9281, 72.8328, 19.0607, 72.8235);
  assert.ok(distKm > 15 && distKm < 24, `Expected road distance between 15 and 24 km, got ${distKm}`);

  const stdEta = calculateDeliveryEtaMinutes(distKm, 'standard');
  const expEta = calculateDeliveryEtaMinutes(distKm, 'express');
  assert.ok(expEta < stdEta, 'Express ETA must be faster than standard ETA');
});

test('calculateDeliveryQuote handles free shipping threshold, COD cap, and unserviceable PINs', () => {
  // 1. Order below free delivery threshold (₹3,200 < ₹4,999)
  const quoteBelow = calculateDeliveryQuote({
    postalCode: '400050',
    customerLat: 19.0607,
    customerLng: 72.8235,
    orderSubtotalInr: 3200,
    deliverySpeed: 'standard',
    zones: TEST_ZONES,
  });
  assert.equal(quoteBelow.serviceable, true);
  assert.equal(quoteBelow.freeDeliveryApplied, false);
  assert.ok(quoteBelow.appliedFeeInr > 0);
  assert.equal(quoteBelow.codEligible, true);

  // 2. Order above free delivery threshold (₹6,500 >= ₹4,999)
  const quoteFree = calculateDeliveryQuote({
    postalCode: '400050',
    customerLat: 19.0607,
    customerLng: 72.8235,
    orderSubtotalInr: 6500,
    deliverySpeed: 'standard',
    zones: TEST_ZONES,
  });
  assert.equal(quoteFree.serviceable, true);
  assert.equal(quoteFree.freeDeliveryApplied, true);
  assert.equal(quoteFree.appliedFeeInr, 0);

  // 3. Order exceeding COD cap (₹30,000 > ₹25,000)
  const quoteHighValue = calculateDeliveryQuote({
    postalCode: '400050',
    customerLat: 19.0607,
    customerLng: 72.8235,
    orderSubtotalInr: 30000,
    deliverySpeed: 'standard',
    zones: TEST_ZONES,
  });
  assert.equal(quoteHighValue.codEligible, false);
  assert.ok(quoteHighValue.codIneligibleReason?.includes('capped'));

  // 4. Unserviceable PIN code (999001)
  const quoteUnserviceable = calculateDeliveryQuote({
    postalCode: '999001',
    customerLat: 28.6139,
    customerLng: 77.209,
    orderSubtotalInr: 5000,
    deliverySpeed: 'standard',
    zones: TEST_ZONES,
  });
  assert.equal(quoteUnserviceable.serviceable, false);
});

test('calculateOrderTotals applies coupons, caps discounts, and computes GST accurately', () => {
  const coupon15: Coupon = {
    code: 'ATELIER15',
    description: '15% off orders above ₹3,000 (up to ₹1,500)',
    discountType: 'percentage',
    value: 15,
    minOrderInr: 3000,
    maxDiscountInr: 1500,
    active: true,
  };

  const totals = calculateOrderTotals({
    items: [{ unitPriceInr: 4000, gstPercent: 12, quantity: 2 }], // Subtotal ₹8,000
    coupon: coupon15,
    deliveryFeeInr: 0,
  });

  assert.equal(totals.subtotalInr, 8000);
  assert.equal(totals.discountInr, 1200); // 15% of 8000 = 1200
  assert.equal(totals.gstTotalInr, Math.round(6800 * 0.12)); // 12% of 6800 = 816
  assert.equal(totals.totalAmountInr, 6800 + 816);
});

test('validateAndDeductVariantStock blocks out-of-stock purchases and decrements available stock', () => {
  const variants: ProductVariant[] = [
    { id: 'v-m-olive', sku: 'YFS-01-M', size: 'M', colorName: 'Stone Olive', colorHex: '#6B705C', stock: 2, lowStockThreshold: 3 },
    { id: 'v-l-olive', sku: 'YFS-01-L', size: 'L', colorName: 'Stone Olive', colorHex: '#6B705C', stock: 0, lowStockThreshold: 3 },
  ];

  const outOfStockAttempt = validateAndDeductVariantStock(variants, 'v-l-olive', 1);
  assert.equal(outOfStockAttempt.ok, false);
  assert.ok(outOfStockAttempt.error?.includes('out of stock'));

  const validAttempt = validateAndDeductVariantStock(variants, 'v-m-olive', 2);
  assert.equal(validAttempt.ok, true);
  assert.equal(validAttempt.updatedVariants.find((v) => v.id === 'v-m-olive')?.stock, 0);
});

test('verifyPaymentSignature and isDuplicatePaymentCallback enforce cryptographic security and idempotency', () => {
  const secret = 'test_razorpay_secret_key_9988';
  const orderId = 'order_Rzp98123';
  const paymentId = 'pay_Rzp77123';

  const sig = generatePaymentSignature(orderId, paymentId, secret);
  assert.equal(
    verifyPaymentSignature({ gatewayOrderId: orderId, gatewayPaymentId: paymentId, signature: sig, secret }),
    true
  );
  assert.equal(
    verifyPaymentSignature({ gatewayOrderId: orderId, gatewayPaymentId: paymentId, signature: 'forged_sig', secret }),
    false
  );

  const processed = new Set<string>();
  assert.equal(isDuplicatePaymentCallback(processed, paymentId), false);
  assert.equal(isDuplicatePaymentCallback(processed, paymentId), true);
});
