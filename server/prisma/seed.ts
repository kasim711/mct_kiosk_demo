import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Muscat, Oman restaurant data...');

  // 1. Initial Order Sequence
  await prisma.orderSequence.upsert({
    where: { id: 'order_sequence' },
    update: {},
    create: {
      id: 'order_sequence',
      prefix: '#',
      nextNumber: 1001,
    },
  });

  // 2. Restaurant Settings (Muscat, Oman)
  await prisma.restaurantSettings.upsert({
    where: { id: 'default_settings' },
    update: {},
    create: {
      id: 'default_settings',
      restaurantNameEn: 'Muscat Grill & Burger Lounge',
      restaurantNameAr: 'مطعم ولاونج مسقط للمشاوي والبرجر',
      addressEn: 'Al Khuwair St, Muscat, Sultanate of Oman',
      addressAr: 'شارع الخوير، مسقط، سلطنة عُمان',
      phone: '+968 24 556677',
      currencyCode: 'OMR',
      currencySymbolAr: 'ر.ع.',
      isTaxEnabled: true,
      taxRatePercent: 5.0, // Oman VAT
      isTaxIncludedInPrice: true,
      receiptHeaderEn: 'Welcome to Muscat Grill & Burger Lounge',
      receiptHeaderAr: 'أهلاً بكم في مطعم ولاونج مسقط للمشاوي',
      receiptFooterEn: 'Thank you for your visit! Please pay at the counter.',
      receiptFooterAr: 'شكراً لزيارتكم الكريمة! يرجى الدفع عند الكاونتر.',
      defaultLanguage: 'en',
      idleTimeoutSeconds: 60,
      printerWidth: '80mm',
      autoPrintEnabled: true,
      networkPrinterIp: '192.168.1.200',
      networkPrinterPort: 9100,
    },
  });

  // 3. Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const managerHash = await bcrypt.hash('manager123', salt);
  const cashierHash = await bcrypt.hash('cashier123', salt);
  const kitchenHash = await bcrypt.hash('kitchen123', salt);
  const kioskHash = await bcrypt.hash('kiosk123', salt);

  const adminPin = await bcrypt.hash('1234', salt);
  const managerPin = await bcrypt.hash('5555', salt);
  const cashierPin = await bcrypt.hash('1111', salt);
  const kitchenPin = await bcrypt.hash('2222', salt);
  const kioskPin = await bcrypt.hash('0000', salt);

  const users = [
    {
      username: 'admin',
      name: 'System Admin',
      passwordHash: adminHash,
      pinHash: adminPin,
      role: 'ADMIN',
    },
    {
      username: 'manager',
      name: 'Tariq Al-Lawati',
      passwordHash: managerHash,
      pinHash: managerPin,
      role: 'MANAGER',
    },
    {
      username: 'cashier1',
      name: 'Sara Al-Balushi',
      passwordHash: cashierHash,
      pinHash: cashierPin,
      role: 'CASHIER',
    },
    {
      username: 'kitchen1',
      name: 'Chef Salim',
      passwordHash: kitchenHash,
      pinHash: kitchenPin,
      role: 'KITCHEN',
    },
    {
      username: 'kiosk',
      name: 'Kiosk Terminal',
      passwordHash: kioskHash,
      pinHash: kioskPin,
      role: 'KIOSK',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash: u.passwordHash,
        pinHash: u.pinHash,
        role: u.role,
        name: u.name,
      },
      create: u,
    });
  }

  // 4. No sample products or modifiers added to keep the environment clean.
  // Add them manually via the Admin panel.
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
