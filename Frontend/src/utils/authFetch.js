// utils/authFetch.js
import { isTokenExpired } from "./tokenUtils";

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  console.log(token)

  if (!token || isTokenExpired(token)) {
    console.warn("Token expired or missing");
    throw new Error("Unauthorized");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
