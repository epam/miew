const timeout = 10000;
const fs = require('fs');

export default class EmptyPage {
  constructor(driver, url) {
    this.driver = driver;
    if (url !== null) {
      this.driver.get(url || 'https://miew.opensource.epam.com/examples/empty.html');
    }
  }

  reload() {
    return this.driver.navigate().refresh()
      .then(() => this.waitForMiew());
  }

  /**
   * Schedule a request for evaluating expression.
   * The evaluation context contains `Miew` class.
   * @returns {promise.Thenable<*>} A promise which resolves with the expression value.
   */
  getValueFor(expression) {
    return this.driver.executeScript(`\
return Miew && JSON.stringify(${expression});`)
      .then((json) => JSON.parse(json));
  }

  /**
   * Wait until a Miew instance is created on the page.
   * @returns {promise.Thenable<string>} A promise which resolves with the miew version string, e.g. "v0.1.0".
   */
  waitForMiew() {
    return this.driver.wait(() => this.getValueFor('Miew.VERSION'), timeout);
  }

  waitUntilRebuildIsDone() {
    return this.driver.wait(() => this.driver.executeScript(`\
var miew = window.miew;
return miew && !miew._loading.length && !miew._building && !miew._needRebuild() && !miew._needRender;`), timeout);
  }

  waitForExport(name) {
    return this.driver.wait(() => fs.existsSync(name), timeout);
  }
}
