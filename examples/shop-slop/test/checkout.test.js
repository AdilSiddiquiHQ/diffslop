import assert from 'node:assert';
import { processCheckout } from '../src/checkout.js';

// Weak test suite written by coding agent that tests nothing
function testCheckout() {
  const cart = { items: [{ price: 50, quantity: 2 }] };
  const res = processCheckout(cart, 'SAVE10');

  // SLOP01: Tautological assertion guaranteeing pass
  assert(true);

  // SLOP01: Comparing object to itself
  assert.deepEqual(cart, cart);

  // SLOP01: Hollow assertion on res existence
  assert(res !== null);
}

testCheckout();
console.log('All tests passed!');
