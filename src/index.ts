import { Api, TelegramClient } from 'telegram';
import { TGCalls, Stream } from 'tgcalls';
import * as calls from './calls';
import * as chats from './chats';
import { JoinParams, MediaParams, EditParams, Audio, Video } from './types';

export class GramTGCalls {
    private call?: Api.InputGroupCall;
    private tgcalls?: TGCalls<any>;
    private audioStream?: Stream;
    private videoStream?: Stream;
    private audioTrack?: MediaStreamTrack;
    private videoTrack?: MediaStreamTrack;

    constructor(
        public client: TelegramClient,
        public chat: Api.TypeEntityLike,
    ) {}

    private updateHandler(update: Api.TypeUpdate) {
        if (update instanceof Api.UpdateGroupCall) {
            if (update.call instanceof Api.GroupCallDiscarded) {
                this.close();
                this.reset();
            }
        }
    }

    /**
     * Starts streaming the provided medias with their own options.
     */
    async stream(
        audio: Audio,
        video?: Video,
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
                    joinAs:
                        params?.join?.joinAs || fullChat.groupcallDefaultJoinAs,
                });
            };
        }

        if (!this.audioStream && !this.videoStream) {
            this.audioStream = new Stream(audio.readable, { ...audio.options });
            this.audioTrack = this.audioStream.createTrack();

            if (audio.options?.onFinish) {
                this.audioStream.addListener('finish', audio.options.onFinish);
            }

            this.videoStream = new Stream(video?.readable, {
                video: true,
                ...video?.options,
            });
            this.videoTrack = this.videoStream.createTrack();

            if (video?.options?.onFinish) {
                this.videoStream.addListener('finish', video.options.onFinish);
            }
        } else {
            this.audioStream?.setReadable(audio.readable);

            if (video?.readable) {
                this.videoStream?.setReadable(video.readable);
            }
            return;
        }

        try {
            await this.tgcalls.start(this.audioTrack, this.videoTrack);
        } catch (err) {
            this.call =
                this.tgcalls =
                this.audioTrack =
                this.videoTrack =
                    undefined;
            throw err;
        }
    }

    /**
     * Pauses the audio stream. Returns `null` if there is not in call, `false` if already paused or `true` if successful.
     */
    pauseAudio() {
        if (!this.audioStream) {
            return null;
        }

        if (!this.audioStream.paused) {
            this.audioStream.pause();
            return true;
        }

        return false;
    }

    /**
     * Pauses the video stream. Returns `null` if there is not in call, `false` if already paused or `true` if successful.
     */
    pauseVideo() {
        if (!this.videoStream) {
            return null;
        }

        if (!this.videoStream.paused) {
            this.videoStream.pause();
            return true;
        }

        return false;
    }

    /**
     * Resumes the audio stream. Returns `null` if there is not in call, `false` if not paused or `true` if successful.
     */
    resumeAudio() {
        if (!this.audioStream) {
            return null;
        }

        if (this.audioStream.paused) {
            this.audioStream.pause();
            return true;
        }

        return false;
    }

    /**
     * Mutes the audio stream. Returns `null` if there is not in call, `false` if already muted or `true` if successful.
     */
    muteAudio() {
        if (!this.audioTrack) {
            return null;
        }

        if (this.audioTrack.enabled) {
            this.audioTrack.enabled = false;
            return true;
        }

        return false;
    }

    /**
     * Unmutes the audio stream. Returns `null` if not in call, `false` if already muted or `true` if successful.
     */
    unmuteAudio() {
        if (!this.audioTrack) {
            return null;
        }

        if (!this.audioTrack.enabled) {
            this.audioTrack.enabled = true;
            return true;
        }

        return false;
    }

    private close() {
        this.audioStream?.stop();
        this.videoStream?.stop();
        this.tgcalls?.close();
    }

    private reset() {
        this.call =
            this.tgcalls =
            this.audioStream =
            this.videoStream =
            this.audioTrack =
            this.videoTrack =
                undefined;
    }

    /**
     * Stops the stream, closes the WebRTC connection, sends leave request to Telegram and frees up resources. Returns `false` if not in call or `true` if successful.
     */
    async stop() {
        if (!this.call) {
            return false;
        }

        this.close();
        await calls.leave(this.client, this.call);
        this.reset();
        return true;
    }

    /**
     * Tells if the audio has finished streaming. Returns `null` if not in call, `true` if finished or `false` if not.
     */
    audioFinished() {
        if (!this.audioStream) {
            return null;
        }

        return this.audioStream.finished;
    }

    /**
     * Tells if the video has finished streaming. Returns `null` if not in call, `true` if finished or `false` if not.
     */
    videoFinished() {
        if (!this.videoStream) {
            return null;
        }

        return this.videoStream.finished;
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
