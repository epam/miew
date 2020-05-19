const chromeOptionsArguments = [
  '--headless', // headless mode (without browser window), it's more performance, but doesn't support some extensions
  '--disable-gpu', // all computing in CPU, guaranteed the same image processing result on different machines
  '--log-level=1', // minimum log level: INFO = 0, WARNING = 1, LOG_ERROR = 2, LOG_FATAL = 3. level 1 - to not see info about not supporting some extensions
];

export default chromeOptionsArguments;
