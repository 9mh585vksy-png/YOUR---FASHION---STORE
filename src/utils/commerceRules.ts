import crypto from 'node:crypto';
import type {
  Coupon,
  CustomerAddress,
  DeliveryCalculationResult,
  DeliveryZone,
  ProductVariant,
} from '../types/store';

export const DISPATCH_HUB = {
  name: 'YOUR FASHION STORE Flagship Atelier & Dispatch Hub',
  address: 'Plot 14, Kala Ghoda Design Precinct, Fort, Mumbai, Maharashtra 400001',
  lat: 18.9281,
  lng: 72.8328,
};

/**
 * Validates geographic coordinates.
 */
export function validateCoordinates(lat: unknown, lng: unknown): { valid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return { valid: false, error: 'Latitude and longitude must be valid numbers.' };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90 degrees.' };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180 degrees.' };
  }
  return { valid: true };
}

/**
 * Validates customer postal address fields and coordinates before checkout.
 */
export function validateCustomerAddress(addr: Partial<CustomerAddress>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!addr.recipientName || addr.recipientName.trim().length < 2) {
    errors.push('Recipient name is required (min 2 characters).');
  }
  if (!addr.phone || !/^[6-9]\d{9}$/.test(addr.phone.replace(/\s+/g, '').replace(/^\+91/, ''))) {
    errors.push('Valid 10-digit Indian mobile number is required.');
  }
  if (!addr.houseNumber || addr.houseNumber.trim().length < 1) {
    errors.push('House / Flat / Building number is required.');
  }
  if (!addr.street || addr.street.trim().length < 3) {
    errors.push('Street / Road name is required.');
  }
  if (!addr.locality || addr.locality.trim().length < 2) {
    errors.push('Locality / Area is required.');
  }
  if (!addr.city || addr.city.trim().length < 2) {
    errors.push('City is required.');
  }
  if (!addr.state || addr.state.trim().length < 2) {
    errors.push('State is required.');
  }
  if (!addr.postalCode || !/^[1-9][0-9]{5}$/.test(addr.postalCode.trim())) {
    errors.push('Valid 6-digit Indian PIN code is required.');
  }
  const coordCheck = validateCoordinates(addr.lat, addr.lng);
  if (!coordCheck.valid && coordCheck.error) {
    errors.push(coordCheck.error);
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates road-adjusted route distance in km between two GPS points using the Haversine formula + urban tortuosity factor (1.28x).
 */
export function calculateRouteDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const check1 = validateCoordinates(lat1, lng1);
  const check2 = validateCoordinates(lat2, lng2);
  if (!check1.valid || !check2.valid) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;
  // Apply road network tortuosity factor of 1.28 for realistic urban road routing
  const roadKm = straightLineKm * 1.28;
  return Math.max(0.5, Number(roadKm.toFixed(1)));
}

/**
 * Calculates traffic-aware ETA in minutes given distance in km and delivery speed.
 */
export function calculateDeliveryEtaMinutes(
  distanceKm: number,
  deliverySpeed: 'standard' | 'express' = 'standard',
  trafficFactor: number = 1.15
): number {
  if (distanceKm <= 0) return 15;
  // Urban courier average speed: 24 km/h; regional highway: 45 km/h
  const avgSpeedKmph = distanceKm <= 35 ? 24 : 45;
  const baseTravelMinutes = (distanceKm / avgSpeedKmph) * 60 * trafficFactor;
  const dispatchPrepMinutes = deliverySpeed === 'express' ? 20 : 45;
  return Math.max(15, Math.round(baseTravelMinutes + dispatchPrepMinutes));
}

/**
 * Determines delivery zone serviceability, shipping fees, and COD eligibility.
 */
