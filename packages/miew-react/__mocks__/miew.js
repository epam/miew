export default class Miew {
  init() {
    return true;
  }
  term() {}
  run() {}
  load() {
    return Promise.resolve('molecule');
  }
}
