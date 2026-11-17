import { useState } from 'react';
import { Layers, Trash2, Plus, Minus, Pencil } from 'lucide-react';
import type { StoredScenario } from '@/lib/storage';
import { formatCurrency, formatPercent } from '@/calc';
import { summarizeScenarios } from '@/calc/scenarioSummary';
import { EmptyState } from './EmptyState';

interface Props {
  scenarios: StoredScenario[];
  setScenarios: (s: StoredScenario[]) => void;
  notify: (kind: 'success' | 'error' | 'info', msg: string) => void;
  onEdit: (id: string) => void;
}

export function ComparePage({ scenarios, setScenarios, notify, onEdit }: Props) {
  const [selected, setSelected] = useState<string[]>(scenarios.slice(0, 2).map((s) => s.id));

  const toggle = (id: string) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 4) {
        notify('error', 'Chỉ so sánh được tối đa 4 kịch bản.');
        return cur;
      }
      return [...cur, id];
    });
  };

  const items = selected
    .map((id) => scenarios.find((s) => s.id === id))
    .filter((s): s is StoredScenario => !!s);
  const summary = summarizeScenarios(items);

  const metrics: { key: keyof StoredScenario['result']; label: string; fmt: (v: number, r: StoredScenario['result']) => string }[] = [
    { key: 'effectivePricePerUnit', label: 'Giá bán / sp (KM)', fmt: (v) => formatCurrency(v) },
    { key: 'promoRevenue', label: 'Doanh thu sau KM', fmt: (v) => formatCurrency(v) },
    { key: 'promoCost', label: 'Giá vốn', fmt: (v) => formatCurrency(v) },
    { key: 'promoPlatformFee', label: 'Phí nền tảng', fmt: (v) => formatCurrency(v) },
    { key: 'incrementalInvestment', label: 'Chi phí đầu tư', fmt: (v) => formatCurrency(v) },
    { key: 'promoNetProfit', label: 'LN ròng sau KM', fmt: (v) => formatCurrency(v) },
    { key: 'baselineProfit', label: 'LN cơ sở', fmt: (v) => formatCurrency(v) },
    { key: 'profitDelta', label: 'Chênh lệch LN', fmt: (v) => `${v >= 0 ? '+' : ''}${formatCurrency(v)}` },
    { key: 'profitMargin', label: 'Tỷ suất LN', fmt: (v) => formatPercent(v) },
  ];

  const best = (key: keyof StoredScenario['result'], higher = true) => {
    if (items.length === 0) return null;
    let bestIdx = 0;
    for (let i = 1; i < items.length; i++) {
      const a = items[i].result[key] as number;
      const b = items[bestIdx].result[key] as number;
      if (higher ? a > b : a < b) bestIdx = i;
    }
    return items[bestIdx].id;
  };

  const remove = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
    setSelected((cur) => cur.filter((x) => x !== id));
    notify('success', 'Đã xóa kịch bản.');
  };

  if (scenarios.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-10 w-10" />}
        title="Chưa có kịch bản để so sánh"
        hint="Lưu ít nhất 2 kịch bản ở trang Mô phỏng, sau đó quay lại đây để so sánh."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">So sánh kịch bản</h2>
        <p className="text-sm text-slate-500">Chọn 2–4 kịch bản để so sánh các chỉ số chính.</p>
      </div>

      {/* Chọn kịch bản */}
      <div className="card p-5">
        <p className="mb-3 text-sm font-medium text-slate-700">
          Kịch bản ({selected.length}/4 đã chọn)
        </p>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {on ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {items.length >= 2 ? (
        <>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="sticky left-0 bg-slate-50 px-4 py-3 font-medium">Chỉ tiêu</th>
                  {items.map((s) => (
                    <th key={s.id} className="px-4 py-3 font-medium">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-slate-700">{s.name}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => onEdit(s.id)} className="text-slate-400 hover:text-brand-600" title="Sửa">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => remove(s.id)} className="text-slate-400 hover:text-error-600" title="Xóa">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* ROI */}
                <tr className="bg-slate-50/30">
                  <td className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-800">ROI tăng thêm</td>
                  {items.map((s) => (
                    <td key={s.id} className={`px-4 py-3 font-bold ${s.id === best('roi') ? 'text-success-600' : 'text-slate-700'}`}>
                      {s.result.roi === undefined ? 'Không xác định' : formatPercent(s.result.roi * 100)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/30">
                  <td className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-800">Điểm hòa vốn</td>
                  {items.map((s) => (
                    <td key={s.id} className={`px-4 py-3 font-semibold ${s.id === best('breakEvenQuantity', false) ? 'text-success-600' : 'text-slate-700'}`}>
                      {s.result.breakEvenQuantity === undefined ? '—' : `${s.result.breakEvenQuantity.toLocaleString('vi-VN')} sp`}
                    </td>
                  ))}
                </tr>
                {metrics.map((m) => {
                  const bestId = best(m.key, m.key !== 'promoCost' && m.key !== 'promoPlatformFee' && m.key !== 'incrementalInvestment');
                  return (
                    <tr key={m.key} className="hover:bg-slate-50/50">
                      <td className="sticky left-0 bg-white px-4 py-3 font-medium text-slate-700">{m.label}</td>
                      {items.map((s) => (
                        <td key={s.id} className={`px-4 py-3 ${s.id === bestId ? 'font-bold text-success-600' : 'text-slate-700'}`}>
                          {m.fmt(s.result[m.key] as number, s.result)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {summary && (
          <section className="card border-brand-100 bg-brand-50/50 p-5" aria-labelledby="comparison-summary-title">
            <h3 id="comparison-summary-title" className="text-base font-semibold text-slate-900">Kết luận tổng hợp</h3>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <p className="rounded-xl bg-white/80 p-3 text-slate-700"><span className="font-semibold">Lợi nhuận cao nhất:</span> {summary.profitLeaders.map((s) => s.name).join(', ')} — {formatCurrency(summary.profitLeaders[0].result.promoNetProfit)}</p>
              <p className="rounded-xl bg-white/80 p-3 text-slate-700"><span className="font-semibold">Doanh thu cao nhất:</span> {summary.revenueLeaders.map((s) => s.name).join(', ')} — {formatCurrency(summary.revenueLeaders[0].result.promoRevenue)}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{summary.explanation}</p>
          </section>
        )}
        </>
      ) : (
        <EmptyState
          title="Chọn ít nhất 2 kịch bản"
          hint="Bấm các nút kịch bản ở trên để đưa vào bảng so sánh."
        />
      )}
    </div>
  );
}
