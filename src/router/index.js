import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth";
import CabinetHomeView from "../views/CabinetHomeView.vue";
import LoginView from "../views/LoginView.vue";

const routes = [
  {
    path: "/",
    redirect: () => (useAuth().isAuthenticated.value ? "/cabinet" : "/login"),
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
  const { isAuthenticated } = useAuth();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return {
      name: "login",
    };
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return {
      name: "cabinet",
    };
  }

  return true;
});

export default router;
