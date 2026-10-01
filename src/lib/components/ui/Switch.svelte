<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    class?: string;
    ariaLabel?: string;
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    class: className = '',
    ariaLabel = 'Toggle',
    onCheckedChange
  }: Props = $props();

  function toggle() {
    if (disabled) return;
    const next = !checked;
    checked = next;
    onCheckedChange?.(next);
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={ariaLabel}
  {disabled}
  data-state={checked ? 'checked' : 'unchecked'}
  onclick={toggle}
  class={cn(
    'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    checked ? 'bg-moon' : 'bg-moon/15',
    className
  )}
>
  <span
    class={cn(
      'pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform', checked ? 'bg-night-900' : 'bg-star',
      checked ? 'translate-x-4' : 'translate-x-0'
    )}
  ></span>
</button>
