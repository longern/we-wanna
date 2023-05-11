interface Exports {
  memory: WebAssembly.Memory;
  onmessage: (channelId: number, len: number) => void;
  ontick?: () => void;
}

const messages: [number, ArrayBuffer][] = [];
let exports: Exports | null = null;
let onmessageCallback: (channelId: number, buffer: ArrayBuffer) => void;

function wasi(memoryFunc: () => WebAssembly.Memory) {
  return {
    fd_write: (fd: number, ptr: number, len: number, _written: number) => {
      if (fd !== 1) return -1;
      const view = new Uint8Array(memoryFunc().buffer, ptr, len);
      const str = new TextDecoder().decode(view);
      console.log(str);
      return len;
    },
    random_get: (ptr: number, len: number) => {
      const view = new Uint8Array(memoryFunc().buffer, ptr, len);
      crypto.getRandomValues(view);
    },
  };
}

function env(memoryFunc: () => WebAssembly.Memory) {
  return {
    recv: (channelId: number, ptr: number, len: number) => {
      const [_, buffer] = messages.shift()!;
      const view = new Uint8Array(memoryFunc().buffer, ptr, len);
      view.set(new Uint8Array(buffer));
    },
    send: (channelId: number, ptr: number, len: number) => {
      const array = new Uint8Array(memoryFunc().buffer);
      const view = array.slice(ptr, ptr + len);
      onmessageCallback(channelId, view.buffer);
    },
  };
}

export async function instantiate() {
  const wasmUrl = new URL(
    "../core/target/wasm32-unknown-unknown/release/we_wanna_core.wasm",
    import.meta.url
  );
  const wasm = await fetch(wasmUrl).then((res) => res.arrayBuffer());

  const memoryFunc = () => exports!.memory;
  exports = await WebAssembly.instantiate(wasm, {
    env: env(memoryFunc),
    wasi_snapshot_preview1: wasi(memoryFunc),
  }).then((res) => {
    const exports: Exports = res.instance.exports as any;
    if (exports.ontick) {
      setInterval(() => {
        exports.ontick!();
      }, 1000 / 60);
    }
    return exports;
  });
}

export function send(channelId: number, buffer: ArrayBuffer) {
  messages.push([channelId, buffer]);
  exports!.onmessage(channelId, buffer.byteLength);
}

export function onmessage(
  callback: (channelId: number, buffer: ArrayBuffer) => void
) {
  onmessageCallback = callback;
}
