import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('cursor field has double radius and 20 percent stronger displacement, capped at 2.88 pixels', async () => {
  const source = await readFile(new URL('../src/viewer.js', import.meta.url), 'utf8');
  assert.match(source, /smoothstep\(0\.0, 96\.0, distance\)/);
  assert.match(source, /radial \* influence \* influence \* 2\.88 \+ curl/);
  assert.match(source, /\(1\.0 - influence\) \* 1\.44/);
  assert.match(source, /push \/ viewport \* 2\.0 \* clip.w/);
  for (let i = 0; i <= 1000; i++) {
    const influence = i / 1000;
    const push = Math.hypot(2.88 * influence ** 2, 1.44 * influence * (1 - influence));
    assert(push <= 2.88);
  }
});
