import { TelegramClient, Api } from 'telegram';
import { JoinVoiceCallCallback } from 'tgcalls/lib/types';

const calls = new Map<number, Api.TypeInputGroupCall>();

export function getJoinCall(
    client: TelegramClient,
    chatId: number,
    joinAs: Api.TypeEntityLike = 'me'
): JoinVoiceCallCallback<any> {
    return async (params) => {
        const fullChat = (
            await client.invoke(
                new Api.channels.GetFullChannel({ channel: chatId })
            )
        ).fullChat;

        if (!fullChat.call) {
            throw new Error('No active group call');
        }

        calls.set(chatId, fullChat.call);
        const joinGroupCallResult = await client.invoke(
            new Api.phone.JoinGroupCall({
                muted: false,
                call: fullChat.call,
                params: new Api.DataJSON({
                    data: JSON.stringify({
                        ufrag: params.ufrag,
                        pwd: params.pwd,
                        fingerprints: [
                            {
                                hash: params.hash,
                                setup: params.setup,
                                fingerprint: params.fingerprint,
                            },
                        ],
                        ssrc: params.source,
                    }),
                }),
                joinAs: joinAs,
            })
        );
        // @ts-ignore
        return JSON.parse(joinGroupCallResult.updates[0].call.params.data);
    };
}

export async function leaveCall(
    client: TelegramClient,
    chatId: number
): Promise<boolean> {
    const call = calls.get(chatId);

    if (!call) {
        return false;
    }

    await client.invoke(
        new Api.phone.LeaveGroupCall({
            call: call,
            source: 0,
        })
    );
    calls.delete(chatId);
    return true;
}
