/*******
 * Toggling WebVR is done through button.click because of limitations on calling requestPresent in webVR:
 * VRDisplay::requestPresent should be called from user gesture:
 * https://developer.mozilla.org/en-US/docs/Web/API/VRDisplay/requestPresent
 */
export default function(webVRPoC) {
  function showEnterVR(display, button) {

    button.style.display = '';
    button.style.cursor = 'pointer';
    button.style.left = 'calc(50% - 50px)';
    button.style.width = '100px';

    button.textContent = 'ENTER VR';

    button.onmouseenter = function() { button.style.opacity = '1.0'; };
    button.onmouseleave = function() { button.style.opacity = '0.5'; };

    button.onclick = function() {
      if (display.isPresenting) {
        display.exitPresent();
      } else {
        display.requestPresent([{source: webVRPoC.getCanvas()}]);
        webVRPoC.translateMolecule();
      }
    };
    webVRPoC.setDevice(display);
  }

  function showVRNotFound(button) {

    button.style.display = '';
    button.style.cursor = 'auto';
    button.style.left = 'calc(50% - 75px)';
    button.style.width = '150px';
    button.textContent = 'VR NOT FOUND';
    button.onmouseenter = null;
    button.onmouseleave = null;
    button.onclick = null;

    webVRPoC.setDevice(null);
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

  if ('getVRDisplays' in navigator) {
    const button = document.createElement('button');
    button.style.display = 'none';
    stylizeElement(button);
    window.addEventListener('vrdisplayconnect', function(event) {
      showEnterVR(event.display, button);
    }, false);
    window.addEventListener('vrdisplaydisconnect', function(_event) {
      showVRNotFound(button);
    }, false);
    window.addEventListener('vrdisplaypresentchange', function(event) {
      button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';
    }, false);
    navigator.getVRDisplays()
      .then(function(displays) {
        if (displays.length > 0) {
          showEnterVR(displays[0], button);
        } else {
          showVRNotFound(button);
        }
      });
    return button;
  } else {
    const message = document.createElement('a');
    message.href = 'https://webvr.info';
    message.innerHTML = 'WEBVR NOT SUPPORTED';
    message.style.left = 'calc(50% - 90px)';
    message.style.width = '180px';
    message.style.textDecoration = 'none';
    stylizeElement(message);
    return message;
  }
}

