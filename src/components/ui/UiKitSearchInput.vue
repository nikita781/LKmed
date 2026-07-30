<script setup>
import { ref } from "vue";
import UiKitIcon from "./UiKitIcon.vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Поиск",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const inputRef = ref(null);

function onInput(event) {
  emit("update:modelValue", event.target.value);
}

function clear() {
  emit("update:modelValue", "");
  inputRef.value?.focus();
}
</script>

<template>
  <div class="ui-kit-search">
    <input
      ref="inputRef"
      class="ui-kit-search__input"
      :class="{ 'ui-kit-search__input--busy': loading && modelValue }"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      autocomplete="off"
      @input="onInput"
    />

    <span
      v-if="loading"
      class="ui-kit-search__spinner"
      :class="{ 'ui-kit-search__spinner--shifted': modelValue }"
      role="status"
      aria-label="Идёт поиск"
    />

    <button
      v-if="modelValue"
      type="button"
      class="ui-kit-search__clear"
      aria-label="Очистить поиск"
      @click="clear"
    >
      <UiKitIcon name="close" :size="20" />
    </button>
    <UiKitIcon v-else-if="!loading" class="ui-kit-search__icon" name="search" :size="24" />
  </div>
</template>

<style scoped>
.ui-kit-search {
  position: relative;
  width: 100%;
}

.ui-kit-search__input {
  width: 100%;
  height: 42px;
  padding: 10px 47px 10px 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  outline: none;
  transition: border-color 0.15s ease;
}

.ui-kit-search__input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.ui-kit-search__input:hover,
.ui-kit-search__input:focus {
  border-color: var(--color-primary);
}

.ui-kit-search__icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: var(--color-primary);
  transform: translateY(-50%);
  pointer-events: none;
}

.ui-kit-search__clear {
  position: absolute;
  top: 50%;
  right: 9px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: color 0.15s ease;
}

.ui-kit-search__clear:hover {
  color: var(--color-primary-200);
}

.ui-kit-search__input--busy {
  padding-right: 75px;
}

.ui-kit-search__spinner {
  position: absolute;
  top: 50%;
  right: 15px;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  transform: translateY(-50%);
  animation: ui-kit-search-spin 0.7s linear infinite;
  pointer-events: none;
}

.ui-kit-search__spinner--shifted {
  right: 49px;
}

@keyframes ui-kit-search-spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}
</style>
