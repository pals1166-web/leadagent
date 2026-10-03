import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Fetch all leads
    const leads = await prisma.lead.findMany({
      orderBy: { created_at: 'desc' },
    });

    if (leads.length === 0) {
      return NextResponse.json({ message: 'No leads found to export' }, { status: 404 });
    }

    // Group leads by month and year
    const groupedLeads: Record<string, any[]> = {};

    leads.forEach((lead) => {
      // Create a format like "September 2026"
      const date = new Date(lead.created_at);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!groupedLeads[monthYear]) {
        groupedLeads[monthYear] = [];
      }

      // Force the output to match the client's strict "September" format precisely
      const formattedRow = {
        'Date': date.toISOString().split('T')[0],
        'Name': lead.name,
        'Email': lead.email || '',
        'Phone NO': lead.phone,
        'zip code': lead.location || '',
        'Property Type': lead.requirement || '',
        'Budget disclosed by the clie': lead.budget || '',
        'Call Timing indicated by': '', // Usually left blank for automation
        'location': lead.location || '',
        'called by': lead.source || 'Automated System',
        'Initial Call done by Team ProtonX Med': `Status: ${lead.status} | Priority: ${lead.priority} | Log: ${lead.error_log || 'None'}`,
      };

      groupedLeads[monthYear].push(formattedRow);
    });

    const workbook = XLSX.utils.book_new();

    // Create a separate sheet for each month
    for (const [monthYear, monthLeads] of Object.entries(groupedLeads)) {
      const worksheet = XLSX.utils.json_to_sheet(monthLeads);
      
      // Excel sheet names have a max length of 31 chars and cannot contain certain characters
      const safeSheetName = monthYear.substring(0, 31).replace(/[\\/?*[\]]/g, '');
      
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    }

    // Write workbook to a buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Disposition', 'attachment; filename="RealConnect_Leads.xlsx"');
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
