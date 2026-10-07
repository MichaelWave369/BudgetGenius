export class BudgetLedger {
  #rows = [];

  append(entry) {
    const row = Object.freeze(structuredClone(entry));
    this.#rows.push(row);
    return row;
  }

  all() {
    return Object.freeze(this.#rows.map((row) => Object.freeze(structuredClone(row))));
  }
}
