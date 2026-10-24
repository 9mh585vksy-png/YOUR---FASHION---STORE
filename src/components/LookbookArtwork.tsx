import React, { useState, useEffect } from 'react';
import type { Product } from '../types/store';

interface LookbookArtworkProps {
  styleType: Product['artworkStyle'] | 'hero_campaign';
  imageUrl?: string;
  primaryHex?: string;
  secondaryHex?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * High-craft bespoke SVG studio lookbook & architectural garment visual renderer.
 * Supports real admin-uploaded product photographs (Data URLs or external URLs) while guaranteeing zero broken image frames via automatic SVG fallback.
 */
export const LookbookArtwork: React.FC<LookbookArtworkProps> = ({
  styleType,
  imageUrl,
  primaryHex = '#6B705C',
  secondaryHex = '#DDBEA9',
  title = 'YOUR FASHION STORE',
  subtitle = 'Atelier Collection',
  className = 'w-full h-full',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  if (styleType === 'hero_campaign') {
    return (
      <div className={`relative overflow-hidden bg-[#181715] select-none ${className}`} role="img" aria-label={title}>
        <svg viewBox="0 0 1200 675" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="heroBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#23201C" />
              <stop offset="52%" stopColor="#352F28" />
              <stop offset="100%" stopColor="#171513" />
            </linearGradient>
            <linearGradient id="sunbeam" x1="0%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#EDE0D4" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#DDBEA9" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="coatLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D6CCC2" />
              <stop offset="100%" stopColor="#A99985" />
            </linearGradient>
            <linearGradient id="coatRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6B705C" />
              <stop offset="100%" stopColor="#3F4238" />
            </linearGradient>
          </defs>

          {/* Architectural Travertine Gallery Background */}
          <rect width="1200" height="675" fill="url(#heroBg)" />
          <polygon points="180,0 780,0 1080,675 420,675" fill="url(#sunbeam)" />

          {/* Architectural Colonade & Plinths */}
          <rect x="90" y="60" width="240" height="555" fill="#2A2622" stroke="#463F3A" strokeWidth="1" />
          <rect x="860" y="95" width="250" height="520" fill="#211E1A" stroke="#3D3630" strokeWidth="1" />
          <line x1="0" y1="560" x2="1200" y2="560" stroke="#463F3A" strokeWidth="1" />

          {/* Left Editorial Silhouette: Double-Breasted Silk Trench */}
          <g transform="translate(360, 115)">
            <circle cx="110" cy="42" r="26" fill="#C8B6A6" />
            <path
              d="M65,82 L155,82 L188,240 L165,246 L146,145 L162,425 L58,425 L74,145 L55,246 L32,240 Z"
              fill="url(#coatLeft)"
            />
            {/* Lapels & Waist Belt */}
            <polygon points="88,82 110,165 72,140" fill="#EDE0D4" opacity="0.7" />
            <polygon points="132,82 110,165 148,140" fill="#EDE0D4" opacity="0.7" />
            <rect x="68" y="218" width="84" height="12" fill="#7F6A58" />
            <circle cx="96" cy="182" r="3.5" fill="#3D312A" />
            <circle cx="124" cy="182" r="3.5" fill="#3D312A" />
            <circle cx="96" cy="206" r="3.5" fill="#3D312A" />
            <circle cx="124" cy="206" r="3.5" fill="#3D312A" />
          </g>

          {/* Right Editorial Silhouette: Tailored Belgian Linen Overshirt & Pleated Trousers */}
          <g transform="translate(610, 95)">
            <circle cx="120" cy="46" r="28" fill="#B7A18E" />
            <path
              d="M66,88 L174,88 L210,255 L178,262 L162,150 L166,295 L74,295 L78,150 L62,262 L30,255 Z"
              fill="url(#coatRight)"
            />
            {/* Wide Pleated Trousers */}
            <path d="M76,295 L164,295 L178,465 L126,465 L120,345 L114,465 L62,465 Z" fill="#D5BDAF" />
            {/* Shirt Placket & Pocket */}
            <line x1="120" y1="88" x2="120" y2="295" stroke="#282A22" strokeWidth="2" />
            <rect x="134" y="138" width="24" height="28" fill="none" stroke="#EDE0D4" strokeOpacity="0.45" strokeWidth="1.5" />
          </g>

          {/* Subtle Editorial Frame Lines */}
          <rect x="32" y="32" width="1136" height="611" fill="none" stroke="#EDE0D4" strokeOpacity="0.18" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (imageUrl && !imgError) {
    return (
      <div
        className={`relative overflow-hidden bg-[#F5F2EB] dark:bg-[#1C1B19] select-none ${className}`}
        role="img"
        aria-label={`${title} — ${subtitle}`}
      >
        <img
          src={imageUrl}
          alt={`${title} — ${subtitle}`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#F5F2EB] dark:bg-[#1C1B19] select-none ${className}`}
      role="img"
      aria-label={`${title} — ${subtitle}`}
    >
      <svg viewBox="0 0 600 450" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`garment-${styleType}-${primaryHex}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryHex} />
            <stop offset="100%" stopColor={secondaryHex} />
          </linearGradient>
          <radialGradient id="studioShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Studio Travertine Plinth & Backdrop */}
        <rect width="600" height="450" fill="transparent" />
        <ellipse cx="300" cy="392" rx="135" ry="16" fill="url(#studioShadow)" />
        <line x1="70" y1="365" x2="530" y2="365" stroke="#D6CFC4" strokeWidth="1" strokeOpacity="0.6" />

        {/* Garment Silhouette by Style */}
        {(styleType === 'linen_overshirt' || styleType === 'poplin_shirt' || styleType === 'field_jacket') && (
          <g transform="translate(150, 58)">
            {/* Tailored Overshirt / Jacket */}
            <path
              d="M95,28 L205,28 L268,185 L228,198 L198,96 L204,295 L96,295 L102,96 L72,198 L32,185 Z"
              fill={primaryHex}
              stroke="#1F1E1B"
              strokeOpacity="0.18"
              strokeWidth="2"
            />
            {/* Collar */}
            <polygon points="115,28 150,64 130,74 95,28" fill={secondaryHex} />
            <polygon points="185,28 150,64 170,74 205,28" fill={secondaryHex} />
            {/* Placket & Pockets */}
            <line x1="150" y1="64" x2="150" y2="295" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2" />
            <rect x="108" y="106" width="30" height="34" rx="2" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
            <rect x="162" y="106" width="30" height="34" rx="2" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
            {[95, 140, 185, 230].map((cy) => (
              <circle key={cy} cx="150" cy={cy} r="3.5" fill="#F5F2EB" />
            ))}
          </g>
        )}

        {(styleType === 'silk_trench' || styleType === 'kurta_set') && (
          <g transform="translate(155, 42)">
            <path
              d="M90,26 L200,26 L252,195 L218,205 L194,95 L212,332 L78,332 L96,95 L72,205 L38,195 Z"
              fill={primaryHex}
              stroke="#2B2927"
              strokeOpacity="0.22"
              strokeWidth="2"
            />
            {/* Double-breasted storm lapels & waist belt */}
            <polygon points="105,26 145,120 88,108" fill={secondaryHex} opacity="0.85" />
            <polygon points="185,26 145,120 202,108" fill={secondaryHex} opacity="0.85" />
            <rect x="88" y="168" width="114" height="14" rx="2" fill={secondaryHex} />
            <rect x="136" y="165" width="18" height="20" rx="2" fill="none" stroke="#2B2927" strokeWidth="2" />
          </g>
        )}

        {styleType === 'heavy_hoodie' && (
          <g transform="translate(145, 52)">
            {/* Hood */}
            <path d="M112,36 C112,-6 198,-6 198,36 Z" fill={secondaryHex} />
            {/* Boxy 500gsm body */}
            <path
              d="M92,34 L218,34 L278,192 L235,208 L208,108 L212,292 L98,292 L102,108 L75,208 L32,192 Z"
              fill={primaryHex}
              stroke="#111"
              strokeOpacity="0.2"
              strokeWidth="2"
            />
            {/* Kangaroo pocket & heavy ribbing */}
            <polygon points="116,195 194,195 204,268 106,268" fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="2" />
            <rect x="98" y="274" width="114" height="18" fill={secondaryHex} opacity="0.55" />
          </g>
        )}

        {styleType === 'bandhgala' && (
          <g transform="translate(150, 48)">
            <path
              d="M96,34 L204,34 L256,204 L220,214 L196,102 L202,312 L98,312 L104,102 L80,214 L44,204 Z"
              fill={primaryHex}
              stroke="#D4AF37"
              strokeOpacity="0.3"
              strokeWidth="1.5"
            />
            {/* Mandarin Bandhgala Collar */}
            <rect x="118" y="18" width="64" height="18" rx="4" fill={primaryHex} stroke={secondaryHex} strokeWidth="2" />
            <line x1="150" y1="36" x2="150" y2="312" stroke={secondaryHex} strokeWidth="1.5" />
            {/* Pocket Square */}
            <polygon points="168,98 192,98 186,84" fill="#EAE2D6" />
            {[60, 95, 130, 165, 200, 235].map((cy) => (
              <circle key={cy} cx="150" cy={cy} r="4" fill="#D4AF37" />
            ))}
          </g>
        )}

        {(styleType === 'selvedge_denim' || styleType === 'pleated_trouser') && (
          <g transform="translate(185, 42)">
            {/* Waistband */}
            <rect x="42" y="18" width="146" height="22" rx="2" fill={primaryHex} stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
            {/* Trousers Legs */}
            <path
              d="M42,40 L188,40 L204,335 L132,335 L115,130 L98,335 L26,335 Z"
              fill={primaryHex}
              stroke="#111"
              strokeOpacity="0.2"
              strokeWidth="2"
            />
            {/* Selvedge turn-up cuff or pleat lines */}
            {styleType === 'selvedge_denim' ? (
              <>
                <rect x="26" y="314" width="72" height="21" fill="#D6CCC2" />
                <rect x="132" y="314" width="72" height="21" fill="#D6CCC2" />
                <line x1="62" y1="314" x2="62" y2="335" stroke="#E63946" strokeWidth="3" />
                <line x1="168" y1="314" x2="168" y2="335" stroke="#E63946" strokeWidth="3" />
              </>
            ) : (
              <>
                <line x1="82" y1="40" x2="72" y2="320" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.5" />
                <line x1="148" y1="40" x2="158" y2="320" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.5" />
              </>
            )}
          </g>
        )}

        {styleType === 'cashmere_tee' && (
          <g transform="translate(145, 70)">
            <path
              d="M95,24 L215,24 L268,118 L226,142 L204,96 L204,268 L106,268 L106,96 L84,142 L42,118 Z"
              fill={primaryHex}
              stroke="#2B2927"
              strokeOpacity="0.25"
              strokeWidth="2"
            />
            <path d="M126,24 Q155,48 184,24" fill="none" stroke={secondaryHex} strokeWidth="5" />
          </g>
        )}

        {(styleType === 'leather_tote' || styleType === 'merino_scarf') && (
          <g transform="translate(175, 65)">
            {/* Leather Handles */}
            <path
              d="M82,95 C82,18 168,18 168,95"
              fill="none"
              stroke={primaryHex}
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Structured Tote Body */}
            <polygon
              points="35,90 215,90 202,285 48,285"
              fill={primaryHex}
              stroke={secondaryHex}
              strokeWidth="2"
            />
            <line x1="72" y1="90" x2="78" y2="285" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1.5" />
            <line x1="178" y1="90" x2="172" y2="285" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1.5" />
            <circle cx="82" cy="106" r="4" fill="#D4AF37" />
            <circle cx="168" cy="106" r="4" fill="#D4AF37" />
          </g>
        )}

        {/* Color Swatch Calibration Corner */}
        <g transform="translate(36, 390)">
          <circle cx="10" cy="10" r="8" fill={primaryHex} stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="24" cy="10" r="8" fill={secondaryHex} stroke="#FFFFFF" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};
