import { COLOR } from './constants.js';

class PieceBag {
  constructor() {
    this.colorBag = [];
  }

  reset() {
    this.colorBag = [];
  }

  getState() {
    return {
      colorBag: [...this.colorBag],
    };
  }

  setState(state) {
    this.colorBag = state.colorBag ? [...state.colorBag] : [];
  }

  getNextColor(rng) {
    if (this.colorBag.length === 0) {
      this.colorBag = Object.values(COLOR);
      // Shuffle the bag
      for (let i = this.colorBag.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [this.colorBag[i], this.colorBag[j]] = [
          this.colorBag[j],
          this.colorBag[i],
        ];
      }
    }
    return this.colorBag.pop();
  }
}

export default PieceBag;
