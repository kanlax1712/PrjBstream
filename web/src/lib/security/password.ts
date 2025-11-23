/**
 * Password validation and strength checking
 */

export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  isValid: boolean;
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters");
    return { score: 0, feedback, isValid: false };
  }

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (hasLower && hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  // Provide feedback
  if (!hasLower) feedback.push("Add lowercase letters");
  if (!hasUpper) feedback.push("Add uppercase letters");
  if (!hasNumber) feedback.push("Add numbers");
  if (!hasSpecial) feedback.push("Add special characters");

  // Minimum requirements: at least 8 chars, one letter, one number
  const isValid =
    password.length >= 8 &&
    (hasLower || hasUpper) &&
    hasNumber;

  return {
    score: Math.min(score, 4),
    feedback: feedback.length > 0 ? feedback : ["Strong password"],
    isValid,
  };
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
  ];
  if (commonPasswords.some((weak) => password.toLowerCase().includes(weak))) {
    return { valid: false, message: "Password is too common. Please choose a stronger password" };
  }

  return { valid: true };
}

