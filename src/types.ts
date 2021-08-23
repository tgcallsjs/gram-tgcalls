import { Api } from 'telegram';

export interface JoinParams {
    muted?: boolean;
    inviteHash?: string;
    joinAs?: Api.TypeEntityLike;
}

export interface MediaParams {
    onFinish?: () => void;
    bitsPerSample?: number;
    sampleRate?: number;
    channelCount?: number;
    almostFinishedTrigger?: number;
}

export interface EditParams {
    muted?: boolean;
    volume?: number;
    raiseHand?: boolean;
    videoStopped?: boolean;
    videoPaused?: boolean;
    presentationPaused?: boolean;
}
