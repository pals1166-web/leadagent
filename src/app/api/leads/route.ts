import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const requirement = searchParams.get('requirement');

  try {
    const whereClause: any = {};
    if (status && status !== 'all') whereClause.status = status;
    if (requirement) whereClause.requirement = { contains: requirement }; // contains doesn't exist in sqlite by default without lowercasing, but it's ok for MVP.

    const leads = await prisma.lead.findMany({
      where: whereClause,
      orderBy: { updated_at: 'desc' },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
