// import chai, { expect } from 'chai';
// import dirtyChai from 'dirty-chai';
// import FBXUtils from './FBXExporterUtils';
//
// chai.use(dirtyChai);
//
// describe('FBXUtils.reworkIndices(array)', () => {
//   const array = [0, 1, 2, 3, 4, 5, 6, 7, 8];
//   const expectedReworkedArray = [0, 1, -3, 3, 4, -6, 6, 7, -9];
//   const int32InputArray = Int32Array.from(array);
//   const expectedInt32ReworkedArray = Int32Array.from(expectedReworkedArray);
//
//   it('rework int32array into FBX notation', () => {
//     const reworkedArray = FBXUtils.reworkIndices(int32InputArray);
//     expect(reworkedArray).to.deep.equal(expectedInt32ReworkedArray);
//   });
//
//   it('accept [] arrays', () => {
//     const reworkedArray = FBXUtils.reworkIndices(array);
//     expect(reworkedArray).to.deep.equal(expectedInt32ReworkedArray);
//   });
//
//   it('do not fail on zero-length array', () => {
//     const zeroArray = new Int32Array(0);
//     expect(FBXUtils.reworkIndices(zeroArray)).to.deep.equal(new Int32Array(0));
//   });
// });
//
// describe('FBXUtils.cloneColors(numVertices, color)', () => {
//   it('clones given color to number of vertices provided', () => {
//     const color = Float32Array.from([0.5, 0.4, 0.3, 1]);
//     const numVertices = 3;
//     const expectedClonedColors = Float32Array.from([0.5, 0.4, 0.3, 1, 0.5, 0.4, 0.3, 1, 0.5, 0.4, 0.3, 1]);
//     expect(FBXUtils.cloneColors(numVertices, color)).to.have.lengthOf(numVertices * 4);
//     expect(FBXUtils.cloneColors(numVertices, color)).to.deep.equal(expectedClonedColors);
//   });
// });
//
// describe('FBXUtils.correctArrayNotation(array)', () => {
//   it('rework array elements to fixed format (6 digits)', () => {
//     const array = Float32Array.from([0.512340151968238953, 0.412375187202938591872, 0.39812756189273019845, 0.000000000000000007]);
//     const expectedArray = [0.51234, 0.412375, 0.398128, 0];
//     expect(FBXUtils.correctArrayNotation(array)).to.deep.equal(expectedArray);
//   });
// });
