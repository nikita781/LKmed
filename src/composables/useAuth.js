import { computed, reactive, toRefs } from "vue";
import { loginWithCredentials } from "../services/authService";

const AUTH_STORAGE_KEY = "lkmed-auth-session";

function restorePersistedSession() {
  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

const state = reactive({
  session: restorePersistedSession(),
  status: "idle",
  errorMessage: "",
});

async function login(credentials) {
  state.status = "loading";
  state.errorMessage = "";

  try {
    const session = await loginWithCredentials(credentials);
    state.session = session;
    persistSession(session);
    state.status = "authenticated";

    return session;
  } catch (error) {
    state.status = "error";
    state.errorMessage = error instanceof Error ? error.message : "Не удалось выполнить вход.";
    throw error;
  }
}

function logout() {
  state.session = null;
  state.status = "idle";
  state.errorMessage = "";
  persistSession(null);
}

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(state.session?.accessToken));
  const user = computed(() => state.session?.user ?? null);
  const role = computed(() => user.value?.role ?? (isAuthenticated.value ? "doctor" : "guest"));

  return {
    ...toRefs(state),
    isAuthenticated,
    role,
    user,
    login,
    logout,
  };
}
