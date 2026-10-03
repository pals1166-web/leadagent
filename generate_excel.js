const XLSX = require('xlsx');

const data = [
  { Name: 'John Doe', Phone: '+12345678901', Requirement: '3 BHK Apartment', Location: 'Downtown', Budget: '$500,000', Source: 'Facebook Ads' },
  { Name: 'Jane Smith', Phone: '+19876543210', Requirement: '2 BHK Condo', Location: 'Uptown', Budget: '$350,000', Source: 'Google Ads' },
  { Name: 'Mike Johnson', Phone: '+11223344556', Requirement: 'Luxury Villa', Location: 'Suburbs', Budget: '$1,200,000', Source: 'Organic Search' },
  { Name: 'Emily Davis', Phone: '+15556667777', Requirement: 'Studio', Location: 'City Center', Budget: '$200,000', Source: 'Referral' },
  { Name: 'Chris Wilson', Phone: '+19998887777', Requirement: 'Commercial Space', Location: 'Business District', Budget: '$800,000', Source: 'Instagram Ads' },
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

XLSX.writeFile(workbook, 'dummy_leads.xlsx');
console.log('Successfully created dummy_leads.xlsx');
