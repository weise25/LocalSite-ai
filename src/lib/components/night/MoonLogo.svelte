<script lang="ts">
  import { themeStore } from '$lib/state/theme.svelte';

  interface Props {
    size?: number;
    class?: string;
  }

  let { size = 24, class: className = '' }: Props = $props();
</script>

{#if themeStore.theme === 'day'}
  <!-- Daylight mark: the same circle, lit from the other side -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" class={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10.5" stroke="rgba(26,34,82,.22)" />
    <circle cx="12" cy="12" r="6.5" fill="#F2B24A" />
    <circle cx="12" cy="12" r="6.5" fill="url(#logo-sun)" />
    <defs>
      <radialGradient id="logo-sun" cx="40%" cy="38%" r="70%">
        <stop offset="0" stop-color="#FFFBEF" />
        <stop offset=".6" stop-color="#FFD98A" stop-opacity=".6" />
        <stop offset="1" stop-color="#F2B24A" stop-opacity="0" />
      </radialGradient>
    </defs>
  </svg>
{:else}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" class={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10.5" stroke="rgba(199,210,254,.25)" />
    <path d="M12 1.5a10.5 10.5 0 0 1 0 21a6.5 10.5 0 0 0 0-21z" fill="#EEF1FF" />
  </svg>
{/if}
