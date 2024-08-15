import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';
import utils from './utils';

chai.use(dirtyChai);

describe('utils.deriveDeep()', () => {
  const num = 42;
  const str = 'hello';
  const simpleObject = {
    num,
    str,
  };
  const simpleArray = [
    num,
    str,
  ];
  const complexObject = {
    num,
    obj: simpleObject,
    str,
    ary: simpleArray,
    some: {
      depth: {
        array: [
          666,
          {
            one: 1,
            two: [9, 8, 7, 'oops'],
          },
          'bye',
        ],
      },
    },
  };
  const complexArray = [
    num,
    complexObject,
    str,
    simpleObject,
  ];
  const obj1 = {
    a: 1,
    b: {
      x: 2, y: { s: 'hello' }, z: [3, { p: 4, q: 5 }],
    },
  };
  const obj2 = {
    a: 10,
    b: {
      x: 20, y: { s: 'bye' }, z: [30, { p: 40, q: 50, r: 60 }, 70], w: 80,
    },
    c: 90,
  };

  it('copies numbers / strings', () => {
    expect(utils.deriveDeep(num)).to.equal(num);
    expect(utils.deriveDeep(str)).to.equal(str);
  });

  it('copies null / undefined', () => {
    expect(utils.deriveDeep(null)).to.be.a('null');
    expect(utils.deriveDeep(undefined)).to.be.an('undefined');
  });

  it('does not just copy objects / arrays', () => {
    expect(utils.deriveDeep(simpleObject)).not.equal(simpleObject);
    expect(utils.deriveDeep(simpleArray)).not.equal(simpleArray);
    expect(utils.deriveDeep(complexObject)).not.equal(complexObject);
    expect(utils.deriveDeep(complexArray)).not.equal(complexArray);
  });

  it('recreates all fields in simple objects / arrays', () => {
    expect(utils.deriveDeep(simpleObject)).to.deep.equal(simpleObject);
    expect(utils.deriveDeep(simpleArray)).to.deep.equal(simpleArray);
  });

  it('recreates all fields in complex objects / arrays', () => {
    expect(utils.deriveDeep(complexObject)).to.deep.equal(complexObject);
    expect(utils.deriveDeep(complexArray)).to.deep.equal(complexArray);
  });

  it('sets original object as a prototype', () => {
    expect(Object.getPrototypeOf(utils.deriveDeep(simpleObject))).to.equal(simpleObject);
    expect(Object.getPrototypeOf(utils.deriveDeep(complexObject))).to.equal(complexObject);
  });

  it('does not create own properties for simple object', () => {
    expect(utils.deriveDeep(simpleObject)).to.be.empty();
  });

  it('creates own properties for complex object', () => {
    expect(utils.deriveDeep(complexObject)).be.not.empty();
  });

  it('does not create own properties when needZeroOwnProperties = true', () => {
    expect(utils.deriveDeep(complexObject, true)).to.be.empty();
  });

  [false, true].forEach((boolValue) => {
    it(`modifies own properties instead of prototype (needZeroOwnProperties = ${boolValue})`, () => {
      const obj = { a: 1, b: { x: 2, y: { s: 'hello' }, z: [3, { p: 4, q: 5 }] } };
      const res = utils.deriveDeep(obj, boolValue);
      res.a = 10;
      res.b.x = 20;
      res.b.y.s = 'bye';
      res.b.z[0] = 30;
      res.b.z[1].p = 40;
      res.b.z[1].q = 50;
      res.b.z[1].r = 60;
      res.b.z[2] = 70;
      res.b.w = 80;
      res.c = 90;

      expect(obj).to.deep.equal(obj1);
      expect(res).to.deep.equal(obj2);
    });
  });
});

describe('utils.getFileExtension()', () => {
  const { getFileExtension } = utils;

  it('returns filename extension', () => {
    expect(getFileExtension('name.ext')).to.equal('.ext');
  });

  it('accepts filenames with multiple dots', () => {
    expect(getFileExtension('name.with.many.dots.and.ext')).to.equal('.ext');
  });

  it('accepts filenames w/o extension', () => {
    expect(getFileExtension('name')).to.equal('');
  });

  it('accepts filenames starting with a dot', () => {
    expect(getFileExtension('.name')).to.equal('');
  });

  it('accepts empty string', () => {
    expect(getFileExtension('')).to.equal('');
  });
});

describe('utils.objectsDiff()', () => {
  const { objectsDiff } = utils;

  const ref = {
    num: 42,
    obj: { x: 1, y: 2, z: 3 },
    array: [1, 2, 3],
    date: new Date(1522576800),
  };

  ref.deep = { inside: _.clone(ref) };

  const expectSame = (o) => {
    expect(objectsDiff(o, ref)).to.deep.equal(o);
  };

  const expectEmpty = (o) => {
    expect(objectsDiff(o, ref)).to.be.empty();
  };

  it('ignores the same value', () => {
    expectEmpty({ num: ref.num });
    expectEmpty({ obj: _.clone(ref.obj) });
    expectEmpty({ array: _.clone(ref.array) });
    expectEmpty({ date: _.clone(ref.date) });
  });

  it('detects a changed value', () => {
    expectSame({ num: 0 });
    expectSame({ obj: { x: 0 } });
    expectSame({ array: [0] });
    expectSame({ date: new Date() });
  });

  it('detects a new value', () => {
    expectSame({ xnum: 0 });
    expectSame({ xobj: { x: 0 } });
    expectSame({ xarray: [0] });
    expectSame({ xdate: new Date() });
  });

  it('deeply ignores the same value', () => {
    expectEmpty({ deep: { inside: { num: ref.num } } });
    expectEmpty({ deep: { inside: { obj: _.clone(ref.obj) } } });
    expectEmpty({ deep: { inside: { array: _.clone(ref.array) } } });
    expectEmpty({ deep: { inside: { date: _.clone(ref.date) } } });
  });

  it('deeply detects a changed value', () => {
    expectSame({ deep: { inside: { num: 0 } } });
    expectSame({ deep: { inside: { obj: { x: 0 } } } });
    expectSame({ deep: { inside: { array: [0] } } });
    expectSame({ deep: { inside: { date: new Date() } } });
  });

  it('deeply detects a new value', () => {
    expectSame({ deep: { inside: { xnum: 0 } } });
    expectSame({ deep: { inside: { xobj: { x: 0 } } } });
    expectSame({ deep: { inside: { xarray: [0] } } });
    expectSame({ deep: { inside: { xdate: new Date() } } });
  });

  it('detects multiple changes', () => {
    expectSame({ num: 0, xnum: 5, deep: { inside: { obj: { x: 5, w: 0 } } } });
  });

  it('allows type change', () => {
    expectSame({ num: { deep: { inside: 'ok' } } });
    expectSame({ num: [1, 2, 3] });
    expectSame({ num: new Date() });

    expectSame({ obj: 5 });
    expectSame({ array: 5 });
    expectSame({ date: 5 });
  });
});
