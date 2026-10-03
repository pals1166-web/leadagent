const XLSX = require('xlsx');

const rawData = [
  {
    Name: 'Mr. Rahul Sharma',
    Phone: '917550110983',
    Requirement: '2 BHK house',
    Location: 'Kormangala',
    Budget: '₹50L',
    Source: 'Direct Upload'
  },
  {
    Name: 'Ms. Priya Nair',
    Phone: '917400000077',
    Requirement: '3 BHK apartment',
    Location: 'Whitefield',
    Budget: '₹80L',
    Source: 'Direct Upload'
  },
  {
    Name: 'Mrs. Garima Verma',
    Phone: '12345',
    Requirement: '2 BHK flat',
    Location: 'Indiranagar',
    Budget: '₹60L',
    Source: 'Direct Upload'
  },
  {
    Name: 'Dr. Neha Rao',
    Phone: '9000000004',
    Requirement: '1 BHK',
    Location: 'Hebbal',
    Budget: '₹35L',
    Source: 'Direct Upload'
  }
];

const worksheet = XLSX.utils.json_to_sheet(rawData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Leads');

XLSX.writeFile(workbook, 'D:\\ReachmyLimit\\Antigravity_Lead\\cleaned_user_leads.xlsx');
console.log('Successfully created cleaned_user_leads.xlsx');
