function _ensureArray(x) {
  if (x === null || x === undefined || Array.isArray(x)) {
    return x;
  }
  return [x];
}

/** An indexed list of objects or classes. */
class EntityList {
  /**
   * Create a list of objects.
   * The objects can be indexed by one or more properties for the later retrieval.
   *
   * @param {!Array<Object>=} entities A list of objects to automatically register at creation time.
   * @param {!Array<string>=} indices A list of property names to use for case-insensitive indexing.
   *   By default, a single `.id` property is used.
   * @see EntityList#register
   */
  constructor(entities = [], indices = ['id']) {
    this._list = [];
    this._dict = {};
    this._indices = [...indices];
    this._indices.forEach((index) => {
      this._dict[index] = {};
    });

    entities.forEach((entity) => this.register(entity));
  }

  /**
   * Add a value to the end of a list.
   * The list will contain only one copy of the value.
   *
   * @param {!Array} list An array.
   * @param {*} value A value to add.
   * @see EntityList.unregisterFromList
   * @see EntityList.registerInDict
   */
  static registerInList(list, value) {
    if (!list.includes(value)) {
      list.push(value);
    }
  }

  /**
   * Remove a value from a list if it is there.
   *
   * @param {!Array} list An array.
   * @param {*} value A value to remove.
   * @see EntityList.registerInList
   */
  static unregisterFromList(list, value) {
    const pos = list.indexOf(value);
    if (pos !== -1) {
      list.splice(pos, 1);
    }
  }

  /**
   * Add a value to a dictionary.
   * The value may be stored under multiple different keys (aliases).
   * There might be multiples values stored under the same key.
   *
   * @param {!Object<string,*>} dict A dictionary.
   * @param {!Array<string>} keys An array of keys.
   * @param {*} value A value to add.
   * @see EntityList.unregisterFromDict
   * @see EntityList.registerInList
   */
  static registerInDict(dict, keys, value) {
    keys.forEach((key) => {
      key = key.toLowerCase();
      const list = dict[key] = dict[key] || [];
      if (!list.includes(value)) {
        list.push(value);
      }
    });
  }

  /**
   * Remove a value from a dictionary.
   * The value may be stored under multiple different keys (aliases).
   * There might be multiples values stored under the same key.
   *
   * @param {!Object<string,*>} dict A dictionary.
   * @param {!Array<string>} keys An array of keys.
   * @param {*} value A value to add.
   * @see EntityList.registerInDict
   */
  static unregisterFromDict(dict, keys, value) {
    keys.forEach((key) => {
      key = key.toLowerCase();
      const list = dict[key];
      if (list) {
        const pos = list.indexOf(value);
        if (pos !== -1) {
          list.splice(pos, 1);
        }
        if (list.length === 0) {
          delete dict[key];
        }
      }
    });
  }

  /**
   * Add an entity to this list.
   *
   * @param {!Object} entity An object or a class to register. The object must include all
   *   properties specified as indices on construction.
   * @see EntityList#unregister
   */
  register(entity) {
    EntityList.registerInList(this._list, entity);
    this._indices.forEach((index) => {
      EntityList.registerInDict(this._dict[index], _ensureArray(entity[index]), entity);
    });
  }

  /**
   * Remove an entity from this list.
   *
   * @param {!Object} entity An object or a class to unregister. The object may be
   *   missing from the list but it must include all properties specified as indices
   *   on construction.
   * @see EntityList#register
   */
  unregister(entity) {
    EntityList.unregisterFromList(this._list, entity);
    this._indices.forEach((index) => {
      EntityList.unregisterFromDict(this._dict[index], _ensureArray(entity[index]), entity);
    });
  }

  /**
   * An ordered list of all registered entities.
   * It is a read-only copy, use {@link EntityList#register} and {@link EntityList#unregister}
   * to modify it.
   *
   * @type {!Array<Object>}
   */
  get all() {
    return [...this._list];
  }

  /**
   * The first registered entity.
   * Use it if you do not care which entity you are referring to.
   *
   * @type {Object=}
   */
  get first() {
    return this._list[0];
  }

  /**
   * Retrieve a list of keys for the index.
   *
   * @param {string=} index One of the indices specified during the list construction. If omitted,
   *   the first of the indices is used.
   * @returns {!Array<string>} An unordered list of keys in the index, i.e. particular property
   *   values for all registered entities.
   */
  keys(index) {
    return Object.keys(this._dict[index || this._indices[0]]);
  }

  /**
   * Retrieve an entity by its key.
   *
   * @param {string} key A case-insensitive property value to look-up.
   * @param {string=} index One of the indices specified during the list construction. If omitted,
   *   the first of the indices is used.
   * @returns {Object=} An object registered in the index under the key. If there are multiple
   *   objects under the same key, the first one is returned.
   */
  get(key, index) {
    const dict = this._dict[index || this._indices[0]];
    if (dict) {
      const values = dict[key && key.toLowerCase()];
      return values && values.length > 0 ? values[0] : undefined;
    }
    return undefined;
  }
}

export default EntityList;
