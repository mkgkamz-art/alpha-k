/* ── Push ── */
export {
  sendPush,
  sendPushBatch,
  getVapidPublicKey,
  type PushSubscription,
  type PushPayload,
  type PushResult,
} from "./push";

/* ── Email (Resend) ── */
export {
  sendAlertEmail,
  sendDigestEmail,
  type AlertEmailData,
  type DigestEmailData,
} from "./email";

/* ── SMS (Twilio) ── */
export {
  sendAlertSms,
  getRemainingSmsByUser,
  type SmsResult,
} from "./sms";

/* ── Dispatcher ── */
export {
  dispatchNotification,
  type AlertEventPayload,
  type UserNotificationConfig,
  type DeliveryChannels,
  type DispatchResult,
} from "./dispatcher";
