// backend.ts — the backend-agnostic contract plus runtime backend selection.
//
// treeweave's JS binding has two interchangeable backends over the same C ABI:
//   * "native": a Node-API `.node` addon (fast, Node-only) — treeweave_napi.cpp
//   * "wasm":   an Emscripten module (browser + Node) — wasm.ts / wasm_glue.cpp
// Both implement the `Backend` interface below; `index.ts` (the Treeweave
// class) is written entirely against this interface and never imports a backend
// directly. `loadBackend()` chooses one at runtime.
/** Numeric `tol_kind` values — mirror treeweave_tol_kind_t in treeweave.h. */
export const TOL_KIND = {
    relative_tail: 0,
    absolute_tail: 1,
    relative_max: 2,
    absolute_max: 3,
    relative_l2: 4,
    absolute_l2: 5,
};
/**
 * Load a backend. `"auto"` (the default) prefers the native addon under Node and
 * falls back to WASM if the addon is unavailable; in non-Node environments it
 * always uses WASM. `"native"` / `"wasm"` force a specific backend (used by the
 * test suite to exercise both under Node).
 */
export async function loadBackend(choice = "auto") {
    const isNode = typeof process !== "undefined" && !!process.versions?.node;
    if (choice === "native" || (choice === "auto" && isNode)) {
        try {
            const { makeNativeBackend } = await import("./native.js");
            return makeNativeBackend();
        }
        catch (err) {
            if (choice === "native")
                throw err;
            // fall through to WASM
        }
    }
    const { makeWasmBackend } = await import("./wasm.js");
    return makeWasmBackend();
}
