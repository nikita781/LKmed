import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth";
import AdminCategoriesView from "../views/AdminCategoriesView.vue";
import AdminUsersView from "../views/AdminUsersView.vue";
import CabinetHomeView from "../views/CabinetHomeView.vue";
import LoginView from "../views/LoginView.vue";
import ModeratorDocumentRecipientsView from "../views/ModeratorDocumentRecipientsView.vue";
import ModeratorDocumentsView from "../views/ModeratorDocumentsView.vue";
import ReportsView from "../views/ReportsView.vue";

function getDefaultRouteForRole(role) {
  if (role === "admin") {
    return "adminUsers";
  }

  if (role === "moderator") {
    return "moderatorDocuments";
  }

  return "cabinet";
}

const routes = [
  {
    path: "/",
    redirect: () => {
      const { isAuthenticated, role } = useAuth();

      return isAuthenticated.value
        ? { name: getDefaultRouteForRole(role.value) }
        : { name: "login" };
    },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      guestOnly: true,
    },
  },
  {
    path: "/cabinet",
    name: "cabinet",
    component: CabinetHomeView,
    meta: {
      requiresAuth: true,
      roles: ["doctor"],
      section: "documents",
    },
  },
  {
    path: "/moderator/documents",
    name: "moderatorDocuments",
    component: ModeratorDocumentsView,
    meta: {
      requiresAuth: true,
      roles: ["moderator", "admin"],
      section: "documents",
    },
  },
  {
    path: "/moderator/documents/:documentId",
    name: "moderatorDocumentRecipients",
    component: ModeratorDocumentRecipientsView,
    meta: {
      requiresAuth: true,
      roles: ["moderator", "admin"],
      section: "documents",
    },
  },
  {
    path: "/reports",
    name: "reports",
    component: ReportsView,
    meta: {
      requiresAuth: true,
      roles: ["moderator", "admin"],
      section: "reports",
    },
  },
  {
    path: "/admin/users",
    name: "adminUsers",
    component: AdminUsersView,
    meta: {
      requiresAuth: true,
      roles: ["admin"],
      section: "users",
    },
  },
  {
    path: "/admin/categories",
    name: "adminCategories",
    component: AdminCategoriesView,
    meta: {
      requiresAuth: true,
      roles: ["admin"],
      section: "categories",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return {
      top: 0,
    };
  },
});

router.beforeEach((to) => {
  const { isAuthenticated, role } = useAuth();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return {
      name: "login",
    };
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return {
      name: getDefaultRouteForRole(role.value),
    };
  }

  if (to.meta.roles?.length && !to.meta.roles.includes(role.value)) {
    return {
      name: getDefaultRouteForRole(role.value),
    };
  }

  return true;
});

export default router;
