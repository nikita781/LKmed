<script setup>
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import AuthCard from "../components/AuthCard.vue";
import { udmurtiaEmblemSrc } from "../assets/designAssets";
import { useAuth } from "../composables/useAuth";
import AuthLayout from "../layouts/AuthLayout.vue";

const router = useRouter();
const { errorMessage, login, status } = useAuth();

const credentials = reactive({
  username: "",
  password: "",
});

const isSubmitting = computed(() => status.value === "loading");
const canSubmit = computed(
  () => credentials.username.trim().length > 0 && credentials.password.trim().length > 0,
);

watch(
  () => [credentials.username, credentials.password],
  () => {
    if (errorMessage.value) {
      errorMessage.value = "";
    }
  },
);

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) {
    return;
  }

  try {
    await login(credentials);
    await router.push({
      name: "cabinet",
    });
  } catch {
    // Error state is already stored in the auth composable.
  }
}
</script>

<template>
  <AuthLayout>
    <AuthCard
      :logo-src="udmurtiaEmblemSrc"
      :username="credentials.username"
      :password="credentials.password"
      :loading="isSubmitting"
      :can-submit="canSubmit"
      :error-message="errorMessage"
      @submit="handleSubmit"
      @update:username="credentials.username = $event"
      @update:password="credentials.password = $event"
    />
  </AuthLayout>
</template>
