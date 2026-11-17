import { describe, it, expect } from 'vitest';
import {
  analyzePromotion,
  effectivePriceForDiscount,
  effectivePriceForCombo,
} from './promotionCalc';
import type { ScenarioInput } from './types';

const baseInput = (over: Partial<ScenarioInput> = {}): ScenarioInput => ({
  type: 'discount',
  originalPrice: 100000,
  costPerUnit: 60000,
  baselineQuantity: 100,
  promoQuantity: 150,
  incrementalInvestment: 5000000,
  platformFeeRate: 5,
  discount: { mode: 'percentage', value: 20 },
  ...over,
});

describe('effectivePriceForDiscount', () => {
  it('giảm theo phần trăm', () => {
    expect(effectivePriceForDiscount(100000, { mode: 'percentage', value: 20 })).toBe(80000);
  });
  it('giảm theo số tiền cố định', () => {
    expect(effectivePriceForDiscount(100000, { mode: 'fixed', value: 15000 })).toBe(85000);
  });
  it('số tiền giảm lớn hơn giá gốc => giá 0', () => {
    expect(effectivePriceForDiscount(100000, { mode: 'fixed', value: 150000 })).toBe(0);
  });
  it('phần trăm > 100 => ép về 100%', () => {
    expect(effectivePriceForDiscount(100000, { mode: 'percentage', value: 150 })).toBe(0);
  });
});

describe('effectivePriceForCombo', () => {
  it('chia hết cho combo', () => {
    const price = effectivePriceForCombo(6, { itemsPerCombo: 3, comboPrice: 200000, singleItemPrice: 80000 });
    expect(price).toBeCloseTo(66666.67, 1);
  });
  it('có sản phẩm lẻ', () => {
    const price = effectivePriceForCombo(7, { itemsPerCombo: 3, comboPrice: 200000, singleItemPrice: 80000 });
    expect(price).toBeCloseTo(68571.43, 1);
  });
  it('combo kích thước 1', () => {
    expect(effectivePriceForCombo(5, { itemsPerCombo: 1, comboPrice: 90000, singleItemPrice: 80000 })).toBe(90000);
  });
  it('số lượng 0 => giá 0', () => {
    expect(effectivePriceForCombo(0, { itemsPerCombo: 3, comboPrice: 200000, singleItemPrice: 80000 })).toBe(0);
  });
});

describe('analyzePromotion - giảm % (có phí nền tảng)', () => {
  it('tính đúng các chỉ số', () => {
    const r = analyzePromotion(baseInput());
    expect(r.effectivePricePerUnit).toBe(80000);
    expect(r.baselineRevenue).toBe(10_000_000);
    expect(r.baselineCost).toBe(6_000_000);
    expect(r.baselinePlatformFee).toBe(500_000);
    expect(r.baselineProfit).toBe(3_500_000);
    expect(r.promoRevenue).toBe(12_000_000);
    expect(r.promoCost).toBe(9_000_000);
    expect(r.promoPlatformFee).toBe(600_000);
    expect(r.promoGrossProfit).toBe(2_400_000);
    expect(r.promoNetProfit).toBe(-2_600_000);
    expect(r.profitDelta).toBe(-6_100_000);
    expect(r.roi).toBeCloseTo(-1.22, 2);
  });

  it('điểm hòa vốn so sánh đúng', () => {
    const r = analyzePromotion(baseInput());
    // contribution = 80000*(1-0.05) - 60000 = 76000 - 60000 = 16000
    // q = (3,500,000 + 5,000,000) / 16000 = 531.25 => 532
    expect(r.breakEvenQuantity).toBe(532);
  });

  it('tỷ suất lợi nhuận', () => {
    const r = analyzePromotion(baseInput());
    expect(r.profitMargin).toBeCloseTo(-21.67, 1);
  });
});

describe('analyzePromotion - giảm tiền cố định', () => {
  it('giảm 25k/sp', () => {
    const r = analyzePromotion(baseInput({ discount: { mode: 'fixed', value: 25000 } }));
    expect(r.effectivePricePerUnit).toBe(75000);
  });
});

describe('analyzePromotion - combo có sản phẩm lẻ', () => {
  it('tính đúng lợi nhuận combo', () => {
    const r = analyzePromotion(
      baseInput({
        type: 'combo',
        promoQuantity: 7,
        incrementalInvestment: 1_000_000,
        combo: { itemsPerCombo: 3, comboPrice: 200000, singleItemPrice: 80000 },
        discount: undefined,
      }),
    );
    expect(r.effectivePricePerUnit).toBeCloseTo(68571.43, 1);
    expect(r.warnings.some((w) => w.includes('sản phẩm lẻ'))).toBe(true);
  });
});

describe('Biên - chi phí đầu tư = 0', () => {
  it('ROI undefined + cảnh báo', () => {
    const r = analyzePromotion(baseInput({ incrementalInvestment: 0, discount: { mode: 'percentage', value: 10 } }));
    expect(r.roi).toBeUndefined();
    expect(r.warnings.some((w) => w.includes('ROI tăng thêm không xác định'))).toBe(true);
  });
});

