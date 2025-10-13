import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import * as THREE from 'three';
import Complex from './Complex';
import AutoBond from './AutoBond';
import Element from './Element';

chai.use(dirtyChai);
chai.use(sinonChai);

describe('Complex', () => {
  describe('finalize', () => {
    /** @type {Complex} */
    let complex;
    let consoleWarnStub;
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      consoleWarnStub = sandbox.stub(console, 'warn');

      // Create a minimal complex structure for all tests
      complex = new Complex();
      const chain = complex.addChain('A');
      const residue = chain.addResidue('ALA', 1, ' ');
      const element = Element.getByName('C');
      const position = new THREE.Vector3(0.0, 0.0, 0.0);
      residue.addAtom('CA', element, position);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should not crash when autobonding fails during build', () => {
      const buildStub = sandbox.stub(AutoBond.prototype, 'build');
      const destroyStub = sandbox.stub(AutoBond.prototype, 'destroy');

      // Mock AutoBond prototype to throw during build()
      buildStub.throws(new Error('Autobonding test error'));

      // Test: finalize should complete without throwing (main objective)
      expect(() => {
        complex.finalize({
          needAutoBonding: true,
          detectAromaticLoops: false,
          enableEditing: false,
        });
      }).to.not.throw();

      // Verify: Error was caught and logged (this is what the commit fixes)
      expect(buildStub).to.have.been.called();
      expect(destroyStub).to.not.have.been.called();
      expect(consoleWarnStub).to.have.been.calledOnce();
      expect(consoleWarnStub).to.have.been.calledWith('Autobonding failed:', sinon.match.instanceOf(Error));
      expect(consoleWarnStub.firstCall.args[1]).to.have.property('message', 'Autobonding test error');
    });

    it('should complete finalization successfully when autobonding is disabled', () => {
      // Test: finalize should complete without issues when autobonding is disabled
      expect(() => {
        complex.finalize({
          needAutoBonding: false,
          detectAromaticLoops: false,
          enableEditing: false,
        });
      }).to.not.throw();

      // Verify: No autobonding warnings should be logged
      expect(consoleWarnStub).to.not.have.been.called();
    });

    it('should complete finalization successfully when autobonding succeeds', () => {
      // Test: finalize should complete without issues when autobonding succeeds
      expect(() => {
        complex.finalize({
          needAutoBonding: true,
          detectAromaticLoops: false,
          enableEditing: false,
        });
      }).to.not.throw();

      // Verify: No autobonding warnings should be logged when it succeeds
      expect(consoleWarnStub).to.not.have.been.called();
    });
  });
});
