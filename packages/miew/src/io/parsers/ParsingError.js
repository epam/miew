class ParsingError extends Error {
  constructor(message, line, column) {
    super(`data:${line}:${column}: ${message}`);

    this.name = 'ParsingError';
    this.parseLine = line;
    this.parseColumn = column;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default ParsingError;
