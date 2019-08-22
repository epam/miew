import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import ExporterList from './ExporterList';

chai.use(dirtyChai);

function getSomeExporterClass(fmt = 'some') {
  const SomeExporter = class {
  };
  SomeExporter.formats = [fmt, `${fmt}-format`];
  return SomeExporter;
}

describe('ExporterList', () => {
  const A = getSomeExporterClass('a');
  const B = getSomeExporterClass('b');
  const C = getSomeExporterClass('See');
  const A2 = getSomeExporterClass('a');

  const fmtA = ['a', 'a-format'];
  const fmtB = ['b', 'b-format'];
  const fmtAB = ['a', 'a-format', 'b', 'b-format'];

  const formats = (list) => list.keys('formats');

  describe('constructor', () => {
    it('creates an empty list', () => {
      const exporterList = new ExporterList();
      expect(formats(exporterList)).to.be.empty();
    });

    it('allows to pre-populate the list', () => {
      const exporterList = new ExporterList([A, B]);
      expect(formats(exporterList).sort()).to.deep.equal(fmtAB);
    });
  });

  describe('#register()', () => {
    it('adds an exporter to the list', () => {
      const exporterList = new ExporterList();
      exporterList.register(A);
      exporterList.register(B);
      expect(formats(exporterList).sort()).to.deep.equal(fmtAB);
    });

    it('does not add twice', () => {
      const exporterList = new ExporterList();
      exporterList.register(A);
      exporterList.register(A);
      expect(formats(exporterList)).to.deep.equal(fmtA);
    });

    it('allows multiple exporters for the same format', () => {
      const exporterList = new ExporterList();
      exporterList.register(A);
      exporterList.register(A2);
      expect(formats(exporterList)).to.deep.equal(fmtA);
    });
  });

  describe('#unregister()', () => {
    it('removes an exporter from the list', () => {
      const exporterList = new ExporterList([A, B]);
      exporterList.unregister(A);
      expect(formats(exporterList)).to.deep.equal(fmtB);
    });

    it('skips a not registered exporter', () => {
      const exporterList = new ExporterList([A, B]);
      exporterList.unregister(C);
      exporterList.unregister(A2);
      expect(formats(exporterList).sort()).to.deep.equal(fmtAB);
    });

    it('supports multiple exporters for the same format', () => {
      const exporterList = new ExporterList([A, A2]);
      exporterList.unregister(A2);
      expect(formats(exporterList)).to.deep.equal(fmtA);
      exporterList.unregister(A);
      expect(formats(exporterList)).to.be.empty();
    });
  });

  describe('#find()', () => {
    let exporterList;

    beforeEach(() => {
      exporterList = new ExporterList([A, B]);
    });

    it('returns matching file type', () => {
      expect(exporterList.find({ format: 'b' })).to.deep.equal([B]);
    });

    it('ignores mismatching file type', () => {
      expect(exporterList.find({ format: 'c' })).to.be.empty();
    });

    it('returns a match if an alternative type name or extension is used', () => {
      expect(exporterList.find({ format: 'b-format' })).to.deep.equal([B]);
    });

    it('is case insensitive for type name', () => {
      exporterList.register(C);
      expect(exporterList.find({ format: 'A-Format' })).to.deep.equal([A]);
      expect(exporterList.find({ format: 'see-Format' })).to.deep.equal([C]);
    });

    it('returns multiple entries if they all fit', () => {
      exporterList.register(A2);
      expect(exporterList.find({ format: 'a' })).to.deep.equal([A, A2]);
    });

    it('returns nothing if type is not specified', () => {
      expect(exporterList.find({})).to.be.empty();
    });
  });
});
