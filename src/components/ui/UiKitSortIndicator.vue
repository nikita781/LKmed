<script setup>
defineProps({
  direction: {
    type: String,
    default: null,
    validator: (value) => value === null || value === "asc" || value === "desc",
  },
});
</script>

<template>
  <svg
    class="ui-kit-sort-indicator"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4.15132 7.33333H11.8493C12.424 7.33333 12.7293 6.65333 12.3473 6.22333L8.49865 1.89333C8.43622 1.82287 8.35955 1.76645 8.27371 1.72782C8.18786 1.68918 8.09479 1.6692 8.00065 1.6692C7.90651 1.6692 7.81344 1.68918 7.72759 1.72782C7.64175 1.76645 7.56508 1.82287 7.50265 1.89333L3.65265 6.22333C3.27065 6.65333 3.57598 7.33333 4.15132 7.33333Z"
      :fill="direction === 'asc' ? 'var(--color-primary)' : '#C0C3C9'"
    />
    <path
      d="M7.50198 14.106C7.56441 14.1765 7.64108 14.2329 7.72693 14.2715C7.81278 14.3101 7.90584 14.3301 7.99998 14.3301C8.09412 14.3301 8.18719 14.3101 8.27304 14.2715C8.35888 14.2329 8.43556 14.1765 8.49798 14.106L12.3467 9.776C12.7293 9.34666 12.424 8.66666 11.8486 8.66666H4.15132C3.57665 8.66666 3.27132 9.34666 3.65332 9.77666L7.50198 14.106Z"
      :fill="direction === 'desc' ? 'var(--color-primary)' : '#C0C3C9'"
    />
  </svg>
</template>

<style scoped>
.ui-kit-sort-indicator {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
}
</style>
