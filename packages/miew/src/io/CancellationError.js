export default class CancellationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CancellationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
