import Link from 'next/link';
import { ArrowUpRight, CircleCheck } from 'lucide-react';

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({ children, eyebrow, title, description }: Props) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-sidebar-primary/20" />
        <div className="absolute -bottom-36 -left-28 size-96 rounded-full border border-sidebar-primary/10" />
        <Link
          href="/"
          className="relative flex items-center gap-3 text-lg font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            K
          </span>
          Kinfolio
        </Link>

        <div className="relative max-w-sm space-y-7">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sidebar-primary">
              Your money, in focus
            </p>
            <h2 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight">
              Build a life you&apos;re proud to fund.
            </h2>
            <p className="leading-7 text-sidebar-foreground/65">
              Kinfolio brings your accounts, goals, and progress into one calm,
              clear view.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-sidebar-foreground/75">
            {[
              'See your full financial picture',
              'Stay close to what matters',
              'Make confident next moves',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CircleCheck className="size-4 text-sidebar-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-sidebar-foreground/40">
          Thoughtful tools for your next chapter.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                K
              </span>
              Kinfolio
            </Link>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </div>

          <div className="mb-8 space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
