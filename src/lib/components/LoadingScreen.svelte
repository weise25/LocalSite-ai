<script lang="ts">
  import NightSky from '$lib/components/night/NightSky.svelte';
  import MoonLogo from '$lib/components/night/MoonLogo.svelte';
</script>

<div class="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-night-950" role="status" aria-live="polite">
  <NightSky variant="quiet" />
  <div class="relative motion-safe:animate-moon-breathe">
    <MoonLogo size={56} />
  </div>
  <p class="relative font-serif text-[22px] italic text-star-2">Waiting for the night sky…</p>
</div>
