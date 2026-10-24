import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Eye,
  Heart,
  MapPin,
  Ruler,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from 'lucide-react';
import type {
  ClothingCategory,
  ClothingSize,
  DeliveryZone,
  Product,
  ProductVariant,
  SupportTicket,
} from '../types/store';
import { ALL_CATEGORIES } from '../data/seedCatalog';
import { calculateDeliveryQuote } from '../utils/commerceRules';
import { LookbookArtwork } from './LookbookArtwork';

interface StorefrontProps {
  products: Product[];
  wishlistIds: string[];
  deliveryZones: DeliveryZone[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onOpenProductDetail: (product: Product) => void;
  onNavigateShopCategory: (category: string) => void;
}

export const ProductCard: React.FC<{
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onQuickAdd: (product: Product, variant: ProductVariant) => void;
  onOpenDetail: (product: Product) => void;
}> = ({ product, isWishlisted, onToggleWishlist, onQuickAdd, onOpenDetail }) => {
  const defaultVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <article className="group flex flex-col border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden bg-white dark:bg-stone-900 transition-transform duration-150 hover:-translate-y-0.5">
      {/* 70% Image Aspect Container */}
      <div className="relative aspect-[4/3] w-full bg-[#F5F2EB] dark:bg-[#1C1B19] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="w-full h-full block text-left focus:outline-none"
          aria-label={`View details for ${product.name}`}
        >
          <LookbookArtwork
            styleType={product.artworkStyle}
            imageUrl={product.images?.[0] || product.imageUrl}
            primaryHex={defaultVariant?.colorHex || product.primaryColorHex}
            secondaryHex={product.secondaryColorHex}
            title={product.name}
            subtitle={product.category}
          />
        </button>

        {/* Quiet 1-line text tag top-left (Zero-Pill Discipline) */}
        <div className="absolute top-3 left-3 text-[11px] font-medium tracking-wide text-stone-700 dark:text-stone-300 bg-white/90 dark:bg-stone-900/90 px-2 py-0.5">
          {totalStock === 0
            ? 'Out of Stock'
            : product.seasonalOfferTag || (product.newArrival ? 'New Arrival' : product.bestseller ? 'Bestseller' : 'In Stock')}
        </div>

        {/* Wishlist & Quick View Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white/90 dark:bg-stone-900/90 text-stone-800 dark:text-stone-200 hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            aria-label={`Quick view ${product.name}`}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white/90 dark:bg-stone-900/90 text-stone-800 dark:text-stone-200 hover:bg-white transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contiguous Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Clean Unboxed Metadata with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span>{product.genderGroup}</span>
            <span aria-hidden="true">·</span>
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{product.variants.length} Sizes</span>
          </div>

          <h3 className="mt-1 text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug">
            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="text-left hover:underline focus:outline-none"
            >
              {product.name}
            </button>
          </h3>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 font-mono-tabular">
            <span className="text-[15px] font-semibold text-stone-900 dark:text-stone-100">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-xs text-stone-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  -{product.discountPercent}%
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!defaultVariant || defaultVariant.stock === 0}
            onClick={() => defaultVariant && onQuickAdd(product, defaultVariant)}
            className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap shrink-0"
          >
            {defaultVariant && defaultVariant.stock > 0 ? `Add (${defaultVariant.size})` : 'Sold Out'}
          </button>
        </div>
      </div>
    </article>
  );
};

export const HomeView: React.FC<
  StorefrontProps & { onOpenTracking: () => void }
> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onOpenProductDetail,
  onNavigateShopCategory,
  onOpenTracking,
}) => {
  const featuredProducts = products.filter((p) => p.published && p.featured).slice(0, 6);

  return (
    <div className="space-y-16 pb-12">
      {/* Section 1: Storefront Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-stone-200 dark:border-stone-800 bg-[#F9F6F0] dark:bg-stone-950">
        <div className="lg:col-span-6 p-8 md:p-12 lg:p-16 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
              <span>Autumn / Winter 2026</span>
              <span aria-hidden="true">·</span>
              <span>Mumbai Flagship Atelier</span>
              <span aria-hidden="true">·</span>
              <span>Live GPS Courier</span>
            </div>

            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-stone-900 dark:text-stone-100 leading-[1.08]">
              Architectural Tailoring, Delivered with Live GPS Precision.
            </h1>

            <p className="text-base text-stone-600 dark:text-stone-300 max-w-xl leading-relaxed">
              Explore Belgian flax linen overshirts, Mulberry silk-wool outerwear, and handloom ceremonial silhouettes. Enjoy same-day GPS-tracked atelier dispatch across Mumbai and express national delivery.
            </p>
          </div>

          <div className="pt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigateShopCategory('All')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenTracking}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-md hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors whitespace-nowrap shrink-0"
              >
                <MapPin className="w-4 h-4" />
                <span>Track Live Order #YFS-2026-1042</span>
              </button>
            </div>

            {/* Quantitative Proof Strip */}
            <div className="pt-6 border-t border-stone-200/80 dark:border-stone-800 grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-mono-tabular text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Free ≥ ₹4,999
                </p>
                <p className="text-stone-500">Insured GPS Shipping</p>
              </div>
              <div>
                <p className="font-mono-tabular text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Code: ATELIER15
                </p>
                <p className="text-stone-500">15% Off Orders ≥ ₹3,000</p>
              </div>
              <div>
                <p className="font-mono-tabular text-sm font-semibold text-stone-900 dark:text-stone-100">
                  OTP Verified
                </p>
                <p className="text-stone-500">Doorstep Proof of Delivery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 min-h-[380px] lg:min-h-[540px]">
          <LookbookArtwork
            styleType="hero_campaign"
            title="YOUR FASHION STORE Autumn/Winter 2026 Campaign"
            className="w-full h-full"
          />
        </div>
      </section>

      {/* Section 2: Featured Collection Grid (3-column desktop per 1_ecommerce_retail.md) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <p className="text-xs text-stone-500">01. Curated Seasonal Release</p>
            <h2 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
              Featured Atelier Collection
            </h2>
          </div>

          {/* Interactive Category Quick-Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {["Men's Wear", "Women's Wear", 'Unisex Clothing', 'Ethnic Wear', 'Accessories'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onNavigateShopCategory(cat)}
                className="px-3 py-1.5 text-xs font-medium border border-stone-200 dark:border-stone-800 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors whitespace-nowrap shrink-0"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onQuickAdd={(p, v) => onAddToCart(p, v, 1)}
              onOpenDetail={onOpenProductDetail}
            />
          ))}
        </div>
      </section>

      {/* Section 3: Craftsmanship, GPS Logistics & Seasonal Privileges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-6 md:p-10 bg-stone-50 dark:bg-stone-900/60 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-500">01. Natural Fibre Provenance</p>
            <h3 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              European Flax, Mulberry Silk &amp; GOTS Cotton
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Every garment is cut in small batches with full size-and-colour inventory traceability, transparent GST invoicing, and zero synthetic filler blends.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-500">02. Real-Time Route &amp; GPS Telemetry</p>
            <h3 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Pin-Exact Doorstep Routing
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Drop your exact location pin at checkout, calculate real road distance from our Kala Ghoda dispatch hub, and follow your courier live once out for delivery.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-500">03. Verified Checkout &amp; Privileges</p>
            <h3 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Server-Verified Payments &amp; Eligible COD
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Pay online via UPI or Card with cryptographic HMAC-SHA256 verification, or choose Cash on Delivery on eligible orders up to ₹25,000.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const ShopView: React.FC<
  StorefrontProps & {
    selectedCategory: string;
    onSelectCategory: (cat: string) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
  }
> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onOpenProductDetail,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');

  const publishedProducts = products.filter((p) => p.published);

  const filtered = publishedProducts
    .filter((p) => {
      if (selectedCategory !== 'All') {
        const matchesCat = p.category === selectedCategory || p.genderGroup === selectedCategory;
        if (!matchesCat) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.variants.some((v) => v.colorName.toLowerCase().includes(q));
        if (!matchText) return false;
      }
      if (selectedSize !== 'All') {
        const hasSize = p.variants.some((v) => v.size === selectedSize && (!inStockOnly || v.stock > 0));
        if (!hasSize) return false;
      }
      if (inStockOnly) {
        const total = p.variants.reduce((s, v) => s + v.stock, 0);
        if (total === 0) return false;
      }
      if (p.price > maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      return Number(b.featured) - Number(a.featured);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Category Filter Strip */}
      <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
              {selectedCategory === 'All' ? 'All Clothing & Accessories' : selectedCategory}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Showing <span className="font-mono-tabular font-semibold">{filtered.length}</span> of{' '}
              <span className="font-mono-tabular">{publishedProducts.length}</span> atelier pieces
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter by name, fabric, color, SKU..."
                aria-label="Filter catalog products"
                className="pl-9 pr-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 w-60"
              />
            </div>

            <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High (₹)</option>
                <option value="price_desc">Price: High to Low (₹)</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </label>
          </div>
        </div>

        {/* All 11 Requested Categories Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', ...ALL_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Facet Controls (Size, Max Price, In-Stock) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Size:
            </span>
            {['All', 'XS', 'S', 'M', 'L', 'XL', 'One Size'].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`px-2.5 py-1 rounded border text-xs transition-colors whitespace-nowrap shrink-0 ${
                  selectedSize === sz
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <span>Max Price:</span>
              <input
                type="range"
                min={2000}
                max={20000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="accent-stone-900 dark:accent-stone-200"
              />
              <span className="font-mono-tabular font-semibold">₹{maxPrice.toLocaleString('en-IN')}</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-700 dark:text-stone-300">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-stone-300"
              />
              <span>In-Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-center space-y-3">
          <p className="text-base font-medium text-stone-900 dark:text-stone-100">
            No garments match your current filter selection.
          </p>
          <p className="text-xs text-stone-500">
            Try resetting the price range, size filter, or search query.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('All');
              onSearchChange('');
              setSelectedSize('All');
              setMaxPrice(20000);
              setInStockOnly(false);
            }}
            className="px-4 py-2 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onQuickAdd={(p, v) => onAddToCart(p, v, 1)}
              onOpenDetail={onOpenProductDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductDetailModal: React.FC<{
  product: Product | null;
  deliveryZones: DeliveryZone[];
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product, variant: ProductVariant, qty: number) => void;
  onSubmitReview: (productId: string, review: { customerName: string; rating: number; title: string; comment: string }) => Promise<void>;
}> = ({
  product,
  deliveryZones,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onSubmitReview,
}) => {
  if (!product) return null;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    (product.variants.find((v) => v.stock > 0) || product.variants[0])?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [pinCode, setPinCode] = useState<string>('400050');
  const [showSizeChart, setShowSizeChart] = useState<boolean>(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const galleryImages = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && !list.includes(img)) list.push(img);
      }
    }
    if (product.imageUrl && !list.includes(product.imageUrl)) {
      list.unshift(product.imageUrl);
    }
    return list;
  }, [product.images, product.imageUrl]);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const pinQuote = calculateDeliveryQuote({
    postalCode: pinCode,
    customerLat: 19.0607,
    customerLng: 72.8235,
    orderSubtotalInr: product.price * quantity,
    deliverySpeed: 'standard',
    zones: deliveryZones,
  });

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await onSubmitReview(product!.id, {
        customerName: reviewName,
        rating: reviewRating,
        title: reviewTitle || 'Verified Purchase Review',
        comment: reviewComment,
      });
      setReviewName('');
      setReviewTitle('');
      setReviewComment('');
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>{product.genderGroup}</span>
            <span aria-hidden="true">/</span>
            <span>{product.category}</span>
            <span aria-hidden="true">/</span>
            <span className="font-mono-tabular">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contiguous Purchase Module (Sticky Gallery Left, Purchase Module Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8">
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
              <LookbookArtwork
                styleType={product.artworkStyle}
                imageUrl={selectedPhotoIndex >= 0 ? galleryImages[selectedPhotoIndex] : undefined}
                primaryHex={selectedVariant?.colorHex || product.primaryColorHex}
                secondaryHex={product.secondaryColorHex}
                title={product.name}
                subtitle={selectedVariant?.colorName}
              />
            </div>

            {galleryImages.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {galleryImages.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                      selectedPhotoIndex === idx
                        ? 'border-stone-900 dark:border-stone-100'
                        : 'border-stone-200 dark:border-stone-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex(-1)}
                  className={`px-3 h-16 rounded-md border text-[11px] font-medium shrink-0 transition-all ${
                    selectedPhotoIndex === -1
                      ? 'border-stone-900 dark:border-stone-100 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Studio Silhouette
                </button>
              </div>
            )}

            <div className="p-4 rounded-md bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                Fabric &amp; Provenance
              </p>
              <p className="text-stone-600 dark:text-stone-400">
                {product.fabric} · {product.careInstructions}
              </p>
              <p className="text-stone-500">Fit: {product.fitNote}</p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div>
              <h2 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
                {product.name}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{product.subtitle}</p>

              <div className="mt-4 flex items-baseline gap-3 font-mono-tabular">
                <span className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-stone-400 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Save {product.discountPercent}%
                    </span>
                  </>
                )}
                <span className="text-xs text-stone-500">
                  (Excl. {product.gstPercent}% GST calculated at checkout)
                </span>
              </div>
            </div>

            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {product.description}
            </p>

            {/* Variant Selector (Size + Color + Live Stock Status) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Select Size &amp; Colour Variant
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeChart(!showSizeChart)}
                  className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 underline hover:text-stone-900"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{showSizeChart ? 'Hide Size Chart' : 'Size Guide (cm/in)'}</span>
                </button>
              </div>

              {showSizeChart && (
                <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-md bg-stone-50 dark:bg-stone-950 text-xs overflow-x-auto">
                  <table className="w-full text-left font-mono-tabular">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500">
                        <th className="py-1 pr-3">Size</th>
                        <th className="py-1 px-3">Chest (in)</th>
                        <th className="py-1 px-3">Shoulder (in)</th>
                        <th className="py-1 pl-3">Length (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="py-1">XS</td><td className="px-3">36"</td><td className="px-3">16.5"</td><td className="pl-3">27.0"</td></tr>
                      <tr><td className="py-1">S</td><td className="px-3">38"</td><td className="px-3">17.5"</td><td className="pl-3">28.0"</td></tr>
                      <tr><td className="py-1">M</td><td className="px-3">40"</td><td className="px-3">18.2"</td><td className="pl-3">28.8"</td></tr>
                      <tr><td className="py-1">L</td><td className="px-3">42"</td><td className="px-3">19.0"</td><td className="pl-3">29.5"</td></tr>
                      <tr><td className="py-1">XL</td><td className="px-3">44"</td><td className="px-3">19.8"</td><td className="pl-3">30.2"</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant?.id;
                  const outOfStock = variant.stock === 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`p-2.5 rounded-md border text-left transition-colors ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                          : outOfStock
                          ? 'border-stone-200 dark:border-stone-800 opacity-50'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Size {variant.size}</span>
                        <span
                          className="w-3 h-3 rounded-full border border-white/50"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5 truncate">{variant.colorName}</p>
                      <p className="text-[11px] font-mono-tabular mt-1">
                        {outOfStock
                          ? 'Out of Stock'
                          : variant.stock <= variant.lowStockThreshold
                          ? `Only ${variant.stock} left`
                          : `${variant.stock} in stock`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Primary Purchase CTA */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-md">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="px-3 py-2 text-sm font-medium"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-mono-tabular">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))
                  }
                  aria-label="Increase quantity"
                  className="px-3 py-2 text-sm font-medium"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={!selectedVariant || selectedVariant.stock === 0}
                onClick={() => {
                  if (selectedVariant && selectedVariant.stock > 0) {
                    onAddToCart(product, selectedVariant, quantity);
                    onClose();
                  }
                }}
                className="flex-1 py-2.5 px-5 text-sm font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {selectedVariant && selectedVariant.stock > 0
                    ? `Add to Bag — ₹${(product.price * quantity).toLocaleString('en-IN')}`
                    : 'Selected Size Out of Stock'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label="Save to wishlist"
                className="p-2.5 border border-stone-300 dark:border-stone-700 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            {/* PIN Code Serviceability & Estimated Delivery Calculator */}
            <div className="p-4 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Check PIN Code Delivery &amp; COD Serviceability</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  aria-label="Enter 6-digit PIN code"
                  className="w-28 px-2.5 py-1 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900"
                />
              </div>
              {pinQuote.serviceable ? (
                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Serviceable via {pinQuote.zone?.name}</span>
                  </p>
                  <p>
                    Estimated Arrival: <strong>{pinQuote.estimatedArrivalText}</strong> · Shipping:{' '}
                    <span className="font-mono-tabular">
                      {pinQuote.appliedFeeInr === 0 ? 'FREE' : `₹${pinQuote.appliedFeeInr}`}
                    </span>{' '}
                    · COD: {pinQuote.codEligible ? 'Available' : 'Online Only'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-400">{pinQuote.reason}</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="border-t border-stone-200 dark:border-stone-800 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Customer Reviews ({product.reviews.length})
            </h3>
            {product.reviews.length === 0 ? (
              <p className="text-xs text-stone-500">
                Be the first client to review the {product.name}.
              </p>
            ) : (
              <div className="space-y-3">
                {product.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 border border-stone-200 dark:border-stone-800 rounded-md space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {rev.customerName}
                      </span>
                      <span className="font-mono-tabular text-stone-500">
                        {rev.rating}/5 ★ · Verified Purchase
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                      {rev.title}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleReviewSubmit} className="lg:col-span-5 space-y-3 bg-stone-50 dark:bg-stone-950 p-4 rounded-md border border-stone-200 dark:border-stone-800">
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Write a Client Review
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="Your Name"
                aria-label="Reviewer name"
                className="px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900"
              />
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                aria-label="Review rating"
                className="px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900"
              >
                <option value={5}>5 Stars — Exceptional</option>
                <option value={4}>4 Stars — Very Good</option>
                <option value={3}>3 Stars — Satisfactory</option>
              </select>
            </div>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Review Headline (e.g., Tailoring & Drape)"
              aria-label="Review headline"
              className="w-full px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900"
            />
            <textarea
              required
              rows={2}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with the fit, fabric, and GPS delivery..."
              aria-label="Review comment"
              className="w-full px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900"
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="w-full py-2 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded hover:opacity-90"
            >
              {submittingReview ? 'Submitting...' : 'Publish Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const AboutAndSupportView: React.FC<{
  mode: 'about' | 'support';
  supportTickets: SupportTicket[];
  onSubmitTicket: (ticket: { name: string; email: string; phone: string; orderNumber?: string; topic: string; message: string }) => Promise<void>;
}> = ({ mode, supportTickets, onSubmitTicket }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [topic, setTopic] = useState('Order & Live GPS Delivery Assistance');
  const [message, setMessage] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  async function handleSupportForm(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    await onSubmitTicket({ name, email, phone, orderNumber, topic, message });
    setSubmittedMsg('Your inquiry has been logged with our Kala Ghoda Client Concierge.');
    setName('');
    setEmail('');
    setPhone('');
    setOrderNumber('');
    setMessage('');
  }

  if (mode === 'about') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="space-y-3 border-b border-stone-200 dark:border-stone-800 pb-6">
          <p className="text-xs text-stone-500">Brand Story &amp; Architecture</p>
          <h1 className="font-serif-display text-4xl font-semibold text-stone-900 dark:text-stone-100">
            About YOUR FASHION STORE
          </h1>
          <p className="text-base text-stone-600 dark:text-stone-300 max-w-3xl leading-relaxed">
            Founded with a vision to unite modern architectural tailoring with transparent, real-time last-mile logistics, YOUR FASHION STORE crafts enduring menswear, womenswear, and Indian ceremonial silhouettes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
            <h2 className="font-serif-display text-xl font-semibold">01. Certified Mills</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              We partner directly with European flax weavers, Bhagalpuri handloom clusters, and GOTS-certified organic cotton mills in Tiruppur.
            </p>
          </div>
          <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
            <h2 className="font-serif-display text-xl font-semibold">02. Consent-First GPS Delivery</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Our delivery partners share live GPS telemetry strictly during authorized active delivery shifts, paired with 4-digit doorstep OTP proof-of-delivery.
            </p>
          </div>
          <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
            <h2 className="font-serif-display text-xl font-semibold">03. Privacy &amp; Compliance</h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Customer PII is isolated in protected collections, online payments are verified server-side via HMAC-SHA256 signatures, and no raw card data is ever stored.
            </p>
          </div>
        </div>

        {/* Policies & Terms Reference */}
        <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg space-y-4 text-xs text-stone-600 dark:text-stone-400">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Privacy, Shipping, Refund, Cancellation &amp; Google Maps End User Terms
          </h3>
          <p>
            <strong>Shipping &amp; Serviceability:</strong> Complimentary standard shipping on orders above ₹4,999. Express GPS courier is available within serviceable metro PIN codes.
          </p>
          <p>
            <strong>Returns, Exchanges &amp; Refunds:</strong> Unworn garments with original tags may be returned or exchanged within 14 days of delivery. Online payment refunds are processed back to the original source within 5–7 business days.
          </p>
          <p>
            <strong>Geolocation &amp; Google Maps Privacy Notice:</strong> Browser geolocation is requested only upon explicit user action. Interactive map features are subject to the{' '}
            <a
              href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Maps End User Additional Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-6 space-y-6">
        <div>
          <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            Contact &amp; Client Concierge
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Plot 14, Kala Ghoda Design Precinct, Fort, Mumbai 400001 · concierge@yourfashionstore.in · +91 22 6690 4000
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Frequently Asked Questions
          </h2>
          <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-md space-y-1">
            <p className="text-xs font-semibold">How does live GPS delivery tracking work?</p>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Once your assigned delivery partner begins their route and grants shift GPS consent, their authorized coordinates stream in real time via WebSockets to your Order Tracking map.
            </p>
          </div>
          <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-md space-y-1">
            <p className="text-xs font-semibold">When is Cash on Delivery (COD) available?</p>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              COD is available in serviceable Indian PIN codes for orders between ₹500 and the zone's COD limit (₹25,000 in Mumbai Metro).
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSupportForm}
        className="lg:col-span-6 p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-4"
      >
        <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
          Submit an Order or Styling Inquiry
        </h2>
        {submittedMsg && (
          <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs">
            {submittedMsg}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email Address *</label>
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
            <label className="block text-xs font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9820112233"
              className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Order Number (Optional)</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="YFS-2026-1042"
              className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Message *</label>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe how we can assist with your garment sizing, delivery route, or return..."
            className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 px-4 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md hover:opacity-90"
        >
          Send Concierge Request
        </button>
      </form>
    </div>
  );
};
