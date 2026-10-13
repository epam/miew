import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import * as THREE from 'three';
import UnitCell from './UnitCell';

chai.use(dirtyChai);

const EPSILON = 1e-4;

describe('UnitCell', () => {
  describe('constructor and properties', () => {
    it('initializes with lengths, angles and space group', () => {
      const cell = new UnitCell(
        new THREE.Vector3(10.0, 20.0, 30.0),
        new THREE.Vector3(90.0, 90.0, 90.0),
        'P 1 21 1',
      );

      expect(cell.a).to.equal(10.0);
      expect(cell.b).to.equal(20.0);
      expect(cell.c).to.equal(30.0);
      expect(cell.alpha).to.equal(90.0);
      expect(cell.beta).to.equal(90.0);
      expect(cell.gamma).to.equal(90.0);
      expect(cell.spaceGroup).to.equal('P 1 21 1');
    });

    it('defaults spaceGroup to empty string if omitted', () => {
      const cell = new UnitCell(
        new THREE.Vector3(10.0, 10.0, 10.0),
        new THREE.Vector3(90.0, 90.0, 90.0),
      );

      expect(cell.spaceGroup).to.equal('');
    });
  });

  describe('basis vectors calculation', () => {
    it('computes orthonormal basis for an orthorhombic cell', () => {
      const cell = new UnitCell(
        new THREE.Vector3(10.0, 20.0, 30.0),
        new THREE.Vector3(90.0, 90.0, 90.0),
      );

      const basis = cell.getBasisVectors();
      expect(basis.a.x).to.be.closeTo(10.0, EPSILON);
      expect(basis.a.y).to.be.closeTo(0.0, EPSILON);
      expect(basis.a.z).to.be.closeTo(0.0, EPSILON);

      expect(basis.b.x).to.be.closeTo(0.0, EPSILON);
      expect(basis.b.y).to.be.closeTo(20.0, EPSILON);
      expect(basis.b.z).to.be.closeTo(0.0, EPSILON);

      expect(basis.c.x).to.be.closeTo(0.0, EPSILON);
      expect(basis.c.y).to.be.closeTo(0.0, EPSILON);
      expect(basis.c.z).to.be.closeTo(30.0, EPSILON);
    });

    it('computes basis for a monoclinic cell', () => {
      // 1CRN monoclinic cell: a=40.96, b=18.65, c=22.52, alpha=90, beta=90.77, gamma=90
      const cell = new UnitCell(
        new THREE.Vector3(40.96, 18.65, 22.52),
        new THREE.Vector3(90.0, 90.77, 90.0),
      );

      const basis = cell.getBasisVectors();
      expect(basis.a.length()).to.be.closeTo(40.96, EPSILON);
      expect(basis.b.length()).to.be.closeTo(18.65, EPSILON);
      expect(basis.c.length()).to.be.closeTo(22.52, EPSILON);

      // Angle beta is between a and c
      const cosBeta = basis.a.clone().normalize().dot(basis.c.clone().normalize());
      const betaDeg = Math.acos(cosBeta) * (180.0 / Math.PI);
      expect(betaDeg).to.be.closeTo(90.77, EPSILON);

      // alpha is between b and c, gamma is between a and b
      expect(basis.b.clone().normalize().dot(basis.c.clone().normalize())).to.be.closeTo(0.0, EPSILON);
      expect(basis.a.clone().normalize().dot(basis.b.clone().normalize())).to.be.closeTo(0.0, EPSILON);
    });

    it('computes basis for a general triclinic cell preserving lengths and angles', () => {
      const a = 15.0;
      const b = 20.0;
      const c = 25.0;
      const alpha = 75.0;
      const beta = 80.0;
      const gamma = 85.0;

      const cell = new UnitCell(
        new THREE.Vector3(a, b, c),
        new THREE.Vector3(alpha, beta, gamma),
      );

      const basis = cell.getBasisVectors();
      expect(basis.a.length()).to.be.closeTo(a, EPSILON);
      expect(basis.b.length()).to.be.closeTo(b, EPSILON);
      expect(basis.c.length()).to.be.closeTo(c, EPSILON);

      const degFromRad = 180.0 / Math.PI;
      const calcGamma = Math.acos(basis.a.clone().normalize().dot(basis.b.clone().normalize())) * degFromRad;
      const calcBeta = Math.acos(basis.a.clone().normalize().dot(basis.c.clone().normalize())) * degFromRad;
      const calcAlpha = Math.acos(basis.b.clone().normalize().dot(basis.c.clone().normalize())) * degFromRad;

      expect(calcGamma).to.be.closeTo(gamma, EPSILON);
      expect(calcBeta).to.be.closeTo(beta, EPSILON);
      expect(calcAlpha).to.be.closeTo(alpha, EPSILON);

      // Right-handed frame: scalar triple product (a x b) . c > 0
      const tripleProduct = basis.a.clone().cross(basis.b).dot(basis.c);
      expect(tripleProduct).to.be.above(0);
    });
  });

  describe('line segments calculation', () => {
    it('generates 24 vertices (12 segments) with origin axes as the first three segments', () => {
      const cell = new UnitCell(
        new THREE.Vector3(10.0, 20.0, 30.0),
        new THREE.Vector3(90.0, 90.0, 90.0),
      );

      const lines = cell.getLineSegments();
      expect(lines).to.be.an('array');
      expect(lines.length).to.equal(24);

      // Origin axes:
      // +a axis
      expect(lines[0].equals(new THREE.Vector3(0, 0, 0))).to.be.true();
      expect(lines[1].distanceTo(new THREE.Vector3(10, 0, 0))).to.be.closeTo(0, EPSILON);

      // +b axis
      expect(lines[2].equals(new THREE.Vector3(0, 0, 0))).to.be.true();
      expect(lines[3].distanceTo(new THREE.Vector3(0, 20, 0))).to.be.closeTo(0, EPSILON);

      // +c axis
      expect(lines[4].equals(new THREE.Vector3(0, 0, 0))).to.be.true();
      expect(lines[5].distanceTo(new THREE.Vector3(0, 0, 30))).to.be.closeTo(0, EPSILON);
    });
  });
});
