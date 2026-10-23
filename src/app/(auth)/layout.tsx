import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
}

const AuthLayout = async ({ children }: Props) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect('/');

  return <>{children}</>;
};

export default AuthLayout;
