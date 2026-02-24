/**
 * Paystack Integration for Nigerian Payments
 * Handles credit purchases using Paystack
 */

import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CreditPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_naira: number;
  price_kobo: number;
  currency: string;
  credits_amount: number;
  bonus_credits: number;
  total_credits: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
}

export interface PaymentInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  credits_added: number;
  new_balance: number;
}

export interface CreditBalance {
  balance: number;
  lifetime_earned: number;
  lifetime_used: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund';
  description: string;
  created_at: string;
  package_name?: string;
}

export interface CreditHistory {
  transactions: CreditTransaction[];
  total_count: number;
  page: number;
  page_size: number;
}

/**
 * Get all available credit packages
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  const response = await fetch(`${API_BASE_URL}/credits/packages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credit packages');
  }

  return response.json();
}

/**
 * Initialize a payment for credit purchase
 */
export async function initializePayment(
  packageSlug: string,
  callbackUrl?: string
): Promise<PaymentInitializeResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      package_slug: packageSlug,
      callback_url: callbackUrl || `${window.location.origin}/credits?verify=1`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to initialize payment');
  }

  return response.json();
}

/**
 * Verify a payment and add credits
 */
export async function verifyPayment(reference: string): Promise<PaymentVerifyResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/payments/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to verify payment');
  }

  return response.json();
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(): Promise<CreditBalance> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/credits/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credit balance');
  }

  return response.json();
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(page: number = 1, pageSize: number = 20): Promise<CreditHistory> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/credits/history?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credit history');
  }

  return response.json();
}

/**
 * Get credit costs for simulations
 */
export async function getCreditCosts(): Promise<{ interview: number; presentation: number }> {
  const response = await fetch(`${API_BASE_URL}/credits/costs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credit costs');
  }

  return response.json();
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(page: number = 1, pageSize: number = 20) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/payments/history?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payment history');
  }

  return response.json();
}
