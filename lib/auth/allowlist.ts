export type EmployeeRole = '일반' | '관리자' | '운영자';

export interface AllowlistEntry {
  name: string;
  employeeId: string;
  phone: string;
  role: EmployeeRole;
}

export const EMPLOYEE_ALLOWLIST: AllowlistEntry[] = [
  { name: '신종필', employeeId: '1110556', phone: '01020154232', role: '일반' },
  { name: '권오균', employeeId: '1113677', phone: '01094074295', role: '관리자' },
  { name: '박영웅', employeeId: '1113474', phone: '01091439799', role: '일반' },
  { name: '이규남', employeeId: '1112911', phone: '01091329067', role: '일반' },
  { name: '이상화', employeeId: '1113492', phone: '01055867146', role: '운영자' },
  { name: '이정훈', employeeId: '1110986', phone: '01036353313', role: '일반' },
  { name: '장진아', employeeId: '1108769', phone: '01088600160', role: '일반' },
  { name: '진기훈', employeeId: '1110398', phone: '01077776601', role: '일반' },
  { name: '최성욱', employeeId: '1113867', phone: '01072957205', role: '일반' },
  { name: '최형두', employeeId: '1113083', phone: '01090285073', role: '일반' },
];
