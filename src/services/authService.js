import { apiClient } from "./apiClient";

const TOKEN_FIELDS = ["token", "access_token", "accessToken"];
const MODERATOR_ROLE_IDS = new Set([1, 2, "1", "2"]);
const DOCTOR_ROLE_IDS = new Set([3, "3"]);

function getPayloadData(payload) {
  return payload?.data && typeof payload.data === "object" ? payload.data : payload;
}

function getTokenFromPayload(payload) {
  const data = getPayloadData(payload);

  return TOKEN_FIELDS.map((field) => data?.[field]).find(Boolean) ?? "";
}

function getRoleTitle(user) {
  if (typeof user?.role === "string") {
    return user.role;
  }

  return user?.role?.title ?? user?.role_title ?? user?.roleTitle ?? "";
}

function resolveAppRole(user, login) {
  const roleTitle = getRoleTitle(user).toString().toLowerCase();
  const roleId = user?.role_id ?? user?.roleId;
  const normalizedLogin = login.toString().trim().toLowerCase();

  if (
    roleTitle.includes("администратор") ||
    roleTitle.includes("менеджер") ||
    roleTitle.includes("admin") ||
    roleTitle.includes("manager") ||
    roleTitle.includes("moderator") ||
    MODERATOR_ROLE_IDS.has(roleId)
  ) {
    return "moderator";
  }

  if (roleTitle.includes("сотрудник") || roleTitle.includes("doctor") || DOCTOR_ROLE_IDS.has(roleId)) {
    return "doctor";
  }

  if (normalizedLogin === "admin" || normalizedLogin.startsWith("adm")) {
    return "moderator";
  }

  return "doctor";
}

function normalizeUser(apiUser, login) {
  const user = getPayloadData(apiUser) ?? {};
  const normalizedLogin = user.employee_number ?? user.login ?? login;

  return {
    id: user.id?.toString() ?? normalizedLogin,
    fullName: user.name ?? user.fullName ?? "Фамилия Имя Отчество",
    login: normalizedLogin,
    post: user.post ?? "",
    role: resolveAppRole(user, normalizedLogin),
    roleId: user.role_id ?? user.roleId ?? null,
    roleTitle: getRoleTitle(user),
  };
}

export async function loginWithCredentials(credentials) {
  const login = credentials.username.trim();
  const password = credentials.password.trim();

  if (!login || !password) {
    throw new Error("Введите логин и пароль.");
  }

  const loginResponse = await apiClient("/login", {
    method: "POST",
    skipAuth: true,
    body: {
      login,
      password,
    },
  });
  const accessToken = getTokenFromPayload(loginResponse);

  if (!accessToken) {
    throw new Error("Сервер не вернул токен авторизации.");
  }

  const currentUser = await apiClient("/user", {
    skipAuth: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    accessToken,
    tokenType: "Bearer",
    user: normalizeUser(currentUser, login),
  };
}

export async function logoutWithToken(accessToken) {
  if (!accessToken) {
    return;
  }

  await apiClient("/logout", {
    method: "POST",
    skipAuth: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
