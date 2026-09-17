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

  // 4. Categories for Muscat Restaurant Demo
  const catBurgers = await prisma.category.upsert({
    where: { id: 'cat-burgers' },
    update: {},
    create: {
      id: 'cat-burgers',
      nameEn: 'Gourmet Burgers',
      nameAr: 'برجر غورميه فاخر',
      icon: 'beef',
      sortOrder: 1,
    },
  });

  const catSides = await prisma.category.upsert({
    where: { id: 'cat-sides' },
    update: {},
    create: {
      id: 'cat-sides',
      nameEn: 'Sides & Fries',
      nameAr: 'المقبلات والبطاطس',
      icon: 'fries',
      sortOrder: 2,
    },
  });

  const catBeverages = await prisma.category.upsert({
    where: { id: 'cat-drinks' },
    update: {},
    create: {
      id: 'cat-drinks',
      nameEn: 'Beverages & Shakes',
      nameAr: 'المشروبات والمخفوقات',
      icon: 'coffee',
      sortOrder: 3,
    },
  });

  // 5. Modifier Groups & Options
  const modBread = await prisma.modifierGroup.upsert({
    where: { id: 'mod-bread' },
    update: {},
    create: {
      id: 'mod-bread',
      nameEn: 'Bun Selection',
      nameAr: 'نوع الخبز',
      minSelect: 1,
      maxSelect: 1,
      isRequired: true,
      options: {
        create: [
          { nameEn: 'Brioche Bun', nameAr: 'خبز بريوش طازج', priceDeltaBaisa: 0, sortOrder: 1 },
          { nameEn: 'Sesame Bun', nameAr: 'خبز سمسم كلاسيكي', priceDeltaBaisa: 0, sortOrder: 2 },
          { nameEn: 'Gluten-Free Bun', nameAr: 'خبز خالي من الجلوتين', priceDeltaBaisa: 200, sortOrder: 3 },
        ],
      },
    },
  });

  const modExtras = await prisma.modifierGroup.upsert({
    where: { id: 'mod-extras' },
    update: {},
    create: {
      id: 'mod-extras',
      nameEn: 'Add-ons & Extras',
      nameAr: 'إضافات مميزة',
      minSelect: 0,
      maxSelect: 3,
      isRequired: false,
      options: {
        create: [
          { nameEn: 'Aged Cheddar Cheese', nameAr: 'شيدر معتق إضافي', priceDeltaBaisa: 300, sortOrder: 1 },
          { nameEn: 'Crispy Beef Bacon', nameAr: 'بيكون بقري مقرمش', priceDeltaBaisa: 500, sortOrder: 2 },
          { nameEn: 'Pickled Jalapeños', nameAr: 'هالبينو مخلل حار', priceDeltaBaisa: 200, sortOrder: 3 },
        ],
      },
    },
  });

  const modDrinkSize = await prisma.modifierGroup.upsert({
    where: { id: 'mod-drink-size' },
    update: {},
    create: {
      id: 'mod-drink-size',
      nameEn: 'Size',
      nameAr: 'الحجم',
      minSelect: 1,
      maxSelect: 1,
      isRequired: true,
      options: {
        create: [
          { nameEn: 'Regular (400ml)', nameAr: 'عادي (٤٠٠ مل)', priceDeltaBaisa: 0, sortOrder: 1 },
          { nameEn: 'Large (600ml)', nameAr: 'كبير (٦٠٠ مل)', priceDeltaBaisa: 400, sortOrder: 2 },
        ],
      },
    },
  });

  // 6. Products
  const products = [
    {
      id: 'prod-angus-smash',
      categoryId: catBurgers.id,
      nameEn: 'Omani Angus Smash Burger',
      nameAr: 'أنجوس سماش برجر عماني',
      descEn: 'Double premium Angus beef patty, melted cheddar, house secret sauce in toasted brioche.',
      descAr: 'شريحتان من لحم الأنجوس الفاخر مع جبن الشيدر الذائب وصلصة المطعم الخاصة في خبز البريوش.',
      priceBaisa: 2800, // 2.800 OMR
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      sortOrder: 1,
      groups: [modBread.id, modExtras.id],
    },
    {
      id: 'prod-truffle-burger',
      categoryId: catBurgers.id,
      nameEn: 'Double Truffle Beef Burger',
      nameAr: 'دبل ترافل برجر بقري',
      descEn: 'Prime beef patties glazed with black truffle aioli, Swiss cheese, and caramelized onions.',
      descAr: 'لحم بقري ممتاز مع صلصة أيولي الكمأة السوداء، جبن سويسري، وبصل مكرمل.',
      priceBaisa: 3500, // 3.500 OMR
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
      sortOrder: 2,
      groups: [modBread.id, modExtras.id],
    },
    {
      id: 'prod-crispy-chicken',
      categoryId: catBurgers.id,
      nameEn: 'Crispy Buttermilk Chicken',
      nameAr: 'برجر الدجاج المقرمش باللبن',
      descEn: 'Golden crispy chicken breast, fresh purple slaw, dill pickles, and chipotle ranch.',
      descAr: 'صدر دجاج مقلي ذهبي مقرمش، سلطة ملفوف طازجة، مخلل شبت وصلصة الرانش بالتشيبوتلي.',
      priceBaisa: 2400, // 2.400 OMR
      imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
      sortOrder: 3,
      groups: [modBread.id, modExtras.id],
    },
    {
      id: 'prod-shuwa-fries',
      categoryId: catSides.id,
      nameEn: 'Omani Shuwa Loaded Fries',
      nameAr: 'بطاطس بلحم الشواء العماني الفاخر',
      descEn: 'Crispy skin-on fries topped with slow-roasted spiced Omani Shuwa beef, garlic sauce & melted cheese.',
      descAr: 'بطاطس مقرمشة مغطاة بلحم الشواء العماني المتبل على نار هادئة، صلصة الثوم وجبن ذائب.',
      priceBaisa: 1900, // 1.900 OMR
      imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80',
      sortOrder: 4,
      groups: [],
    },
    {
      id: 'prod-halloumi-sticks',
      categoryId: catSides.id,
      nameEn: 'Crispy Halloumi Sticks',
      nameAr: 'أصابع جبنة الحلوم المقرمشة',
      descEn: 'Golden fried Cypriot halloumi sticks served with pomegranate molasses dip & fresh mint.',
      descAr: 'أصابع حلوم قبرصية مقلية ذهبية تقدم مع صلصة دبس الرمان والنعناع الطازج.',
      priceBaisa: 1500, // 1.500 OMR
      imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
      sortOrder: 5,
      groups: [],
    },
    {
      id: 'prod-pistachio-shake',
      categoryId: catBeverages.id,
      nameEn: 'Pistachio Saffron Milkshake',
      nameAr: 'ميلك شيك الفستق والزعفران',
      descEn: 'Rich artisanal pistachio gelato blended with Persian saffron, topped with crushed pistachio.',
      descAr: 'جيلاتو الفستق الحرفي المخفوق مع الزعفران الفاخر، مزين بفستق مجروش وكريمة مخفوقة.',
      priceBaisa: 1800, // 1.800 OMR
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
      sortOrder: 6,
      groups: [modDrinkSize.id],
    },
    {
      id: 'prod-spanish-latte',
      categoryId: catBeverages.id,
      nameEn: 'Iced Spanish Latte',
      nameAr: 'سبانش لاتيه مثلج',
      descEn: 'Specialty double espresso shot poured over chilled sweetened condensed milk and fresh milk.',
      descAr: 'جرعة مزدوجة من قهوة الإسبريسو المختصة مع الحليب المكثف المحلى والحليب الطازج والثلج.',
      priceBaisa: 1400, // 1.400 OMR
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
      sortOrder: 7,
      groups: [modDrinkSize.id],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        descEn: p.descEn,
        descAr: p.descAr,
        priceBaisa: p.priceBaisa,
        imageUrl: p.imageUrl,
        sortOrder: p.sortOrder,
      },
      create: {
        id: p.id,
        categoryId: p.categoryId,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        descEn: p.descEn,
        descAr: p.descAr,
        priceBaisa: p.priceBaisa,
        imageUrl: p.imageUrl,
        sortOrder: p.sortOrder,
        modifierGroups: {
          create: p.groups.map((gId) => ({ groupId: gId })),
        },
      },
    });
  }

  console.log('Seeding completed successfully with 7 premium Muscat demo products!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
