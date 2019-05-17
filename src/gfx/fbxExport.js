/* global FileError */

import * as THREE from 'three';
import utils from '../utils';
import settings from '../settings';

let prec = settings.now.fbxprec;
const heading = `\
;  FBX 6.1.0 project file
; Copyright (C) 1997-2007 Autodesk Inc. and/or its licensors.
; All rights reserved.
; ----------------------------------------------------

FBXHeaderExtension:  {
  FBXHeaderVersion: 1003
  FBXVersion: 6100
  CreationTimeStamp:  {
    Version: 1000
    Year: 2015
    Month: 12
    Day: 7
    Hour: 17
    Minute: 34
    Second: 53
    Millisecond: 369
  }
  Creator: "FBX SDK/FBX Plugins build 20080212"
  OtherFlags:  {
    FlagPLE: 0
  }
}
CreationTime: "2015-12-07 17:34:53:369"
Creator: "FBX SDK/FBX Plugins build 20080212"

; Document Description
;------------------------------------------------------------------

Document:  {
  Name: ""
}

; Document References
;------------------------------------------------------------------

References:  {
}

; Object definitions
;------------------------------------------------------------------

Definitions:  {
  Version: 100
  Count: 3
  ObjectType: "Model" {
    Count: 1
  }
  ObjectType: "SceneInfo" {
    Count: 1
  }
  ObjectType: "GlobalSettings" {
    Count: 1
  }
}

; Object properties
;------------------------------------------------------------------

Objects:  {
  Model: "Model::Sphere01", "Mesh" {
    Version: 232
    Properties60:  {
      Property: "QuaternionInterpolate", "bool", "",0
      Property: "RotationOffset", "Vector3D", "",0,0,0
      Property: "RotationPivot", "Vector3D", "",0,0,0
      Property: "ScalingOffset", "Vector3D", "",0,0,0
      Property: "ScalingPivot", "Vector3D", "",0,0,0
      Property: "TranslationActive", "bool", "",0
      Property: "TranslationMin", "Vector3D", "",0,0,0
      Property: "TranslationMax", "Vector3D", "",0,0,0
      Property: "TranslationMinX", "bool", "",0
      Property: "TranslationMinY", "bool", "",0
      Property: "TranslationMinZ", "bool", "",0
      Property: "TranslationMaxX", "bool", "",0
      Property: "TranslationMaxY", "bool", "",0
      Property: "TranslationMaxZ", "bool", "",0
      Property: "RotationOrder", "enum", "",0
      Property: "RotationSpaceForLimitOnly", "bool", "",0
      Property: "RotationStiffnessX", "double", "",0
      Property: "RotationStiffnessY", "double", "",0
      Property: "RotationStiffnessZ", "double", "",0
      Property: "AxisLen", "double", "",10
      Property: "PreRotation", "Vector3D", "",0,0,0
      Property: "PostRotation", "Vector3D", "",0,0,0
      Property: "RotationActive", "bool", "",0
      Property: "RotationMin", "Vector3D", "",0,0,0
      Property: "RotationMax", "Vector3D", "",0,0,0
      Property: "RotationMinX", "bool", "",0
      Property: "RotationMinY", "bool", "",0
      Property: "RotationMinZ", "bool", "",0
      Property: "RotationMaxX", "bool", "",0
      Property: "RotationMaxY", "bool", "",0
      Property: "RotationMaxZ", "bool", "",0
      Property: "InheritType", "enum", "",1
      Property: "ScalingActive", "bool", "",0
      Property: "ScalingMin", "Vector3D", "",1,1,1
      Property: "ScalingMax", "Vector3D", "",1,1,1
      Property: "ScalingMinX", "bool", "",0
      Property: "ScalingMinY", "bool", "",0
      Property: "ScalingMinZ", "bool", "",0
      Property: "ScalingMaxX", "bool", "",0
      Property: "ScalingMaxY", "bool", "",0
      Property: "ScalingMaxZ", "bool", "",0
      Property: "GeometricTranslation", "Vector3D", "",0,0,0
      Property: "GeometricRotation", "Vector3D", "",0,0,0
      Property: "GeometricScaling", "Vector3D", "",1,1,1
      Property: "MinDampRangeX", "double", "",0
      Property: "MinDampRangeY", "double", "",0
      Property: "MinDampRangeZ", "double", "",0
      Property: "MaxDampRangeX", "double", "",0
      Property: "MaxDampRangeY", "double", "",0
      Property: "MaxDampRangeZ", "double", "",0
      Property: "MinDampStrengthX", "double", "",0
      Property: "MinDampStrengthY", "double", "",0
      Property: "MinDampStrengthZ", "double", "",0
      Property: "MaxDampStrengthX", "double", "",0
      Property: "MaxDampStrengthY", "double", "",0
      Property: "MaxDampStrengthZ", "double", "",0
      Property: "PreferedAngleX", "double", "",0
      Property: "PreferedAngleY", "double", "",0
      Property: "PreferedAngleZ", "double", "",0
      Property: "LookAtProperty", "object", ""
      Property: "UpVectorProperty", "object", ""
      Property: "Show", "bool", "",1
      Property: "NegativePercentShapeSupport", "bool", "",1
      Property: "DefaultAttributeIndex", "int", "",0
      Property: "Lcl Translation", "Lcl Translation", "A+",-0.169204741716385,-0.507614195346832,0
      Property: "Lcl Rotation", "Lcl Rotation", "A+",0,0,0
      Property: "Lcl Scaling", "Lcl Scaling", "A+",1,1,1
      Property: "Visibility", "Visibility", "A+",1
      Property: "BBoxMin", "Vector3D", "N",0,0,0
      Property: "BBoxMax", "Vector3D", "N",0,0,0
    }
    MultiLayer: 0
    MultiTake: 1
    Shading: T
   Culling: "CullingOff"
`;