export function calculateDeliveryQuote(params: {
  postalCode: string;
  customerLat: number;
  customerLng: number;
  orderSubtotalInr: number;
  deliverySpeed: 'standard' | 'express';
  zones: DeliveryZone[];
  hubLat?: number;
  hubLng?: number;
}): DeliveryCalculationResult {
  const cleanPin = (params.postalCode || '').trim();
  const hubLat = params.hubLat ?? DISPATCH_HUB.lat;
  const hubLng = params.hubLng ?? DISPATCH_HUB.lng;

  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return {
      serviceable: false,
      zone: null,
      distanceKm: 0,
      etaMinutes: 0,
      standardFeeInr: 0,
      expressFeeInr: 0,
      appliedFeeInr: 0,
      freeDeliveryApplied: false,
      freeDeliveryThresholdInr: 4999,
      amountNeededForFreeDeliveryInr: Math.max(0, 4999 - params.orderSubtotalInr),
      codEligible: false,
      codIneligibleReason: 'Enter a valid 6-digit PIN code to verify COD eligibility.',
      estimatedArrivalText: 'PIN code required',
      alternativeCourierAvailable: false,
      reason: 'Please enter a valid 6-digit Indian PIN code (e.g. 400001, 110001, 560001).',
    };
  }

  // Match zone by PIN prefix (longest prefix match first)
  let matchedZone: DeliveryZone | null = null;
  for (const zone of params.zones) {
    const matches = zone.pinPrefixes.some((prefix) => cleanPin.startsWith(prefix));
    if (matches) {
      matchedZone = zone;
      break;
    }
  }

  const distanceKm = calculateRouteDistanceKm(hubLat, hubLng, params.customerLat, params.customerLng);

  // Explicit unserviceable remote PIN prefixes (e.g. 799xxx, 999xxx)
  if (!matchedZone || cleanPin.startsWith('99') || cleanPin.startsWith('00')) {
    return {
      serviceable: false,
      zone: null,
      distanceKm,
      etaMinutes: 0,
      standardFeeInr: 0,
      expressFeeInr: 0,
      appliedFeeInr: 0,
      freeDeliveryApplied: false,
      freeDeliveryThresholdInr: 4999,
      amountNeededForFreeDeliveryInr: 0,
      codEligible: false,
      codIneligibleReason: 'PIN code is outside our serviceable delivery zones.',
      estimatedArrivalText: 'Unserviceable location',
      alternativeCourierAvailable: cleanPin.startsWith('79'),
      reason: cleanPin.startsWith('79')
        ? `Direct GPS courier is unavailable for PIN ${cleanPin}, though India Post Insured Air Parcel is available on request.`
        : `Sorry, PIN code ${cleanPin} is currently outside our supported delivery zones.`,
    };
  }

  const cappedDistanceForFee = Math.min(distanceKm, 60);
  const rawStandardFee = Math.round(matchedZone.baseFeeInr + cappedDistanceForFee * matchedZone.perKmRateInr);
  const rawExpressFee = rawStandardFee + matchedZone.expressSurchargeInr;

  const qualifiesForFreeStandard = params.orderSubtotalInr >= matchedZone.freeDeliveryMinOrderInr;
  const standardFeeInr = qualifiesForFreeStandard ? 0 : rawStandardFee;
  const expressFeeInr = qualifiesForFreeStandard ? matchedZone.expressSurchargeInr : rawExpressFee;

  const appliedFeeInr = params.deliverySpeed === 'express' ? expressFeeInr : standardFeeInr;
  const freeDeliveryApplied = qualifiesForFreeStandard && params.deliverySpeed === 'standard';
  const etaMinutes = calculateDeliveryEtaMinutes(distanceKm, params.deliverySpeed);

  // Check COD eligibility
  let codEligible = matchedZone.codAllowed;
  let codIneligibleReason: string | undefined;

  if (!matchedZone.codAllowed) {
    codIneligibleReason = `Cash on Delivery is not supported in ${matchedZone.name}.`;
  } else if (params.orderSubtotalInr < 500) {
    codEligible = false;
    codIneligibleReason = 'Cash on Delivery requires a minimum order subtotal of ₹500.';
  } else if (params.orderSubtotalInr > matchedZone.maxCodOrderInr) {
    codEligible = false;
    codIneligibleReason = `Cash on Delivery is capped at ₹${matchedZone.maxCodOrderInr.toLocaleString('en-IN')} in ${matchedZone.name}. Please use UPI or Card.`;
  }

  const estimatedArrivalText =
    params.deliverySpeed === 'express'
      ? distanceKm <= 40
        ? `Same-Day GPS Express (~${etaMinutes} mins)`
        : matchedZone.estimatedHoursExpress
      : matchedZone.estimatedDaysStandard;

  return {
    serviceable: true,
    zone: matchedZone,
    distanceKm,
    etaMinutes,
    standardFeeInr,
    expressFeeInr,
    appliedFeeInr,
    freeDeliveryApplied,
    freeDeliveryThresholdInr: matchedZone.freeDeliveryMinOrderInr,
    amountNeededForFreeDeliveryInr: Math.max(0, matchedZone.freeDeliveryMinOrderInr - params.orderSubtotalInr),
    codEligible,
    codIneligibleReason,
    estimatedArrivalText,
    alternativeCourierAvailable: true,
  };
}

/**
 * Calculates cart subtotal, coupon discount, GST, shipping, and final payable amount in INR.
 */
