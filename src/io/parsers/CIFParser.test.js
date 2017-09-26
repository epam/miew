import CIFParser from './CIFParser';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

let parseCif = CIFParser._parseToObject;

describe('CIFParser', function() {

  it('accepts empty file', function() {
    expect(parseCif('')).to.deep.equal({data:{}});
  });

});
