export const plans = {
  trial: { name: '3 天体验版', cents: 99, hours: 72 },
  month: { name: '30 天版', cents: 499, hours: 720 },
  lifetime: { name: '买断版', cents: 1200, hours: null },
} as const;
export type Plan = keyof typeof plans;
export function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && Object.hasOwn(plans, value);
}
export function price(plan: Plan) { return (plans[plan].cents / 100).toFixed(2); }
