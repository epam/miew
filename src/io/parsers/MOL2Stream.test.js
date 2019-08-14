import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import MOL2Stream from './MOL2Stream';

chai.use(dirtyChai);

// There are 6 strings and 2 defined headers
const testLines = [
  '@<TRIPOS>MOLECULE',
  '2244',
  ' 21 21 0 0 0',
  'SMALL',
  '@<TRIPOS>ATOM',
  'something',
];

const testLine = testLines.join('\n');

describe('MOL2Stream', () => {
  describe('constructor', () => {
    it('accepts an empty string', () => {
      expect(() => new MOL2Stream('')).to.not.throw();
    });

    it('accepts a single source line', () => {
      expect(() => new MOL2Stream(testLines[0])).to.not.throw();
    });

    it('accepts a multiple source lines', () => {
      expect(() => new MOL2Stream(testLine)).to.not.throw();
    });
  });

  let stream = null;

  beforeEach(() => {
    stream = new MOL2Stream(testLine);
  });

  describe('.getCurrentString()', () => {
    it('returns the first string if the stream is just been created', () => {
      expect(stream.getCurrentString()).to.equal(testLines[0]);
    });
  });

  describe('.setStart(start)', () => {
    it('returns the last string if the start is beyond the boundary', () => {
      stream.setStart(6);
      expect(stream._currentStart).to.equal(5);

      stream.setStart(7);
      expect(stream._currentStart).to.equal(5);
    });
  });

  describe('.getNextString()', () => {
    it('returns the next string', () => {
      expect(stream.getNextString()).to.equal(testLines[1]);
    });
  });

  describe('.getStringFromStart()', () => {
    it('returns the start string if the asked string is beyond the boundary', () => {
      const testStr = stream.getStringFromStart(6);
      expect(testStr).to.equal(testLines[0]);
    });
  });
  describe('.getStringFromHeader()', () => {
    it('returns the first string from defined header', () => {
      const goodStr = stream.getStringFromHeader('ATOM', 1);
      expect(goodStr).to.equal(testLines[5]);
    });

    it('returns the first string from defined header', () => {
      const goodStr = stream.getStringFromHeader('MOLECULE', 1);
      expect(goodStr).to.equal(testLines[1]);
    });

    it('returns the start string if the header is not found', () => {
      const badHeaderStr = stream.getStringFromHeader('UNDEFINED', 1);
      expect(badHeaderStr).to.equal(testLines[0]);
    });

    it('returns the start string if the index is beyond the boundary', () => {
      const badIndexStr = stream.getStringFromHeader('MOLECULE', 6);
      expect(badIndexStr).to.equal(testLines[0]);
    });
  });

  describe('.getHeaderString()', () => {
    it('returns the header string if the header is found', () => {
      expect(stream.getHeaderString('ATOM')).to.equal(testLines[4]);
    });

    it('returns the start string if the header is not found', () => {
      expect(stream.getHeaderString('UNDEFINED')).to.equal(testLines[0]);
    });
  });

  describe('.findNextCompoundStart()', () => {
    it('returns false if there is no any data to parse else', () => {
      stream.getStringFromStart(5);
      expect(stream.findNextCompoundStart()).to.equal(false);
    });
  });
});
