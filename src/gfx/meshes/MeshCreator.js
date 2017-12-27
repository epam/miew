

import geometries from '../geometries/geometries';
import meshes from './meshes';
import ThickLinesGeometry from '../geometries/ThickLinesGeometry';

function setMatParams(params, uniforms) {
  return function(material) {
    material.setValues(params);
    material.setUberOptions(uniforms);
  };
}

function _createInstancedCylinders(useZSprites, openEnded) {
  return {
    Geometry: function(a, b) {
      return new geometries.Instanced2CCylindersGeometry(a, b, useZSprites, openEnded);
    },
    Object: meshes.ZSprite,
    initMaterial: setMatParams({
      instancedMatrix: true,
      attrColor: true,
      attrColor2: true,
      attrAlphaColor: true,
      cylinderSprite: useZSprites,
    }),
  };
}

function _createLineSegmentsGeoTriplet(geo, renderParams) {
  var thickLines = geo.prototype instanceof ThickLinesGeometry;
  var lineWidth = renderParams.lineWidth || 0;
  return {
    Geometry: geo,
    Object: thickLines ? meshes.ThickLineMesh : meshes.LineSegments,
    initMaterial: setMatParams({
      lights: false,
      attrColor: true,
      attrAlphaColor: true,
      thickLine: thickLines,
    }, {
      lineWidth: lineWidth,
    }),
  };
}

function _createSimpleGeoTriplet(geoClass) {
  return {
    Geometry: geoClass,
    Object: meshes.Mesh,
    initMaterial: setMatParams({
      attrColor: true,
      attrAlphaColor: true,
    }),
  };
}

function _createIsoSurfaceGeoTriplet(geoClass, caps, settings, renderParams) {
  var surfaceOpts = {
    wireframe: !!renderParams.wireframe,
    fakeOpacity: settings.now.isoSurfaceFakeOpacity,
    zClip: renderParams.zClip,
  };
  return {
    Geometry: geoClass,
    Object: meshes.ZClipped,
    initMaterial: setMatParams({
      attrColor: true,
      attrAlphaColor: false,
      wireframe: surfaceOpts.wireframe,
      fakeOpacity: surfaceOpts.fakeOpacity,
      zClip: surfaceOpts.zClip,
    }),
  };
}

function MeshCreator() {

}

MeshCreator.createSpheres = function(caps, settings) {
  var useZSprites = settings.now.zSprites;
  return {
    Geometry: function(a, b) {
      return new geometries.InstancedSpheresGeometry(a, b, useZSprites);
    },
    Object: meshes.ZSprite,
    initMaterial: setMatParams({
      instancedPos: true,
      attrColor: true,
      attrAlphaColor: true,
      sphereSprite: useZSprites,
    }),
  };
};

// TODO thisnk about interface and responsibilities
MeshCreator.create2CClosedCylinders = function(_caps, _settings) {
  return _createInstancedCylinders(false, false);
};

MeshCreator.create2CCylinders = function(caps, settings) {
  return _createInstancedCylinders(settings.now.zSprites, true);
};

MeshCreator.create2CLines = function(_caps, _settings, renderParams) {
  return _createLineSegmentsGeoTriplet(geometries.TwoColorLinesGeometry, renderParams);
};

MeshCreator.createCrosses = function(_caps, _settings, renderParams) {
  return _createLineSegmentsGeoTriplet(geometries.CrossGeometry, renderParams);
};

MeshCreator.createExtrudedChains = function(_caps, _settings) {
  return _createSimpleGeoTriplet(geometries.ExtrudedObjectsGeometry);
};

MeshCreator.createChunkedLines = function(_caps, _settings, renderParams) {
  return _createLineSegmentsGeoTriplet(geometries.ChunkedLinesGeometry, renderParams);
};

MeshCreator.createQuickSurface = function(caps, settings, renderParams) {
  return _createIsoSurfaceGeoTriplet(geometries.QuickSurfGeometry, caps, settings, renderParams);
};

MeshCreator.createContactSurface = function(caps, settings, renderParams) {
  return _createIsoSurfaceGeoTriplet(geometries.ContactSurfaceGeometry, caps, settings, renderParams);
};

MeshCreator.createSASSES = function(caps, settings, renderParams) {
  return _createIsoSurfaceGeoTriplet(geometries.SSIsosurfaceGeometry, caps, settings, renderParams);
};

MeshCreator.createLabels = function(_caps, _settings) {
  return {
    Geometry: geometries.LabelsGeometry,
    Object: meshes.Text,
    initMaterial: function() {},
  };
};

export default MeshCreator;

