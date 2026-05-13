interface MoneyDisplayProps {
  amount: number | string | { toString(): string };
  currency?: string;
  className?: string;
}

export function MoneyDisplay({ amount, currency = 'DOP', className }: MoneyDisplayProps) {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  const formatted = new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);

  return (
    <span className={className}>
      {currency} {formatted}
    </span>
  );
}
