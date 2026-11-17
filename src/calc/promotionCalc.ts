// Module tính toán ROI chương trình khuyến mãi.
// Tách riêng toàn bộ công thức khỏi giao diện để dễ kiểm thử và tái sử dụng.

import type {
  AnalysisResult,
  ScenarioInput,
  DiscountInput,
  ComboInput,
} from './types';

export function computeEffectivePrice(input: ScenarioInput): number {
  if (input.type === 'discount') {
    return effectivePriceForDiscount(input.originalPrice, input.discount!);
  }
  return effectivePriceForCombo(input.promoQuantity, input.combo!);
}

export function effectivePriceForDiscount(
  originalPrice: number,
  discount: DiscountInput,
): number {
  if (discount.mode === 'percentage') {
    const pct = clamp(discount.value, 0, 100);
    return roundCurrency(originalPrice * (1 - pct / 100));
  }
  const reduced = originalPrice - Math.max(discount.value, 0);
  return roundCurrency(Math.max(reduced, 0));
}

export function effectivePriceForCombo(
  quantity: number,
  combo: ComboInput,
): number {
  const itemsPerCombo = Math.max(combo.itemsPerCombo, 1);
  const fullCombos = Math.floor(quantity / itemsPerCombo);
  const leftover = quantity - fullCombos * itemsPerCombo;
  const totalRevenue = fullCombos * combo.comboPrice + leftover * combo.singleItemPrice;
  if (quantity <= 0) return 0;
  return roundCurrency(totalRevenue / quantity);
}

function promoRevenueAt(input: ScenarioInput, quantity: number): number {
  if (input.type === 'discount') {
    return roundCurrency(effectivePriceForDiscount(input.originalPrice, input.discount!) * quantity);
  }
  const itemsPerCombo = Math.max(input.combo!.itemsPerCombo, 1);
  const fullCombos = Math.floor(quantity / itemsPerCombo);
  const leftover = quantity - fullCombos * itemsPerCombo;
  return roundCurrency(fullCombos * input.combo!.comboPrice + leftover * input.combo!.singleItemPrice);
}

// Lợi nhuận cơ sở = doanh thu cơ sở - giá vốn - phí nền tảng cơ sở - chi phí cơ sở.
// (chi phí cơ sở = 0; chi phí tăng thêm chỉ xuất hiện trong promo.)
export function analyzePromotion(input: ScenarioInput): AnalysisResult {
  const warnings: string[] = [];
  const feeRate = clamp(input.platformFeeRate || 0, 0, 100) / 100;

  const baselineRevenue = roundCurrency(input.originalPrice * input.baselineQuantity);
  const baselineCost = roundCurrency(input.costPerUnit * input.baselineQuantity);
  const baselinePlatformFee = roundCurrency(baselineRevenue * feeRate);
  const baselineProfit = roundCurrency(baselineRevenue - baselineCost - baselinePlatformFee);

  const effectivePrice = computeEffectivePrice(input);
  const promoRevenue = promoRevenueAt(input, input.promoQuantity);
  const promoCost = roundCurrency(input.costPerUnit * input.promoQuantity);
  const promoPlatformFee = roundCurrency(promoRevenue * feeRate);
  const promoGrossProfit = roundCurrency(promoRevenue - promoCost - promoPlatformFee);

  const incrementalInvestment = Math.max(input.incrementalInvestment, 0);
  // Lợi nhuận sau KM = doanh thu - giá vốn - phí nền tảng - chi phí chiến dịch tăng thêm.
  const promoNetProfit = roundCurrency(promoGrossProfit - incrementalInvestment);
  const profitDelta = roundCurrency(promoNetProfit - baselineProfit);

  // ROI tăng thêm. Giảm giá không tính trùng vào chi phí đầu tư.
  const roi =
    incrementalInvestment === 0 ? undefined : profitDelta / incrementalInvestment;

  // Tỷ suất lợi nhuận ròng sau KM.
  const profitMargin =
    promoRevenue > 0 ? roundCurrency((promoNetProfit / promoRevenue) * 100) : 0;

  // Điểm hòa vốn so sánh: số nguyên tối thiểu để lợi nhuận sau KM(q) >= lợi nhuận cơ sở.
  // Với combo, doanh thu theo cấu trúc combo nguyên + sản phẩm lẻ, KHÔNG ngoại suy tuyến tính.
  // Cột sống lợi nhuận promo trên mỗi sản phẩm có thể đổi khi kết cấu combo thay đổi,
  // nên phải tính lợi nhuận thực tại từng sản lượng và tìm điểm đạt ngưỡng.
  const breakEvenQuantity = computeBreakEven(input, baselineProfit, warnings);

  if (incrementalInvestment === 0) {
    warnings.push('Chi phí đầu tư tăng thêm bằng 0. ROI tăng thêm không xác định.');
  }
  if (input.type === 'combo') {
    const itemsPerCombo = Math.max(input.combo!.itemsPerCombo, 1);
    const leftover = input.promoQuantity % itemsPerCombo;
    if (leftover > 0) {
      warnings.push(`Có ${leftover} sản phẩm lẻ không đủ một combo, được tính theo giá lẻ.`);
    }
  }

  return {
    originalPrice: input.originalPrice,
    effectivePricePerUnit: effectivePrice,
    baselineRevenue, promoRevenue,
    baselineCost, promoCost,
    baselinePlatformFee, promoPlatformFee,
    baselineProfit, promoGrossProfit,
    incrementalInvestment, promoNetProfit, profitDelta,
    roi, breakEvenQuantity, profitMargin, warnings,
  };
}

