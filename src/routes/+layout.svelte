<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { Toaster } from 'svelte-sonner';
  import { themeStore } from '$lib/state/theme.svelte';

  let { children } = $props();

  onMount(() => themeStore.start());

  // Daylight by day, Nocturne by night (or whatever the user pinned)
  $effect(() => {
    const theme = themeStore.theme;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'day' ? '#EEF1F7' : '#04060D');
  });
</script>

<svelte:head>
  <title>LocalSite AI</title>
  <meta name="description" content="Generate complete websites from a prompt — with local or cloud models." />
</svelte:head>

<Toaster
  position="top-right"
  theme={themeStore.theme === 'day' ? 'light' : 'dark'}
  toastOptions={{
    class: 'glass-solid !rounded-[14px] !border-moon/[0.12] !text-star !font-sans'
  }}
/>

{@render children?.()}
