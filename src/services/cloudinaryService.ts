// ============================================================
//  src/services/cloudinaryService.ts
//  Cloudinary media upload & CDN service for RAKCHA GAME.
//  Cloud Name: dlagqn7la
//  Upload Preset: tawla32 (Unsigned)
// ============================================================

export const CLOUDINARY_CLOUD_NAME =
  (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || 'dlagqn7la';
export const CLOUDINARY_UPLOAD_PRESET =
  (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || 'tawla32';

/**
 * Upload an image or media file directly to Cloudinary using unsigned preset.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Cloudinary upload failed with status ${response.status}`
    );
  }

  const data = await response.json();
  return data.secure_url || data.url;
}

/**
 * Upload an audio file or voice note to Cloudinary.
 */
export async function uploadAudioToCloudinary(file: Blob | File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Cloudinary audio upload failed with status ${response.status}`
    );
  }

  const data = await response.json();
  return data.secure_url || data.url;
}

/**
 * Returns an optimized Cloudinary URL with auto-format (WebP/AVIF), auto-quality, and optional width constraint.
 * Non-Cloudinary URLs or invalid URLs are returned as-is.
 */
export function getOptimizedImageUrl(url?: string, width?: number): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('res.cloudinary.com')) return url;

  // Insert transformations right after '/upload/'
  const uploadMarker = '/upload/';
  const uploadIndex = url.indexOf(uploadMarker);
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + uploadMarker.length);
  const suffix = url.substring(uploadIndex + uploadMarker.length);

  const transformations = ['f_auto', 'q_auto'];
  if (width && width > 0) {
    transformations.push(`w_${width}`);
  }

  const transformationStr = transformations.join(',') + '/';
  return prefix + transformationStr + suffix;
}

/**
 * Curated preset gaming avatars hosted with Cloudinary optimization.
 */
export const PRESET_AVATARS = [
  {
    id: 'lion_king',
    name: 'Lion Warrior',
    url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'cyber_falcon',
    name: 'Cyber Falcon',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'desert_fox',
    name: 'Desert Fox',
    url: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'golden_tiger',
    name: 'Golden Tiger',
    url: 'https://images.unsplash.com/photo-1615963244664-5b845b2025ee?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'neon_rider',
    name: 'Neon Rebel',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'tunisian_eagle',
    name: 'El-Ghar Falcon',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=250&auto=format&fit=crop&q=80',
  },
];


