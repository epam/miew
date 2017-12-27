

import * as THREE from 'three';
import utils from '../utils';
import settings from '../settings';

var prec = settings.now.fbxprec;
var heading =
  ';  FBX 6.1.0 project file\n' +
  '; Copyright (C) 1997-2007 Autodesk Inc. and/or its licensors.\n' +
  '; All rights reserved.\n' +
  '; ----------------------------------------------------\n' +
  '\n' +
  '  FBXHeaderExtension:  {\n' +
  '  FBXHeaderVersion: 1003\n' +
  '  FBXVersion: 6100\n' +
  '  CreationTimeStamp:  {\n' +
  '    Version: 1000\n' +
  '    Year: 2015\n' +
  '    Month: 12\n' +
  '    Day: 7\n' +
  '    Hour: 17\n' +
  '    Minute: 34\n' +
  '    Second: 53\n' +
  '    Millisecond: 369\n' +
  '  }\n' +
  ' Creator: "FBX SDK/FBX Plugins build 20080212"\n' +
  '  OtherFlags:  {\n' +
  '    FlagPLE: 0\n' +
  '  }\n' +
  '}\n' +
  'reationTime: "2015-12-07 17:34:53:369"\n' +
  'reator: "FBX SDK/FBX Plugins build 20080212"\n' +
  '\n' +
  '; Document Description\n' +
  ';------------------------------------------------------------------\n' +
  '\n' +
  '  Document:  {\n' +
  ' Name: ""\n' +
  '}\n' +
  '\n' +
  '; Document References\n' +
  ';------------------------------------------------------------------\n' +
  '\n' +
  '  References:  {\n' +
  '}\n' +
  '\n' +
  '; Object definitions\n' +
  ';------------------------------------------------------------------\n' +
  '\n' +
  '  Definitions:  {\n' +
  '  Version: 100\n' +
  '  Count: 3\n' +
  '  ObjectType: "Model" {\n' +
  '    Count: 1\n' +
  '  }\n' +
  '  ObjectType: "SceneInfo" {\n' +
  '    Count: 1\n' +
  '  }\n' +
  '  ObjectType: "GlobalSettings" {\n' +
  '    Count: 1\n' +
  '  }\n' +
  '}\n' +
  '\n' +
  '; Object properties\n' +
  ';------------------------------------------------------------------\n' +
  '\n' +
  '  Objects:  {\n' +
  '  Model: "Model::Sphere01", "Mesh" {\n' +
  '    Version: 232\n' +
  '    Properties60:  {\n' +
  '      Property: "QuaternionInterpolate", "bool", "",0\n' +
  '      Property: "RotationOffset", "Vector3D", "",0,0,0\n' +
  '      Property: "RotationPivot", "Vector3D", "",0,0,0\n' +
  '      Property: "ScalingOffset", "Vector3D", "",0,0,0\n' +
  '      Property: "ScalingPivot", "Vector3D", "",0,0,0\n' +
  '      Property: "TranslationActive", "bool", "",0\n' +
  '      Property: "TranslationMin", "Vector3D", "",0,0,0\n' +
  '      Property: "TranslationMax", "Vector3D", "",0,0,0\n' +
  '      Property: "TranslationMinX", "bool", "",0\n' +
  '      Property: "TranslationMinY", "bool", "",0\n' +
  '      Property: "TranslationMinZ", "bool", "",0\n' +
  '      Property: "TranslationMaxX", "bool", "",0\n' +
  '      Property: "TranslationMaxY", "bool", "",0\n' +
  '      Property: "TranslationMaxZ", "bool", "",0\n' +
  '      Property: "RotationOrder", "enum", "",0\n' +
  '      Property: "RotationSpaceForLimitOnly", "bool", "",0\n' +
  '      Property: "RotationStiffnessX", "double", "",0\n' +
  '      Property: "RotationStiffnessY", "double", "",0\n' +
  '      Property: "RotationStiffnessZ", "double", "",0\n' +
  '      Property: "AxisLen", "double", "",10\n' +
  '      Property: "PreRotation", "Vector3D", "",0,0,0\n' +
  '      Property: "PostRotation", "Vector3D", "",0,0,0\n' +
  '      Property: "RotationActive", "bool", "",0\n' +
  '      Property: "RotationMin", "Vector3D", "",0,0,0\n' +
  '      Property: "RotationMax", "Vector3D", "",0,0,0\n' +
  '      Property: "RotationMinX", "bool", "",0\n' +
  '      Property: "RotationMinY", "bool", "",0\n' +
  '      Property: "RotationMinZ", "bool", "",0\n' +
  '      Property: "RotationMaxX", "bool", "",0\n' +
  '      Property: "RotationMaxY", "bool", "",0\n' +
  '      Property: "RotationMaxZ", "bool", "",0\n' +
  '      Property: "InheritType", "enum", "",1\n' +
  '      Property: "ScalingActive", "bool", "",0\n' +
  '      Property: "ScalingMin", "Vector3D", "",1,1,1\n' +
  '      Property: "ScalingMax", "Vector3D", "",1,1,1\n' +
  '      Property: "ScalingMinX", "bool", "",0\n' +
  '      Property: "ScalingMinY", "bool", "",0\n' +
  '      Property: "ScalingMinZ", "bool", "",0\n' +
  '      Property: "ScalingMaxX", "bool", "",0\n' +
  '      Property: "ScalingMaxY", "bool", "",0\n' +
  '      Property: "ScalingMaxZ", "bool", "",0\n' +
  '      Property: "GeometricTranslation", "Vector3D", "",0,0,0\n' +
  '      Property: "GeometricRotation", "Vector3D", "",0,0,0\n' +
  '      Property: "GeometricScaling", "Vector3D", "",1,1,1\n' +
  '      Property: "MinDampRangeX", "double", "",0\n' +
  '      Property: "MinDampRangeY", "double", "",0\n' +
  '      Property: "MinDampRangeZ", "double", "",0\n' +
  '      Property: "MaxDampRangeX", "double", "",0\n' +
  '      Property: "MaxDampRangeY", "double", "",0\n' +
  '      Property: "MaxDampRangeZ", "double", "",0\n' +
  '      Property: "MinDampStrengthX", "double", "",0\n' +
  '      Property: "MinDampStrengthY", "double", "",0\n' +
  '      Property: "MinDampStrengthZ", "double", "",0\n' +
  '      Property: "MaxDampStrengthX", "double", "",0\n' +
  '      Property: "MaxDampStrengthY", "double", "",0\n' +
  '      Property: "MaxDampStrengthZ", "double", "",0\n' +
  '      Property: "PreferedAngleX", "double", "",0\n' +
  '      Property: "PreferedAngleY", "double", "",0\n' +
  '      Property: "PreferedAngleZ", "double", "",0\n' +
  '      Property: "LookAtProperty", "object", ""\n' +
  '      Property: "UpVectorProperty", "object", ""\n' +
  '      Property: "Show", "bool", "",1\n' +
  '      Property: "NegativePercentShapeSupport", "bool", "",1\n' +
  '      Property: "DefaultAttributeIndex", "int", "",0\n' +
  '      Property: "Lcl Translation", "Lcl Translation", "A+",-0.169204741716385,-0.507614195346832,0\n' +
  '      Property: "Lcl Rotation", "Lcl Rotation", "A+",0,0,0\n' +
  '      Property: "Lcl Scaling", "Lcl Scaling", "A+",1,1,1\n' +
  '      Property: "Visibility", "Visibility", "A+",1\n' +
  '      Property: "BBoxMin", "Vector3D", "N",0,0,0\n' +
  '      Property: "BBoxMax", "Vector3D", "N",0,0,0\n' +
  '    }\n' +
  '    MultiLayer: 0\n' +
  '    MultiTake: 1\n' +
  '    Shading: T\n' +
  '   Culling: "CullingOff"\n';

