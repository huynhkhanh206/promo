import { useState } from 'react';
import {
  TrendingUp,
  LayoutDashboard,
  Package,
  Calculator,
  GitCompareArrows,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import type { Product } from '@/calc/types';
import {
  loadProducts,
  saveProducts,
  loadScenarios,
  saveScenarios,
  type StoredScenario,
} from '@/lib/storage';
import { useToasts, ToastContainer, usePersistentState } from '@/components/Toast';
import { OverviewPage } from '@/components/OverviewPage';
import { ProductsPage } from '@/components/ProductsPage';
import { SimulationPage } from '@/components/SimulationPage';
import { ComparePage } from '@/components/ComparePage';
import { ReportPage } from '@/components/ReportPage';

type PageId = 'overview' | 'products' | 'simulation' | 'compare' | 'report';

const NAV: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'products', label: 'Sản phẩm', icon: <Package className="h-5 w-5" /> },
  { id: 'simulation', label: 'Mô phỏng', icon: <Calculator className="h-5 w-5" /> },
  { id: 'compare', label: 'So sánh', icon: <GitCompareArrows className="h-5 w-5" /> },
  { id: 'report', label: 'Báo cáo', icon: <FileText className="h-5 w-5" /> },
];

function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [scenarios, setScenarios] = useState<StoredScenario[]>(() => loadScenarios());
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  // Persist to localStorage whenever data changes.
  usePersistentState('promolab.products', products);
  usePersistentState('promolab.scenarios', scenarios);

  const setProductsAndSave = (p: Product[]) => {
    setProducts(p);
    saveProducts(p);
  };
  const setScenariosAndSave = (s: StoredScenario[]) => {
    setScenarios(s);
    saveScenarios(s);
  };

  const goTo = (p: string) => {
    setPage(p as PageId);
    setSidebarOpen(false);
  };

  const editScenario = (id: string) => {
    setEditTargetId(id);
    setPage('simulation');
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex print:hidden">
        <SidebarContent page={page} goTo={goTo} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white animate-slide-up">
            <SidebarContent page={page} goTo={goTo} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden print:hidden">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900">PromoLab</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {page === 'overview' && (
            <OverviewPage products={products} scenarios={scenarios} goTo={goTo} />
          )}
          {page === 'products' && (
            <ProductsPage
              products={products}
              setProducts={setProductsAndSave}
              notify={push}
            />
          )}
          {page === 'simulation' && (
            <SimulationPage
              products={products}
              scenarios={scenarios}
              setScenarios={setScenariosAndSave}
              notify={push}
              editTargetId={editTargetId}
              onEditConsumed={() => setEditTargetId(null)}
            />
          )}
          {page === 'compare' && (
            <ComparePage
              scenarios={scenarios}
              setScenarios={setScenariosAndSave}
              notify={push}
              onEdit={editScenario}
            />
          )}
          {page === 'report' && (
            <ReportPage
              scenarios={scenarios}
              setScenarios={setScenariosAndSave}
              products={products}
              setProducts={setProductsAndSave}
              notify={push}
              onEdit={editScenario}
            />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function SidebarContent({
  page,
  goTo,
  onClose,
}: {
  page: PageId;
  goTo: (p: string) => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-card-hover">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-slate-900">PromoLab</p>
            <p className="text-xs text-slate-500">Phân tích ROI khuyến mãi</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-ghost lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => goTo(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              page === item.id
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className={page === item.id ? 'text-brand-600' : 'text-slate-400'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400">
        Dữ liệu lưu trong trình duyệt
      </div>
    </>
  );
}

export default App;
