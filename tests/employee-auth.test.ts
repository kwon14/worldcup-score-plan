const assert = require('node:assert/strict');

process.env.EMPLOYEE_ALLOWLIST_JSON ??= JSON.stringify([
  { name: '권오균', employeeId: '1113677', phone: '01094074295', role: '관리자' },
  { name: '이상화', employeeId: '1113492', phone: '01055867146', role: '운영자' },
  { name: '신종필', employeeId: '1110556', phone: '01020154232', role: '일반' },
  { name: '테스트1', employeeId: 'test1', phone: '01000000001', role: '일반' },
  { name: '테스트2', employeeId: 'test2', phone: '01000000002', role: '일반' },
  { name: '테스트3', employeeId: 'test3', phone: '01000000003', role: '일반' },
  { name: '테스트4', employeeId: 'test4', phone: '01000000004', role: '일반' },
  { name: '테스트5', employeeId: 'test5', phone: '01000000005', role: '일반' },
  { name: '테스트6', employeeId: 'test6', phone: '01000000006', role: '일반' },
  { name: '테스트7', employeeId: 'test7', phone: '01000000007', role: '일반' },
]);

const { EMPLOYEE_ALLOWLIST } = require('../lib/auth/allowlist');
const { findAllowedEmployee, mapEmployeeRole, normalizePhone, isAdminRole } = require('../lib/auth/employeeIdentity');

function run() {
  assert.equal(EMPLOYEE_ALLOWLIST.length, 10, '제공된 직원 10명이 allowlist에 있어야 합니다');
  assert.equal(normalizePhone('010-9407-4295'), '01094074295', '전화번호는 숫자 문자열로 정규화해야 합니다');

  const admin = findAllowedEmployee({ name: '권오균', employeeId: '1113677', phone: '01094074295' });
  assert.ok(admin, '권오균 관리자 정보가 일치해야 합니다');
  assert.equal(mapEmployeeRole(admin!.role), 'admin', '관리자는 admin role로 매핑해야 합니다');
  assert.equal(isAdminRole(mapEmployeeRole(admin!.role)), true, '관리자는 운영 권한이 있어야 합니다');

  const operator = findAllowedEmployee({ name: '이상화', employeeId: '1113492', phone: '010-5586-7146' });
  assert.ok(operator, '하이픈 포함 전화번호도 운영자 정보와 일치해야 합니다');
  assert.equal(mapEmployeeRole(operator!.role), 'operator', '운영자는 operator role로 매핑해야 합니다');
  assert.equal(isAdminRole(mapEmployeeRole(operator!.role)), true, '운영자는 운영 화면 접근 권한이 있어야 합니다');

  const member = findAllowedEmployee({ name: '신종필', employeeId: '1110556', phone: '01020154232' });
  assert.ok(member, '일반 사용자 정보가 일치해야 합니다');
  assert.equal(mapEmployeeRole(member!.role), 'member', '일반은 member role로 매핑해야 합니다');
  assert.equal(isAdminRole(mapEmployeeRole(member!.role)), false, '일반 사용자는 운영 권한이 없어야 합니다');

  assert.equal(
    findAllowedEmployee({ name: '권오균', employeeId: '1113677', phone: '01020154232' }),
    null,
    '사번은 맞아도 전화번호가 다르면 인증되면 안 됩니다'
  );
  assert.equal(
    findAllowedEmployee({ name: '권오균', employeeId: '1110556', phone: '01094074295' }),
    null,
    '이름/전화번호가 맞아도 사번이 다르면 인증되면 안 됩니다'
  );
}

run();
console.log('employee auth tests passed');
