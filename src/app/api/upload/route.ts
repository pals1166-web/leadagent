import { NextRequest, NextResponse } from 'next/server';
import { parseFile, normalizePhone, ParsedRow } from '@/lib/parser';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mappingStr = formData.get('mapping') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const mapping = mappingStr ? JSON.parse(mappingStr) : null;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rows = parseFile(buffer, file.name);

    if (!rows.length) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    // If no mapping provided, just return first 10 rows for preview and mapping
    if (!mapping) {
      return NextResponse.json({
        preview: rows.slice(0, 10),
        headers: Object.keys(rows[0] || {}),
      });
    }

    // Process all rows with mapping
    const validLeads = [];
    const invalidRows = [];

    for (const row of rows) {
      // Get all raw values from the row to do smart extraction
      const rowValues = Object.values(row).map(v => String(v));
      const combinedText = rowValues.join(' ').toLowerCase();

      // Smart Priority Detection
      let priority = 'Yellow'; // Default
      if (
        combinedText.includes('immediately') || 
        combinedText.includes('asap') || 
        combinedText.includes('today') || 
        combinedText.includes('hot')
      ) {
        priority = 'Green';
      } else if (
        combinedText.includes('next year') || 
        combinedText.includes('not required') || 
        combinedText.includes('rejected') || 
        combinedText.includes('language') || 
        combinedText.includes('out of') || 
        combinedText.includes('not interested')
      ) {
        priority = 'Red';
      }

      // Smart Column Detection (Handles both 'September' format and Facebook 'Scrape' format)
      let name = (mapping && row[mapping.name]) || row['full_name'] || row['Name'];
      let rawPhone = (mapping && row[mapping.phone]) || row['phone_number'] || row['Phone NO'];
      let email = row['email'] || row['Email '] || row['Email'];
      let location = (mapping && mapping.location && row[mapping.location]) || row['what_is_the_name_of_your_locality?'] || row['location'] || row['zip code'];
      let budget = (mapping && mapping.budget && row[mapping.budget]) || row['Budget disclosed by the clie'];
      let requirement = (mapping && mapping.requirement && row[mapping.requirement]) || row['Property Type'];

      // Hunt for FB dynamic questions and case-insensitive column names
      const rowKeys = Object.keys(row);
      for (const key of rowKeys) {
        const lowerKey = key.toLowerCase().trim();
        if (!name && (lowerKey.includes('name') || lowerKey === 'full_name')) name = row[key];
        if (!rawPhone && (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('contact'))) rawPhone = row[key];
        if (!email && (lowerKey.includes('email'))) email = row[key];
        if (!budget && (lowerKey.includes('budget') || lowerKey.includes('₹'))) budget = row[key];
        if (!requirement && (lowerKey.includes('own a') || lowerKey.includes('property') || lowerKey.includes('bhk'))) requirement = row[key];
        if (!location && (lowerKey.includes('zip') || lowerKey.includes('locality'))) location = row[key];
      }

      requirement = requirement || 'General Inquiry';

      // Auto-correct swapped columns (Email in Phone column, Phone in Email column)
      for (const val of rowValues) {
        if (!val) continue;
        const strVal = String(val).trim();
        
        // If it looks like an email, grab it
        if (strVal.includes('@') && strVal.includes('.')) {
          email = strVal;
        }
        
        // If we don't have a valid phone, hunt for it
        if (!rawPhone || rawPhone.includes('@') || rawPhone.toLowerCase().includes('http')) {
          const cleanNumbers = strVal.replace(/[^0-9+]/g, '');
          
          // To avoid grabbing random IDs (like Facebook IDs), we ensure it looks like a real phone
          // It must either start with '+', or 'p:', or be exactly 10 digits, or 12 digits starting with 91
          const isProbablyPhone = strVal.toLowerCase().includes('p:') || 
                                  strVal.startsWith('+') || 
                                  cleanNumbers.length === 10 || 
                                  (cleanNumbers.length === 12 && cleanNumbers.startsWith('91'));
                                  
          if (isProbablyPhone && cleanNumbers.length >= 10 && cleanNumbers.length <= 15) {
            rawPhone = cleanNumbers;
          }
        }
      }

      // If name is completely missing (because file has no headers), default to Customer
      if (!name) name = 'Customer';

      let phone;
      let status = 'new';
      let error_log = null;
      let finalPriority = priority;

      if (!rawPhone) {
        // Create a deterministic fake phone based on the row data to prevent duplicates on re-upload
        const rowHash = Buffer.from(combinedText.substring(0, 50)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
        phone = `invalid_${rowHash}`;
        status = 'failed';
        finalPriority = 'Red';
        error_log = 'Missing valid Phone Number';
      } else {
        try {
          phone = normalizePhone(String(rawPhone));
        } catch (err) {
          const rowHash = Buffer.from(combinedText.substring(0, 50)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
          phone = `invalid_${rowHash}`;
          status = 'failed';
          finalPriority = 'Red';
          error_log = 'Invalid phone number format';
        }
      }

      // Strip z: from zip codes or location if needed
      if (location && location.startsWith('z:')) location = location.replace('z:', '').trim();

      // Facebook created_time extraction for accurate month-sorting
      let created_at = new Date();
      if (row['created_time']) {
        const parsedDate = new Date(row['created_time']);
        if (!isNaN(parsedDate.getTime())) {
          created_at = parsedDate;
        }
      }

      validLeads.push({
        name: String(name),
        phone,
        email: email ? String(email) : null,
        requirement: String(requirement),
        location: location ? String(location) : null,
        budget: budget ? String(budget) : null,
        source: row['platform'] || row['ad_name'] || (mapping && mapping.source ? String(row[mapping.source]) : null),
        status, // 'new' or 'failed'
        priority: finalPriority, // The auto-detected color or 'Red'
        error_log,
        raw_data: JSON.stringify(row),
        created_at, // override default with Facebook's created_time if present
      });
    }

    // Save mapping config
    const existingConfig = await prisma.mappingConfig.findFirst({
      where: { user_id: 'admin' },
    });
    if (existingConfig) {
      await prisma.mappingConfig.update({
        where: { id: existingConfig.id },
        data: { mapping: JSON.stringify(mapping) },
      });
    } else {
      await prisma.mappingConfig.create({
        data: { user_id: 'admin', mapping: JSON.stringify(mapping) },
      });
    }

    // Bulk insert leads. Prisma sqlite doesn't have createMany skipDuplicates,
    // so we will iterate and upsert to avoid duplicate errors on unique phone.
    let inserted = 0;
    for (const lead of validLeads) {
      try {
        await prisma.lead.upsert({
          where: { phone: lead.phone },
          update: {
            name: lead.name,
            email: lead.email,
            requirement: lead.requirement,
            location: lead.location,
            budget: lead.budget,
            source: lead.source,
            status: lead.status, // Allow it to be 'failed' immediately
            priority: lead.priority,
            error_log: lead.error_log,
            raw_data: lead.raw_data, // Update raw data
          },
          create: {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            requirement: lead.requirement,
            location: lead.location,
            budget: lead.budget,
            source: lead.source,
            status: lead.status,
            priority: lead.priority,
            error_log: lead.error_log,
            raw_data: lead.raw_data,
            created_at: lead.created_at,
          },
        });
        inserted++;
      } catch (e) {
        console.error('Error upserting lead', e);
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      invalidCount: invalidRows.length,
      invalidRows: invalidRows.slice(0, 5), // Just return a few for debugging
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
