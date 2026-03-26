const removeDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizeSearchValue = (value?: string | null) =>
  removeDiacritics((value ?? '').trim().toLowerCase());

export const compactSearchValue = (value?: string | null) =>
  normalizeSearchValue(value).replace(/[^a-z0-9]/g, '');

export const matchesSearch = (
  values: Array<string | null | undefined>,
  search?: string,
) => {
  const normalizedSearch = normalizeSearchValue(search);

  if (!normalizedSearch) {
    return true;
  }

  const normalizedValues = values.map((value) => normalizeSearchValue(value));
  const compactValues = values.map((value) => compactSearchValue(value));
  const tokens = normalizedSearch.split(/\s+/).filter(Boolean);

  return tokens.every((token) => {
    const compactToken = compactSearchValue(token);

    return normalizedValues.some((value) => value.includes(token)) ||
      (!!compactToken && compactValues.some((value) => value.includes(compactToken)));
  });
};
