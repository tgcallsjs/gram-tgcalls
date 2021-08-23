import { Readable } from 'stream';
import { Api, TelegramClient } from 'telegram';
import { TGCalls, Stream } from 'tgcalls';
import * as calls from './calls';
import * as chats from './chats';
import { JoinParams, MediaParams, EditParams } from './types';

export default class GramTGCalls {
    private call?: Api.InputGroupCall;
    private tgcalls?: TGCalls<any>;
    public media?: Stream;
    public track?: MediaStreamTrack;

    constructor(
        public client: TelegramClient,
        public chat: Api.TypeEntityLike,
    ) {}

    stream(
        readable: Readable,
        params?: {
            join?: JoinParams;
            media?: MediaParams;
        },
    ) {
        if (!this.tgcalls) {
            this.tgcalls = new TGCalls({});
            this.tgcalls.joinVoiceCall = async payload => {
                const fullChat = await chats.getFull(this.client, this.chat);

                if (!fullChat.call) {
                    throw new Error('No active call');
                }

                this.call = fullChat.call;

                return await calls.join(this.client, this.call, payload, {
                    ...params?.join,
                    muted: params?.join?.muted || false,
                    joinAs:
                        params?.join?.joinAs ||
                        fullChat.groupcallDefaultJoinAs ||
                        'me',
                });
            };
        }

        if (!this.media) {
            this.media = new Stream(
                readable,
                params?.media?.bitsPerSample,
                params?.media?.sampleRate,
                params?.media?.channelCount,
                params?.media?.almostFinishedTrigger,
            );

            if (params?.media?.onFinish) {
                this.media.addListener('finish', params.media.onFinish);
            }
        } else {
            this.media.setReadable(readable);
            return;
        }

        this.track = this.media.createTrack();
        this.tgcalls.start(this.track);
    }

    pause() {
        if (!this.media) {
            return null;
        }

        if (!this.media.paused) {
            this.media.pause();
            return true;
        }

        return false;
    }

    resume() {
        if (!this.media) {
            return null;
        }

        if (this.media.paused) {
            this.media.pause();
            return true;
        }

        return false;
    }

    mute() {
        if (!this.track) {
            return null;
        }

        if (this.track.enabled) {
            this.track.enabled = false;
            return true;
        }

        return false;
    }

    unmute() {
        if (!this.track) {
            return null;
        }

        if (!this.track.enabled) {
            this.track.enabled = true;
            return true;
        }

        return false;
    }

    async stop() {
        if (!this.call) {
            return false;
        }

        this.media?.stop();
        this.tgcalls?.close();

        await calls.leave(this.client, this.call);

        this.call = this.tgcalls = this.media = this.track = undefined;
        return true;
    }

    finished() {
        if (!this.media) {
            return null;
        }

        return this.media.finished;
    }

    async edit(participant: Api.TypeEntityLike, params: EditParams) {
        if (!this.call) {
            return false;
        }

        await calls.edit(this.client, this.call, participant, params);
        return true;
    }

    editSelf(params: EditParams) {
        return this.edit('me', params);
    }
}
