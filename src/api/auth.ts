import call from "./client";

export const registerUser = (data: { name: string; email: string; password: string }) =>
  call("/api/auth/register", { method: "POST", body: JSON.stringify(data) });

export const loginUser = (data: { email: string; password: string }) =>
  call("/api/auth/login", { method: "POST", body: JSON.stringify(data) });

export const guestLogin = () =>
  call("/api/auth/guest", { method: "POST" });

export const requestPasswordReset = (email: string) =>
  call("/api/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (token: string, password: string) =>
  call("/api/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) });

export const verifyEmail = (token: string) =>
  call(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);

export const resendVerification = (email: string) =>
  call("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });

export const logoutUser = () => call("/api/auth/logout", { method: "POST" });
