import { api } from './client';

/** DepartmentResponse: `GET /departments` (public). `users.department` stores `code`. */
export type Department = {
  code: string;
  labelVi: string;
  labelEn: string;
};

/**
 * Same list as the backend `Department` enum, used until `GET /departments`
 * answers (offline register form, first paint). The server list wins once
 * loaded. The official EIU list is pending confirmation.
 */
export const FALLBACK_DEPARTMENTS: readonly Department[] = [
  { code: 'CIT', labelVi: 'Công nghệ Thông tin', labelEn: 'Computing & Information Technology' },
  { code: 'ENG', labelVi: 'Kỹ thuật', labelEn: 'Engineering' },
  { code: 'BUS', labelVi: 'Kinh tế – Quản trị', labelEn: 'Business' },
  { code: 'NUR', labelVi: 'Điều dưỡng', labelEn: 'Nursing' },
  { code: 'LANG', labelVi: 'Ngôn ngữ', labelEn: 'Languages' },
  { code: 'SCI', labelVi: 'Khoa học cơ bản', labelEn: 'Basic Sciences' },
  { code: 'OTHER', labelVi: 'Khác', labelEn: 'Other' },
];

/** GET /departments */
export function listDepartments(): Promise<Department[]> {
  return api.get<Department[]>('/departments');
}

/**
 * Vietnamese label for a stored department. Unknown values (legacy free text
 * written before the enum) are shown as-is; null/empty -> null.
 */
export function departmentLabel(
  code: string | null | undefined,
  list: readonly Department[] = FALLBACK_DEPARTMENTS,
): string | null {
  if (!code || !code.trim()) {
    return null;
  }
  const key = code.trim().toUpperCase();
  return list.find(d => d.code === key)?.labelVi ?? code.trim();
}
