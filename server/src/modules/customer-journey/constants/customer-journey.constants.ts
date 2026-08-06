export const CUSTOMER_JOURNEY_CACHE = {
  PREFIX: 'customer-journey:',
  ACTIVE: 'customer-journey:active',
  TRIGGERS: 'customer-journey:triggers:',
  RULES: 'customer-journey:rules:',
  STATE: 'customer-journey:state:',
  TTL_ACTIVE: 300,
  TTL_TRIGGERS: 300,
  TTL_STATE: 600,
} as const;

export const CUSTOMER_JOURNEY_EVENTS = {
  STARTED: 'journey.started',
  COMPLETED: 'journey.completed',
  PAUSED: 'journey.paused',
  FAILED: 'journey.failed',
  ACTION_EXECUTED: 'journey.action.executed',
  PUBLISHED: 'journey.published',
} as const;

export const CUSTOMER_JOURNEY_ERRORS = {
  NOT_FOUND: 'Journey not found',
  STEP_NOT_FOUND: 'Journey step not found',
  ACTION_NOT_FOUND: 'Journey action not found',
  DUPLICATE_SLUG: 'Journey slug already exists',
  DUPLICATE_TRIGGER: 'Journey contains duplicate triggers',
  INVALID_DATE_RANGE: 'Journey end date must be after start date',
  CANNOT_PUBLISH_EMPTY: 'Journey must have at least one trigger and one action before publishing',
  CIRCULAR_JOURNEY: 'Journey actions cannot directly trigger another journey',
  BROKEN_ACTION: 'Journey action is missing required configuration',
  INVALID_CONDITION: 'Journey condition is invalid',
  INFINITE_LOOP: 'Journey has too many actions for one execution',
  EXPIRED: 'Journey is outside its active date window',
  FUTURE_CHANNEL: 'This channel is reserved for a future provider',
} as const;

export const CUSTOMER_JOURNEY_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_ACTIONS_PER_EXECUTION: 50,
} as const;

export const CUSTOMER_JOURNEY_PERMISSIONS = {
  VIEW: 'CUSTOMER_JOURNEY_VIEW',
  CREATE: 'CUSTOMER_JOURNEY_CREATE',
  UPDATE: 'CUSTOMER_JOURNEY_UPDATE',
  PUBLISH: 'CUSTOMER_JOURNEY_PUBLISH',
  EXECUTE: 'CUSTOMER_JOURNEY_EXECUTE',
} as const;
