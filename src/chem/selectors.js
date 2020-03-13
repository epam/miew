import Atom from './Atom';
import ResidueType from './ResidueType';
import { parser } from '../utils/SelectionParser';
import { Range, RangeList, ValueList } from './selectors/selectArgs';
import { PrefixOperator, InfixOperator } from './selectors/selectOps';
import {
  Selector,
  RangeListSelector,
  ValueListSelector,
  NoneSelector,
  AllSelector,
} from './selectors/selectorsBase';

const keywords = {};

//----------------------------------------------------------------------------
// Named selectors
//----------------------------------------------------------------------------

function defineSelector(name, SelectorClass) {
  const keyword = name.toLowerCase();
  SelectorClass.prototype.keyword = keyword;
  SelectorClass.prototype.name = name;

  const factory = ((...args) => new SelectorClass(...args));
  factory.SelectorClass = SelectorClass;
  keywords[keyword] = factory;

  return SelectorClass;
}

defineSelector('Serial', class SerialSelector extends RangeListSelector {
  includesAtom(atom) {
    return this.list.includes(atom.serial);
  }
});

defineSelector('Name', class NameSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(atom.name);
  }
});

defineSelector('AltLoc', class AltLocSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(String.fromCharCode(atom.location));
  }
});

defineSelector('Elem', class ElemSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(atom.element.name);
  }
});

defineSelector('Residue', class ResidueSelector extends ValueListSelector {
  includesAtom(atom) {
    return this.list.includes(atom.residue._type._name);
  }
});

defineSelector('Sequence', class SequenceSelector extends RangeListSelector {
  includesAtom(atom) {
    return this.list.includes(atom.residue._sequence);
  }
});

defineSelector('ICode', class ICodeSelector extends ValueListSelector {
  constructor(arg) {
    super(arg, true);
  }

  includesAtom(atom) {
    return this.list.includes(atom.residue._icode);
  }
});

defineSelector('ResIdx', class ResIdxSelector extends RangeListSelector {
  includesAtom(atom) {
    return this.list.includes(atom.residue._index);
  }
});

defineSelector('Chain', class ChainSelector extends ValueListSelector {
  constructor(arg) {
    super(arg, true);
  }

  includesAtom(atom) {
    return this.list.includes(atom.residue._chain._name);
  }
});

defineSelector('Hetatm', class HetatmSelector extends Selector {
  includesAtom(atom) {
    return atom.het;
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

defineSelector('All', AllSelector);

defineSelector('None', NoneSelector);

const NULL_SELECTOR = keywords.none();

//----------------------------------------------------------------------------
// Named operators
//----------------------------------------------------------------------------

function defineOperator(name, priority, OperatorClass) {
  OperatorClass.prototype.priority = priority;
  return defineSelector(name, OperatorClass);
}
defineOperator('Not', 1, class NotOperator extends PrefixOperator {
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

//----------------------------------------------------------------------------
// Flag selectors
//----------------------------------------------------------------------------

function byResidueTypeFlag(flag, name) {
  return defineSelector(name, class extends Selector {
    includesAtom(atom) {
      return (atom.residue._type.flags & flag) !== 0;
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

//----------------------------------------------------------------------------
const selectors = Object.create(keywords);

selectors.Selector = Selector;
selectors.RangeListSelector = RangeListSelector;
selectors.ValueListSelector = ValueListSelector;
selectors.Range = Range;
selectors.RangeList = RangeList;
selectors.ValueList = ValueList;
selectors.PrefixOperator = PrefixOperator;
selectors.InfixOperator = InfixOperator;
selectors.Context = Object.create({});

selectors.GetSelector = function (key) {
  if (!selectors.Context.hasOwnProperty(key)) {
    const exc = { message: `selector ${key} is not registered` };
    throw exc;
  }
  return selectors.Context[key] || NULL_SELECTOR;
};

selectors.ClearContext = function () {
  Object.keys(selectors.Context).forEach((k) => { delete selectors.Context[k]; });
};

selectors.keyword = function (key) {
  return keywords[key.toLowerCase()] || keywords.none;
};

selectors.parse = function (str) {
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
parser.yy.parseError = parser.parseError; // workaround for incorrect JISON parser generator for AMD module

export default selectors;
