import { Stream, TGCalls } from 'tgcalls';

export interface Connection {
    tgcalls: TGCalls<any>;
    stream: Stream;
}
