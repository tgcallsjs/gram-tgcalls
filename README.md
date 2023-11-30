# Gram TGCalls [![Mentioned in Awesome Telegram Calls](https://awesome.re/mentioned-badge-flat.svg)](https://github.com/tgcalls/awesome-tgcalls)

An operative library for Telegram calls and a tgcallsjs helper.

## Features

-   Super light & easy-to-use.
-   Smart stream function.
-   Native controls: pause, resume, mute, unmute.
-   Call helpers: join, edit, leave.

## Installation

```shell
npm i gram-tgcalls
```

## Example usage with audio

```js
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { GramTGCalls } = require("gram-tgcalls");

const apiId = 123456;
const apiHash = "392ykiyourhashhere";
const stringSession = new StringSession("");
const username = "@group_username";

(async () => {
  console.log("Loading interactive example...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  console.log("You should now be connected.");

  let tg = new GramTGCalls(client, username);

  tg.streamAudio("./audio.mp3");
})();

```

## Docs

The docs can be found [here](https://tgcallsjs.github.io/gram-tgcalls).

## Credits

-   Structure inspired from Telethon bridge in [MarshalX/tgcalls](https://github.com/MarshalX/tgcalls).
-   Video support by [@Laky-64](https://github.com/Laky-64).
