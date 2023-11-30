import readline from "readline";
import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"

export const input = async (question = ""): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise<string>((resolve) => {
        rl.question(question, async (input) => {
            resolve(input);
            rl.close();
        });
    });
};

export const gramjs = async (apiId: number, apiHash: string, session: string = "") => {
const stringSession = new StringSession(session);
  console.log("Loading interactive example...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input("Please enter your number: "),
    password: async () => await input("Please enter your password: "),
    phoneCode: async () => await input("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });
  console.log("You should now be connected.");
  return client;
}