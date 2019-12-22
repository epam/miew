import { Selector, NoneSelector } from './selectorsBase';

//----------------------------------------------------------------------------
// Operators
//----------------------------------------------------------------------------
const none = new NoneSelector();

class PrefixOperator extends Selector {
  constructor(rhs) {
    super();
    this.rhs = rhs || none;
  }

  toString() {
    const rhs = this.rhs.priority && this.rhs.priority > this.priority ? `(${this.rhs})` : this.rhs;
    return `${this.keyword} ${rhs}`;
  }

  toJSON() {
    return [this.name, this.rhs.toJSON()];
  }
}

PrefixOperator.prototype.priority = 1;

class InfixOperator extends Selector {
  constructor(lhs, rhs) {
    super();
    this.lhs = lhs || none;
    this.rhs = rhs || none;
  }

  toString() {
    const lhs = this.lhs.priority && this.lhs.priority > this.priority ? `(${this.lhs})` : this.lhs;
    const rhs = this.rhs.priority && this.rhs.priority > this.priority ? `(${this.rhs})` : this.rhs;
    return `${lhs} ${this.keyword} ${rhs}`;
  }

  toJSON() {
    return [this.name, this.lhs.toJSON(), this.rhs.toJSON()];
  }
}

InfixOperator.prototype.priority = 1000;

export { PrefixOperator, InfixOperator };
