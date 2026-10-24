import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page may have moved, or it may not be available yet.
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
