export interface DiffStats {
  added: number;
  removed: number;
}

// LCS tables above this size get too slow for the main thread
const MAX_CELLS = 4_000_000;

/**
 * Counts added/removed lines between two texts using a longest common
 * subsequence over lines. Very large inputs fall back to a multiset
 * comparison, which is exact for pure additions/removals and a close
 * estimate otherwise.
 */
export function lineDiffStats(before: string, after: string): DiffStats {
  if (before === after) return { added: 0, removed: 0 };
  const a = before ? before.split("\n") : [];
  const b = after ? after.split("\n") : [];

  // Trim the common prefix and suffix first; most edits are local
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  if (!midA.length || !midB.length) return { added: midB.length, removed: midA.length };

  if (midA.length * midB.length > MAX_CELLS) return multisetStats(midA, midB);

  const cols = midB.length + 1;
  let prev = new Uint32Array(cols);
  let curr = new Uint32Array(cols);
  for (let i = 1; i <= midA.length; i++) {
    for (let j = 1; j <= midB.length; j++) {
      curr[j] = midA[i - 1] === midB[j - 1]
        ? prev[j - 1] + 1
        : Math.max(prev[j], curr[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  const common = prev[midB.length];
  return { added: midB.length - common, removed: midA.length - common };
}

function multisetStats(a: string[], b: string[]): DiffStats {
  const counts = new Map<string, number>();
  for (const line of a) counts.set(line, (counts.get(line) ?? 0) + 1);
  let common = 0;
  for (const line of b) {
    const n = counts.get(line) ?? 0;
    if (n > 0) {
      common++;
      counts.set(line, n - 1);
    }
  }
  return { added: b.length - common, removed: a.length - common };
}
