const chromeOptionsArguments = [
  '--headless', // headless mode (without browser window), it's more performance, but doesn't support some extensions
  '--disable-gpu', // keep GPU acceleration disabled for e2e visual reproducibility
  '--use-gl=angle', // route WebGL through ANGLE to make backend selection explicit
  '--use-angle=swiftshader-webgl', // force software SwiftShader backend for deterministic rendering
  '--enable-unsafe-swiftshader', // allow SwiftShader in recent Chromium versions
  '--log-level=1', // minimum log level: INFO = 0, WARNING = 1, LOG_ERROR = 2, LOG_FATAL = 3. level 1 - to not see info about not supporting some extensions
];

export default chromeOptionsArguments;
