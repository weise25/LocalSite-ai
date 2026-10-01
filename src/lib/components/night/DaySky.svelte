<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    /** 'full' = welcome sky with sun and haze, 'quiet' = soft sky behind the workspace */
    variant?: 'full' | 'quiet';
    sun?: boolean;
    horizon?: boolean;
    class?: string;
  }

  let { variant = 'full', sun = false, horizon = false, class: className = '' }: Props = $props();

  // Soft cumulus made of overlapping radial puffs
  const clouds = $derived(
    variant === 'full'
      ? [
          { left: '6%', top: '18%', w: 340, h: 90, o: 0.75, d: 0 },
          { left: '58%', top: '8%', w: 260, h: 70, o: 0.55, d: -18 },
          { left: '30%', top: '44%', w: 420, h: 110, o: 0.5, d: -36 },
          { left: '74%', top: '52%', w: 300, h: 80, o: 0.6, d: -9 }
        ]
      : [
          { left: '12%', top: '10%', w: 360, h: 90, o: 0.45, d: 0 },
          { left: '64%', top: '64%', w: 420, h: 110, o: 0.35, d: -24 }
        ]
  );
</script>

<div aria-hidden="true" class={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
  <div
    class="absolute inset-0"
    style="background: {variant === 'full'
      ? 'linear-gradient(180deg, #A9C3EC 0%, #C9D9F2 34%, #E7EDF7 64%, #F6EFE6 100%)'
      : 'linear-gradient(180deg, #D3E0F4 0%, #E6ECF7 45%, #EEF1F7 100%)'}"
  ></div>

  {#if sun}
    <!-- Halo, then the disc -->
    <div
      class="absolute right-[2%] top-[20px] h-[220px] w-[220px] rounded-full sm:right-[3%] sm:top-[2%] lg:h-[340px] lg:w-[340px]"
      style="background: radial-gradient(circle, rgba(255,236,190,.75) 0%, rgba(255,226,170,.28) 38%, rgba(255,226,170,0) 70%)"
    ></div>
    <div
      class="absolute right-[calc(2%+70px)] top-[90px] h-20 w-20 rounded-full sm:right-[calc(3%+60px)] sm:top-[calc(2%+60px)] sm:h-[100px] sm:w-[100px] lg:right-[calc(3%+100px)] lg:top-[calc(2%+100px)] lg:h-[140px] lg:w-[140px]"
      style="background: radial-gradient(circle at 42% 40%, #FFFDF6 0%, #FFF0C8 45%, #FFD889 100%); box-shadow: 0 0 60px 18px rgba(255,214,140,.55), 0 0 140px 60px rgba(255,230,180,.35)"
    ></div>
  {/if}

  {#each clouds as c, i (i)}
    <div
      class="absolute motion-safe:animate-drift"
      style="left: {c.left}; top: {c.top}; width: {c.w}px; height: {c.h}px; opacity: {c.o}; animation-delay: {c.d}s; filter: blur(10px); background:
        radial-gradient(40% 60% at 30% 60%, #fff 0%, rgba(255,255,255,0) 70%),
        radial-gradient(35% 70% at 55% 45%, #fff 0%, rgba(255,255,255,0) 70%),
        radial-gradient(40% 55% at 75% 62%, #fff 0%, rgba(255,255,255,0) 70%)"
    ></div>
  {/each}

  {#if horizon}
    <div
      class="absolute left-1/2 h-[2400px] w-[max(2400px,180vw)] -translate-x-1/2 rounded-[50%]"
      style="top: calc(100% - 150px); background: radial-gradient(50% 50% at 50% 50%, #F4F1EC 93%, #FBF8F3 99%, #FFFFFF 100%); box-shadow: 0 -1px 0 rgba(255,255,255,.95), 0 -18px 50px -6px rgba(255,236,205,.8), 0 -90px 180px -30px rgba(255,214,170,.45)"
    ></div>
  {/if}
</div>
