import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import ParserList from './ParserList';

chai.use(dirtyChai);

function getSomeParserClass(fmt = 'some') {
  const SomeParser = class {
    static canProbablyParse(data) {
      return data === `${fmt}-data`;
    }
  };
  SomeParser.id = fmt;
  SomeParser.formats = [fmt, `${fmt}-format`];
  SomeParser.extensions = [`.${fmt}`, `.${fmt}2`];
  return SomeParser;
}

describe('ParserList', () => {
  const A = getSomeParserClass('a');
  const B = getSomeParserClass('b');
  const C = getSomeParserClass('See');
  const A2 = getSomeParserClass('a');

  const fmtA = ['a', 'a-format'];
  const fmtB = ['b', 'b-format'];
  const fmtAB = ['a', 'a-format', 'b', 'b-format'];
  const extA = ['.a', '.a2'];
  const extB = ['.b', '.b2'];
  const extAB = ['.a', '.a2', '.b', '.b2'];

  const formats = (list) => list.keys('formats');
  const extensions = (list) => list.keys('extensions');

  describe('constructor', () => {
    it('creates an empty list', () => {
      const parserList = new ParserList();
      expect(formats(parserList)).to.be.empty();
      expect(extensions(parserList)).to.be.empty();
    });

    it('allows to pre-populate the list', () => {
      const parserList = new ParserList([A, B]);
      expect(formats(parserList).sort()).to.deep.equal(fmtAB);
      expect(extensions(parserList).sort()).to.deep.equal(extAB);
    });
  });

  describe('#register()', () => {
    it('adds a parser to the list', () => {
      const parserList = new ParserList();
      parserList.register(A);
      parserList.register(B);
      expect(formats(parserList).sort()).to.deep.equal(fmtAB);
      expect(extensions(parserList).sort()).to.deep.equal(extAB);
    });

    it('does not add twice', () => {
      const parserList = new ParserList();
      parserList.register(A);
      parserList.register(A);
      expect(formats(parserList)).to.deep.equal(fmtA);
      expect(extensions(parserList)).to.deep.equal(extA);
    });

    it('allows multiple parsers for the same format', () => {
      const parserList = new ParserList();
      parserList.register(A);
      parserList.register(A2);
      expect(formats(parserList)).to.deep.equal(fmtA);
      expect(extensions(parserList)).to.deep.equal(extA);
    });
  });

  describe('#unregister()', () => {
    it('removes a parser from the list', () => {
      const parserList = new ParserList([A, B]);
      parserList.unregister(A);
      expect(formats(parserList)).to.deep.equal(fmtB);
      expect(extensions(parserList)).to.deep.equal(extB);
    });

    it('skips a not registered parser', () => {
      const parserList = new ParserList([A, B]);
      parserList.unregister(C);
      parserList.unregister(A2);
      expect(formats(parserList).sort()).to.deep.equal(fmtAB);
      expect(extensions(parserList).sort()).to.deep.equal(extAB);
    });

    it('supports multiple parsers for the same format', () => {
      const parserList = new ParserList([A, A2]);
      parserList.unregister(A2);
      expect(formats(parserList)).to.deep.equal(fmtA);
      expect(extensions(parserList)).to.deep.equal(extA);
      parserList.unregister(A);
      expect(formats(parserList)).to.be.empty();
      expect(extensions(parserList)).to.be.empty();
    });
  });

  describe('#find()', () => {
    let parserList;

    beforeEach(() => {
      parserList = new ParserList([A, B]);
    });

    it('returns matching file type no matter what extension the file has', () => {
      expect(parserList.find({ format: 'b' })).to.deep.equal([B]);
      expect(parserList.find({ format: 'b', ext: '.a' })).to.deep.equal([B]);
    });

    it('ignores mismatching file type no matter what extension the file has', () => {
      expect(parserList.find({ format: 'c' })).to.be.empty();
      expect(parserList.find({ format: 'c', ext: '.b' })).to.be.empty();
    });

    it('returns a match by file extension if no type specified', () => {
      expect(parserList.find({ ext: '.b' })).to.deep.equal([B]);
    });

    it('ignores mismatching file extension if no type specified', () => {
      expect(parserList.find({ ext: '.c' })).to.be.empty();
      expect(parserList.find({ ext: '.a1' })).to.be.empty();
    });

    it('returns a match if an alternative format name or extension is used', () => {
      expect(parserList.find({ format: 'b-format' })).to.deep.equal([B]);
      expect(parserList.find({ ext: '.b2' })).to.deep.equal([B]);
    });

    it('is case insensitive for type and file name', () => {
      parserList.register(C);
      expect(parserList.find({ format: 'A-Format' })).to.deep.equal([A]);
      expect(parserList.find({ ext: '.A' })).to.deep.equal([A]);
      expect(parserList.find({ format: 'see-Format' })).to.deep.equal([C]);
      expect(parserList.find({ ext: '.sEE' })).to.deep.equal([C]);
    });

    it('tries to detect a parser automatically if data is given', () => {
      expect(parserList.find({ data: 'data' })).to.be.empty();
      expect(parserList.find({ data: 'b-data' })).to.deep.equal([B]);
      expect(parserList.find({ data: 'b-data', ext: '.c' })).to.deep.equal([B]);
    });

    it('skips auto-detection if the format is specified', () => {
      expect(parserList.find({ data: 'b-data', format: 'c' })).to.be.empty();
    });

    it('returns multiple entries if they all fit', () => {
      parserList.register(A2);
      expect(parserList.find({ format: 'a' })).to.deep.equal([A, A2]);
      expect(parserList.find({ ext: '.a' })).to.deep.equal([A, A2]);
      expect(parserList.find({ data: 'a-data' })).to.deep.equal([A, A2]);
    });

    it('returns nothing if neither type nor file extension is specified', () => {
      expect(parserList.find({})).to.be.empty();
    });
  });
});
