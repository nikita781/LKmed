<script setup>
import { computed } from "vue";
import UiKitButton from "./ui/UiKitButton.vue";
import UiKitSurfaceCard from "./ui/UiKitSurfaceCard.vue";
import UiKitTextField from "./ui/UiKitTextField.vue";

const props = defineProps({
  logoSrc: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  canSubmit: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["submit", "update:username", "update:password"]);

const usernameModel = computed({
  get: () => props.username,
  set: (value) => emit("update:username", value),
});

const passwordModel = computed({
  get: () => props.password,
  set: (value) => emit("update:password", value),
});

function handleSubmit() {
  emit("submit");
}
</script>

<template>
  <UiKitSurfaceCard
    class="auth-card"
    padding="30px 26px"
    radius="20px"
    shadow="none"
    aria-labelledby="auth-title"
  >
    <img class="auth-card__logo" :src="logoSrc" alt="Герб Удмуртии" />

    <h1 id="auth-title" class="auth-card__title">Личный кабинет медработника</h1>

    <form class="auth-card__form" @submit.prevent="handleSubmit">
      <div class="auth-card__inputs">
        <UiKitTextField
          v-model="usernameModel"
          label="Логин"
          placeholder="Введите табельный номер"
          autocomplete="username"
          name="username"
        />

        <UiKitTextField
          v-model="passwordModel"
          label="Пароль"
          placeholder="Введите пароль"
          type="password"
          autocomplete="current-password"
          name="password"
          :state="errorMessage ? 'error' : 'default'"
          :hint="errorMessage"
        />
      </div>

      <UiKitButton :disabled="loading || !canSubmit" type="submit">
        {{ loading ? "Вход..." : "Войти" }}
      </UiKitButton>
    </form>
  </UiKitSurfaceCard>
</template>

<style scoped>
.auth-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  width: 100%;
  max-width: 694px;
  min-height: 518px;
}

.auth-card__logo {
  width: 135px;
  height: 138px;
  object-fit: contain;
  flex: none;
}

.auth-card__title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 25px;
  letter-spacing: 0.4px;
  text-align: center;
  text-transform: uppercase;
}

.auth-card__form {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}

.auth-card__inputs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

@media (max-width: 639px) {
  .auth-card {
    min-height: auto;
    gap: 24px;
  }

  .auth-card__logo {
    width: 110px;
    height: 112px;
  }

  .auth-card__title {
    font-size: 18px;
    line-height: 23px;
    letter-spacing: 0.3px;
  }

  .auth-card__form {
    gap: 24px;
  }

  .auth-card__inputs {
    gap: 16px;
  }
}
</style>
