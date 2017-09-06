import {expect} from 'chai';
import CIFParser from '../src/io/parsers/CIFParser';

let parseCif = CIFParser._parseToObject;

describe('CIFParser', function() {

  it('accepts empty file', function() {
    expect(parseCif('')).to.deep.equal({data:{}});
  });

});
