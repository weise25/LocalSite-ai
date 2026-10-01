<script lang="ts">
  import { cn } from '$lib/utils';
  import { themeStore } from '$lib/state/theme.svelte';

  /**
   * Celestial status language.
   * Night: waxing (gold, animated) = generating, full (silver) = version landed,
   * half = stopped, new = idle. Daylight shows the sun instead: turning rays
   * while generating, a full sun when landed, a setting sun when stopped.
   */
  interface Props {
    phase?: 'waxing' | 'half' | 'full' | 'new';
    size?: number;
    class?: string;
  }

  let { phase = 'full', size = 24, class: className = '' }: Props = $props();

  const day = $derived(themeStore.theme === 'day');
  const disc = 'radial-gradient(circle at 40% 38%, #FFFBEF 0%, #FFE2A0 50%, #F2B24A 100%)';
</script>

{#if day}
  <span
    aria-hidden="true"
    class={cn('relative inline-flex shrink-0 items-center justify-center', className)}
    style="width: {size}px; height: {size}px"
  >
    {#if phase === 'waxing'}
      <span
        class="absolute inset-0 rounded-full motion-safe:animate-spin-slow"
        style="background: repeating-conic-gradient(from 0deg, #E9A23B 0deg 10deg, transparent 10deg 30deg); mask: radial-gradient(circle, transparent 55%, #000 57%, #000 70%, transparent 72%); -webkit-mask: radial-gradient(circle, transparent 55%, #000 57%, #000 70%, transparent 72%)"
      ></span>
      <span class="rounded-full" style="width: {size * 0.5}px; height: {size * 0.5}px; background: {disc}"></span>
    {:else if phase === 'full'}
      <span
        class="rounded-full"
        style="width: {size * 0.82}px; height: {size * 0.82}px; background: {disc}; box-shadow: 0 0 {size * 0.5}px rgba(242,178,74,.45)"
      ></span>
    {:else if phase === 'half'}
      <span
        class="rounded-full"
        style="width: {size * 0.82}px; height: {size * 0.82}px; background: {disc}; clip-path: inset(0 0 48% 0); transform: translateY(18%)"
      ></span>
      <span class="absolute inset-x-0 h-px bg-star-dim/60" style="top: {size * 0.6}px"></span>
    {:else}
      <span class="rounded-full ring-1 ring-inset ring-star-dim/50" style="width: {size * 0.82}px; height: {size * 0.82}px"></span>
    {/if}
  </span>
{:else}
  <span
    aria-hidden="true"
    class={cn('relative inline-block shrink-0 overflow-hidden rounded-full', className)}
    style="width: {size}px; height: {size}px; {phase === 'full'
      ? 'background: radial-gradient(circle at 38% 35%, #FFFFFF, #D5DCF5 55%, #9AA6CF); box-shadow: 0 0 14px rgba(199,210,254,.5)'
      : phase === 'new'
        ? 'box-shadow: inset 0 0 0 1px rgba(199,210,254,.35)'
        : 'background: #F2D48A; box-shadow: 0 0 14px rgba(242,212,138,.45)'}"
  >
    {#if phase === 'waxing'}
      <span
        class="absolute -top-px left-0 rounded-full bg-[#0A0E1C] motion-safe:animate-wax"
        style="width: {size}px; height: {size + 2}px; transform: translateX(45%)"
      ></span>
    {:else if phase === 'half'}
      <span
        class="absolute -top-px left-0 rounded-full bg-[#0A0E1C]"
        style="width: {size}px; height: {size + 2}px; transform: translateX(-50%)"
      ></span>
    {/if}
  </span>
{/if}
