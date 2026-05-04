<script setup>
import UiKitTextField from "./ui/UiKitTextField.vue";

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
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <UiKitTextField
    :model-value="props.modelValue"
    :label="props.label"
    :name="props.name"
    :type="props.type"
    :placeholder="props.placeholder"
    :autocomplete="props.autocomplete"
    :required="props.required"
    :state="props.state"
    :hint="props.hint"
    @update:modelValue="emit('update:modelValue', $event)"
  />
</template>
