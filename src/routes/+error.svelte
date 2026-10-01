<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import NightSky from '$lib/components/night/NightSky.svelte';
  import MoonPhase from '$lib/components/night/MoonPhase.svelte';
  import { themeStore } from '$lib/state/theme.svelte';

  let { error, status }: { error: Error & { message?: string }; status: number } = $props();
</script>

<div class="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night-950 p-6 text-star">
  <NightSky variant="quiet" />
  <div class="glass glass-edge relative max-w-md rounded-[22px] px-8 py-10 text-center">
    <MoonPhase phase="new" size={40} class="mx-auto" />
    <p class="label-mono mt-6">Error {status}</p>
    <h1 class="mt-2 font-serif text-[40px] italic leading-none text-moon-bright">
      {themeStore.theme === 'day' ? 'Lost in the clouds' : 'Lost in the dark'}
    </h1>
    <p class="mt-4 text-[14px] text-star-muted">{error?.message ?? 'An unexpected error occurred.'}</p>
    <Button onclick={() => (window.location.href = '/')} class="mt-8 px-6">Back to {themeStore.theme === 'day' ? 'daylight' : 'the sky'}</Button>
  </div>
</div>
