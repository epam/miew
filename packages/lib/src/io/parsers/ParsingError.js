class ParsingError extends Error {
  constructor(message, line, column) {
    super(`data:${line}:${column}: ${message}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParsingError);
    }

    this.name = 'ParsingError';
    this.parseLine = line;
    this.parseColumn = column;
  }
}

export default ParsingError;
