import {
  TrendingUp,
  Package,
  Layers,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { Product } from '@/calc/types';
import type { StoredScenario } from '@/lib/storage';
import { formatCurrency, formatPercent } from '@/calc';
import { EmptyState } from './EmptyState';

interface Props {
  products: Product[];
  scenarios: StoredScenario[];
  goTo: (page: string) => void;
}

export function OverviewPage({ products, scenarios, goTo }: Props) {
  const totalScenarios = scenarios.length;
  const positiveRoi = scenarios.filter((s) => (s.result.roi ?? -1) > 0).length;
  const avgRoi =
    scenarios.length > 0
      ? scenarios.reduce((a, s) => a + (s.result.roi ?? 0), 0) / scenarios.length
      : 0;
  const totalProfitDelta = scenarios.reduce((a, s) => a + s.result.profitDelta, 0);

  const stats = [
    { label: 'Sản phẩm', value: products.length, icon: <Package className="h-5 w-5" />, tone: 'brand', page: 'products' },
    { label: 'Kịch bản đã lưu', value: totalScenarios, icon: <Layers className="h-5 w-5" />, tone: 'accent', page: 'simulation' },
    { label: 'Kịch bản ROI dương', value: `${positiveRoi}/${totalScenarios}`, icon: <TrendingUp className="h-5 w-5" />, tone: 'success', page: 'compare' },
    { label: 'Tổng chênh lệch LN', value: formatCurrency(totalProfitDelta), icon: <Target className="h-5 w-5" />, tone: totalProfitDelta >= 0 ? 'success' : 'error', page: 'report' },
  ];

  const recent = scenarios.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Tổng quan</h2>
        <p className="text-sm text-slate-500">
          Số liệu tổng hợp từ sản phẩm và kịch bản khuyến mãi đã lưu.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => goTo(s.page)}
            className="card group flex items-center gap-4 p-5 text-left transition hover:shadow-card-hover"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${
              s.tone === 'brand' ? 'bg-brand-600' : s.tone === 'accent' ? 'bg-accent-600' : s.tone === 'success' ? 'bg-success-600' : 'bg-error-600'
            }`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className="mt-0.5 truncate font-display text-xl font-bold text-slate-900">{s.value}</p>
            </div>
          </button>
        ))}
      </div>

      {totalScenarios > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <p className="text-xs font-medium text-slate-500">ROI tăng thêm trung bình</p>
            <p className={`mt-1 font-display text-2xl font-bold ${avgRoi >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {formatPercent(avgRoi * 100)}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-slate-500">Tỷ lệ kịch bản có ROI dương</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900">
              {totalScenarios > 0 ? Math.round((positiveRoi / totalScenarios) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Kịch bản gần đây</h3>
          {totalScenarios > 0 && (
            <button onClick={() => goTo('compare')} className="btn-ghost text-brand-600">
              Xem tất cả <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-10 w-10" />}
            title="Chưa có kịch bản nào"
            hint="Tạo kịch bản đầu tiên ở trang Mô phỏng để thấy dữ liệu tại đây."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((s) => {
              const positive = (s.result.roi ?? 0) > 0;
              return (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.input.type === 'discount' ? 'Giảm giá' : 'Combo'} · {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${s.result.profitDelta >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {s.result.profitDelta >= 0 ? '+' : ''}{formatCurrency(s.result.profitDelta)}
                    </span>
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-success-600' : 'text-error-600'}`}>
                      {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {s.result.roi === undefined ? 'N/A' : formatPercent(s.result.roi * 100)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
