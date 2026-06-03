export function createRandomSeed() {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }

  return Math.floor(Math.random() * 2 ** 32);
}

export function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomBetween(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

export function randomInt(random: () => number, min: number, max: number) {
  return Math.floor(randomBetween(random, min, max + 1));
}
