import path from "path";

/**
 * Validates that a target path is safely contained within an allowed root directory.
 * Prevents directory traversal attacks (e.g. ../../etc/passwd).
 */
export function validateSafePath(rootPath: string, userPath: string): string {
  const safeRoot = path.resolve(rootPath);
  const resolved = path.resolve(safeRoot, userPath);

  if (!resolved.startsWith(safeRoot)) {
    throw new Error("Security Violation: Path traversal detected");
  }

  return resolved;
}

/**
 * Sanitizes log output to ensure sensitive tokens and keys are never printed.
 */
export function maskSecretsInLog(logText: string, secrets: string[] = []): string {
  let masked = logText;

  // Mask common key=value patterns
  masked = masked.replace(
    /(password|secret|key|token|auth)=([^\s&]+)/gi,
    "$1=••••••••••••"
  );

  // Mask specific known secrets passed
  for (const s of secrets) {
    if (s && s.length >= 4) {
      masked = masked.split(s).join("••••••••••••");
    }
  }

  return masked;
}
