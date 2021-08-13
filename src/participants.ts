import { TelegramClient, Api } from 'telegram';
import { EntityLike } from 'telegram/define';
import { calls } from './calls';

export const setVolume = async (
    client: TelegramClient,
    chatId: number,
    participant: EntityLike,
    volume?: number
) => {
    const call = calls.get(chatId);

    if (!call) {
        return false;
    }

    await client.invoke(
        new Api.phone.EditGroupCallParticipant({
            call,
            participant,
            volume,
        })
    );

    return true;
};
