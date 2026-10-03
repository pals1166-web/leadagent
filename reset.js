const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.lead.updateMany({data: {status: 'new'}}).then(() => console.log('reset done'));
