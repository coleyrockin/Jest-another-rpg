const { createItem } = require('./domain/items');

class Potion {
  constructor(name) {
    const item = createItem(name || 'health');
    this.name = item.id;
    this.value = item.value;
  }
}

module.exports = Potion;
