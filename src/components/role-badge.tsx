import { Badge } from '@/components/ui/badge';
import type { Role } from '@/lib/roles';

interface RoleBadgeProps {
  role: Role;
}

const roleLabels: Record<Role, string> = {
  OWNER: 'Owner',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
};

const roleVariants: Record<
  Role,
  'default' | 'secondary' | 'outline'
> = {
  OWNER: 'default',
  EDITOR: 'secondary',
  VIEWER: 'outline',
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return <Badge variant={roleVariants[role]}>{roleLabels[role]}</Badge>;
}
