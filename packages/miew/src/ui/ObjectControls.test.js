import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';
import * as THREE from 'three';
import ObjectControls from './ObjectControls';
import settings from '../settings';

chai.use(dirtyChai);

describe('ObjectControls', () => {
  let object;
  let objectPivot;
  let camera;
  let domElement;
  let mockWindow;
  let getAltObj;
  let controls;

  beforeEach(() => {
    settings.reset();

    object = new THREE.Object3D();
    objectPivot = new THREE.Object3D();
    camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.updateProjectionMatrix();

    mockWindow = {
      innerWidth: 800,
      innerHeight: 600,
      pageXOffset: 0,
      pageYOffset: 0,
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
    };
    global.window = mockWindow;

    domElement = {
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
      getBoundingClientRect: () => ({
        left: 0, top: 0, width: 800, height: 600,
      }),
      ownerDocument: {
        documentElement: {
          clientLeft: 0,
          clientTop: 0,
        },
      },
    };
    global.document = domElement;

    getAltObj = () => ({ objects: [], pivot: new THREE.Vector3() });

    controls = new ObjectControls(object, objectPivot, camera, domElement, getAltObj);
  });

  afterEach(() => {
    if (controls) {
      controls.dispose();
    }
    delete global.window;
    delete global.document;
  });

  describe('mousewheel zoom', () => {
    it('zooms when zooming.wheel is true', () => {
      settings.set('zooming.wheel', true);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.mousewheel({
        preventDefault: sinon.spy(),
        wheelDelta: 120,
      });

      expect(controls.getScale()).to.be.above(initialScale);
      expect(changeSpy).to.be.calledWith(sinon.match({ type: 'change', action: 'zoom' }));
    });

    it('does not zoom when zooming.wheel is false', () => {
      settings.set('zooming.wheel', false);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.mousewheel({
        preventDefault: sinon.spy(),
        wheelDelta: 120,
      });

      expect(controls.getScale()).to.equal(initialScale);
      expect(changeSpy).to.not.be.called();
    });
  });

  describe('touch pinch zoom', () => {
    it('zooms when zooming.touch is true', () => {
      settings.set('zooming.touch', true);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.touchstartend({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        touches: [
          { pageX: 100, pageY: 100 },
          { pageX: 200, pageY: 100 },
        ],
      });

      controls.touchmove({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        touches: [
          { pageX: 50, pageY: 100 },
          { pageX: 250, pageY: 100 },
        ],
      });

      expect(controls.getScale()).to.be.above(initialScale);
      expect(changeSpy).to.be.calledWith(sinon.match({ type: 'change', action: 'zoom' }));
    });

    it('does not zoom when zooming.touch is false', () => {
      settings.set('zooming.touch', false);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.touchstartend({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        touches: [
          { pageX: 100, pageY: 100 },
          { pageX: 200, pageY: 100 },
        ],
      });

      controls.touchmove({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        touches: [
          { pageX: 50, pageY: 100 },
          { pageX: 250, pageY: 100 },
        ],
      });

      expect(controls.getScale()).to.equal(initialScale);
      expect(changeSpy).to.not.be.called();
    });
  });

  describe('secondary mouse drag zoom', () => {
    it('zooms in when dragging up with Ctrl + Left Click and zooming.drag is true', () => {
      settings.set('zooming.drag', true);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.mousedown({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        button: 0,
        ctrlKey: true,
        altKey: false,
        pageX: 400,
        pageY: 300,
      });

      controls.mousemove({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        pageX: 400,
        pageY: 200,
      });

      expect(controls.getScale()).to.be.above(initialScale);
      expect(changeSpy).to.be.calledWith(sinon.match({ type: 'change', action: 'zoom' }));
    });

    it('zooms out when dragging down with Ctrl + Left Click and zooming.drag is true', () => {
      settings.set('zooming.drag', true);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.mousedown({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        button: 0,
        ctrlKey: true,
        altKey: false,
        pageX: 400,
        pageY: 300,
      });

      controls.mousemove({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        pageX: 400,
        pageY: 400,
      });

      expect(controls.getScale()).to.be.below(initialScale);
      expect(changeSpy).to.be.calledWith(sinon.match({ type: 'change', action: 'zoom' }));
    });

    it('does not drag zoom when zooming.drag is false', () => {
      settings.set('zooming.drag', false);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.mousedown({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        button: 0,
        ctrlKey: true,
        altKey: false,
        pageX: 400,
        pageY: 300,
      });

      controls.mousemove({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        pageX: 400,
        pageY: 200,
      });

      expect(controls.getScale()).to.equal(initialScale);
      expect(changeSpy).to.not.be.called();
    });

    it('zooms when dragging with middle mouse button (button 1)', () => {
      settings.set('zooming.drag', true);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.mousedown({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        button: 1,
        pageX: 400,
        pageY: 300,
      });

      controls.mousemove({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        pageX: 400,
        pageY: 200,
      });

      expect(controls.getScale()).to.be.above(initialScale);
      expect(changeSpy).to.be.calledWith(sinon.match({ type: 'change', action: 'zoom' }));
    });

    it('does not trigger drag zoom when Alt is pressed with Left Click', () => {
      settings.set('zooming.drag', true);
      const initialScale = controls.getScale();
      const changeSpy = sinon.spy();
      controls.addEventListener('change', changeSpy);

      controls.mousedown({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        button: 0,
        ctrlKey: true,
        altKey: true,
        pageX: 400,
        pageY: 300,
      });

      controls.mousemove({
        preventDefault: sinon.spy(),
        stopPropagation: sinon.spy(),
        pageX: 400,
        pageY: 200,
      });

      expect(controls.getScale()).to.equal(initialScale);
    });
  });
});
