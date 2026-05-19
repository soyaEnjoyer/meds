import { rmSync } from 'node:fs';
import { createServer, Socket } from 'node:net';
import { createInterface } from 'node:readline';

const SOCKET_PATH = '.message-bus.sock';
const CONNECT_RETRY_MS = 100;
const MAX_CONNECT_RETRIES = 10;

type ClientId = string & {};

interface Message {
  topic: 'invalidate';
  source: ClientId;
}

type MessageTopic = Message['topic'];

type ClientToServerMessage =
  | {
      kind: 'subscribe';
      topic: MessageTopic;
      immediate: boolean;
    }
  | {
      kind: 'unsubscribe';
      topic: MessageTopic;
    }
  | {
      kind: 'message';
      message: Message;
    };

type Callback<Topic extends MessageTopic> = (message: Extract<Message, { topic: Topic }>) => void | Promise<void>;

type Unsubscribe = () => void;

export class MessageServer {
  readonly #topicClients = new Map<MessageTopic, Set<Socket>>();
  readonly #states = new Map<MessageTopic, Message>();

  readonly #server = createServer((client) => {
    client.addListener('error', console.error);
    const readline = createInterface(client);
    readline.addListener('error', console.error);
    readline.addListener('close', () => {
      for (const clients of this.#topicClients.values()) clients.delete(client);
    });
    readline.addListener('line', (data) => {
      const parsed: ClientToServerMessage = JSON.parse(data);

      switch (parsed.kind) {
        case 'message': {
          this.#states.set(parsed.message.topic, parsed.message);
          for (const other of this.#topicClients.get(parsed.message.topic) ?? [])
            other.write(`${JSON.stringify(parsed.message)}\n`);
          break;
        }

        case 'subscribe': {
          if (!this.#topicClients.get(parsed.topic)?.add(client))
            this.#topicClients.set(parsed.topic, new Set([client]));
          if (parsed.immediate && this.#states.has(parsed.topic))
            client.write(`${JSON.stringify(this.#states.get(parsed.topic))}\n`);
          break;
        }

        case 'unsubscribe': {
          this.#topicClients.get(parsed.topic)?.delete(client);
          break;
        }

        default: {
          console.warn('server - unhandled message kind', parsed);
        }
      }
    });
  });

  static #cleanup(): void {
    try {
      rmSync(SOCKET_PATH, { force: true });
    } catch {
      /* empty */
    }
  }

  public constructor() {
    MessageServer.#cleanup();
    this.#server.addListener('error', console.error);
    this.#server.listen(SOCKET_PATH);
    console.log('listening on', SOCKET_PATH);
  }

  public stop(): void {
    for (const clients of this.#topicClients.values()) for (const client of clients) client.destroy();
    this.#server.close(() => {
      console.log('message server stopped');
    });
  }
}

export class MessageClient {
  #socket: Socket | null = null;
  readonly #queue: ClientToServerMessage[] = [];
  readonly #topicCallbacks = new Map<MessageTopic, Set<Callback<MessageTopic>>>();

  #sendInternal(...messages: ClientToServerMessage[]): void {
    if (!this.#socket) {
      console.log('queuing', ...messages);
      if (messages.length) this.#queue.push(...messages);
      return;
    } else {
      const allMessages: ClientToServerMessage[] = [...this.#queue.splice(0, this.#queue.length), ...messages];
      if (!allMessages.length) return;
      console.log('sending', allMessages);
      this.#socket.write(allMessages.map((message) => `${JSON.stringify(message)}\n`).join(''));
    }
  }

  // oxlint-disable-next-line typescript/parameter-properties
  public constructor(public readonly importMetaUrl: string) {
    // oxlint-disable-next-line init-declarations
    let socket: Socket;
    let retries = 0;
    const interval = setInterval(() => {
      ++retries;
      if (socket) socket.destroy();
      socket = new Socket();

      // oxlint-disable-next-line promise/prefer-await-to-callbacks
      socket.addListener('error', (err) => {
        if (retries === MAX_CONNECT_RETRIES) {
          clearInterval(interval);
          throw new Error(`could not connect to ${SOCKET_PATH} after ${retries} attempts`, {
            cause: err,
          });
        }
      });

      socket.addListener('ready', () => {
        clearInterval(interval);
        this.#socket = socket;
        console.info(importMetaUrl, 'connected to', SOCKET_PATH);
        const readline = createInterface(socket);
        readline.addListener('error', console.error);
        readline.addListener('line', (data) => {
          const parsed: Message = JSON.parse(data);
          console.log('received', parsed);
          // oxlint-disable-next-line promise/prefer-await-to-callbacks
          for (const callback of this.#topicCallbacks?.get(parsed.topic) ?? []) void callback(parsed);
        });
        this.#sendInternal();
      });

      socket.connect(SOCKET_PATH);
    }, CONNECT_RETRY_MS);
  }

  public subscribe<Topic extends MessageTopic>(
    topic: Topic,
    callback: Callback<Topic>,
    immediate = false
  ): Unsubscribe {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const genericCallback = callback as unknown as Callback<MessageTopic>;

    if (!this.#topicCallbacks.get(topic)?.add(genericCallback))
      this.#topicCallbacks.set(topic, new Set([genericCallback]));

    this.#sendInternal({ immediate, kind: 'subscribe', topic });

    return () => {
      this.#topicCallbacks.get(topic)?.delete(genericCallback);
      if ((this.#topicCallbacks.get(topic)?.size ?? 0) === 0) {
        this.#topicCallbacks.delete(topic);
        this.#sendInternal({ kind: 'unsubscribe', topic });
      }
    };
  }

  public send(...messages: Message[]): void {
    this.#sendInternal(...messages.map((message) => ({ kind: 'message' as const, message })));
  }
}
