import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { articleCatalog } from "../src/content/articles/catalog"

test("every article has a 1600x900 static PNG cover", async () => {
  assert.equal(articleCatalog.length, 10)

  for (const article of articleCatalog) {
    const file = await readFile(path.join(process.cwd(), "public", article.coverImage))
    assert.equal(file.subarray(1, 4).toString("ascii"), "PNG", article.key)
    assert.equal(file.readUInt32BE(16), 1600, article.key)
    assert.equal(file.readUInt32BE(20), 900, article.key)
  }
})
