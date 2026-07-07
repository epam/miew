import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import * as THREE from 'three';
import ComplexVisual from './ComplexVisual';
import Complex from './chem/Complex';

chai.use(dirtyChai);

describe('ComplexVisual', () => {
  describe('release', () => {
    it('removes selection geometry from its parent', () => {
      const complex = new Complex();
      const visual = new ComplexVisual('test', complex);
      const parent = new THREE.Group();

      parent.add(visual.getSelectionGeo());
      expect(visual.getSelectionGeo().parent).to.equal(parent);

      visual.release();
      expect(visual.getSelectionGeo().parent).to.be.null();
    });
  });
});