const EPSILON = 1e-9;

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
export function roundCurrency(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
export function formatCurrency(v: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}
export function formatNumber(v: number, digits = 2): string {
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
}
export function formatPercent(v: number, digits = 2): string {
  return `${formatNumber(v, digits)}%`;
}

// Lợi nhuận ròng promo tại một sản lượng q (cùng công thức với analyzePromotion).
export function promoProfitAt(input: ScenarioInput, q: number): number {
  const feeRate = clamp(input.platformFeeRate || 0, 0, 100) / 100;
  const revenue = promoRevenueAt(input, q);
  const cost = roundCurrency(input.costPerUnit * q);
  const fee = roundCurrency(revenue * feeRate);
  const gross = roundCurrency(revenue - cost - fee);
  return roundCurrency(gross - Math.max(input.incrementalInvestment, 0));
}

// Giá bình quân tại sản lượng q (combo: tính theo combo nguyên + lẻ).
export function effectivePriceAt(input: ScenarioInput, q: number): number {
  if (input.type === 'discount') {
    return effectivePriceForDiscount(input.originalPrice, input.discount!);
  }
  return effectivePriceForCombo(q, input.combo!);
}

// Điểm hòa vốn so sánh: số nguyên tối thiểu q sao cho promoProfitAt(q) >= baselineProfit.
// Dùng tuần tra có cận trên dựa trên giá lẻ (trường hợp combo) hoặc công thức tuyến tính (discount).
function computeBreakEven(
  input: ScenarioInput,
  baselineProfit: number,
  warnings: string[],
): number | undefined {
  const feeRate = clamp(input.platformFeeRate || 0, 0, 100) / 100;
  void feeRate;

  if (input.type === 'discount') {
    // Discount: giá bình quân không đổi theo q => công thức tuyến tính.
    const eff = effectivePriceForDiscount(input.originalPrice, input.discount!);
    const contribution = eff * (1 - (clamp(input.platformFeeRate || 0, 0, 100) / 100)) - input.costPerUnit;
    if (contribution <= 0) {
      warnings.push(
        'Biên lợi nhuận đóng góp trên mỗi sản phẩm không dương. Không thể đạt hòa vốn bằng cách tăng số lượng.',
      );
      return undefined;
    }
    const q = (baselineProfit + Math.max(input.incrementalInvestment, 0)) / contribution;
    return Math.max(0, Math.ceil(q - EPSILON));
  }

  // Combo: doanh thu đổi theo cấu trúc combo nguyên + lẻ. Tìm tuần tự.
  const itemsPerCombo = Math.max(input.combo!.itemsPerCombo, 1);
  const comboPrice = input.combo!.comboPrice;
  const single = input.combo!.singleItemPrice;
  const feeRateCombo = clamp(input.platformFeeRate || 0, 0, 100) / 100;
  const cost = input.costPerUnit;
  const inv = Math.max(input.incrementalInvestment, 0);

  const profitAt = (q: number): number => {
    const full = Math.floor(q / itemsPerCombo);
    const leftover = q - full * itemsPerCombo;
    const revenue = roundCurrency(full * comboPrice + leftover * single);
    const c = roundCurrency(cost * q);
    const f = roundCurrency(revenue * feeRateCombo);
    return roundCurrency(revenue - c - f - inv);
  };

  // Cận trên: nếu giá lẻ cho biên dương, dùng cận tuyến tính; nếu không, thử nhiều chu kỳ combo.
  const singleContribution = single * (1 - feeRateCombo) - cost;

  // Tìm tuần tự trong khoảng hợp lý.
  let upper: number;
  if (singleContribution > 0) {
    upper = Math.ceil((baselineProfit + inv) / singleContribution) + 2 * itemsPerCombo + 10;
  } else {
    upper = 10 * itemsPerCombo + 1000;
  }
  upper = Math.max(upper, itemsPerCombo * 4, 1000);

  for (let q = 0; q <= upper; q++) {
    if (profitAt(q) >= baselineProfit) return q;
  }

  // Combo nguyên: lợi nhuận mỗi combo = comboPrice*(1-fee) - cost*itemsPerCombo.
  const perComboProfit = comboPrice * (1 - feeRateCombo) - cost * itemsPerCombo;
  if (perComboProfit <= 0) {
    warnings.push(
      'Biên lợi nhuận đóng góp trên mỗi combo không dương. Không thể đạt hòa vốn bằng cách tăng số lượng.',
    );
    return undefined;
  }
  // Mở rộng tìm theo từng combo thêm (lợi nhuận tăng tuyến tính theo combo nguyên).
  const baseQ = upper - (upper % itemsPerCombo);
  for (let k = 0; k < 1_000_000; k++) {
    const q = baseQ + k * itemsPerCombo;
    if (profitAt(q) >= baselineProfit) return q;
  }
  warnings.push('Không thể đạt lợi nhuận cơ sở bằng cách tăng sản lượng.');
  return undefined;
}
