import geometries from '../geometries/geometries';
import meshes from './meshes';
import ThickLinesGeometry from '../geometries/ThickLinesGeometry';

function setMatParams(params, uniforms) {
  return function (material) {
    material.setValues(params);
    material.setUberOptions(uniforms);
  };
}

function _createInstancedCylinders(useZSprites, openEnded) {
  function Geometry(a, b) {
    return new geometries.Instanced2CCylindersGeometry(a, b, useZSprites, openEnded);
  }
  return {
    Geometry,
    Object: useZSprites ? meshes.ZSprite : meshes.Instanced,
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
  const thickLines = geo.prototype instanceof ThickLinesGeometry;
  const lineWidth = renderParams.lineWidth || 0;
  return {
    Geometry: geo,
    Object: thickLines ? meshes.ThickLineMesh : meshes.LineSegments,
    initMaterial: setMatParams({
      lights: false,
      attrColor: true,
      attrAlphaColor: true,
      thickLine: thickLines,
    }, {
      lineWidth,
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
  const surfaceOpts = {
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

class MeshCreator {
  static createSpheres(caps, settings) {
    const useZSprites = settings.now.zSprites;
    function Geometry(a, b) {
      return new geometries.InstancedSpheresGeometry(a, b, useZSprites);
    }
    return {
      Geometry,
      Object: useZSprites ? meshes.ZSprite : meshes.Instanced,
      initMaterial: setMatParams({
        instancedPos: true,
        attrColor: true,
        attrAlphaColor: true,
        sphereSprite: useZSprites,
      }),
    };
  }

  static create2CClosedCylinders(_caps, _settings) {
    return _createInstancedCylinders(false, false);
  }

  static create2CCylinders(caps, settings) {
    return _createInstancedCylinders(settings.now.zSprites, true);
  }

  static create2CLines(_caps, _settings, renderParams) {
    return _createLineSegmentsGeoTriplet(geometries.TwoColorLinesGeometry, renderParams);
  }

  static createCrosses(_caps, _settings, renderParams) {
    return _createLineSegmentsGeoTriplet(geometries.CrossGeometry, renderParams);
  }

  static createExtrudedChains(_caps, _settings) {
    return _createSimpleGeoTriplet(geometries.ExtrudedObjectsGeometry);
  }

  static createChunkedLines(_caps, _settings, renderParams) {
    return _createLineSegmentsGeoTriplet(geometries.ChunkedLinesGeometry, renderParams);
  }

  static createQuickSurface(caps, settings, renderParams) {
    return _createIsoSurfaceGeoTriplet(geometries.QuickSurfGeometry, caps, settings, renderParams);
  }

  static createContactSurface(caps, settings, renderParams) {
    return _createIsoSurfaceGeoTriplet(geometries.ContactSurfaceGeometry, caps, settings, renderParams);
  }

  static createSASSES(caps, settings, renderParams) {
    return _createIsoSurfaceGeoTriplet(geometries.SSIsosurfaceGeometry, caps, settings, renderParams);
  }

  static createLabels(_caps, _settings) {
    return {
      Geometry: geometries.LabelsGeometry,
      Object: meshes.Text,
      initMaterial() {
      },
    };
  }
}

export default MeshCreator;
