/**
 * Stripe Integration
 * Payment processing for subscription plans
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripe_price_id: string;
}

/**
 * Subscription plans configuration
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic interview practice',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '3 practice interviews per month',
      'Basic feedback',
      'Text-only mode',
      'Standard response time',
    ],
    stripe_price_id: '', // Free plan doesn't need Stripe
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Unlimited access to all features',
    price: 10,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited practice interviews',
      'Unlimited presentation simulations',
      'Detailed AI feedback',
      'Voice mode enabled',
      'Priority response time',
      'Progress tracking',
      'Export results',
    ],
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  },
];

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{
  sessionId: string;
  url: string;
}> {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }

  if (plan.id === 'free') {
    throw new Error('Cannot create checkout session for free plan');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Get or create Stripe customer
 */
export async function getOrCreateCustomer(
  email: string,
  userId: string
): Promise<string> {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    return customer.id;
  } catch (error) {
    console.error('Error managing Stripe customer:', error);
    throw new Error('Failed to manage Stripe customer');
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Create billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw new Error('Failed to create billing portal session');
  }
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}
