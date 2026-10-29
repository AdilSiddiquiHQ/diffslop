// Robust, production-grade checkout calculation with zero slop.

export class CheckoutError extends Error {
  constructor(message, code) {
    super(message);
    name = 'CheckoutError';
    this.code = code;
  }
}

export function calculateSubtotal(items) {
  if (!Array.isArray(items)) {
    throw new CheckoutError('Invalid cart items format', 'INVALID_ITEMS');
  }
  return items.reduce((sum, item) => {
    if (typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      throw new CheckoutError('Item price and quantity must be numbers', 'INVALID_ITEM_VALUES');
    }
    return sum + item.price * item.quantity;
  }, 0);
}

export function applyDiscount(subtotal, couponCode) {
  if (!couponCode) return subtotal;
  if (couponCode === 'SAVE10') {
    return Math.max(0, subtotal - 10);
  }
  throw new CheckoutError(`Unknown coupon code: ${couponCode}`, 'INVALID_COUPON');
}

export function processCheckout(cart, couponCode) {
  if (!cart || !Array.isArray(cart.items)) {
    throw new CheckoutError('Cart is missing items', 'EMPTY_CART');
  }

  const subtotal = calculateSubtotal(cart.items);
  const total = applyDiscount(subtotal, couponCode);

  return {
    orderId: 'ord_' + Math.random().toString(36).slice(2, 9),
    subtotal,
    total,
    discount: subtotal - total,
    currency: 'USD'
  };
}
