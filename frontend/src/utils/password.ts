export const passwordRequirements = [
  { label: "At least 8 characters", passes: (password: string) => password.length >= 8 },
  { label: "One uppercase letter", passes: (password: string) => /[A-Z]/.test(password) },
  { label: "One lowercase letter", passes: (password: string) => /[a-z]/.test(password) },
  { label: "One number", passes: (password: string) => /\d/.test(password) },
];

export function passwordIsValid(password: string) {
  return passwordRequirements.every((requirement) => requirement.passes(password));
}
