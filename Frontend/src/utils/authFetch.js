// utils/authFetch.js
import { isTokenExpired } from "./tokenUtils";


let isRefreshing = false;
let refreshPromise = null;

async function tryRefreshToken() {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const res = await fetch("https://photocapsule.onrender.com/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Refresh failed:", res.status, text);
          throw new Error("Refresh failed");
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
        localStorage.removeItem("token");
        throw err;
      } finally {
        isRefreshing = false;
      }
    })();
  }

  return refreshPromise;
}

export async function authFetch(endpoint, options = {}) {
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
      

  return fetch("https://photocapsule.onrender.com" + endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
