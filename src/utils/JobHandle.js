

import utils from '../utils';
import EventDispatcher from './EventDispatcher';

function JobHandle() {
  EventDispatcher.call(this);

  this._cancellationRequested = false;
}

utils.deriveClass(JobHandle, EventDispatcher);

JobHandle.prototype.cancel = function() {
  this._cancellationRequested = true;
  this.dispatchEvent('cancel');
};

JobHandle.prototype.isCancellationRequested = function() {
  return this._cancellationRequested;
};

// slaves use this to notify master about their events
// master routes these notifications to a single event slot
JobHandle.prototype.notify = function(event) {
  this.dispatchEvent({type: 'notification', slaveEvent: event});
};

export default JobHandle;

