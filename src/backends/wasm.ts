interface Exports {
  memory: WebAssembly.Memory;
  onmessage: (channelId: number, len: number) => void;
  ontick?: () => void;
}

class WasmClient {
  static #channelCount = 0;
  #channelId: number;
  #messages: [number, ArrayBuffer][] = [];
  #exports: Exports | null = null;
  #onopenCallback: () => void;
  #onmessageCallback: (buffer: ArrayBuffer) => void;

  #wasi() {
    return {
      fd_write: (fd: number, ptr: number, len: number, _written: number) => {
        if (fd !== 1) return -1;
        const view = new Uint8Array(this.#exports.memory.buffer, ptr, len);
        const str = new TextDecoder().decode(view);
        console.log(str); // eslint-disable-line no-console
        return len;
      },
      random_get: (ptr: number, len: number) => {
        const view = new Uint8Array(this.#exports.memory.buffer, ptr, len);
        crypto.getRandomValues(view);
      },
    };
  }

  #env() {
    return {
      recv: (channelId: number, ptr: number, len: number) => {
        const [bufferChannelId, buffer] = this.#messages.shift()!;
        if (bufferChannelId !== channelId) {
          throw new Error("channelId mismatch");
        }
        const view = new Uint8Array(this.#exports.memory.buffer, ptr, len);
        view.set(new Uint8Array(buffer));
      },
      send: (channelId: number, ptr: number, len: number) => {
        const array = new Uint8Array(this.#exports.memory.buffer);
        const view = array.slice(ptr, ptr + len);
        this.#onmessageCallback(view.buffer);
      },
    };
  }

  constructor() {
    WasmClient.#channelCount++;
    this.#channelId = WasmClient.#channelCount;

    const wasmUrl = new URL(
      "../../core/target/wasm32-unknown-unknown/release/we_wanna_core.wasm",
      import.meta.url
    );

    fetch(wasmUrl).then(async (res) => {
      const wasm = await res.arrayBuffer();

      const inst = await WebAssembly.instantiate(wasm, {
        env: this.#env(),
        wasi_snapshot_preview1: this.#wasi(),
      });
      this.#exports = inst.instance.exports as any;
      if (this.#exports.ontick) {
        setInterval(() => {
          this.#exports.ontick!();
        }, 1000 / 60);
      }

      this.#onopenCallback();
    });
  }

  onopen(callback: () => void) {
    this.#onopenCallback = callback;
  }

  send(buffer: ArrayBuffer) {
    if (!this.#exports) throw new Error("Wasm not loaded");
    this.#messages.push([this.#channelId, buffer]);
    this.#exports.onmessage(this.#channelId, buffer.byteLength);
  }

  onmessage(callback: (buffer: ArrayBuffer) => void) {
    this.#onmessageCallback = callback;
  }

  close() {}
}

export default WasmClient;
