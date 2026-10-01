<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  // Unique ids so several moons can coexist in one document
  const uid = $props.id();
</script>

<svg viewBox="0 0 220 220" class={className} style="overflow: visible" aria-hidden="true">
  <defs>
    <radialGradient id="{uid}-lit" cx="62%" cy="40%" r="70%">
      <stop offset="0" stop-color="#FAFBFF" />
      <stop offset=".55" stop-color="#D5DCF5" />
      <stop offset="1" stop-color="#8F9BC6" />
    </radialGradient>
    <mask id="{uid}-cres" maskUnits="userSpaceOnUse" x="-110" y="-110" width="440" height="440">
      <rect x="-110" y="-110" width="440" height="440" fill="white" />
      <circle cx="84" cy="96" r="66" fill="black" />
    </mask>
    <filter id="{uid}-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
  </defs>
  <!-- Earthshine: the faintly visible night side -->
  <circle cx="110" cy="110" r="66" fill="#141B36" opacity=".55" />
  <circle cx="110" cy="110" r="66" fill="#B9C5F5" opacity=".55" filter="url(#{uid}-glow)" mask="url(#{uid}-cres)" />
  <circle cx="110" cy="110" r="66" fill="url(#{uid}-lit)" mask="url(#{uid}-cres)" />
  <circle cx="150" cy="128" r="6" fill="#9AA6CF" opacity=".35" mask="url(#{uid}-cres)" />
  <circle cx="164" cy="98" r="4" fill="#9AA6CF" opacity=".3" mask="url(#{uid}-cres)" />
  <circle cx="140" cy="76" r="3" fill="#9AA6CF" opacity=".25" mask="url(#{uid}-cres)" />
</svg>
