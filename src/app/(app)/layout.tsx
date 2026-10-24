import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/server/auth/session';
import UserMenu from '@/components/auth/user-menu';
import { getInitials } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getSession();

  if (!session) redirect('/sign-in');

  const { name, email } = session.user;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border/70 bg-background/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/portfolios"
            className="font-heading text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-75"
          >
            Kinfolio
          </Link>

          <UserMenu
            name={name}
            email={email}
            initials={getInitials(name, email)}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
