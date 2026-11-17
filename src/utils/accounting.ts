import { Product, Sale, SaleItem, Supplier, SupplierPayment, Customer, Debt } from '../types';

export interface AccountingSummary {
  todaySales: number;
  monthlySales: number;
  totalSales: number;
  totalProfit: number;
  totalCostOfSales: number;
  totalInventoryCost: number;
  totalDebts: number;
  lowStockCount: number;
}

/**
 * Calculates core store metrics from raw entities in a single unified pass.
 */
export function calculateAccountingSummary(
  sales: Sale[] = [],
  saleItems: SaleItem[] = [],
  products: Product[] = [],
  customers: Customer[] = [],
  debts: Debt[] = []
): AccountingSummary {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  let todaySales = 0;
  let monthlySales = 0;
  let totalSales = 0;

  // Build quick map for product cost
  const productCostMap = new Map<number, number>();
  products.forEach(p => {
    if (p.id !== undefined) {
      productCostMap.set(p.id, p.cost_price || 0);
    }
  });

  // Calculate sales totals
  sales.forEach(sale => {
    const saleAmount = sale.total_amount || 0;
    totalSales += saleAmount;

    const saleDateStr = sale.created_at ? sale.created_at.split('T')[0] : '';
    if (saleDateStr === todayStr) {
      todaySales += saleAmount;
    }
    if (saleDateStr.startsWith(currentMonthStr)) {
      monthlySales += saleAmount;
    }
  });

  // Calculate cost of goods sold (COGS)
  let totalCostOfSales = 0;
  saleItems.forEach(item => {
    const unitCost = productCostMap.get(item.product_id) ?? (item.price_at_sale * 0.75);
    totalCostOfSales += unitCost * item.quantity;
  });

  const totalProfit = Math.max(0, totalSales - totalCostOfSales);

  // Calculate inventory valuation
  let totalInventoryCost = 0;
  let lowStockCount = 0;
  products.forEach(p => {
    const qty = p.stock_quantity || 0;
    const cost = p.cost_price || 0;
    totalInventoryCost += qty * cost;
    const threshold = getProductMinStockAlert(p);
    if (qty <= threshold) {
      lowStockCount++;
    }
  });

  // Calculate total customer debts
  const totalDebts = customers.reduce((sum, c) => sum + Math.max(0, c.balance || 0), 0);

  return {
    todaySales,
    monthlySales,
    totalSales,
    totalProfit,
    totalCostOfSales,
    totalInventoryCost,
    totalDebts,
    lowStockCount
  };
}

/**
 * Gets the custom minimum stock alert threshold for a product (defaults to 5)
 */
export function getProductMinStockAlert(product?: Partial<Product> | null): number {
  if (!product) return 5;
  const val = product.min_stock_alert ?? product.min_stock;
  if (typeof val === 'number' && !isNaN(val) && val >= 0) {
    return val;
  }
  return 5;
}

export type StockStatusType = 'out_of_stock' | 'critical_low' | 'low_stock' | 'in_stock';

export interface StockStatusInfo {
  status: StockStatusType;
  threshold: number;
  label: string;
  badgeClass: string;
  badgeBg: string;
  textColor: string;
  isAlert: boolean;
  suggestedReorderQty: number;
}

/**
 * Evaluates the multi-tier inventory status for a product based on its custom threshold
 */
