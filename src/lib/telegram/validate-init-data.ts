import crypto from "node:crypto";

const MAX_AUTH_AGE_SECONDS = 86_400;

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type ParsedInitData = {
  user?: TelegramWebAppUser;
  authDate: number;
  queryId?: string;
};

function parseUser(value: string | null): TelegramWebAppUser | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const user = JSON.parse(value) as TelegramWebAppUser;
    if (typeof user.id === "number") {
      return user;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function validateInitData(initData: string, botToken: string): ParsedInitData | null {
  if (!initData) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return null;
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) {
    return null;
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > MAX_AUTH_AGE_SECONDS) {
    return null;
  }

  return {
    user: parseUser(params.get("user")),
    authDate,
    queryId: params.get("query_id") ?? undefined,
  };
}
