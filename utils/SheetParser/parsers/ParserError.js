class ParserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParserError';
  }
}

module.exports = ParserError;