export function getProductStockStatus(product?: Partial<Product> | null): StockStatusInfo {
  const stock = Number(product?.stock_quantity ?? 0);
  const threshold = getProductMinStockAlert(product);
  const reorderTarget = Math.max(threshold * 3, threshold + 10, 10);
  const suggestedReorderQty = Math.max(0, reorderTarget - Math.max(0, stock));

  if (stock <= 0) {
    return {
      status: 'out_of_stock',
      threshold,
      label: 'نفاد كلي (0)',
      badgeClass: 'bg-rose-500 text-white border-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      textColor: 'text-rose-600',
      isAlert: true,
      suggestedReorderQty
    };
  }

  // Critical Low: <= 50% of custom threshold (or <= 2)
  const criticalLimit = Math.max(1, Math.floor(threshold / 2));
  if (stock <= criticalLimit) {
    return {
      status: 'critical_low',
      threshold,
      label: `حرج جداً (بقي ${stock})`,
      badgeClass: 'bg-amber-600 text-white border-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
      textColor: 'text-amber-700',
      isAlert: true,
      suggestedReorderQty
    };
  }

  // Low stock: reached or below custom threshold
  if (stock <= threshold) {
    return {
      status: 'low_stock',
      threshold,
      label: `وصل حد الطلب (${stock}/${threshold})`,
      badgeClass: 'bg-yellow-500 text-slate-900 border-yellow-600',
      badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      textColor: 'text-yellow-700',
      isAlert: true,
      suggestedReorderQty
    };
  }

  // Normal in-stock
  return {
    status: 'in_stock',
    threshold,
    label: `متوفر (${stock})`,
    badgeClass: 'bg-emerald-600 text-white border-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textColor: 'text-emerald-700',
    isAlert: false,
    suggestedReorderQty: 0
  };
}

/**
 * Calculates a dynamic, smart stock threshold based on recent sales history (e.g. 7-14 days velocity)
 */
export function calculateSmartStockThreshold(saleItems: SaleItem[] = [], productId?: number, daysBuffer: number = 7): number {
  if (!productId || !saleItems || saleItems.length === 0) return 5;
  
  const productSales = saleItems.filter(item => item.product_id === productId);
  if (productSales.length === 0) return 5;

  const totalSold = productSales.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  // If we have sales entries, estimate daily velocity
  // Simple heuristic: average ~14 days observation period
  const dailyVelocity = Math.max(0.2, totalSold / 14);
  const calculated = Math.ceil(dailyVelocity * daysBuffer);
  
  return Math.max(3, Math.min(1000, calculated));
}

export interface SupplierBreakdownMetrics {
  supplierId: number;
  currentBalance: number;
  pendingDebtDues: number;
  totalAllDues: number;
  totalPaid: number;
  totalRequiredBeforeSettlement: number;
  totalRequiredBeforeSettlementAll: number;
  inventoryStock: number;
  inventoryCostValue: number;
  totalSoldQuantity: number;
  totalSoldCostValue: number;
  settledSoldCostValue: number;
  totalInventoryAndSoldCost: number;
  productsCount: number;
  paymentsCount: number;
}

export interface SupplierAndCashBasisSummary {
  bySupplierId: Map<number, SupplierBreakdownMetrics>;
  global: {
    currentBalance: number;
    pendingDebtDues: number;
    totalAllDues: number;
    totalPaid: number;
    totalRequiredBeforeSettlement: number;
    totalRequiredBeforeSettlementAll: number;
    inventoryCostValue: number;
    soldCostValue: number;
    settledSoldCostValue: number;
    totalInventoryAndSoldCost: number;
    productsCount: number;
    paymentsCount: number;
  };
  allSoldCost: number;
  allSettledSoldCost: number;
  allPendingSoldCost: number;
  realizedProfit: number;
  pendingProfit: number;
  saleCollectionStateMap: Map<number, {
    totalAmount: number;
    collectedAmount: number;
    uncollectedAmount: number;
    collectedRatio: number;
    uncollectedRatio: number;
  }>;
}

/**
 * Computes per-sale collection ratios (cash + repaid customer debt vs unpaid credit)
 * and derives exact current, pending, and total supplier dues alongside realized vs pending profit.
 */
