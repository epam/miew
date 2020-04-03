import Timer from '../Timer';

const { now } = Timer;

function createElement(tag, id, css) {
  const element = document.createElement(tag);
  element.id = id;
  element.style.cssText = css;
  return element;
}

class Stats {
  constructor() {
    this.domElement = createElement('div', 'stats', 'padding:8px');
    this._text = createElement('p', 'fps', 'margin:0;color:silver;font-size:large');
    this.domElement.appendChild(this._text);

    this._startTime = now();
    this._prevTime = this._startTime;

    this._deltas = new Array(20);
    this._index = 0;
    this._total = 0.0;
    this._count = 0;
  }

  end() {
    const time = now();
    const delta = time - this._startTime;

    if (this._count < this._deltas.length) {
      this._count++;
    } else {
      this._total -= this._deltas[this._index];
    }
    this._total += delta;
    this._deltas[this._index] = delta;
    this._index = (this._index + 1) % this._deltas.length;

    this.ms = this._total / this._count;
    this.fps = 1000 / this.ms;

    if (time > this._prevTime + 1000) {
      this._text.textContent = this.fps.toPrecision(2);
      this._prevTime = time;
    }

    return time;
  }

  update() {
    this._startTime = this.end();
  }

  show(on) {
    if (on === undefined) {
      on = true;
    }
    this.domElement.style.display = on ? 'block' : 'none';
  }
}

export default Stats;
