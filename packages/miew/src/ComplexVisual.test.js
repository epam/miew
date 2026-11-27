import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import * as THREE from 'three';
import ComplexVisual from './ComplexVisual';
import Complex from './chem/Complex';
import UnitCell from './chem/UnitCell';
import settings from './settings';

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

    it('disposes unit cell resources and removes wireframe on release', () => {
      const complex = new Complex();
      complex.unitCell = new UnitCell(
        new THREE.Vector3(10, 10, 10),
        new THREE.Vector3(90, 90, 90),
      );

      const visual = new ComplexVisual('test', complex);
      const unitCellObj = visual._unitCell;
      expect(unitCellObj).to.not.be.null();

      const mesh = unitCellObj.getMesh();
      const geomSpy = sinon.spy(mesh.geometry, 'dispose');
      const matSpy = sinon.spy(mesh.material, 'dispose');

      visual.release();

      expect(geomSpy.calledOnce).to.be.true();
      expect(matSpy.calledOnce).to.be.true();
      expect(visual._unitCell).to.be.null();
      expect(visual.children).to.not.include(mesh);
    });
  });

  describe('unitCell display', () => {
    it('attaches UnitCellObject when complex has unitCell and controls visibility', () => {
      const complex = new Complex();
      complex.unitCell = new UnitCell(
        new THREE.Vector3(20, 20, 20),
        new THREE.Vector3(90, 90, 90),
      );

      const visual = new ComplexVisual('test', complex);
      expect(visual._unitCell).to.not.be.null();
      expect(visual.children).to.include(visual._unitCell.getMesh());

      // Matches initial setting (defaults to false)
      expect(visual._unitCell.getMesh().visible).to.equal(settings.now.unitCell);

      visual.showUnitCell(true);
      expect(visual._unitCell.getMesh().visible).to.be.true();

      visual.showUnitCell(false);
      expect(visual._unitCell.getMesh().visible).to.be.false();
    });

    it('preserves UnitCellObject mesh across rebuilds', async () => {
      const complex = new Complex();
      complex.unitCell = new UnitCell(
        new THREE.Vector3(20, 20, 20),
        new THREE.Vector3(90, 90, 90),
      );

      const visual = new ComplexVisual('test', complex);
      const mesh = visual._unitCell.getMesh();
      const geomSpy = sinon.spy(mesh.geometry, 'dispose');

      await visual.rebuild();

      expect(geomSpy.called).to.be.false();
      expect(visual.children).to.include(mesh);
    });

    it('does not create UnitCellObject when complex lacks unitCell', () => {
      const complex = new Complex();
      const visual = new ComplexVisual('test', complex);

      expect(visual._unitCell).to.be.null();
      expect(() => visual.showUnitCell(true)).to.not.throw();
    });
  });
});
