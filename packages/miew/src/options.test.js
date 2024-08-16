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

  /** ******** OBJECTS *********** */
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

  /** ******** SETTINGS *********** */
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

  const settingsWithPreset = {
    camNear: 0.0,
    resolution: 'lowest',
    preset: 'macro',
    autoResolution: true,
    labels: 'label',
  };

  /** ******** TEST SETS *********** */

  const testSets = [
    { // mBScELrepOpts
      description: 'short simple rep lists',
      options: { reps: [mBScELrep] },
      string: 'r=0&m=BS&c=EL',
      commands: ['rep 0 m=BS c=EL'],
    },
    { // bigRepsOpts
      description: 'big simple rep lists',
      options: { reps: [bigRep] },
      string: 'r=0&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286&m=TX&c=EL&mt=SF',
      commands: ['rep 0 s="sequence 85, 175, 256 and name CB and sequence 1:286" m=TX c=EL mt=SF'],
    },
    { // paramRepsOpts
      description: 'parametrized modes and colorers',
      options: {
        preset: 'default',
        reps: [parameterRep],
      },
      string: 'p=default&r=0&m=TR!radius:0.5&c=EL!carbon:0',
      commands: [
        'preset default',
        'rep 0 m=TR radius=0.5 c=EL carbon=0',
      ],
    },
    { // subsetRepsSimpleOpts
      description: 'modes with string params',
      options: { reps: [subsetRepSimple] },
      string: 'r=0&m=CS!subset:chain+A+and+sequence+29+or+serial+196',
      commands: ['rep 0 m=CS subset="chain A and sequence 29 or serial 196"'],
    },
    { // textModeOpts
      description: 'text mode',
      options: {
        reps: [{
          mode: ['TX', {
            template: 'The {{Chain}}.{{Residue}}.{{Sequence}}.{{Name}}',
          }],
        }],
      },
      string: 'r=0&m=TX!template:The+%257B%257BChain%257D%257D.%257B%257BResidue'
        + '%257D%257D.%257B%257BSequence%257D%257D.%257B%257BName%257D%257D',
      commands: ['rep 0 m=TX template="The {{Chain}}.{{Residue}}.{{Sequence}}.{{Name}}"'],
    },
    { // multipleRepsOpts
      description: 'multi mode rep lists',
      options: {
        preset: 'default',
        reps: [mBScELrep, parameterRep],
      },
      string: 'p=default&r=0&m=BS&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0',
      commands: [
        'preset default',
        'rep 0 m=BS c=EL',
        'rep 1 m=TR radius=0.5 c=EL carbon=0',
      ],
    },
    { // objectsOpts
      description: 'scene objects',
      options: { _objects: objectsList },
      string: 'o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!color:4291624959,dashSize:0.5',
      commands: [
        'line "A.38.CO1" "A.38.CO2"',
        'line "A.38.CO1" "A.38.CO2" color=4291624959 dashSize=0.5',
      ],
    },
    { // miscOpts
      description: 'scene settings',
      options: {
        view: '1+n4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg==',
        unit: 1,
        load: 'cif:1crn',
      },
      string: 'l=cif:1crn&u=1&v=1%2Bn4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg%3D%3D',
      commands: [
        'load "cif:1crn"',
        'unit 1',
        'view 1+n4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg==',
      ],
    },
    { // settingsOpts
      description: 'settings',
      options: { settings },
      string: 'colorers.EL.carbon=-3&colorers.UN.color=16711680&camFov=45'
        + '&camNear=0&resolution=lowest&autoResolution=true',
      commands: [
        'set colorers.EL.carbon -3',
        'set colorers.UN.color 16711680',
        'set camFov 45',
        'set camNear 0',
        'set resolution "lowest"',
        'set autoResolution true',
      ],
    },
    { // overallOpts
      description: 'complex molecule with settings',
      options: {
        preset: 'default',
        reps: [
          mBScELrep, bigRep, parameterRep, subsetRepSimple,
        ],
        _objects: objectsList,
        settings,
      },
      string: 'p=default&r=0&m=BS&c=EL&r=1&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286'
        + '&m=TX&c=EL&mt=SF&r=2&m=TR!radius:0.5&c=EL!carbon:0&r=3&m=CS!subset:chain+A+'
        + 'and+sequence+29+or+serial+196&o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!'
        + 'color:4291624959,dashSize:0.5&colorers.EL.carbon=-3&colorers.UN.color=16711680&'
        + 'camFov=45&camNear=0&resolution=lowest&autoResolution=true',
      commands: [
        'preset default',
        'rep 0 m=BS c=EL',
        'rep 1 s="sequence 85, 175, 256 and name CB and sequence 1:286" m=TX c=EL mt=SF',
        'rep 2 m=TR radius=0.5 c=EL carbon=0',
        'rep 3 m=CS subset="chain A and sequence 29 or serial 196"',
        'line "A.38.CO1" "A.38.CO2"',
        'line "A.38.CO1" "A.38.CO2" color=4291624959 dashSize=0.5',
        'set colorers.EL.carbon -3',
        'set colorers.UN.color 16711680',
        'set camFov 45',
        'set camNear 0',
        'set resolution "lowest"',
        'set autoResolution true',
      ],
    },
    { // settingsWithPresetOpts
      description: 'settings with preset',
      skipFromURL: true,
      options: { settings: settingsWithPreset },
      string: 'camNear=0&resolution=lowest&autoResolution=true&labels=label',
      commands: [
        'set camNear 0',
        'set resolution "lowest"',
        'set autoResolution true',
        'set labels "label"',
      ],
    },
    { // complexSubsetOpts
      description: 'complex subset opts',
      options: {
        reps: [{
          mode: ['CS', {
            subset: 'serial 1,13:139',
          }],
        }],
      },
      string: 'r=0&m=CS!subset:serial+1%252C13%253A139',
      commands: ['rep 0 m=CS subset="serial 1,13:139"'],
    },
    { // complexTextModeOpts
      description: 'complex text mode opts',
      options: {
        reps: [{
          mode: ['TX', {
            template: '~-=!{{Chain}}.{{Residue}}:{{Sequence}},{{Name}}+',
          }],
        }],
      },
      string: 'r=0&m=TX!template:~-%253D!%257B%257BChain%257D%257D.%257B%257B'
        + 'Residue%257D%257D%253A%257B%257BSequence%257D%257D%252C%257B%257BName%257D%257D%252B',
      commands: ['rep 0 m=TX template="~-=!{{Chain}}.{{Residue}}:{{Sequence}},{{Name}}+"'],
    },
  ];

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

    const string = 'restores ';
    for (let n = 0; n < testSets.length; n++) {
      const set = testSets[n];
      it(string + set.description, () => {
        expect(set.commands).to.equalCommands(toCommands(options.toScript(set.options)));
      });
    }
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

    const string = 'generates proper URL for ';
    for (let n = 0; n < testSets.length; n++) {
      const set = testSets[n];
      it(string + set.description, () => {
        expect(getOpts(options.toURL(set.options))).to.equal(set.string);
      });
    }
  });

  describe('.fromURL()', () => {
    const repsOpts = {
      reps: [mBScELrep],
    };
    const errorArgumentRepsStr = 'r=0&m=BS&c=EL&w=w';
    const errorKeyRepsStr = 'r=0&m=BS!radus:9&c=EL';

    const duplicatedRepsOpts = {
      preset: 'default',
      reps: [mBScELrep, parameterRep, mQSmtTRrep],
    };
    const duplicatedRepsStr = 'p=default&r=0&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0&rep=0&dup&m=QS&mt=TR&r=0&m=BS';
    const doubleModeRepsStr = 'p=default&r=0&m=BS&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0&rep=0&m=QS&mt=TR';

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

    const string = 'restores ';
    for (let n = 0; n < testSets.length; n++) {
      const set = testSets[n];
      if (set.skipFromURL) {
        continue;
      }
      it(string + set.description, () => {
        expect(options.fromURL(urlize(set.string))).to.equalOptions(set.options);
      });
    }

    it('restores simrpe options from error input url', () => {
      expect(options.fromURL(urlize(errorArgumentRepsStr))).to.equalOptions(repsOpts);
      expect(options.fromURL(urlize(errorKeyRepsStr))).to.equalOptions(repsOpts);
    });

    it('restores proper URL for complex with using dup for duplicate similar reps', () => {
      expect(options.fromURL(urlize(duplicatedRepsStr))).to.equalOptions(duplicatedRepsOpts);
    });

    it('restores proper URL for complex with using double mode for duplicatee similar reps', () => {
      expect(options.fromURL(urlize(doubleModeRepsStr))).to.equalOptions(duplicatedRepsOpts);
    });
  });

  describe('.fromAttr()', () => {
    function urlize(opts) {
      return `?${opts || ''}`;
    }

    const set = testSets[0];
    it('restores high level mode properties', () => {
      const optURL = options.fromURL(urlize(set.string));
      const optAttr = options.fromAttr(set.string);
      expect(options.toURL(optURL)).to.equal(options.toURL(optAttr));
    });
  });
});
