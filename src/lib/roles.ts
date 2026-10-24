export const ROLES = ['OWNER', 'EDITOR', 'VIEWER'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export const hasAtLeast = (role: Role, requiredRole: Role): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[requiredRole];
