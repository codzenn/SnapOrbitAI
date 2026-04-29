export type UserPlan = "free" | "pro" | "pro_plus";

export interface PlanDetails {
  id: UserPlan;
  name: string;
  price: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const PLANS: PlanDetails[] = [
  {
    id: "free",
    name: "Creator",
    price: "₹0",
    features: [
      "5 Video Uploads / month",
      "5 Image Uploads / month",
      "Basic Media Library Tracking",
    ],
    cta: "Get Started Free",
  },
  {
    id: "pro",
    name: "Studio",
    price: "₹399",
    features: [
      "100 Video & Image Uploads / month",
      "Smart Social Formatting",
      "AI Background Removal",
      "Priority Email Support",
    ],
    cta: "Upgrade to Studio",
    highlighted: true,
  },
  {
    id: "pro_plus",
    name: "Production",
    price: "₹999",
    features: [
      "Unlimited Uploads",
      "AI Generative Fill (Expand)",
      "AI Reel Extraction",
      "24/7 Dedicated Support",
    ],
    cta: "Upgrade to Production",
  },
];
