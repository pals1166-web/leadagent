// WhatsApp Meta API integration

export interface TemplateMessageParams {
  name: string;
  requirement_summary: string;
}

export async function sendTemplateMessage(
  toPhone: string,
  params: TemplateMessageParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('WhatsApp credentials are not configured in environment variables.');
    return { success: false, error: 'Missing credentials' };
  }

  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  // As per requirement:
  // "Hi {{1}}, thank you for contacting us regarding your enquiry for {{2}}. What time would be convenient for you to connect? We would be happy to help you with the available options."
  const payload = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'template',
    template: {
      name: 'hello_world', // Using default template for guaranteed first test
      language: {
        code: 'en_US',
      }
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error sending WhatsApp message:', data);
      return { success: false, error: data.error?.message || 'Unknown Meta API error' };
    }

    // Typical successful response format:
    // {
    //   "messaging_product": "whatsapp",
    //   "contacts": [{ "input": "...", "wa_id": "..." }],
    //   "messages": [{ "id": "wamid.HBg..." }]
    // }
    const messageId = data.messages?.[0]?.id;

    return { success: true, messageId };
  } catch (error) {
    console.error('Exception sending WhatsApp message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Exception' };
  }
}

export async function sendTextMessage(
  toPhone: string,
  textMessage: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    return { success: false, error: 'Missing credentials' };
  }

  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'text',
    text: {
      body: textMessage
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error sending WA Text:', data);
      return { success: false, error: data.error?.message };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Exception' };
  }
}
