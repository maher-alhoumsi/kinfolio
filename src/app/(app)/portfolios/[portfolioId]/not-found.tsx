import Link from 'next/link';

export default function PortfolioNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        Portfolio not found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This portfolio may not exist or you may not have access to it.
      </p>
      <Link
        href="/portfolios"
        className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Back to portfolios
      </Link>
    </div>
  );
}
