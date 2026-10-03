# ReachmyLead

ReachmyLead is a Next.js full-stack app for automating real estate lead follow-ups via the WhatsApp Meta Cloud API.

## Prerequisites

- Node.js 18+ 
- A Meta Developer Account with WhatsApp Cloud API configured.

## Local Setup

1. **Install Dependencies:**
   Since this project uses Prisma and other utilities, install them first:
   ```bash
   npm install
   npm install prisma@5 @prisma/client@5 xlsx csv-parse lucide-react date-fns zod
   ```

2. **Initialize Database:**
   We use SQLite for local development. Push the schema to create `dev.db`:
   ```bash
   npx prisma db push
   ```

3. **Configure Environment Variables:**
   Open the `.env` file and fill in your Meta WhatsApp API credentials.

4. **Run the App:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## How to Test the Flow Locally (Without sending real messages)

1. Use the provided `sample-leads.csv` in the root folder.
2. Go to `/upload` in the app, drag & drop the CSV.
3. Map the columns (it should auto-map most of them).
4. Click **Confirm & Import**. The leads will be saved in the database with status `new`.
5. (Optional) To simulate background sending without actually calling the Meta API, you can modify `src/lib/whatsapp.ts` to just return `{ success: true, messageId: 'simulated_123' }`.
6. Go to `/api/process-queue` in your browser. This will trigger the CRON job to process the `new` leads, attempting to send the WhatsApp template message.
7. Go to `/dashboard` to see the updated statuses!

## Webhook Testing
To test the webhook (inbound replies and read receipts) from Meta:
1. Run `ngrok http 3000` to expose your local server.
2. In the Meta Dashboard, configure the Webhook URL to `https://<your-ngrok-url>/api/webhook/whatsapp` and set the verify token to match your `.env`.
