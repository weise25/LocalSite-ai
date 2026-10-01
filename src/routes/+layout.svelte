<script lang="ts">
  import '../app.css';
  import { Toaster } from 'svelte-sonner';

  let { children } = $props();
</script>

<svelte:head>
  <title>LocalSite AI</title>
  <meta name="description" content="Generate complete websites from a prompt — with local or cloud models." />
</svelte:head>

<Toaster
  position="top-right"
  theme="dark"
  toastOptions={{
    class: 'glass-solid !rounded-[14px] !border-moon/[0.12] !text-star !font-sans'
  }}
/>

{@render children?.()}
