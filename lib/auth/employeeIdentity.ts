import { EMPLOYEE_ALLOWLIST, type AllowlistEntry, type EmployeeRole } from '@/lib/auth/allowlist';

export type NormalizedRole = 'member' | 'operator' | 'admin';

export interface EmployeeAuthPayload {
  name?: string;
  employeeId?: string;
  phone?: string;
}

export function normalizeEmployeeId(employeeId: string): string {
  return employeeId.trim();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '').trim();
}

export function mapEmployeeRole(role: EmployeeRole): NormalizedRole {
  if (role === '관리자') return 'admin';
  if (role === '운영자') return 'operator';
  return 'member';
}

export function isAdminRole(role: NormalizedRole): boolean {
  return role === 'admin' || role === 'operator';
}

export function isOperatorRole(role: NormalizedRole): boolean {
  return role === 'operator';
}

export function findAllowedEmployee(payload: EmployeeAuthPayload): AllowlistEntry | null {
  const name = payload.name?.trim();
  const employeeId = payload.employeeId ? normalizeEmployeeId(payload.employeeId) : '';
  const phone = payload.phone ? normalizePhone(payload.phone) : '';

  if (!name || !employeeId || !phone) return null;

  return EMPLOYEE_ALLOWLIST.find(
    (employee) =>
      employee.name === name &&
      employee.employeeId === employeeId &&
      employee.phone === phone
  ) ?? null;
}
