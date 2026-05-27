<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { udmurtiaEmblemSrc } from "../assets/designAssets";
import AppHeader from "../components/AppHeader.vue";
import UiKitSidebarMenu from "../components/ui/UiKitSidebarMenu.vue";
import { useAuth } from "../composables/useAuth";

const route = useRoute();
const router = useRouter();
const { logout, role, user } = useAuth();

const menuItems = computed(() => {
  const adminItems =
    role.value === "admin"
      ? [
          { key: "users", label: "Пользователи", icon: "users" },
          { key: "categories", label: "Категории", icon: "category" },
        ]
      : [];

  const reportsItem =
    role.value === "admin" || role.value === "moderator"
      ? [{ key: "reports", label: "Отчеты", icon: "report" }]
      : [];

  return [
    ...adminItems,
    { key: "documents", label: "Документы", icon: "clipboard" },
    ...reportsItem,
  ];
});
const activeMenuKey = computed(() => route.meta.section ?? "documents");
const documentsRouteName = computed(() =>
  role.value === "doctor" ? "cabinet" : "moderatorDocuments",
);

async function handleLogout() {
  await logout();
  await router.push({
    name: "login",
  });
}

function handleMenuSelect(item) {
  const routeByKey = {
    documents: documentsRouteName.value,
    reports: "reports",
    users: "adminUsers",
    categories: "adminCategories",
  };
  const target = routeByKey[item?.key];

  if (target) {
    router.push({ name: target });
  }
}
</script>

<template>
  <div class="app-layout">
    <AppHeader
      variant="dashboard"
      :logo-src="udmurtiaEmblemSrc"
      :user-name="user?.fullName || ''"
      :notifications-count="3"
      @logout="handleLogout"
    />

    <div class="app-layout__body">
      <UiKitSidebarMenu
        class="app-layout__sidebar"
        :items="menuItems"
        :active-key="activeMenuKey"
        @select="handleMenuSelect"
      />

      <main class="app-layout__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.app-layout__body {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

.app-layout__content {
  min-width: 0;
  padding: 30px 32px;
}

@media (max-width: 1023px) {
  .app-layout__body {
    grid-template-columns: 1fr;
  }

  .app-layout__content {
    padding-top: 24px;
  }
}

@media (max-width: 639px) {
  .app-layout__content {
    padding: 24px 16px 32px;
  }
}
</style>
