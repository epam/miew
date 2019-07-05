import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import ParsingError from './ParsingError';

chai.use(dirtyChai);

describe('ParsingError', () => {
  describe('constructor', () => {
    const line = 42;
    const column = 66;
    let error;

    beforeEach(() => {
      error = new ParsingError('foo', line, column);
    });

    it('creates an Error', () => {
      expect(error).to.be.an('error');
    });

    it('creates an throwable instance', () => {
      expect(() => { throw error; }).to.throw(ParsingError);
    });

    it('sets correct name', () => {
      expect(error).to.have.property('name', 'ParsingError');
    });

    it('keeps track of line and column', () => {
      expect(error).to.have.property('parseLine', line);
      expect(error).to.have.property('parseColumn', column);
    });
  });
});
