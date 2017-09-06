import _ from 'lodash';
import chai, {expect} from 'chai';
import options from '../src/options';

//////////////////////////////////////////////////////////////////////////////

describe('options', function() {
  /********** REP LIST ************/
  var simplestRep = {
    mode: 'BS',
    colorer: 'EL'
  };

  var parameterRep = {
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
  var subsetRepSimple = {
    mode: [
      'CS', {
        subset: 'chain A and sequence 29 or serial 196'
      }
    ]
  };

  var bigRep = {
    selector: 'sequence 85, 175, 256 and name CB and sequence 1:286',
    mode: 'TX',
    colorer: 'EL',
    material: 'SF'
  };

  /********** REP TEST SETS ************/
  var simpleRepsOpts = {
    reps: [simplestRep]
  };
  var simpleRepsStr = 'r=0&m=BS&c=EL';

  var bigRepsOpts = {
    reps: [bigRep]
  };
  var bigRepsStr = 'r=0&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286&m=TX&c=EL&mt=SF';

  var paramRepsOpts = {
    preset: 'default',
    reps: [parameterRep]
  };
  var paramRepStr = 'p=default&r=0&m=TR!radius:0.5&c=EL!carbon:0';

  var subsetRepsSimpleOpts = {
    reps: [subsetRepSimple]
  };
  var subsetRepsSimpleStr = 'r=0&m=CS!subset:chain+A+and+sequence+29+or+serial+196';

  var textModeOpts = {
    reps: [{
      mode: ['TX', {
        template: 'The {{Chain}}.{{Residue}}.{{Sequence}}.{{Name}}'
      }]
    }]
  };

  var textModeStr = 'r=0&m=TX!template:The+%257B%257BChain%257D%257D.%257B%257BResidue' +
                    '%257D%257D.%257B%257BSequence%257D%257D.%257B%257BName%257D%257D';

  var multipleRepsOpts = {
    preset: 'default',
    reps: [simplestRep, parameterRep]
  };
  var multipleRepsStr = 'p=default&r=0&m=BS&c=EL&r=1&m=TR!radius:0.5&c=EL!carbon:0';

  /********** OBJECTS TEST SETS ************/
  var objectsList = [
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

  var objectsOpts = {
    _objects: objectsList
  };
  var objectsStr = 'o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!color:4291624959,dashSize:0.5';

  var miscOpts = {
    view: '1+n4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg==',
    unit: 1,
    load: 'mmtf:1crn'
  };
  var miscStr = 'l=mmtf:1crn&u=1&v=1%2Bn4pwTVeI8Erh8LAHI6CPW63vD40uzs/Ne4ovg%3D%3D';

  /********** SETTINGS TEST SETS ************/
  var settings = {
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

  var settingsOpts = {
    settings: settings
  };

  var settingsStr = 'colorers.EL.carbon=-3&colorers.UN.color=16711680&camFov=45' +
                    '&camNear=0&resolution=lowest&autoResolution=true&labels=label';

  var overallOpts = {
    preset: 'default',
    reps: [
      simplestRep, bigRep, parameterRep, subsetRepSimple
    ],
    _objects: objectsList,
    settings: settings
  };
  var overallStr = 'p=default&r=0&m=BS&c=EL&r=1&s=sequence+85,+175,+256+and+name+CB+and+sequence+1:286' +
                   '&m=TX&c=EL&mt=SF&r=2&m=TR!radius:0.5&c=EL!carbon:0&r=3&m=CS!subset:chain+A+' +
                   'and+sequence+29+or+serial+196&o=line,A.38.CO1,A.38.CO2&o=line,A.38.CO1,A.38.CO2!' +
                   'color:4291624959,dashSize:0.5&colorers.EL.carbon=-3&colorers.UN.color=16711680&' +
                   'camFov=45&camNear=0&resolution=lowest&autoResolution=true&labels=label';

  /********** SOPHISTICATED TEST SETS ************/
  var complexSubsetOpts = {
    reps: [{
      mode: ['CS', {
        subset: 'serial 1,13:139'
      }]
    }]
  };
  var complexSubsetStr = 'r=0&m=CS!subset:serial+1%252C13%253A139';

  var complexTextModeOpts = {
    reps: [{
      mode: ['TX', {
        template: '~-=!{{Chain}}.{{Residue}}:{{Sequence}},{{Name}}+'
      }]
    }]
  };
  var complexTextModeStr = 'r=0&m=TX!template:~-%253D!%257B%257BChain%257D%257D.%257B%257B' +
                           'Residue%257D%257D%253A%257B%257BSequence%257D%257D%252C%257B%257BName%257D%257D%252B';

  describe('.toURL', function() {
    // extract only options from our URL
    function getOpts(url) {
      var dashIdx = url.lastIndexOf('#');
      dashIdx = dashIdx > 0 ? dashIdx : url.length;
      return url.substring(url.indexOf('?') + 1, dashIdx);
    }
    before(function(done) {
      done();
    });

    it('should generate proper URL for simplest rep lists', function() {
      expect(getOpts(options.toURL(simpleRepsOpts))).to.equal(simpleRepsStr);
      expect(getOpts(options.toURL(bigRepsOpts))).to.equal(bigRepsStr);
    });

    it('should generate proper URL for parametrized modes and colorers', function() {
      expect(getOpts(options.toURL(paramRepsOpts))).to.equal(paramRepStr);
    });

    it('should generate proper URL for modes with string params', function() {
      expect(getOpts(options.toURL(subsetRepsSimpleOpts))).to.equal(subsetRepsSimpleStr);
    });

    it('should generate proper URL for multi mode rep lists', function() {
      expect(getOpts(options.toURL(multipleRepsOpts))).to.equal(multipleRepsStr);
    });

    it('should generate proper URL for text mode', function() {
      expect(getOpts(options.toURL(textModeOpts))).to.equal(textModeStr);
    });

    // objects
    it('should generate proper URL for scene objects', function() {
      expect(getOpts(options.toURL(objectsOpts))).to.equal(objectsStr);
    });

    it('should generate proper URL for scene objects', function() {
      expect(getOpts(options.toURL(miscOpts))).to.equal(miscStr);
    });

    // settings params
    it('should generate proper URL for settings', function() {
      expect(getOpts(options.toURL(settingsOpts))).to.equal(settingsStr);
    });

    // overall
    it('should generate proper long URLs', function() {
      expect(getOpts(options.toURL(overallOpts))).to.equal(overallStr);
    });

    // sophisticated examples
    it('should generate proper URL for complex subset opts', function() {
      expect(getOpts(options.toURL(complexSubsetOpts))).to.equal(complexSubsetStr);
    });

    it('should generate proper URL for complex text mode opts', function() {
      expect(getOpts(options.toURL(complexTextModeOpts))).to.equal(complexTextModeStr);
    });
  });

  describe('.fromURL', function() {
    function equalOptions(original, generated) {
      function compareAllExceptReps(one, another) {
        var origKeys = Object.keys(one);

        var i, n;

        for (i = 0, n = origKeys.length; i < n; ++i) {
          var key = origKeys[i];
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

      var origReps = original.reps;
      var genReps = generated.reps;
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
        var source = this._obj;
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

    it('should restore high level mode properties', function() {
      expect(options.fromURL(urlize(simpleRepsStr))).to.equalOptions(simpleRepsOpts);
      expect(options.fromURL(urlize(bigRepsStr))).to.equalOptions(bigRepsOpts);
    });

    it('should restore mode/colorer options', function() {
      expect(options.fromURL(urlize(paramRepStr))).to.equalOptions(paramRepsOpts);
    });

    it('should restore string params', function() {
      expect(options.fromURL(urlize(subsetRepsSimpleStr))).to.equalOptions(subsetRepsSimpleOpts);
    });

    it('should restore multi rep lists', function() {
      expect(options.fromURL(urlize(multipleRepsStr))).to.equalOptions(multipleRepsOpts);
    });

    it('should generate proper URL for text mode', function() {
      expect(options.fromURL(urlize(textModeStr))).to.equalOptions(textModeOpts);
    });

    it('should restore objects', function() {
      expect(options.fromURL(urlize(objectsStr))).to.equalOptions(objectsOpts);
    });

    it('should restore high level properties', function() {
      expect(options.fromURL(urlize(miscStr))).to.equalOptions(miscOpts);
    });

    // settings params
    it('should restore proper URL for settings', function() {
      expect(options.fromURL(urlize(settingsStr))).to.equalOptions(settingsOpts);
    });

    // overall
    it('should restore proper URLs', function() {
      expect(options.fromURL(urlize(overallStr))).to.equalOptions(overallOpts);
    });

    // sophisticated examples
    it('should restore proper URL for complex subset opts', function() {
      expect(options.fromURL(urlize(complexSubsetStr))).to.equalOptions(complexSubsetOpts);
    });

    it('should restore proper URL for complex text mode opts', function() {
      expect(options.fromURL(urlize(complexTextModeStr))).to.equalOptions(complexTextModeOpts);
    });
  });
});
