import { Readable } from 'stream';
import { Api } from 'telegram';
export type Path = string
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

export interface Listeners {
    onFinish?: () => void;
    onError?: (error: Error) => void;
}

export interface Video {
    readable?: Readable;
    listeners?: Listeners;
    params?: {
        width?: number;
        height?: number;
        framerate?: number;
    };
}

export interface Audio {
    readable?: Readable;
    listeners?: Listeners;
    params?: {
        bitsPerSample?: number;
        sampleRate?: number;
        channelCount?: number;
        almostFinishedTrigger?: number;
    };
}
