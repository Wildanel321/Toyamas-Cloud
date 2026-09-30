export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 40) {
    return false;
  }
  const regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  return regex.test(slug);
}
