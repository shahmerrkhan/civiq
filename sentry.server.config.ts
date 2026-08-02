// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3eff1bda899ec208ccea8579af138251@o4511516462874624.ingest.us.sentry.io/4511516465823744",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Do not ship user PII (IPs, headers, cookies, request bodies) to Sentry.
  sendDefaultPii: false,
});
