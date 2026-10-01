<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }

  let { size = 24, class: className = '' }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class={className} aria-hidden="true">
  <circle cx="12" cy="12" r="10.5" stroke="rgba(199,210,254,.25)" />
  <path d="M12 1.5a10.5 10.5 0 0 1 0 21a6.5 10.5 0 0 0 0-21z" fill="#EEF1FF" />
</svg>
