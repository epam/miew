/*
 * Toggling WebVR is done through button.click because of limitations on calling requestPresent in webVR:
 * VRDisplay::requestPresent should be called from user gesture:
 * https://developer.mozilla.org/en-US/docs/Web/API/VRDisplay/requestPresent
 */
export default function (webVRPoC) {
  function showEnterVR(button) {
    button.style.display = '';
    button.style.cursor = 'pointer';
    button.style.left = 'calc(50% - 50px)';
    button.style.width = '100px';

    button.textContent = 'ENTER VR';

    let currentSession = null;

    function onSessionEnded(/* event */) {
      currentSession.removeEventListener('end', onSessionEnded);
      button.textContent = 'ENTER VR';
      currentSession = null;
    }

    function onSessionStarted(session) {
      session.addEventListener('end', onSessionEnded);
      webVRPoC._gfx.renderer.xr.setReferenceSpaceType('local');
      webVRPoC._gfx.renderer.xr.setSession(session);
      button.textContent = 'EXIT VR';
      currentSession = session;
    }

    button.onmouseenter = function () { button.style.opacity = '1.0'; };
    button.onmouseleave = function () { button.style.opacity = '0.5'; };

    button.onclick = function () {
      if (currentSession === null) {
        // WebXR's requestReferenceSpace only works if the corresponding feature
        // was requested at session creation time. For simplicity, just ask for
        // the interesting ones as optional features, but be aware that the
        // requestReferenceSpace call will fail if it turns out to be unavailable.
        // ('local' is always available for immersive sessions and doesn't need to
        // be requested separately.)

        const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor'] };
        navigator.xr.requestSession('immersive-vr', sessionInit).then(onSessionStarted);
        webVRPoC.moveSceneBehindHeadset();
      } else {
        currentSession.end();
      }
    };
  }

  function showWebXRNotFound(button) {
    button.style.display = '';
    button.style.cursor = 'auto';
    button.style.left = 'calc(50% - 75px)';
    button.style.width = '150px';
    button.textContent = 'VR NOT FOUND';
    button.onmouseenter = null;
    button.onmouseleave = null;
    button.onclick = null;
  }

  function stylizeElement(element) {
    element.style.position = 'absolute';
    element.style.bottom = '20px';
    element.style.padding = '12px 6px';
    element.style.border = '1px solid #fff';
    element.style.borderRadius = '4px';
    element.style.background = 'transparent';
    element.style.color = '#fff';
    element.style.font = 'normal 13px sans-serif';
    element.style.textAlign = 'center';
    element.style.opacity = '0.5';
    element.style.outline = 'none';
    element.style.zIndex = '999';
  }

  if ('xr' in navigator) {
    const button = document.createElement('button');
    button.style.display = 'none';
    stylizeElement(button);
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => (
      supported ? showEnterVR(button) : showWebXRNotFound(button)
    ));
    return button;
  }
  const message = document.createElement('a');
  message.href = 'https://webvr.info';
  message.innerHTML = 'WEBXR NOT SUPPORTED';
  message.style.left = 'calc(50% - 90px)';
  message.style.width = '180px';
  message.style.textDecoration = 'none';
  stylizeElement(message);
  return message;
}
