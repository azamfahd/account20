import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, X, Search, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Product, Sale, SaleItem } from '../../db';

export interface SalesSummaryModalProps {
  showSalesSummaryModal: boolean;
  setShowSalesSummaryModal: (show: boolean) => void;
  summary: {
    totalSales?: number;
    totalSaleValueOfRemainingInventory?: number;
    totalOriginalInventorySaleValue?: number;
    totalStockQuantity?: number;
    totalItemsSold?: number;
  };
  products?: Product[];
  saleItems?: SaleItem[];
  sales?: Sale[];
  formatPrice: (amount: number) => string;
}

export const SalesSummaryModal: React.FC<SalesSummaryModalProps> = ({
  showSalesSummaryModal,
  setShowSalesSummaryModal,
  summary,
  products = [],
  saleItems = [],
  sales = [],
  formatPrice,
}) => {
  const [selectedSaleDetailType, setSelectedSaleDetailType] = useState<'total' | 'remaining' | 'sold' | null>('sold');
  const [saleDetailSearchTerm, setSaleDetailSearchTerm] = useState('');

  const { itemsList, totalInvoiceDiscounts } = useMemo(() => {
    const productById = new Map<string, Product>();
    products.forEach((p) => {
      if (p.id !== undefined && p.id !== null) {
        productById.set(String(p.id), p);
      }
    });

    const soldStatsMap = new Map<string, { soldQty: number; soldRevenue: number }>();
    saleItems.forEach((item) => {
      if (item.product_id !== undefined && item.product_id !== null) {
        const key = String(item.product_id);
        const existing = soldStatsMap.get(key) || { soldQty: 0, soldRevenue: 0 };
        const qty = Number(item.quantity || 0);
        const priceAtSale = Number(item.price_at_sale || 0);
        existing.soldQty += qty;
        existing.soldRevenue += qty * priceAtSale;
        soldStatsMap.set(key, existing);
      }
    });

    const result: Array<{
      id: string | number;
      name: string;
      category: string;
      salePrice: number;
      remainingQty: number;
      remainingSaleValue: number;
      soldQty: number;
      soldRevenue: number;
      totalQty: number;
      totalSaleValue: number;
    }> = [];

    const seenKeys = new Set<string>();

    products.forEach((p) => {
      const key = p.id !== undefined && p.id !== null ? String(p.id) : p.name;
      seenKeys.add(key);
      const soldInfo = p.id !== undefined ? soldStatsMap.get(key) : undefined;
      const remainingQty = Number(p.stock_quantity || 0);
      const salePrice = Number(p.sale_price || 0);
      const soldQty = soldInfo?.soldQty || 0;
      const soldRevenue = soldInfo?.soldRevenue || 0;
      const remainingSaleValue = remainingQty * salePrice;
      const totalQty = remainingQty + soldQty;
      const totalSaleValue = remainingSaleValue + soldRevenue;

      result.push({
        id: p.id ?? key,
        name: p.name,
        category: p.category || 'عام',
        salePrice,
        remainingQty,
        remainingSaleValue,
        soldQty,
        soldRevenue,
        totalQty,
        totalSaleValue,
      });
    });

    // Include any historical sale items whose product was deleted from catalog
    soldStatsMap.forEach((info, key) => {
      if (!seenKeys.has(key) && (info.soldQty > 0 || info.soldRevenue > 0)) {
        const avgPrice = info.soldQty > 0 ? info.soldRevenue / info.soldQty : 0;
        result.push({
          id: `deleted-${key}`,
          name: `صنف محذوف (#${key})`,
          category: 'أصناف سابقة',
          salePrice: avgPrice,
          remainingQty: 0,
          remainingSaleValue: 0,
          soldQty: info.soldQty,
          soldRevenue: info.soldRevenue,
          totalQty: info.soldQty,
          totalSaleValue: info.soldRevenue,
        });
      }
    });

    const discountsSum = sales.reduce((sum, s) => sum + Number(s.discount || 0), 0);

    return {
      itemsList: result,
      totalInvoiceDiscounts: discountsSum,
    };
  }, [products, saleItems, sales]);

  const filteredSaleDetailsList = useMemo(() => {
    if (!selectedSaleDetailType) return [];

    let items = itemsList;
    const hasSearch = saleDetailSearchTerm.trim().length > 0;

    if (hasSearch) {
      const q = saleDetailSearchTerm.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q)
      );
    }

    if (selectedSaleDetailType === 'remaining') {
      const filtered = hasSearch ? items : items.filter((it) => it.remainingQty > 0);
      return [...filtered].sort((a, b) => b.remainingSaleValue - a.remainingSaleValue);
    }
    if (selectedSaleDetailType === 'sold') {
      const filtered = hasSearch ? items : items.filter((it) => it.soldQty > 0);
      return [...filtered].sort((a, b) => b.soldRevenue - a.soldRevenue);
    }
    const filtered = hasSearch ? items : items.filter((it) => it.totalQty > 0);
    return [...filtered].sort((a, b) => b.totalSaleValue - a.totalSaleValue);
  }, [itemsList, selectedSaleDetailType, saleDetailSearchTerm]);

  if (!showSalesSummaryModal) return null;

  const totalStockQty = summary.totalStockQuantity ?? 0;
  const totalSoldQty = summary.totalItemsSold ?? 0;
  const totalAllQty = totalStockQty + totalSoldQty;

  const realizedSalesVal = summary.totalSales ?? 0;
  const totalSaleCapacityVal = summary.totalOriginalInventorySaleValue ?? 0;
  const saleRealizationPct =
    totalSaleCapacityVal > 0
      ? Math.min(100, (realizedSalesVal / totalSaleCapacityVal) * 100)
      : 0;

  const listSaleSum = filteredSaleDetailsList.reduce((sum, item) => {
    if (selectedSaleDetailType === 'remaining') return sum + item.remainingSaleValue;
    if (selectedSaleDetailType === 'sold') return sum + item.soldRevenue;
    return sum + item.totalSaleValue;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-50 w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-md shadow-blue-500/10">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">تفاصيل وتحليل المبيعات</h3>
              <p className="text-xs text-slate-500 font-bold">ملخص مالي دقيق مبني على سعر البيع الكلي للأصناف المباعة والمتبقية</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowSalesSummaryModal(false);
              setSaleDetailSearchTerm('');
            }}
            className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* --- Section 1: Overview (Sale price focus with click interactivity) --- */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5 justify-start">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                تحليل المبيعات بسعر البيع (اضغط للتفاصيل بالأسفل)
              </h4>
              <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                اختر أي بطاقة للمعاينة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Total Original Sale Value */}
              <div
                onClick={() => setSelectedSaleDetailType('total')}
                className={`border p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right cursor-pointer select-none active:scale-[0.98] ${
                  selectedSaleDetailType === 'total'
                    ? 'bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/80 border-fuchsia-500 ring-2 ring-fuchsia-500/15'
                    : 'bg-white border-slate-200/80 hover:border-fuchsia-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] font-black ${selectedSaleDetailType === 'total' ? 'text-fuchsia-800' : 'text-fuchsia-700'}`}>
                    القيمة البيعية الكليّة
                  </p>
                  {selectedSaleDetailType === 'total' && <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-600"></span>}
                </div>
                <p className="text-lg font-black font-mono text-fuchsia-950 mt-1">
                  {formatPrice(summary.totalOriginalInventorySaleValue ?? 0)}
                </p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  مجموع قيمة البضائع (المباعة والمتبقية معاً) بأسعار البيع الكلية
                </p>
              </div>

              {/* Card 2: Expected Sale Value of Remaining Goods */}
              <div
                onClick={() => setSelectedSaleDetailType('remaining')}
                className={`border p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right cursor-pointer select-none active:scale-[0.98] ${
                  selectedSaleDetailType === 'remaining'
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100/80 border-amber-500 ring-2 ring-amber-500/15'
                    : 'bg-white border-slate-200/80 hover:border-amber-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] font-black ${selectedSaleDetailType === 'remaining' ? 'text-amber-800' : 'text-amber-700'}`}>
                    مبيعات المتبقي المتوقعة
                  </p>
                  {selectedSaleDetailType === 'remaining' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>}
                </div>
                <p className="text-lg font-black font-mono text-amber-950 mt-1">
                  {formatPrice(summary.totalSaleValueOfRemainingInventory ?? 0)}
                </p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  العائد البيعي المقدر للبضائع المتواجدة بالرفوف حالياً عند بيعها
                </p>
              </div>

              {/* Card 3: Realized Sales */}
              <div
                onClick={() => setSelectedSaleDetailType('sold')}
                className={`border p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right cursor-pointer select-none active:scale-[0.98] ${
                  selectedSaleDetailType === 'sold'
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100/80 border-blue-500 ring-2 ring-blue-500/15'
                    : 'bg-white border-slate-200/80 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] font-black ${selectedSaleDetailType === 'sold' ? 'text-blue-800' : 'text-blue-700'}`}>
                    المبيعات المحققة بالفعل
                  </p>
                  {selectedSaleDetailType === 'sold' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </div>
                <p className="text-lg font-black font-mono text-blue-950 mt-1">
                  {formatPrice(summary.totalSales ?? 0)}
                </p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  قيمة ما تم تسييله وبيعه واستلامه نقداً أو كديون محتسبة للعملاء
                </p>
              </div>
            </div>
          </div>

          {/* --- Section 1.5: Detailed Items Breakdown (Dynamic list based on selected card) --- */}
          {selectedSaleDetailType && (
            <div className="space-y-3 bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    {selectedSaleDetailType === 'remaining' && '🏷️ تفاصيل القيمة البيعية للبضائع المتبقية (الرفوف)'}
                    {selectedSaleDetailType === 'sold' && '💰 تفاصيل المبيعات المحققة للأصناف (بسعر البيع)'}
                    {selectedSaleDetailType === 'total' && '📊 تفاصيل القيمة البيعية الكلية للأصناف'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    فرز تلقائي تنازلي حسب إجمالي القيمة البيعية للبند
                  </p>
                </div>

                {/* Live Search input */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <input
                    type="text"
                    placeholder="بحث باسم الصنف أو القسم..."
                    value={saleDetailSearchTerm}
                    onChange={(e) => setSaleDetailSearchTerm(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              {/* Scrollable list of items */}
              <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1">
                {filteredSaleDetailsList.length > 0 ? (
                  filteredSaleDetailsList.map((item, idx) => {
                    let displayQty = 0;
                    let displaySaleValue = 0;
                    let qtyLabel = '';
                    let unitSalePriceLabel = 'سعر البيع للمفرد:';
                    let unitSalePriceVal = item.salePrice;

                    if (selectedSaleDetailType === 'remaining') {
                      displayQty = item.remainingQty;
                      displaySaleValue = item.remainingSaleValue;
                      qtyLabel = 'متبقي';
                    } else if (selectedSaleDetailType === 'sold') {
                      displayQty = item.soldQty;
                      displaySaleValue = item.soldRevenue;
                      qtyLabel = 'مباع';
                      const avgSoldPrice = item.soldQty > 0 ? item.soldRevenue / item.soldQty : item.salePrice;
                      if (Math.abs(avgSoldPrice - item.salePrice) > 0.01) {
                        unitSalePriceLabel = 'متوسط سعر البيع:';
                        unitSalePriceVal = avgSoldPrice;
                      }
                    } else {
                      displayQty = item.totalQty;
                      displaySaleValue = item.totalSaleValue;
                      qtyLabel = 'إجمالي';
                    }

                    return (
                      <div
                        key={`sale-detail-item-${item.id ?? 'item'}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 border border-slate-100/80 transition-all text-right"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1 pl-3">
                          <p className="text-xs font-black text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold flex-wrap">
                            <span className="bg-slate-200/50 px-1.5 py-0.5 rounded-md text-slate-600">
                              {item.category}
                            </span>
                            <span>•</span>
                            <span>
                              {unitSalePriceLabel}{' '}
                              <span className="font-mono text-slate-600 font-bold">{formatPrice(unitSalePriceVal)}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-left font-mono">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-bold block">{qtyLabel}</span>
                            <span className="text-xs font-extrabold text-slate-700">{displayQty} قطعة</span>
                          </div>
                          <div className="text-left bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs min-w-[85px]">
                            <span className="text-[9px] text-slate-400 font-bold block text-left">إجمالي البيع</span>
                            <span className="text-xs font-black text-blue-950">{formatPrice(displaySaleValue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 italic text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا توجد أصناف تطابق تصفية البحث الحالية.
                  </div>
                )}
              </div>

              {/* Summary footer for the selected detail list */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
                <div className="flex justify-between items-center">
                  <span>البنود المطابقة: {filteredSaleDetailsList.length} صنف</span>
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-extrabold font-mono text-[11px] border border-slate-200/60">
                    مجموع القيمة البيعية:{' '}
                    <span className="text-blue-800 font-black">{formatPrice(listSaleSum)}</span>
                  </span>
                </div>
                {(selectedSaleDetailType === 'sold' || selectedSaleDetailType === 'total') && totalInvoiceDiscounts > 0.01 && (
                  <div className="flex justify-between items-center text-[9.5px] text-amber-700 bg-amber-50/70 border border-amber-200/60 px-2.5 py-1 rounded-lg">
                    <span>إجمالي الخصومات الممنوحة على الفواتير:</span>
                    <span className="font-mono font-black">-{formatPrice(totalInvoiceDiscounts)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- Section 2: Stock Quantities & Sales Realization Rate --- */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5 justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              القطع والمخزون الفعلي ومعدل تحقيق المبيعات
            </h4>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    القطع المتبقية بالرفوف:
                  </span>
                  <span className="font-extrabold text-slate-800 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200">
                    {totalStockQty} قطعة
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                    القطع المباعة للعملاء:
                  </span>
                  <span className="font-extrabold text-slate-800 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200">
                    {totalSoldQty} قطعة
                  </span>
                </div>
              </div>

              {/* Styled Progress Bar representing sales realization progress */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-black">معدل تحقيق المبيعات (من القيمة البيعية الكلية)</span>
                  <span className="font-black text-sm text-blue-800 font-mono">
                    {saleRealizationPct.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="h-full bg-gradient-to-l from-blue-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                    style={{ width: `${saleRealizationPct.toFixed(1)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>التقدم نحو تسييل كامل القيمة البيعية</span>
                  <span>مجموع قطع البضائع الكليّة: {totalAllQty} قطعة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <Button
            className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            onClick={() => {
              setShowSalesSummaryModal(false);
              setSaleDetailSearchTerm('');
            }}
          >
            إغلاق النافذة
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
