import { NextRequest, NextResponse } from 'next/server';
import { updateMatchStatus, resetMatchStore, getMatchState } from '@/lib/store/matchStore';

// GET — 현재 상태 확인
export async function GET() {
  return NextResponse.json(getMatchState());
}

// POST — 상태/스코어 업데이트 또는 초기화
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'reset') {
    resetMatchStore();
    return NextResponse.json({ ok: true });
  }

  updateMatchStatus({
    status: body.status,
    koreaScore: body.koreaScore !== undefined ? Number(body.koreaScore) : undefined,
    mexicoScore: body.mexicoScore !== undefined ? Number(body.mexicoScore) : undefined,
    koreaHalfScore: body.koreaHalfScore !== undefined ? Number(body.koreaHalfScore) : undefined,
    mexicoHalfScore: body.mexicoHalfScore !== undefined ? Number(body.mexicoHalfScore) : undefined,
  });

  return NextResponse.json({ ok: true });
}
