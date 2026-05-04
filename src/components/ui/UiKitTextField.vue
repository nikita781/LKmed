<script setup>
import { computed, ref, useAttrs } from "vue";
import UiKitIcon from "./UiKitIcon.vue";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  placeholder: {
    type: String,
    default: "",
  },
  autocomplete: {
    type: String,
    default: "off",
  },
  required: {
    type: Boolean,
    default: true,
  },
  state: {
    type: String,
    default: "default",
  },
  hint: {
    type: String,
    default: "",
  },
  leadingIcon: {
    type: String,
    default: "",
  },
  trailingIcon: {
    type: String,
    default: "",
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);
const attrs = useAttrs();
const isFocused = ref(false);

const normalizedState = computed(() => {
  if (props.state === "error") {
    return "error";
  }

  if (props.state === "files") {
    return "files";
  }

  if (props.state === "calendar") {
    return "calendar";
  }

  if (isFocused.value) {
    return "active";
  }

  if (props.state === "filled" || props.state === "data-entered") {
    return "filled";
  }

  return "default";
});

const hasLeadingIcon = computed(() => Boolean(props.leadingIcon));
const hasTrailingIcon = computed(() => Boolean(props.trailingIcon));

function handleFocus() {
  isFocused.value = true;
}

function handleBlur() {
  isFocused.value = false;
}

function onInput(event) {
  emit("update:modelValue", event.target.value);
}
</script>

<template>
  <label class="ui-kit-field">
    <span class="ui-kit-field__label">
      <span>{{ label }}</span>
      <span v-if="required" class="ui-kit-field__required" aria-hidden="true">*</span>
    </span>

    <span class="ui-kit-field__body" :class="{ 'ui-kit-field__body--with-hint': hint }">
      <span class="ui-kit-field__control" :class="`ui-kit-field__control--${normalizedState}`">
        <UiKitIcon
          v-if="hasLeadingIcon"
          class="ui-kit-field__icon ui-kit-field__icon--leading"
          :name="leadingIcon"
          :size="20"
        />

        <input
          class="ui-kit-field__input"
          :class="[
            `ui-kit-field__input--${normalizedState}`,
            {
              'ui-kit-field__input--with-leading-icon': hasLeadingIcon,
              'ui-kit-field__input--with-trailing-icon': hasTrailingIcon,
            },
          ]"
          :name="name"
          :type="type"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :required="required"
          :readonly="readonly"
          :value="modelValue"
          v-bind="attrs"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="onInput"
        />

        <UiKitIcon
          v-if="hasTrailingIcon"
          class="ui-kit-field__icon ui-kit-field__icon--trailing"
          :name="trailingIcon"
          :size="20"
        />
      </span>

      <span v-if="hint" class="ui-kit-field__hint">{{ hint }}</span>
    </span>
  </label>
</template>

<style scoped>
.ui-kit-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.ui-kit-field__body {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.ui-kit-field__body--with-hint {
  gap: 2px;
}

.ui-kit-field__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 5px;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.ui-kit-field__required {
  color: var(--color-accent);
}

.ui-kit-field__control {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  width: 100%;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.ui-kit-field__control--active {
  border-color: var(--color-primary);
}

.ui-kit-field__control--error {
  border-color: var(--color-accent);
}

.ui-kit-field__control--files {
  border-style: dashed;
  border-color: var(--color-primary);
  background: var(--color-secondary);
}

.ui-kit-field__icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

.ui-kit-field__icon--leading {
  left: 15px;
}

.ui-kit-field__icon--trailing {
  right: 15px;
}

.ui-kit-field__input {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  height: 40px;
  padding: 10px 15px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  caret-color: var(--color-primary);
  outline: none;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.ui-kit-field__input--with-leading-icon {
  padding-left: 45px;
}

.ui-kit-field__input--with-trailing-icon {
  padding-right: 45px;
}

.ui-kit-field__input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.ui-kit-field__input--active,
.ui-kit-field__input--filled {
  color: var(--color-primary);
}

.ui-kit-field__input--error,
.ui-kit-field__input--error::placeholder {
  color: var(--color-accent);
  caret-color: var(--color-accent);
}

.ui-kit-field__input--files {
  background: transparent;
  color: var(--color-primary);
  text-align: center;
}

.ui-kit-field__input--calendar {
  background: transparent;
}

.ui-kit-field__hint {
  padding-left: 5px;
  color: var(--color-accent);
  font-family: var(--font-family-caption);
  font-size: 10px;
  font-weight: 400;
  line-height: 10px;
  letter-spacing: 0.2px;
}

.ui-kit-field__input::-ms-clear,
.ui-kit-field__input::-ms-reveal {
  display: none;
}

.ui-kit-field__input::-webkit-search-decoration,
.ui-kit-field__input::-webkit-search-cancel-button,
.ui-kit-field__input::-webkit-search-results-button,
.ui-kit-field__input::-webkit-search-results-decoration,
.ui-kit-field__input::-webkit-credentials-auto-fill-button {
  display: none;
}
</style>
