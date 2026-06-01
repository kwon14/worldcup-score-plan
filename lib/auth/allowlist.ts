export type EmployeeRole = '일반' | '관리자' | '운영자';

export interface AllowlistEntry {
  name: string;
  employeeId: string;
  phone: string;
  role: EmployeeRole;
}

function loadAllowlist(): AllowlistEntry[] {
  const raw = process.env.EMPLOYEE_ALLOWLIST_JSON;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AllowlistEntry[];
  } catch {
    console.error('EMPLOYEE_ALLOWLIST_JSON parse error');
    return [];
  }
}

export const EMPLOYEE_ALLOWLIST: AllowlistEntry[] = loadAllowlist();
