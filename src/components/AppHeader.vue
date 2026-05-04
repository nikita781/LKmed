<script setup>
import { computed } from "vue";
import UiKitIcon from "./ui/UiKitIcon.vue";

const props = defineProps({
  logoSrc: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: "simple",
  },
  userName: {
    type: String,
    default: "",
  },
  notificationsCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["logout"]);

const resolvedName = computed(() => props.userName.trim() || "Фамилия Имя Отчество");
const nameParts = computed(() => resolvedName.value.split(/\s+/).filter(Boolean));
const profileLineOne = computed(() => nameParts.value[0] ?? "Фамилия");
const profileLineTwo = computed(() => nameParts.value.slice(1).join(" ") || "Имя Отчество");

function handleLogout() {
  emit("logout");
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <img class="app-header__logo" :src="logoSrc" alt="Герб Удмуртии" />
        <p class="app-header__title">Личный кабинет медработника</p>
      </div>

      <div v-if="variant === 'dashboard'" class="app-header__actions">
        <div class="app-header__meta">
          <button class="app-header__bell" type="button" aria-label="Уведомления">
            <UiKitIcon name="bell" :size="24" />
            <span v-if="notificationsCount" class="app-header__badge">
              {{ notificationsCount }}
            </span>
          </button>

          <div class="app-header__profile">
            <div class="app-header__avatar" aria-hidden="true">
              <svg
                class="app-header__avatar-art"
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="20" cy="20" r="20" fill="#D8EAF6" />
                <path d="M12.8 31.2C14.3 26.9 17 24.7 20 24.7C23 24.7 25.7 26.9 27.2 31.2" fill="#A0CBE4" />
                <path d="M13.9 31.2C15.35 27.42 17.67 25.4 20 25.4C22.33 25.4 24.65 27.42 26.1 31.2" fill="#8AB9D6" />
                <path
                  d="M24.6 17.3C24.6 20.07 22.46 22.4 20 22.4C17.54 22.4 15.4 20.07 15.4 17.3C15.4 14.53 17.54 12.2 20 12.2C22.46 12.2 24.6 14.53 24.6 17.3Z"
                  fill="#F2C7A5"
                />
                <path
                  d="M15.9 16.6C16.1 13.45 17.75 11.4 20.05 11.4C22.7 11.4 24.35 13.3 24.35 16.5C23.25 15.8 22.1 15.48 20.9 15.48C19.3 15.48 17.75 15.93 15.9 16.6Z"
                  fill="#9E6A43"
                />
                <circle cx="18.3" cy="17.7" r="0.55" fill="#071229" />
                <circle cx="21.7" cy="17.7" r="0.55" fill="#071229" />
                <path
                  d="M18.7 20.15C19.15 20.52 19.56 20.7 20 20.7C20.44 20.7 20.85 20.52 21.3 20.15"
                  stroke="#BC8A67"
                  stroke-width="0.8"
                  stroke-linecap="round"
                />
              </svg>
            </div>

            <p class="app-header__profile-name">
              <span>{{ profileLineOne }}</span>
              <span>{{ profileLineTwo }}</span>
            </p>
          </div>
        </div>

        <button class="app-header__logout" type="button" aria-label="Выйти" @click="handleLogout">
          <UiKitIcon name="logout" :size="24" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 10;
  background: var(--color-surface);
  box-shadow: var(--header-shadow);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1440px;
  min-height: var(--header-height);
  margin: 0 auto;
  padding: 16px 32px;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.app-header__logo {
  width: 39px;
  height: 40px;
  object-fit: contain;
  flex: none;
}

.app-header__title {
  margin: 0;
  color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24px;
  text-transform: uppercase;
  white-space: nowrap;
}

.app-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 60px;
}

.app-header__meta {
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-header__bell,
.app-header__logout {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
}

.app-header__badge {
  position: absolute;
  top: 2px;
  right: 0px;
  min-width: 11px;
  height: 11px;
  padding: 0 1px;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-surface);
  font-family: var(--font-family-caption);
  font-size: 10px;
  font-weight: 400;
  line-height: 11px;
  letter-spacing: 0.2px;
  text-align: center;
}

.app-header__profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-header__avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  flex: none;
}

.app-header__avatar-art {
  display: block;
  width: 100%;
  height: 100%;
}

.app-header__profile-name {
  margin: 0;
  color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  letter-spacing: 0.24px;
}

.app-header__profile-name span {
  display: block;
}

@media (max-width: 959px) {
  .app-header__inner {
    padding-inline: 20px;
  }

  .app-header__actions {
    gap: 24px;
  }
}

@media (max-width: 639px) {
  .app-header__inner {
    padding: 14px 16px;
  }

  .app-header__logo {
    width: 34px;
    height: 35px;
  }

  .app-header__title {
    line-height: 1.2;
    white-space: normal;
  }

  .app-header__actions {
    gap: 14px;
  }

  .app-header__meta {
    gap: 14px;
  }

  .app-header__profile-name {
    display: none;
  }
}
</style>
