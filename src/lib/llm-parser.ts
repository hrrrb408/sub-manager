export interface ParsedSubscription {
  serviceName: string;
  amount: number | null;
  currency: string | null;
  billingCycle: "monthly" | "yearly" | "weekly" | null;
  parsedDate: string | null;
  confidence: number;
}

const SYSTEM_PROMPT = `You are analyzing an email to determine if it relates to a subscription service payment or renewal.

Extract the following information if present:
- serviceName: The name of the service/product (e.g., "Netflix", "Spotify", "GitHub Copilot", "ChatGPT Plus")
- amount: The payment amount as a number
- currency: The currency code (USD, CNY, EUR, GBP, JPY, etc.)
- billingCycle: "monthly", "yearly", or "weekly" if determinable
- parsedDate: The billing/renewal date in ISO format (YYYY-MM-DD)
- confidence: Your confidence level from 0 to 1 that this is a subscription-related payment

If this email is NOT about a subscription payment/renewal/charge, respond with: {"isSubscription": false}
If it IS about a subscription, respond with: {"isSubscription": true, "serviceName": "...", "amount": ..., "currency": "...", "billingCycle": "...", "parsedDate": "...", "confidence": ...}

Respond ONLY with valid JSON, no other text.`;

export async function parseEmailWithLLM(
  subject: string,
  body: string
): Promise<ParsedSubscription | null> {
  const apiUrl = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  if (!apiUrl || !apiKey) {
    console.warn("[LLM Parser] LLM_API_URL or LLM_API_KEY not configured, skipping LLM parsing");
    return null;
  }

  const truncatedBody = body.slice(0, 2000);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Email Subject: ${subject}\n\nEmail Body:\n${truncatedBody}`,
          },
        ],
        temperature: 0,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      console.error("[LLM Parser] API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) return null;

    const parsed = JSON.parse(content);

    if (!parsed.isSubscription) return null;

    return {
      serviceName: parsed.serviceName || "Unknown",
      amount: parsed.amount ?? null,
      currency: parsed.currency ?? null,
      billingCycle: parsed.billingCycle ?? null,
      parsedDate: parsed.parsedDate ?? null,
      confidence: parsed.confidence ?? 0.5,
    };
  } catch (error) {
    console.error("[LLM Parser] Parse error:", error);
    return null;
  }
}
