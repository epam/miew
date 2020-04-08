import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import PDBStream from './PDBStream';

chai.use(dirtyChai);

//          1         2         3         4         5         6         7         8
// 12345678901234567890123456789012345678901234567890123456789012345678901234567890
const sourceLines = [
  'the 1st line contains 42 and -12.75',
  'the 2nd one is _exactly_ eighty (80) characters long, I swear, believe me or not',
  '',
  'the last line tests for Real(9.3) precision: 98710.234, as we need in CRYST1 tag',
];

const source = sourceLines.join('\n');

describe('PDBStream', () => {
  describe('constructor', () => {
    it('accepts an empty string', () => {
      expect(() => new PDBStream('')).to.not.throw();
    });

    it('accepts a single source line', () => {
      expect(() => new PDBStream(sourceLines[0])).to.not.throw();
    });

    it('accepts a multi-line source', () => {
      expect(() => new PDBStream(source)).to.not.throw();
    });
  });

  let stream = null;

  beforeEach(() => {
    stream = new PDBStream(source);
  });

  describe('.readLine()', () => {
    it('returns the entire line', () => {
      expect(stream.readLine()).to.equal(sourceLines[0]);
    });

    it('returns an empty string for an empty stream', () => {
      const emptyStream = new PDBStream('');
      expect(emptyStream.readLine()).to.equal('');
    });
  });

  describe('.readChar()', () => {
    it('returns the specified character', () => {
      expect(stream.readChar(5)).to.equal('1');
    });

    it('returns a space for missing positions', () => {
      expect(stream.readChar(42)).to.equal(' ');
    });
  });

  describe('.readCharCode()', () => {
    it('returns the specified character code', () => {
      expect(String.fromCharCode(stream.readCharCode(5))).to.equal('1');
    });

    it('returns a space code for missing positions', () => {
      expect(String.fromCharCode(stream.readCharCode(42))).to.equal(' ');
    });
  });

  describe('.readString()', () => {
    it('returns the specified substring', () => {
      expect(stream.readString(5, 7)).to.equal('1st');
    });

    it('allows single-character substrings', () => {
      expect(stream.readString(5, 5)).to.equal('1');
    });

    it('leaves spaces intact', () => {
      expect(stream.readString(4, 8)).to.equal(' 1st ');
    });

    it('returns an empty string for missing positions', () => {
      expect(stream.readString(42, 45)).to.equal('');
    });

    it('crops at the end of a line', () => {
      expect(stream.readString(34, 40)).to.equal('75');
    });
  });

  describe('.readInt()', () => {
    it('returns the specified decimal number', () => {
      expect(stream.readInt(23, 24)).to.equal(42);
    });

    it('allows single-digit numbers', () => {
      expect(stream.readInt(23, 23)).to.equal(4);
    });

    it('ignores spaces', () => {
      expect(stream.readInt(22, 25)).to.equal(42);
    });

    it('returns NaN for missing values or positions', () => {
      expect(stream.readInt(22, 22)).to.be.NaN();
      expect(stream.readInt(42, 45)).to.be.NaN();
    });
  });

  describe('.readFloat()', () => {
    it('returns the specified real number', () => {
      expect(stream.readFloat(30, 35)).to.equal(-12.75);
    });

    it('accepts integers', () => {
      expect(stream.readFloat(23, 24)).to.equal(42);
    });

    it('ignores spaces', () => {
      expect(stream.readFloat(22, 25)).to.equal(42);
    });

    it('returns NaN for missing values or positions', () => {
      expect(stream.readFloat(22, 22)).to.be.NaN();
      expect(stream.readFloat(42, 45)).to.be.NaN();
    });

    it('has enough precision for Real(9.3) numbers', () => {
      stream = new PDBStream(sourceLines[3]);
      expect(stream.readFloat(46, 54)).to.be.closeTo(98710.234, 0.0005);
    });
  });

  describe('.end()', () => {
    it('returns true for an empty stream', () => {
      const emptyStream = new PDBStream('');
      expect(emptyStream.end()).to.be.true();
    });

    it('returns false at the start of non-empty stream', () => {
      expect(stream.end()).to.be.false();
    });
  });

  describe('.next()', () => {
    it('is silently ignored for an empty stream', () => {
      const emptyStream = new PDBStream('');
      expect(() => emptyStream.next()).to.not.throw();
    });

    it('advances to the end for a single-line stream', () => {
      const shortStream = new PDBStream(sourceLines[0]);
      shortStream.next();
      expect(shortStream.end()).to.be.true();
    });

    it('advances to the next line in a multi-line stream', () => {
      stream.next();
      expect(stream.readChar(5)).to.equal('2');
    });

    it('executes exactly N times for an N-line stream', () => {
      let counter = 0;
      while (!stream.end()) {
        stream.next();
        ++counter;
      }
      expect(counter).to.equal(sourceLines.length);
    });

    it('ignores the last EOL in a stream', () => {
      const shortStream = new PDBStream(`${sourceLines[0]}\n`);
      shortStream.next();
      expect(shortStream.end()).to.be.true();
    });
  });
});
