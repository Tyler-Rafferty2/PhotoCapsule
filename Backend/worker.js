import { serve } from 'https://pkg.go.dev/github.com/syumai/workers@v0.2.0';

export default {
  async fetch(request, env, ctx) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://photo-capsule.vercel.app",
      "https://photocapsule.tjraff5.workers.dev"
    ];

    const origin = request.headers.get("Origin");
    let response = await fetch(request); // send request to your Go backend

    // Clone response so we can modify headers
    response = new Response(response.body, response);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    // Handle preflight OPTIONS at the Worker level
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    return response;
  }
};
