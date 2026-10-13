import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import * as THREE from 'three';
import UnitCell from '../chem/UnitCell';
import UnitCellObject from './UnitCellObject';

chai.use(dirtyChai);

describe('UnitCellObject', () => {
  let unitCell;

  beforeEach(() => {
    unitCell = new UnitCell(
      new THREE.Vector3(10.0, 20.0, 30.0),
      new THREE.Vector3(90.0, 90.0, 90.0),
    );
  });

  it('creates LineSegments mesh with vertex colors for axes and neutral edges', () => {
    const unitCellObj = new UnitCellObject(unitCell);
    const mesh = unitCellObj.getMesh();

    expect(mesh).to.be.an.instanceOf(THREE.LineSegments);
    const geom = mesh.geometry;
    expect(geom).to.be.an.instanceOf(THREE.BufferGeometry);

    const posAttr = geom.getAttribute('position');
    expect(posAttr.count).to.equal(24);

    const colorAttr = geom.getAttribute('color');
    expect(colorAttr.count).to.equal(24);

    // Segment 0 (+a): Red [1, 0, 0]
    expect(colorAttr.getX(0)).to.equal(1);
    expect(colorAttr.getY(0)).to.equal(0);
    expect(colorAttr.getZ(0)).to.equal(0);
    expect(colorAttr.getX(1)).to.equal(1);
    expect(colorAttr.getY(1)).to.equal(0);
    expect(colorAttr.getZ(1)).to.equal(0);

    // Segment 1 (+b): Green [0, 1, 0]
    expect(colorAttr.getX(2)).to.equal(0);
    expect(colorAttr.getY(2)).to.equal(1);
    expect(colorAttr.getZ(2)).to.equal(0);
    expect(colorAttr.getX(3)).to.equal(0);
    expect(colorAttr.getY(3)).to.equal(1);
    expect(colorAttr.getZ(3)).to.equal(0);

    // Segment 2 (+c): Blue [0, 0, 1]
    expect(colorAttr.getX(4)).to.equal(0);
    expect(colorAttr.getY(4)).to.equal(0);
    expect(colorAttr.getZ(4)).to.equal(1);
    expect(colorAttr.getX(5)).to.equal(0);
    expect(colorAttr.getY(5)).to.equal(0);
    expect(colorAttr.getZ(5)).to.equal(1);

    // Remaining 9 segments: neutral gray [0.5, 0.5, 0.5]
    for (let i = 6; i < 24; i++) {
      expect(colorAttr.getX(i)).to.be.closeTo(0.5, 1e-4);
      expect(colorAttr.getY(i)).to.be.closeTo(0.5, 1e-4);
      expect(colorAttr.getZ(i)).to.be.closeTo(0.5, 1e-4);
    }
  });

  it('toggles visibility via setVisible', () => {
    const unitCellObj = new UnitCellObject(unitCell);
    expect(unitCellObj.getMesh().visible).to.be.true();

    unitCellObj.setVisible(false);
    expect(unitCellObj.getMesh().visible).to.be.false();

    unitCellObj.setVisible(true);
    expect(unitCellObj.getMesh().visible).to.be.true();
  });

  it('disposes of geometry and material resources', () => {
    const unitCellObj = new UnitCellObject(unitCell);
    const mesh = unitCellObj.getMesh();
    const geomSpy = sinon.spy(mesh.geometry, 'dispose');
    const matSpy = sinon.spy(mesh.material, 'dispose');

    unitCellObj.dispose();

    expect(geomSpy.calledOnce).to.be.true();
    expect(matSpy.calledOnce).to.be.true();
    expect(unitCellObj.getMesh()).to.be.null();
  });
});
