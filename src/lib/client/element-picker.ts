export interface PickedElement {
  selector: string;
  label: string;
  html: string;
}

const MAX_SNIPPET = 2400;

/**
 * Script injected into the preview document (never into exports). While
 * the parent asks for it, it outlines the hovered element and reports the
 * clicked one back via postMessage.
 */
export const ELEMENT_PICKER_INJECTION = `
<script>
(() => {
  let on = false, box = null, tag = null, current = null;
  const ensure = () => {
    if (box) return;
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:1.5px solid #C7D2FE;background:rgba(199,210,254,.12);border-radius:4px;box-shadow:0 0 0 4px rgba(199,210,254,.12);transition:all .08s ease;display:none';
    tag = document.createElement('div');
    tag.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;font:500 11px/1 ui-monospace,monospace;color:#EEF1FF;background:#070A14;border:1px solid rgba(199,210,254,.3);padding:5px 7px;border-radius:6px;display:none';
    document.documentElement.append(box, tag);
  };
  const describe = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = [...el.classList].slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    return s;
  };
  const selectorOf = (el) => {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement && parts.length < 5) {
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.tagName === node.tagName);
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  };
  const hide = () => { if (box) { box.style.display = 'none'; tag.style.display = 'none'; } };
  const move = (e) => {
    const el = e.target;
    if (!(el instanceof Element) || el === document.documentElement || el === document.body) { current = null; hide(); return; }
    current = el;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    tag.textContent = describe(el);
    Object.assign(tag.style, { display: 'block', left: Math.max(4, r.left) + 'px', top: Math.max(4, r.top - 26) + 'px' });
  };
  const click = (e) => {
    if (!on) return;
    e.preventDefault();
    e.stopPropagation();
    if (!current) return;
    const html = current.outerHTML;
    parent.postMessage({ type: 'localsite:picked', selector: selectorOf(current), label: describe(current),
      html: html.length > ${MAX_SNIPPET} ? html.slice(0, ${MAX_SNIPPET}) + '…' : html }, '*');
    stop();
  };
  const key = (e) => { if (on && e.key === 'Escape') { parent.postMessage({ type: 'localsite:pick-cancel' }, '*'); stop(); } };
  const start = () => {
    if (on) return;
    on = true; ensure();
    document.addEventListener('mousemove', move, true);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key, true);
    document.documentElement.style.cursor = 'crosshair';
  };
  const stop = () => {
    on = false; current = null; hide();
    document.removeEventListener('mousemove', move, true);
    document.removeEventListener('click', click, true);
    document.removeEventListener('keydown', key, true);
    document.documentElement.style.cursor = '';
  };
  window.addEventListener('message', (e) => {
    if (e.source !== parent || !e.data || e.data.type !== 'localsite:pick') return;
    e.data.on ? start() : stop();
  });
})();
<\/script>
`;

/** Appends the picked element as context for the model. */
export function withElementContext(request: string, target: PickedElement | null): string {
  if (!target) return request;
  return `${request}

Apply this change to the following element (CSS selector: \`${target.selector}\`):
\`\`\`html
${target.html}
\`\`\``;
}
