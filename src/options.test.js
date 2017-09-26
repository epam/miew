import options from './options';

import _ from 'lodash';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

//////////////////////////////////////////////////////////////////////////////

describe('options', function() {
  /********** REP LIST ************/
  const simplestRep = {
    mode: 'BS',
    colorer: 'EL'
  };

  const parameterRep = {
    mode: [
      'TR', {
        radius: 0.5
      }
    ],
    colorer: [
      'EL', {
        carbon: 0
      }
    ]
  };
  const subsetRepSimple = {
    mode: [
      'CS', {
        subset: 'chain A and sequence 29 or serial 196'
      }
    ]
  };

  const bigRep = {
    selector: 'sequence 85, 175, 256 and name CB and sequence 1:286',
    mode: 'TX',
    colorer: 'EL',
    material: 'SF'
  };

  /********** REP TEST SETS ************/
  const simpleRepsOpts = {
    reps: [simplestRep]
  };
  const simpleRepsStr = 'r=0&m=BS&c=EL';

  const bigRepsOpts = {
    reps: [bigRep]
  };
  const bigRepsStr = 'r=0&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286&m=TX&c=EL&mt=SF';

  const paramRepsOpts = {
    preset: 'default',
    reps: [parameterRep]
  };
  const paramRepStr = 'p=default&r=0&m=TR!radius:0.5&c=EL!carbon:0';

  const subsetRepsSimpleOpts = {
    reps: [subsetRepSimple]
  };
  const subsetRepsSimpleStr = 'r=0&m=CS!subset:chain+A+and+sequence+29+or+serial+196';

  const textModeOpts = {
    reps: [{
      mode: ['TX', {
        template: 'The {{Chain}}.{{Residue}}.{{Sequence}}.{{Name}}'
      }]
    }]
  };

  const textModeStr = 'r=0&m=TX!template:The+%257B%257BChain%257D%257D.%257B%257BResidue' +
    '%257D%257D.%257B%257BSequence%257D%257D.%257B%257BName%257D%257D';

  const multipleRepsOpts = {
    preset: 'default',
    reps: [simplestRep, parameterRep]
  };
  const multipleRepsStr = 'p=default&r=0&m=BS&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0';

  /********** OBJECTS TEST SETS ************/
  const objectsList = [
    {
      type: 'line',
      params: ['A.38.CO1', 'A.38.CO2']
    }, {
      type: 'line',
      params: ['A.38.CO1', 'A.38.CO2'],
      opts: {
        color: 0xFFCCFFFF,
        dashSize: 0.5,
      }
    }
  ];

  const objectsOpts = {
    _objects: objectsList
  };
  const objectsStr = 'o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!color:4291624959,dashSize:0.5';

  const miscOpts = {
    view: '1+n4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg==',
    unit: 1,
    load: 'mmtf:1crn'
  };
  const miscStr = 'l=mmtf:1crn&u=1&v=1%2Bn4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg%3D%3D';

  /********** SETTINGS TEST SETS ************/
  const settings = {
    colorers: {
      EL: {
        carbon: -3
      },

      UN: {
        color: 0xFF0000
      },
    },
    camFov: 45.0,
    camNear: 0.0,
    resolution: 'lowest',
    autoResolution: true,
    labels: 'label'
  };

  const settingsOpts = {
    settings: settings
  };

  const settingsStr = 'colorers.EL.carbon=-3&colorers.UN.color=16711680&camFov=45' +
    '&camNear=0&resolution=lowest&autoResolution=true&labels=label';

  const overallOpts = {
    preset: 'default',
    reps: [
      simplestRep, bigRep, parameterRep, subsetRepSimple
    ],
    _objects: objectsList,
    settings: settings
  };
  const overallStr = 'p=default&r=0&m=BS&c=EL&r=1&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286' +
    '&m=TX&c=EL&mt=SF&r=2&m=TR!radius:0.5&c=EL!carbon:0&r=3&m=CS!subset:chain+A+' +
    'and+sequence+29+or+serial+196&o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!' +
    'color:4291624959,dashSize:0.5&colorers.EL.carbon=-3&colorers.UN.color=16711680&' +
    'camFov=45&camNear=0&resolution=lowest&autoResolution=true&labels=label';

  /********** SOPHISTICATED TEST SETS ************/
  const complexSubsetOpts = {
    reps: [{
      mode: ['CS', {
        subset: 'serial 1,13:139'
      }]
    }]
  };
  const complexSubsetStr = 'r=0&m=CS!subset:serial+1%252C13%253A139';

  const complexTextModeOpts = {
    reps: [{
      mode: ['TX', {
        template: '~-=!{{Chain}}.{{Residue}}:{{Sequence}},{{Name}}+'
      }]
    }]
  };
  const complexTextModeStr = 'r=0&m=TX!template:~-%253D!%257B%257BChain%257D%257D.%257B%257B' +
    'Residue%257D%257D%253A%257B%257BSequence%257D%257D%252C%257B%257BName%257D%257D%252B';

  describe('.toURL', function() {
    // extract only options from our URL
    function getOpts(url) {
      let dashIdx = url.lastIndexOf('#');
      dashIdx = dashIdx > 0 ? dashIdx : url.length;
      return url.substring(url.indexOf('?') + 1, dashIdx);
    }
    before(function(done) {
      done();
    });

    it('generates proper URL for simplest rep lists', function() {
      expect(getOpts(options.toURL(simpleRepsOpts))).to.equal(simpleRepsStr);
      expect(getOpts(options.toURL(bigRepsOpts))).to.equal(bigRepsStr);
    });

    it('generates proper URL for parametrized modes and colorers', function() {
      expect(getOpts(options.toURL(paramRepsOpts))).to.equal(paramRepStr);
    });

    it('generates proper URL for modes with string params', function() {
      expect(getOpts(options.toURL(subsetRepsSimpleOpts))).to.equal(subsetRepsSimpleStr);
    });

    it('generates proper URL for multi mode rep lists', function() {
      expect(getOpts(options.toURL(multipleRepsOpts))).to.equal(multipleRepsStr);
    });

    it('generates proper URL for text mode', function() {
      expect(getOpts(options.toURL(textModeOpts))).to.equal(textModeStr);
    });

    // objects
    it('generates proper URL for scene objects', function() {
      expect(getOpts(options.toURL(objectsOpts))).to.equal(objectsStr);
    });

    it('generates proper URL for scene objects', function() {
      expect(getOpts(options.toURL(miscOpts))).to.equal(miscStr);
    });

    // settings params
    it('generates proper URL for settings', function() {
      expect(getOpts(options.toURL(settingsOpts))).to.equal(settingsStr);
    });

    // overall
    it('generates proper long URLs', function() {
      expect(getOpts(options.toURL(overallOpts))).to.equal(overallStr);
    });

    // sophisticated examples
    it('generates proper URL for complex subset opts', function() {
      expect(getOpts(options.toURL(complexSubsetOpts))).to.equal(complexSubsetStr);
    });

    it('generates proper URL for complex text mode opts', function() {
      expect(getOpts(options.toURL(complexTextModeOpts))).to.equal(complexTextModeStr);
    });
  });

  describe('.fromURL', function() {
    function equalOptions(original, generated) {
      function compareAllExceptReps(one, another) {
        const origKeys = Object.keys(one);

        let i, n;

        for (i = 0, n = origKeys.length; i < n; ++i) {
          const key = origKeys[i];
          if (key !== 'preset' && key !== 'reps' &&
             (!another.hasOwnProperty(key) ||
              !_.isEqual(one[key], another[key]))) {
            return false;
          }
        }
        return true;
      }
      // first, compare all properties except reps they mus be identical
      if (!compareAllExceptReps(original, generated) ||
          !compareAllExceptReps(generated, original)) {
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

      for (var i = 0, n = genReps.length; i < n; ++i) {
        if (((origReps === undefined || origReps[i] === undefined) && Object.keys(genReps[i]).length > 0) ||
          !_.isEqual(origReps[i], genReps[i])) {
          return false;
        }
      }

      return true;
    }

    chai.use(function() {
      chai.Assertion.addMethod('equalOptions', function(target) {
        const source = this._obj;
        this.assert(
          equalOptions(target, source),
          'expected #{this} to equal #{exp}',
          'expected #{this} to not equal #{exp}',
          target,
          source,
          true
        );
      });
    });

    function urlize(opts) {
      return '?' + opts;
    }

    it('restores high level mode properties', function() {
      expect(options.fromURL(urlize(simpleRepsStr))).to.equalOptions(simpleRepsOpts);
      expect(options.fromURL(urlize(bigRepsStr))).to.equalOptions(bigRepsOpts);
    });

    it('restores mode/colorer options', function() {
      expect(options.fromURL(urlize(paramRepStr))).to.equalOptions(paramRepsOpts);
    });

    it('restores string params', function() {
      expect(options.fromURL(urlize(subsetRepsSimpleStr))).to.equalOptions(subsetRepsSimpleOpts);
    });

    it('restores multi rep lists', function() {
      expect(options.fromURL(urlize(multipleRepsStr))).to.equalOptions(multipleRepsOpts);
    });

    it('restores text mode options', function() {
      expect(options.fromURL(urlize(textModeStr))).to.equalOptions(textModeOpts);
    });

    it('restores objects', function() {
      expect(options.fromURL(urlize(objectsStr))).to.equalOptions(objectsOpts);
    });

    it('restores high level properties', function() {
      expect(options.fromURL(urlize(miscStr))).to.equalOptions(miscOpts);
    });

    // settings params
    it('restores proper URL for settings', function() {
      expect(options.fromURL(urlize(settingsStr))).to.equalOptions(settingsOpts);
    });

    // overall
    it('restores proper URLs', function() {
      expect(options.fromURL(urlize(overallStr))).to.equalOptions(overallOpts);
    });

    // sophisticated examples
    it('restores proper URL for complex subset opts', function() {
      expect(options.fromURL(urlize(complexSubsetStr))).to.equalOptions(complexSubsetOpts);
    });

    it('restores proper URL for complex text mode opts', function() {
      expect(options.fromURL(urlize(complexTextModeStr))).to.equalOptions(complexTextModeOpts);
    });
  });
});
