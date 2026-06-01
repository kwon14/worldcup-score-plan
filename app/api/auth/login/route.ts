import { NextRequest, NextResponse } from 'next/server';
import { findAllowedEmployee, issueEmployeeToken } from '@/lib/auth/employeeAuth';
import { checkRateLimit } from '@/lib/auth/rateLimiter';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const employee = findAllowedEmployee(body as Record<string, string>);
  if (!employee) {
    return NextResponse.json(
      { error: '등록된 사용자 정보와 일치하지 않습니다. 이름, 사번, 전화번호를 확인해주세요.' },
      { status: 401 }
    );
  }

  try {
    const result = await issueEmployeeToken(employee);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[login] issueEmployeeToken failed:', err);
    return NextResponse.json({ error: '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
