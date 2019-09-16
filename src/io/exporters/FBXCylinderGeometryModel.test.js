import chai, { expect } from 'chai';
import * as THREE from 'three';
import dirtyChai from 'dirty-chai';
import FBXCylinderGeometryModel from './FBXCylinderGeometryModel';
import CylinderBufferGeometry from '../../gfx/geometries/CylinderBufferGeometry';
import utils from '../../utils';

chai.use(dirtyChai);

describe('FBXCylinderGeometryModel', () => {
  let regularCylinder = null;
  let extendedCylinder = null;
  let resultingCylinder = null;
  let cylinder = null;
  before(() => {
    // Test example of cylinder geometry
    const geometry = new CylinderBufferGeometry(1, 1, 1.0, Math.max(3, 1), 2, true);
    const alpha = utils.allocateTyped(Float32Array, 1);
    geometry.addAttribute('alphaColor', new THREE.InstancedBufferAttribute(alpha, 1, false, 1));
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    cylinder = new THREE.Mesh(geometry, material);
    cylinder.parent = {
      parent: {
        constructor: {
          name: 'Cylinder',
        },
      },
    };

    regularCylinder = new FBXCylinderGeometryModel('regular', cylinder);
    extendedCylinder = new FBXCylinderGeometryModel('extended', cylinder);
    resultingCylinder = new FBXCylinderGeometryModel('resulting', cylinder);
  });

  describe('constructor', () => {
    it('throws an error if no parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel()).to.throw();
    });

    it('throws an error if only one of parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel('regular', null)).to.throw();
    });

    it('throws an error if only one of parameters passed', () => {
      const mesh = new THREE.Mesh();
      expect(() => new FBXCylinderGeometryModel(null, mesh)).to.throw();
    });


    it('do not throws an error if all parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel('regular', cylinder)).to.not.throw();
    });

    it('do not throws an error if more then one of parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel('regular', cylinder, '123')).to.not.throw();
    });

    it('do nothing if modificator isnt a specified one', () => {
      const tmpCylinder = new FBXCylinderGeometryModel('abcd', cylinder);
      expect(tmpCylinder).to.have.property('regularIndexArray', null);
      expect(tmpCylinder).to.have.property('regularNormalsArray', null);
      expect(tmpCylinder).to.have.property('regularVertexArray', null);
      expect(tmpCylinder).to.have.property('regularColorsArray', null);
      expect(tmpCylinder).to.have.property('extendedIndexArray', null);
      expect(tmpCylinder).to.have.property('extendedNormalsArray', null);
      expect(tmpCylinder).to.have.property('extendedVertexArray', null);
      expect(tmpCylinder).to.have.property('extendedColorsArray', null);
      expect(tmpCylinder).to.have.property('resultingIndexArray', null);
      expect(tmpCylinder).to.have.property('resultingNormalsArray', null);
      expect(tmpCylinder).to.have.property('resultingVertexArray', null);
      expect(tmpCylinder).to.have.property('resultingColorsArray', null);
    });

    it('allocate some memory if modificator is a specified one', () => {
      expect(regularCylinder).to.not.have.property('regularIndexArray', null);
      expect(regularCylinder).to.not.have.property('regularNormalsArray', null);
      expect(regularCylinder).to.not.have.property('regularVertexArray', null);
      expect(regularCylinder).to.not.have.property('regularColorsArray', null);
      expect(extendedCylinder).to.not.have.property('extendedIndexArray', null);
      expect(extendedCylinder).to.not.have.property('extendedNormalsArray', null);
      expect(extendedCylinder).to.not.have.property('extendedVertexArray', null);
      expect(extendedCylinder).to.not.have.property('extendedColorsArray', null);
      expect(resultingCylinder).to.not.have.property('resultingIndexArray', null);
      expect(resultingCylinder).to.not.have.property('resultingNormalsArray', null);
      expect(resultingCylinder).to.not.have.property('resultingVertexArray', null);
      expect(resultingCylinder).to.not.have.property('resultingColorsArray', null);
    });
  });

  describe('.createRegularArrays()', () => {
    it('creates 4 regular arrays', () => {
      const arr = regularCylinder.createRegularArrays();
      expect(arr).to.have.lengthOf(4);
      expect(regularCylinder).to.not.have.property('regularIndexArray', null);
      expect(regularCylinder).to.not.have.property('regularVertexArray', null);
      expect(regularCylinder).to.not.have.property('regularNormalsArray', null);
      expect(regularCylinder).to.not.have.property('regularColorsArray', null);
    });
  });

  describe('.createExtendedArrays()', () => {
    it('creates 4 extended arrays', () => {
      const arr = extendedCylinder.createExtendedArrays();
      expect(arr).to.have.lengthOf(4);
      expect(extendedCylinder).to.not.have.property('extendedIndexArray', null);
      expect(extendedCylinder).to.not.have.property('extendedVertexArray', null);
      expect(extendedCylinder).to.not.have.property('extendedNormalsArray', null);
      expect(extendedCylinder).to.not.have.property('extendedColorsArray', null);
    });
  });


  describe('.createResultingArrays(mesh)', () => {
    it('creates 4 resulting arrays', () => {
      const arr = resultingCylinder.createResultingArrays(cylinder);
      expect(arr).to.have.lengthOf(4);
      expect(resultingCylinder).to.not.have.property('resultingIndexArray', null);
      expect(resultingCylinder).to.not.have.property('resultingVertexArray', null);
      expect(resultingCylinder).to.not.have.property('resultingNormalsArray', null);
      expect(resultingCylinder).to.not.have.property('resultingColorsArray', null);
    });
  });

  describe('.getArrays()', () => {
    it('returns 4 arrays for resulting model', () => {
      expect(resultingCylinder.getArrays()).to.have.lengthOf(4);
    });

    it('returns 4 arrays for regular model', () => {
      expect(regularCylinder.getArrays()).to.have.lengthOf(4);
    });

    it('returns 4 arrays for extended model', () => {
      expect(extendedCylinder.getArrays()).to.have.lengthOf(4);
    });
  });

  describe('.createRegularArrays()', () => {
    it('returns 4 arrays', () => {
      expect(regularCylinder.getArrays()).to.have.lengthOf(4);
    });
  });

  describe('.createExtendedArrays()', () => {
    it('returns 4 arrays', () => {
      expect(extendedCylinder.getArrays()).to.have.lengthOf(4);
    });
  });

  describe('.storeColors(color)', () => {
    it('stores a color for regular model and dont store it for other in that case', () => {
      const color = [1, 1, 1, 1];
      regularCylinder.storeColors(color);
      expect(regularCylinder).to.have.property('regularColorsArray', color);
      expect(regularCylinder).to.have.property('extendedColorsArray', null);
      expect(regularCylinder).to.have.property('resultingColorsArray', null);
    });

    it('stores a color for extended model and dont store it for other in that case', () => {
      const color = [1, 1, 1, 1];
      extendedCylinder.storeColors(color);
      expect(extendedCylinder).to.have.property('extendedColorsArray', color);
      expect(extendedCylinder).to.have.property('regularColorsArray', null);
      expect(extendedCylinder).to.have.property('resultingColorsArray', null);
    });

    it('do nothing for resulting model', () => {
      const color = [1, 1, 1, 1];
      resultingCylinder.storeColors(color);
      expect(resultingCylinder).to.have.property('extendedColorsArray', null);
      expect(resultingCylinder).to.have.property('regularColorsArray', null);
    });
  });

  /* Don't work for some reason? */
/*  describe('.storeResults(model)', () => {
    it('append results to resulting model', () => {
      resultingCylinder.storeResults(regularCylinder);
      expect(resultingCylinder).to.have.property('resultingIndexArray', regularCylinder.regularIndexArray);
      expect(resultingCylinder).to.have.property('resultingVertexArray', regularCylinder.regularVertexArray);
      expect(resultingCylinder).to.have.property('resultingNormalsArray', regularCylinder.regularNormalsArray);
      expect(resultingCylinder).to.have.property('resultingColorsArray', regularCylinder.regularColorsArray);
    });

    it('increase offset counter in resulting model', () => {
      expect(resultingCylinder.storeResults(regularCylinder)).to.change(resultingCylinder.resultingIndexArray).by(regularCylinder.regularIndexArray)
        .and.to.increase(resultingCylinder.resultingVertexArray).by(regularCylinder.regularVertexArray)
        .and.to.increase(resultingCylinder.resultingNormalsArray).by(regularCylinder.regularNormalsArray)
        .and.to.increase(resultingCylinder.resultingColorsArray).by(regularCylinder.regularColorsArray);
    });
  }); */
});
