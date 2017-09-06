import Atom from './Atom';
import ResidueType from './ResidueType';
import {parser} from '../utils/SelectionParser';
import utils from '../utils';

const keywords = {};

function defineSelector(name, SelectorClass) {
  const keyword = name.toLowerCase();
  SelectorClass.prototype.keyword = keyword;
  SelectorClass.prototype.name = name;

  const factory = ((...args) => new SelectorClass(...args));
  factory.SelectorClass = SelectorClass;
  keywords[keyword] = factory;

  return SelectorClass;
}

//////////////////////////////////////////////////////////////////////////////

class Range {
  constructor(min, max) {
    this.min = min;
    this.max = typeof max === 'undefined' ? min : max;
  }

  includes(value) {
    return this.min <= value && value <= this.max;
  }

  toString() {
    const min = this.min, max = this.max;
    return min === max ? String(min) : [min, max].join(':');
  }

  toJSON() {
    return [this.min, this.max];
  }
}

//////////////////////////////////////////////////////////////////////////////

class List {
  constructor(arg) {
    if (arg instanceof this.constructor) {
      return arg;
    } else if (arg instanceof Array) {
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
    const values = this._values, result = [];
    for (let i = 0, n = values.length; i < n; ++i) {
      const value = values[i];
      result[i] = value.toJSON ? value.toJSON() : value;
    }
    return result;
  }
}

//////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////

const valuesArray = [];

class ValueList extends List {
  constructor(arg, caseInsensitive) {
    const list = super(arg);
    if (caseInsensitive) {
      const values = list._values;
      for (let i = 0, n = values.length; i < n; ++i) {
        let value = values[i];
        if (typeof value === 'string') {
          values[i] = value.toUpperCase();
        }
      }
    }
    return list;
  }

  includes(value) {
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
}

//////////////////////////////////////////////////////////////////////////////
// Selectors

/** Base class for atom selectors. */
class Selector {
  toString() {
    return this.keyword;
  }

  toJSON() {
    return [this.name];
  }
}

Selector.prototype.name = 'Error';
Selector.prototype.keyword = 'error';

/** Base class for list-based atom selectors. */
class ListSelector extends Selector {
  constructor(list) {
    super();
    this.list = list;
  }

  toString() {
    return `${this.keyword} ${this.list}`;
  }

  toJSON() {
    return [this.name, this.list.toJSON()];
  }
}

class RangeListSelector extends ListSelector {
  constructor(arg) {
    super(new RangeList(arg));
  }
}

class ValueListSelector extends ListSelector {
  constructor(arg, caseSensitive) {
    super(new ValueList(arg, !caseSensitive));
  }
}

defineSelector('Serial', class SerialSelector extends RangeListSelector {
  includesAtom(atom) {
    return this.list.includes(atom._serial);
  }
});

defineSelector('Name', class NameSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(atom._name.getString());
  }
});

defineSelector('AltLoc', class AltLocSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(String.fromCharCode(atom._location));
  }
});

defineSelector('Elem', class ElemSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(atom.element.name);
  }
});

defineSelector('Residue', class ResidueSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(atom._residue._type._name);
  }
});

defineSelector('Sequence', class SequenceSelector extends RangeListSelector {
  includesAtom(atom) {
    return this.list.includes(atom._residue._sequence);
  }
});

defineSelector('ICode', class ICodeSelector extends ValueListSelector {
  constructor(arg) {
    super(arg, true);
  }

  includesAtom(atom) {
    return this.list.includes(atom._residue._icode);
  }
});

defineSelector('ResIdx', class ResIdxSelector extends RangeListSelector {
  includesAtom(atom) {
    return this.list.includes(atom._residue._index);
  }
});

defineSelector('Chain', class ChainSelector extends ValueListSelector {
  constructor(arg) {
    super(arg, true);
  }

  includesAtom(atom) {
    return this.list.includes(atom._residue._chain._name);
  }
});

defineSelector('Hetatm', class HetatmSelector extends Selector {
  includesAtom(atom) {
    return atom._het;
  }
});

defineSelector('PolarH', class PolarHSelector extends Selector {
  includesAtom(atom) {
    return (atom.flags & Atom.Flags.NONPOLARH) === Atom.Flags.HYDROGEN;
  }
});