describe('Biên - biên đóng góp không dương', () => {
  it('breakEven undefined khi giá hiệu lực < vốn', () => {
    const r = analyzePromotion(baseInput({ discount: { mode: 'fixed', value: 50000 } }));
    expect(r.breakEvenQuantity).toBeUndefined();
    expect(r.warnings.some((w) => w.includes('không dương'))).toBe(true);
  });
  it('breakEven undefined khi biên đóng góp = 0', () => {
    const r = analyzePromotion(baseInput({ discount: { mode: 'fixed', value: 40000 }, platformFeeRate: 0 }));
    expect(r.breakEvenQuantity).toBeUndefined();
  });
});

describe('Không tính trùng giảm giá trong chi phí đầu tư', () => {
  it('incrementalInvestment không gồm giảm giá', () => {
    const r = analyzePromotion(baseInput({ incrementalInvestment: 1_000_000, promoQuantity: 100 }));
    expect(r.incrementalInvestment).toBe(1_000_000);
    expect(r.promoGrossProfit).toBe(1_600_000); // (80000-60000-4000)*100
  });
});

describe('Lợi nhuận âm', () => {
  it('vốn cao hơn giá bán', () => {
    const r = analyzePromotion(baseInput({ costPerUnit: 120000 }));
    expect(r.baselineProfit).toBeLessThan(0);
    expect(r.promoNetProfit).toBeLessThan(0);
  });
});

describe('Giá sau giảm = 0', () => {
  it('giảm 100% => giá 0, doanh thu 0', () => {
    const r = analyzePromotion(baseInput({ discount: { mode: 'percentage', value: 100 } }));
    expect(r.effectivePricePerUnit).toBe(0);
    expect(r.promoRevenue).toBe(0);
  });
});

describe('Điểm hòa vốn combo - dữ liệu kiểm thử', () => {
  const comboInput = (over: Partial<ScenarioInput> = {}): ScenarioInput => ({
    type: 'combo',
    originalPrice: 100000,
    costPerUnit: 60000,
    baselineQuantity: 100,
    promoQuantity: 137,
    incrementalInvestment: 0,
    platformFeeRate: 5,
    discount: undefined,
    combo: { itemsPerCombo: 3, comboPrice: 270000, singleItemPrice: 100000 },
    ...over,
  });

  it('137 sản phẩm là điểm hòa vốn chính xác (không phải 135)', () => {
    const r = analyzePromotion(comboInput());
    expect(r.breakEvenQuantity).toBe(137);
  });

  it('135 sản phẩm: lợi nhuận 3.442.500đ (< cơ sở)', () => {
    const r = analyzePromotion(comboInput({ promoQuantity: 135 }));
    // full=45, leftover=0 => revenue=45*270000=12.150.000; cost=8.100.000; fee=607.500
    expect(r.promoNetProfit).toBe(3_442_500);
    expect(r.promoNetProfit).toBeLessThan(r.baselineProfit);
  });

  it('136 sản phẩm: lợi nhuận 3.477.500đ (< cơ sở)', () => {
    const r = analyzePromotion(comboInput({ promoQuantity: 136 }));
    // full=45, leftover=1 => revenue=12.250.000; cost=8.160.000; fee=612.500
    expect(r.promoNetProfit).toBe(3_477_500);
    expect(r.promoNetProfit).toBeLessThan(r.baselineProfit);
  });

  it('137 sản phẩm: lợi nhuận 3.512.500đ (>= cơ sở 3.500.000)', () => {
    const r = analyzePromotion(comboInput({ promoQuantity: 137 }));
    // full=45, leftover=2 => revenue=12.350.000; cost=8.220.000; fee=617.500
    expect(r.promoNetProfit).toBe(3_512_500);
    expect(r.promoNetProfit).toBeGreaterThanOrEqual(r.baselineProfit);
  });

  it('lợi nhuận cơ sở = 3.500.000đ', () => {
    const r = analyzePromotion(comboInput());
    expect(r.baselineProfit).toBe(3_500_000);
  });
});

describe('Giá bình quân combo - 32 sản phẩm', () => {
  it('giá bình quân = tổng doanh thu / tổng sp = 90.625đ', () => {
    // 32 sp, combo 3, giá combo 270k, giá lẻ 100k
    // full=10, leftover=2 => revenue=10*270000+2*100000=2.900.000
    // effectivePrice = 2.900.000/32 = 90.625
    const price = effectivePriceForCombo(32, {
      itemsPerCombo: 3,
      comboPrice: 270000,
      singleItemPrice: 100000,
    });
    expect(price).toBe(90625);
  });
});

describe('Result.originalPrice - hiển thị giá gốc', () => {
  it('lưu originalPrice trong kết quả', () => {
    const r = analyzePromotion(baseInput({ originalPrice: 120000 }));
    expect(r.originalPrice).toBe(120000);
  });
});
