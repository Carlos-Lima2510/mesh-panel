class InventoryStore {
  constructor() {
    this.items = new Map();
  }

  get(nodeId) {
    return this.items.get(nodeId);
  }

  set(nodeId, data) {
    this.items.set(nodeId, data);
  }

  getAll() {
    return Array.from(this.items.values());
  }

  count() {
    return this.items.size;
  }
}

module.exports = InventoryStore;