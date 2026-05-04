<script setup>
import UiKitIcon from "./UiKitIcon.vue";

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeKey: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select"]);

function handleSelect(item) {
  if (item?.disabled) {
    return;
  }

  emit("select", item);
}
</script>

<template>
  <aside class="ui-kit-sidebar-menu">
    <nav class="ui-kit-sidebar-menu__nav" aria-label="Разделы кабинета">
      <button
        v-for="item in items"
        :key="item.key"
        class="ui-kit-sidebar-menu__item"
        :class="{
          'ui-kit-sidebar-menu__item--active': item.key === activeKey,
          'ui-kit-sidebar-menu__item--disabled': item.disabled,
        }"
        type="button"
        @click="handleSelect(item)"
      >
        <UiKitIcon class="ui-kit-sidebar-menu__icon" :name="item.icon" :size="22" />
        <span class="ui-kit-sidebar-menu__label">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.ui-kit-sidebar-menu {
  width: 248px;
  min-height: calc(100vh - var(--header-height));
  padding: 30px 20px 20px 32px;
  background: var(--color-surface);
  box-shadow: var(--menu-shadow);
}

.ui-kit-sidebar-menu__nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ui-kit-sidebar-menu__item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 46px;
  padding: 12px 24px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-primary);
  text-align: left;
  cursor: pointer;
}

.ui-kit-sidebar-menu__item--active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.ui-kit-sidebar-menu__item--disabled {
  opacity: 0.72;
}

.ui-kit-sidebar-menu__icon {
  flex: none;
}

.ui-kit-sidebar-menu__label {
  white-space: nowrap;
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 400;
  line-height: 22px;
  letter-spacing: 0.32px;
}

@media (max-width: 1023px) {
  .ui-kit-sidebar-menu {
    width: 100%;
    min-height: auto;
    padding: 20px 20px 0;
    background: transparent;
    box-shadow: none;
  }

  .ui-kit-sidebar-menu__nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .ui-kit-sidebar-menu__item {
    width: auto;
  }
}

@media (max-width: 639px) {
  .ui-kit-sidebar-menu {
    padding: 16px 16px 0;
  }

  .ui-kit-sidebar-menu__nav {
    gap: 10px;
  }

  .ui-kit-sidebar-menu__item {
    flex: 1 1 100%;
  }
}
</style>
