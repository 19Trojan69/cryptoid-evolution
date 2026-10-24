// This Preview never loads the external Pi SDK or starts authentication/payment.
window.Pi = Object.freeze({
  init() {},
  getPiHostAppInfo: async () => ({ hostApp: 'web' }),
  authenticate: async () => { throw new Error('Private preview has no Pi authentication'); },
  signIn: async () => { throw new Error('Private preview has no Pi authentication'); },
  createPayment() { throw new Error('Private preview has no payments'); },
});
