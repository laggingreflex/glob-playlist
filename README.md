# glob-playlist (glop)

Create a song playlist from glob pattern

```
$ glop *.mp3
Globbing files...
15 found
Opening... // opens created playlist.m3u in your default media player
```

Or store your playlists as a pattern file (like `.gitignore`)

**`playlist.glop`:**
```
*.mp3
*.mp4
!**/*Unsorted*/**
!**/*Uncategorized*/**
!**/*Albums*/**
```
```
$ glop -f playlist.glop --randomize
```

## Install

```
npm i -g glob-playlist
```

## Usage

```
USAGE

  glop [pattern] [options]

OPTIONS

  -f, --file        Use file for pattern
  -t, --type        Playlist type: m3u
  -r, --randomize   Randomize
  -s, --sort        Sort by: [!]name|path (! to reverse)
  -c, --cache       Cache playlist and append to it (sort/randomize safe)
  --relative        use relative paths instead of absolute

EXAMPLES

  glop *.mp3
  glop -f celine.txt
```

