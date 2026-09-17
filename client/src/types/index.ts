export interface ModifierOption {
  id: string;
  groupId: string;
  nameEn: string;
  nameAr: string;
  priceDeltaBaisa: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  nameEn: string;
  nameAr: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: ModifierOption[];
}

export interface ProductModifierGroup {
  productId: string;
  groupId: string;
  group: ModifierGroup;
}

export interface Product {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descEn?: string | null;
  descAr?: string | null;
  priceBaisa: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  sortOrder: number;
  modifierGroups?: ProductModifierGroup[];
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  products: Product[];
}

export interface CartItem {
  id: string; // Unique cart item key (e.g. `${productId}-${optionsKey}`)
  product: Product;
  quantity: number;
  selectedOptions: ModifierOption[];
  specialNotes?: string;
  unitPriceBaisa: number;
  modifiersPriceBaisa: number;
  totalPriceBaisa: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  productNameEn: string;
  productNameAr: string;
  unitPriceBaisa: number;
  quantity: number;
  modifiersPriceBaisa: number;
  totalPriceBaisa: number;
  selectedModifiersJson: string;
  specialNotes?: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  amountBaisa: number;
  paymentMethod: 'CASH' | 'CARD' | 'OTHER';
  receivedBaisa?: number | null;
  changeBaisa?: number | null;
  cashierId?: string | null;
  cashierName?: string | null;
  notes?: string | null;
  paidAt: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: number;
  displayOrderNumber: string;
  kioskId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: string | null;
  status: OrderStatus;
  subtotalBaisa: number;
  taxBaisa: number;
  totalBaisa: number;
  customerLanguage: 'en' | 'ar';
  cancelReason?: string | null;
  cancelledByStaffId?: string | null;
  printCount: number;
  lastPrintedAt?: string | null;
  createdAt: string;
  paidAt?: string | null;
  completedAt?: string | null;
  items: OrderItem[];
  payment?: Payment | null;
}

export interface RestaurantSettings {
  restaurantNameEn: string;
  restaurantNameAr: string;
  addressEn: string;
  addressAr: string;
  phone: string;
  currencyCode: string;
  currencySymbolAr: string;
  isTaxEnabled: boolean;
  taxRatePercent: number;
  isTaxIncludedInPrice: boolean;
  receiptHeaderEn: string;
  receiptHeaderAr: string;
  receiptFooterEn: string;
  receiptFooterAr: string;
  defaultLanguage: 'en' | 'ar';
  idleTimeoutSeconds: number;
  printerWidth: '58mm' | '80mm';
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'KIOSK';
}
