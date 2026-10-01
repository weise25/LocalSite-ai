<script lang="ts">
  import { ChevronsLeftRight } from '@lucide/svelte';
  import type { Version } from '$lib/state/session.svelte';

  interface Props {
    versions: Version[];
    /** Version on the right (the newer one) */
    right: Version;
    left: Version;
    onPickLeft: (n: number) => void;
  }

  let { versions, right, left, onPickLeft }: Props = $props();

  let position = $state(50);
  let dragging = $state(false);
  let box = $state<HTMLDivElement>();

  // Same base setup as the live preview, without the interactive helpers
  const prepare = (code: string) =>
    /<\s*head[^>]*>/i.test(code)
      ? code.replace(/<\s*head[^>]*>/i, (m) => `${m}<style>body{margin:0}</style>`)
      : code;

  function setFromPointer(clientX: number) {
    if (!box) return;
    const rect = box.getBoundingClientRect();
    position = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  }

  function onPointerDown(event: PointerEvent) {
    dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setFromPointer(event.clientX);
  }

  function onKeydown(event: KeyboardEvent) {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === 'ArrowLeft') position = Math.max(0, position - step);
    else if (event.key === 'ArrowRight') position = Math.min(100, position + step);
    else if (event.key === 'Home') position = 0;
    else if (event.key === 'End') position = 100;
    else return;
    event.preventDefault();
  }
</script>

<div
  bind:this={box}
  class="relative h-full w-full overflow-hidden rounded-xl bg-night-900 shadow-[0_0_0_1px_rgba(199,210,254,.14),0_40px_80px_-30px_rgba(0,0,0,.95)]"
>
  <iframe
    title="Version {right.n}"
    srcdoc={prepare(right.code)}
    sandbox="allow-scripts"
    class="absolute inset-0 h-full w-full bg-[#121212]"
    style="pointer-events: {dragging ? 'none' : 'auto'}"
  ></iframe>
  <iframe
    title="Version {left.n}"
    srcdoc={prepare(left.code)}
    sandbox="allow-scripts"
    class="absolute inset-0 h-full w-full bg-[#121212]"
    style="clip-path: inset(0 {100 - position}% 0 0); pointer-events: {dragging ? 'none' : 'auto'}"
  ></iframe>

  <div class="pointer-events-none absolute inset-y-0 w-px bg-moon-bright" style="left: {position}%"></div>
  <button
    type="button"
    role="slider"
    aria-label="Compare versions"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(position)}
    aria-valuetext="{Math.round(position)}% of v{left.n}"
    onpointerdown={onPointerDown}
    onpointermove={(e) => dragging && setFromPointer(e.clientX)}
    onpointerup={() => (dragging = false)}
    onpointercancel={() => (dragging = false)}
    onkeydown={onKeydown}
    class="absolute top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full bg-moon-bright text-night-900 shadow-[0_0_0_6px_rgba(238,241,255,.15),0_8px_24px_rgba(0,0,0,.6)]"
    style="left: {position}%"
  >
    <ChevronsLeftRight class="h-4 w-4" />
  </button>

  <label class="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-night-950/85 py-1 pl-2 pr-1 font-mono text-[10.5px] text-star-2 backdrop-blur">
    <span class="sr-only">Compare with</span>
    <select
      value={left.n}
      onchange={(e) => onPickLeft(Number((e.target as HTMLSelectElement).value))}
      class="cursor-pointer bg-transparent text-star-2 focus:outline-none"
    >
      {#each versions.filter((v) => v.n !== right.n) as v (v.n)}
        <option value={v.n} class="bg-night-800">v{v.n}</option>
      {/each}
    </select>
  </label>
  <span class="absolute right-3 top-3 z-10 rounded-md bg-night-950/85 px-2 py-1 font-mono text-[10.5px] text-moon-bright backdrop-blur">
    v{right.n}
  </span>
</div>
