// Annual plan prices are monthly equivalents; keep totals and savings derived from the same data.
export function getPlanPrice(price, cycle) {
  if (typeof price.monthly !== 'number') return { amount: price.monthly, total: null, savings: 0 };
  const yearly = cycle === 'yearly' && price.monthly > 0;
  const amount = yearly ? price.yearly : price.monthly;
  return {
    amount,
    total: yearly ? Math.round(amount * 12 * 100) / 100 : null,
    savings: yearly ? Math.floor((1 - amount / price.monthly) * 100 + 0.000001) : 0,
  };
}
