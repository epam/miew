import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import readCIF from './readCIF';

chai.use(dirtyChai);

describe('readCIF()', () => {
  it('accepts empty file', () => {
    expect(readCIF('')).to.deep.equal({});
  });
});
