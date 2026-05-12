const AUTH_REQUEST_DELAY_MS = 450;

function delay(timeout) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, timeout);
  });
}

export async function loginWithCredentials(credentials) {
  const username = credentials.username.trim();
  const password = credentials.password.trim();

  await delay(AUTH_REQUEST_DELAY_MS);

  if (!username || !password) {
    throw new Error("Введите логин и пароль.");
  }

  const isModerator = username === "admin" && password === "admin";

  return {
    accessToken: "dev-access-token",
    refreshToken: "dev-refresh-token",
    user: {
      id: isModerator ? "moderator-demo" : "med-worker-demo",
      fullName: isModerator ? "Фамилия Имя Отчество" : "Тестовый медработник",
      login: username,
      role: isModerator ? "moderator" : "doctor",
    },
  };
}
