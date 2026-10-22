# Shape Friends 🟡🟦🔺

Three games for children under 3: shape matching, balloon popping and letters. It runs in any web browser and on iPad, and needs no install or build step.

## How it plays
The start screen has three big picture cards: **shapes**, **balloons** and **ABC**. The child taps one to play. To go back to the menu, a grown-up **holds** the 🏠 button for about a second while a ring fills up. A quick tap does nothing, so little ones can't leave by accident.

### Game 1: Shapes
- Each level shows **3 random shapes** with faces. Each one has a dashed outline in the same colour at the top.
- The child drags each shape into its outline. Wherever a shape drops, the nearest outline gets it, and the drop area is wide.
- When all 3 are in, a **clapping cat** pops up. Confetti and balloons appear too, and the child can tap the balloons to pop them. Then the next level starts by itself.
- Each level finished adds a star ⭐ at the top left.

### Game 2: Balloons
- Big balloons with the numbers **1 to 10** drift slowly in from every side of the screen.
- A touch near a balloon bursts it with a POP and a firework crackle. Stars of every colour shoot out, and twinkling sparks match the crackle sound.
- The number grows out of the burst, and a voice says it ("Five!"). Each pop plays a short happy tune, which rotates between bells, a "wheee" slide whistle and a marimba. Bigger numbers play higher notes.
- Every 10 balloons, the clapping cat comes out to cheer.

### Game 3: Letters (ABC)
- Two letters per level, in alphabet order: A and B first, then C and D, and so on up to Y and Z. After Z it starts again from A.
- Each letter has a dashed outline at the top. The child drags the matching letter into it, with the same forgiving touch as the shapes.
- Picking a letter up makes the voice say it once ("A").
- Placing it pops up a picture card, such as **"A for Apple 🍎"** or "B for Ball ⚽", and the voice reads it out.
- After both letters are in, a **girl dances** to a bouncy song, with music notes floating around her. She waits until the voice has finished. Tapping her makes her giggle.
- The top bar shows how far the child has got (⭐ A–D). Progress is remembered.

## Built for little hands
- **Pauses by itself:** when the app is minimized, the iPad is locked, or (on a computer) another window is in front, everything stops. That covers sounds, the voice, hints and the floating balloons. It carries on when the child comes back. On a computer a big ▶ shows while it is paused.
- **No talking over each other:** at the end of a level the voice says "Well done!" first, and the cat starts clapping only when the voice has finished.
- **Forgiving touch:** a touch near a shape picks it up, even if it misses the shape itself. The nearest shape is chosen, up to about half a shape-width away.
- A shape that gets close to its outline **snaps in on its own**, even if the child never lets go.
- Several fingers at once work fine.
- If nothing happens for about 7 seconds, a little 👆 hand shows where a shape goes.
- A friendly voice names each shape, cheers, and says "Oops! Try again" after a wrong drop. The lines change so it doesn't repeat itself. The game uses the most natural voice on the device.
- The sounds are a marimba, bells and real-style hand claps with a little room echo, and a small crowd claps when a level is finished. Touching an empty spot makes a soft bloop, and tapping the cat makes it meow.
- **Want real recordings?** Put `.mp3`, `.wav` or `.m4a` files in the `sounds/` folder and the game uses them instead. See `sounds/README.txt` for the file names.
- 🔊/🔇 is at the top right.

## Run it
**On a computer:** double-click `index.html`.

**On an iPad (best way):**
1. Double-click **`run.bat`**. A popup shows the address to type on the iPad, such as `http://192.168.1.14:3000`.
2. On the iPad, on the same Wi-Fi, type that address into Safari.
3. Tap **Share → Add to Home Screen**. The game then opens full screen like an app.

Keep the black `run.bat` window open while playing, and close it to stop. The first time, Windows may ask about the firewall: click **Allow** for Private networks.

For offline play anywhere, host the folder on a free static host (GitHub Pages, Netlify, Cloudflare Pages). On HTTPS the game keeps working with no internet after the first visit.

**Make the voice even more natural on iPad:** go to Settings → Accessibility → Spoken Content → Voices → English, and download a voice marked **Enhanced** or **Premium** (for example *Ava (Premium)* or *Samantha (Enhanced)*). The game picks it up automatically. On a Windows PC, Microsoft Edge has very natural "Online (Natural)" voices built in.

**Tip for parents:** turn on iPad *Guided Access* (Settings → Accessibility) to keep a toddler inside the game.

## Files
| File | What it is |
|---|---|
| `index.html` | Page layout, including the cat drawing |
| `style.css` | Colours, scenery and all animations |
| `app.js` | Game logic, touch handling, sounds, confetti |
| `manifest.webmanifest`, `sw.js`, `icons/` | iPad home-screen app and offline support |

To reset the stars, clear the site's data in the browser.
