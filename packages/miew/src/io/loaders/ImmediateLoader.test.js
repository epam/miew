import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import ImmediateLoader from './ImmediateLoader';

chai.use(dirtyChai);

describe('ImmediateLoader', () => {
  describe('#load()', () => {
    it('resolves a promise with source data', () => {
      const fakeSource = 'fake source';
      const loader = new ImmediateLoader(fakeSource);
      return expect(loader.load()).to.eventually.deep.equal(fakeSource);
    });
  });

  describe('.canProbablyLoad()', () => {
    it('rejects everything', () => expect(ImmediateLoader.canProbablyLoad('anything')).to.equal(false));
  });
});
