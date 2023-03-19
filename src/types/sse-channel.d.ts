declare module 'sse-channel' {
  import { EventEmitter } from 'events';
  import { IncomingMessage, ServerResponse } from 'http';

  interface Client {}

  interface MessageObj {
    data?: unknown;
    id?: string;
    event?: string;
    retry?: number;
  }

  type Message = string | MessageObj;

  interface Options {
    historySize?: number;
    history?: Message[];
    retryTimeout?: number;
    pingInterval?: number;
    jsonEncode?: boolean;
  }

  class SseChannel<
    Request extends IncomingMessage = IncomingMessage,
    Response extends ServerResponse = ServerResponse,
  > extends EventEmitter {
    constructor(options: Options);

    addClient(
      req: Request,
      res: Response,
      callback: (error?: Error) => void,
    ): void;
    removeClient(res: Response): void;
    getConnectionCount(): number;
    ping(): void;
    send(msg: Message, clients?: null | Client[]): void;
    sendEventsSinceId(res: Response, sinceId: string);
    close(): void;

    on(
      event: 'connect',
      handler: (channel: SseChannel, req: Request, res: Response) => void,
    ): this;
    on(
      event: 'disconnect',
      handler: (channel: SseChannel, res: Response) => void,
    ): this;
    on(
      event: 'message',
      handler: (
        channel: SseChannel,
        message: Message,
        clients: Client[],
      ) => void,
    ): this;
  }

  export default SseChannel;
}