const ending = `\
NodeAttributeName: "Geometry::Sphere01"
}
SceneInfo: "SceneInfo::GlobalInfo", "UserData" {
 Type: "UserData"
  Version: 100
  MetaData:  {
    Version: 100
   Title: ""
   Subject: ""
   Author: ""
   Keywords: ""
   Revision: ""
   Comment: ""
  }
  Properties60:  {
    Property: "DocumentUrl", "KString", "", "D:\\depot\\MolViewer\\Assets\\models\\test1.FBX"
    Property: "SrcDocumentUrl", "KString", "", "D:\\depot\\MolViewer\\Assets\\models\\test1.FBX"
   Property: "Original", "Compound", ""
   Property: "Original|ApplicationVendor", "KString", "", "Autodesk"
   Property: "Original|ApplicationName", "KString", "", "3ds Max"
   Property: "Original|ApplicationVersion", "KString", "", "2009.0"
   Property: "Original|DateTime_GMT", "DateTime", "", "07/12/2015 14:34:53.369"
    Property: "Original|FileName", "KString", "", "D:\\depot\\MolViewer\\Assets\\models\\test1.FBX"
   Property: "LastSaved", "Compound", ""
   Property: "LastSaved|ApplicationVendor", "KString", "", "Autodesk"
   Property: "LastSaved|ApplicationName", "KString", "", "3ds Max"
   Property: "LastSaved|ApplicationVersion", "KString", "", "2009.0"
   Property: "LastSaved|DateTime_GMT", "DateTime", "", "07/12/2015 14:34:53.369"
  }
}
GlobalSettings:  {
  Version: 1000
  Properties60:  {
    Property: "UpAxis", "int", "",2
    Property: "UpAxisSign", "int", "",1
    Property: "FrontAxis", "int", "",1
    Property: "FrontAxisSign", "int", "",-1
    Property: "CoordAxis", "int", "",0
    Property: "CoordAxisSign", "int", "",1
    Property: "UnitScaleFactor", "double", "",2.54
  }
}
}

; Object relations
;------------------------------------------------------------------

Relations:  {
  Model: "Model::Sphere01", "Mesh" {
  }
  SceneInfo: "SceneInfo::GlobalInfo", "UserData" {
  }
}

; Object connections
;------------------------------------------------------------------

Connections:  {
  Connect: "OO", "Model::Sphere01", "Model::Scene"
}

;Object data
;------------------------------------------------------------------

ObjectData:  {
}
;Takes and animation section
;----------------------------------------------------

Takes:  {
  Current: "Take 001"
}
;Version 5 settings
;------------------------------------------------------------------

Version5:  {
  AmbientRenderSettings:  {
    Version: 101
    AmbientLightColor: 0.533333003520966,0.533333003520966,0.533333003520966,1
  }
  FogOptions:  {
    FlogEnable: 0
    FogMode: 0
    FogDensity: 0.002
    FogStart: 0.3
    FogEnd: 1000
    FogColor: 1,1,1,1
  }
  Settings:  {
   FrameRate: "30"
    TimeFormat: 1
    SnapOnFrames: 0
    ReferenceTimeIndex: -1
    TimeLineStartTime: 0
    TimeLineStopTime: 153953860000
  }
  RendererSetting:  {
   DefaultCamera: ""
    DefaultViewingMode: 0
  }
}
`;

