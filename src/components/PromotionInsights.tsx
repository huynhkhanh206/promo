import { Lightbulb } from 'lucide-react';
import type { AnalysisResult } from '@/calc/types';
import { createPromotionInsight } from '@/calc/promotionInsights';

export function PromotionInsights({ result, promoQuantity }: { result: AnalysisResult; promoQuantity: number }) {
  const insight = createPromotionInsight(result, promoQuantity);

  return (
    <section className="card animate-fade-in border-brand-100 bg-brand-50/50 p-5" aria-labelledby="promotion-insights-title">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 id="promotion-insights-title" className="text-base font-semibold text-slate-900">Nhận định &amp; Đề xuất</h2>
      </div>
      <h3 className="text-sm font-semibold text-brand-800">{insight.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{insight.result}</p>
      <div className="mt-3 grid gap-3 text-sm leading-relaxed sm:grid-cols-2">
        <div className="rounded-xl bg-white/80 p-3">
          <p className="font-semibold text-slate-800">Nguyên nhân</p>
          <p className="mt-1 text-slate-600">{insight.reason}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3">
          <p className="font-semibold text-slate-800">Gợi ý cải thiện</p>
          <p className="mt-1 text-slate-600">{insight.recommendation}</p>
        </div>
      </div>
      {insight.roiNote && <p className="mt-3 text-xs leading-relaxed text-slate-500">{insight.roiNote}</p>}
    </section>
  );
}
