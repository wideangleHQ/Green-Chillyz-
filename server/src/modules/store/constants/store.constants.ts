export const STORE_ERRORS = {
  NOT_FOUND: 'Store not found',
  SLUG_EXISTS: 'A store with this slug already exists',
  EMAIL_EXISTS: 'A store with this email already exists',
  PHONE_EXISTS: 'A store with this phone already exists',
  CODE_EXISTS: 'A store with this code already exists',
  GALLERY_NOT_FOUND: 'Gallery image not found',
  TIMING_NOT_FOUND: 'Store timing not found',
  HOLIDAY_NOT_FOUND: 'Store holiday not found',
  HOLIDAY_DATE_EXISTS: 'A holiday already exists for this date',
  FACILITY_NOT_FOUND: 'Facility not found',
  FACILITY_EXISTS: 'This facility already exists for the store',
  MANAGER_NOT_FOUND: 'Store manager not found',
  MANAGER_EXISTS: 'This user is already assigned to the store',
  ANNOUNCEMENT_NOT_FOUND: 'Announcement not found',
  INVALID_DATE_RANGE: 'End date must be after start date',
  INVALID_TIMING: 'Closing time must be after opening time',
  INVALID_COORDINATES: 'Invalid latitude or longitude',
  IMAGE_UPLOAD_FAILED: 'Failed to upload image',
  SOFT_DELETED: 'This store has been deleted',
} as const;

export const STORE_PERMISSIONS = {
  CREATE: 'STORE_CREATE',
  UPDATE: 'STORE_UPDATE',
  DELETE: 'STORE_DELETE',
  VIEW: 'STORE_VIEW',
  ASSIGN_MANAGER: 'STORE_ASSIGN_MANAGER',
} as const;

export const STORE_CACHE = {
  PREFIX: 'store:',
  DETAIL: 'store:detail:',
  SLUG: 'store:slug:',
  LIST: 'store:list:',
  FEATURED: 'store:featured',
  NEARBY: 'store:nearby:',
  SEARCH: 'store:search:',
  TTL_DETAIL: 600,
  TTL_LIST: 300,
  TTL_FEATURED: 900,
  TTL_NEARBY: 90,
  TTL_SEARCH: 180,
} as const;

export const STORE_IMAGE_PATHS = {
  THUMBNAIL: 'stores/thumbnails',
  COVER: 'stores/covers',
  LOGO: 'stores/logos',
  GALLERY: 'stores/gallery',
} as const;

export const PREDEFINED_FACILITIES = [
  'Parking',
  'Wheelchair Access',
  'WiFi',
  'AC',
  'Family Seating',
  'Outdoor Seating',
  'Pet Friendly',
  'Prayer Room',
  'Charging Point',
  'Kids Area',
  'Drive Through',
] as const;

export const EARTH_RADIUS_KM = 6371;

export const DEFAULT_SEARCH_RADIUS_KM = 10;
export const MAX_SEARCH_RADIUS_KM = 100;

export const MAX_GALLERY_IMAGES = 20;
