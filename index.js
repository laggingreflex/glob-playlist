#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const glob = require('globby');
const parseFile = require('parse-gitignore');
const yargs = require('yargs');
const shortid = require('shortid');
const open = require('opn');
const shuffle = require('shuffle-array');
const exit = process.exit;

const args = yargs.options({
  file: {
    alias: 'f',
    type: 'string',
  },
  player: {
    alias: 'p',
    type: 'string',
  },
  root: {
    type: 'string',
    default: process.cwd(),
  },
  type: {
    alias: 't',
    type: 'string',
    default: 'm3u',
  },
  relative: {
    type: 'boolean',
    default: false,
  },
  randomize: {
    alias: ['r', 'random'],
    type: 'boolean',
    default: false,
  },
  sort: {
    alias: 's',
    type: 'string',
  },
  cache: {
    alias: 'c',
    type: 'boolean',
  },
}).argv

if (args.file) {
  // const file = fs.readFileSync(args.file, 'utf8');
  args._ = parseFile(args.file);
}

if (!args._.length) {
  console.log('Playing all files in', path.join(args.root, '*.*'));
  args._ = ['*.*']
}

const pattern = args._.filter(p => !p.startsWith('!'));
const ignoredPattern = args._.filter(p => p.startsWith('!')).map(p => p.substr(1));

console.log('Searching files...')
let paths = glob.sync(pattern, {
  root: args.root,
  matchBase: true,
  nodir: true,
  ignore: ignoredPattern,
});
console.log(paths.length + ' files found.');

if (!args.relative) {
  paths = paths.map(p => path.join(args.root, p));
}

let playlist = paths.map(path => {
  switch (args.type) {
    case 'm3u':
      return path;
    default:
      console.error('Unsupported playlist type:', args.type);
      exit(2);
  }
})

let playlistFile;
let tmpPlaylistFile = 'glob-playlist_' + shortid.generate() + '.' + args.type;
if (args.cache) {
  if (typeof args.cache === 'string') {
    playlistFile = args.cache;
  } else {
    playlistFile = 'glob-playlist' + '.' + args.type;
  }
}

let existingPlaylist;
if (playlistFile) {
  try {
    existingPlaylist = fs.readFileSync(playlistFile, 'utf8');
  } catch (err) {}
  if (existingPlaylist) {
    const newPlaylist = [];
    existingPlaylist.split(/[\n\r]+/g).forEach(el => {
      if (playlist.includes(el)) {
        newPlaylist.push(el);
      }
    });
    playlist.forEach(el => {
      if (!newPlaylist.includes(el)) {
        newPlaylist.push(el);
      }
    });
    playlist = newPlaylist
  }
}

if (playlistFile) {
  fs.writeFileSync(playlistFile, playlist.join('\n'));
  console.log('Written', playlistFile)
}

if (args.randomize) {
  playlist = shuffle(playlist);
  console.log('Randomized');
}

if (args.sort) {
  console.log('Sorting...');
  let reverse = 1;
  if (args.sort.startsWith('!')) {
    reverse = -1;
    args.sort = args.sort.substr(1);
  }
  playlist = playlist.sort((a, b) => {
    switch (args.sort) {
      case 'name':
      case 'filename':
      case 'title':
        a = path.basename(a);
        b = path.basename(b);
      case 'path':
      case '':
        return reverse * (a > b ? 1 : a < b ? -1 : 0);
      default:
        console.error('Unsupported sort method:', args.sort);
        exit(2);
    }
  })
  console.log('Sorted');
}

fs.writeFileSync(tmpPlaylistFile, playlist.join('\n'));

console.log('Opening...');
open(tmpPlaylistFile).then(cleanup);

process.once('exit', cleanup);
process.once('SIGINT', cleanup);
process.once('uncaughtException', cleanup);

function cleanup() {
  try { fs.unlinkSync(tmpPlaylistFile) } catch (error) {}
}

function printUsage() {
  console.log(`
    USAGE

      glop [pattern|file]

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
  `);
}
