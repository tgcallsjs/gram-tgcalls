import { TelegramClient, Api } from 'telegram';
import { JoinVoiceCallParams, JoinVoiceCallResponse } from 'tgcalls/lib/types';
import { JoinParams, EditParams } from './types';

export async function join(
    client: TelegramClient,
    call: Api.InputGroupCall,
    payload: JoinVoiceCallParams<any>,
    params: JoinParams,
): Promise<JoinVoiceCallResponse> {
    // @ts-ignore
    const { updates } = await client.invoke(
        new Api.phone.JoinGroupCall({
            call,
            params: new Api.DataJSON({
                data: JSON.stringify({
                    ufrag: payload.ufrag,
                    pwd: payload.pwd,
                    fingerprints: [
                        {
                            hash: payload.hash,
                            setup: payload.setup,
                            fingerprint: payload.fingerprint,
                        },
                    ],
                    ssrc: payload.source,
                }),
            }),
            ...params,
        }),
    );

    for (const update of updates) {
        if (update instanceof Api.UpdateGroupCallConnection) {
            return JSON.parse(update.params.data);
        }
    }

    throw new Error('Could not get transport');
}

export function leave(client: TelegramClient, call: Api.TypeInputGroupCall) {
    return client.invoke(new Api.phone.LeaveGroupCall({ call }));
}

export function edit(
    client: TelegramClient,
    call: Api.InputGroupCall,
    participant: Api.TypeEntityLike,
    params: EditParams,
) {
    return client.invoke(
        new Api.phone.EditGroupCallParticipant({
            call,
            participant,
            ...params,
        }),
    );
}
