import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  Layers,
  ShoppingBag,
  BarChart3,
  Printer,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  LogOut,
  Store,
  DollarSign,
  TrendingUp,
  Clock,
  Sliders,
} from 'lucide-react';
import { Product, Category, ModifierGroup, RestaurantSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { formatOMR, sounds } from '../utils/format';
import { LanguageToggle } from '../components/shared/LanguageToggle';
import { ThermalReceiptSimulator } from '../components/shared/ThermalReceiptSimulator';

export const AdminPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings, refreshSettings } = useSettings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'categories' | 'orders' | 'reports' | 'printer' | 'settings'
  >('dashboard');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals / Simulator
  const [isTestReceiptOpen, setIsTestReceiptOpen] = useState<boolean>(false);
  const [testReceiptPayload, setTestReceiptPayload] = useState<any>(null);

  // Forms state
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [settingsForm, setSettingsForm] = useState<any>({});

  const token = localStorage.getItem('pos_token');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  // Load active tab data
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const res = await fetch('/api/admin/dashboard', { headers: authHeaders });
        if (res.ok) setDashboardData(await res.json());
      } else if (tab === 'products') {
        const res = await fetch('/api/admin/products', { headers: authHeaders });
        if (res.ok) setProducts(await res.json());
        const catRes = await fetch('/api/admin/categories', { headers: authHeaders });
        if (catRes.ok) setCategories(await catRes.json());
      } else if (tab === 'categories') {
        const res = await fetch('/api/admin/categories', { headers: authHeaders });
        if (res.ok) setCategories(await res.json());
      } else if (tab === 'orders') {
        const res = await fetch('/api/admin/orders', { headers: authHeaders });
        if (res.ok) setOrders(await res.json());
      } else if (tab === 'reports') {
        const res = await fetch('/api/admin/reports', { headers: authHeaders });
        if (res.ok) setReportsData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        sounds.playSuccess();
        await refreshSettings();
        alert('Restaurant and VAT settings saved successfully!');
      }
    } catch {
      alert('Failed to save settings');
    }
  };

  // Test Print
  const handleTestPrint = async () => {
    sounds.playTap();
    try {
      const res = await fetch('/api/admin/printer/test', {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setTestReceiptPayload(data.result);
        setIsTestReceiptOpen(true);
      }
    } catch {
      alert('Printer test failed');
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        sounds.playSuccess();
        setEditingProduct(null);
        loadTabData('products');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save product');
      }
    } catch {
      alert('Failed to save product');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        loadTabData('products');
      }
    } catch {
      alert('Failed to delete product');
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isNew = !editingCategory.id;
      const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${editingCategory.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(editingCategory),
      });

      if (res.ok) {
        sounds.playSuccess();
        setEditingCategory(null);
        loadTabData('categories');
      }
    } catch {
      alert('Failed to save category');
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col select-none">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-neutral-900 border-b border-neutral-800 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
            ADM
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">{t('adminPanel')}</h1>
            <p className="text-xs text-neutral-400">Muscat Restaurant Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle size="sm" />
          <button
            onClick={() => navigate('/staff')}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 flex items-center gap-1.5 text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <Store className="w-4 h-4 text-amber-400" />
            <span>{t('counterPOS')}</span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('pos_token');
              navigate('/login');
            }}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout with Sidebar Tabs */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 bg-neutral-900 border-r border-neutral-800 p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible flex-shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'products', label: 'Products', icon: Utensils },
            { id: 'categories', label: 'Categories', icon: Layers },
            { id: 'orders', label: 'All Orders & Audit', icon: ShoppingBag },
            { id: 'reports', label: 'Reports & Sales', icon: BarChart3 },
            { id: 'printer', label: 'Thermal Printer', icon: Printer },
            { id: 'settings', label: 'Restaurant & Tax', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playTap();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          {/* ======================================================== */}
          {/* 1. DASHBOARD TAB */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && dashboardData && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase mb-2">
                    <span>{t('todaySales')}</span>
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-2xl font-bold text-amber-400 font-mono">
                    OMR {dashboardData.summary.todaySalesOmr}
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase mb-2">
                    <span>{t('todayOrders')}</span>
                    <ShoppingBag className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-white font-mono">
                    {dashboardData.summary.todayOrdersCount}
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase mb-2">
                    <span>{t('pendingPaymentBadge')}</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-2xl font-bold text-amber-400 font-mono">
                    {dashboardData.summary.pendingOrdersCount}
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase mb-2">
                    <span>{t('completedBadge')}</span>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">
                    {dashboardData.summary.completedOrdersCount}
                  </span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                <h3 className="text-base font-bold text-white mb-6">Today's Hourly Order Flow</h3>
                <div className="h-44 flex items-end gap-2 pt-6">
                  {dashboardData.hourlyChart.hours.map((hr: string, i: number) => {
                    const count = dashboardData.hourlyChart.orders[i];
                    const maxVal = Math.max(1, ...dashboardData.hourlyChart.orders);
                    const heightPercent = Math.max(8, Math.round((count / maxVal) * 100));

                    return (
                      <div key={hr} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all ${
                            count > 0 ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                          title={`${hr}: ${count} orders`}
                        />
                        <span className="text-[10px] text-slate-500 font-mono hidden md:block">
                          {hr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. PRODUCTS TAB */}
          {/* ======================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Menu Products</h2>
                  <p className="text-xs text-slate-400">Manage dishes, descriptions, and OMR pricing</p>
                </div>

                <button
                  onClick={() =>
                    setEditingProduct({
                      nameEn: '',
                      nameAr: '',
                      descEn: '',
                      descAr: '',
                      priceBaisa: 1500,
                      categoryId: categories[0]?.id || '',
                      imageUrl: '',
                    })
                  }
                  className="py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-3.5">Item</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price (OMR)</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right rtl:text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-850/50 transition-colors">
                        <td className="p-3.5 flex items-center gap-3">
                          <img
                            src={p.imageUrl || ''}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-800"
                          />
                          <div>
                            <span className="font-semibold text-white block">{p.nameEn}</span>
                            <span className="text-neutral-400 text-[11px] block">{p.nameAr}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-neutral-300 font-medium">
                          {(p as any).category?.nameEn || 'N/A'}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-400 text-sm">
                          {formatOMR(p.priceBaisa, language)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.isAvailable
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {p.isAvailable ? 'Available' : 'Sold Out'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right rtl:text-left space-x-2">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Product Modal */}
              {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <form
                    onSubmit={handleSaveProduct}
                    className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-3.5"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                      <h3 className="font-bold text-white text-base">
                        {editingProduct.id ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Name (English)</label>
                        <input
                          required
                          value={editingProduct.nameEn || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Name (Arabic)</label>
                        <input
                          required
                          dir="rtl"
                          value={editingProduct.nameAr || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Price (in Baisa e.g. 1500 = 1.500 OMR)</label>
                        <input
                          type="number"
                          required
                          value={editingProduct.priceBaisa || 0}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, priceBaisa: parseInt(e.target.value, 10) })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                        <select
                          value={editingProduct.categoryId || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
                      <input
                        value={editingProduct.imageUrl || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Description (English)</label>
                      <textarea
                        rows={2}
                        value={editingProduct.descEn || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, descEn: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="py-2.5 px-4 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-6 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg"
                      >
                        Save Product
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. CATEGORIES TAB */}
          {/* ======================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Menu Categories</h2>
                  <p className="text-xs text-neutral-400">Add, edit, or reorder menu sections</p>
                </div>
                <button
                  onClick={() =>
                    setEditingCategory({ nameEn: '', nameAr: '', icon: 'Sandwich', sortOrder: 0 })
                  }
                  className="py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-white text-sm">{c.nameEn}</h4>
                      <p className="text-xs text-amber-400">{c.nameAr}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingCategory(c)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <form
                    onSubmit={handleSaveCategory}
                    className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-3.5"
                  >
                    <h3 className="font-bold text-white text-base">Category Details</h3>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">Name (English)</label>
                      <input
                        required
                        value={editingCategory.nameEn || ''}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, nameEn: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">Name (Arabic)</label>
                      <input
                        required
                        dir="rtl"
                        value={editingCategory.nameAr || ''}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, nameAr: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="py-2 px-3.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-xs text-neutral-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. ORDERS & AUDIT TRAIL */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-5 max-w-6xl mx-auto">
              <h2 className="text-lg font-bold text-white">All Orders & Audit Records</h2>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold border-b border-neutral-800">
                    <tr>
                      <th className="p-3.5">Order #</th>
                      <th className="p-3.5">Terminal</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Total</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-850/50">
                        <td className="p-3.5 font-bold font-mono text-white text-xs">
                          {o.displayOrderNumber}
                        </td>
                        <td className="p-3.5 text-neutral-400 font-mono">{o.kioskId}</td>
                        <td className="p-3.5 text-neutral-300">
                          {o.orderType} {o.tableNumber ? `(T${o.tableNumber})` : ''}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-amber-400">
                          {formatOMR(o.totalBaisa, language)}
                        </td>
                        <td className="p-3.5 font-semibold text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              o.status === 'PAID'
                                ? 'text-emerald-400 bg-emerald-500/15'
                                : o.status === 'PENDING_PAYMENT'
                                ? 'text-red-400 bg-red-500/15'
                                : 'text-neutral-300 bg-neutral-800'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-neutral-500 font-mono">
                          {new Date(o.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. REPORTS */}
          {/* ======================================================== */}
          {activeTab === 'reports' && reportsData && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <h2 className="text-lg font-bold text-white">Sales & Payment Reports</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                  <span className="text-xs font-semibold text-neutral-400 uppercase">Cash Revenue</span>
                  <p className="text-2xl font-bold text-amber-400 font-mono mt-2">
                    OMR {reportsData.paymentBreakdown.cashOmr}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                  <span className="text-xs font-semibold text-neutral-400 uppercase">Card (POS) Revenue</span>
                  <p className="text-2xl font-bold text-emerald-400 font-mono mt-2">
                    OMR {reportsData.paymentBreakdown.cardOmr}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                  <span className="text-xs font-semibold text-neutral-400 uppercase">Total Settled Revenue</span>
                  <p className="text-2xl font-bold text-white font-mono mt-2">
                    OMR {reportsData.totalRevenueOmr}
                  </p>
                </div>
              </div>

              {/* Top Selling Dishes */}
              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
                <h3 className="text-base font-bold text-white mb-4">Top Best-Selling Dishes</h3>
                <div className="space-y-3">
                  {reportsData.topSelling.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-white text-xs block">{item.nameEn}</span>
                          <span className="text-[11px] text-neutral-400">{item.nameAr}</span>
                        </div>
                      </div>

                      <div className="text-right rtl:text-left">
                        <span className="text-sm font-black text-amber-400 font-mono block">
                          OMR {item.revenueOmr}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.quantity} sold
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. PRINTER SETTINGS TAB */}
          {/* ======================================================== */}
          {activeTab === 'printer' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h2 className="text-2xl font-black text-white">{t('printerSettings')}</h2>
                <p className="text-xs text-neutral-400">Configure thermal ESC/POS printers and auto-print</p>
              </div>

              <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Paper Roll Width
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['58mm', '80mm'].map((width) => (
                      <button
                        key={width}
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, printerWidth: width })}
                        className={`p-3 rounded-lg border font-bold text-sm transition-all ${
                          settingsForm.printerWidth === width
                            ? 'bg-amber-500 text-neutral-950 border-amber-500'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-850'
                        }`}
                      >
                        {width} Standard Thermal
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Network Thermal Printer IP
                    </label>
                    <input
                      value={settingsForm.networkPrinterIp || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, networkPrinterIp: e.target.value })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                      placeholder="192.168.1.200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Printer Port (RAW TCP)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.networkPrinterPort || 9100}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          networkPrinterPort: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-950 border border-neutral-800">
                  <div>
                    <h4 className="font-semibold text-white text-xs">Automatic Print on Order</h4>
                    <p className="text-[11px] text-neutral-400">
                      Dispatches ESC/POS bytes directly to printer when order is created
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.autoPrintEnabled || false}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, autoPrintEnabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded accent-amber-500"
                  />
                </div>

                {/* Test Print Button */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    className="py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-amber-400 font-bold text-xs border border-neutral-700 flex items-center gap-1.5 active:scale-95 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Run Test Print Ticket</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="py-2 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs active:scale-95 transition-colors"
                  >
                    Save Printer Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. RESTAURANT & TAX SETTINGS TAB */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-5 max-w-3xl mx-auto">
              <div>
                <h2 className="text-lg font-bold text-white">{t('restaurantSettings')}</h2>
                <p className="text-xs text-neutral-400">Muscat restaurant details, Oman VAT, and idle timers</p>
              </div>

              <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-5">
                {/* Branding */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Restaurant Name (English)
                    </label>
                    <input
                      required
                      value={settingsForm.restaurantNameEn || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, restaurantNameEn: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Restaurant Name (Arabic)
                    </label>
                    <input
                      required
                      dir="rtl"
                      value={settingsForm.restaurantNameAr || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, restaurantNameAr: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Address in Muscat
                    </label>
                    <input
                      value={settingsForm.addressEn || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, addressEn: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      value={settingsForm.phone || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phone: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                </div>

                {/* VAT Configuration */}
                <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-xs">Oman VAT / Tax Calculation</h4>
                      <p className="text-[11px] text-neutral-400">
                        Enable or disable tax calculation across all kiosk and POS orders
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.isTaxEnabled || false}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, isTaxEnabled: e.target.checked })
                      }
                      className="w-5 h-5 rounded accent-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        VAT Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settingsForm.taxRatePercent || 5.0}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            taxRatePercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white font-mono outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-1">
                        <input
                          type="checkbox"
                          checked={settingsForm.isTaxIncludedInPrice || false}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              isTaxIncludedInPrice: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded accent-amber-500"
                        />
                        <span className="text-xs font-semibold text-neutral-300">
                          Prices Already Include VAT
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Idle Timeout */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Kiosk Inactivity Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.idleTimeoutSeconds || 60}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        idleTimeoutSeconds: parseInt(e.target.value, 10) || 60,
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                {/* Save */}
                <div className="pt-3 border-t border-neutral-800 flex justify-end">
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs active:scale-95 transition-colors"
                  >
                    Save All Settings
                  </button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Simulator Modal for Test Prints */}
      <ThermalReceiptSimulator
        isOpen={isTestReceiptOpen}
        receiptPayload={testReceiptPayload}
        onClose={() => setIsTestReceiptOpen(false)}
      />
    </div>
  );
};
