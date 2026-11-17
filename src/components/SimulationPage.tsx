import { useMemo, useState, useEffect } from 'react';
import {
  Calculator,
  Save,
  Tag,
  Package,
  Percent,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Pencil,
  X,
  Copy,
  PackageCheck,
} from 'lucide-react';
import {
  analyzePromotion,
  formatCurrency,
  formatPercent,
} from '@/calc';
import type {
  AnalysisResult,
  ScenarioInput,
  PromotionType,
  DiscountMode,
  Product,
} from '@/calc/types';
import { NumberField, TextField } from './fields';
import type { StoredScenario } from '@/lib/storage';
import { uid } from '@/lib/storage';
import { PromotionInsights } from './PromotionInsights';

const emptyInput: ScenarioInput = {
  type: 'discount',
  originalPrice: 100000,
  costPerUnit: 60000,
  baselineQuantity: 100,
  promoQuantity: 150,
  incrementalInvestment: 5000000,
  platformFeeRate: 5,
  discount: { mode: 'percentage', value: 20 },
  combo: { itemsPerCombo: 3, comboPrice: 240000, singleItemPrice: 90000 },
};

interface Props {
  products: Product[];
  scenarios: StoredScenario[];
  setScenarios: (s: StoredScenario[]) => void;
  notify: (kind: 'success' | 'error' | 'info', msg: string) => void;
  editTargetId?: string | null;
  onEditConsumed?: () => void;
}

