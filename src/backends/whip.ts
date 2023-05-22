class WhipClient {
  #conn: RTCPeerConnection;
  #channel: RTCDataChannel;
  #onopen: () => void;

  constructor(serverEndpoint: string, serverAsm: () => Promise<ArrayBuffer>) {
    const conn = new RTCPeerConnection();
    this.#conn = conn;
    this.#channel = conn.createDataChannel("main", {
      ordered: false,
    });
    conn.createOffer().then(async (offer) => {
      await conn.setLocalDescription(offer);

      const answer = await fetch(serverEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      }).then((res) => res.text());

      conn.setRemoteDescription({ type: "answer", sdp: answer });

      const eventHandler = (event: MessageEvent) => {
        if (typeof event.data !== "string") return;
        const data = event.data;
        const { status } = JSON.parse(data);
        if (status === 404) {
          serverAsm().then((bytes) => {
            const wasmChannel = conn.createDataChannel("wasm");
            wasmChannel.onopen = () => {
              wasmChannel.send(bytes.byteLength.toString());
              const CHUNK_SIZE = 16384;
              for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
                wasmChannel.send(bytes.slice(i, i + CHUNK_SIZE));
              }
            };
            wasmChannel.onclose = () => {
              if (this.#channel.readyState === "closed") {
                this.#channel = conn.createDataChannel("main", {
                  ordered: false,
                });
                this.#channel.addEventListener("message", eventHandler);
              }
              this.#onopen();
            };
          });
        } else if (status === 200) {
          this.#onopen();
        }
      };

      this.#channel.addEventListener("message", eventHandler);
    });
  }

  onopen(callback: () => void) {
    this.#onopen = callback;
  }

  send(data: ArrayBuffer) {
    this.#channel.send(data);
  }

  onmessage(callback: (data: ArrayBuffer) => void) {
    const callbackWrapper = (event: MessageEvent) => {
      if (typeof event.data === "string") return;
      callback(event.data as ArrayBuffer);
    };
    this.#channel.addEventListener("message", callbackWrapper);
    return () => {
      this.#channel.removeEventListener("message", callbackWrapper);
    };
  }

  close() {
    this.#channel.close();
    this.#conn.close();
  }
}

export default WhipClient;
