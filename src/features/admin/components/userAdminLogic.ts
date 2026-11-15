import type { AdminUser } from '../../../api/domainTypes';
import { departmentLabel } from '../../../api/departments';

export function adminRoleLabel(role: 'STUDENT' | 'LECTURER' | 'ADMIN'): string {
  switch (role) {
    case 'STUDENT':
      return 'Sinh viên';
    case 'LECTURER':
      return 'Giảng viên';
    case 'ADMIN':
      return 'Admin';
    default:
      return role;
  }
}

export function canDeleteUser(
  userId: string,
  currentUserId: string | null | undefined,
): boolean {
  if (!userId || !currentUserId) {
    return false;
  }
  return userId !== currentUserId;
}

export function formatUserSubtitle(user: AdminUser): string {
  const parts: string[] = [];
  if (!user.active) {
    parts.push('Đã khóa');
  }
  parts.push(adminRoleLabel(user.role));
  if (user.department) {
    parts.push(departmentLabel(user.department) ?? user.department);
  }
  return parts.join(' · ');
}

export function filterAdminUsers(
  users: AdminUser[],
  searchQuery: string,
): AdminUser[] {
  const term = searchQuery.trim().toLowerCase();
  if (!term) {
    return users;
  }
  return users.filter(user => {
    const nameMatch = user.fullName.toLowerCase().includes(term);
    const emailMatch = user.email.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });
}
