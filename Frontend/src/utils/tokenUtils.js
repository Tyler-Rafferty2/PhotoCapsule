import { jwtDecode } from "jwt-decode";

export function isTokenExpired(token) {
    console.log(!token)
  if (!token) return true;
  try {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch (err) {
    console.error("JWT decode failed:", err);
    return true;
  }
}
