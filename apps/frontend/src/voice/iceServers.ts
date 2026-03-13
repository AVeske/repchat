function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getIceServers(): RTCIceServer[] {
  const stunUrls = parseCsv(import.meta.env.VITE_STUN_URLS);
  const turnUrls = parseCsv(import.meta.env.VITE_TURN_URLS);

  const turnUsername =
    (import.meta.env.VITE_TURN_USERNAME as string | undefined) ?? "";
  const turnCredential =
    (import.meta.env.VITE_TURN_CREDENTIAL as string | undefined) ?? "";

  const servers: RTCIceServer[] = [];

  if (stunUrls.length > 0) {
    servers.push({ urls: stunUrls });
  }

  if (turnUrls.length > 0) {
    servers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
}
