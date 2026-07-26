export { InAppChannel } from './in-app.channel';

/**
 * Extension point — future channels land here and register themselves with
 * the dispatcher via the NOTIFICATION_CHANNELS token in notification.module.ts:
 *
 *   export { PushChannel } from './push.channel';
 *   export { EmailChannel } from './email.channel';
 *   export { WhatsAppChannel } from './whatsapp.channel';
 *   export { SmsChannel } from './sms.channel';
 *   export { WebhookChannel } from './webhook.channel';
 *
 * Each implements NotificationChannelHandler. No publisher, listener or
 * dispatcher code changes when one is added.
 */
