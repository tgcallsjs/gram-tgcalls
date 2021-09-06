import { Readable } from 'stream';
import { Api } from 'telegram';
import { Stream } from 'tgcalls';

export interface JoinParams {
    joinAs?: Api.TypeEntityLike;
    muted?: boolean;
    videoStopped?: boolean;
    inviteHash?: string;
}

export interface MediaParams {}

export interface EditParams {
    muted?: boolean;
    volume?: number;
    raiseHand?: boolean;
    videoStopped?: boolean;
    videoPaused?: boolean;
    presentationPaused?: boolean;
}

export interface Video {
    readable: Readable;
    options?: {
        onFinish?: () => void;
        width?: number;
        height?: number;
        framerate?: number;
    };
}

export interface Audio {
    readable: Readable;
    options?: {
        onFinish?: () => void;
        bitsPerSample?: number;
        sampleRate?: number;
        channelCount?: number;
        almostFinishedTrigger?: number;
    };
}