var ending =
    'NodeAttributeName: "Geometry::Sphere01"\n' +
    '}\n' +
    'ceneInfo: "SceneInfo::GlobalInfo", "UserData" {\n' +
    ' Type: "UserData"\n' +
    '  Version: 100\n' +
    '  MetaData:  {\n' +
    '    Version: 100\n' +
    '   Title: ""\n' +
    '   Subject: ""\n' +
    '   Author: ""\n' +
    '   Keywords: ""\n' +
    '   Revision: ""\n' +
    '   Comment: ""\n' +
    '  }\n' +
    '  Properties60:  {\n' +
    '    Property: "DocumentUrl", "KString", "", "D:\\depot\\MolViewer\\Assets\\models\\test1.FBX"\n' +
    '    Property: "SrcDocumentUrl", "KString", "", "D:\\depot\\MolViewer\\Assets\\models\\test1.FBX"\n' +
    '   Property: "Original", "Compound", ""\n' +
    '   Property: "Original|ApplicationVendor", "KString", "", "Autodesk"\n' +
    '   Property: "Original|ApplicationName", "KString", "", "3ds Max"\n' +
    '   Property: "Original|ApplicationVersion", "KString", "", "2009.0"\n' +
    '   Property: "Original|DateTime_GMT", "DateTime", "", "07/12/2015 14:34:53.369"\n' +
    '    Property: "Original|FileName", "KString", "", "D:\\depot\\MolViewer\\Assets\\models\\test1.FBX"\n' +
    '   Property: "LastSaved", "Compound", ""\n' +
    '   Property: "LastSaved|ApplicationVendor", "KString", "", "Autodesk"\n' +
    '   Property: "LastSaved|ApplicationName", "KString", "", "3ds Max"\n' +
    '   Property: "LastSaved|ApplicationVersion", "KString", "", "2009.0"\n' +
    '   Property: "LastSaved|DateTime_GMT", "DateTime", "", "07/12/2015 14:34:53.369"\n' +
    '  }\n' +
    '}\n' +
    'lobalSettings:  {\n' +
    '  Version: 1000\n' +
    '  Properties60:  {\n' +
    '    Property: "UpAxis", "int", "",2\n' +
    '    Property: "UpAxisSign", "int", "",1\n' +
    '    Property: "FrontAxis", "int", "",1\n' +
    '    Property: "FrontAxisSign", "int", "",-1\n' +
    '    Property: "CoordAxis", "int", "",0\n' +
    '    Property: "CoordAxisSign", "int", "",1\n' +
    '    Property: "UnitScaleFactor", "double", "",2.54\n' +
    '  }\n' +
    '}\n' +
    '}\n' +
    '\n' +
    '; Object relations\n' +
    ';------------------------------------------------------------------\n' +
    '\n' +
    '  Relations:  {\n' +
    '  Model: "Model::Sphere01", "Mesh" {\n' +
    '  }\n' +
    '  SceneInfo: "SceneInfo::GlobalInfo", "UserData" {\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    '; Object connections\n' +
    ';------------------------------------------------------------------\n' +
    '\n' +
    '  Connections:  {\n' +
    ' Connect: "OO", "Model::Sphere01", "Model::Scene"\n' +
    '}\n' +
    '\n' +
    ';Object data\n' +
    ';------------------------------------------------------------------\n' +
    '\n' +
    '  ObjectData:  {\n' +
    '}\n' +
    ';Takes and animation section\n' +
    ';----------------------------------------------------\n' +
    '\n' +
    '  Takes:  {\n' +
    ' Current: "Take 001"\n' +
    '}\n' +
    ';Version 5 settings\n' +
    ';------------------------------------------------------------------\n' +
    '\n' +
    '  Version5:  {\n' +
    '  AmbientRenderSettings:  {\n' +
    '    Version: 101\n' +
    '    AmbientLightColor: 0.533333003520966,0.533333003520966,0.533333003520966,1\n' +
    '  }\n' +
    '  FogOptions:  {\n' +
    '    FlogEnable: 0\n' +
    '    FogMode: 0\n' +
    '    FogDensity: 0.002\n' +
    '    FogStart: 0.3\n' +
    '    FogEnd: 1000\n' +
    '    FogColor: 1,1,1,1\n' +
    '  }\n' +
    '  Settings:  {\n' +
    '   FrameRate: "30"\n' +
    '    TimeFormat: 1\n' +
    '    SnapOnFrames: 0\n' +
    '    ReferenceTimeIndex: -1\n' +
    '    TimeLineStartTime: 0\n' +
    '    TimeLineStopTime: 153953860000\n' +
    '  }\n' +
    '  RendererSetting:  {\n' +
    '   DefaultCamera: ""\n' +
    '    DefaultViewingMode: 0\n' +
    '  }\n' +
    '}\n' +
    '\n';

