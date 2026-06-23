<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import UiKitIcon from "./UiKitIcon.vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  selectedLabel: {
    type: String,
    default: "",
  },
  fetcher: {
    type: Function,
    required: true,
  },
  placeholder: {
    type: String,
    default: "Выберите",
  },
  searchPlaceholder: {
    type: String,
    default: "Поиск",
  },
  emptyText: {
    type: String,
    default: "Не найдено",
  },
  loadingText: {
    type: String,
    default: "Загрузка…",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  hasError: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "update:selectedLabel", "change"]);

const isOpen = ref(false);
const search = ref("");
const results = ref([]);
const isLoading = ref(false);
const localLabel = ref("");
const rootRef = ref(null);
const searchInput = ref(null);

let searchTimer = null;
let requestId = 0;

const displayLabel = computed(
  () => props.selectedLabel || localLabel.value || props.placeholder,
);
const isPlaceholder = computed(
  () => !props.modelValue && !props.selectedLabel && !localLabel.value,
);

async function loadOptions() {
  const currentRequestId = ++requestId;
  isLoading.value = true;

  try {
    const items = await props.fetcher(search.value.trim());

    if (currentRequestId === requestId) {
      results.value = Array.isArray(items) ? items : [];
    }
  } catch {
    if (currentRequestId === requestId) {
      results.value = [];
    }
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false;
    }
  }
}

function toggleMenu() {
  if (props.disabled) {
    return;
  }

  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    if (!results.value.length || !search.value) {
      loadOptions();
    }

    nextTick(() => searchInput.value?.focus());
  }
}

function selectOption(option) {
  emit("update:modelValue", option.id);
  emit("update:selectedLabel", option.label);
  emit("change", option);
  localLabel.value = option.label;
  isOpen.value = false;
  search.value = "";
}

function handleOutside(event) {
  if (isOpen.value && rootRef.value && !rootRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

watch(search, () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(loadOptions, 300);
});

onMounted(() => {
  document.addEventListener("click", handleOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleOutside);
  window.clearTimeout(searchTimer);
});
</script>

<template>
  <div ref="rootRef" class="ui-kit-search-select">
    <button
      type="button"
      class="ui-kit-search-select__control"
      :class="{
        'ui-kit-search-select__control--placeholder': isPlaceholder,
        'ui-kit-search-select__control--error': hasError,
      }"
      :disabled="disabled"
      @click="toggleMenu"
    >
      <span class="ui-kit-search-select__value">{{ displayLabel }}</span>
      <UiKitIcon class="ui-kit-search-select__chevron" name="chevron-down" :size="20" />
    </button>

    <div v-if="isOpen" class="ui-kit-search-select__menu">
      <div class="ui-kit-search-select__search">
        <input
          ref="searchInput"
          v-model="search"
          class="ui-kit-search-select__input"
          type="text"
          :placeholder="searchPlaceholder"
          autocomplete="off"
        />
        <UiKitIcon class="ui-kit-search-select__search-icon" name="search" :size="20" />
      </div>

      <ul class="ui-kit-search-select__list">
        <li
          v-for="option in results"
          :key="option.id"
          class="ui-kit-search-select__option"
          :class="{ 'ui-kit-search-select__option--active': option.id === modelValue }"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </li>

        <li v-if="isLoading" class="ui-kit-search-select__message">{{ loadingText }}</li>
        <li v-else-if="!results.length" class="ui-kit-search-select__message">{{ emptyText }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.ui-kit-search-select {
  position: relative;
  width: 100%;
}

.ui-kit-search-select__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 10px 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.ui-kit-search-select__control:hover:not(:disabled),
.ui-kit-search-select__control:focus:not(:disabled) {
  border-color: var(--color-primary);
}

.ui-kit-search-select__control--placeholder {
  color: var(--color-text-muted);
}

.ui-kit-search-select__control--error {
  border-color: #e63f3f;
}

.ui-kit-search-select__control:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.ui-kit-search-select__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-kit-search-select__chevron {
  flex: none;
  color: var(--color-text-muted);
}

.ui-kit-search-select__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 30;
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: 0 12px 30px rgb(10 31 68 / 14%);
}

.ui-kit-search-select__search {
  position: relative;
  margin-bottom: 8px;
}

.ui-kit-search-select__input {
  width: 100%;
  height: 38px;
  padding: 8px 40px 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 20px;
  outline: none;
  transition: border-color 0.15s ease;
}

.ui-kit-search-select__input:focus {
  border-color: var(--color-primary);
}

.ui-kit-search-select__input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.ui-kit-search-select__search-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  color: var(--color-primary);
  transform: translateY(-50%);
  pointer-events: none;
}

.ui-kit-search-select__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 240px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.ui-kit-search-select__option {
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 18px;
  cursor: pointer;
}

.ui-kit-search-select__option:hover {
  background: var(--color-secondary);
}

.ui-kit-search-select__option--active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.ui-kit-search-select__message {
  padding: 10px 12px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 18px;
  list-style: none;
}
</style>
