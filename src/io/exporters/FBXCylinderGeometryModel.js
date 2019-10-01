//import FBXUtils from './FBXExporterUtils';

const POS_SIZE = 3; // FIXME make it only one
const COL_SIZE = 3;
const FBX_POS_SIZE = 3;
const FBX_COL_SIZE = 4;

/**
 * Utils class for simplifying cylinders procedures
 */
export default class FBXCylinderGeometryModel {
  constructor(modificator, mesh) {
    if (!mesh || !modificator) {
      throw new Error('Error in cylinder dividing');
    }
    this.regularIndexArray = null;
    this.regularNormalsArray = null;
    this.regularVertexArray = null;
    this.regularColorsArray = null;
    this.extendedIndexArray = null;
    this.extendedNormalsArray = null;
    this.extendedVertexArray = null;
    this.extendedColorsArray = null;
    this.modificator = modificator;
    this.resultingVertexArray = null;
    this.resultingIndexArray = null;
    this.resultingNormalsArray = null;
    this.resultingColorsArray = null;
    this.curResVerticesIndex = 0;
    this.curResNormalsIndex = 0;
    this.curResColorsIndex = 0;
    this.curResIndicesIndex = 0;
    this.closedCylinder = false;
    this._init(mesh);
    switch (modificator) {
      case 'regular':
        [this.regularIndexArray, this.regularNormalsArray, this.regularVertexArray, this.regularColorsArray] = this.createRegularArrays();
        break;
      case 'extended':
        [this.extendedIndexArray, this.extendedNormalsArray, this.extendedVertexArray, this.extendedColorsArray] = this.createExtendedArrays();
        break;
      case 'resulting':
        [this.resultingIndexArray, this.resultingNormalsArray, this.resultingVertexArray, this.resultingColorsArray] = this.createResultingArrays(mesh);
        break;
      default:
        break;
    }
  }

  /**
   * First initialization procedure
   * @param {object} mesh - given mesh
   */
  _init(mesh) {
    /* For some improvements in performance we make that definitions */
    const {
      parent: {
        parent: {
          constructor,
        },
      },
      geometry: {
        attributes: {
          position,
          normal,
        },
        index,
      },
    } = mesh;
    const vertexArrayLength = position.array.length;
    const normalArrayLength = normal.array.length;
    const indexArrayLength = index.array.length;
    /* Here we have a difference - some cylinders are closed (therefore they have additional vertices etc) and some are simple and opened */
    /* Not extended parameters are the same for both types of cylinders */
    this.vertexArrayLength = vertexArrayLength;
    this.colorsArrayLength = FBX_COL_SIZE * vertexArrayLength / POS_SIZE;
    this.normalsArrayLength = normalArrayLength;
    this.indexArrayLength = indexArrayLength;
    if (constructor.name.includes('Trace')) {
      /* that's closed cylinders */
      /* All this numbers are based purely on idea of building this cylinders :
      * Closed cylinders are built like that - bottom vertices, middle vertices, top vertices, then top and bottom hats */
      this.closedCylinder = true;
      this.extendedIndexArrayLength = indexArrayLength;
      this.extendedVertexArrayLength = vertexArrayLength + (vertexArrayLength - 2) / 5;
      this.extendedNormalsArrayLength = normalArrayLength + (normalArrayLength - 2) / 5;
      this.extendedColorsArrayLength = FBX_COL_SIZE * (vertexArrayLength / 3 + (vertexArrayLength - 2) / 15);
    } else {
      this.extendedIndexArrayLength = indexArrayLength;
      this.extendedVertexArrayLength = vertexArrayLength + vertexArrayLength / 3;
      this.extendedNormalsArrayLength = normalArrayLength + normalArrayLength / 3;
      this.extendedColorsArrayLength = FBX_COL_SIZE * (vertexArrayLength / POS_SIZE + vertexArrayLength / (POS_SIZE * 3));
    }
  }