function _errorHandler(e) {
  let msg;

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  }
  throw new Error(msg);
}

let fileSystem = null;

function _writeToFile(filename, data, isBinary, append, callback) {
  fileSystem.root.getFile(filename, { create: !append }, (fileEntry) => {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter((fileWriter) => { //
      // Create a new Blob and write it to log.txt.
      const blob = new Blob([data], { type: isBinary ? 'octet/stream' : 'text/plain' });
      // fileWriter.write(blob);
      if (append) {
        fileWriter.onwriteend = function () {
          callback();
        };
        fileWriter.seek(fileWriter.length); // Start write position at EOF.
        fileWriter.write(blob);
      } else {
        fileWriter.onwriteend = function () {
          if (fileWriter.length === 0 && data.length > 0) {
            // fileWriter has been reset, write file
            fileWriter.write(blob);
          } else {
            // file has been overwritten with blob
            // use callback or resolve promise
            callback();
          }
        };
        fileWriter.truncate(0);
      }
    }, _errorHandler);
  }, _errorHandler);
}

function Queue() { }

Queue.prototype.queue = [];
Queue.prototype.busy = false;

Queue.prototype.add = function (filename, data, isBinary, append) {
  this.queue.push([filename, data, isBinary, append]);
  if (!this.busy) {
    this.next();
  }
};

Queue.prototype.next = function () {
  const params = this.queue.shift();
  const self = this;

  if (params && !self.busy) {
    this.busy = true;
    _writeToFile(params[0], params[1], params[2], params[3], () => {
      self.busy = false;
      self.next();
    });
  }
};

function _stringifyArray(arr) {
  let str = [];
  for (let i = 0, n = arr.length; i < n; ++i) {
    str[i] = arr[i].toFixed(prec);
  }
  str = str.join(',');
  return str;
}

function _wrapValuesVector(queue, fname, layerName, vectorName, vectorData, layerData) {
  queue.add(fname, `\
${layerName}: 0 {
  Version: 101
  Name: ""
  MappingInformationType: "ByVertice"
  ReferenceInformationType: "Direct"
  ${vectorName}: ${vectorData}
}
`, false, true);
  return `\
${layerData}LayerElement: {
  Type: "${layerName}"
  TypedIndex: 0
}
`;
}

function _exportData(queue, indices, positions, normals, colors, uvs) {
  const fname = 'totals.txt';
  queue.add(fname, heading, false, false);
  queue.add(fname, 'Vertices: ', false, true);
  queue.add(fname, _stringifyArray(positions), false, true);
  queue.add(fname, '\nPolygonVertexIndex: ', false, true);
  queue.add(fname, _stringifyArray(indices), false, true);
  queue.add(fname, '\nGeometryVersion: 124\n', false, true);

  let layersData = 'Layer: 0 {\nVersion: 100\n';
  if (normals !== null) {
    layersData = _wrapValuesVector(queue, fname, 'LayerElementNormal', 'Normals', _stringifyArray(normals), layersData);
  }

  if (colors !== null) {
    layersData = _wrapValuesVector(queue, fname, 'LayerElementColor', 'Colors', _stringifyArray(colors), layersData);
  }

  if (uvs !== null) {
    layersData = _wrapValuesVector(queue, fname, 'LayerElementUV', 'UV', _stringifyArray(uvs), layersData);
  }

  layersData += '}\n';
  queue.add(fname, layersData, false, true);

  queue.add(fname, ending, false, true);
}


