import { Readable } from 'stream';
import { Api, TelegramClient } from 'telegram';
import { EntityLike } from 'telegram/define';
import { Stream, TGCalls } from 'tgcalls';

import { getJoinCall, leaveCall } from './calls';
import { setVolume } from './participants';
import { Connection } from './types';

export class GramTGCalls {
    client: TelegramClient;
    #connections: Map<number, Connection>;

    constructor(client: TelegramClient) {
        this.client = client;
        this.#connections = new Map();
    }

    /**
     * Streams the specified audio with the provided options.
     *
     * Audio properties:
     *   - Format: s16le
     *   - Bitrate: 65K or what you provide in options.stream.sampleRate
     *   - Channels: 2
     */
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

            try {
                await connection.tgcalls.start(connection.stream.createTrack());
            } catch (error) {
                this.#connections.delete(chatId);
                throw error;
            }
        }
    }

    /**
     * Pauses the stream. Returns true if successful, false if already paused or null if not in the call of the specified chat.
     */
    pause(chatId: number) {
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

    /**
     * Resumes the stream. Returns true if successful, false if already resumed or null if not in the call of the specified chat.
     */
    resume(chatId: number) {
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

    /**
     * Stops the stream and leaves the call. Returns true if successful or a falsy value if not.
     */
    async stop(chatId: number) {
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

    /**
     * Returns true if in the call of the specified chat or false if not.
     */
    connected(chatId: number) {
        return !!this.#connections.get(chatId);
    }

    /**
     * Returns true if the stream is finished in the specified chat or false if not.
     */
    finished(chatId: number) {
        const connection = this.#connections.get(chatId);

        if (connection) {
            return connection.stream.finished;
        }

        return null;
    }

    /**
     * Sets the volume of self or someone. Returns true if successful or false if not in the call of the specified chat.
     */
    setVolume(chatId: number, volume: number, participant: EntityLike = 'me') {
        return setVolume(this.client, chatId, participant, volume);
    }
}
