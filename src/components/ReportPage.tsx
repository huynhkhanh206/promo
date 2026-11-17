import { useRef, useState } from 'react';
import {
  FileText,
  Download,
  Upload,
  Printer,
  Filter,
  Pencil,
} from 'lucide-react';
import type { StoredScenario } from '@/lib/storage';
import { formatCurrency, formatPercent } from '@/calc';
import { EmptyState, Notice } from './EmptyState';
import { SelectField } from './fields';

interface Props {
  scenarios: StoredScenario[];
  setScenarios: (s: StoredScenario[]) => void;
  products: import('@/calc/types').Product[];
  setProducts: (p: import('@/calc/types').Product[]) => void;
  notify: (kind: 'success' | 'error' | 'info', msg: string) => void;
  onEdit: (id: string) => void;
}

export function ReportPage({ scenarios, setScenarios, products, setProducts, notify, onEdit }: Props) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = scenarios.filter((s) => {
    if (filter === 'positive') return (s.result.roi ?? 0) > 0;
    if (filter === 'negative') return (s.result.roi ?? 0) <= 0;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Tên', 'Loại', 'Giá gốc', 'Giá vốn', 'SL cơ sở', 'SL KM', 'Phí nền tảng (%)', 'Chi phí đầu tư', 'Doanh thu KM', 'LN ròng KM', 'LN cơ sở', 'Chênh lệch LN', 'ROI (%)', 'Điểm hòa vốn'];
    const rows = filtered.map((s) => [
      s.name,
      s.input.type,
      s.input.originalPrice,
      s.input.costPerUnit,
      s.input.baselineQuantity,
      s.input.promoQuantity,
      s.input.platformFeeRate,
      s.input.incrementalInvestment,
      s.result.promoRevenue,
      s.result.promoNetProfit,
      s.result.baselineProfit,
      s.result.profitDelta,
      s.result.roi === undefined ? 'Không xác định' : (s.result.roi * 100).toFixed(2),
      s.result.breakEvenQuantity ?? 'Không thể',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    download('promolab-bao-cao.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
    notify('success', 'Đã xuất CSV.');
  };

  const exportJSON = () => {
    const data = { scenarios, products, exportedAt: new Date().toISOString() };
    download('promolab-data.json', JSON.stringify(data, null, 2), 'application/json');
    notify('success', 'Đã xuất JSON.');
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (Array.isArray(parsed.scenarios)) setScenarios(parsed.scenarios);
        if (Array.isArray(parsed.products)) setProducts(parsed.products);
        notify('success', 'Đã nhập dữ liệu thành công.');
      } catch {
        notify('error', 'File JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Báo cáo</h2>
          <p className="text-sm text-slate-500">Xem, lọc, in và xuất dữ liệu kịch bản.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportCSV}>
            <Download className="h-4 w-4" /> CSV
          </button>
          <button className="btn-secondary" onClick={exportJSON}>
            <Download className="h-4 w-4" /> JSON
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Nhập JSON
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> In
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
        </div>
      </div>

      <div className="flex items-center gap-3 print:hidden">
        <Filter className="h-4 w-4 text-slate-400" />
        <div className="w-56">
          <SelectField
            label=""
            value={filter}
            options={[
              { value: 'all', label: 'Tất cả kịch bản' },
              { value: 'positive', label: 'ROI dương' },
              { value: 'negative', label: 'ROI âm / N/A' },
            ]}
            onChange={setFilter}
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} kịch bản</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Không có dữ liệu báo cáo"
          hint="Lưu kịch bản ở trang Mô phỏng để tạo báo cáo."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Kịch bản</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 text-right font-medium">Doanh thu KM</th>
                  <th className="px-4 py-3 text-right font-medium">LN ròng KM</th>
                  <th className="px-4 py-3 text-right font-medium">Chênh lệch</th>
                  <th className="px-4 py-3 text-right font-medium">ROI</th>
                  <th className="px-4 py-3 text-right font-medium">Hòa vốn</th>
                  <th className="px-4 py-3 text-right font-medium print:hidden">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.input.type === 'discount' ? 'Giảm giá' : 'Combo'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(s.result.promoRevenue)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${s.result.promoNetProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {formatCurrency(s.result.promoNetProfit)}
                    </td>
                    <td className={`px-4 py-3 text-right ${s.result.profitDelta >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {s.result.profitDelta >= 0 ? '+' : ''}{formatCurrency(s.result.profitDelta)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${s.result.roi === undefined ? 'text-slate-400' : (s.result.roi > 0 ? 'text-success-600' : 'text-error-600')}`}>
                      {s.result.roi === undefined ? 'N/A' : formatPercent(s.result.roi * 100)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {s.result.breakEvenQuantity === undefined ? '—' : `${s.result.breakEvenQuantity.toLocaleString('vi-VN')}`}
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <button onClick={() => onEdit(s.id)} className="btn-ghost" title="Sửa">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Notice>
        Khi in, chỉ nội dung bảng báo cáo được xuất ra (thanh điều hướng bị ẩn).
        Dùng Xuất JSON để sao lưu toàn bộ dữ liệu, Nhập JSON để khôi phục.
      </Notice>
    </div>
  );
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