function _concatArrays(arr1, arr2) {
  const arr = utils.allocateTyped(Float32Array, arr1.length + arr2.length);
  arr.set(arr1);
  arr.set(arr2, arr1.length);
  return arr;
}

function _concatIndices(arr1, arr2, startIndex) {
  const len1 = arr1.length;
  const lenTotal = len1 + arr2.length;
  const arr = utils.allocateTyped(Int32Array, lenTotal);
  arr.set(arr1);
  arr.set(arr2, len1);
  for (let i = len1; i < lenTotal; ++i) {
    arr[i] += startIndex;
  }
  return arr;
}

function _appendGeometry(structure, geom) {
  const idc = utils.allocateTyped(Int32Array, geom.index.array);
  if (structure.indices === null) {
    structure.indices = idc;
    structure.positions = utils.allocateTyped(Float32Array, geom.attributes.position.array);
    structure.normals = utils.allocateTyped(Float32Array, geom.attributes.normal.array);
    structure.colors = utils.allocateTyped(Float32Array, geom.attributes.color.array);
    return;
  }
  structure.indices = _concatIndices(structure.indices, idc, structure.positions.length / 3);
  structure.positions = _concatArrays(structure.positions, geom.attributes.position.array);
  structure.normals = _concatArrays(structure.normals, geom.attributes.normal.array);
  structure.colors = _concatArrays(structure.colors, geom.attributes.color.array);
}

function _prepareIndexArray(arr) {
  for (let i = 0, n = arr.length; i < n; ++i) {
    if (i % 3 === 2) {
      arr[i] = ~arr[i];
    }
  }
}

function _prepareColorArray(arr) {
  const newLen = arr.length / 3 * 4;
  const newArr = utils.allocateTyped(Float32Array, newLen);
  let newIdx = 0;
  for (let i = 0, n = arr.length / 3; i < n; ++i) {
    newArr[newIdx++] = arr[i * 3];
    newArr[newIdx++] = arr[i * 3 + 1];
    newArr[newIdx++] = arr[i * 3 + 2];
    newArr[newIdx++] = 1.0;
  }
  return newArr;
}

function _dumpStructure(queue, structure) {
  _prepareIndexArray(structure.indices);
  structure.colors = _prepareColorArray(structure.colors);
  _exportData(
    queue, structure.indices,
    structure.positions,
    structure.normals,
    structure.colors,
    null,
  );
}


function exportModel(queue, complex, reprList) {
  const structure = { indices: null };

  function addGeoms(object) {
    if (object instanceof THREE.Mesh) {
      _appendGeometry(structure, object.geometry);
    }
    for (let i = 0, l = object.children.length; i < l; i++) {
      addGeoms(object.children[i]);
    }
  }

  for (let i = 0, n = reprList.length; i < n; ++i) {
    const repr = reprList[i];
    const objects = repr.buildGeometry(complex);
    addGeoms(objects);
  }
  _dumpStructure(queue, structure);
}

function exportAtoms(queue, complex, atomsFileName, mode, colorer) {
  queue.add(atomsFileName, '', false, false);
  complex.forEachAtom((atom) => {
    const pos = atom.getPosition();
    const col = new THREE.Color(colorer.getAtomColor(atom, complex));
    const string = `ATOM ${
      atom._index} ${
      pos.x} ${pos.y} ${pos.z} ${
      mode.calcAtomRadius(atom)} ${
      col.r} ${col.g} ${col.b}\n`;
    queue.add(atomsFileName, string, false, true);
  });
}

function exportBonds(queue, complex, bondsFileName) {
  queue.add(bondsFileName, '', false, false);
  complex.forEachBond((bond) => {
    const string = `BIND ${
      bond._left._index} ${bond._right._index}\n`;
    queue.add(bondsFileName, string, false, true);
  });
  queue.add(bondsFileName, 'TED', false, true);
}

function fbxExport(complex, reprList, fullReport) {
  prec = settings.now.fbxprec;
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  function onInitFS(fs) {
    const queue = new Queue();
    fileSystem = fs;
    if (fullReport) {
      exportAtoms(queue, complex, 'atoms.txt', reprList);
      exportBonds(queue, complex, 'bonds.txt');
    }
    exportModel(queue, complex, reprList);
  }
  window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 1024, onInitFS, _errorHandler);
}

export default fbxExport;
