import { By, Key, until } from 'selenium-webdriver';

const timeout = 10000;

const dom = {
  canvas: By.css('.miew-canvas canvas'),
  title: By.css('span[data-field="title"]'),
  terminal: {
    window: By.css('.terminal-window'),
    button: By.id('miew-terminal-btn'),
    clipboard: By.css('.terminal-wrapper textarea.cmd-clipboard'),
    command: By.css('.terminal-output .terminal-command'),
  },
};

/** Class representing a Page Object for the Miew demo website. */
export default class MiewPage {
  /**
   * Create a Page Object.
   * @param {ThenableWebDriver} driver - a Selenium WebDriver instance.
   * @param {?string=} url - a URL to navigate to, or https://miew.opensource.epam.com/ by default. Specify explicit
   *        `null` to skip reloading and to use the current browser page.
   */
  constructor(driver, url) {
    /** @type {ThenableWebDriver} */
    this.driver = driver;
    if (url !== null) {
      this.driver.get(url || 'https://miew.opensource.epam.com/');
    }
  }

  /**
   * Open the terminal window if it's not open yet.
   * @returns {promise.Thenable|Promise} A promise.
   */
  openTerminal() {
    const terminal = this.driver.findElement(dom.terminal.window);
    return terminal.isDisplayed().then((visible) => {
      if (!visible) {
        this.driver.findElement(dom.terminal.button).click();
        return this.driver.wait(until.elementIsVisible(terminal), timeout);
      }
      return Promise.resolve();
    });
  }

  /**
   * Execute a script in the terminal.
   * @param {string} script - one or more script commands to execute.
   * @returns {promise.Thenable} A promise.
   */
  runScript(script) {
    const keys = script.replace(/[\r\n]+/g, Key.ENTER) + Key.ENTER;
    return this.driver.findElement(dom.terminal.clipboard).sendKeys(keys);
  }

  /**
   * Retrieve the first command in the terminal output.
   * @returns {promise.Thenable<string>} A promise which resolves with the command text.
   */
  getFirstCommand() {
    return this.driver.wait(until.elementLocated(dom.terminal.command), timeout).getText();
  }

  /**
   * Schedule a request for evaluating expression.
   * The evaluation context contains `miew` object and `Miew` class.
   * @returns {promise.Thenable<*>} A promise which resolves with the expression value.
   */
  getValueFor(expression) {
    return this.driver.executeScript(`\
var miew = window && window.miew;
var Miew = miew && miew.constructor;
return miew && Miew && JSON.stringify(${expression});`)
      .then((json) => JSON.parse(json));
  }

  /**
   * Wait until a Miew instance is created on the page.
   * @returns {promise.Thenable<string>} A promise which resolves with the miew version string, e.g. "v0.1.0".
   */
  waitForMiew() {
    return this.driver.wait(() => this.getValueFor('Miew.VERSION'), timeout);
  }

  /**
   * Wait until the title contains a substring.
   * @param {string} str - substring to look for.
   * @returns {promise.Thenable} A promise.
   */
  waitUntilTitleContains(str) {
    const title = this.driver.findElement(dom.title);
    return this.driver.wait(until.elementTextContains(title, str), timeout);
  }

  /**
   * Wait until geometry is built and displayed.
   * @returns {promise.Thenable} A promise.
   */
  waitUntilRebuildIsDone() {
    return this.driver.wait(() => this.driver.executeScript(`\
var miew = window.miew;
var rep = miew && miew.repGet(0);
return rep && !miew._loading.length && !miew._building && !miew._needRebuild() && !miew._needRender;`), timeout);
  }

  /**
   * Wait until representation is set correctly, geometry is built and displayed.
   * @param {number} index - target representation index
   * @param {string} mode - mode ID, e.g. "BS"
   * @param {string} colorer - colorer ID, e.g. "EL"
   * @returns {promise.Thenable} A promise.
   */
  waitUntilRepresentationIs(index, mode, colorer) {
    return this.driver.wait(() => this.driver.executeScript(`\
var miew = window && window.miew;
var rep = miew && !miew._loading.length && miew.repGet(${index});
var modeOk = rep && (rep.mode.id === '${mode.toUpperCase()}');
var colorerOk = rep && (rep.colorer.id === '${colorer.toUpperCase()}');
return modeOk && colorerOk && !miew._building && !miew._needRebuild() && !miew._needRender;`), timeout);
  }
}