export function calculateSupplierAndCashBasisMetrics(
  suppliers: Supplier[] = [],
  products: Product[] = [],
  sales: Sale[] = [],
  saleItems: SaleItem[] = [],
  supplierPayments: SupplierPayment[] = [],
  customers: Customer[] = []
): SupplierAndCashBasisSummary {
  const productMap = new Map<number, Product>();
  products.forEach(p => {
    if (p.id !== undefined) productMap.set(p.id, p);
  });

  const customerMap = new Map<number, Customer>();
  customers.forEach(c => {
    if (c.id !== undefined) customerMap.set(c.id, c);
  });

  const saleCollectionStateMap = new Map<number, {
    totalAmount: number;
    collectedAmount: number;
    uncollectedAmount: number;
    collectedRatio: number;
    uncollectedRatio: number;
  }>();

  // Track how much uncollected debt is already accounted for by tracked sales per customer
  const trackedUncollectedByCustomer = new Map<number, number>();
  const untrackedDebtSalesByCustomer = new Map<number, Sale[]>();

  sales.forEach(sale => {
    if (sale.id === undefined) return;
    const total = Math.max(0, Number(sale.total_amount || 0));

    if (sale.collected_amount !== undefined) {
      const collected = Math.min(total, Math.max(0, Number(sale.collected_amount || 0)));
      const uncollected = Math.max(0, total - collected);
      const collectedRatio = total > 0 ? Math.min(1, collected / total) : (sale.payment_type === 'cash' ? 1 : 0);
      const uncollectedRatio = Math.max(0, 1 - collectedRatio);

      saleCollectionStateMap.set(sale.id, {
        totalAmount: total,
        collectedAmount: collected,
        uncollectedAmount: uncollected,
        collectedRatio,
        uncollectedRatio,
      });

      if (sale.customer_id != null && uncollected > 0) {
        trackedUncollectedByCustomer.set(
          sale.customer_id,
          (trackedUncollectedByCustomer.get(sale.customer_id) || 0) + uncollected
        );
      }
      return;
    }

    if (sale.payment_type !== 'debt') {
      saleCollectionStateMap.set(sale.id, {
        totalAmount: total,
        collectedAmount: total,
        uncollectedAmount: 0,
        collectedRatio: 1,
        uncollectedRatio: 0,
      });
      return;
    }

    // Legacy / untracked debt sale
    if (sale.customer_id != null) {
      const list = untrackedDebtSalesByCustomer.get(sale.customer_id) || [];
      list.push(sale);
      untrackedDebtSalesByCustomer.set(sale.customer_id, list);
    } else {
      const paidAtCheckout = Math.min(total, Math.max(0, Number(sale.paid_amount || 0)));
      const uncollected = Math.max(0, total - paidAtCheckout);
      const collectedRatio = total > 0 ? Math.min(1, paidAtCheckout / total) : 0;
      const uncollectedRatio = Math.max(0, 1 - collectedRatio);
      saleCollectionStateMap.set(sale.id, {
        totalAmount: total,
        collectedAmount: paidAtCheckout,
        uncollectedAmount: uncollected,
        collectedRatio,
        uncollectedRatio,
      });
    }
  });

  // Allocate each customer's actual remaining debt balance onto their newest untracked debt sales first (LIFO for remaining = FIFO repayment)
  untrackedDebtSalesByCustomer.forEach((custSales, customerId) => {
    const cust = customerMap.get(customerId);
    const custPositiveBalance = Math.max(0, Number(cust?.balance || 0));
    const trackedUncollected = trackedUncollectedByCustomer.get(customerId) || 0;
    let remainingPool = Math.max(0, custPositiveBalance - trackedUncollected);

    const sortedNewestFirst = [...custSales].sort((a, b) => {
      const timeDiff = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (b.id || 0) - (a.id || 0);
    });

    sortedNewestFirst.forEach(sale => {
      if (sale.id === undefined) return;
      const total = Math.max(0, Number(sale.total_amount || 0));
      const paidAtCheckout = Math.min(total, Math.max(0, Number(sale.paid_amount || 0)));
      const maxUnpaidForSale = Math.max(0, total - paidAtCheckout);
      const unpaidNow = Math.min(maxUnpaidForSale, remainingPool);
      remainingPool = Math.max(0, remainingPool - unpaidNow);

      const collectedNow = Math.max(0, total - unpaidNow);
      const collectedRatio = total > 0 ? Math.min(1, collectedNow / total) : 0;
      const uncollectedRatio = Math.max(0, 1 - collectedRatio);

      saleCollectionStateMap.set(sale.id, {
        totalAmount: total,
        collectedAmount: collectedNow,
        uncollectedAmount: unpaidNow,
        collectedRatio,
        uncollectedRatio,
      });
    });
  });

  const saleMap = new Map<number, Sale>();
  sales.forEach(s => {
    if (s.id !== undefined) saleMap.set(s.id, s);
  });

  // Initialize supplier accumulators
  const bySupplierId = new Map<number, SupplierBreakdownMetrics>();
  const paymentsBySupplier = new Map<number, { sum: number; count: number }>();

  supplierPayments.forEach(p => {
    const sid = p.supplier_id;
    const prev = paymentsBySupplier.get(sid) || { sum: 0, count: 0 };
    paymentsBySupplier.set(sid, {
      sum: prev.sum + (Number(p.amount) || 0),
      count: prev.count + 1,
    });
  });

  suppliers.forEach(s => {
    if (s.id === undefined) return;
    const sProducts = products.filter(p => p.supplier_id === s.id);
    const invStock = sProducts.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0);
    const invCost = sProducts.reduce((acc, p) => acc + ((Number(p.stock_quantity) || 0) * (Number(p.cost_price) || 0)), 0);
    const payStats = paymentsBySupplier.get(s.id) || { sum: 0, count: 0 };
    const currentBalance = Number(s.balance || 0);

    bySupplierId.set(s.id, {
      supplierId: s.id,
      currentBalance,
      pendingDebtDues: 0,
      totalAllDues: currentBalance,
      totalPaid: payStats.sum,
      totalRequiredBeforeSettlement: currentBalance + payStats.sum,
      totalRequiredBeforeSettlementAll: currentBalance + payStats.sum,
      inventoryStock: invStock,
      inventoryCostValue: invCost,
      totalSoldQuantity: 0,
      totalSoldCostValue: 0,
      settledSoldCostValue: 0,
      totalInventoryAndSoldCost: invCost,
      productsCount: sProducts.length,
      paymentsCount: payStats.count,
    });
  });

  let allSoldCost = 0;
  let allSettledSoldCost = 0;
  let allPendingSoldCost = 0;
  let realizedProfit = 0;
  let pendingProfit = 0;

  saleItems.forEach(item => {
    const prod = productMap.get(item.product_id);
    const qty = Number(item.quantity || 0);
    const salePrice = Number(item.price_at_sale || 0);
    const unitCost = prod ? Number(prod.cost_price || 0) : salePrice * 0.75;
    const itemCost = unitCost * qty;
    const itemProfit = (salePrice - unitCost) * qty;

    const saleObj = saleMap.get(item.sale_id);
    const collectionState = saleCollectionStateMap.get(item.sale_id);

    let collectedRatio = 1;
    let uncollectedRatio = 0;
    if (collectionState) {
      collectedRatio = collectionState.collectedRatio;
      uncollectedRatio = collectionState.uncollectedRatio;
    } else if (saleObj && saleObj.payment_type === 'debt') {
      const total = Math.max(0, Number(saleObj.total_amount || 0));
      const paid = Math.min(total, Math.max(0, Number(saleObj.paid_amount || 0)));
      collectedRatio = total > 0 ? paid / total : 0;
      uncollectedRatio = Math.max(0, 1 - collectedRatio);
    }

    allSoldCost += itemCost;
    allSettledSoldCost += itemCost * collectedRatio;
    allPendingSoldCost += itemCost * uncollectedRatio;
    realizedProfit += itemProfit * collectedRatio;
    pendingProfit += itemProfit * uncollectedRatio;

    if (prod?.supplier_id != null) {
      const entry = bySupplierId.get(prod.supplier_id);
      if (entry) {
        entry.totalSoldQuantity += qty;
        entry.totalSoldCostValue += itemCost;
        entry.settledSoldCostValue += itemCost * collectedRatio;
        entry.pendingDebtDues += itemCost * uncollectedRatio;
      }
    }
  });

  // Finalize derived supplier sums & global totals
  let globalCurrentBalance = 0;
  let globalPendingDebtDues = 0;
  let globalPaid = 0;
  let globalInventoryCost = 0;
  let globalSoldCost = 0;
  let globalSettledSoldCost = 0;

  bySupplierId.forEach(entry => {
    entry.totalAllDues = entry.currentBalance + entry.pendingDebtDues;
    entry.totalRequiredBeforeSettlementAll = entry.currentBalance + entry.pendingDebtDues + entry.totalPaid;
    entry.totalInventoryAndSoldCost = entry.inventoryCostValue + entry.totalSoldCostValue;

    globalCurrentBalance += entry.currentBalance;
    globalPendingDebtDues += entry.pendingDebtDues;
    globalInventoryCost += entry.inventoryCostValue;
    globalSoldCost += entry.totalSoldCostValue;
    globalSettledSoldCost += entry.settledSoldCostValue;
  });

  supplierPayments.forEach(p => {
    globalPaid += Number(p.amount || 0);
  });

  const globalTotalAllDues = globalCurrentBalance + globalPendingDebtDues;

  return {
    bySupplierId,
    global: {
      currentBalance: globalCurrentBalance,
      pendingDebtDues: globalPendingDebtDues,
      totalAllDues: globalTotalAllDues,
      totalPaid: globalPaid,
      totalRequiredBeforeSettlement: globalCurrentBalance + globalPaid,
      totalRequiredBeforeSettlementAll: globalTotalAllDues + globalPaid,
      inventoryCostValue: globalInventoryCost,
      soldCostValue: globalSoldCost,
      settledSoldCostValue: globalSettledSoldCost,
      totalInventoryAndSoldCost: globalInventoryCost + globalSoldCost,
      productsCount: products.filter(p => p.supplier_id != null).length,
      paymentsCount: supplierPayments.length,
    },
    allSoldCost,
    allSettledSoldCost,
    allPendingSoldCost,
    realizedProfit,
    pendingProfit,
    saleCollectionStateMap,
  };
}

