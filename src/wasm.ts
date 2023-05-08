const wasmUrl = new URL(
  "../core/target/wasm32-unknown-unknown/release/we_wanna_core.wasm",
  import.meta.url
);
const wasm = await fetch(wasmUrl).then((res) => res.arrayBuffer());
const messages: [number, ArrayBuffer][] = [];
let onmessageCallback: (channelId: number, buffer: ArrayBuffer) => void;

interface Exports {
  memory: WebAssembly.Memory;
  onmessage: (channelId: number, len: number) => void;
}

const exports = await WebAssembly.instantiate(wasm, {
  env: {
    recv: (channelId: number, ptr: number, len: number) => {
      const [_, buffer] = messages.shift()!;
      const view = new Uint8Array(buffer);
      const memory = new Uint8Array(exports.memory.buffer);
      memory.set(view, ptr);
    },
    send: (channelId: number, ptr: number, len: number) => {
      const memory = new Uint8Array(exports.memory.buffer);
      const view = memory.slice(ptr, ptr + len);
      onmessageCallback(channelId, view.buffer);
    },
  },
}).then((res) => res.instance.exports as unknown as Exports);

export function send(channelId: number, buffer: ArrayBuffer) {
  messages.push([channelId, buffer]);
  exports.onmessage(channelId, buffer.byteLength);
}

export function onmessage(
  callback: (channelId: number, buffer: ArrayBuffer) => void
) {
  onmessageCallback = callback;
}
