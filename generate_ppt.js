const PptxGenJS = require('pptxgenjs');

let pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';

// Slide 1: Title
let slide1 = pptx.addSlide();
slide1.addText('RealConnect: Automated Real Estate Outreach', { x: 1.0, y: 0.5, w: 8, h: 1, fontSize: 36, bold: true, color: '003366', align: 'center' });
slide1.addText('Stop wasting time cold-calling. Start having conversations.', { x: 1.0, y: 1.5, w: 8, h: 1, fontSize: 20, color: '666666', align: 'center' });
slide1.addImage({ path: 'C:/Users/avina/.gemini/antigravity/brain/21707698-d47a-4355-8caa-b9ea17e27f9f/.user_uploaded/media_1790622673833.png', x: 2, y: 2.5, w: 6, h: 4 });

// Slide 2: Excel
let slide2 = pptx.addSlide();
slide2.addText('1. Import Your Leads', { x: 0.5, y: 0.5, w: 8, h: 0.8, fontSize: 28, bold: true, color: '003366' });
slide2.addText('Take your daily leads from property portals or ad campaigns and format them into a simple Excel sheet.', { x: 0.5, y: 1.2, w: 9, h: 0.8, fontSize: 18, color: '333333' });
slide2.addImage({ path: 'C:/Users/avina/.gemini/antigravity/brain/21707698-d47a-4355-8caa-b9ea17e27f9f/.user_uploaded/media_1790622648193.png', x: 0.5, y: 2.2, w: 9, h: 4.5 });

// Slide 3: Upload
let slide3 = pptx.addSlide();
slide3.addText('2. Upload to the Portal', { x: 0.5, y: 0.5, w: 8, h: 0.8, fontSize: 28, bold: true, color: '003366' });
slide3.addText('Simply drag and drop your sheet into the RealConnect platform.', { x: 0.5, y: 1.2, w: 9, h: 0.8, fontSize: 18, color: '333333' });
slide3.addImage({ path: 'C:/Users/avina/.gemini/antigravity/brain/21707698-d47a-4355-8caa-b9ea17e27f9f/.user_uploaded/media_1790622691320.png', x: 1, y: 2.2, w: 8, h: 4 });

// Slide 4: Dashboard
let slide4 = pptx.addSlide();
slide4.addText('3. Automated Campaign Execution', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: '003366' });
slide4.addText('Our system automatically fires personalized WhatsApp messages to every valid number. Track successes and failures instantly.', { x: 0.5, y: 1.2, w: 9, h: 0.8, fontSize: 18, color: '333333' });
slide4.addImage({ path: 'C:/Users/avina/.gemini/antigravity/brain/21707698-d47a-4355-8caa-b9ea17e27f9f/.user_uploaded/media_1790622819212.png', x: 0.5, y: 2.2, w: 9, h: 4.5 });

// Slide 5: WhatsApp
let slide5 = pptx.addSlide();
slide5.addText('4. Instant Delivery to Client Phones', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: '003366' });
slide5.addText('Your leads receive an official, automated WhatsApp message instantly, keeping your brand top-of-mind.', { x: 0.5, y: 1.2, w: 9, h: 0.8, fontSize: 18, color: '333333' });
// WhatsApp screenshot is tall, scale it appropriately
slide5.addImage({ path: 'C:/Users/avina/.gemini/antigravity/brain/21707698-d47a-4355-8caa-b9ea17e27f9f/.user_uploaded/media_1790622901605.png', x: 3.5, y: 2.2, w: 2.5, h: 4.5 });

pptx.writeFile({ fileName: 'D:/ReachmyLimit/Antigravity_Lead/RealConnect_Pitch.pptx' })
  .then(() => {
    console.log('PPT Created!');
  })
  .catch(err => {
    console.error(err);
  });
