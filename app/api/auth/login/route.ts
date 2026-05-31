import { NextRequest, NextResponse } from 'next/server';
import { findAllowedEmployee, issueEmployeeToken } from '@/lib/auth/employeeAuth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const employee = findAllowedEmployee(body as Record<string, string>);
  if (!employee) {
    return NextResponse.json(
      { error: '등록된 사용자 정보와 일치하지 않습니다. 이름, 사번, 전화번호를 확인해주세요.' },
      { status: 401 }
    );
  }

  const result = await issueEmployeeToken(employee);
  return NextResponse.json(result);
}
