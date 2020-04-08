//----------------------------------------------------------------------------
// Timer

export default class Timer {
  constructor() {
    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;
    this.running = false;
  }

  start() {
    this.startTime = Timer.now();
    this.oldTime = this.startTime;
    this.running = true;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
  }

  getElapsedTime() {
    this.update();
    return this.elapsedTime;
  }

  update() {
    let delta = 0;
    if (this.running) {
      const newTime = Timer.now();
      delta = 0.001 * (newTime - this.oldTime);
      this.oldTime = newTime;
      this.elapsedTime += delta;
    }

    return delta;
  }
}

Timer.now = (function () {
  const p = typeof window !== 'undefined' && window.performance;
  return (p && p.now) ? p.now.bind(p) : Date.now;
}());
