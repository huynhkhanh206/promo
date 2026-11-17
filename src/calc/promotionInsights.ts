import type { AnalysisResult } from './types';
import { formatCurrency, formatPercent } from './promotionCalc';

export interface PromotionInsight {
  title: string;
  result: string;
  reason: string;
  recommendation: string;
  roiNote?: string;
}

export function createPromotionInsight(result: AnalysisResult, promoQuantity: number): PromotionInsight {
  let title: string;
  let outcome: string;

  if (result.promoNetProfit < 0) {
    title = 'Chương trình hiện đang lỗ';
    outcome = `Lợi nhuận ròng sau khuyến mãi là ${formatCurrency(result.promoNetProfit)}.`;
  } else if (result.profitDelta > 0) {
    title = 'Lợi nhuận tăng so với phương án cơ sở';
    outcome = `Lợi nhuận sau khuyến mãi tăng ${formatCurrency(result.profitDelta)} so với mức cơ sở.`;
  } else if (result.profitDelta < 0) {
    title = 'Lợi nhuận giảm so với phương án cơ sở';
    outcome = `Lợi nhuận sau khuyến mãi giảm ${formatCurrency(Math.abs(result.profitDelta))} so với mức cơ sở.`;
  } else {
    title = 'Lợi nhuận bằng phương án cơ sở';
    outcome = 'Khuyến mãi chưa làm thay đổi lợi nhuận so với phương án cơ sở.';
  }

  const reason = `Sau khuyến mãi còn ${formatCurrency(result.promoNetProfit)}; mức cơ sở là ${formatCurrency(result.baselineProfit)}. Kết quả đã tính giá vốn, phí nền tảng và chi phí đầu tư tăng thêm.`;
  let recommendation: string;

  if (result.breakEvenQuantity === undefined) {
    recommendation = 'Không thể đạt hòa vốn chỉ bằng cách tăng sản lượng với biên lợi nhuận hiện tại. Hãy cân nhắc tăng giá combo/giá bán, giảm giá vốn hoặc phí nền tảng, hay điều chỉnh mức giảm và chi phí đầu tư.';
  } else if (promoQuantity < result.breakEvenQuantity) {
    recommendation = `Cần bán tối thiểu ${result.breakEvenQuantity.toLocaleString('vi-VN')} sản phẩm theo mô hình này để lợi nhuận ròng đạt mức cơ sở. Hãy kiểm tra khả năng đạt sản lượng đó hoặc cải thiện biên lợi nhuận trước khi triển khai.`;
  } else {
    recommendation = `Sản lượng hiện tại đã đạt ngưỡng hòa vốn ${result.breakEvenQuantity.toLocaleString('vi-VN')} sản phẩm. Có thể bảo vệ kết quả bằng cách theo dõi giá vốn, phí và sản lượng thực tế.`;
  }

  const roiNote = result.roi === undefined
    ? 'ROI tăng thêm không xác định vì chi phí đầu tư tăng thêm bằng 0; không nên hiểu trường hợp này là ROI 0%.'
    : `ROI tăng thêm ${formatPercent(result.roi * 100)} được tính từ chênh lệch lợi nhuận chia cho chi phí đầu tư tăng thêm.`;

  return { title, result: outcome, reason, recommendation, roiNote };
}
