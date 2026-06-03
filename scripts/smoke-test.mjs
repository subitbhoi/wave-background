import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function importTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: relativePath,
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const [{ GradientCache }, { hexToTransparent }] = await Promise.all([
  importTypeScript("../src/gradientCache.ts"),
  importTypeScript("../src/utils.ts"),
]);

assert.equal(hexToTransparent("#fff"), "rgba(255, 255, 255, 0)");
assert.equal(hexToTransparent("#112233"), "rgba(17, 34, 51, 0)");
assert.equal(hexToTransparent("#11223380"), "rgba(17, 34, 51, 0)");
assert.equal(hexToTransparent("red"), "rgba(0, 0, 0, 0)");
assert.equal(hexToTransparent(undefined), "rgba(0, 0, 0, 0)");

const cache = new GradientCache();
const initialBuffer = cache.getPointBuffer(1, 8);
cache.clear();
const nextBuffer = cache.getPointBuffer(1, 4);

assert.notEqual(initialBuffer, nextBuffer);
assert.equal(nextBuffer.length, 4);

console.log("smoke tests passed");
