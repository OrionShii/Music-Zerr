const Discord = require("discord.js");
const { Client, GatewayIntentBits, MessageEmbed } = require("discord.js");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const SpotifyWebApi = require("spotify-web-api-node");
const { getLyrics } = require("genius-lyrics-api");
const express = require("express");
const scdl = require("soundcloud-downloader").default;
const { GiphyFetch } = require("@giphy/js-fetch-api");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

const playlistsFilePath = path.resolve(__dirname, "playlists.json");
let playlists = {};

if (fs.existsSync(playlistsFilePath)) {
    try {
        const fileContent = fs.readFileSync(playlistsFilePath, "utf8");
        playlists = fileContent ? JSON.parse(fileContent) : {};
    } catch (error) {
        console.error("Error reading playlists file:", error);
    }
} else {
    fs.writeFileSync(playlistsFilePath, JSON.stringify(playlists, null, 2));
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let queue = [];
let history = [];
let isPlaying = false;
let currentSong = null;
let loop = false;
let volume = 1.0;
const player = createAudioPlayer();

const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyClientId,
    clientSecret: config.spotifyClientSecret,
});

const giphy = new GiphyFetch(config.giphyApiKey);

async function getSpotifyToken() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body["access_token"]);
    } catch (error) {
        console.error("Error getting Spotify token:", error);
    }
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    getSpotifyToken();
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "ping") {
        message.channel.send("Pong! The bot is online and responsive.");
    } else if (command === "play" || command === "p") {
        const query = args.join(" ");
        if (!query) {
            message.channel.send("Please provide a valid URL or song name.");
            return;
        }

        if (query.includes("spotify.com/track")) {
            await playSpotifyTrack(query, message);
        } else if (query.includes("spotify.com/playlist")) {
            await playSpotifyPlaylist(query, message);
        } else if (ytdl.validateURL(query)) {
            const songInfo = await ytdl.getInfo(query);
            const song = {
                url: query,
                title: songInfo.videoDetails.title,
                artist: songInfo.videoDetails.author.name,
            };
            queue.push(song);
            if (!isPlaying) {
                playNext(message);
            }
        } else if (query.includes("soundcloud.com")) {
            await playSoundCloudTrack(query, message);
        } else {
            await playYouTubeSearch(query, message);
        }
    } else if (command === "pause" || command === "stop") {
        player.pause();
        message.channel.send("Paused the music.");
    } else if (command === "resume" || command === "res") {
        player.unpause();
        message.channel.send("Resumed the music.");
    } else if (command === "skip" || command === "next") {
        skipToNext(message);
    } else if (command === "previous" || command === "prev") {
        skipToPrevious(message);
    } else if (command === "loop") {
        loop = true;
        message.channel.send("Looping the entire queue.");
    } else if (command === "unloop") {
        loop = false;
        message.channel.send("Stopped looping the queue.");
    } else if (command === "queue" || command === "q") {
        if (queue.length === 0) {
            message.channel.send("The queue is empty.");
            return;
        }

        // Embed for the current song
        if (currentSong) {
            const currentSongEmbed = new MessageEmbed()
                .setColor("BLUE")
                .setTitle("Now Playing")
                .setDescription(`${currentSong.title} by ${currentSong.artist}`)
                .setTimestamp();

            message.channel.send({ embeds: [currentSongEmbed] });
        }

        // Embeds for the queued songs
        let queueEmbeds = [];
        queue.forEach((song, index) => {
            const songEmbed = new MessageEmbed()
                .setColor("GREEN")
                .setTitle(`Queue #${index + 1}`)
                .setDescription(`${song.title} by ${song.artist}`)
                .setTimestamp();

            queueEmbeds.push(songEmbed);
        });

        message.channel.send({ embeds: queueEmbeds });
    } else if (command === "delete") {
        const index = parseInt(args[0], 10) - 1;
        if (isNaN(index) || index < 0 || index >= queue.length) {
            message.channel.send("Please provide a valid queue number.");
            return;
        }
        const removedSong = queue.splice(index, 1);
        message.channel.send(
            `Removed from queue: ${removedSong[0].title} by ${removedSong[0].artist}`,
        );
    } else if (command === "lyrics") {
        if (!currentSong) {
            message.channel.send("No song is currently playing.");
            return;
        }
        const options = {
            apiKey: config.geniusApiKey,
            title: currentSong.title,
            artist: currentSong.artist,
            optimizeQuery: true,
        };
        getLyrics(options)
            .then((lyrics) => {
                if (!lyrics) {
                    message.channel.send("No lyrics found.");
                } else {
                    message.channel.send(`Lyrics:\n${lyrics}`);
                }
            })
            .catch((err) => {
                console.error(err);
                message.channel.send(
                    "An error occurred while fetching lyrics.",
                );
            });
    } else if (command === "leave") {
        const connection = getVoiceConnection(message.guild.id);
        if (!connection) {
            message.channel.send("I'm not connected to any voice channel.");
            return;
        }
        connection.destroy();
        message.channel.send("Successfully left the voice channel.");
    } else if (command === "list" || command === "help") {
        const helpMessage = `
                           **Available Commands:**
                           - \`ping\`: Check if the bot is online and responsive.
                           - \`play\` or \`p\`: Play a song from YouTube, Spotify, or SoundCloud.
                           - \`pause\` or \`stop\`:Pause the currently playing song.
                           - \`resume\` or \`res\`: Resume the paused song.
                           - \`skip\` or \`next\`: Skip to the next song in the queue.
                           - \`previous\` or \`prev\`: Skip to the previous song in the queue.
                           - \`loop\`: Toggle looping of the entire queue.
                           - \`unloop\`: Stop looping the queue.
                           - \`queue\` or \`q\`: Display the current queue.
                           - \`delete\`: Delete a song from the queue.
                           - \`lyrics\`: Get the lyrics of the currently playing song.
                           - \`shuffle\`: Shuffle the current queue.
                           - \`volume\`: Set the volume level (1-100).
                           - \`quiz\`: Start a music quiz.
                           - \`saveplaylist\`: Save the current queue as a playlist.
                           - \`loadplaylist\`: Load a saved playlist.
                           - \`gif\`: Search for a GIF.
                           - \`leave\`: Make the bot leave the voice channel.

                           Usage: \`${config.prefix}<command>\`
                           `;
        message.channel.send(helpMessage);
    } else if (command === "shuffle") {
        shuffleQueue();
        message.channel.send("Shuffled the queue.");
    } else if (command === "volume") {
        const volumeArg = parseInt(args[0], 10);
        if (isNaN(volumeArg) || volumeArg < 1 || volumeArg > 100) {
            message.channel.send(
                "Please provide a volume level between 1 and 100.",
            );
            return;
        }
        setVolume(volumeArg / 100);
        message.channel.send(`Set volume to ${volumeArg}%`);
    } else if (command === "quiz") {
        quizzcord.startQuiz(message.channel);
    } else if (command === "saveplaylist") {
        const playlistName = args[0];
        if (!playlistName) {
            message.channel.send("Please provide a name for the playlist.");
            return;
        }

        playlists[playlistName] = queue.slice();
        try {
            fs.writeFileSync(
                playlistsFilePath,
                JSON.stringify(playlists, null, 2),
            );
            message.channel.send(`Playlist "${playlistName}" saved.`);
        } catch (error) {
            console.error("Error saving playlist:", error);
            message.channel.send(
                "An error occurred while saving the playlist.",
            );
        }
    } else if (command === "loadplaylist") {
        const playlistName = args[0];
        if (!playlistName || !playlists[playlistName]) {
            message.channel.send("Please provide a valid playlist name.");
            return;
        }

        queue = playlists[playlistName].slice(); // Load a copy of the playlist
        message.channel.send(`Playlist "${playlistName}" loaded.`);
        if (!isPlaying) {
            playNext(message);
        }
    } else if (command === "gif") {
        const query = args.join(" ");
        if (!query) {
            message.channel.send("Please provide a search term.");
            return;
        }

        const result = await giphy.search(query, { limit: 1 });
        if (result.data.length > 0) {
            message.channel.send(result.data[0].url);
        } else {
            message.channel.send("No GIF found.");
        }
    }
});

