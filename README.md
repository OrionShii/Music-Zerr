### Music Bot: Music-Zerr

**Bot Name:** Music-Zerr

**Short Description:**
Music-Zerr is a comprehensive Discord bot designed to elevate your music listening experience. It supports a variety of music streaming services and includes features for managing and interacting with music directly within your Discord server.

**Key Features:**

1. **Music Playback:**
   - **YouTube Streaming:** Stream music from YouTube using links or search terms.
   - **Spotify Integration:** Connect and play music from Spotify (requires additional setup).
   - **SoundCloud Support:** Stream music from SoundCloud.
   - **Queue Management:** Manage a dynamic playlist with the ability to add, skip, and remove songs.
   - **Playback Controls:** Commands for play, pause, resume, skip, stop, and more.
   - **Lyrics Display:** Retrieve and display lyrics for the current song using the Genius API (some features still under development).

![image](https://github.com/user-attachments/assets/add925a1-6438-4a0f-90a6-190fd7231d1f)

2. **Server Management:**
   - **Automated Moderation:** Includes tools for managing your server and moderating content.
   - **Custom Commands:** Create and execute custom commands to enhance server interaction.

3. **Interactive Commands:**
   - **Reaction Roles:** Assign roles based on user reactions.
   - **GIF Search:** Search and share GIFs directly within your server.

**Requirements:**
- **Discord Bot Token:** Required from the Discord Developer Portal.
- **Node.js:** Ensure you have Node.js installed.
- **Modules:** Install necessary modules like `discord.js`, `ytdl-core`, `yt-search`, etc.

**Setup Instructions:**
1. **Install Node.js:** Download and install Node.js from the [official website](https://nodejs.org/).
2. **Clone the Repository:** Clone the bot's repository from GitHub or download the files.
3. **Install Dependencies:** Run `npm install` to install the required Node.js modules.
4. **Configure the Bot:** Create a `config.json` file with your bot token and desired prefix.
5. **Run the Bot:** Start the bot using `node index.js`.

**Example Commands:**

1. **General Commands:**
   - **ping:** Check if the bot is online and responsive.  
     *Usage:* `!ping`
   - **play or p:** Play a song from YouTube, Spotify, or SoundCloud.  
     *Usage:* `!play <song name or URL>`
   - **pause or stop:** Pause the currently playing song.  
     *Usage:* `!pause`
   - **resume or res:** Resume the paused song.  
     *Usage:* `!resume`
   - **skip or next:** Skip to the next song in the queue.  
     *Usage:* `!skip`
   - **previous or prev:** Skip to the previous song in the queue.  
     *Usage:* `!previous`
   - **loop:** Toggle looping of the entire queue.  
     *Usage:* `!loop`
   - **unloop:** Stop looping the queue.  
     *Usage:* `!unloop`
   - **queue or q:** Display the current queue.  
     *Usage:* `!queue`
   - **delete:** Delete a song from the queue.  
     *Usage:* `!delete <song position>`
   - **lyrics:** Get the lyrics of the currently playing song.  
     *Usage:* `!lyrics`
   - **shuffle:** Shuffle the current queue.  
     *Usage:* `!shuffle`
   - **volume:** Set the volume level (1-100).  
     *Usage:* `!volume <level>`
   - **quiz:** Start a music quiz.  
     *Usage:* `!quiz`
   - **saveplaylist:** Save the current queue as a playlist.  
     *Usage:* `!saveplaylist <playlist name>`
   - **loadplaylist:** Load a saved playlist.  
     *Usage:* `!loadplaylist <playlist name>`
   - **gif:** Search for a GIF.  
     *Usage:* `!gif <search term>`
   - **leave:** Make the bot leave the voice channel.  
     *Usage:* `!leave`

**Current Status of Commands:**
- **Working Commands:** Commands for playing music, managing queues, and GIF searches are functional.
- **Non-Functional Commands:** Some commands like `lyrics`, `quiz`, and `volume` are currently under development and may experience errors or incomplete functionality.

**Known Issues:**
- **Lyrics:** The lyrics retrieval command may not work consistently due to integration issues.
- **Quiz:** The music quiz feature is in development and might not function as expected.
- **Volume Control:** Volume adjustments may not work properly and can cause the bot to crash.

**Summary:**
Music-Zerr is an all-encompassing music bot for Discord that provides a wide range of features for playing and managing music within your server. It offers robust queue management, integration with multiple music platforms, and interactive commands to enhance your server's music experience. Although some features are still being refined, Music-Zerr is a promising tool for any music-loving community on Discord.

---
Note: `This feature is currently in beta and still under development.`
**Note:** Some commands like `lyrics`, `quiz`, and `volume` are still under development and may not work properly. Efforts are being made to resolve these issues, and updates will be released soon.
