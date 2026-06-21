import type { PurchaseInfo } from '@/types/product';
import { formatMoney } from '@/lib/utils';

export function PriceBlock({
  purchase,
  className = '',
}: {
  purchase: PurchaseInfo;
  className?: string;
}) {
  if (purchase.priceDisplay === 'on-request' || !purchase.price) {
    return (
      <p className={`text-sm font-light uppercase tracking-luxe text-ink/70 ${className}`}>
        Price on request
      </p>
    );
  }

  const prefix = purchase.priceDisplay === 'from' ? 'From ' : '';
  return (
    <p className={`font-display text-2xl text-ink ${className}`}>
      {prefix}
      {formatMoney(purchase.price)}
    </p>
  );
}

export function FinancingNote({ purchase }: { purchase: PurchaseInfo }) {
  if (!purchase.financingEligible || !purchase.price) return null;
  const monthly = Math.round(purchase.price.amount / 12);
  return (
    <p className="text-xs font-light text-ink/60">
      or 12 interest-free instalments of{' '}
      {formatMoney({ amount: monthly, currency: purchase.price.currency })}
    </p>
  );
}
