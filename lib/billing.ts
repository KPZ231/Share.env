export const FREE_ENVIRONMENT_LIMIT = 3;
export const FREE_WORKSPACE_LIMIT = 2;
export const PRICE_PER_ENV_USD = 2;

const CURRENCY_BY_LOCALE: Record<string, { code: string; rate: number }> = {
  en: { code: "USD", rate: 1 },
  pl: { code: "PLN", rate: 4 },
};

export function formatPrice(usd: number, locale: string) {
  const { code, rate } = CURRENCY_BY_LOCALE[locale] ?? CURRENCY_BY_LOCALE.en;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(usd * rate);
}

export function monthlyCost(environments: number) {
  return Math.max(0, environments - FREE_ENVIRONMENT_LIMIT) * PRICE_PER_ENV_USD;
}
