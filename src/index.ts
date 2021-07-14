import { Readable } from 'stream';
import { Api, TelegramClient } from 'telegram';
import { Stream, TGCalls } from 'tgcalls';

import { getJoinCall, leaveCall } from './calls';
import { Connection } from './types';

export class GramTGCalls {
    client: TelegramClient;
    #connections: Map<number, Connection>;

    constructor(client: TelegramClient) {
        this.client = client;
        this.#connections = new Map();
    }

    async stream(
        chatId: number,
        readable: Readable,
        options?: {
            onFinish?: (...args: any[]) => void;
            joinAs?: Api.TypeEntityLike;
            params?: any;
            stream?: {
                bitsPerSample?: number;
                sampleRate?: number;
                channelCount?: number;
                almostFinishedTrigger?: number;
            };
        }
    ) {
        const connection = this.#connections.get(chatId);

        if (connection) {
            connection.stream.setReadable(readable);
        } else {
            const connection = {
                tgcalls: new TGCalls(options?.params),
                stream: new Stream(
                    readable,
                    options?.stream?.bitsPerSample || 16,
                    options?.stream?.sampleRate || 65000,
                    options?.stream?.channelCount || 1,
                    options?.stream?.almostFinishedTrigger || 20
                ),
            };

            connection.tgcalls.joinVoiceCall = getJoinCall(
                this.client,
                chatId,
                options?.joinAs
            );

            if (options?.onFinish) {
                connection.stream.addListener('finish', options.onFinish);
            }

            this.#connections.set(chatId, connection);
            await connection.tgcalls.start(connection.stream.createTrack());
        }
    }

    pause(chatId: number): boolean | null {
        const connection = this.#connections.get(chatId);

        if (connection) {
            if (!connection.stream.paused) {
                connection.stream.pause();
                return true;
            }

            return false;
        }

        return null;
    }

    resume(chatId: number): boolean | null {
        const connection = this.#connections.get(chatId);

        if (connection) {
            if (connection.stream.paused) {
                connection.stream.pause();
                return true;
            }

            return false;
        }

        return null;
    }

    async stop(chatId: number): Promise<boolean | null> {
        const connection = this.#connections.get(chatId);

        if (connection) {
            const result = await leaveCall(this.client, chatId);

            if (result) {
                this.#connections.delete(chatId);
                return true;
            }

            return result;
        }

        return null;
    }

    connected(chatId: number): boolean {
        return !!this.#connections.get(chatId);
    }

    finished(chatId: number): boolean | null {
        const connection = this.#connections.get(chatId);

        if (connection) {
            return connection.stream.finished;
        }

        return null;
    }
}
