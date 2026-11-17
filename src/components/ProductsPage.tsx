import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  X,
} from 'lucide-react';
import type { Product } from '@/calc/types';
import { formatCurrency } from '@/calc';
import { uid } from '@/lib/storage';
import { EmptyState, Notice } from './EmptyState';
import { NumberField } from './fields';

interface Props {
  products: Product[];
  setProducts: (p: Product[]) => void;
  notify: (kind: 'success' | 'error' | 'info', msg: string) => void;
}

const empty: Omit<Product, 'id' | 'createdAt'> = {
  name: '',
  originalPrice: 0,
  costPerUnit: 0,
  platformFeeRate: 5,
  baselineQuantity: 100,
};

export function ProductsPage({ products, setProducts, notify }: Props) {
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState({ ...empty });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const openNew = () => {
    setEditing(null);
    setDraft({ ...empty });
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setDraft({
      name: p.name,
      originalPrice: p.originalPrice,
      costPerUnit: p.costPerUnit,
      platformFeeRate: p.platformFeeRate,
      baselineQuantity: p.baselineQuantity,
    });
    setModalOpen(true);
  };
  const close = () => {
    setModalOpen(false);
    setEditing(null);
    setDraft({ ...empty });
  };

  const save = () => {
    if (!draft.name.trim()) {
      notify('error', 'Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (editing) {
      setProducts(
        products.map((p) =>
          p.id === editing.id ? { ...p, ...draft } : p,
        ),
      );
      notify('success', 'Đã cập nhật sản phẩm.');
    } else {
      const p: Product = { ...draft, id: uid(), createdAt: Date.now() };
      setProducts([p, ...products]);
      notify('success', 'Đã thêm sản phẩm mới.');
    }
    close();
  };

  const remove = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    notify('success', 'Đã xóa sản phẩm.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Danh sách sản phẩm</h2>
          <p className="text-sm text-slate-500">
            Quản lý thông tin giá, vốn, phí nền tảng cho từng sản phẩm.
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input-field pl-10"
          placeholder="Tìm theo tên sản phẩm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="Chưa có sản phẩm nào"
          hint="Bấm 'Thêm sản phẩm' để tạo sản phẩm đầu tiên. Dữ liệu được lưu ngay trên trình duyệt."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy sản phẩm" hint="Thử từ khóa khác." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Tên sản phẩm</th>
                  <th className="px-4 py-3 text-right font-medium">Giá bán</th>
                  <th className="px-4 py-3 text-right font-medium">Giá vốn</th>
                  <th className="px-4 py-3 text-right font-medium">Phí nền tảng</th>
                  <th className="px-4 py-3 text-right font-medium">SL cơ sở</th>
                  <th className="px-4 py-3 text-right font-medium">LN cơ sở/sp</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const unitProfit =
                    p.originalPrice -
                    p.costPerUnit -
                    p.originalPrice * (p.platformFeeRate / 100);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(p.originalPrice)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(p.costPerUnit)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{p.platformFeeRate}%</td>
                      <td className="px-4 py-3 text-right text-slate-700">{p.baselineQuantity}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${unitProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {formatCurrency(unitProfit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="btn-ghost" title="Sửa">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(p.id)}
                            className="btn-ghost text-error-600 hover:bg-error-50"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <Notice>
          Dữ liệu sản phẩm được lưu trong trình duyệt (LocalStorage) và không mất
          khi tải lại trang.
        </Notice>
      )}

      {modalOpen && (
        <ProductModal
          isEdit={!!editing}
          draft={draft}
          setDraft={setDraft}
          onClose={close}
          onSave={save}
        />
      )}
    </div>
  );
}

function ProductModal({
  isEdit,
  draft,
  setDraft,
  onClose,
  onSave,
}: {
  isEdit: boolean;
  draft: Omit<Product, 'id' | 'createdAt'>;
  setDraft: (d: Omit<Product, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card-hover animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
          </h3>
          <button onClick={onClose} className="btn-ghost">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label-field">Tên sản phẩm</label>
            <input
              className="input-field"
              placeholder="VD: Áo thun trơn"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Giá bán gốc" unit="đ" value={draft.originalPrice} onChange={(v) => setDraft({ ...draft, originalPrice: v })} />
            <NumberField label="Giá vốn" unit="đ" value={draft.costPerUnit} onChange={(v) => setDraft({ ...draft, costPerUnit: v })} />
            <NumberField label="Phí nền tảng" unit="%" value={draft.platformFeeRate} onChange={(v) => setDraft({ ...draft, platformFeeRate: v })} />
            <NumberField label="Số lượng cơ sở" unit="sp" value={draft.baselineQuantity} onChange={(v) => setDraft({ ...draft, baselineQuantity: v })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={onSave}>{isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>
        </div>
      </div>
    </div>
  );
}
