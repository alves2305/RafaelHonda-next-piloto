export function canOptimizePublicImage(source: string) {
  if (source.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(source);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}
