import Exporter from './Exporter';

/**
 * FBX file format exporter.
 *
 * @param {}     -
 *
 * @exports FBXExporter
 * @constructor
 */
export default class FBXExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    /* Misc */
    this._outputFile = null;
    /* Exact data */
    /* Source is somewhat like ComplexVisual, but we need to catch THREE.Mesh objects */
    this._meshes = [];
    this._vertices = [];
    this._colors = [];
    this._normals = [];
  }

  /**
   * Print data to output file. Debatable.
   */
  printData() {
  }

  /**
   * Add FBXHeader info to output file.
   * Some fields are really confusing, but it seems that all listed fields are very informative
   */
  createFBXHeader() {
    const FBXHeaderVersion = 1003; /* 1003 is some number which appears to present in many 6.1 ASCII files */
    const FBXVersion = 6100; /* Mandatory and only supported version */
    let CreationTimeStamp = { /* Seems like mandatory object to be */
      Version: 1000,
      Year: 0,
      Month: 0,
      Day: 0,
      Hour: 0,
      Minute: 0,
      Second: 0,
      Millisecond: 0,
    };
    const Creator = 'Miew FBX Exporter v.0.1'; /* Supposed to be an engine */
    let OtherFlags = { /* Really dont know what is is. Looks like it is not mandatory, but left as potential future thingy */
      FlagPLE: 0,
    };
    const CreatorTool = 'Miew FBX Exporter v.0.1'; /* Supposed to be exact exporter tool */
    const CreationTime = ''; /* Seems like unnecessary repeating of creationTimeStamp */

    /* Here we'll somehow print gathered data to file */
    this.printData();
  }

  /**
   * Add Definitions info to output file.
   * Not exactly sure if this section is template section (as it is in 7.4+) or it should every time be like this
   */
  createDefinitions() {
    const Version = 100; /* Mystery 100, but appears that it's not checked properly */
    let count = 3; /* Biggest mystery here. Every 6.1. file has this field = 3. Why?  I think that here must be
    some sort of 'let count = calculateCount()' or something, cos i _think_ that it's object, geometry,material etc count */
    /* Then we must know how many and exactly what Object Types there are */
    let objectTypes = []; /* Somewhat like 'let objectTypes = getObjectTypes()' or something. What about count of that objects? */

    /* Here we'll somehow print gathered data to file */
    this.printData();
  }

  /**
   * Add Objects info to output file.
   */
  addObjects() {
    this._addModels(); /* Vertices + Layers */
    this._addMaterials();
    this._addPose();
    this._addGlobalSettings();

    /* Here we'll somehow print gathered data to file */
    this.printData();
  }

  /**
   * Add Relations info to output file.
   */
  addRelations() {
    /* Here we'll somehow print gathered data to file */
    this.printData();
  }

  /**
   * Add Connections info to output file.
   */
  addConnections() {
    /* Here we'll somehow print gathered data to file */
    this.printData();
  }

  /**
   * Add Animation info to output file.
   */
  addAnimation() {
    /* Here we'll somehow print gathered data to file */
    this.printData();
  }
}

FBXExporter.formats = ['fbx'];
