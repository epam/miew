

import utils from './utils';

function Profiler() {
  // bind method to get current time
  this.now = utils.Timer.now;

  this._startTime = 0;
  this._times = [];
}

Profiler.prototype.start = function() {
  this._startTime = this.now();
};

Profiler.prototype.end = function() {
  if (this._startTime !== 0) {
    this._times.push(this.now() - this._startTime);
  }
};

Profiler.prototype.rawMean = function() {
  var n = this._times.length;
  var mean = 0;
  for (var i = 0; i < n; ++i) {
    mean += this._times[i];
  }
  return mean / n;
};

Profiler.prototype.mean = function() {
  return this._robustMean(this._times);
};

Profiler.prototype.deviation = function(mean) {
  return this._robustDeviation(this._times, mean);
};

Profiler.prototype.min = function() {
  return this._robustMin(this._times);
};

Profiler.prototype._robustMean = function(values) {
  var first = Math.round(values.length * 0.1);
  var n = values.length - Math.round(values.length * 0.2);
  values.sort(function(a, b) {
    return a - b;
  });
  var mean = 0;
  for (var i = first; i < n; ++i) {
    mean += values[i];
  }
  return mean / n;
};

Profiler.prototype._robustDeviation = function(values, mean) {
  var n = values.length;
  var deltas = new Array(n);
  for (var i = 0; i < n; ++i) {
    deltas[i] = (values[i] - mean) * (values[i] - mean);
  }
  deltas.sort(function(a, b) {
    return a - b;
  });
  return Math.sqrt(this._robustMean(deltas));
};

Profiler.prototype._robustMin = function(values) {
  var first = Math.round(values.length * 0.05);
  var n = Math.round(values.length * 0.1);
  values.sort(function(a, b) {
    return a - b;
  });
  var mean = 0;
  for (var i = 0; i < n; ++i) {
    mean += values[first + i];
  }
  return mean / n;
};

export default Profiler;

