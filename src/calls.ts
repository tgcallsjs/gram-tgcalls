import { TelegramClient, Api } from 'telegram';
import { JoinVoiceCallCallback } from 'tgcalls/lib/types';

const calls = new Map<number, Api.TypeInputGroupCall>();

export function getJoinCall(
    client: TelegramClient,
    chatId: number,
    joinAs?: Api.TypeEntityLike
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
                joinAs: joinAs || fullChat.groupcallDefaultJoinAs || 'me',
            })
        );

        // @ts-ignore
        for (let i in joinGroupCallResult.updates) {
            // @ts-ignore
            const update = joinGroupCallResult.updates[i];
            if (update instanceof Api.UpdateGroupCallConnection) {
                return JSON.parse(update.params.data);
            }
        }

        throw new Error('Could not get connection params');
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