async function playSpotifyTrack(url, message) {
    const spotifyId = url.split("/").pop().split("?")[0];
    try {
        const trackData = await spotifyApi.getTrack(spotifyId);
        const trackName = trackData.body.name;
        const artistName = trackData.body.artists[0].name;

        const searchQuery = `${trackName} ${artistName} audio`;
        const searchResults = await ytSearch(searchQuery);
        if (searchResults && searchResults.videos.length > 0) {
            const youtubeUrl = searchResults.videos[0].url;
            const song = {
                url: youtubeUrl,
                title: trackName,
                artist: artistName,
            };
            queue.push(song);
            if (!isPlaying) {
                playNext(message);
            }
        } else {
            message.channel.send(
                "No matching YouTube video found for the Spotify track.",
            );
        }
    } catch (error) {
        console.error("Error playing Spotify track:", error);
        message.channel.send(
            "An error occurred while playing the Spotify track.",
        );
    }
}

async function playSpotifyPlaylist(url, message) {
    const playlistId = url.split("/").pop().split("?")[0];
    try {
        const playlistData = await spotifyApi.getPlaylist(playlistId);
        const tracks = playlistData.body.tracks.items;

        for (const item of tracks) {
            const track = item.track;
            const trackName = track.name;
            const artistName = track.artists[0].name;

            const searchQuery = `${trackName} ${artistName} audio`;
            const searchResults = await ytSearch(searchQuery);
            if (searchResults && searchResults.videos.length > 0) {
                const youtubeUrl = searchResults.videos[0].url;
                const song = {
                    url: youtubeUrl,
                    title: trackName,
                    artist: artistName,
                };
                queue.push(song);
            }
        }

        if (!isPlaying) {
            playNext(message);
        }
    } catch (error) {
        console.error("Error playing Spotify playlist:", error);
        message.channel.send(
            "An error occurred while playing the Spotify playlist.",
        );
    }
}

