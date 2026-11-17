import type { AnalysisResult } from './types';

export type ScenarioForSummary = {
  id: string;
  name: string;
  result: Pick<AnalysisResult, 'promoNetProfit' | 'promoRevenue'>;
};

export interface ScenarioSummary {
  profitLeaders: ScenarioForSummary[];
  revenueLeaders: ScenarioForSummary[];
  sameLeaders: boolean;
  explanation: string;
}

export function summarizeScenarios(scenarios: ScenarioForSummary[]): ScenarioSummary | undefined {
  if (scenarios.length === 0) return undefined;
  const highestProfit = Math.max(...scenarios.map((scenario) => scenario.result.promoNetProfit));
  const highestRevenue = Math.max(...scenarios.map((scenario) => scenario.result.promoRevenue));
  const profitLeaders = scenarios.filter((scenario) => scenario.result.promoNetProfit === highestProfit);
  const revenueLeaders = scenarios.filter((scenario) => scenario.result.promoRevenue === highestRevenue);
  const sameLeaders = profitLeaders.length === revenueLeaders.length
    && profitLeaders.every((scenario) => revenueLeaders.some((other) => other.id === scenario.id));
  const profitNames = profitLeaders.map((scenario) => scenario.name).join(', ');
  const revenueNames = revenueLeaders.map((scenario) => scenario.name).join(', ');
  const explanation = sameLeaders
    ? `${profitNames} dẫn đầu cả lợi nhuận ròng (${formatVietnameseMoney(highestProfit)}) và doanh thu sau khuyến mãi (${formatVietnameseMoney(highestRevenue)}).`
    : `Lợi nhuận ròng cao nhất thuộc về ${profitNames} (${formatVietnameseMoney(highestProfit)}), còn doanh thu cao nhất thuộc về ${revenueNames} (${formatVietnameseMoney(highestRevenue)}). Doanh thu cao không đồng nghĩa lợi nhuận cao: giá vốn, phí nền tảng và chi phí đầu tư có thể lớn hơn phần doanh thu tăng thêm.`;

  return { profitLeaders, revenueLeaders, sameLeaders, explanation };
}

function formatVietnameseMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}
