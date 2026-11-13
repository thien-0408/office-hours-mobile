import type { AdminUser } from '../src/api/domainTypes';
import {
  adminRoleLabel,
  canDeleteUser,
  filterAdminUsers,
  formatUserSubtitle,
} from '../src/features/admin/components/userAdminLogic';

const mockUsers: AdminUser[] = [
  {
    id: 'user-1',
    fullName: 'TS. Nguyễn Minh Khoa',
    email: 'khoa.nm@eiu.edu.vn',
    role: 'LECTURER',
    department: 'CNTT',
    active: true,
  },
  {
    id: 'user-2',
    fullName: 'TS. Trần Thu Hà',
    email: 'ha.tt@eiu.edu.vn',
    role: 'LECTURER',
    department: 'Kinh tế',
    active: true,
  },
  {
    id: 'user-3',
    fullName: 'Phạm Gia Bảo',
    email: 'bao.pg@student.eiu.edu.vn',
    role: 'STUDENT',
    department: 'CNTT',
    active: true,
  },
  {
    id: 'user-4',
    fullName: 'Võ Minh Tuấn',
    email: 'tuan.vm@student.eiu.edu.vn',
    role: 'STUDENT',
    department: 'Kỹ thuật',
    active: false,
  },
  {
    id: 'admin-1',
    fullName: 'Quản trị viên Hệ thống',
    email: 'admin@eiu.edu.vn',
    role: 'ADMIN',
    department: null,
    active: true,
  },
];

describe('adminRoleLabel', () => {
  it('converts role codes to Vietnamese labels', () => {
    expect(adminRoleLabel('STUDENT')).toBe('Sinh viên');
    expect(adminRoleLabel('LECTURER')).toBe('Giảng viên');
    expect(adminRoleLabel('ADMIN')).toBe('Admin');
  });
});

describe('canDeleteUser', () => {
  it('prevents user from deleting themselves', () => {
    expect(canDeleteUser('user-1', 'user-1')).toBe(false);
    expect(canDeleteUser('admin-1', 'admin-1')).toBe(false);
  });

  it('allows deleting other users', () => {
    expect(canDeleteUser('user-1', 'admin-1')).toBe(true);
    expect(canDeleteUser('user-2', 'user-1')).toBe(true);
  });

  it('handles null or empty currentUserId safely', () => {
    expect(canDeleteUser('user-1', null)).toBe(false);
    expect(canDeleteUser('user-1', undefined)).toBe(false);
  });
});

describe('formatUserSubtitle', () => {
  it('formats active user with department', () => {
    expect(formatUserSubtitle(mockUsers[0])).toBe('Giảng viên · CNTT');
  });

  it('formats locked user with prefix', () => {
    expect(formatUserSubtitle(mockUsers[3])).toBe('Đã khóa · Sinh viên · Kỹ thuật');
  });

  it('formats user without department', () => {
    expect(formatUserSubtitle(mockUsers[4])).toBe('Admin');
  });
});

describe('filterAdminUsers', () => {
  it('returns all users when search query is empty', () => {
    expect(filterAdminUsers(mockUsers, '')).toEqual(mockUsers);
    expect(filterAdminUsers(mockUsers, '   ')).toEqual(mockUsers);
  });

  it('filters by name case-insensitively', () => {
    const results = filterAdminUsers(mockUsers, 'khoa');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('user-1');
  });

  it('filters by email case-insensitively', () => {
    const results = filterAdminUsers(mockUsers, 'student.eiu');
    expect(results).toHaveLength(2);
    expect(results.map(u => u.id)).toEqual(['user-3', 'user-4']);
  });

  it('returns empty array when no matches found', () => {
    expect(filterAdminUsers(mockUsers, 'nonexistent')).toHaveLength(0);
  });
});