async function playSoundCloudTrack(url, message) {
    const songInfo = await scdl.getInfo(url);
    const song = {
        url: url,
        title: songInfo.title,
        artist: songInfo.user.username,
    };
    queue.push(song);
    if (!isPlaying) {
        playNext(message);
    }
}

async function playYouTubeSearch(query, message) {
    const searchResults = await ytSearch(query);
    if (searchResults && searchResults.videos.length > 0) {
        const youtubeUrl = searchResults.videos[0].url;
        const song = {
            url: youtubeUrl,
            title: searchResults.videos[0].title,
            artist: searchResults.videos[0].author.name,
        };
        queue.push(song);
        if (!isPlaying) {
            playNext(message);
        }
        message.channel.send(`Added to queue: ${song.title} by ${song.artist}`);
    } else {
        message.channel.send("No matching YouTube video found.");
    }
}

async function playNext(message) {
    if (queue.length === 0) {
        isPlaying = false;
        currentSong = null; // Reset currentSong jika antrian kosong
        message.channel.send("The queue is empty.");
        return;
    }

    if (!loop && currentSong) {
        history.push(currentSong);
    }

    const song = queue.shift();
    currentSong = song;
    isPlaying = true;

    const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
    });

    const stream = await ytdl(song.url, { filter: "audioonly" });
    const resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(volume);

    player.play(resource);
    connection.subscribe(player);

    player.once(AudioPlayerStatus.Idle, async () => {
        isPlaying = false;
        if (loop) {
            queue.push(currentSong);
        }
        // Use asyncio.sleep to prevent the bot from idling too long
        await new Promise((resolve) => setTimeout(resolve, 500));
        playNext(message);
    });

    message.channel.send(
        `Now playing: ${song.title} by ${song.artist}\n${song.url}`,
    );
}

function skipToNext(message) {
    player.stop();
    message.channel.send("Skipped to the next song.");
}

function skipToPrevious(message) {
    if (history.length === 0) {
        message.channel.send("No previous song to play.");
        return;
    }

    queue.unshift(currentSong);
    currentSong = history.pop();
    player.stop();
    message.channel.send("Skipped to the previous song.");
}

function shuffleQueue() {
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }
}

function setVolume(newVolume) {
    volume = newVolume;
    if (player.state.status === AudioPlayerStatus.Playing) {
        // Jika player sedang memutar, set volume langsung ke resource yang sedang diputar
        player.state.resource.volume.setVolume(newVolume);
    }
}

const app = express();

app.get("/", (req, res) => {
    res.send("Discord Music Bot Dashboard");
});

app.listen(3000, () => {
    console.log("Web dashboard running on port 3000");
});

client.login(config.token);
