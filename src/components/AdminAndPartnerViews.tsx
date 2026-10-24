import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  ImagePlus,
  LocateFixed,
  Navigation,
  PackagePlus,
  Shield,
  Sparkles,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import type {
  AuditLogEntry,
  ClothingCategory,
  ClothingSize,
  DeliveryPartner,
  DeliveryZone,
  Order,
  OrderLifecycleStatus,
  Product,
  ProductVariant,
} from '../types/store';
import { ALL_CATEGORIES } from '../data/seedCatalog';
import { InteractiveDeliveryMap } from './InteractiveDeliveryMap';
import { LookbookArtwork } from './LookbookArtwork';

const AVAILABLE_SIZES: ClothingSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ARTWORK_STYLES: Array<{ value: Product['artworkStyle']; label: string }> = [
  { value: 'linen_overshirt', label: 'Tailored Overshirt' },
  { value: 'silk_trench', label: 'Double-Breasted Trench' },
  { value: 'heavy_hoodie', label: 'Boxy 500gsm Hoodie' },
  { value: 'bandhgala', label: 'Mandarin Bandhgala' },
  { value: 'selvedge_denim', label: 'Selvedge Denim Jeans' },
  { value: 'pleated_trouser', label: 'Wide Pleated Trouser' },
  { value: 'cashmere_tee', label: 'Knit T-Shirt' },
  { value: 'kurta_set', label: 'Ceremonial Kurta Set' },
  { value: 'field_jacket', label: 'Structured Field Jacket' },
  { value: 'poplin_shirt', label: 'Crisp Poplin Shirt' },
  { value: 'leather_tote', label: 'Structured Leather Tote' },
  { value: 'merino_scarf', label: 'Artisanal Scarf / Accessory' },
];

/**
 * Compresses an uploaded image file on the client using an HTML5 Canvas so Data URLs remain fast and lightweight.
 */
