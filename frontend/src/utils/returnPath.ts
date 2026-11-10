const routes = new Set(["/home", "/trade", "/mining", "/auction", "/casino", "/ranks", "/me", "/admin"]);

export function returnPath(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/home";
  try {
    const destination = new URL(value, "https://cobya.invalid");
    if (destination.origin !== "https://cobya.invalid" || !routes.has(destination.pathname)) return "/home";
    return destination.pathname + destination.search + destination.hash;
  } catch {
    return "/home";
  }
}
