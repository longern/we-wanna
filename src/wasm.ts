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
  ontick?: () => void;
}

const exports = await WebAssembly.instantiate(wasm, {
  env: {
    recv: (channelId: number, ptr: number, len: number) => {
      const [_, buffer] = messages.shift()!;
      const view = new Uint8Array(exports.memory.buffer, ptr, len);
      view.set(new Uint8Array(buffer));
    },
    send: (channelId: number, ptr: number, len: number) => {
      const memory = new Uint8Array(exports.memory.buffer);
      const view = memory.slice(ptr, ptr + len);
      onmessageCallback(channelId, view.buffer);
    },
  },
}).then((res) => {
  const exports: Exports = res.instance.exports as any;
  if (exports.ontick) {
    setInterval(() => {
      exports.ontick!();
    }, 1000 / 60);
  }
  return exports;
});

export function send(channelId: number, buffer: ArrayBuffer) {
  messages.push([channelId, buffer]);
  exports.onmessage(channelId, buffer.byteLength);
}

export function onmessage(
  callback: (channelId: number, buffer: ArrayBuffer) => void
) {
  onmessageCallback = callback;
}