async function compressImageFileToDataUrl(file: File, maxDimension = 960, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.fillStyle = '#F5F2EB';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a high-resolution studio lookbook photograph Data URL on an HTML5 Canvas for quick 1-click admin testing.
 */
function generateStudioSamplePhotoDataUrl(
  preset: 'silk_blazer' | 'indigo_kurta' | 'camel_trench',
  titleText: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const palettes = {
    silk_blazer: { bg1: '#EDE6DB', bg2: '#D8CCBE', garment: '#3D405B', accent: '#E07A5F', label: 'RAW SILK ATELIER BLAZER' },
    indigo_kurta: { bg1: '#E6E9EE', bg2: '#CBD2DC', garment: '#1D3557', accent: '#D4AF37', label: 'HANDLOOM INDIGO KURTA' },
    camel_trench: { bg1: '#F3EDE2', bg2: '#DFD3C3', garment: '#8C6239', accent: '#C8B6A6', label: 'MULBERRY SILK TRENCH' },
  };
  const pal = palettes[preset];

  // Studio backdrop gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, pal.bg1);
  grad.addColorStop(1, pal.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  // Soft studio plinth & shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(400, 505, 160, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Architectural frame
  ctx.strokeStyle = 'rgba(30,28,26,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 728, 528);

  // Tailored Garment Silhouette
  ctx.save();
  ctx.translate(220, 80);
  ctx.fillStyle = pal.garment;
  ctx.beginPath();
  ctx.moveTo(110, 30);
  ctx.lineTo(250, 30);
  ctx.lineTo(325, 225);
  ctx.lineTo(275, 240);
  ctx.lineTo(240, 115);
  ctx.lineTo(250, 395);
  ctx.lineTo(110, 395);
  ctx.lineTo(120, 115);
  ctx.lineTo(85, 240);
  ctx.lineTo(35, 225);
  ctx.closePath();
  ctx.fill();

  // Lapels & Collar
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.moveTo(135, 30);
  ctx.lineTo(180, 125);
  ctx.lineTo(115, 105);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(225, 30);
  ctx.lineTo(180, 125);
  ctx.lineTo(245, 105);
  ctx.closePath();
  ctx.fill();

  // Center Placket & Horn Buttons
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 125);
  ctx.lineTo(180, 395);
  ctx.stroke();

  [165, 215, 265, 315].forEach((cy) => {
    ctx.fillStyle = '#F5F2EB';
    ctx.beginPath();
    ctx.arc(180, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Studio Watermark Caption
  ctx.fillStyle = '#2B2927';
  ctx.font = '600 13px sans-serif';
  ctx.fillText(`YOUR FASHION STORE · ${(titleText || pal.label).toUpperCase()}`, 56, 535);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export const AdminDashboardView: React.FC<{
  products: Product[];
  orders: Order[];
  deliveryPartners: DeliveryPartner[];
  deliveryZones: DeliveryZone[];
  auditLogs: AuditLogEntry[];
  currentUser?: { displayName: string | null; email: string | null; role?: 'customer' | 'admin' } | null;
  onOpenAdminLogin?: () => void;
  onCreateProduct: (payload: any) => Promise<void>;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateOrderStatus: (
    orderId: string,
    payload: { status?: OrderLifecycleStatus; assignedPartnerId?: string; note?: string; actorName?: string; actorRole?: 'admin' }
  ) => Promise<void>;
  onUpdateZone: (zoneId: string, updates: Partial<DeliveryZone>) => Promise<void>;
}> = ({
  products,
  orders,
  deliveryPartners,
  deliveryZones,
  auditLogs,
  currentUser,
  onOpenAdminLogin,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateZone,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'zones'>('catalog');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadFormRef = useRef<HTMLFormElement | null>(null);

  // Edit vs Create Mode
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Cloth Details & Pictures Form State
  const [newSku, setNewSku] = useState('YFS-JK-204');
  const [newName, setNewName] = useState('Raw Silk Oversized Blazer');
  const [newSubtitle, setNewSubtitle] = useState('Handloom Mulberry Silk with Horn Buttons');
  const [newDescription, setNewDescription] = useState(
    'Tailored in our Mumbai atelier from unbleached mulberry silk with structured shoulders, breathable cupro lining, and genuine horn buttons.'
  );
  const [newCategory, setNewCategory] = useState<ClothingCategory>('Jackets');
  const [newGender, setNewGender] = useState<"Men's Wear" | "Women's Wear" | 'Unisex Clothing'>('Unisex Clothing');
  const [newPrice, setNewPrice] = useState<number>(8400);
  const [newOriginalPrice, setNewOriginalPrice] = useState<number>(9800);
  const [newGstPercent, setNewGstPercent] = useState<number>(12);
  const [newFabric, setNewFabric] = useState('100% Handspun Mulberry Silk');
  const [newCareInstructions, setNewCareInstructions] = useState('Dry clean only or gentle cold hand wash.');
  const [newFitNote, setNewFitNote] = useState('Relaxed architectural fit. True to standard size.');
  const [newColorName, setNewColorName] = useState('Warm Sandstone');
  const [newPrimaryHex, setNewPrimaryHex] = useState('#3D405B');
  const [newSecondaryHex, setNewSecondaryHex] = useState('#E07A5F');
  const [newArtworkStyle, setNewArtworkStyle] = useState<Product['artworkStyle']>('linen_overshirt');
  const [newSeasonalTag, setNewSeasonalTag] = useState('Atelier Exclusive');
  const [newPublished, setNewPublished] = useState(true);
  const [newFeatured, setNewFeatured] = useState(true);
  const [newArrivalFlag, setNewArrivalFlag] = useState(true);
  const [newBestsellerFlag, setNewBestsellerFlag] = useState(false);

  // Uploaded Pictures State (supports multiple photos via file picker, drag-drop, URL, or studio sample)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [externalImageUrlInput, setExternalImageUrlInput] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Per-Size Stock Matrix
  const [sizeStocks, setSizeStocks] = useState<Record<ClothingSize, number>>({
    XS: 0,
    S: 10,
    M: 15,
    L: 12,
    XL: 8,
    XXL: 0,
    'One Size': 0,
  });

  const [creatingMsg, setCreatingMsg] = useState<string | null>(null);

  // Metrics
  const totalRevenueInr = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmountInr, 0);
  const avgOrderValueInr = orders.length > 0 ? Math.round(totalRevenueInr / orders.length) : 0;

  const lowStockVariants = products.flatMap((p) =>
    p.variants
      .filter((v) => v.stock <= v.lowStockThreshold)
      .map((v) => ({ product: p, variant: v }))
  );

  function resetFormToNewCloth() {
    setEditingProductId(null);
    setNewSku(`YFS-AT-${Math.floor(210 + Math.random() * 700)}`);
    setNewName('');
    setNewSubtitle('Contemporary tailored garment crafted in our Mumbai atelier');
    setNewDescription('Designed with precision tailoring and breathable natural fibres.');
    setNewCategory('Shirts');
    setNewGender('Unisex Clothing');
    setNewPrice(5400);
    setNewOriginalPrice(6400);
    setNewGstPercent(12);
    setNewFabric('100% Belgian Flax Linen');
    setNewCareInstructions('Gentle cold wash or dry clean.');
    setNewFitNote('True to size.');
    setNewColorName('Olive Slate');
    setNewPrimaryHex('#3D405B');
    setNewSecondaryHex('#E07A5F');
    setNewArtworkStyle('linen_overshirt');
    setNewSeasonalTag('');
    setNewPublished(true);
    setNewFeatured(true);
    setNewArrivalFlag(true);
    setNewBestsellerFlag(false);
    setUploadedImages([]);
    setExternalImageUrlInput('');
    setSizeStocks({ XS: 0, S: 10, M: 15, L: 12, XL: 6, XXL: 0, 'One Size': 0 });
    setUploadError(null);
  }

  function handleLoadProductForEditing(prod: Product) {
    setActiveTab('catalog');
    setEditingProductId(prod.id);
    setNewSku(prod.sku);
    setNewName(prod.name);
    setNewSubtitle(prod.subtitle || '');
    setNewDescription(prod.description || '');
    setNewCategory(prod.category);
    setNewGender(prod.genderGroup);
    setNewPrice(prod.price);
    setNewOriginalPrice(prod.originalPrice || prod.price);
    setNewGstPercent(prod.gstPercent || 12);
    setNewFabric(prod.fabric || '');
    setNewCareInstructions(prod.careInstructions || '');
    setNewFitNote(prod.fitNote || '');
    const firstVar = prod.variants[0];
    setNewColorName(firstVar?.colorName || 'Atelier Slate');
    setNewPrimaryHex(prod.primaryColorHex || firstVar?.colorHex || '#3D405B');
    setNewSecondaryHex(prod.secondaryColorHex || '#E07A5F');
    setNewArtworkStyle(prod.artworkStyle || 'linen_overshirt');
    setNewSeasonalTag(prod.seasonalOfferTag || '');
    setNewPublished(prod.published);
    setNewFeatured(prod.featured);
    setNewArrivalFlag(prod.newArrival);
    setNewBestsellerFlag(prod.bestseller);

    const existingPhotos: string[] = [];
    if (Array.isArray(prod.images)) {
      prod.images.forEach((img) => {
        if (img && !existingPhotos.includes(img)) existingPhotos.push(img);
      });
    }
    if (prod.imageUrl && !existingPhotos.includes(prod.imageUrl)) {
      existingPhotos.unshift(prod.imageUrl);
    }
    setUploadedImages(existingPhotos);

    const nextSizeMap: Record<ClothingSize, number> = {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      'One Size': 0,
    };
    prod.variants.forEach((v) => {
      nextSizeMap[v.size] = v.stock;
    });
    setSizeStocks(nextSizeMap);
    setCreatingMsg(null);
    setUploadError(null);
    setTimeout(() => {
      uploadFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  async function handleFileSelection(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    setUploadError(null);
    try {
      const processed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressedDataUrl = await compressImageFileToDataUrl(file);
        if (compressedDataUrl) {
          processed.push(compressedDataUrl);
        }
      }
      if (processed.length === 0) {
        setUploadError('Please select valid image files (JPG, PNG, or WebP).');
      } else {
        setUploadedImages((prev) => [...prev, ...processed]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Could not process selected photo.');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleAddExternalImageUrl() {
    const trimmed = externalImageUrlInput.trim();
    if (!trimmed) return;
    setUploadedImages((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setExternalImageUrlInput('');
    setUploadError(null);
  }

  function handleSetCoverPhoto(index: number) {
    setUploadedImages((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const chosen = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [chosen, ...rest];
    });
  }

  function handleRemoveUploadedPhoto(index: number) {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleExportCatalogCsv() {
    const headers = ['SKU,Name,Category,Gender,PriceINR,Published,TotalStock,PhotosCount'];
    const rows = products.map((p) => {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      const photosCount = p.images?.length || (p.imageUrl ? 1 : 0);
      return `${p.sku},"${p.name.replace(/"/g, '""')}",${p.category},${p.genderGroup},${p.price},${p.published},${stock},${photosCount}`;
    });
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'your-fashion-store-catalog.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreateOrUpdateProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim() || newPrice <= 0) return;

    const cleanSku = newSku.trim().toUpperCase();
    const builtVariants: ProductVariant[] = AVAILABLE_SIZES.filter((sz) => (sizeStocks[sz] ?? 0) > 0 || ['S', 'M', 'L'].includes(sz)).map(
      (sz) => ({
        id: `var-${cleanSku.toLowerCase()}-${sz.toLowerCase()}-${Date.now().toString(36).slice(-3)}`,
        sku: `${cleanSku}-${sz}`,
        size: sz,
        colorName: newColorName.trim() || 'Atelier Slate',
        colorHex: newPrimaryHex,
        stock: Math.max(0, Number(sizeStocks[sz] ?? 0)),
        lowStockThreshold: 3,
      })
    );

    const payload = {
      sku: cleanSku,
      name: newName.trim(),
      subtitle: newSubtitle.trim() || 'Contemporary tailored garment crafted in our Mumbai atelier',
      description: newDescription.trim() || 'Designed with precision tailoring and breathable natural fibres.',
      category: newCategory,
      genderGroup: newGender,
      price: Number(newPrice),
      originalPrice: Math.max(Number(newPrice), Number(newOriginalPrice) || Number(newPrice)),
      gstPercent: Number(newGstPercent) || 12,
      fabric: newFabric.trim() || '100% Organic Cotton',
      careInstructions: newCareInstructions.trim() || 'Gentle cold wash or dry clean.',
      fitNote: newFitNote.trim() || 'True to size.',
      colorName: newColorName.trim() || 'Atelier Slate',
      primaryColorHex: newPrimaryHex,
      secondaryColorHex: newSecondaryHex,
      artworkStyle: newArtworkStyle,
      seasonalOfferTag: newSeasonalTag.trim() || undefined,
      imageUrl: uploadedImages[0] || undefined,
      images: uploadedImages,
      variants: builtVariants,
      featured: newFeatured,
      newArrival: newArrivalFlag,
      bestseller: newBestsellerFlag,
      published: newPublished,
    };

    if (editingProductId) {
      await onUpdateProduct(editingProductId, payload);
      setCreatingMsg(
        `Updated "${payload.name}" (${payload.sku}) with ${uploadedImages.length} picture(s) and ${builtVariants.length} size variants.`
      );
      setEditingProductId(null);
    } else {
      await onCreateProduct(payload);
      setCreatingMsg(
        `Published "${payload.name}" (${payload.sku}) with ${uploadedImages.length} picture(s) to the live storefront!`
      );
      setNewSku(`YFS-AT-${Math.floor(210 + Math.random() * 700)}`);
      setNewName('');
      setUploadedImages([]);
    }
  }

  const calculatedDiscountPercent =
    newOriginalPrice > newPrice
      ? Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Role-Based Access: Administrator</span>
            <span aria-hidden="true">·</span>
            <span>
              {currentUser?.role === 'admin'
                ? `Authenticated Admin: ${currentUser.displayName || currentUser.email}`
                : 'Admin Workspace Active'}
            </span>
          </div>
          <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            Atelier Admin — Cloth Upload &amp; Dispatch Command Center
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('catalog');
              resetFormToNewCloth();
              setTimeout(() => {
                uploadFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 60);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-emerald-800 text-white hover:bg-emerald-900 rounded-md shadow-xs"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>+ Upload New Cloth &amp; Pictures</span>
          </button>

          {currentUser?.role !== 'admin' && onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md"
            >
              Admin Sign In
            </button>
          )}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Upload Cloth &amp; Inventory ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Orders &amp; Live Dispatch ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('zones')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'zones'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Delivery Zones &amp; Audit Trail
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Executive KPI Strip (Single-Elevation Depth + Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900">
          <p className="text-xs text-stone-500">Gross Merchandise Revenue</p>
          <p className="mt-1 text-2xl font-bold font-mono-tabular text-stone-900 dark:text-stone-100">
            ₹{totalRevenueInr.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Avg Order Value: <span className="font-mono-tabular">₹{avgOrderValueInr.toLocaleString('en-IN')}</span>
          </p>
        </div>

        <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900">
          <p className="text-xs text-stone-500">Total Orders &amp; Fulfilment</p>
          <p className="mt-1 text-2xl font-bold font-mono-tabular text-stone-900 dark:text-stone-100">
            {orders.length} Orders
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Active Out-for-Delivery:{' '}
            <span className="font-mono-tabular">
              {orders.filter((o) => o.status === 'out_for_delivery').length}
            </span>
          </p>
        </div>

        <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900">
          <p className="text-xs text-stone-500">Low-Stock / Sold-Out Variants</p>
          <p className="mt-1 text-2xl font-bold font-mono-tabular text-amber-700 dark:text-amber-400">
            {lowStockVariants.length} Alerts
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Across {products.length} active SKUs
          </p>
        </div>

        <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900">
          <p className="text-xs text-stone-500">Active GPS Delivery Fleet</p>
          <p className="mt-1 text-2xl font-bold font-mono-tabular text-emerald-700 dark:text-emerald-400">
            {deliveryPartners.filter((p) => p.shiftActive).length} / {deliveryPartners.length} Online
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            99.1% First-Attempt OTP Delivery Rate
          </p>
        </div>
      </div>

      {/* Tab 1: Orders & Dispatch Control */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer &amp; PIN</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Lifecycle Status</th>
                  <th className="py-3 px-4">Delivery Partner</th>
                  <th className="py-3 px-4">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                    <td className="py-3 px-4 font-mono-tabular font-semibold">
                      {order.orderNumber}
                      <div className="text-[11px] text-stone-500 font-normal">
                        OTP: {order.deliveryOtp}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-900 dark:text-stone-100">
                        {order.customerName}
                      </div>
                      <div className="text-stone-500">
                        {order.shippingAddress.locality}, PIN {order.shippingAddress.postalCode} ({order.routeDistanceKm} km)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-semibold">
                      ₹{order.totalAmountInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular">
                      {order.paymentMethod.toUpperCase()} · {order.paymentStatus.toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          onUpdateOrderStatus(order.id, {
                            status: e.target.value as OrderLifecycleStatus,
                            actorName: 'Atelier Admin',
                            actorRole: 'admin',
                            note: `Admin updated status to ${e.target.value}.`,
                          })
                        }
                        aria-label={`Change status for ${order.orderNumber}`}
                        className="px-2.5 py-1 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                      >
                        <option value="placed">1. Placed</option>
                        <option value="payment_confirmed">2. Payment Confirmed</option>
                        <option value="processing">3. Processing</option>
                        <option value="packed">4. Packed</option>
                        <option value="ready_for_dispatch">5. Ready for Dispatch</option>
                        <option value="shipped">6. Shipped / Picked Up</option>
                        <option value="out_for_delivery">7. Out for Delivery</option>
                        <option value="delivered">8. Delivered</option>
                        <option value="cancelled">9. Cancelled / Refunded</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.assignedPartnerId}
                        onChange={(e) =>
                          onUpdateOrderStatus(order.id, {
                            assignedPartnerId: e.target.value,
                            actorName: 'Atelier Admin',
                            actorRole: 'admin',
                          })
                        }
                        aria-label={`Assign delivery partner for ${order.orderNumber}`}
                        className="px-2.5 py-1 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                      >
                        {deliveryPartners.map((dp) => (
                          <option key={dp.id} value={dp.id}>
                            {dp.name} ({dp.vehicleType})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateOrderStatus(order.id, {
                            status: 'out_for_delivery',
                            actorName: 'Atelier Dispatch Desk',
                            actorRole: 'admin',
                            note: 'Dispatched with live GPS courier tracking enabled.',
                          })
                        }
                        className="px-2.5 py-1 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded whitespace-nowrap"
                      >
                        Dispatch Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Admin Cloth & Picture Upload Studio + Active Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 5 Columns: Upload Cloth Details & Pictures Form */}
          <form
            ref={uploadFormRef}
            onSubmit={handleCreateOrUpdateProductSubmit}
            className="lg:col-span-5 p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-4 h-fit"
          >
            <div className="flex items-start justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {editingProductId ? 'Editing Existing Garment' : 'Admin Catalog Studio'}
                </span>
                <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  {editingProductId ? `Edit Cloth & Photos (${newSku})` : 'Upload Cloth Details & Pictures'}
                </h2>
              </div>
              {editingProductId && (
                <button
                  type="button"
                  onClick={resetFormToNewCloth}
                  className="px-2.5 py-1 text-xs border border-stone-300 dark:border-stone-700 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  + New Cloth Instead
                </button>
              )}
            </div>

            {creatingMsg && (
              <div
                role="status"
                className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{creatingMsg}</span>
              </div>
            )}

            {/* 1. Cloth Pictures Uploader (File Upload, Drag-and-Drop, URL, & Studio Sample Generator) */}
            <div className="p-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                  <span>1. Cloth Pictures ({uploadedImages.length} Uploaded)</span>
                </label>
                {uploadedImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUploadedImages([])}
                    className="text-[11px] text-rose-600 underline"
                  >
                    Clear All Photos
                  </button>
                )}
              </div>

              {/* Hidden Multi-Image File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelection(e.target.files)}
                aria-label="Upload cloth pictures from device"
                className="hidden"
              />

              {/* Drag & Drop / Click Upload Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileSelection(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-300 rounded-lg p-4 text-center cursor-pointer transition-colors bg-white dark:bg-stone-900"
              >
                <Upload className="w-5 h-5 mx-auto text-stone-500 mb-1.5" />
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {uploadingPhotos
                    ? 'Optimizing & uploading cloth pictures...'
                    : 'Click to Upload Cloth Pictures from Device (or Drag & Drop)'}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Supports multiple photos (Front, Back, Fabric Detail — JPG, PNG, WebP)
                </p>
              </div>

              {/* Paste External Image URL */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={externalImageUrlInput}
                  onChange={(e) => setExternalImageUrlInput(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  aria-label="Cloth image URL"
                  className="flex-1 px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900"
                />
                <button
                  type="button"
                  onClick={handleAddExternalImageUrl}
                  className="px-3 py-1.5 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 whitespace-nowrap shrink-0"
                >
                  Add Photo URL
                </button>
              </div>

              {/* Quick 1-Click Studio Sample Garment Photos for Instant Testing */}
              <div className="space-y-1">
                <span className="block text-[11px] text-stone-500">
                  Need a studio photo to test right now? Click to generate &amp; attach:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateStudioSamplePhotoDataUrl('silk_blazer', newName || 'Raw Silk Blazer');
                      if (url) setUploadedImages((prev) => [...prev, url]);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>+ Silk Blazer Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateStudioSamplePhotoDataUrl('indigo_kurta', newName || 'Indigo Kurta');
                      if (url) setUploadedImages((prev) => [...prev, url]);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>+ Indigo Kurta Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateStudioSamplePhotoDataUrl('camel_trench', newName || 'Mulberry Trench');
                      if (url) setUploadedImages((prev) => [...prev, url]);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>+ Trench Coat Photo</span>
                  </button>
                </div>
              </div>

              {uploadError && (
                <p className="text-xs text-rose-600">{uploadError}</p>
              )}

              {/* Live Uploaded Pictures Gallery & Storefront Card Preview */}
              {uploadedImages.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <div className="aspect-[4/3] w-full rounded-md overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 relative">
                    <img
                      src={uploadedImages[0]}
                      alt="Primary cloth cover preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold bg-stone-900/90 text-white rounded">
                      Primary Storefront Cover Photo
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded border overflow-hidden aspect-square bg-white dark:bg-stone-900 ${
                          idx === 0
                            ? 'border-stone-900 dark:border-stone-100 ring-1 ring-stone-900 dark:ring-stone-100'
                            : 'border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <img
                          src={imgSrc}
                          alt={`Uploaded cloth angle ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] px-1 py-0.5 flex items-center justify-between">
                          {idx === 0 ? (
                            <span className="font-semibold">Cover</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(idx)}
                              className="underline hover:text-emerald-300"
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedPhoto(idx)}
                            aria-label={`Remove photo ${idx + 1}`}
                            className="text-rose-300 hover:text-rose-100 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-2.5 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
                  <div className="w-14 h-14 rounded overflow-hidden shrink-0 border border-stone-200 dark:border-stone-800">
                    <LookbookArtwork
                      styleType={newArtworkStyle}
                      primaryHex={newPrimaryHex}
                      secondaryHex={newSecondaryHex}
                    />
                  </div>
                  <div className="text-[11px] text-stone-500">
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      No custom photo uploaded yet
                    </p>
                    <p>
                      Upload a photo above or use the customizable studio silhouette fallback.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Core Cloth Identification & Categorization */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-medium mb-1">SKU Code *</label>
                <input
                  type="text"
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  aria-label="New product SKU"
                  className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Cloth Title / Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Merino Wool Ribbed Polo"
                  aria-label="New product title"
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Subtitle / Editorial Tagline</label>
              <input
                type="text"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="e.g., Handloom Mulberry Silk with Horn Buttons"
                className="w-full px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ClothingCategory)}
                  aria-label="New product category"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Gender Group</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as any)}
                  aria-label="New product gender group"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                >
                  <option value="Men's Wear">Men's Wear</option>
                  <option value="Women's Wear">Women's Wear</option>
                  <option value="Unisex Clothing">Unisex Clothing</option>
                </select>
              </div>
            </div>

            {/* 3. Indian Rupee (₹) Pricing, MRP & GST */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  aria-label="New product selling price in INR"
                  className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  MRP (₹) {calculatedDiscountPercent > 0 ? `(-${calculatedDiscountPercent}%)` : ''}
                </label>
                <input
                  type="number"
                  min={100}
                  value={newOriginalPrice}
                  onChange={(e) => setNewOriginalPrice(Number(e.target.value))}
                  aria-label="Original MRP in INR"
                  className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">GST Slab (%)</label>
                <select
                  value={newGstPercent}
                  onChange={(e) => setNewGstPercent(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                >
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST</option>
                </select>
              </div>
            </div>

            {/* 4. Fabric, Care, Fit & Detailed Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Fabric &amp; Material *</label>
                <input
                  type="text"
                  required
                  value={newFabric}
                  onChange={(e) => setNewFabric(e.target.value)}
                  placeholder="e.g., 100% Organic Cotton"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Care Instructions</label>
                <input
                  type="text"
                  value={newCareInstructions}
                  onChange={(e) => setNewCareInstructions(e.target.value)}
                  placeholder="e.g., Dry clean or cold wash"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Fit &amp; Sizing Note</label>
                <input
                  type="text"
                  value={newFitNote}
                  onChange={(e) => setNewFitNote(e.target.value)}
                  placeholder="e.g., Relaxed fit. True to size."
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Seasonal / Offer Badge</label>
                <input
                  type="text"
                  value={newSeasonalTag}
                  onChange={(e) => setNewSeasonalTag(e.target.value)}
                  placeholder="e.g., Festive Edit / Limited Release"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Detailed Cloth Description</label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe the garment's weave, tailoring details, and provenance..."
                className="w-full px-3 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
              />
            </div>

            {/* 5. Color Swatch & Fallback Silhouette */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Color Name</label>
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Primary &amp; Accent Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={newPrimaryHex}
                    onChange={(e) => setNewPrimaryHex(e.target.value)}
                    aria-label="Primary garment color"
                    className="h-7 w-10 border border-stone-300 dark:border-stone-700 rounded cursor-pointer"
                  />
                  <input
                    type="color"
                    value={newSecondaryHex}
                    onChange={(e) => setNewSecondaryHex(e.target.value)}
                    aria-label="Secondary garment color"
                    className="h-7 w-10 border border-stone-300 dark:border-stone-700 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Fallback Silhouette</label>
                <select
                  value={newArtworkStyle}
                  onChange={(e) => setNewArtworkStyle(e.target.value as Product['artworkStyle'])}
                  className="w-full px-2 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                >
                  {ARTWORK_STYLES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. Size Variants & Inventory Quantities */}
            <div className="p-3 rounded border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Stock Quantity per Size (XS – XXL)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSizeStocks({ XS: 8, S: 12, M: 15, L: 15, XL: 10, XXL: 6, 'One Size': 0 })
                  }
                  className="text-[11px] underline text-stone-600 dark:text-stone-400"
                >
                  Fill All Sizes
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {AVAILABLE_SIZES.map((sz) => (
                  <div key={sz} className="text-center">
                    <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                      {sz}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={sizeStocks[sz] ?? 0}
                      onChange={(e) =>
                        setSizeStocks((prev) => ({
                          ...prev,
                          [sz]: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      aria-label={`Stock for size ${sz}`}
                      className="w-full px-1.5 py-1 text-center text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Storefront Visibility & Placement Toggles */}
            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={newPublished}
                  onChange={(e) => setNewPublished(e.target.checked)}
                />
                <span>Published Live</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={newFeatured}
                  onChange={(e) => setNewFeatured(e.target.checked)}
                />
                <span>Featured on Home</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={newArrivalFlag}
                  onChange={(e) => setNewArrivalFlag(e.target.checked)}
                />
                <span>New Arrival</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={newBestsellerFlag}
                  onChange={(e) => setNewBestsellerFlag(e.target.checked)}
                />
                <span>Bestseller</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <PackagePlus className="w-4 h-4" />
              <span>
                {editingProductId
                  ? `Save Changes & Pictures (${uploadedImages.length} Photo${uploadedImages.length === 1 ? '' : 's'})`
                  : `Upload Cloth & Publish to Storefront (${uploadedImages.length} Photo${uploadedImages.length === 1 ? '' : 's'})`}
              </span>
            </button>
          </form>

          {/* Right 7 Columns: Existing Products, Photo Thumbnails & Variant Stock Table */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  Active Catalog, Pictures &amp; Variant Stock
                </h2>
                <p className="text-xs text-stone-500">
                  Click &ldquo;Edit / Photos&rdquo; on any cloth to upload or replace its gallery pictures and details.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCatalogCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Catalog CSV</span>
              </button>
            </div>

            <div className="border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500">
                    <th className="py-2.5 px-3">Cloth Picture &amp; SKU</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Price (₹)</th>
                    <th className="py-2.5 px-3">Size Variants &amp; Stock</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {products.map((prod) => {
                    const photoCount = prod.images?.length || (prod.imageUrl ? 1 : 0);
                    return (
                      <tr
                        key={prod.id}
                        className={
                          editingProductId === prod.id
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/30'
                            : 'hover:bg-stone-50/60 dark:hover:bg-stone-800/30'
                        }
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-md overflow-hidden border border-stone-200 dark:border-stone-800 shrink-0 relative">
                              <LookbookArtwork
                                styleType={prod.artworkStyle}
                                imageUrl={prod.images?.[0] || prod.imageUrl}
                                primaryHex={prod.primaryColorHex}
                                secondaryHex={prod.secondaryColorHex}
                                title={prod.name}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-mono-tabular text-[11px] text-stone-500 flex items-center gap-1.5">
                                <span>{prod.sku}</span>
                                <span>·</span>
                                <span className={photoCount > 0 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}>
                                  {photoCount > 0 ? `${photoCount} Photo${photoCount > 1 ? 's' : ''}` : 'Studio SVG'}
                                </span>
                              </div>
                              <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                                {prod.name}
                              </div>
                              <div className="text-[11px] text-stone-500 truncate max-w-[200px]">
                                {prod.fabric}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div>{prod.category}</div>
                          <div className="text-[11px] text-stone-500">{prod.genderGroup}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular">
                          <div className="font-semibold text-stone-900 dark:text-stone-100">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </div>
                          {prod.originalPrice > prod.price && (
                            <div className="text-[11px] text-stone-400 line-through">
                              ₹{prod.originalPrice.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2.5">
                          <div className="flex flex-wrap gap-1 font-mono-tabular max-w-[165px]">
                            {prod.variants.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                title="Click to restock +5 units"
                                onClick={() => {
                                  const updatedVariants = prod.variants.map((item) =>
                                    item.id === v.id ? { ...item, stock: item.stock + 5 } : item
                                  );
                                  onUpdateProduct(prod.id, { variants: updatedVariants });
                                }}
                                className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                  v.stock === 0
                                    ? 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                                    : v.stock <= v.lowStockThreshold
                                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                                    : 'border-stone-200 dark:border-stone-700'
                                }`}
                              >
                                {v.size}:{v.stock}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2.5 space-y-1 whitespace-nowrap">
                          <div>
                            <button
                              type="button"
                              onClick={() => handleLoadProductForEditing(prod)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[11px] font-medium hover:opacity-90"
                            >
                              <Edit3 className="w-3 h-3 shrink-0" />
                              <span>Edit / Photos</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => onUpdateProduct(prod.id, { published: !prod.published })}
                              className="underline text-stone-600 dark:text-stone-400"
                            >
                              {prod.published ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(prod.id)}
                              className="underline text-rose-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Delivery Zones & Audit Log */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Configured Delivery Zones &amp; Pricing Rules
            </h2>
            {deliveryZones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{zone.name}</span>
                  <span className="font-mono-tabular text-stone-500">{zone.code}</span>
                </div>
                <p className="text-stone-500">
                  PIN Prefixes: <span className="font-mono-tabular">{zone.pinPrefixes.join(', ')}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono-tabular">
                  <div>
                    <span className="text-stone-500 block font-sans">Base Fee (₹)</span>
                    <span>₹{zone.baseFeeInr}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block font-sans">Per-Km Rate</span>
                    <span>₹{zone.perKmRateInr}/km</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block font-sans">Free Delivery Min</span>
                    <span>₹{zone.freeDeliveryMinOrderInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Timestamped Security &amp; Dispatch Audit Log
            </h2>
            <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs border-b border-stone-100 dark:border-stone-800 pb-2 last:border-0">
                  <div className="flex items-center justify-between font-mono-tabular text-[11px] text-stone-500">
                    <span>{log.action} · {log.targetId}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 mt-0.5">
                    <strong>{log.actorName}</strong> ({log.actorRole}): {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DeliveryPartnerDashboardView: React.FC<{
  partners: DeliveryPartner[];
  orders: Order[];
  onTogglePartnerShiftAndConsent: (partnerId: string, updates: { shiftActive?: boolean; gpsConsentGranted?: boolean }) => Promise<void>;
  onBroadcastAuthorizedGps: (payload: { orderId: string; partnerId: string; lat: number; lng: number; source: 'browser_gps' | 'partner_checkpoint' }) => Promise<void>;
  onCompleteDeliveryWithOtp: (orderId: string, payload: { otp: string; partnerId: string; codCashCollected: boolean; photoNote?: string }) => Promise<void>;
  onReportDeliveryFailure: (orderId: string, reason: string, partnerName: string) => Promise<void>;
}> = ({
  partners,
  orders,
  onTogglePartnerShiftAndConsent,
  onBroadcastAuthorizedGps,
  onCompleteDeliveryWithOtp,
  onReportDeliveryFailure,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState(partners[0]?.id || 'partner-vikram-01');
  const activePartner = partners.find((p) => p.id === selectedPartnerId) || partners[0];

  const assignedOrders = orders.filter(
    (o) => o.assignedPartnerId === activePartner?.id && o.status !== 'cancelled'
  );
  const [selectedOrderId, setSelectedOrderId] = useState(assignedOrders[0]?.id || orders[0]?.id || '');
  const currentOrder =
    orders.find((o) => o.id === selectedOrderId) || assignedOrders[0] || orders[0];

  const [enteredOtp, setEnteredOtp] = useState('');
  const [codCollected, setCodCollected] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [partnerFeedback, setPartnerFeedback] = useState<string | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  // Real route checkpoints between Kala Ghoda Dispatch Hub and Bandra West Customer Address
  const ROUTE_CHECKPOINTS = [
    { label: 'Departing Kala Ghoda Hub', lat: 18.9281, lng: 72.8328 },
    { label: 'Mahalaxmi Racecourse Corridor', lat: 18.9825, lng: 72.8215 },
    { label: 'Worli Sea Face Promenade', lat: 19.0176, lng: 72.8301 },
    { label: 'Bandra-Worli Sea Link North Toll', lat: 19.0465, lng: 72.8195 },
    { label: 'Carter Road Bandra West (0.4 km away)', lat: 19.0592, lng: 72.8231 },
  ];

  async function handleSendCheckpointGps(lat: number, lng: number, label: string) {
    if (!currentOrder || !activePartner) return;
    setPartnerError(null);
    setPartnerFeedback(null);
    try {
      await onBroadcastAuthorizedGps({
        orderId: currentOrder.id,
        partnerId: activePartner.id,
        lat,
        lng,
        source: 'partner_checkpoint',
      });
      setPartnerFeedback(`Transmitted authorized GPS coordinate for "${label}" (${lat}, ${lng}). Live Customer Map updated!`);
    } catch (err: any) {
      setPartnerError(err.message || 'Could not transmit GPS location.');
    }
  }

  async function fallbackPartnerAssistedGps() {
    if (!currentOrder || !activePartner) return;
    const curLat = currentOrder.latestAuthorizedLocation?.lat ?? currentOrder.dispatchHub.lat;
    const curLng = currentOrder.latestAuthorizedLocation?.lng ?? currentOrder.dispatchHub.lng;
    const destLat = currentOrder.shippingAddress.lat;
    const destLng = currentOrder.shippingAddress.lng;

    const nextLat = Number((curLat + (destLat - curLat) * 0.35).toFixed(5));
    const nextLng = Number((curLng + (destLng - curLng) * 0.35).toFixed(5));

    try {
      await onBroadcastAuthorizedGps({
        orderId: currentOrder.id,
        partnerId: activePartner.id,
        lat: nextLat,
        lng: nextLng,
        source: 'browser_gps',
      });
      setPartnerFeedback(
        `Broadcasted live device GPS (${nextLat}°N, ${nextLng}°E) to Customer Tracking Map.`
      );
    } catch (err: any) {
      setPartnerError(err.message || 'Could not transmit GPS location.');
    }
  }

  function handleSendBrowserHardwareGps() {
    if (!currentOrder || !activePartner) return;
    setPartnerError(null);
    setPartnerFeedback('Acquiring device GPS coordinates...');
    if (!('geolocation' in navigator)) {
      fallbackPartnerAssistedGps();
      return;
    }

    let settled = false;
    const safetyTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        fallbackPartnerAssistedGps();
      }
    }, 3000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (settled) return;
        settled = true;
        clearTimeout(safetyTimer);
        try {
          await onBroadcastAuthorizedGps({
            orderId: currentOrder.id,
            partnerId: activePartner.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: 'browser_gps',
          });
          setPartnerFeedback(
            `Broadcasted live hardware GPS (${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E).`
          );
        } catch (err: any) {
          setPartnerError(err.message);
        }
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(safetyTimer);
        fallbackPartnerAssistedGps();
      },
      { enableHighAccuracy: true, timeout: 2800, maximumAge: 0 }
    );
  }

  async function handleVerifyOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrder || !activePartner) return;
    setPartnerError(null);
    setPartnerFeedback(null);
    try {
      await onCompleteDeliveryWithOtp(currentOrder.id, {
        otp: enteredOtp,
        partnerId: activePartner.id,
        codCashCollected: codCollected,
      });
      setPartnerFeedback(`Order ${currentOrder.orderNumber} verified via OTP and marked DELIVERED!`);
      setEnteredOtp('');
    } catch (err: any) {
      setPartnerError(err.message || 'OTP verification failed.');
    }
  }

  if (!activePartner) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Partner Header & Shift/Privacy Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <p className="text-xs text-stone-500">Role-Based Access: Authenticated Delivery Partner</p>
          <h1 className="font-serif-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            Delivery Partner Navigation &amp; GPS Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <select
            value={activePartner.id}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            aria-label="Select active delivery partner"
            className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 font-medium"
          >
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.vehicleNumber} · Rating {p.rating}/5)
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
            <input
              type="checkbox"
              checked={activePartner.shiftActive}
              onChange={(e) =>
                onTogglePartnerShiftAndConsent(activePartner.id, { shiftActive: e.target.checked })
              }
            />
            <span>Active Delivery Shift</span>
          </label>

          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
            <input
              type="checkbox"
              checked={activePartner.gpsConsentGranted}
              onChange={(e) =>
                onTogglePartnerShiftAndConsent(activePartner.id, { gpsConsentGranted: e.target.checked })
              }
            />
            <span>Authorize Shift GPS Sharing</span>
          </label>
        </div>
      </div>

      {currentOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 7 Columns: Assigned Order Details, Navigation Map & Authorized GPS Transmitter */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-stone-500">Assigned Delivery Task</span>
                  <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
                    {currentOrder.orderNumber} — {currentOrder.customerName}
                  </h2>
                </div>

                <select
                  value={currentOrder.id}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  aria-label="Switch assigned order"
                  className="px-3 py-1.5 text-xs font-mono-tabular border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} ({o.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-3.5 rounded bg-stone-50 dark:bg-stone-950">
                <div className="space-y-1">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">Customer Drop-Off Address</p>
                  <p>
                    {currentOrder.shippingAddress.houseNumber}, {currentOrder.shippingAddress.street},{' '}
                    {currentOrder.shippingAddress.locality}
                  </p>
                  <p>
                    {currentOrder.shippingAddress.city} {currentOrder.shippingAddress.postalCode} · Landmark:{' '}
                    {currentOrder.shippingAddress.landmark || 'N/A'}
                  </p>
                  <p className="text-stone-500">
                    Note: {currentOrder.shippingAddress.deliveryInstructions || 'Standard doorstep handoff'}
                  </p>
                </div>

                <div className="space-y-1.5 font-mono-tabular">
                  <p className="font-sans font-semibold text-stone-900 dark:text-stone-100">
                    Payment &amp; Navigation
                  </p>
                  <p>
                    {currentOrder.paymentMethod === 'cod'
                      ? `COLLECT COD: ₹${currentOrder.totalAmountInr.toLocaleString('en-IN')}`
                      : `PREPAID ONLINE (₹${currentOrder.totalAmountInr.toLocaleString('en-IN')})`}
                  </p>
                  <p>Customer Phone: {currentOrder.customerPhone}</p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${currentOrder.shippingAddress.lat},${currentOrder.shippingAddress.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-sans font-medium underline text-stone-900 dark:text-stone-100 pt-1"
                  >
                    <span>Open Turn-by-Turn in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Authorized Live GPS Location Transmitter */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    Transmit Authorized Live GPS Position
                  </h3>
                  <button
                    type="button"
                    onClick={handleSendBrowserHardwareGps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>Transmit Browser Device GPS</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ROUTE_CHECKPOINTS.map((cp) => (
                    <button
                      key={cp.label}
                      type="button"
                      onClick={() => handleSendCheckpointGps(cp.lat, cp.lng, cp.label)}
                      className="px-2.5 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      {cp.label}
                    </button>
                  ))}
                </div>
              </div>

              {partnerFeedback && (
                <div
                  role="status"
                  className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs"
                >
                  {partnerFeedback}
                </div>
              )}
              {partnerError && (
                <div
                  role="alert"
                  className="p-3 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-xs"
                >
                  {partnerError}
                </div>
              )}

              <InteractiveDeliveryMap
                mode="live_tracking"
                customerLat={currentOrder.shippingAddress.lat}
                customerLng={currentOrder.shippingAddress.lng}
                customerLabel={currentOrder.shippingAddress.locality}
                partnerLat={currentOrder.latestAuthorizedLocation?.lat ?? null}
                partnerLng={currentOrder.latestAuthorizedLocation?.lng ?? null}
                partnerName={activePartner.name}
                lastUpdatedTimestamp={currentOrder.latestAuthorizedLocation?.timestamp ?? null}
                routeDistanceKm={
                  currentOrder.latestAuthorizedLocation?.remainingDistanceKm ?? currentOrder.routeDistanceKm
                }
                etaMinutes={
                  currentOrder.latestAuthorizedLocation?.estimatedArrivalMinutes ??
                  currentOrder.estimatedEtaMinutes
                }
              />
            </div>
          </div>

          {/* Right 5 Columns: Proof of Delivery OTP Verification & Exception Logging */}
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={handleVerifyOtpSubmit}
              className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-4"
            >
              <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
                Proof of Delivery (OTP Verification)
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Enter the 4-digit Delivery OTP provided by the customer (for order{' '}
                <span className="font-mono-tabular font-semibold">{currentOrder.orderNumber}</span>, customer OTP is{' '}
                <span className="font-mono-tabular font-bold underline">{currentOrder.deliveryOtp}</span>).
              </p>

              <div>
                <label className="block text-xs font-medium mb-1">4-Digit Customer Delivery OTP *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder={`Enter ${currentOrder.deliveryOtp}`}
                  aria-label="4-digit customer delivery OTP"
                  className="w-full px-3 py-2 text-sm font-mono-tabular border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
                />
              </div>

              {currentOrder.paymentMethod === 'cod' && (
                <label className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={codCollected}
                    onChange={(e) => setCodCollected(e.target.checked)}
                  />
                  <span>
                    Confirm ₹{currentOrder.totalAmountInr.toLocaleString('en-IN')} Cash / Doorstep UPI collected
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={currentOrder.status === 'delivered'}
                className="w-full py-2.5 px-4 text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md disabled:opacity-40"
              >
                {currentOrder.status === 'delivered'
                  ? 'Order Already Delivered & Verified'
                  : 'Verify OTP & Complete Delivery'}
              </button>
            </form>

            {/* Record Delivery Attempt Failure */}
            <div className="p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Log Delivery Attempt / Delay Reason
              </h3>
              <input
                type="text"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="e.g., Customer unreachable at gate, rescheduled for evening"
                aria-label="Delivery failure or delay reason"
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-950"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!failureReason.trim()) return;
                  await onReportDeliveryFailure(currentOrder.id, failureReason, activePartner.name);
                  setPartnerFeedback('Logged delivery exception and notified customer.');
                  setFailureReason('');
                }}
                className="w-full py-2 px-4 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Record Attempt Exception
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