  /**
   * Creating not extended arrays (for not-dividable cylinders)
   * @returns {[Int32Array, Float32Array, Float32Array, Float32Array]} not extended arrays of parameters
   */
  createRegularArrays() {
    const indexArray = new Int32Array(this.indexArrayLength);
    const normalsArray = new Float32Array(this.normalsArrayLength);
    const vertexArray = new Float32Array(this.vertexArrayLength);
    const colorsArray = new Float32Array(this.colorsArrayLength);
    return [indexArray, normalsArray, vertexArray, colorsArray];
  }

  /**
   * Creating extended arrays (for dividable cylinders)
   * @returns {[Int32Array, Float32Array, Float32Array, Float32Array]} extended arrays of parameters
   */
  createExtendedArrays() {
    const extendedIndexArray = new Int32Array(this.extendedIndexArrayLength);
    const extendedNormalsArray = new Float32Array(this.extendedNormalsArrayLength);
    const extendedVertexArray = new Float32Array(this.extendedVertexArrayLength);
    const extendedColorsArray = new Float32Array(this.extendedColorsArrayLength);
    return [extendedIndexArray, extendedNormalsArray, extendedVertexArray, extendedColorsArray];
  }

  /**
   * Creating resulting arrays
   * @param {Object} mesh - given mesh
   * @returns {[Int32Array, Float32Array, Float32Array, Float32Array]} arrays of parameters
   */
  createResultingArrays(mesh) {
    const {
      geometry: {
        attributes: {
          alphaColor,
        },
      },
    } = mesh;
    const numInstances = alphaColor.count;
    const resVertices = new Float32Array(this.extendedVertexArrayLength * numInstances);
    const resIndices = new Float32Array(this.extendedIndexArrayLength * numInstances);
    const resNormals = new Float32Array(this.extendedNormalsArrayLength * numInstances);
    const resColors = new Float32Array(this.extendedColorsArrayLength * numInstances);
    return [resIndices, resNormals, resVertices, resColors];
  }

  /**
   * Simple getter for working arrays
   * @returns {null|*[]} working arrays
   */
  getArrays() {
    switch (this.modificator) {
      case 'regular':
        return [this.regularIndexArray, this.regularNormalsArray, this.regularVertexArray, this.regularColorsArray];
      case 'extended':
        return [this.extendedIndexArray, this.extendedNormalsArray, this.extendedVertexArray, this.extendedColorsArray];
      case 'resulting':
        return [this.resultingIndexArray, this.resultingNormalsArray, this.resultingVertexArray, this.resultingColorsArray];
      default:
        return null;
    }
  }

  /**
   * Utility for storing color arrays
   * @param {Array} color - color array
   */
  storeColors(color) {
    switch (this.modificator) {
      case 'regular':
        this.regularColorsArray = color;
        break;
      case 'extended':
        this.extendedColorsArray = color;
        break;
      default:
        break;
    }
  }

  /**
   * Storing gathered data to model
   * @param {FBXCylinderGeometryModel} model - cylinder model
   */
  storeResults(model) {
    const reworkedVertices = model.getArrays()[2];
    const reworkedNormals = model.getArrays()[1];
    const reworkedColors = model.getArrays()[3];
    const reworkedIndices = model.getArrays()[0];
    this.resultingVertexArray.set(reworkedVertices, this.curResVerticesIndex);
    this.resultingNormalsArray.set(reworkedNormals, this.curResNormalsIndex);
    this.resultingColorsArray.set(reworkedColors, this.curResColorsIndex);
    this.resultingIndexArray.set(reworkedIndices, this.curResIndicesIndex);
    /* Updating current position in resulting arrays */
    this.curResVerticesIndex += reworkedVertices.length;
    this.curResIndicesIndex += reworkedIndices.length;
    this.curResColorsIndex += reworkedColors.length;
    this.curResNormalsIndex += reworkedNormals.length;
  }
}
