import { type AllowlistEntry, type EmployeeRole } from '@/lib/auth/allowlist';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { findAllowedEmployee, isAdminRole, isOperatorRole, mapEmployeeRole, type EmployeeAuthPayload, type NormalizedRole } from '@/lib/auth/employeeIdentity';

export { findAllowedEmployee, isAdminRole, isOperatorRole, mapEmployeeRole };
export type { EmployeeAuthPayload, NormalizedRole };

export interface EmployeeAuthResult {
  customToken: string;
  name: string;
  role: NormalizedRole;
  roleLabel: EmployeeRole;
  employeeId: string;
}

export async function issueEmployeeToken(employee: AllowlistEntry): Promise<EmployeeAuthResult> {
  const adminDb = getAdminDb();
  const adminAuth = getAdminAuth();
  const uid = `employee_${employee.employeeId}`;
  const role = mapEmployeeRole(employee.role);
  const claims = {
    name: employee.name,
    role,
    roleLabel: employee.role,
    employeeId: employee.employeeId,
    admin: isAdminRole(role),
    operator: isOperatorRole(role),
  };

  await adminAuth.updateUser(uid, {
    displayName: employee.name,
  }).catch((err: { code?: string }) => {
    if (err.code !== 'auth/user-not-found') throw err;
    return adminAuth.createUser({ uid, displayName: employee.name });
  });

  await adminAuth.setCustomUserClaims(uid, claims);
  await adminDb.collection('employees').doc(employee.employeeId).set({
    name: employee.name,
    employeeId: employee.employeeId,
    phone: employee.phone,
    role,
    roleLabel: employee.role,
    uid,
    updatedAt: new Date(),
  }, { merge: true });

  const customToken = await adminAuth.createCustomToken(uid, claims);
  return {
    customToken,
    name: employee.name,
    role,
    roleLabel: employee.role,
    employeeId: employee.employeeId,
  };
}