/**
 * Calculates metrics for a specific supplier or all suppliers.
 */
export function calculateSupplierMetrics(
  supplierId: number | 'all',
  suppliers: Supplier[] = [],
  products: Product[] = [],
  saleItems: SaleItem[] = [],
  supplierPayments: SupplierPayment[] = [],
  sales: Sale[] = [],
  customers: Customer[] = []
) {
  const computed = calculateSupplierAndCashBasisMetrics(
    suppliers,
    products,
    sales,
    saleItems,
    supplierPayments,
    customers
  );

  if (supplierId === 'all') {
    const g = computed.global;
    return {
      totalBalanceDue: g.currentBalance,
      pendingDebtDues: g.pendingDebtDues,
      totalAllDues: g.totalAllDues,
      totalPaid: g.totalPaid,
      totalRequiredBeforeSettlement: g.totalRequiredBeforeSettlement,
      totalRequiredBeforeSettlementAll: g.totalRequiredBeforeSettlementAll,
      totalInventoryCostValue: g.inventoryCostValue,
      totalSoldCostValue: g.soldCostValue,
      settledSoldCostValue: g.settledSoldCostValue,
      totalInventoryAndSoldCost: g.totalInventoryAndSoldCost,
      productsCount: g.productsCount,
      paymentsCount: g.paymentsCount
    };
  }

  const targetSupplierId = Number(supplierId);
  const s = computed.bySupplierId.get(targetSupplierId);
  if (!s) {
    return {
      totalBalanceDue: 0,
      pendingDebtDues: 0,
      totalAllDues: 0,
      totalPaid: 0,
      totalRequiredBeforeSettlement: 0,
      totalRequiredBeforeSettlementAll: 0,
      totalInventoryCostValue: 0,
      totalSoldCostValue: 0,
      settledSoldCostValue: 0,
      totalInventoryAndSoldCost: 0,
      productsCount: 0,
      paymentsCount: 0
    };
  }

  return {
    totalBalanceDue: s.currentBalance,
    pendingDebtDues: s.pendingDebtDues,
    totalAllDues: s.totalAllDues,
    totalPaid: s.totalPaid,
    totalRequiredBeforeSettlement: s.totalRequiredBeforeSettlement,
    totalRequiredBeforeSettlementAll: s.totalRequiredBeforeSettlementAll,
    totalInventoryCostValue: s.inventoryCostValue,
    totalSoldCostValue: s.totalSoldCostValue,
    settledSoldCostValue: s.settledSoldCostValue,
    totalInventoryAndSoldCost: s.totalInventoryAndSoldCost,
    productsCount: s.productsCount,
    paymentsCount: s.paymentsCount
  };
}
