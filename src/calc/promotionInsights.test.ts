import { describe, expect, it } from 'vitest';
import { analyzePromotion } from './promotionCalc';
import { createPromotionInsight } from './promotionInsights';
import type { ScenarioInput } from './types';

const baseInput = (overrides: Partial<ScenarioInput> = {}): ScenarioInput => ({
  type: 'discount',
  originalPrice: 100_000,
  costPerUnit: 60_000,
  baselineQuantity: 100,
  promoQuantity: 150,
  incrementalInvestment: 100_000,
  platformFeeRate: 5,
  discount: { mode: 'percentage', value: 10 },
  combo: { itemsPerCombo: 3, comboPrice: 270_000, singleItemPrice: 100_000 },
  ...overrides,
});

describe('Nhận định khuyến mãi theo quy tắc', () => {
  it('nêu lỗ, nguyên nhân và gợi ý khi lợi nhuận sau KM âm', () => {
    const insight = createPromotionInsight(analyzePromotion(baseInput({
      originalPrice: 50_000,
      costPerUnit: 60_000,
      discount: { mode: 'percentage', value: 20 },
    })), 150);
    expect(insight.title).toContain('đang lỗ');
    expect(insight.reason).toContain('giá vốn');
    expect(insight.recommendation).toContain('giảm giá vốn');
  });

  it('phân biệt lợi nhuận tăng và giảm', () => {
    const increased = createPromotionInsight(analyzePromotion(baseInput({ incrementalInvestment: 0 })), 150);
    const decreased = createPromotionInsight(analyzePromotion(baseInput({ incrementalInvestment: 1_000_000 })), 150);
    expect(increased.title).toContain('tăng');
    expect(decreased.title).toContain('giảm');
  });

  it('nêu không thể hòa vốn khi biên đóng góp không dương', () => {
    const insight = createPromotionInsight(analyzePromotion(baseInput({
      originalPrice: 100_000,
      costPerUnit: 95_000,
      platformFeeRate: 10,
      discount: { mode: 'fixed', value: 20_000 },
    })), 150);
    expect(insight.recommendation).toContain('Không thể đạt hòa vốn');
  });

  it('nêu ROI không xác định khi đầu tư bằng 0', () => {
    const insight = createPromotionInsight(analyzePromotion(baseInput({ incrementalInvestment: 0 })), 150);
    expect(insight.roiNote).toContain('không xác định');
  });
});
