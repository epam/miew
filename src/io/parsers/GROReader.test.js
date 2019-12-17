import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import GROReader from './GROReader';

chai.use(dirtyChai);

const sourceLines = [
  'the 1st line contains 42 and -12.75',
  '',
];

const source = sourceLines.join('\n');

describe('GROReader', () => {
  let stream = null;

  beforeEach(() => {
    stream = new GROReader(source);
  });

  describe('.getNext()', () => {
    it('returns exact end position of line', () => {
      expect(stream.getNext()).to.equal(35);
    });

    it('returns zero number for empty line', () => {
      const emptyStream = new GROReader('');
      expect(emptyStream.getNext()).to.equal(0);
    });
  });
});