function _errorHandler(e) {
  var msg;

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

var fileSystem = null;

function _writeToFile(filename, data, isBinary, append, callback) {
  fileSystem.root.getFile(filename, {create: !append}, function(fileEntry) {

    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function(fileWriter) {          //

      // Create a new Blob and write it to log.txt.
      var blob = new Blob([data], {type: isBinary ? 'octet/stream' : 'text/plain'});
      //fileWriter.write(blob);
      if (append) {
        fileWriter.onwriteend = function() {
          callback();
        };
        fileWriter.seek(fileWriter.length); // Start write position at EOF.
        fileWriter.write(blob);
      } else {
        fileWriter.onwriteend = function() {
          if (fileWriter.length === 0 && data.length > 0) {
            //fileWriter has been reset, write file
            fileWriter.write(blob);
          } else {
            //file has been overwritten with blob
            //use callback or resolve promise
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

Queue.prototype.add = function(filename, data, isBinary, append) {
  this.queue.push([filename, data, isBinary, append]);
  if (!this.busy) {
    this.next();
  }
};

Queue.prototype.next = function() {
  var params = this.queue.shift();
  var self = this;

  if (params && !self.busy) {
    this.busy = true;
    _writeToFile(params[0], params[1], params[2], params[3], function() {
      self.busy = false;
      self.next();
    });
  }
};

function _stringifyArray(arr) {
  var str = [];
  for (var i = 0, n = arr.length; i < n; ++i) {
    str[i] = arr[i].toFixed(prec);
  }
  str = str.join(',');
  return str;
}

function _wrapValuesVector(queue, fname, layerName, vectorName, vectorData, layerData) {

  queue.add(fname, layerName + ': 0 {\n' +
    'Version: 101\n' +
    'Name: ""\n' +
    'MappingInformationType: "ByVertice"\n' +
    'ReferenceInformationType: "Direct"\n' +
    vectorName + ': ' + vectorData + '\n' +
    '}\n', false, true);
  return layerData + 'LayerElement:  {\n' +
      'Type: "' + layerName + '"\n' +
      'TypedIndex: 0\n' +
      '}\n';
}

function _exportData(queue, indices, positions, normals, colors, uvs) {
  var fname = 'totals.txt';
  queue.add(fname, heading, false, false);
  queue.add(fname, 'Vertices: ', false, true);
  queue.add(fname, _stringifyArray(positions), false, true);
  queue.add(fname, '\nPolygonVertexIndex: ', false, true);
  queue.add(fname, _stringifyArray(indices), false, true);
  queue.add(fname, '\nGeometryVersion: 124\n', false, true);

  var layersData = 'Layer: 0 {\nVersion: 100\n';
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
  var arr = utils.allocateTyped(Float32Array, arr1.length + arr2.length);
  arr.set(arr1);
  arr.set(arr2, arr1.length);
  return arr;
}

function _concatIndices(arr1, arr2, startIndex) {
  var len1 = arr1.length;
  var lenTotal = len1 + arr2.length;
  var arr = utils.allocateTyped(Int32Array, lenTotal);
  arr.set(arr1);
  arr.set(arr2, len1);
  for (var i = len1; i < lenTotal; ++i) {
    arr[i] += startIndex;
  }
  return arr;
}

function _appendGeometry(structure, geom) {
  var idc = utils.allocateTyped(Int32Array, geom.index.array);
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
  for (var i = 0, n = arr.length; i < n; ++i) {
    if (i % 3 === 2) {
      arr[i] = ~arr[i];
    }
  }
}

function _prepareColorArray(arr) {
  var newLen = arr.length / 3 * 4;
  var newArr = utils.allocateTyped(Float32Array, newLen);
  var newIdx = 0;
  for (var i = 0, n = arr.length / 3; i < n; ++i) {
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
    null
  );

}


function exportModel(queue, complex, reprList) {
  var structure = {indices: null};

  function addGeoms(object) {
    if (object instanceof THREE.Mesh) {
      _appendGeometry(structure, object.geometry);
    }
    for (var i = 0, l = object.children.length; i < l; i++) {
      addGeoms(object.children[i]);
    }
  }

  for (var i = 0, n = reprList.length; i < n; ++i) {
    var repr = reprList[i];
    var objects = repr.buildGeometry(complex);
    addGeoms(objects);
  }
  _dumpStructure(queue, structure);
}

function exportAtoms(queue, complex, atomsFileName, mode, colorer) {
  queue.add(atomsFileName, '', false, false);
  complex.forEachAtom(function(atom) {
    var pos = atom.getPosition();
    var col = new THREE.Color(colorer.getAtomColor(atom, complex));
    var string = 'ATOM ' +
        atom._index + ' ' +
        pos.x + ' ' + pos.y + ' ' + pos.z + ' ' +
        mode.calcAtomRadius(atom) + ' ' +
        col.r + ' ' + col.g + ' ' + col.b + '\n';
    queue.add(atomsFileName, string, false, true);
  });
}

function exportBonds(queue, complex, bondsFileName) {
  queue.add(bondsFileName, '', false, false);
  complex.forEachBond(function(bond) {
    var string = 'BIND ' +
        bond._left._index + ' ' + bond._right._index + '\n';
    queue.add(bondsFileName, string, false, true);
  });
  queue.add(bondsFileName, 'TED', false, true);
}

function fbxExport(complex, reprList, fullReport) {
  prec = settings.now.fbxprec;
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  function onInitFS(fs) {
    var queue = new Queue();
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

