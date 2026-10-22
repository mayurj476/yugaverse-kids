OPTIONAL: your own recorded sounds
==================================

The game makes all of its sounds by itself, so this folder can stay empty.

If you want real recordings, put sound files here with these exact names.
They can be .mp3, .wav or .m4a (for example applause.wav).
The game uses any file it finds in place of its built-in sound:

  clap.mp3       one hand clap (plays each time the cat's paws meet)
  applause.mp3   a crowd clapping, about 3 seconds
  cheer.mp3      kids cheering "yaaay!" (plays when a level is finished)
  meow.mp3       a cat meow (plays when the child taps the cat)
  place.mp3      a shape going into its hole
  pickup.mp3     a shape being picked up
  wrong.mp3      a shape dropped on the wrong hole
  pop.mp3        a balloon popping
  whoosh.mp3     a new level appearing
  tap.mp3        touching an empty spot
  burst.mp3      a balloon bursting in the balloon game
  crackle.mp3    the firework crackle after a balloon bursts
  dance.mp3      dance music for the dancing girl (letters game), about 4 seconds
  laugh.mp3      a happy laugh while the girl dances (and when she is tapped)

Long recordings are trimmed with a soft fade, so they never pile up:
crackle plays its first 2 seconds per balloon, laugh up to 4 seconds.

Recordings only work when the game is opened through run.bat (or a web
host). They do not work when index.html is double-clicked.

Ideas: record your own voice or claps on your phone, or download free
sound effects. Check each site's licence first.

ANIMAL SOUNDS game
------------------
Put real animal recordings in the  sounds/animals/  folder, named:

  cow  dog  cat  duck  sheep  lion  elephant  pig

(for example sounds/animals/cow.mp3). Any file found replaces the built-in
sound for that animal. Silence at the start is skipped automatically, all
animals are evened out to a similar loudness, and long files are trimmed
with a soft fade (pig 2.5s, lion 2.8s, elephant 3.2s, others 3.5s).
