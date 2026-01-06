const chai = require('chai');

let isRegistered = false;

exports.mochaHooks = {
  async beforeAll() {
    if (isRegistered) {
      return;
    }

    // sinon-chai publishes only ESM builds, so load it dynamically here.
    const module = await import('sinon-chai');
    const sinonChai = module.default ?? module;
    chai.use(sinonChai);
    isRegistered = true;
  },
};
