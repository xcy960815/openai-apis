import { EventEmitter } from 'events';

declare global {
    interface ReadableStream extends EventEmitter {
        read(size?: number): string | Buffer;
    }
}
export {}