import chai, { expect } from 'chai';
import * as THREE from 'three';
import dirtyChai from 'dirty-chai';
import FBXCylinderGeometryModel from './FBXExporterUtils';
import CylinderBufferGeometry from '../../gfx/geometries/CylinderBufferGeometry';
import utils from '../../utils';

chai.use(dirtyChai);

describe('FBXCylinderGeometryModel', () => {
  let regularCylinder = null;
  let extendedCylinder = null;
  let resultingCylinder = null;
  let cylinder = null;
  beforeEach(() => {
    /* Test example of cylinder geometry */
    const geometry = new CylinderBufferGeometry(1, 1, 1.0, Math.max(3, 1), 2, true);
    const alpha = utils.allocateTyped(Float32Array, 1);
    geometry.addAttribute('alphaColor', new THREE.InstancedBufferAttribute(alpha, 1, false, 1));
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    cylinder = new THREE.Mesh(geometry, material);
    regularCylinder = new FBXCylinderGeometryModel.FBXCylinderGeometryModel('regular', cylinder);
    extendedCylinder = new FBXCylinderGeometryModel.FBXCylinderGeometryModel('extended', cylinder);
    resultingCylinder = new FBXCylinderGeometryModel.FBXCylinderGeometryModel('resulting', cylinder);
  });

  describe('constructor', () => {
    it('throws an error if no parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel.FBXCylinderGeometryModel()).to.throw();
    });

    it('throws an error if only one of parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel.FBXCylinderGeometryModel('regular', null)).to.throw();
    });

    it('throws an error if only one of parameters passed', () => {
      const mesh = new THREE.Mesh();
      expect(() => new FBXCylinderGeometryModel.FBXCylinderGeometryModel(null, mesh)).to.throw();
    });


    it('do not throws an error if all parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel.FBXCylinderGeometryModel('regular', cylinder)).to.not.throw();
    });

    it('do not throws an error if more then one of parameters passed', () => {
      expect(() => new FBXCylinderGeometryModel.FBXCylinderGeometryModel('regular', cylinder, '123')).to.not.throw();
    });

    it('do nothing if modificator isnt a specified one', () => {
      const tmpCylinder = new FBXCylinderGeometryModel.FBXCylinderGeometryModel('abcd', cylinder);
      expect(tmpCylinder).to.have.property('regularIndexArray', null);
      expect(tmpCylinder).to.have.property('regularNormalsArray', null);
      expect(tmpCylinder).to.have.property('regularVertexArray', null);
      expect(tmpCylinder).to.have.property('regularColorsArray', null);
      expect(tmpCylinder).to.have.property('extendedIndexArray', null);
      expect(tmpCylinder).to.have.property('extendedNormalsArray', null);
      expect(tmpCylinder).to.have.property('extendedVertexArray', null);
      expect(tmpCylinder).to.have.property('extendedColorsArray', null);
      expect(tmpCylinder).to.have.property('resultingIndicesArray', null);
      expect(tmpCylinder).to.have.property('resultingNormalsArray', null);
      expect(tmpCylinder).to.have.property('resultingVerticesArray', null);
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
      expect(resultingCylinder).to.not.have.property('resultingIndicesArray', null);
      expect(resultingCylinder).to.not.have.property('resultingNormalsArray', null);
      expect(resultingCylinder).to.not.have.property('resultingVerticesArray', null);
      expect(resultingCylinder).to.not.have.property('resultingColorsArray', null);
    });
  });

  describe('.createRegularArrays()', () => {
    it('creates 4 regular arrays', () => {
      expect(regularCylinder.createRegularArrays()).to.have.lengthOf(4);
      expect(regularCylinder.createRegularArrays()).to.not.have.property('regularIndexArray', null);
      expect(regularCylinder.createRegularArrays()).to.not.have.property('regularVertexArray', null);
      expect(regularCylinder.createRegularArrays()).to.not.have.property('regularNormalsArray', null);
      expect(regularCylinder.createRegularArrays()).to.not.have.property('regularColorsArray', null);
    });
  });

  describe('.createExtendedArrays()', () => {
    it('creates 4 extended arrays', () => {
      expect(extendedCylinder.createExtendedArrays()).to.have.lengthOf(4);
      expect(extendedCylinder.createExtendedArrays()).to.not.have.property('extendedIndexArray', null);
      expect(extendedCylinder.createExtendedArrays()).to.not.have.property('extendedVertexArray', null);
      expect(extendedCylinder.createExtendedArrays()).to.not.have.property('extendedNormalsArray', null);
      expect(extendedCylinder.createExtendedArrays()).to.not.have.property('extendedColorsArray', null);
    });
  });


  describe('.createResultingArrays(mesh)', () => {
    it('creates 4 resulting arrays', () => {
      expect(resultingCylinder.createResultingArrays(cylinder)).to.have.lengthOf(4);
      expect(resultingCylinder.createResultingArrays(cylinder)).to.not.have.property('resultingIndicesArray', null);
      expect(resultingCylinder.createResultingArrays(cylinder)).to.not.have.property('resultingVerticesArray', null);
      expect(resultingCylinder.createResultingArrays(cylinder)).to.not.have.property('resultingNormalsArray', null);
      expect(resultingCylinder.createResultingArrays(cylinder)).to.not.have.property('resultingColorsArray', null);
    });
  });

  describe('.getArrays()', () => {
    it('returns 4 arrays', () => {
      expect(resultingCylinder.getArrays()).to.have.lengthOf(4);
    });
  });
});
