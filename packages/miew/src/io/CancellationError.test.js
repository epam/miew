import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import CancellationError from './CancellationError';

chai.use(dirtyChai);

describe('CancellationError', () => {
  describe('constructor', () => {
    let error;

    beforeEach(() => {
      error = new CancellationError('foo');
    });

    it('creates an Error', () => {
      expect(error).to.be.an('error');
    });

    it('creates a throwable instance', () => {
      expect(() => { throw error; }).to.throw(CancellationError);
    });

    it('sets correct name', () => {
      expect(error).to.have.property('name', 'CancellationError');
    });

    it('sets correct message', () => {
      expect(error).to.have.property('message', 'foo');
    });
  });
});
