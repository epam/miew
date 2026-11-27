import * as THREE from 'three';

/**
 * Renders the crystallographic unit cell wireframe.
 * Origin axes (+a, +b, +c) are colored Red, Green, and Blue.
 * Remaining 9 bounding edges are styled with neutral gray.
 */
class UnitCellObject {
  /**
   * @param {import('../chem/UnitCell').default} unitCell - Crystallographic unit cell model.
   */
  constructor(unitCell) {
    this._unitCell = unitCell;
    this._geometry = null;
    this._material = null;
    this._lines = null;

    this._build();
  }

  _build() {
    const segments = this._unitCell.getLineSegments();
    const n = segments.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);

    const axisColors = [
      [1.0, 0.0, 0.0], // +a axis (Red)
      [0.0, 1.0, 0.0], // +b axis (Green)
      [0.0, 0.0, 1.0], // +c axis (Blue)
    ];
    const grayColor = [0.5, 0.5, 0.5]; // Neutral gray

    for (let i = 0; i < n; i++) {
      const v = segments[i];
      const pIdx = i * 3;
      positions[pIdx] = v.x;
      positions[pIdx + 1] = v.y;
      positions[pIdx + 2] = v.z;

      const segIdx = Math.floor(i / 2);
      const [cr, cg, cb] = segIdx < 3 ? axisColors[segIdx] : grayColor;
      colors[pIdx] = cr;
      colors[pIdx + 1] = cg;
      colors[pIdx + 2] = cb;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
    });

    this._geometry = geometry;
    this._material = material;
    this._lines = new THREE.LineSegments(geometry, material);
  }

  getMesh() {
    return this._lines;
  }

  setVisible(visible) {
    if (this._lines) {
      this._lines.visible = visible;
    }
  }

  dispose() {
    if (this._geometry) {
      this._geometry.dispose();
      this._geometry = null;
    }
    if (this._material) {
      this._material.dispose();
      this._material = null;
    }
    this._lines = null;
  }
}

export default UnitCellObject;
