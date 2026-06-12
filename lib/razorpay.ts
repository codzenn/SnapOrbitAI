import crypto from "node:crypto";

export type PaidPlan = "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export type RazorpayPlanConfig = {
  plan: PaidPlan;
  cycle: BillingCycle;
  name: string;
  description: string;
  amount: number;
  currency: "INR";
  periodMonths: number;
  totalCount: number;
  envKey: string;
};

export const RAZORPAY_PLANS = {
  pro: {
    monthly: {
      plan: "pro",
      cycle: "monthly",
      name: "Pro Monthly",
      description: "SnapOrbitAI Pro plan - monthly subscription",
      amount: 29900,
      currency: "INR",
      periodMonths: 1,
      totalCount: 1200,
      envKey: "RAZORPAY_PRO_MONTHLY_PLAN_ID",
    },
    yearly: {
      plan: "pro",
      cycle: "yearly",
      name: "Pro Yearly",
      description: "SnapOrbitAI Pro plan - yearly subscription",
      amount: 294900,
      currency: "INR",
      periodMonths: 12,
      totalCount: 100,
      envKey: "RAZORPAY_PRO_YEARLY_PLAN_ID",
    },
  },
  business: {
    monthly: {
      plan: "business",
      cycle: "monthly",
      name: "Business Monthly",
      description: "SnapOrbitAI Business plan - monthly subscription",
      amount: 79900,
      currency: "INR",
      periodMonths: 1,
      totalCount: 1200,
      envKey: "RAZORPAY_BUSINESS_MONTHLY_PLAN_ID",
    },
    yearly: {
      plan: "business",
      cycle: "yearly",
      name: "Business Yearly",
      description: "SnapOrbitAI Business plan - yearly subscription",
      amount: 844900,
      currency: "INR",
      periodMonths: 12,
      totalCount: 100,
      envKey: "RAZORPAY_BUSINESS_YEARLY_PLAN_ID",
    },
  },
} as const satisfies Record<PaidPlan, Record<BillingCycle, RazorpayPlanConfig>>;

export type RazorpaySubscription = {
  id: string;
  entity: "subscription";
  plan_id: string;
  customer_id?: string | null;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  ended_at?: number | null;
  charge_at?: number | null;
  start_at?: number | null;
  end_at?: number | null;
  total_count?: number | null;
  paid_count?: number | null;
  short_url?: string | null;
  notes?: Record<string, string | undefined> | null;
};

export type RazorpayPayment = {
  id: string;
  order_id?: string | null;
  subscription_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
};

type RazorpayErrorResponse = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
};

function getRazorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials.");
  }

  return { keyId, keySecret };
}

function getRazorpayAuthHeader() {
  const { keyId, keySecret } = getRazorpayCredentials();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as
    | T
    | RazorpayErrorResponse;

  if (!response.ok) {
    const errorData = data as RazorpayErrorResponse;
    const description =
      errorData.error?.description || errorData.error?.reason;
    throw new Error(description || "Razorpay request failed.");
  }

  return data as T;
}

export function getRazorpayPlan(
  plan: string,
  cycle: string,
): RazorpayPlanConfig | null {
  if (
    (plan !== "pro" && plan !== "business") ||
    (cycle !== "monthly" && cycle !== "yearly")
  ) {
    return null;
  }

  return RAZORPAY_PLANS[plan][cycle];
}

export function getRazorpayPlanId(config: RazorpayPlanConfig) {
  const planId = process.env[config.envKey];

  if (!planId) {
    throw new Error(`Missing ${config.envKey} environment variable.`);
  }

  return planId;
}

export function findPlanByRazorpayPlanId(planId: string) {
  for (const planGroup of Object.values(RAZORPAY_PLANS)) {
    for (const config of Object.values(planGroup)) {
      if (process.env[config.envKey] === planId) {
        return config;
      }
    }
  }

  return null;
}

export function formatInr(amountInPaise: number) {
  return `INR ${(amountInPaise / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export function getPeriodEndDate(config: RazorpayPlanConfig, from = new Date()) {
  const periodEnd = new Date(from);
  periodEnd.setMonth(periodEnd.getMonth() + config.periodMonths);
  return periodEnd;
}

export function unixToDate(timestamp: number | null | undefined) {
  return timestamp ? new Date(timestamp * 1000) : null;
}

export function getSubscriptionPeriodEnd(
  subscription: RazorpaySubscription,
  config: RazorpayPlanConfig,
) {
  return unixToDate(subscription.current_end) ?? getPeriodEndDate(config);
}

export async function createRazorpaySubscription({
  userId,
  config,
}: {
  userId: string;
  config: RazorpayPlanConfig;
}) {
  const planId = getRazorpayPlanId(config);

  const subscription = await razorpayRequest<RazorpaySubscription>(
    "/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        total_count: config.totalCount,
        quantity: 1,
        customer_notify: true,
        notes: {
          userId,
          plan: config.plan,
          cycle: config.cycle,
        },
      }),
    },
  );

  return {
    keyId: getRazorpayCredentials().keyId,
    planId,
    subscription,
  };
}

export async function fetchRazorpaySubscription(subscriptionId: string) {
  return razorpayRequest<RazorpaySubscription>(
    `/subscriptions/${subscriptionId}`,
  );
}

export function verifyRazorpaySubscriptionSignature({
  subscriptionId,
  paymentId,
  signature,
}: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = getRazorpayCredentials();
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  return safeCompare(expectedSignature, signature);
}

export function verifyRazorpayWebhookSignature({
  payload,
  signature,
}: {
  payload: string;
  signature: string;
}) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing Razorpay webhook secret.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return safeCompare(expectedSignature, signature);
}

function safeCompare(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