defineSelector('NonPolarH', class NonPolarHSelector extends Selector {
  includesAtom(atom) {
    return (atom.flags & Atom.Flags.NONPOLARH) === Atom.Flags.NONPOLARH;
  }
});

defineSelector('All', class AllSelector extends Selector {
  includesAtom(_atom) {
    return true;
  }
});

defineSelector('None', class NoneSelector extends Selector {
  includesAtom(_atom) {
    return false;
  }
});

const NULL_SELECTOR = keywords.none();

//////////////////////////////////////////////////////////////////////////////
// Flag selectors

function byResidueTypeFlag(flag, name) {
  return defineSelector(name, class extends Selector {
    includesAtom(atom) {
      return (atom._residue._type.flags & flag) !== 0;
    }
  });
}

byResidueTypeFlag(ResidueType.Flags.PROTEIN, 'Protein');
byResidueTypeFlag(ResidueType.Flags.BASIC, 'Basic');
byResidueTypeFlag(ResidueType.Flags.ACIDIC, 'Acidic');
byResidueTypeFlag(ResidueType.Flags.BASIC | ResidueType.Flags.ACIDIC, 'Charged');
byResidueTypeFlag(ResidueType.Flags.POLAR, 'Polar');
byResidueTypeFlag(ResidueType.Flags.NONPOLAR, 'NonPolar');
byResidueTypeFlag(ResidueType.Flags.AROMATIC, 'Aromatic');
byResidueTypeFlag(ResidueType.Flags.NUCLEIC, 'Nucleic');
byResidueTypeFlag(ResidueType.Flags.PURINE, 'Purine');
byResidueTypeFlag(ResidueType.Flags.PYRIMIDINE, 'Pyrimidine');
byResidueTypeFlag(ResidueType.Flags.WATER, 'Water');

//////////////////////////////////////////////////////////////////////////////
// Operators

function defineOperator(name, priority, OperatorClass) {
  OperatorClass.prototype.priority = priority;
  return defineSelector(name, OperatorClass);
}

class PrefixOperator extends Selector {
  constructor(rhs) {
    super();
    this.rhs = rhs || NULL_SELECTOR;
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
    this.lhs = lhs || NULL_SELECTOR;
    this.rhs = rhs || NULL_SELECTOR;
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

defineOperator('Not', 1, class NotSelector extends PrefixOperator {
  includesAtom(atom) {
    return !this.rhs.includesAtom(atom);
  }
});

defineOperator('And', 2, class AndOperator extends InfixOperator {
  includesAtom(atom) {
    return this.lhs.includesAtom(atom) && this.rhs.includesAtom(atom);
  }
});

defineOperator('Or', 3, class OrOperator extends InfixOperator {
  includesAtom(atom) {
    return this.lhs.includesAtom(atom) || this.rhs.includesAtom(atom);
  }
});

//////////////////////////////////////////////////////////////////////////////

const selectors = Object.create(keywords);

// TODO: Provide consistent module exports
selectors.Selector = Selector;
selectors.RangeListSelector = RangeListSelector;
selectors.ValueListSelector = ValueListSelector;
selectors.Range = Range;
selectors.RangeList = RangeList;
selectors.ValueList = ValueList;
selectors.PrefixOperator = PrefixOperator;
selectors.InfixOperator = InfixOperator;
selectors.Context = Object.create({});

selectors.GetSelector = function(key) {
  if (!selectors.Context.hasOwnProperty(key)) {
    const exc = {message: 'selector ' + key + ' is not registered'};
    throw exc;
  }
  return selectors.Context[key] || NULL_SELECTOR;
};

selectors.ClearContext = function() {
  Object.keys(selectors.Context).forEach(function(k) { delete selectors.Context[k]; });
};

selectors.keyword = function(key) {
  return keywords[key.toLowerCase()] || keywords.none;
};

selectors.parse = function(str) {
  const res = {};
  try {
    res.selector = parser.parse(str);
  } catch (e) {
    res.selector = NULL_SELECTOR;
    res.error = e.message;
  }
  return res;
};

parser.yy = selectors;
parser.yy.parseError = parser.parseError; // FIXME: workaround for incorrect JISON parser generator for AMD module

export default selectors;

