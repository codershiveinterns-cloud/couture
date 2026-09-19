export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export function hasErrors(errors: FieldErrors | null | undefined): boolean {
  return !!errors && Object.values(errors).some(Boolean);
}

export const EMAIL_MAX_LENGTH = 254;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = 'At least 8 characters, including a letter and a number.';
export const REVIEW_TITLE_MAX = 80;
export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS = /^[0-9+\-()\s]+$/;
const POSTAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(normalized);
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required';
  if (!isValidEmail(email)) return 'Enter a valid email address';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number';
  }
  return undefined;
}

export function validateName(name: string, label = 'Name'): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < NAME_MIN_LENGTH) return `${label} must be at least ${NAME_MIN_LENGTH} characters`;
  if (trimmed.length > NAME_MAX_LENGTH) return `${label} must be ${NAME_MAX_LENGTH} characters or fewer`;
  return undefined;
}

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!PHONE_CHARS.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

export function validatePhone(phone: string, required = true): string | undefined {
  if (!phone.trim()) return required ? 'Phone number is required' : undefined;
  if (!isValidPhone(phone)) return 'Enter a valid phone number (7-15 digits)';
  return undefined;
}

export function isValidPostalCode(postalCode: string): boolean {
  return POSTAL_PATTERN.test(postalCode.trim());
}

function compact<K extends string>(errors: FieldErrors<K>): FieldErrors<K> {
  const out: FieldErrors<K> = {};
  (Object.keys(errors) as K[]).forEach((key) => {
    if (errors[key]) out[key] = errors[key];
  });
  return out;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLoginInput(input: LoginInput): FieldErrors<keyof LoginInput> {
  return compact({
    email: validateEmail(input.email),
    password: input.password ? undefined : 'Password is required',
  });
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateRegisterInput(input: RegisterInput): FieldErrors<keyof RegisterInput> {
  return compact({
    name: validateName(input.name, 'Full name'),
    email: validateEmail(input.email),
    password: validatePassword(input.password),
    confirmPassword: !input.confirmPassword
      ? 'Please confirm your password'
      : input.confirmPassword !== input.password
        ? 'Passwords do not match'
        : undefined,
  });
}

export interface ForgotPasswordInput {
  email: string;
}

export function validateForgotPasswordInput(input: ForgotPasswordInput): FieldErrors<keyof ForgotPasswordInput> {
  return compact({ email: validateEmail(input.email) });
}

export interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
}

export function validateResetPasswordInput(input: ResetPasswordInput): FieldErrors<keyof ResetPasswordInput> {
  return compact({
    password: validatePassword(input.password),
    confirmPassword: !input.confirmPassword
      ? 'Please confirm your password'
      : input.confirmPassword !== input.password
        ? 'Passwords do not match'
        : undefined,
  });
}

export interface ProfileInput {
  name: string;
  email: string;
  phone: string;
}

export function validateProfileInput(input: ProfileInput): FieldErrors<keyof ProfileInput> {
  return compact({
    name: validateName(input.name, 'Full name'),
    email: validateEmail(input.email),
    phone: validatePhone(input.phone, false),
  });
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function validateChangePasswordInput(input: ChangePasswordInput): FieldErrors<keyof ChangePasswordInput> {
  const newPasswordError = validatePassword(input.newPassword);
  return compact({
    currentPassword: input.currentPassword ? undefined : 'Current password is required',
    newPassword:
      newPasswordError ??
      (input.currentPassword && input.newPassword === input.currentPassword
        ? 'New password must be different from your current password'
        : undefined),
    confirmPassword: !input.confirmPassword
      ? 'Please confirm your new password'
      : input.confirmPassword !== input.newPassword
        ? 'Passwords do not match'
        : undefined,
  });
}

export const COUNTRIES: readonly string[] = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'New Zealand',
  'Ireland',
  'India',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Sweden',
  'Japan',
  'Singapore',
  'United Arab Emirates',
  'Mexico',
  'Brazil',
  'South Africa',
];

export const DEFAULT_COUNTRY = 'United States';

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type AddressField = Exclude<keyof AddressInput, 'isDefault'>;

export const EMPTY_ADDRESS_INPUT: AddressInput = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: DEFAULT_COUNTRY,
  isDefault: false,
};

function requiredText(value: string, label: string, max = 100): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer`;
  return undefined;
}

export function validateAddressInput(input: AddressInput): FieldErrors<AddressField> {
  return compact({
    fullName: validateName(input.fullName, 'Full name'),
    phone: validatePhone(input.phone, true),
    line1: requiredText(input.line1, 'Address line 1'),
    line2: input.line2.trim().length > 100 ? 'Address line 2 must be 100 characters or fewer' : undefined,
    city: requiredText(input.city, 'City', 60),
    state: requiredText(input.state, 'State / Province', 60),
    postalCode: !input.postalCode.trim()
      ? 'Postal code is required'
      : isValidPostalCode(input.postalCode)
        ? undefined
        : 'Enter a valid postal code (3-10 letters, numbers, spaces or hyphens)',
    country: !input.country.trim()
      ? 'Country is required'
      : COUNTRIES.includes(input.country)
        ? undefined
        : 'Select a country from the list',
  });
}

export function normalizeAddressInput(input: AddressInput): AddressInput {
  return {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    line1: input.line1.trim(),
    line2: input.line2.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    postalCode: input.postalCode.trim().toUpperCase(),
    country: input.country.trim(),
    isDefault: !!input.isDefault,
  };
}

export interface ReviewInput {
  rating: number;
  title: string;
  body: string;
}

export function validateReviewInput(input: ReviewInput): FieldErrors<keyof ReviewInput> {
  const body = input.body.trim();
  return compact({
    rating:
      Number.isInteger(input.rating) && input.rating >= 1 && input.rating <= 5 ? undefined : 'Please select a rating',
    title:
      input.title.trim().length > REVIEW_TITLE_MAX
        ? `Title must be ${REVIEW_TITLE_MAX} characters or fewer`
        : undefined,
    body: !body
      ? 'Please write a review'
      : body.length < REVIEW_BODY_MIN
        ? `Review must be at least ${REVIEW_BODY_MIN} characters`
        : body.length > REVIEW_BODY_MAX
          ? `Review must be ${REVIEW_BODY_MAX} characters or fewer`
          : undefined,
  });
}
