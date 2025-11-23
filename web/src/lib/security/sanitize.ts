/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return sanitizeString(email).toLowerCase().trim();
}

/**
 * Sanitize name (alphanumeric, spaces, hyphens, apostrophes)
 */
export function sanitizeName(name: string): string {
  return sanitizeString(name)
    .replace(/[^a-zA-Z0-9\s\-']/g, "")
    .substring(0, 100); // Max length
}

/**
 * Validate and sanitize file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize: number; // in bytes
    allowedTypes: string[];
  }
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(options.maxSize / 1024 / 1024)}MB limit`,
    };
  }

  // Check file type
  const fileType = file.type;
  if (!options.allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${options.allowedTypes.join(", ")}`,
    };
  }

  // Check file extension matches MIME type
  const extension = file.name.split(".").pop()?.toLowerCase();
  const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  if (extension && !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: "Invalid file extension",
    };
  }

  return { valid: true };
}

