// utils/authFetch.js
import { isTokenExpired } from "./tokenUtils";

async function tryRefreshToken() {
  try {
    const res = await fetch("http://localhost:8080/auth/refresh", {
      method: "POST",
      credentials: "include", // 🔑 ensures cookies (like refresh_token) are sent
    });

    if (!res.ok) {
      const text = await res.text(); // read the error message
      console.error("Refresh failed:", res.status, text); // e.g. 
    }

    const data = await res.json();
    const accessToken = data.access_token;

    if (accessToken) {
      localStorage.setItem("token", accessToken);
      console.log("Access token refreshed.");
    } else {
      throw new Error("No access token returned");
    }
  } catch (err) {
    console.error("Refresh failed:", err);
    // Optionally redirect to login or clear localStorage
    localStorage.removeItem("token");
    // window.location.href = "/login";
  }
}

export async function authFetch(url, options = {}) {
  let token = localStorage.getItem("token");
  //console.log(token)

  if (!token || isTokenExpired(token)) {
    await tryRefreshToken()
  }
  token = localStorage.getItem("token");
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
