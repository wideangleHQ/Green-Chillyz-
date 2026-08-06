/**
 * Image URL rules for the master menu.
 *
 * Only URLs are ever stored — never binary — so the single question is whether
 * a string is a fetchable absolute http(s) URL. Host is deliberately not
 * whitelisted: Cloudinary today, Supabase Storage tomorrow, some other CDN
 * after that, all without a code change.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export interface ImageUrlCheck {
  valid: boolean;
  reason?: string;
}

export function checkImageUrl(value: unknown): ImageUrlCheck {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { valid: false, reason: 'Image URL is empty' };
  }

  const trimmed = value.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // A relative path cannot be resolved by a client that is not on our origin.
    return { valid: false, reason: 'Image URL must be absolute' };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      valid: false,
      reason: `Unsupported protocol "${parsed.protocol}"; use http or https`,
    };
  }

  if (!parsed.hostname) {
    return { valid: false, reason: 'Image URL has no host' };
  }

  return { valid: true };
}

export function isValidImageUrl(value: unknown): boolean {
  return checkImageUrl(value).valid;
}
