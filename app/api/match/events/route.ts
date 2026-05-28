import { NextRequest, NextResponse } from 'next/server';
import { addGoal, removeGoal, addCard, removeCard } from '@/lib/store/matchStore';
import type { GoalEvent, CardEvent } from '@/types/match';

// POST /api/match/events  { action: 'add_goal' | 'remove_goal' | 'add_card' | 'remove_card', ... }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'add_goal': {
      const goal: GoalEvent = {
        time: Number(body.time),
        extraTime: body.extraTime ? Number(body.extraTime) : null,
        side: body.side,
        teamName: body.teamName,
        scorer: body.scorer,
        assist: body.assist || null,
        type: body.type ?? 'normal',
      };
      const id = addGoal(goal);
      return NextResponse.json({ ok: true, id });
    }

    case 'remove_goal':
      removeGoal(body.id);
      return NextResponse.json({ ok: true });

    case 'add_card': {
      const card: CardEvent = {
        time: Number(body.time),
        side: body.side,
        teamName: body.teamName,
        player: body.player,
        cardType: body.cardType,
      };
      const id = addCard(card);
      return NextResponse.json({ ok: true, id });
    }

    case 'remove_card':
      removeCard(body.id);
      return NextResponse.json({ ok: true });

    default:
      return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 });
  }
}
