import { serve } from 'https://pkg.go.dev/github.com/syumai/workers@v0.2.0';

export default {
    async fetch(request, env, ctx) {
        // The 'serve' function from syumai/workers acts as the bridge.
        // It takes the standard Worker fetch event and correctly
        // passes it to your Go Wasm binary for processing.
        // It handles all HTTP methods, including OPTIONS.
        return serve(request);
    },
};