import { TelegramClient, Api } from 'telegram';

export async function getFull(
    client: TelegramClient,
    chat: Api.TypeEntityLike,
) {
    const inputEntity = await client.getInputEntity(chat);

    if (inputEntity instanceof Api.InputPeerChannel) {
        return (
            await client.invoke(
                new Api.channels.GetFullChannel({ channel: chat }),
            )
        ).fullChat;
    } else if (inputEntity instanceof Api.InputPeerChat) {
        return (
            await client.invoke(
                new Api.messages.GetFullChat({ chatId: inputEntity.chatId }),
            )
        ).fullChat;
    }

    throw new Error(`Can't get full chat with ${chat}`);
}
