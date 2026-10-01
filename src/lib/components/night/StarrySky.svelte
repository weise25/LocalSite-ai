<script lang="ts">
  import { onMount } from 'svelte';
  import { cn } from '$lib/utils';
  import Moon from './Moon.svelte';

  interface Props {
    /** 'full' = welcome sky with Milky Way, 'quiet' = sparse sky behind the workspace */
    variant?: 'full' | 'quiet';
    moon?: boolean;
    horizon?: boolean;
    seed?: number;
    class?: string;
  }

  let { variant = 'full', moon = false, horizon = false, seed = 42, class: className = '' }: Props = $props();


  interface Star {
    x: number; // 0..1 of width
    y: number; // 0..1 of height
    r: number;
    a: number;
    tint: string;
  }

  // Deterministic PRNG so the sky looks the same on every visit
  function mulberry32(a: number) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const TINTS = ['255,255,255', '220,227,255', '255,241,220', '216,243,255'];

  function buildStars(): { field: Star[]; band: Star[]; bright: { x: number; y: number; delay: number }[] } {
    const rnd = mulberry32(seed);
    const full = variant === 'full';
    const field: Star[] = [];
    const band: Star[] = [];

    const fieldCount = full ? 260 : 120;
    for (let i = 0; i < fieldCount; i++) {
      const big = rnd() > 0.93;
      field.push({
        x: rnd(),
        y: rnd() * (full ? 0.82 : 1),
        r: big ? 1.1 : 0.6,
        a: big ? 0.55 + rnd() * 0.35 : 0.12 + rnd() * 0.45,
        tint: TINTS[Math.floor(rnd() * TINTS.length)]
      });
    }

    if (full) {
      // Milky Way: dense faint dust along a diagonal with a gaussian spread
      for (let i = 0; i < 520; i++) {
        const t = rnd();
        const g = (rnd() + rnd() + rnd() - 1.5) * 0.11;
        band.push({
          x: t,
          y: 0.52 - t * 0.42 + g,
          r: rnd() > 0.96 ? 0.9 : 0.5,
          a: 0.06 + rnd() * 0.32,
          tint: TINTS[1]
        });
      }
    }

    const bright = Array.from({ length: full ? 9 : 4 }, () => ({
      x: rnd() * 100,
      y: rnd() * (full ? 62 : 90),
      delay: rnd() * 4
    }));

    return { field, band, bright };
  }

  const sky = $derived(buildStars());

  let canvas = $state<HTMLCanvasElement>();
  let host = $state<HTMLDivElement>();

  function draw() {
    if (!canvas || !host) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (sky.band.length) {
      // Soft glow under the Milky Way dust
      ctx.save();
      ctx.translate(w * 0.5, h * 0.31);
      ctx.rotate(-Math.atan2(h * 0.42, w));
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.55);
      glow.addColorStop(0, 'rgba(150,165,235,0.09)');
      glow.addColorStop(1, 'rgba(150,165,235,0)');
      ctx.scale(1, 0.22);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const s of [...sky.band, ...sky.field]) {
      ctx.fillStyle = `rgba(${s.tint},${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  onMount(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    if (host) ro.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  });
</script>

<div
  bind:this={host}
  aria-hidden="true"
  class={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
>
  <div
    class="absolute inset-0"
    style="background: {variant === 'full'
      ? 'radial-gradient(120% 80% at 50% 110%, #101935 0%, #070A16 45%, #04060D 100%)'
      : 'radial-gradient(90% 70% at 70% -10%, #0F1736 0%, #070A16 50%, #04060D 100%)'}"
  ></div>
  <canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>

  {#each sky.bright as b, i (i)}
    <span
      class="absolute h-[3px] w-[3px] rounded-full bg-white motion-safe:animate-twinkle"
      style="left: {b.x}%; top: {b.y}%; animation-delay: {b.delay}s; box-shadow: 0 0 6px 1px rgba(220,228,255,.85)"
    ></span>
  {/each}

  {#if moon}
    <Moon class="absolute right-[3%] top-[52px] h-[96px] w-[96px] sm:right-[4%] sm:top-[6%] sm:h-[170px] sm:w-[170px] lg:h-[220px] lg:w-[220px]" />
  {/if}

  {#if horizon}
    <div
      class="absolute left-1/2 h-[2400px] w-[max(2400px,180vw)] -translate-x-1/2 rounded-[50%]"
      style="top: calc(100% - 150px); background: radial-gradient(50% 50% at 50% 50%, #070A16 92%, #0F1838 99%, #2A3A78 100%); box-shadow: 0 -1px 0 rgba(226,232,255,.5), 0 -18px 50px -6px rgba(130,150,240,.32), 0 -90px 180px -30px rgba(90,110,220,.26)"
    ></div>
  {/if}
</div>
