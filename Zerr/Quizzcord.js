const SpotifyWebApi = require("spotify-web-api-node");
const { shuffle } = require("lodash"); // Untuk mengacak array

class AdvancedMusicQuiz {
    constructor(options) {
        this.spotifyApi = new SpotifyWebApi({
            clientId: options.clientId,
            clientSecret: options.clientSecret,
        });
    }

    async startQuiz(channel) {
        try {
            // Mendapatkan daftar lagu acak dari Spotify
            const tracks = await this.getRandomTracks();
            if (!tracks || tracks.length === 0) {
                channel.send("Tidak dapat menemukan lagu untuk quiz saat ini.");
                return;
            }

            // Memilih lagu secara acak dari daftar lagu
            const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

            // Memeriksa informasi tentang lagu yang dipilih
            const trackInfo = await this.getTrackInfo(randomTrack.id);

            // Membuat pertanyaan-pertanyaan berdasarkan lagu yang dipilih
            const questions = this.generateQuestions(trackInfo);

            // Mengirimkan pertanyaan-pertanyaan ke saluran Discord
            questions.forEach((question, index) => {
                channel.send(`Question ${index + 1}: ${question}`);
            });
        } catch (error) {
            console.error("Error starting music quiz:", error);
            channel.send("Terjadi kesalahan saat memulai kuis musik.");
        }
    }

    async getRandomTracks() {
        try {
            // Mendapatkan lagu-lagu acak dari Spotify
            const response = await this.spotifyApi.getFeaturedPlaylists();
            const playlists = response.body.playlists.items;
            const randomPlaylist = playlists[Math.floor(Math.random() * playlists.length)];
            const playlistTracks = await this.spotifyApi.getPlaylistTracks(randomPlaylist.id);
            return playlistTracks.body.items;
        } catch (error) {
            console.error("Error getting random tracks:", error);
            return null;
        }
    }

    async getTrackInfo(trackId) {
        try {
            // Mendapatkan informasi tentang lagu dari Spotify
            const response = await this.spotifyApi.getTrack(trackId);
            return response.body;
        } catch (error) {
            console.error("Error getting track info:", error);
            return null;
        }
    }

    generateQuestions(trackInfo) {
        // Membuat array pertanyaan berdasarkan informasi lagu
        const questions = [];
        if (trackInfo.name && trackInfo.artists && trackInfo.artists.length > 0) {
            questions.push(`What is the title of this song?`);
            questions.push(`Who is the artist of this song?`);
            questions.push(`In what year was this song released?`);
            questions.push(`What album does this song belong to?`);
            questions.push(`What genre does this song belong to?`);
        }
        return shuffle(questions);
    }
}

module.exports = AdvancedMusicQuiz;
