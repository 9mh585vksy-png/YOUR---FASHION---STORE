export type UserRole = 'customer' | 'admin' | 'delivery_partner';

export type ClothingCategory =
  | "Men's Wear"
  | "Women's Wear"
  | 'Unisex Clothing'
  | 'T-Shirts'
  | 'Shirts'
  | 'Hoodies'
  | 'Jeans'
  | 'Trousers'
  | 'Jackets'
  | 'Ethnic Wear'
  | 'Accessories';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'One Size';

export interface ProductVariant {
  id: string;
  sku: string;
  size: ClothingSize;
  colorName: string;
  colorHex: string;
  stock: number;
  lowStockThreshold: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category: ClothingCategory;
  genderGroup: "Men's Wear" | "Women's Wear" | 'Unisex Clothing';
  fabric: string;
  careInstructions: string;
  fitNote: string;
  price: number; // Final selling price in INR (₹)
  originalPrice: number; // MRP in INR (₹)
  discountPercent: number;
  gstPercent: number;
  published: boolean;
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
  seasonalOfferTag?: string;
  artworkStyle: 'linen_overshirt' | 'silk_trench' | 'heavy_hoodie' | 'bandhgala' | 'selvedge_denim' | 'pleated_trouser' | 'cashmere_tee' | 'leather_tote' | 'kurta_set' | 'field_jacket' | 'poplin_shirt' | 'merino_scarf';
  imageUrl?: string;
  images?: string[];
  primaryColorHex: string;
  secondaryColorHex: string;
  variants: ProductVariant[];
  reviews: ProductReview[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface CustomerAddress {
  id: string;
  label: AddressLabel;
  recipientName: string;
  phone: string;
  houseNumber: string;
  street: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  code: string;
  pinPrefixes: string[];
  baseFeeInr: number;
  perKmRateInr: number;
  expressSurchargeInr: number;
  freeDeliveryMinOrderInr: number;
  codAllowed: boolean;
  maxCodOrderInr: number;
  estimatedDaysStandard: string;
  estimatedHoursExpress: string;
  maxRadiusKm: number;
}

export interface DeliveryCalculationResult {
  serviceable: boolean;
  zone: DeliveryZone | null;
  distanceKm: number;
  etaMinutes: number;
  standardFeeInr: number;
  expressFeeInr: number;
  appliedFeeInr: number;
  freeDeliveryApplied: boolean;
  freeDeliveryThresholdInr: number;
  amountNeededForFreeDeliveryInr: number;
  codEligible: boolean;
  codIneligibleReason?: string;
  estimatedArrivalText: string;
  alternativeCourierAvailable: boolean;
  reason?: string;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'flat' | 'free_shipping';
  value: number;
  minOrderInr: number;
  maxDiscountInr?: number;
  active: boolean;
}

export type OrderLifecycleStatus =
  | 'placed'
  | 'payment_confirmed'
  | 'processing'
  | 'packed'
  | 'ready_for_dispatch'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

export interface OrderStatusHistoryEntry {
  status: OrderLifecycleStatus;
  label: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'system';
  note: string;
}

export interface AuthorizedLocationUpdate {
  orderId: string;
  partnerId: string;
  partnerName: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  headingDegrees?: number;
  speedKmph?: number;
  timestamp: string;
  source: 'browser_gps' | 'partner_checkpoint';
  remainingDistanceKm: number;
  estimatedArrivalMinutes: number;
}

export interface OrderItemSnapshot {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  size: ClothingSize;
  colorName: string;
  colorHex: string;
  unitPriceInr: number;
  gstPercent: number;
  quantity: number;
  lineTotalInr: number;
  artworkStyle: Product['artworkStyle'];
  imageUrl?: string;
}

export type PaymentMethodType = 'razorpay_upi' | 'razorpay_card' | 'cod';
export type PaymentStatus = 'pending' | 'verified' | 'cod_pending' | 'cod_collected' | 'failed' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: CustomerAddress;
  deliverySpeed: 'standard' | 'express';
  items: OrderItemSnapshot[];
  subtotalInr: number;
  discountInr: number;
  couponCode?: string;
  gstTotalInr: number;
  deliveryFeeInr: number;
  totalAmountInr: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignatureVerified: boolean;
  status: OrderLifecycleStatus;
  statusHistory: OrderStatusHistoryEntry[];
  assignedPartnerId: string;
  assignedPartnerName: string;
  assignedPartnerPhone: string;
  dispatchHub: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  routeDistanceKm: number;
  estimatedEtaMinutes: number;
  estimatedDeliveryWindow: string;
  deliveryOtp: string;
  proofOfDelivery?: {
    verifiedVia: 'otp' | 'customer_confirmation';
    verifiedAt: string;
    verifiedByPartnerId: string;
    codCashCollectedInr?: number;
    photoNote?: string;
  };
  deliveryFailureReason?: string;
  deliveryAttempts: number;
  latestAuthorizedLocation: AuthorizedLocationUpdate | null;
  locationHistory: AuthorizedLocationUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: 'Electric Two-Wheeler' | 'Express Van';
  zoneCode: string;
  shiftActive: boolean;
  gpsConsentGranted: boolean;
  activeOrderIds: string[];
  completedDeliveriesCount: number;
  failedDeliveriesCount: number;
  rating: number;
  currentLocation: {
    lat: number;
    lng: number;
    updatedAt: string;
  } | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  orderId?: string;
  orderNumber?: string;
  channel: 'in_app' | 'email' | 'sms' | 'whatsapp';
  type: 'order_placed' | 'dispatched' | 'out_for_delivery' | 'nearby' | 'delivered' | 'delayed' | 'payment_failed' | 'refund' | 'otp';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  type: 'return' | 'exchange';
  reason: string;
  requestedSize?: ClothingSize;
  status: 'requested' | 'approved' | 'pickup_scheduled' | 'completed';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderNumber?: string;
  topic: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'system';
  action: string;
  targetId: string;
  details: string;
}
