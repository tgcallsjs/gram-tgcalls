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

    /**
     * Starts streaming the provided readable.
     */
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
        return this.tgcalls.start(this.track);
    }

    /**
     * Pauses streaming. Returns `null` if not in call, `false` if already paused or `true` if successful.
     */
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

    /**
     * Resumes streaming. Returns `null` if not in call, `false` if not paused or `true` if successful.
     */
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

    /**
     * Mutes the sound. Returns `null` if not in call, `false` if already muted or `true` if successful.
     */
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

    /**
     * Unmutes the sound. Returns `null` if not in call, `false` if already muted or `true` if successful.
     */
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

    /**
     * Stops the stream, closes the WebRTC connection and sends leave request to Telegram. Returns `false` if not in call or `true` if successful.
     */
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

    /**
     * Tells if the provided readable has finished streaming. Returns `null` if not in call, `true` if finished or `false` if not.
     */
    finished() {
        if (!this.media) {
            return null;
        }

        return this.media.finished;
    }

    /**
     * Edits the provided participant.
     */
    async edit(participant: Api.TypeEntityLike, params: EditParams) {
        if (!this.call) {
            return false;
        }

        await calls.edit(this.client, this.call, participant, params);
        return true;
    }

    /**
     * Alias for `edit`.
     */
    editParticipant = this.edit;

    /**
     * Edits self participant.
     */
    editSelf(params: EditParams) {
        return this.edit('me', params);
    }

    /**
     * Alias for `editSelf`.
     */
    editSelfParticipant = this.editSelf;
}
