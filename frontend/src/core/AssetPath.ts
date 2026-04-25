const normalizeBaseUrl = (baseUrl?: string): string => {
  if (!baseUrl || baseUrl === '/') {
    return '/';
  }

  const trimmed = baseUrl.replace(/^\/+|\/+$/g, '');
  return `/${trimmed}/`;
};

export const resolvePublicAssetPath = (assetPath: string, baseUrl = import.meta.env.BASE_URL): string => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedAssetPath = assetPath.replace(/^\/+/, '');

  if (normalizedBaseUrl === '/') {
    return `/${normalizedAssetPath}`;
  }

  return `${normalizedBaseUrl}${normalizedAssetPath}`;
};
