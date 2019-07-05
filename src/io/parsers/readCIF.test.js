import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import readCIF from './readCIF';
import ParsingError from './ParsingError';

chai.use(dirtyChai);

// Being tested against: https://www.iucr.org/resources/cif/spec/version1.1/cifsyntax

describe('readCIF()', () => {
  it('accepts empty file', () => {
    expect(readCIF('')).to.deep.equal({});
  });

  it('accepts a file of whitespaces', () => {
    const source = ' \n\r\n    \t  \r\n\t';
    expect(readCIF(source)).to.deep.equal({});
  });

  it('accepts a file of comments', () => {
    const source = '#some\n# comment \t\n\n  \n# data_1CRN   \n';
    expect(readCIF(source)).to.deep.equal({});
  });

  it('throws on non-data contents', () => {
    const source = '_hello 42';
    expect(() => readCIF(source)).to.throw(ParsingError);
  });

  it('reads an empty block', () => {
    const source = 'data_xyz';
    expect(readCIF(source)).to.deep.equal({ xyz: {} });
  });

  it('is case-insensitive to a data keyword', () => {
    const source = 'DaTA_Xyz';
    expect(readCIF(source)).to.deep.equal({ Xyz: {} });
  });

  it('allows non-alphanumeric chars in a block name', () => {
    const source = 'data_2+4=4#wow!';
    expect(readCIF(source)).to.deep.equal({ '2+4=4#wow!': {} });
  });

  it('throws on missing block name', () => {
    const source = 'data_\n';
    expect(() => readCIF(source)).to.throw(ParsingError);
  });

  it('reads multiple empty blocks', () => {
    const source = 'data_xyz data_abc';
    expect(readCIF(source)).to.deep.equal({ xyz: {}, abc: {} });
  });

  it('reads numeric values', () => {
    const source = `\
data_xyz
_n 42
_x -12.75
_e 1.25e-1
`;
    expect(readCIF(source)).to.deep.equal({
      xyz: {
        n: 42,
        x: -12.75,
        e: 1.25e-1,
      },
    });
  });

  it('reads strings and text fields', () => {
    const source = `\
data_xyz
_uq hello
_sq 'foo bar'
_dq "bar baz"
_tf
;the first and
the second line
;
`;
    expect(readCIF(source)).to.deep.equal({
      xyz: {
        uq: 'hello',
        sq: 'foo bar',
        dq: 'bar baz',
        tf: 'the first and\nthe second line',
      },
    });
  });

  it('reads N/A and unknown values as undefined', () => {
    const source = `\
data_xyz
_na .
_un ?
`;
    expect(readCIF(source)).to.deep.equal({
      xyz: {
        na: undefined,
        un: undefined,
      },
    });
  });

  it('reads looped data into arrays', () => {
    const source = `\
data_xyz
loop_
_a
_b
_s
42 ? X
-7 10 "a a"
. 0 ?
`;
    expect(readCIF(source)).to.deep.equal({
      xyz: {
        a: [42, -7, undefined],
        b: [undefined, 10, 0],
        s: ['X', 'a a', undefined],
      },
    });
  });

  it('allows to mix values with loops', () => {
    const source = `\
data_xyz
_x x
loop_
_y _z
a b c d
e f
_w end 
`;
    expect(readCIF(source)).to.deep.equal({
      xyz: {
        x: 'x',
        y: ['a', 'c', 'e'],
        z: ['b', 'd', 'f'],
        w: 'end',
      },
    });
  });
});
