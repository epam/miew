import Timer from './Timer';

/**
 * @deprecated since 0.8.6. Will be removed in next major version
 */
function Profiler() {
  // bind method to get current time
  this.now = Timer.now;

  this._startTime = 0;
  this._times = [];
}

Profiler.prototype.start = function () {
  this._startTime = this.now();
};

Profiler.prototype.end = function () {
  if (this._startTime !== 0) {
    this._times.push(this.now() - this._startTime);
  }
};

Profiler.prototype.rawMean = function () {
  const n = this._times.length;
  let mean = 0;
  for (let i = 0; i < n; ++i) {
    mean += this._times[i];
  }
  return mean / n;
};

Profiler.prototype.mean = function () {
  return this._robustMean(this._times);
};

Profiler.prototype.deviation = function (mean) {
  return this._robustDeviation(this._times, mean);
};

Profiler.prototype.min = function () {
  return this._robustMin(this._times);
};

Profiler.prototype._robustMean = function (values) {
  const first = Math.round(values.length * 0.1);
  const n = values.length - Math.round(values.length * 0.2);
  values.sort((a, b) => a - b);
  let mean = 0;
  for (let i = first; i < n; ++i) {
    mean += values[i];
  }
  return mean / n;
};

Profiler.prototype._robustDeviation = function (values, mean) {
  const n = values.length;
  const deltas = new Array(n);
  for (let i = 0; i < n; ++i) {
    deltas[i] = (values[i] - mean) * (values[i] - mean);
  }
  deltas.sort((a, b) => a - b);
  return Math.sqrt(this._robustMean(deltas));
};

Profiler.prototype._robustMin = function (values) {
  const first = Math.round(values.length * 0.05);
  const n = Math.round(values.length * 0.1);
  values.sort((a, b) => a - b);
  let mean = 0;
  for (let i = 0; i < n; ++i) {
    mean += values[first + i];
  }
  return mean / n;
};

export default Profiler;
