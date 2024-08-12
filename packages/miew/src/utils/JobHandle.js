import EventDispatcher from './EventDispatcher';

export default class JobHandle extends EventDispatcher {
  constructor() {
    super();
    this._shouldCancel = false;
  }

  cancel() {
    this._shouldCancel = true;
    this.dispatchEvent({ type: 'cancel' });
  }

  shouldCancel() {
    return this._shouldCancel;
  }

  // slaves use this to notify master about their events
  // master routes these notifications to a single event slot
  notify(event) {
    this.dispatchEvent({ type: 'notification', slaveEvent: event });
  }
}
