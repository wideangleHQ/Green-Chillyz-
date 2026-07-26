/**
 * DI token collecting every NotificationChannelHandler.
 * Kept in its own file so channels and the dispatcher can both import it
 * without a circular module reference.
 */
export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
