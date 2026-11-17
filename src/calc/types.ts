// Kiểu dữ liệu cho module tính toán ROI chương trình khuyến mãi

export type PromotionType = 'discount' | 'combo';
export type DiscountMode = 'percentage' | 'fixed';

export interface ScenarioInput {
  type: PromotionType;
  originalPrice: number;
  costPerUnit: number;
  baselineQuantity: number;
  promoQuantity: number;
  // Chi phí đầu tư TĂNG THÊM do chương trình (không gồm giảm giá)
  incrementalInvestment: number;
  // Phí nền tảng theo % doanh thu (Shopee/Tiktok/Lazada...)
  platformFeeRate: number;
  // Tham chiếu sản phẩm (nếu có)
  productId?: string;
  discount?: DiscountInput;
  combo?: ComboInput;
}

export interface DiscountInput {
  mode: DiscountMode;
  value: number;
}

export interface ComboInput {
  itemsPerCombo: number;
  comboPrice: number;
  singleItemPrice: number;
}

export interface AnalysisResult {
  originalPrice: number;
  effectivePricePerUnit: number;
  baselineRevenue: number;
  promoRevenue: number;
  baselineCost: number;
  promoCost: number;
  baselinePlatformFee: number;
  promoPlatformFee: number;
  baselineProfit: number;
  promoGrossProfit: number;
  incrementalInvestment: number;
  promoNetProfit: number;
  profitDelta: number;
  roi: number | undefined;
  breakEvenQuantity: number | undefined;
  profitMargin: number;
  warnings: string[];
}

export interface Product {
  id: string;
  name: string;
  originalPrice: number;
  costPerUnit: number;
  platformFeeRate: number;
  baselineQuantity: number;
  createdAt: number;
}
