import utils from '../../utils';

//----------------------------------------------------------------------------
class Range {
  constructor(min, max) {
    this.min = min;
    this.max = typeof max === 'undefined' ? min : max;
  }

  includes(value) {
    return this.min <= value && value <= this.max;
  }

  toString() {
    const { min, max } = this;
    return min === max ? String(min) : [min, max].join(':');
  }

  toJSON() {
    return [this.min, this.max];
  }
}

// ////////////////////////////////////////////////////////////////////////////

class List {
  constructor(arg) {
    if (arg instanceof this.constructor) {
      // delegate construction to a different class
      // eslint-disable-next-line no-constructor-return
      return arg;
    }
    if (arg instanceof Array) {
      this._values = arg.slice(0);
    } else if (arg) {
      this._values = [arg];
    } else {
      this._values = [];
    }
  }

  append(value) {
    const values = this._values;
    values[values.length] = value;
    return this;
  }

  remove(value) {
    const values = this._values;
    const index = values.indexOf(value);
    if (index >= 0) {
      values.splice(index, 1);
    }
    return this;
  }

  toString() {
    return this._values.join(',');
  }

  toJSON() {
    const values = this._values;
    const result = [];
    for (let i = 0, n = values.length; i < n; ++i) {
      const value = values[i];
      result[i] = value.toJSON ? value.toJSON() : value;
    }
    return result;
  }
}

//----------------------------------------------------------------------------

class RangeList extends List {
  includes(value) {
    const list = this._values;
    for (let i = 0, n = list.length; i < n; ++i) {
      if (list[i].includes(value)) {
        return true;
      }
    }
    return false;
  }
}

//----------------------------------------------------------------------------

const valuesArray = [];

class ValueList extends List {
  constructor(arg, upperOnly) {
    const list = super(arg);
    if (upperOnly) {
      this.upperOnly = true;
      const values = list._values;
      for (let i = 0, n = values.length; i < n; ++i) {
        const value = values[i];
        if (typeof value === 'string') {
          values[i] = value.toUpperCase();
        }
      }
    } else {
      this.upperOnly = false;
    }
    // return constructed object
    // eslint-disable-next-line no-constructor-return
    return list;
  }

  includes(value) {
    // we do not convert to upper case here for perfomance reasons
    // if list is upper case only, value must be converted before it is sent up to  here
    return this._values.indexOf(value) !== -1;
  }

  toString() {
    // Quote values that are not correct identifiers
    const values = this._values;
    valuesArray.length = 0;
    for (let i = 0, n = values.length; i < n; ++i) {
      valuesArray[i] = utils.correctSelectorIdentifier(String(values[i]));
    }
    return valuesArray.join(',');
  }

  _validate(value) {
    return (this.upperOnly && typeof value === 'string') ? value.toUpperCase() : value;
  }

  append(value) {
    super.append(this._validate(value));
    return this;
  }

  remove(value) {
    super.remove(this._validate(value));
    return this;
  }
}

export {
  Range,
  List,
  RangeList,
  ValueList,
};
