import { ref } from "vue";

export function useTableSort() {
  const sortKey = ref(null);
  const sortDirection = ref(null);

  function toggleSort(key) {
    if (sortKey.value !== key) {
      sortKey.value = key;
      sortDirection.value = "asc";
      return;
    }

    if (sortDirection.value === "asc") {
      sortDirection.value = "desc";
      return;
    }

    sortKey.value = null;
    sortDirection.value = null;
  }

  function applySort(items, valueExtractors) {
    if (!sortKey.value || !sortDirection.value) {
      return items;
    }

    const extract = valueExtractors[sortKey.value];

    if (!extract) {
      return items;
    }

    const direction = sortDirection.value === "asc" ? 1 : -1;

    return [...items].sort((firstItem, secondItem) => {
      const firstValue = extract(firstItem);
      const secondValue = extract(secondItem);

      if (firstValue == null && secondValue == null) {
        return 0;
      }

      if (firstValue == null) {
        return 1;
      }

      if (secondValue == null) {
        return -1;
      }

      if (typeof firstValue === "string" && typeof secondValue === "string") {
        return firstValue.localeCompare(secondValue, "ru") * direction;
      }

      if (firstValue < secondValue) {
        return -1 * direction;
      }

      if (firstValue > secondValue) {
        return 1 * direction;
      }

      return 0;
    });
  }

  return { sortKey, sortDirection, toggleSort, applySort };
}

export function parseSortableDate(value) {
  if (!value) {
    return 0;
  }

  const match = String(value).match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const [, day, month, year, hour = "00", minute = "00"] = match;

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).getTime();
}