export function calculateOrderTotals(params: {
  items: Array<{ unitPriceInr: number; gstPercent: number; quantity: number }>;
  coupon: Coupon | null;
  deliveryFeeInr: number;
}): {
  subtotalInr: number;
  discountInr: number;
  gstTotalInr: number;
  effectiveDeliveryFeeInr: number;
  totalAmountInr: number;
  couponApplied: boolean;
  couponMessage?: string;
} {
  const subtotalInr = params.items.reduce(
    (sum, item) => sum + Math.max(0, item.unitPriceInr) * Math.max(0, item.quantity),
    0
  );

  let discountInr = 0;
  let effectiveDeliveryFeeInr = Math.max(0, params.deliveryFeeInr);
  let couponApplied = false;
  let couponMessage: string | undefined;

  if (params.coupon && params.coupon.active) {
    if (subtotalInr < params.coupon.minOrderInr) {
      couponMessage = `Coupon ${params.coupon.code} requires a minimum subtotal of ₹${params.coupon.minOrderInr.toLocaleString('en-IN')}.`;
    } else {
      couponApplied = true;
      if (params.coupon.discountType === 'percentage') {
        const rawDiscount = Math.round((subtotalInr * params.coupon.value) / 100);
        discountInr = params.coupon.maxDiscountInr
          ? Math.min(rawDiscount, params.coupon.maxDiscountInr)
          : rawDiscount;
      } else if (params.coupon.discountType === 'flat') {
        discountInr = Math.min(subtotalInr, params.coupon.value);
      } else if (params.coupon.discountType === 'free_shipping') {
        effectiveDeliveryFeeInr = 0;
      }
      couponMessage = `Coupon ${params.coupon.code} applied.`;
    }
  }

  const discountedSubtotal = Math.max(0, subtotalInr - discountInr);

  // Calculate GST on discounted line items proportionally
  const discountRatio = subtotalInr > 0 ? discountedSubtotal / subtotalInr : 1;
  const gstTotalInr = Math.round(
    params.items.reduce((sum, item) => {
      const lineTaxable = item.unitPriceInr * item.quantity * discountRatio;
      return sum + (lineTaxable * item.gstPercent) / 100;
    }, 0)
  );

  const totalAmountInr = Math.max(0, discountedSubtotal + gstTotalInr + effectiveDeliveryFeeInr);

  return {
    subtotalInr,
    discountInr,
    gstTotalInr,
    effectiveDeliveryFeeInr,
    totalAmountInr,
    couponApplied,
    couponMessage,
  };
}

/**
 * Validates and reserves inventory stock for a specific size-color variant.
 */
export function validateAndDeductVariantStock(
  variants: ProductVariant[],
  variantId: string,
  requestedQty: number
): { ok: boolean; error?: string; updatedVariants: ProductVariant[] } {
  if (requestedQty <= 0 || !Number.isInteger(requestedQty)) {
    return { ok: false, error: 'Requested quantity must be a positive integer.', updatedVariants: variants };
  }

  const target = variants.find((v) => v.id === variantId);
  if (!target) {
    return { ok: false, error: 'Selected size/color variant does not exist.', updatedVariants: variants };
  }

  if (target.stock < requestedQty) {
    return {
      ok: false,
      error:
        target.stock === 0
          ? `Size ${target.size} (${target.colorName}) is currently out of stock.`
          : `Only ${target.stock} unit(s) left for Size ${target.size} (${target.colorName}).`,
      updatedVariants: variants,
    };
  }

  const updatedVariants = variants.map((v) =>
    v.id === variantId ? { ...v, stock: v.stock - requestedQty } : v
  );

  return { ok: true, updatedVariants };
}

/**
 * Generates an HMAC-SHA256 signature for Razorpay-compatible server-side payment verification.
 */
export function generatePaymentSignature(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest('hex');
}

/**
 * Verifies a payment signature on the server using constant-time comparison.
 */
export function verifyPaymentSignature(params: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!params.gatewayOrderId || !params.gatewayPaymentId || !params.signature || !params.secret) {
    return false;
  }
  const expected = generatePaymentSignature(
    params.gatewayOrderId,
    params.gatewayPaymentId,
    params.secret
  );
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(params.signature, 'utf8');
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Guards against duplicate payment gateway callbacks / webhook replays.
 */
export function isDuplicatePaymentCallback(
  processedPaymentIds: Set<string>,
  gatewayPaymentId: string
): boolean {
  if (processedPaymentIds.has(gatewayPaymentId)) {
    return true;
  }
  processedPaymentIds.add(gatewayPaymentId);
  return false;
}
