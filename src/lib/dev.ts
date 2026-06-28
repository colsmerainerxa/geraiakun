/**
 * Dev/demo tooling gate.
 *
 * Some UI surfaces (payment-state switcher, referral simulator, auth demo
 * banner) exist to help development/demo flows but would confuse real
 * customers. They are rendered only outside production builds.
 */
export const DEV_TOOLS = process.env.NODE_ENV !== "production"
