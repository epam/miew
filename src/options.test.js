import _ from 'lodash';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import options from './options';

chai.use(dirtyChai);

describe('options', () => {
  /** ******** REP LIST *********** */
  const mBScELrep = {
    mode: 'BS',
    colorer: 'EL',
  };

  const mQSmtTRrep = {
    mode: 'QS',
    material: 'TR',
  };

  const parameterRep = {
    mode: [
      'TR', {
        radius: 0.5,
      },
    ],
    colorer: [
      'EL', {
        carbon: 0,
      },
    ],
  };
  const subsetRepSimple = {
    mode: [
      'CS', {
        subset: 'chain A and sequence 29 or serial 196',
      },
    ],
  };

  const bigRep = {
    selector: 'sequence 85, 175, 256 and name CB and sequence 1:286',
    mode: 'TX',
    colorer: 'EL',
    material: 'SF',
  };

  /** ******** REP TEST SETS *********** */
  const mBScELrepOpts = {
    reps: [mBScELrep],
  };
  const mBScELrepStr = 'r=0&m=BS&c=EL';
  const mBScELrepCommands = ['rep 0 m=BS c=EL'];

  const bigRepsOpts = {
    reps: [bigRep],
  };
  const bigRepsStr = 'r=0&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286&m=TX&c=EL&mt=SF';
  const bigRepsCommands = [
    'rep 0 s="sequence 85, 175, 256 and name CB and sequence 1:286" m=TX c=EL mt=SF',
  ];

  const paramRepsOpts = {
    preset: 'default',
    reps: [parameterRep],
  };
  const paramRepStr = 'p=default&r=0&m=TR!radius:0.5&c=EL!carbon:0';
  const paramRepCommands = [
    'preset default',
    'rep 0 m=TR radius=0.5 c=EL carbon=0',
  ];

  const subsetRepsSimpleOpts = {
    reps: [subsetRepSimple],
  };
  const subsetRepsSimpleStr = 'r=0&m=CS!subset:chain+A+and+sequence+29+or+serial+196';
  const subsetRepsSimpleCommands = [
    'rep 0 m=CS subset="chain A and sequence 29 or serial 196"',
  ];

  const textModeOpts = {
    reps: [{
      mode: ['TX', {
        template: 'The {{Chain}}.{{Residue}}.{{Sequence}}.{{Name}}',
      }],
    }],
  };

  const textModeStr = 'r=0&m=TX!template:The+%257B%257BChain%257D%257D.%257B%257BResidue'
    + '%257D%257D.%257B%257BSequence%257D%257D.%257B%257BName%257D%257D';
  const textModeCommands = [
    'rep 0 m=TX template="The {{Chain}}.{{Residue}}.{{Sequence}}.{{Name}}"',
  ];

  const multipleRepsOpts = {
    preset: 'default',
    reps: [mBScELrep, parameterRep],
  };
  const multipleRepsStr = 'p=default&r=0&m=BS&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0';
  const multipleRepsCommands = [
    'preset default',
    'rep 0 m=BS c=EL',
    'rep 1 m=TR radius=0.5 c=EL carbon=0',
  ];

  const duplicatedRepsOpts = {
    preset: 'default',
    reps: [mBScELrep, parameterRep, mQSmtTRrep],
  };
  const duplicatedRepsStr = 'p=default&r=0&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0&rep=0&dup&m=QS&mt=TR&r=0&m=BS';
  const doubleModeRepsStr = 'p=default&r=0&m=BS&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0&rep=0&m=QS&mt=TR';

  /** ******** OBJECTS TEST SETS *********** */
  const objectsList = [
    {
      type: 'line',
      params: ['A.38.CO1', 'A.38.CO2'],
    }, {
      type: 'line',
      params: ['A.38.CO1', 'A.38.CO2'],
      opts: {
        color: 0xFFCCFFFF,
        dashSize: 0.5,
      },
    },
  ];

  const objectsOpts = {
    _objects: objectsList,
  };
  const objectsStr = 'o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!color:4291624959,dashSize:0.5';
  const objectsCommands = [
    ' line "A.38.CO1" "A.38.CO2"',
    ' line "A.38.CO1" "A.38.CO2" color=4291624959 dashSize=0.5',
  ];

  const miscOpts = {
    view: '1+n4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg==',
    unit: 1,
    load: 'mmtf:1crn',
  };
  const miscStr = 'l=mmtf:1crn&u=1&v=1%2Bn4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg%3D%3D';
  const miscCommands = [
    'load "mmtf:1crn"',
    'unit 1',
    'view 1+n4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg==',
  ];

  /** ******** SETTINGS TEST SETS *********** */
  const settings = {
    colorers: {
      EL: {
        carbon: -3,
      },

      UN: {
        color: 0xFF0000,
      },
    },
    camFov: 45.0,
    camNear: 0.0,
    resolution: 'lowest',
    autoResolution: true,
  };

  const settingsOpts = {
    settings,
  };

  const settingsStr = 'colorers.EL.carbon=-3&colorers.UN.color=16711680&camFov=45'
    + '&camNear=0&resolution=lowest&autoResolution=true';
  const settingsCommands = [
    'set colorers.EL.carbon -3',
    'set colorers.UN.color 16711680',
    'set camFov 45',
    'set camNear 0',
    'set resolution "lowest"',
    'set autoResolution true',
  ];

  const overallOpts = {
    preset: 'default',
    reps: [
      mBScELrep, bigRep, parameterRep, subsetRepSimple,
    ],
    _objects: objectsList,
    settings,
  };
  const overallStr = 'p=default&r=0&m=BS&c=EL&r=1&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286'
    + '&m=TX&c=EL&mt=SF&r=2&m=TR!radius:0.5&c=EL!carbon:0&r=3&m=CS!subset:chain+A+'
    + 'and+sequence+29+or+serial+196&o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!'
    + 'color:4291624959,dashSize:0.5&colorers.EL.carbon=-3&colorers.UN.color=16711680&'
    + 'camFov=45&camNear=0&resolution=lowest&autoResolution=true';
  const overallCommands = [
    'preset default',
    'rep 0 m=BS c=EL',
    'rep 1 s="sequence 85, 175, 256 and name CB and sequence 1:286" m=TX c=EL mt=SF',
    'rep 2 m=TR radius=0.5 c=EL carbon=0',
    'rep 3 m=CS subset="chain A and sequence 29 or serial 196"',
    ' line "A.38.CO1" "A.38.CO2"',
    ' line "A.38.CO1" "A.38.CO2" color=4291624959 dashSize=0.5',
    'set colorers.EL.carbon -3',
    'set colorers.UN.color 16711680',
    'set camFov 45',
    'set camNear 0',
    'set resolution "lowest"',
    'set autoResolution true',
  ];

  const settingsWithPreset = {
    camNear: 0.0,
    resolution: 'lowest',
    preset: 'macro',
    autoResolution: true,
    labels: 'label',
  };

  const settingsWithPresetOpts = {
    settings: settingsWithPreset,
  };

  const settingsWithPresetStr = 'camNear=0&resolution=lowest&autoResolution=true&labels=label';
  const settingsWithPresetCommands = [
    'set camNear 0',
    'set resolution "lowest"',
    'set autoResolution true',
    'set labels "label"',
  ];

  /** ******** SOPHISTICATED TEST SETS *********** */
  const complexSubsetOpts = {
    reps: [{
      mode: ['CS', {
        subset: 'serial 1,13:139',
      }],
    }],
  };
  const complexSubsetStr = 'r=0&m=CS!subset:serial+1%252C13%253A139';
  const complexSubsetCommands = ['rep 0 m=CS subset="serial 1,13:139"'];

  const complexTextModeOpts = {
    reps: [{
      mode: ['TX', {
        template: '~-=!{{Chain}}.{{Residue}}:{{Sequence}},{{Name}}+',
      }],
    }],
  };
  const complexTextModeStr = 'r=0&m=TX!template:~-%253D!%257B%257BChain%257D%257D.%257B%257B'
    + 'Residue%257D%257D%253A%257B%257BSequence%257D%257D%252C%257B%257BName%257D%257D%252B';
  const complexTextModeCommands = [
    'rep 0 m=TX template="~-=!{{Chain}}.{{Residue}}:{{Sequence}},{{Name}}+"',
  ];

  /** ******** ERROR INPUT TEST SETS *********** */

  const repsOpts = {
    reps: [mBScELrep],
  };
  const errorArgumentRepsStr = 'r=0&m=BS&c=EL&w=w';
  const errorKeyRepsStr = 'r=0&m=BS!radus:9&c=EL';

  describe('.toScript()', () => {
    function equalCommands(original, generated) {
      if (!_.isArray(original) || original.length !== generated.length + 2) {
        return false;
      }
      if (original[0] !== 'set autobuild false' || original[original.length - 1] !== 'set autobuild true') {
        return false;
      }
      for (let i = 0; i < generated.length; i++) {
        if (original[i + 1] !== generated[i]) {
          return false;
        }
      }
      return true;
    }

    chai.use(() => {
      chai.Assertion.addMethod('equalCommands', function (target) {
        const source = this._obj;
        this.assert(
          equalCommands(target, source),
          'expected #{this} to equal #{exp}',
          'expected #{this} to not equal #{exp}',
          target,
          source,
          true,
        );
      });
    });

    function toCommands(script) {
      return script.split('\n');
    }

    it('generates proper script for simplest rep lists', () => {
      expect(mBScELrepCommands).to.equalCommands(toCommands(options.toScript(mBScELrepOpts)));
      expect(bigRepsCommands).to.equalCommands(toCommands(options.toScript(bigRepsOpts)));
    });

    it('restores mode/colorer options', () => {
      expect(paramRepCommands).to.equalCommands(toCommands(options.toScript(paramRepsOpts)));
    });

    it('restores string params', () => {
      expect(subsetRepsSimpleCommands).to.equalCommands(toCommands(options.toScript(subsetRepsSimpleOpts)));
    });

    it('restores multi rep lists', () => {
      expect(multipleRepsCommands).to.equalCommands(toCommands(options.toScript(multipleRepsOpts)));
    });

    it('restores text mode options', () => {
      expect(textModeCommands).to.equalCommands(toCommands(options.toScript(textModeOpts)));
    });

    it('restores objects', () => {
      expect(objectsCommands).to.equalCommands(toCommands(options.toScript(objectsOpts)));
    });

    it('restores high level properties', () => {
      expect(miscCommands).to.equalCommands(toCommands(options.toScript(miscOpts)));
    });

    // settings params
    it('restores proper script for settings', () => {
      expect(settingsCommands).to.equalCommands(toCommands(options.toScript(settingsOpts)));
    });

    // overall
    it('restores proper scripts', () => {
      expect(overallCommands).to.equalCommands(toCommands(options.toScript(overallOpts)));
    });

    it('restores proper script for settings with preset', () => {
      expect(settingsWithPresetCommands).to.equalCommands(toCommands(options.toScript(settingsWithPresetOpts)));
    });

    // sophisticated examples
    it('restores proper script for complex subset opts', () => {
      expect(complexSubsetCommands).to.equalCommands(toCommands(options.toScript(complexSubsetOpts)));
    });

    it('restores proper script for complex text mode opts', () => {
      expect(complexTextModeCommands).to.equalCommands(toCommands(options.toScript(complexTextModeOpts)));
    });
  });

  describe('.toURL()', () => {
    // extract only options from our URL
    function getOpts(url) {
      let dashIdx = url.lastIndexOf('#');
      dashIdx = dashIdx > 0 ? dashIdx : url.length;
      return url.substring(url.indexOf('?') + 1, dashIdx);
    }
    before((done) => {
      done();
    });

    it('generates proper URL for simplest rep lists', () => {
      expect(getOpts(options.toURL(mBScELrepOpts))).to.equal(mBScELrepStr);
      expect(getOpts(options.toURL(bigRepsOpts))).to.equal(bigRepsStr);
    });

    it('generates proper URL for parametrized modes and colorers', () => {
      expect(getOpts(options.toURL(paramRepsOpts))).to.equal(paramRepStr);
    });

    it('generates proper URL for modes with string params', () => {
      expect(getOpts(options.toURL(subsetRepsSimpleOpts))).to.equal(subsetRepsSimpleStr);
    });

    it('generates proper URL for multi mode rep lists', () => {
      expect(getOpts(options.toURL(multipleRepsOpts))).to.equal(multipleRepsStr);
    });

    it('generates proper URL for text mode', () => {
      expect(getOpts(options.toURL(textModeOpts))).to.equal(textModeStr);
    });

    // objects
    it('generates proper URL for scene objects', () => {
      expect(getOpts(options.toURL(objectsOpts))).to.equal(objectsStr);
    });

    it('generates proper URL for scene objects', () => {
      expect(getOpts(options.toURL(miscOpts))).to.equal(miscStr);
    });

    // settings params
    it('generates proper URL for settings', () => {
      expect(getOpts(options.toURL(settingsOpts))).to.equal(settingsStr);
    });

    // overall
    it('generates proper long URLs', () => {
      expect(getOpts(options.toURL(overallOpts))).to.equal(overallStr);
    });

    it('restores proper script for settings with preset', () => {
      expect(getOpts(options.toURL(settingsWithPresetOpts))).to.equal(settingsWithPresetStr);
    });

    // sophisticated examples
    it('generates proper URL for complex subset opts', () => {
      expect(getOpts(options.toURL(complexSubsetOpts))).to.equal(complexSubsetStr);
    });

    it('generates proper URL for complex text mode opts', () => {
      expect(getOpts(options.toURL(complexTextModeOpts))).to.equal(complexTextModeStr);
    });
  });

  describe('.fromURL()', () => {
    function equalOptions(original, generated) {
      function compareAllExceptReps(one, another) {
        const origKeys = Object.keys(one);

        let i;
        let n;

        for (i = 0, n = origKeys.length; i < n; ++i) {
          const key = origKeys[i];
          if (key !== 'preset' && key !== 'reps'
             && (!another.hasOwnProperty(key)
              || !_.isEqual(one[key], another[key]))) {
            return false;
          }
        }
        return true;
      }
      // first, compare all properties except reps they mus be identical
      if (!compareAllExceptReps(original, generated)
          || !compareAllExceptReps(generated, original)) {
        return false;
      }
      // now ensure that reps provide identical results
      // presets
      if (original.preset !== generated.preset && (original.preset !== undefined || generated.preset !== 'default')) {
        return false;
      }

      if (original.reps === generated.reps) {
        return true;
      }

      const origReps = original.reps;
      const genReps = generated.reps;
      // generated reps count must be no less than original
      if (origReps !== undefined && genReps.length < origReps.length) {
        return false;
      }

      for (let i = 0, n = genReps.length; i < n; ++i) {
        if (((origReps === undefined || origReps[i] === undefined) && Object.keys(genReps[i]).length > 0)
          || !_.isEqual(origReps[i], genReps[i])) {
          return false;
        }
      }

      return true;
    }

    chai.use(() => {
      chai.Assertion.addMethod('equalOptions', function (target) {
        const source = this._obj;
        this.assert(
          equalOptions(target, source),
          'expected #{this} to equal #{exp}',
          'expected #{this} to not equal #{exp}',
          target,
          source,
          true,
        );
      });
    });

    function urlize(opts) {
      return `?${opts}`;
    }

    it('restores simrpe options from error input url', () => {
      expect(options.fromURL(urlize(errorArgumentRepsStr))).to.equalOptions(repsOpts);
      expect(options.fromURL(urlize(errorKeyRepsStr))).to.equalOptions(repsOpts);
    });

    it('restores high level mode properties', () => {
      expect(options.fromURL(urlize(mBScELrepStr))).to.equalOptions(mBScELrepOpts);
      expect(options.fromURL(urlize(bigRepsStr))).to.equalOptions(bigRepsOpts);
    });

    it('restores mode/colorer options', () => {
      expect(options.fromURL(urlize(paramRepStr))).to.equalOptions(paramRepsOpts);
    });

    it('restores string params', () => {
      expect(options.fromURL(urlize(subsetRepsSimpleStr))).to.equalOptions(subsetRepsSimpleOpts);
    });

    it('restores multi rep lists', () => {
      expect(options.fromURL(urlize(multipleRepsStr))).to.equalOptions(multipleRepsOpts);
    });

    it('restores text mode options', () => {
      expect(options.fromURL(urlize(textModeStr))).to.equalOptions(textModeOpts);
    });

    it('restores objects', () => {
      expect(options.fromURL(urlize(objectsStr))).to.equalOptions(objectsOpts);
    });

    it('restores high level properties', () => {
      expect(options.fromURL(urlize(miscStr))).to.equalOptions(miscOpts);
    });

    // settings params
    it('restores proper URL for settings', () => {
      expect(options.fromURL(urlize(settingsStr))).to.equalOptions(settingsOpts);
    });

    // overall
    it('restores proper URLs', () => {
      expect(options.fromURL(urlize(overallStr))).to.equalOptions(overallOpts);
    });

    // sophisticated examples
    it('restores proper URL for complex subset opts', () => {
      expect(options.fromURL(urlize(complexSubsetStr))).to.equalOptions(complexSubsetOpts);
    });

    it('restores proper URL for complex text mode opts', () => {
      expect(options.fromURL(urlize(complexTextModeStr))).to.equalOptions(complexTextModeOpts);
    });

    it('restores proper URL for complex with using dup for duplicate similar reps', () => {
      expect(options.fromURL(urlize(duplicatedRepsStr))).to.equalOptions(duplicatedRepsOpts);
    });

    it('restores proper URL for complex with using double mode for duplicatee similar reps', () => {
      expect(options.fromURL(urlize(doubleModeRepsStr))).to.equalOptions(duplicatedRepsOpts);
    });
  });

  // TODO think about making public fromArray function and tests firstly it (not fromAttr or fromURL)
  describe('.fromAttr()', () => {
    function urlize(opts) {
      return `?${opts || ''}`;
    }

    it('restores high level mode properties', () => {
      const tmp = options.fromURL(urlize(mBScELrepStr));
      const tmp1 = options.fromAttr(mBScELrepStr);
      expect(options.toURL(tmp)).to.equal(options.toURL(tmp1));
    });
  });
});
