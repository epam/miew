import selectors from '../chem/selectors';

function parseRange(node) {
  if (node instanceof Array) {
    return new selectors.Range(node[0], node[1]);
  } else {
    return new selectors.Range(node, node);
  }
}

function parseRangeList(node) {
  const args = [];
  for (let i = 0; i < node.length; ++i) {
    args.push(parseRange(node[i]));
  }
  return new selectors.RangeList(args);
}

function parseValueList(node) {
  const args = [];
  for (let i = 0; i < node.length; ++i) {
    args.push(node[i]);
  }
  return new selectors.ValueList(args);
}

function createSelectorFromNode(node) {
  const factory = selectors.keyword(node[0]);
  if (!factory || !factory.SelectorClass) {
    return null;
  }

  let selector = null;
  const proto = factory.SelectorClass.prototype;
  if (proto instanceof selectors.PrefixOperator && node.length === 2) {
    selector = factory(createSelectorFromNode(node[1]));
  } else if (proto instanceof selectors.InfixOperator && node.length === 3) {
    selector = factory(createSelectorFromNode(node[1]), createSelectorFromNode(node[2]));
  } else if (proto instanceof selectors.RangeListSelector && node.length === 2) {
    selector = factory(parseRangeList(node[1]));
  } else if (proto instanceof selectors.ValueListSelector && node.length === 2) {
    selector = factory(parseValueList(node[1]));
  } else if (proto instanceof selectors.Selector && node.length === 1) {
    selector = factory();
  }

  return selector;
}

export default class JSONtoSelectorConverter {
  createSelectorFromNode(node) {
    return createSelectorFromNode(node);
  }
}
