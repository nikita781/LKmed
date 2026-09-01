import { getStoredAccessToken } from "./authSession";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const DEFAULT_API_ERROR_MESSAGE = "Не удалось выполнить действие. Попробуйте позже.";

const VALIDATION_MESSAGE_MAP = [
  {
    pattern: /document id field is required when document file is not present/i,
    message: "Выберите документ из базы или загрузите файл.",
  },
  {
    pattern: /document file failed to upload|failed to upload/i,
    message: "Файл выбран, но сервер отклонил загрузку. Проверьте размер и формат файла.",
  },
  {
    pattern: /document file field is required|document file is required/i,
    message: "Добавьте файл документа.",
  },
  {
    pattern: /title field is required|title is required/i,
    message: "Введите название документа.",
  },
  {
    pattern: /expired at field is required|expired at is required/i,
    message: "Укажите срок ознакомления.",
  },
  {
    pattern: /category id field is required|category id is required/i,
    message: "Выберите категорию.",
  },
  {
    pattern: /target groups field is required|target groups is required/i,
    message: "Выберите целевую группу.",
  },
  {
    pattern: /must be a date|valid date/i,
    message: "Укажите корректную дату.",
  },
  {
    pattern: /may not be greater than|must not be greater than|larger than/i,
    message: "Файл не должен превышать допустимый размер.",
  },
];

const TECHNICAL_ERROR_PATTERN =
  /hash_file|sqlstate|stack trace|exception|\.php\b|failed to open stream|http\/\d|undefined|trying to|call to|class .* not found|api request failed|syntax error|permission denied|\/storage\//i;

function buildUrl(path, query) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const searchParams = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.append(key, value);
  });

  const queryString = searchParams.toString();

  return `${API_BASE_URL}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

function getErrorMessages(errorPayload) {
  const messages = [];

  if (Array.isArray(errorPayload?.message)) {
    messages.push(...errorPayload.message);
  } else if (typeof errorPayload?.message === "string") {
    messages.push(errorPayload.message);
  }

  if (errorPayload?.errors && typeof errorPayload.errors === "object") {
    messages.push(...Object.values(errorPayload.errors).flat());
  }

  return messages.filter(Boolean);
}

function uniqueMessages(messages) {
  return Array.from(new Set(messages.map((message) => message?.toString().trim()).filter(Boolean)));
}

function translateValidationMessage(message) {
  const mappedMessage = VALIDATION_MESSAGE_MAP.find(({ pattern }) => pattern.test(message));

  if (mappedMessage) {
    return mappedMessage.message;
  }

  if (TECHNICAL_ERROR_PATTERN.test(message)) {
    return "";
  }

  if (/[а-яё]/i.test(message)) {
    return message;
  }

  return "";
}

function getUserFacingErrorMessage(status, messages, fallbackMessage) {
  const normalizedMessages = uniqueMessages(messages);
  const readableMessage = normalizedMessages.find(
    (message) => /[а-яё]/i.test(message) && !TECHNICAL_ERROR_PATTERN.test(message),
  );

  if (status === 422) {
    const validationMessages = uniqueMessages(
      normalizedMessages.map(translateValidationMessage).filter(Boolean),
    );

    return validationMessages.length ? validationMessages.join(" ") : "Проверьте заполнение формы.";
  }

  if (status === 401 || status === 419) {
    return readableMessage || "Сессия истекла. Войдите заново.";
  }

  if (status === 403) {
    return "Нет доступа к этому действию.";
  }

  if (status === 404) {
    return "Данные не найдены.";
  }

  if (status >= 500) {
    return "На сервере произошла ошибка. Попробуйте позже.";
  }

  return readableMessage || fallbackMessage || DEFAULT_API_ERROR_MESSAGE;
}

export function getUserApiErrorMessage(error, fallbackMessage = DEFAULT_API_ERROR_MESSAGE) {
  if (!error) {
    return fallbackMessage;
  }

  if (error.status >= 500 && fallbackMessage) {
    return fallbackMessage;
  }

  return error.userMessage || error.message || fallbackMessage;
}

function logApiError({ errorPayload, messages, method, status, url }) {
  if (status === 401 || status === 403) {
    return;
  }

  const summary = `${method} ${url} → ${status}`;

  if (messages.length) {
    console.warn(`[API] ${summary}: ${messages.join(" | ")}`);
    return;
  }

  if (errorPayload) {
    console.warn(`[API] ${summary}`, errorPayload);
    return;
  }

  console.warn(`[API] ${summary}`);
}

export async function createApiError(response, { method = "GET", url = "", fallbackMessage } = {}) {
  const contentType = response.headers.get("content-type") ?? "";
  let errorPayload = null;

  if (contentType.includes("application/json")) {
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = null;
    }
  }

  const errorMessages = getErrorMessages(errorPayload);
  const rawMessage =
    errorMessages[0] ??
    errorPayload?.error ??
    fallbackMessage ??
    `API request failed with status ${response.status}`;
  const userMessage = getUserFacingErrorMessage(response.status, errorMessages, rawMessage);
  const error = new Error(userMessage);

  logApiError({
    errorPayload,
    messages: errorMessages.length ? errorMessages : [rawMessage],
    method,
    status: response.status,
    url,
  });

  error.status = response.status;
  error.errors = errorPayload?.errors;
  error.messages = errorMessages;
  error.rawMessage = rawMessage;
  error.userMessage = userMessage;
  error.payload = errorPayload;

  return error;
}

export async function apiClient(path, options = {}) {
  const { body, headers = {}, method = "GET", query, skipAuth = false, ...restOptions } = options;
  const hasBody = body !== undefined && body !== null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders =
    isFormData || !hasBody
      ? headers
      : {
          "Content-Type": "application/json",
          ...headers,
        };
  const finalHeaders = {
    ...requestHeaders,
  };
  const hasExplicitAuthHeader = "Authorization" in finalHeaders || "authorization" in finalHeaders;

  if (!skipAuth && !hasExplicitAuthHeader) {
    const accessToken = getStoredAccessToken();

    if (accessToken) {
      finalHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  const url = buildUrl(path, query);
  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...restOptions,
  });

  if (!response.ok) {
    throw await createApiError(response, { method, url });
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}
