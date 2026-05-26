export function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    "marlenial2002@gmail.com"
  );
}

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  return email.trim().toLowerCase() === getAdminEmail();
}
