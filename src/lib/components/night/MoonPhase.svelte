<script lang="ts">
  import { cn } from '$lib/utils';

  /**
   * Moon phases are Nocturne's status language:
   * waxing (gold, animated) = generating, full (silver) = version landed,
   * half = in progress but static, new = idle / stopped.
   */
  interface Props {
    phase?: 'waxing' | 'half' | 'full' | 'new';
    size?: number;
    class?: string;
  }

  let { phase = 'full', size = 24, class: className = '' }: Props = $props();
</script>

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
