import utils from './utils';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

//////////////////////////////////////////////////////////////////////////////

describe('utils.deriveDeep()', function() {
  const num = 42,
    str = 'hello',
    simpleObject = {
      num: num,
      str: str
    },
    simpleArray = [
      num,
      str
    ],
    complexObject = {
      num: num,
      obj: simpleObject,
      str: str,
      ary: simpleArray,
      some: {
        depth: {
          array: [
            666,
            {
              one: 1,
              two: [9, 8, 7, 'oops']
            },
            'bye'
          ]
        }
      }
    },
    complexArray = [
      num,
      complexObject,
      str,
      simpleObject
    ],
    obj1 = {
      a: 1,
      b: {
        x: 2, y: {s: 'hello'}, z: [3, {p: 4, q: 5}],
      },
    },
    obj2 = {
      a: 10,
      b: {
        x: 20, y: {s: 'bye'}, z: [30, {p: 40, q: 50, r: 60}, 70], w: 80,
      },
      c: 90,
    };

  it('copies numbers / strings', function() {
    expect(utils.deriveDeep(num)).to.equal(num);
    expect(utils.deriveDeep(str)).to.equal(str);
  });

  it('copies null / undefined', function() {
    expect(utils.deriveDeep(null)).to.be.a('null');
    expect(utils.deriveDeep(undefined)).to.be.an('undefined');
  });

  it('does not just copy objects / arrays', function() {
    expect(utils.deriveDeep(simpleObject)).not.equal(simpleObject);
    expect(utils.deriveDeep(simpleArray)).not.equal(simpleArray);
    expect(utils.deriveDeep(complexObject)).not.equal(complexObject);
    expect(utils.deriveDeep(complexArray)).not.equal(complexArray);
  });

  it('recreates all fields in simple objects / arrays', function() {
    expect(utils.deriveDeep(simpleObject)).to.deep.equal(simpleObject);
    expect(utils.deriveDeep(simpleArray)).to.deep.equal(simpleArray);
  });

  it('recreates all fields in complex objects / arrays', function() {
    expect(utils.deriveDeep(complexObject)).to.deep.equal(complexObject);
    expect(utils.deriveDeep(complexArray)).to.deep.equal(complexArray);
  });

  it('sets original object as a prototype', function() {
    expect(Object.getPrototypeOf(utils.deriveDeep(simpleObject))).to.equal(simpleObject);
    expect(Object.getPrototypeOf(utils.deriveDeep(complexObject))).to.equal(complexObject);
  });

  it('does not create own properties for simple object', function() {
    expect(utils.deriveDeep(simpleObject)).to.be.empty();
  });

  it('creates own properties for complex object', function() {
    expect(utils.deriveDeep(complexObject)).be.not.empty();
  });

  it('does not create own properties when needZeroOwnProperties = true', function() {
    expect(utils.deriveDeep(complexObject, true)).to.be.empty();
  });

  [false, true].forEach((boolValue) => {
    it(`modifies own properties instead of prototype (needZeroOwnProperties = ${boolValue})`, function() {
      const obj = {a: 1, b: {x: 2, y: {s: 'hello'}, z: [3, {p: 4, q: 5}]}};
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

  const getFileExtension = utils.getFileExtension;

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
