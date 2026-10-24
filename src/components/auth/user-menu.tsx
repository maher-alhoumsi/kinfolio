'use client';

import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Props {
  name: string;
  email: string;
  initials: string;
}

const UserMenu = ({ name, email, initials }: Props) => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        toast.error('Unable to sign our');
        return;
      }

      router.replace('/sign-in');
      router.refresh();
    } catch {
      toast.error('Unable to sign out', {
        description: 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Open menu for ${name}`}
        className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <p className="truncate font-medium text-foreground">{name}</p>
            <p className="truncate font-normal text-muted-foreground">
              {email}
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
