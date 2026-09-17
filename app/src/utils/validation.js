const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || '').trim());
}

/** Usernames: 3–20 chars, letters/numbers/underscore/dot only. */
export function isValidUsername(username) {
  return USERNAME_RE.test(String(username || '').trim());
}

export function isNonEmpty(value) {
  return String(value || '').trim().length > 0;
}

/**
 * Validates the full signup form and returns a map of field -> error message.
 * An empty object means the form is valid.
 */
export function validateSignup({
  username,
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
}) {
  const errors = {};

  if (!isValidUsername(username)) {
    errors.username =
      'Use 3–20 letters, numbers, "_" or "." (no spaces).';
  }
  if (!isNonEmpty(firstName)) errors.firstName = 'First name is required.';
  if (!isNonEmpty(lastName)) errors.lastName = 'Last name is required.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (String(password || '').length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

/** Turns Firebase Auth error codes into friendly, human sentences. */
export function friendlyAuthError(error) {
  const code = error && error.code ? error.code : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 6 characters).';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/requires-recent-login':
      return 'For your security, please log in again to complete this action.';
    default:
      return (error && error.message) || 'Something went wrong. Please try again.';
  }
}
