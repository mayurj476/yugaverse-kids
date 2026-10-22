# Shape Friends 🟡🟦🔺

Three colourful games for children under 3: **shapes**, **balloons** and **ABC**. They are made for small fingers that don't tap accurately yet.

### ▶ Play: **https://mayurj476.github.io/shape-friends/**

It works in any modern browser, and installs like an app on Android, iPad and iPhone. After the first visit it also works with no internet.

## Install it like an app

| Device | How |
|---|---|
| **Android** | Open the link in **Chrome**, tap **⋮** (top right), then **Install app** or **Add to Home screen**. |
| **iPad / iPhone** | Open the link in **Safari**, tap **Share**, then **Add to Home Screen**. |
| **Computer** | Just open the link. In Chrome or Edge you can also click the install icon in the address bar. |

Once installed, it opens full screen from its own icon, with no browser bars.

## The games

The start screen has three big picture cards, so a child who can't read can still choose.

### 🟡 Shapes
- Each level shows **3 random shapes** with smiling faces. There are 9 shapes in all, including circle, star, heart and moon.
- Each shape has a dashed outline in its own colour at the top. The child drags each shape into its outline.
- When all three are in, a **clapping cat** appears, with confetti and balloons the child can pop. Then the next level starts by itself.
- Each finished level adds a ⭐ at the top left.

### 🎈 Balloons
- Big balloons with the numbers **1 to 10** drift slowly in from every side.
- A tap near a balloon bursts it with a pop and a firework crackle. Colourful stars shoot out and sparks twinkle.
- The number grows out of the burst, and a voice says it ("Five!"). A short happy tune plays, higher for bigger numbers.
- Every 10 balloons, the clapping cat comes out to cheer.

### 🔤 ABC
- Two letters per level, in alphabet order: A and B, then C and D, up to Y and Z. After Z it starts again from A.
- The child drags each letter into its dashed outline. Picking a letter up makes the voice say it once.
- Placing it pops up a picture card, such as **"A for Apple 🍎"**, and the voice reads it out.
- After both letters are in, a **girl dances** to a bouncy song. Tapping her makes her laugh.
- The top bar shows how far the child has got (⭐ A–D).

## Made for little hands
- **Forgiving touch:** a tap *near* a shape, letter or balloon counts, even if it misses. Shapes and letters also snap in on their own once they get close to their outline. Several fingers at once work fine.
- **Every touch gets an answer:** tapping an empty spot makes a soft bloop and a few sparkles.
- **Gentle help:** if nothing happens for a few seconds, a 👆 hand shows where a piece goes, and the voice gives a hint.
- **Wrong drops are friendly:** the piece slides back with an "Oops! Try again", never a buzzer.
- **A natural voice:** the game picks the most natural-sounding voice on the device, and its lines change so it doesn't repeat itself. The voice always finishes before the cat claps or the girl dances.
- **Pauses by itself:** when the app is minimized, the screen locks, or another window is in front, everything stops (sound, voice, moving balloons). It carries on when the child comes back.
- **No accidental exits:** going back to the menu means **holding** 🏠 for about a second. A quick tap does nothing.
- **Sound on or off:** 🔊 / 🔇 is at the top right.
- **No ads, no accounts, no tracking.** Progress (stars and letters) is saved on the device only.

## Tips for parents
- **Better voice on iPad / iPhone:** go to Settings → Accessibility → Spoken Content → Voices → English, and download a voice marked **Enhanced** or **Premium**, such as *Ava (Premium)*. The game uses it automatically.
- **Keep them in the game:** on iPad use *Guided Access* (Settings → Accessibility). On Android use *App pinning* (search for "pinning" in Settings).
- **Start over:** to reset the stars and letters, clear the site's data in the browser settings.

## Running it on your own computer
This section is for the owner and for anyone with permission (see [Licence](#licence)).

- **Quick look:** double-click `index.html`. Recorded sounds don't play this way.
- **On a tablet over home Wi-Fi:** double-click `run.bat`. It needs [Node.js](https://nodejs.org). A popup shows the address to type on the tablet, such as `http://192.168.1.14:3000`. Keep the black window open while playing. The first time, click **Allow** if Windows asks about the firewall. While it runs, the tablet reloads by itself whenever a file changes.

### Your own sounds
Every sound is made by the game itself, but recordings can replace them. Put `.mp3`, `.wav` or `.m4a` files in `sounds/` with names such as `clap`, `applause`, `crackle`, `laugh`, `meow` or `dance`. [sounds/README.txt](sounds/README.txt) lists every name. Long recordings are trimmed with a soft fade, so they never pile up.

## Files
| File | What it is |
|---|---|
| `index.html` | The page, including the cat and the dancing girl drawings |
| `style.css` | Colours, scenery and all animations |
| `app.js` | All three games: touch handling, sounds, voice, confetti |
| `sounds/` | Optional recorded sounds, plus a guide to the file names |
| `icons/`, `manifest.webmanifest`, `sw.js` | App icon, "install as app" and offline support |
| `run.bat`, `server.js` | Local server for playing on a tablet over home Wi-Fi |
| `LICENSE` | Licence terms |

## Licence
**Copyright © 2026 mayurj476. All rights reserved.**

This is **not** open source. You may view the code and play the game at the link above for personal use. Copying, changing, re-hosting, turning it into an app or any commercial use needs **written permission from the owner**, and that permission may involve a fee. The full terms are in [LICENSE](LICENSE). To ask, contact [mayurj476 on GitHub](https://github.com/mayurj476).

The sound recordings in `sounds/` and the Baloo 2 font belong to their own owners and are not covered by this licence.
