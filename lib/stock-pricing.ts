/**
 * FIFO Stock Pricing Utility
 * 
 * This utility calculates the current price of a product based on available stock
 * using First-In-First-Out (FIFO) logic.
 * 
 * Logic:
 * 1. Use the price from the oldest stock with available quantity
 * 2. If all stocks are sold out, use the price from the most recent stock
 * 3. Falls back to product.price if no stock exists
 * 4. Applies dynamic markups based on user role:
 *    - Retail (customer): cost * 1.3
 *    - Professional: cost * 1.2
 *    - Wholesale/Admin/Staff: cost * 1.1
 */

export const PRICE_MARKUPS = {
    customer: 1.35,
    professional: 1.2,
    wholesaler: 1.1,
    admin: 1.1,
    staff: 1.1,
    visitor: 1.35,
    user: 1.35,
} as const;

/** Round a price UP to the nearest 5 NGN. e.g. 25472.8 → 25475 */
export function roundUpToNearest5(price: number): number {
    return Math.ceil(price / 5) * 5;
}

/** Format price with commas and no decimals (rounded to nearest 5). e.g. 5000000 → "5,000,000" */
export function formatPrice(price: number): string {
    return roundUpToNearest5(price).toLocaleString("en-NG");
}


export type UserRole = keyof typeof PRICE_MARKUPS | string;

export interface StockItem {
    id: string;
    addedQuantity: number;
    pricePerProduct: number;
    costPerProduct: number;
    createdAt: string | Date;
}

export interface ProductWithStock {
    id: string;
    name: string;
    price: number;
    stock?: StockItem[];
}

/**
 * Calculate total available stock quantity
 */
export function getTotalStockQuantity(stocks: StockItem[]): number {
    if (!stocks || stocks.length === 0) return 0;
    return stocks.reduce((total, stock) => total + (stock.addedQuantity || 0), 0);
}

/**
 * Get the current dynamic selling price for a product based on FIFO stock logic and user role
 * 
 * @param product - Product with stock array
 * @param role - User role for markup calculation
 * @returns Current dynamic selling price
 */
export function getProductPrice(product: ProductWithStock, role: UserRole = 'customer'): number {
    // Get the base cost first
    let baseCost = product.price || 0;

    if (product.stock && product.stock.length > 0) {
        // Sort stocks by creation date (oldest first) for FIFO
        const sortedStocks = [...product.stock].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
        });

        // Find the first stock with available quantity (oldest stock)
        const availableStock = sortedStocks.find(stock => stock.addedQuantity > 0);

        if (availableStock) {
            // Use cost from oldest available stock if available, otherwise fallback to pricePerProduct
            // Note: We are now treating these stored "prices" as base costs
            baseCost = availableStock.costPerProduct || availableStock.pricePerProduct || product.price || 0;
        } else {
            // All stocks are sold out, use the most recent stock base cost
            const mostRecentStock = sortedStocks[sortedStocks.length - 1];
            baseCost = mostRecentStock?.costPerProduct || mostRecentStock?.pricePerProduct || product.price || 0;
        }
    }

    // Apply role-based markup
    const markup = PRICE_MARKUPS[role as keyof typeof PRICE_MARKUPS] || PRICE_MARKUPS.customer;
    return baseCost * markup;
}

/**
 * Get the cost price for a product (for profit calculation)
 */
export function getProductCost(product: ProductWithStock): number {
    if (!product.stock || product.stock.length === 0) {
        return 0;
    }

    const sortedStocks = [...product.stock].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
    });

    const availableStock = sortedStocks.find(stock => stock.addedQuantity > 0);

    if (availableStock) {
        return availableStock.costPerProduct || 0;
    }

    const mostRecentStock = sortedStocks[sortedStocks.length - 1];
    return mostRecentStock?.costPerProduct || 0;
}

/**
 * Check if product is in stock
 */
export function isProductInStock(product: ProductWithStock): boolean {
    return getTotalStockQuantity(product.stock || []) > 0;
}

/**
 * Get stock status information
 */
export function getStockStatus(product: ProductWithStock, role: UserRole = 'customer'): {
    inStock: boolean;
    quantity: number;
    currentPrice: number;
    currentCost: number;
} {
    const quantity = getTotalStockQuantity(product.stock || []);

    return {
        inStock: quantity > 0,
        quantity,
        currentPrice: getProductPrice(product, role),
        currentCost: getProductCost(product),
    };
}
