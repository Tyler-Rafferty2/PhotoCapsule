// src/index.js
export default {
    async fetch(request, env, ctx) {
        return new Response("Hello from PhotoVault Worker!", {
            headers: { "content-type": "text/plain" },
        });
    },
};
