export interface WorkStep {
  id: string;
  label: string;
  state: "done" | "active" | "pending";
}

const hasTag = (code: string, tag: string) => new RegExp(`<${tag}\\b`, "i").test(code);

const CONTENT_TAGS = ["div", "p", "h1", "h2", "h3", "img", "ul", "section", "main", "article"];

/**
 * Derives the visible work steps from the streamed HTML so far.
 * Heuristic only: it reads which parts of a document already exist.
 */
export function deriveSteps(
  code: string,
  opts: { generating: boolean; complete: boolean; reasoning: boolean; thinking: boolean },
): WorkStep[] {
  const detectors: { id: string; label: string; done: boolean; optional?: boolean }[] = [
    { id: "connect", label: "Reached the model", done: !!code || opts.reasoning },
    ...(opts.reasoning
      ? [{ id: "reason", label: "Reasoning", done: !opts.thinking }]
      : []),
    {
      id: "structure",
      label: "Laying out the structure",
      done: /<!doctype\s+html\b/i.test(code) || hasTag(code, "body"),
    },
    {
      id: "content",
      label: "Writing content",
      done: CONTENT_TAGS.filter((t) => hasTag(code, t)).length >= 3,
    },
    {
      id: "styles",
      label: "Styling",
      done: /<\/style>/i.test(code) || (opts.complete && /\bstyle\s*=|<style\b/i.test(code)),
    },
    {
      id: "scripts",
      label: "Wiring up scripts",
      done: /<\/script>/i.test(code),
      optional: !/<script\b/i.test(code),
    },
    { id: "final", label: "Final render", done: opts.complete },
  ];

  const visible = detectors.filter((d) => !(d.optional && opts.complete));
  if (opts.complete) return visible.map((d) => ({ id: d.id, label: d.label, state: "done" }));

  // Steps are sequential: the first unfinished one is active
  let activeFound = false;
  return visible.map((d) => {
    if (d.done && !activeFound) return { id: d.id, label: d.label, state: "done" as const };
    if (!activeFound && opts.generating) {
      activeFound = true;
      return { id: d.id, label: d.label, state: "active" as const };
    }
    return { id: d.id, label: d.label, state: "pending" as const };
  });
}
