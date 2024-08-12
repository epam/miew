import { RangeList, ValueList } from './selectArgs';

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

class NoneSelector extends Selector {
  includesAtom(_atom) {
    return false;
  }
}

NoneSelector.prototype.name = 'None';
NoneSelector.prototype.keyword = 'none';

class AllSelector extends Selector {
  includesAtom(_atom) {
    return true;
  }
}

AllSelector.prototype.name = 'All';
AllSelector.prototype.keyword = 'all';

export {
  Selector,
  ListSelector,
  RangeListSelector,
  ValueListSelector,
  NoneSelector,
  AllSelector,
};