export function SimulationPage({ products, scenarios, setScenarios, notify, editTargetId, onEditConsumed }: Props) {
  const [input, setInput] = useState<ScenarioInput>(emptyInput);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const result = useMemo(() => analyzePromotion(input), [input]);

  // Khi được yêu cầu sửa một kịch bản (từ So sánh / Báo cáo), nạp dữ liệu lên form.
  useEffect(() => {
    if (!editTargetId) return;
    const s = scenarios.find((x) => x.id === editTargetId);
    if (!s) return;
    setInput({ ...emptyInput, ...s.input });
    setName(s.name);
    setEditingId(s.id);
    onEditConsumed?.();
  }, [editTargetId, scenarios, onEditConsumed]);

  // Nếu sản phẩm đang liên kết bị xóa khỏi danh sách, thông báo và bỏ liên kết.
  useEffect(() => {
    if (input.productId && !products.some((p) => p.id === input.productId)) {
      setInput((prev) => ({ ...prev, productId: undefined }));
      notify('info', 'Sản phẩm liên kết đã bị xóa. Đã chuyển về nhập thủ công.');
    }
  }, [products, input.productId, notify]);

  const update = <K extends keyof ScenarioInput>(k: K, v: ScenarioInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));
  const updateDiscount = (patch: Partial<NonNullable<ScenarioInput['discount']>>) =>
    setInput((p) => ({ ...p, discount: { ...p.discount!, ...patch } }));
  const updateCombo = (patch: Partial<NonNullable<ScenarioInput['combo']>>) =>
    setInput((p) => ({ ...p, combo: { ...p.combo!, ...patch } }));

  const applyProduct = (id: string) => {
    if (id === '') {
      // Chuyển về nhập thủ công: giữ nguyên các giá trị hiện tại, chỉ bỏ liên kết.
      setInput((prev) => ({ ...prev, productId: undefined }));
      notify('info', 'Đã chuyển về nhập thủ công.');
      return;
    }
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setInput((prev) => ({
      ...prev,
      productId: p.id,
      originalPrice: p.originalPrice,
      costPerUnit: p.costPerUnit,
      platformFeeRate: p.platformFeeRate,
      baselineQuantity: p.baselineQuantity,
    }));
    notify('info', `Đã áp dụng sản phẩm: ${p.name}`);
  };

  const handleSave = () => {
    const n = name.trim() || `Kịch bản ${scenarios.length + 1}`;
    if (editingId) {
      // Cập nhật kịch bản cũ theo ID hiện tại.
      const exists = scenarios.some((x) => x.id === editingId);
      if (!exists) {
        notify('error', 'Kịch bản cần sửa không còn tồn tại (có thể đã bị xóa).');
        setEditingId(null);
        return;
      }
      const updated: StoredScenario = {
        id: editingId,
        name: n,
        createdAt: scenarios.find((x) => x.id === editingId)?.createdAt ?? Date.now(),
        input: { ...input },
        result,
      };
      setScenarios(scenarios.map((s) => (s.id === editingId ? updated : s)));
      notify('success', `Đã cập nhật kịch bản "${n}".`);
    } else {
      const s: StoredScenario = {
        id: uid(),
        name: n,
        createdAt: Date.now(),
        input: { ...input },
        result,
      };
      setScenarios([s, ...scenarios]);
      notify('success', `Đã lưu kịch bản "${n}".`);
    }
    setEditingId(null);
    setName('');
  };

  const handleClone = () => {
    const n = name.trim() || `Kịch bản ${scenarios.length + 1}`;
    const s: StoredScenario = {
      id: uid(),
      name: `${n} (bản sao)`,
      createdAt: Date.now(),
      input: { ...input },
      result,
    };
    setScenarios([s, ...scenarios]);
    setEditingId(s.id);
    setName(s.name);
    notify('success', `Đã nhân bản thành kịch bản "${s.name}". Bạn đang chỉnh sửa bản sao.`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setInput(emptyInput);
    setName('');
    notify('info', 'Đã hủy chỉnh sửa. Dữ liệu cũ được giữ nguyên.');
  };

  const setType = (type: PromotionType) => update('type', type);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="card animate-slide-up p-6">
          <div className="mb-5 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-semibold text-slate-900">Thông số kịch bản</h2>
          </div>

          {/* Chọn sản phẩm */}
          <div className="mb-5">
            <ProductPicker
              products={products}
              selectedId={input.productId}
              onSelect={applyProduct}
            />
          </div>

          {/* Loại KM */}
          <div className="mb-6">
            <label className="label-field">Loại khuyến mãi</label>
            <div className="grid grid-cols-2 gap-3">
              <TypeButton active={input.type === 'discount'} onClick={() => setType('discount')} icon={<Percent className="h-4 w-4" />} label="Giảm giá" />
              <TypeButton active={input.type === 'combo'} onClick={() => setType('combo')} icon={<Package className="h-4 w-4" />} label="Combo" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Giá bán gốc / sp" unit="đ" value={input.originalPrice} onChange={(v) => update('originalPrice', v)} />
            <NumberField label="Giá vốn / sp" unit="đ" value={input.costPerUnit} onChange={(v) => update('costPerUnit', v)} />
            <NumberField label="SL bán cơ sở" unit="sp" value={input.baselineQuantity} onChange={(v) => update('baselineQuantity', v)} />
            <NumberField label="SL bán trong KM" unit="sp" value={input.promoQuantity} onChange={(v) => update('promoQuantity', v)} />
            <NumberField label="Phí nền tảng" unit="%" value={input.platformFeeRate} onChange={(v) => update('platformFeeRate', v)} />
            <NumberField label="Chi phí đầu tư tăng thêm" unit="đ" value={input.incrementalInvestment} onChange={(v) => update('incrementalInvestment', v)} hint="Không gồm giảm giá" />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            {input.type === 'discount' ? (
              <DiscountFields input={input} onUpdate={updateDiscount} />
            ) : (
              <ComboFields input={input} onUpdate={updateCombo} />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <TextField label="Tên kịch bản" value={name} onChange={setName} placeholder="VD: Flash Sale 11.11" />
            </div>
            <div className="flex flex-wrap gap-2">
              {editingId && (
                <button className="btn-secondary" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" /> Hủy
                </button>
              )}
              <button className="btn-secondary" onClick={handleClone} title="Tạo bản sao với ID mới">
                <Copy className="h-4 w-4" /> Nhân bản
              </button>
              <button className="btn-primary" onClick={handleSave}>
                <Save className="h-4 w-4" /> {editingId ? 'Lưu thay đổi' : 'Lưu kịch bản'}
              </button>
            </div>
          </div>
          {editingId && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
              <Pencil className="h-4 w-4" />
              Đang sửa kịch bản ID: <code className="font-mono">{editingId}</code>. Lưu sẽ cập nhật kịch bản này.
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <ResultPanel result={result} />
        <PromotionInsights result={result} promoQuantity={input.promoQuantity} />
        <ComparisonPanel result={result} />
      </div>
    </div>
  );
}

export function ProductPicker({
  products,
  selectedId,
  onSelect,
}: {
  products: Product[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const selected = selectedId ? products.find((p) => p.id === selectedId) : undefined;

  if (products.length === 0) return null;

  if (selected) {
    return (
      <div className="rounded-xl border border-success-200 bg-success-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-success-700">
              <PackageCheck className="h-4 w-4" /> Đã chọn sản phẩm
            </div>
            <p className="mt-1 truncate text-sm font-bold text-slate-900">{selected.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Giá bán {formatCurrency(selected.originalPrice)} · Giá vốn {formatCurrency(selected.costPerUnit)} · Phí {selected.platformFeeRate}%
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="btn-secondary !py-1.5 !text-xs"
              onClick={() => onSelect('')}
            >
              Đổi sản phẩm
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-success-200 pt-3">
          <span className="text-xs text-slate-500">Hoặc</span>
          <button
            type="button"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
            onClick={() => onSelect('')}
          >
            Chuyển về nhập thủ công
          </button>
        </div>
      </div>
    );
  }

  const options = [
    { value: '', label: '-- Nhập thủ công --' },
    ...products.map((p) => ({ value: p.id, label: p.name })),
  ];
  return (
    <div>
      <label className="label-field">Chọn sản phẩm (tùy chọn)</label>
      <select
        className="input-field"
        value=""
        onChange={(e) => onSelect(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TypeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition ${
        active ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function DiscountFields({ input, onUpdate }: { input: ScenarioInput; onUpdate: (p: Partial<NonNullable<ScenarioInput['discount']>>) => void }) {
  const mode: DiscountMode = input.discount!.mode;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Tag className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-800">Thông số giảm giá</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Kiểu giảm</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onUpdate({ mode: 'percentage' })} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${mode === 'percentage' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Theo %</button>
            <button type="button" onClick={() => onUpdate({ mode: 'fixed' })} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${mode === 'fixed' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Theo số tiền</button>
          </div>
        </div>
        <NumberField label={mode === 'percentage' ? 'Phần trăm giảm' : 'Số tiền giảm / sp'} unit={mode === 'percentage' ? '%' : 'đ'} value={input.discount!.value} onChange={(v) => onUpdate({ value: v })} />
      </div>
    </div>
  );
}

function ComboFields({ input, onUpdate }: { input: ScenarioInput; onUpdate: (p: Partial<NonNullable<ScenarioInput['combo']>>) => void }) {
  const combo = input.combo!;
  const leftover = input.promoQuantity % Math.max(combo.itemsPerCombo, 1);
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-800">Thông số combo</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Số sp / combo" unit="sp" value={combo.itemsPerCombo} onChange={(v) => onUpdate({ itemsPerCombo: v })} />
        <NumberField label="Giá combo" unit="đ" value={combo.comboPrice} onChange={(v) => onUpdate({ comboPrice: v })} />
        <NumberField label="Giá sp lẻ" unit="đ" value={combo.singleItemPrice} onChange={(v) => onUpdate({ singleItemPrice: v })} hint="Cho sp không đủ 1 combo" />
      </div>
      {leftover > 0 && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-800">
          <Info className="h-4 w-4" />
          Với {input.promoQuantity} sp và combo {combo.itemsPerCombo}: có {leftover} sp lẻ tính theo giá lẻ.
        </p>
      )}
    </div>
  );
}

export function ResultPanel({ result }: { result: AnalysisResult }) {
  const roiDisplay = result.roi === undefined ? 'Không xác định' : formatPercent(result.roi * 100);
  const roiTone = result.roi === undefined ? 'neutral' : result.roi > 0 ? 'positive' : result.roi < 0 ? 'negative' : 'neutral';
  const deltaTone = result.profitDelta > 0 ? 'positive' : result.profitDelta < 0 ? 'negative' : 'neutral';

  return (
    <div className="card animate-fade-in p-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-brand-600" />
        <h2 className="text-base font-semibold text-slate-900">Kết quả phân tích</h2>
      </div>
      <div className={`mb-4 rounded-2xl p-5 ${roiTone === 'positive' ? 'bg-gradient-to-br from-success-500 to-success-600 text-white' : roiTone === 'negative' ? 'bg-gradient-to-br from-error-500 to-error-600 text-white' : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white'}`}>
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">ROI tăng thêm</p>
        <p className="mt-1 font-display text-3xl font-extrabold">{roiDisplay}</p>
        <p className="mt-1 text-xs opacity-80">= (LN sau KM − LN cơ sở) ÷ Chi phí đầu tư tăng thêm</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="LN cơ sở" value={formatCurrency(result.baselineProfit)} tone="neutral" />
        <Metric label="LN ròng sau KM" value={formatCurrency(result.promoNetProfit)} tone={result.promoNetProfit >= result.baselineProfit ? 'positive' : 'negative'} />
        <Metric label="Chi phí đầu tư" value={formatCurrency(result.incrementalInvestment)} tone="neutral" />
        <Metric label="Chênh lệch LN" value={`${result.profitDelta >= 0 ? '+' : ''}${formatCurrency(result.profitDelta)}`} tone={deltaTone} />
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Điểm hòa vốn so sánh</p>
        {result.breakEvenQuantity === undefined ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-error-600">
            <XCircle className="h-4 w-4" /> Không thể đạt hòa vốn
          </p>
        ) : (
          <p className="mt-1 font-display text-2xl font-bold text-slate-900">
            {result.breakEvenQuantity.toLocaleString('vi-VN')} <span className="text-sm font-medium text-slate-500">sản phẩm</span>
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">SL tối thiểu trong KM để LN ròng ≥ LN cơ sở.</p>
      </div>
      {result.warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Metric({ label, value, tone }: { label: string; value: string; tone: 'positive' | 'negative' | 'neutral' }) {
  const c = tone === 'positive' ? 'text-success-600' : tone === 'negative' ? 'text-error-600' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${c}`}>{value}</p>
    </div>
  );
}

function ComparisonPanel({ result }: { result: AnalysisResult }) {
  const rows = [
    { label: 'Giá bán / sp', base: formatCurrency(result.originalPrice), promo: formatCurrency(result.effectivePricePerUnit) },
    { label: 'Doanh thu', base: formatCurrency(result.baselineRevenue), promo: formatCurrency(result.promoRevenue) },
    { label: 'Giá vốn', base: formatCurrency(result.baselineCost), promo: formatCurrency(result.promoCost) },
    { label: 'Phí nền tảng', base: formatCurrency(result.baselinePlatformFee), promo: formatCurrency(result.promoPlatformFee) },
    { label: 'Chi phí đầu tư', base: formatCurrency(0), promo: formatCurrency(result.incrementalInvestment) },
    { label: 'Lợi nhuận ròng', base: formatCurrency(result.baselineProfit), promo: formatCurrency(result.promoNetProfit) },
  ];
  const better = result.promoNetProfit >= result.baselineProfit;
  return (
    <div className="card animate-fade-in p-6">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-accent-600" />
        <h2 className="text-base font-semibold text-slate-900">So sánh hai phương án</h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-medium">Chỉ tiêu</th>
              <th className="px-4 py-2.5 font-medium">Không KM</th>
              <th className="px-4 py-2.5 font-medium">Có KM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.label} className="hover:bg-slate-50/50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{r.label}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.base}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-900">{r.promo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${better ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
        {better ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {better ? 'Khuyến mãi mang lại lợi nhuận ròng cao hơn.' : 'Không khuyến mãi đang có lợi nhuận cao hơn.'}
      </div>
    </div>
  );
}
