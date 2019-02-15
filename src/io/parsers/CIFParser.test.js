import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import CIFParser from './CIFParser';

chai.use(dirtyChai);

const parseCif = CIFParser._parseToObject;

describe('CIFParser', () => {
  it('accepts empty file', () => {
    expect(parseCif('')).to.deep.equal({ data: {} });
  });
});
