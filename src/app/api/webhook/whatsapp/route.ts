import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendTextMessage } from '@/lib/whatsapp';

// Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

// Webhook Event Notifications (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Handle Message Status Updates (delivered, read, failed)
          if (value.statuses && value.statuses.length > 0) {
            for (const statusObj of value.statuses) {
              const messageId = statusObj.id;
              const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
              const errorObj = statusObj.errors ? statusObj.errors[0] : null;

              if (messageId) {
                // Ignore 'sent' status if we already set it, but we can just update it
                const updateData: any = { status };
                if (errorObj) {
                  updateData.error_log = errorObj.title || errorObj.message;
                }
                
                await prisma.lead.updateMany({
                  where: { message_id: messageId },
                  data: updateData,
                });
              }
            }
          }

          // Handle Inbound Messages (Replies)
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const fromPhone = '+' + message.from; // Usually comes without '+', so we prefix it

              // We consider this a reply and mark the lead as 'replied'
              const updatedLeads = await prisma.lead.findMany({
                where: { phone: fromPhone },
              });

              if (updatedLeads.length > 0) {
                const lead = updatedLeads[0];
                // 1. Mark as replied so they turn Green on the Dashboard
                if (lead.status !== 'replied') {
                  await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: 'replied' },
                  });
                }

                // 2. The Auto-Reply Bot Logic (Sends automatically when they reply)
                let replyText = `Hi ${lead.name && lead.name !== 'Customer' ? lead.name : 'Mr/Ms'}, thank you for contacting Woodwalk. You can reach out to us on this. Please let us know your requirement. Please feel free to contact this no.`;

                // Optionally, if they keep replying, we can prevent spamming them by checking if we already marked them 'replied'.
                // But for now, we'll send it every time they talk to the bot, or we can just let it ride.
                // Let's just send the requested script.

                // 3. Fire the response back to the client
                await sendTextMessage(lead.phone, replyText);
              }
            }
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('Not a WhatsApp event', { status: 404 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    // Meta requires a 200 OK back otherwise it will retry indefinitely
    return new NextResponse('Error processed, but EVENT_RECEIVED', { status: 200 });
  }
}
