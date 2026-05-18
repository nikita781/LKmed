import { computed, reactive, toRefs } from "vue";
import { loginWithCredentials, logoutWithToken } from "../services/authService";
import { readStoredSession, writeStoredSession } from "../services/authSession";

const state = reactive({
  session: readStoredSession(),
  status: "idle",
  errorMessage: "",
});

async function login(credentials) {
  state.status = "loading";
  state.errorMessage = "";

  try {
    const session = await loginWithCredentials(credentials);
    state.session = session;
    writeStoredSession(session);
    state.status = "authenticated";

    return session;
  } catch (error) {
    state.status = "error";
    state.errorMessage = error instanceof Error ? error.message : "Не удалось выполнить вход.";
    throw error;
  }
}

async function logout() {
  const accessToken = state.session?.accessToken;

  state.session = null;
  state.status = "idle";
  state.errorMessage = "";
  writeStoredSession(null);

  try {
    await logoutWithToken(accessToken);
  } catch (error) {
    console.error("[Auth logout error]", error);
  }
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
