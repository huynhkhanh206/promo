import { describe, expect, it } from 'vitest';
import { summarizeScenarios, type ScenarioForSummary } from './scenarioSummary';

const rows: ScenarioForSummary[] = [
  { id: 'profit', name: 'Lãi tốt', result: { promoNetProfit: 5_000_000, promoRevenue: 10_000_000 } },
  { id: 'revenue', name: 'Doanh thu lớn', result: { promoNetProfit: 4_000_000, promoRevenue: 15_000_000 } },
];

describe('Tổng hợp so sánh kịch bản', () => {
  it('chỉ rõ kịch bản dẫn đầu lợi nhuận và doanh thu khi khác nhau', () => {
    const summary = summarizeScenarios(rows);
    expect(summary?.profitLeaders[0].name).toBe('Lãi tốt');
    expect(summary?.revenueLeaders[0].name).toBe('Doanh thu lớn');
    expect(summary?.sameLeaders).toBe(false);
    expect(summary?.explanation).toContain('giá vốn');
  });

  it('xử lý đồng hạng và trả undefined khi không có kịch bản', () => {
    expect(summarizeScenarios([])).toBeUndefined();
    const summary = summarizeScenarios([rows[0], { ...rows[1], result: { promoNetProfit: 5_000_000, promoRevenue: 10_000_000 } }]);
    expect(summary?.sameLeaders).toBe(true);
    expect(summary?.profitLeaders).toHaveLength(2);
  });
});
