import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth";
import CabinetHomeView from "../views/CabinetHomeView.vue";
import LoginView from "../views/LoginView.vue";
import ModeratorDocumentRecipientsView from "../views/ModeratorDocumentRecipientsView.vue";
import ModeratorDocumentsView from "../views/ModeratorDocumentsView.vue";

function getDefaultRouteForRole(role) {
  return role === "moderator" ? "moderatorDocuments" : "cabinet";
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
      roles: ["moderator"],
      section: "documents",
    },
  },
  {
    path: "/moderator/documents/:documentId",
    name: "moderatorDocumentRecipients",
    component: ModeratorDocumentRecipientsView,
    meta: {
      requiresAuth: true,
      roles: ["moderator"],
      section: "documents",
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
