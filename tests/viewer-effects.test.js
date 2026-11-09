import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('cursor displacement is bounded to 2.4 screen pixels, with a subtle tangential field instead of a hole', async () => {
  const source = await readFile(new URL('../src/viewer.js', import.meta.url), 'utf8');
  assert.match(source, /radial \* influence \* influence \* 2\.4 \+ curl/);
  assert.match(source, /\(1\.0 - influence\) \* 1\.2/);
  assert.match(source, /push \/ viewport \* 2\.0 \* clip.w/);
  for (let i = 0; i <= 1000; i++) {
    const influence = i / 1000;
    const push = Math.hypot(2.4 * influence ** 2, 1.2 * influence * (1 - influence));
    assert(push <= 2.4);
  }
});
