import { NextRequest, NextResponse } from "next/server";

const RATES_CACHE: { rates: Record<string, number>; timestamp: number } = {
  rates: {},
  timestamp: 0,
};

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function fetchRates(base: string): Promise<Record<string, number>> {
  const now = Date.now();
  if (RATES_CACHE.rates[base] && now - RATES_CACHE.timestamp < CACHE_TTL) {
    return RATES_CACHE.rates;
  }

  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      RATES_CACHE.rates = data.rates;
      RATES_CACHE.timestamp = now;
      return data.rates;
    }
  } catch {
    // Fallback: return empty
  }

  // Fallback static rates (approximate)
  const fallback: Record<string, Record<string, number>> = {
    USD: { USD: 1, EUR: 0.92, GBP: 0.79, CNY: 7.24, JPY: 154.5 },
    CNY: { USD: 0.14, EUR: 0.13, GBP: 0.11, CNY: 1, JPY: 21.3 },
  };
  return fallback[base] || { [base]: 1 };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base") || "USD";
  const rates = await fetchRates(base);
  return NextResponse.json({ base, rates });
}
