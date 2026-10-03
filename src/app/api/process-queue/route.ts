import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendTemplateMessage } from '@/lib/whatsapp';

// Background processing function
async function processAllLeadsInBackground() {
  try {
    let hasMore = true;
    while (hasMore) {
      // 1. Fetch leads that are 'new' in batches of 50
      const leadsToProcess = await prisma.lead.findMany({
        where: { status: 'new' },
        take: 50,
      });

      if (leadsToProcess.length === 0) {
        hasMore = false;
        break;
      }

      // 2. Mark them as 'queued' immediately to prevent double-processing
      await prisma.lead.updateMany({
        where: { id: { in: leadsToProcess.map(l => l.id) } },
        data: { status: 'queued' }
      });

      // 3. Process the batch sequentially
      for (const lead of leadsToProcess) {
        const { success, messageId, error } = await sendTemplateMessage(lead.phone, {
          name: lead.name,
          requirement_summary: lead.requirement,
        });

        if (success) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'sent', message_id: messageId, error_log: null },
          });
        } else {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'failed', error_log: error },
          });
        }

        // Delay 100ms between sends to prevent Meta API rate limits (10 msgs/sec)
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error('Background worker error:', error);
  }
}

export async function GET() {
  try {
    const pendingCount = await prisma.lead.count({ where: { status: 'new' } });

    if (pendingCount === 0) {
      return NextResponse.json({ message: 'No new leads to process' });
    }

    // Start background processing without awaiting it
    processAllLeadsInBackground();

    return NextResponse.json({ 
      success: true, 
      message: `Started processing ${pendingCount} leads in the background. Check your dashboard for real-time status updates.` 
    });
  } catch (error) {
    console.error('Queue endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
