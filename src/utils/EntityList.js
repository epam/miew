/** A generic list of objects or classes. */
class EntityList {
  /**
   * Create a list of objects.
   * The objects can be retrieved later by their `id` property or by index.
   *
   * @param {!Array<Object>=} entities A list of objects to automatically register at creation time.
   * @see EntityList#register
   */
  constructor(entities = []) {
    this._list = [];
    this._dict = {};

    entities.forEach(entity => this.register(entity));
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
   * @param {!Object} entity An object or a class to register. Must include case-insensitive
   *   `id` property which is used for subsequent retrievals.
   * @param {string} entity.id A case-insensitive identifier.
   * @see EntityList#unregister
   */
  register(entity) {
    EntityList.registerInList(this._list, entity);
    EntityList.registerInDict(this._dict, [entity.id], entity);
  }

  /**
   * Remove an entity from this list.
   *
   * @param {!Object} entity An object or a class to unregister.
   * @param {string} entity.id A case-insensitive identifier.
   * @see EntityList#register
   */
  unregister(entity) {
    EntityList.unregisterFromList(this._list, entity);
    EntityList.unregisterFromDict(this._dict, [entity.id], entity);
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
   * Retrieve an entity by id.
   *
   * @param {string} id A case-insensitive identifier of the entity.
   * @return {Object=} A value registered under the specified id. If there are multiple values
   *   with the same id, the first one is returned.
   */
  get(id) {
    const values = this._dict[id.toLowerCase()];
    return values && values.length > 0 ? values[0] : undefined;
  }
}

export default EntityList;
