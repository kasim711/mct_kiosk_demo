import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

export const translations = {
  en: {
    restaurantName: 'Muscat Grill & Burger Lounge',
    restaurantTagline: 'Authentic Charcoal Grills & Gourmet Burgers in Muscat',
    welcome: 'Welcome to Muscat Grill & Cafe',
    startOrder: 'Start Your Order',
    touchToStart: 'Touch the screen to begin',
    selectLanguage: 'Choose Language / اختر اللغة',
    dineIn: 'Dine In',
    dineInDesc: 'Enjoy your meal in our restaurant',
    takeaway: 'Takeaway',
    takeawayDesc: 'Pack your food to go',
    tableNumber: 'Table Number',
    enterTableNumber: 'Enter your Table Number',
    tableRequired: 'Please enter table number',
    continue: 'Continue',
    back: 'Back',
    all: 'All Categories',
    add: 'ADD',
    addToCart: 'Add to Cart',
    updateCart: 'Update Item',
    customize: 'Customize Your Order',
    specialNotes: 'Special Instructions (e.g. extra crispy)',
    quantity: 'Quantity',
    cart: 'Your Order',
    cartEmpty: 'Your cart is empty',
    cartEmptyDesc: 'Browse our delicious menu and tap on items to add them.',
    items: 'items',
    subtotal: 'Subtotal',
    vat: 'Oman VAT',
    vatIncluded: 'VAT Included',
    total: 'Total Due',
    clearCart: 'Clear Order',
    reviewOrder: 'Review & Confirm Order',
    continueShopping: 'Add More Items',
    orderSummary: 'Order Summary',
    noPaymentAtKioskNotice: 'NO PAYMENT REQUIRED AT THIS KIOSK',
    noPaymentAtKioskDesc: 'This kiosk only creates your order. Please take your printed receipt to the counter to pay via Cash or Card.',
    confirmOrder: 'CONFIRM ORDER & PRINT RECEIPT',
    placingOrder: 'Processing your order...',
    orderSuccessTitle: 'Order Placed Successfully!',
    orderNumber: 'ORDER NUMBER',
    pendingPaymentStatus: 'PENDING PAYMENT AT COUNTER',
    orderSuccessDesc: 'Please take your printed receipt to the counter to complete your payment and collect your order from there.',
    startNewOrder: 'Start New Order',
    autoResetIn: 'Screen resetting in',
    seconds: 'seconds',
    idleWarningTitle: 'Are you still ordering?',
    idleWarningDesc: 'To protect your privacy, this kiosk will reset to the welcome screen shortly.',
    idleContinue: 'Yes, Keep Ordering',
    idleReset: 'Start Over',
    printSimulatorTitle: 'Thermal Receipt Roll',
    printReceipt: 'Print Receipt',
    reprintReceipt: 'Reprint Receipt',
    virtualPrinter: 'Virtual Thermal Printer (58/80mm)',
    counterPOS: 'Cashier Counter POS',
    kitchenKDS: 'Kitchen Display System (KDS)',
    adminPanel: 'Admin Dashboard',
    pendingPaymentBadge: 'Pending Payment',
    paidBadge: 'Paid',
    preparingBadge: 'Preparing',
    readyBadge: 'Ready for Pickup',
    completedBadge: 'Completed',
    cancelledBadge: 'Cancelled',
    markAsPaid: 'MARK AS PAID',
    cancelOrder: 'CANCEL ORDER',
    payModalTitle: 'Counter Payment Settlement',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card (POS Machine)',
    other: 'Other / Voucher',
    cashReceived: 'Cash Received (OMR)',
    changeDue: 'Change Due',
    insufficientCash: 'Received amount cannot be less than total',
    confirmPayment: 'Confirm Payment & Send to Kitchen',
    cancellationReason: 'Cancellation Reason',
    reasonRequired: 'Please specify reason for cancellation',
    customerCancelled: 'Customer cancelled order',
    wrongOrder: 'Wrong items / entered by mistake',
    productUnavailable: 'Product unavailable in kitchen',
    otherReason: 'Other reason',
    confirmCancel: 'Confirm Cancellation',
    kdsTitle: 'Active Kitchen Orders',
    elapsed: 'Elapsed',
    startPrep: 'START PREPARING',
    markReady: 'MARK READY',
    markComplete: 'HAND OVER / COMPLETE',
    noActiveKitchenTickets: 'No active kitchen tickets. Waiting for paid orders.',
    waitingForPaymentAlert: 'Orders will appear here immediately after the cashier collects payment.',
    searchOrders: 'Search by Order # or Table...',
    allKiosks: 'All Kiosks',
    filterStatus: 'All Statuses',
    todaySales: "Today's Total Sales",
    todayOrders: "Today's Orders",
    pendingOrders: 'Pending Payments',
    paidOrders: 'Paid Orders',
    averageOrder: 'Average Order Value',
    printerSettings: 'Printer Settings',
    restaurantSettings: 'Restaurant Settings',
    logout: 'Log Out',
    staffLogin: 'Staff & Admin Login',
    quickPinLogin: 'Touchscreen PIN Login',
    enterPin: 'Enter 4-Digit Staff PIN',
    username: 'Username',
    password: 'Password',
    login: 'Log In',
  },
  ar: {
    restaurantName: 'مطعم ولاونج مسقط للمشاوي والبرجر',
    restaurantTagline: 'أشهى المشاوي على الفحم والبرجر الفاخر في مسقط',
    welcome: 'أهلاً بكم في مطعم ومقهى مسقط للمشاوي',
    startOrder: 'ابدأ طلبك الآن',
    touchToStart: 'المس الشاشة للبدء في تصفح المنيو',
    selectLanguage: 'اختر اللغة / Choose Language',
    dineIn: 'تناول داخل المطعم',
    dineInDesc: 'استمتع بوجبتك على إحدى طاولاتنا',
    takeaway: 'طلب خارجي (سفري)',
    takeawayDesc: 'استلم وجبتك مغلفة وجاهزة للمنزل',
    tableNumber: 'رقم الطاولة',
    enterTableNumber: 'أدخل رقم طاولتك من فضلك',
    tableRequired: 'يرجى إدخال رقم الطاولة',
    continue: 'متابعة',
    back: 'رجوع',
    all: 'جميع الأصناف',
    add: 'إضافة',
    addToCart: 'إضافة إلى السلة',
    updateCart: 'تحديث الصنف',
    customize: 'تخصيص مكونات طلبك',
    specialNotes: 'ملاحظات خاصة للمطبخ (مثال: بدون مايونيز)',
    quantity: 'الكمية',
    cart: 'سلة طلباتك',
    cartEmpty: 'سلة الطلبات فارغة',
    cartEmptyDesc: 'تصفح قائمة الطعام اللذيذة والمس الأصناف لإضافتها.',
    items: 'أصناف',
    subtotal: 'المجموع الفرعي',
    vat: 'ضريبة القيمة المضافة',
    vatIncluded: 'الأسعار شاملة الضريبة',
    total: 'المبلغ الإجمالي',
    clearCart: 'إلغاء الطلب بالكامل',
    reviewOrder: 'مراجعة وتأكيد الطلب',
    continueShopping: 'إضافة أصناف أخرى',
    orderSummary: 'ملخص الطلب',
    noPaymentAtKioskNotice: 'لا يوجد دفع إلكتروني في هذا الجهاز',
    noPaymentAtKioskDesc: 'هذا الجهاز مخصص لاختيار الوجبات وإصدار الإيصال فقط. يرجى استلام الإيصال والتوجه للكاونتر للدفع نقداً أو بالبطاقة.',
    confirmOrder: 'تأكيد الطلب وطباعة الإيصال',
    placingOrder: 'جاري تسجيل طلبك...',
    orderSuccessTitle: 'تم تسجيل طلبك بنجاح!',
    orderNumber: 'رقم الطلب',
    pendingPaymentStatus: 'في انتظار الدفع عند الكاونتر',
    orderSuccessDesc: 'يرجى استلام الإيصال المطبوع والتوجه إلى الكاونتر لإتمام عملية الدفع واستلام طلبك من هناك.',
    startNewOrder: 'طلب جديد',
    autoResetIn: 'إعادة ضبط الشاشة تلقائياً خلال',
    seconds: 'ثواني',
    idleWarningTitle: 'هل ما زلت ترغب في إكمال طلبك؟',
    idleWarningDesc: 'لخصوصيتك، سيتم إعادة الشاشة للرئيسية وإلغاء السلة خلال لحظات.',
    idleContinue: 'نعم، أريد إكمال طلبي',
    idleReset: 'إلغاء والبدء من جديد',
    printSimulatorTitle: 'إيصال الطابعة الحرارية',
    printReceipt: 'طباعة الإيصال',
    reprintReceipt: 'إعادة طباعة الإيصال',
    virtualPrinter: 'محاكي الطابعة الحرارية (٥٨ / ٨٠ مم)',
    counterPOS: 'نقطة بيع الكاونتر (الكاشير)',
    kitchenKDS: 'شاشة تحضير المطبخ (KDS)',
    adminPanel: 'لوحة التحكم الإدارية',
    pendingPaymentBadge: 'في انتظار الدفع',
    paidBadge: 'تم الدفع',
    preparingBadge: 'قيد التحضير',
    readyBadge: 'جاهز للاستلام',
    completedBadge: 'مكتمل',
    cancelledBadge: 'ملغي',
    markAsPaid: 'تسجيل الدفع (كاشير)',
    cancelOrder: 'إلغاء الطلب',
    payModalTitle: 'تسوية الدفع عند الكاونتر',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقدي (كاش)',
    card: 'بطاقة مصرفية / جهاز نقاط البيع',
    other: 'أخرى / قسيمة',
    cashReceived: 'المبلغ المستلم من العميل (ر.ع.)',
    changeDue: 'المبلغ المتبقي للعميل (الفكة)',
    insufficientCash: 'المبلغ المستلم أقل من الإجمالي المطلوب',
    confirmPayment: 'تأكيد الدفع وإرسال للمطبخ',
    cancellationReason: 'سبب إلغاء الطلب',
    reasonRequired: 'يرجى تحديد سبب الإلغاء',
    customerCancelled: 'العميل رغب في الإلغاء',
    wrongOrder: 'طلب بالخطأ من الكشك',
    productUnavailable: 'صنف غير متوفر بالمطبخ',
    otherReason: 'سبب آخر',
    confirmCancel: 'تأكيد الإلغاء',
    kdsTitle: 'طلبات المطبخ النشطة',
    elapsed: 'المدة',
    startPrep: 'بدء التحضير',
    markReady: 'جاهز للتسليم',
    markComplete: 'تسليم واكتمال',
    noActiveKitchenTickets: 'لا توجد طلبات نشطة حالياً. في انتظار سداد الطلبات.',
    waitingForPaymentAlert: 'ستظهر الطلبات هنا فوراً بمجرد تأكيد استلام الدفع من قبل الكاشير.',
    searchOrders: 'بحث برقم الطلب أو الطاولة...',
    allKiosks: 'جميع الأجهزة',
    filterStatus: 'جميع الحالات',
    todaySales: 'إجمالي مبيعات اليوم',
    todayOrders: 'طلبات اليوم',
    pendingOrders: 'في انتظار الدفع',
    paidOrders: 'طلبات مسددة',
    averageOrder: 'متوسط قيمة الطلب',
    printerSettings: 'إعدادات الطابعة',
    restaurantSettings: 'إعدادات المطعم',
    logout: 'تسجيل الخروج',
    staffLogin: 'دخول الموظفين والإدارة',
    quickPinLogin: 'دخول سريع برمز PIN',
    enterPin: 'أدخل رمز PIN للموظف (٤ أرقام)',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('kiosk_lang', lang);
  };

  useEffect(() => {
    const saved = localStorage.getItem('kiosk_lang') as Language;
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLanguage(saved);
    } else {
      setLanguage('en');
    }
  }, []);

  const t = (key: keyof typeof translations['en']): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRtl: language === 'ar',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
