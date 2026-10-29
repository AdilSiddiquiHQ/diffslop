import assert from 'node:assert';
import { processCheckout, calculateSubtotal, applyDiscount, CheckoutError } from '../src/checkout.js';

function testSubtotal() {
  const items = [
    { price: 20, quantity: 2 },
    { price: 15, quantity: 1 }
  ];
  const subtotal = calculateSubtotal(items);
  assert.strictEqual(subtotal, 55, 'Subtotal should equal 55');
}

function testDiscount() {
  const discounted = applyDiscount(100, 'SAVE10');
  assert.strictEqual(discounted, 90, 'Discount SAVE10 should subtract 10');
}

function testInvalidCouponThrows() {
  assert.throws(
    () => applyDiscount(100, 'BOGUS'),
    (err) => err instanceof CheckoutError && err.code === 'INVALID_COUPON'
  );
}

function testCheckoutSuccess() {
  const cart = {
    items: [
      { price: 50, quantity: 2 },
      { price: 30, quantity: 1 }
    ]
  };
  const order = processCheckout(cart, 'SAVE10');
  assert.strictEqual(order.subtotal, 130);
  assert.strictEqual(order.discount, 10);
  assert.strictEqual(order.total, 120);
  assert.strictEqual(order.currency, 'USD');
  assert.match(order.orderId, /^ord_[a-z0-9]+$/);
}

testSubtotal();
testDiscount();
testInvalidCouponThrows();
testCheckoutSuccess();
console.log('Clean tests passed with complete assertion coverage.');
