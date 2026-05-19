export type UserRole = 'ADMIN' | 'DECORADOR' | 'FUNCIONARIO';

export interface CurrentUser {
  sub: string;
  email: string;
  tenantUuid: string;
  role?: UserRole;
}

const decodeBase64Url = (segment: string) => {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return atob(padded + pad);
};

export const getCurrentUser = (): CurrentUser | null => {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem('access_token');
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return {
      sub: payload.sub,
      email: payload.email,
      tenantUuid: payload.tenantUuid,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const hasRole = (user: CurrentUser | null, ...roles: UserRole[]) => {
  if (!user?.role) return false;
  return roles.includes(user.role);
};
