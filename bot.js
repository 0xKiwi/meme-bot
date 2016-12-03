// Get all modules
const dateUtils = require("date-util")
const Discord = require("discord.js");
const fs = require("fs");
const path = require('path');
const http = require('http');
const https = require('https');
const urlParse  = require('url').parse;
const now = require("performance-now");
const YouTube = require('youtube-node');
const ytdl = require("ytdl-core");
const googleTTS = require('google-tts-api');
require("write-file-atomic");

logMsg("info", "Loaded all modules");

// Get all files
var auth = require('./data/auth.json');
var configs = require("./data/config.json");
var replies = require("./data/replies.json");

logMsg("info", "Loaded all files");

// Vars
var version = "0.1.0";
const BOT_STATUS_UPDATE_DELAY = 30000;
const MAX_TTS_LENGTH = 140;

var queues = {};
var servers = {};
var seen = [];

// Commands
var commands = {
	// Sound effect: Smoke weed everyday
	"420blazeit": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/smoke-weed-everyday.mp3");
		},
		description: "Plays the sound effect: Smoke weed everyday"
	},
	// Sound effect: IT'S ALIIIIIVE!!!
	"alive": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/its-alive.mp3");
		},
		description: "Plays the sound effect: IT'S ALIIIIIVE!!!"
	},
	// Only listens to a specific channel
	"bind": {
		do: function(bot, msg, args) {
			msg.reply("unfortunately this command is not yet implemented.");
		},
		description: "The bot will only interact with messages in this text channel"
	},
	// Block a user
	"block": {
		do: function(bot, msg, args) {
			msg.reply("unfortunately this command is not yet implemented.");
		},
		description: "Block a user from executing commands"
	},
	// Sound effect: Brutal, savage, rekt
	"bsr": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/brutal-savage-rekt.mp3");
		},
		description: "Plays the sound effect: Brutal, savage, rekt"
	},
	// Show the changelog
	"changelog": {
		do: function(bot, msg, args) {
			msg.reply("unfortunately this command is not yet implemented.");
		},
		description: "Shows the changelog"
	},
	// Sound effect: Deez nuts! Ha! Got 'em! Ha!'
	"deeznuts": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/deez-nuts.mp3");
		},
		description: "Plays the sound effect: Deez nuts! Ha! Got em!"
	},
	// Sound effect: I have crippling depression
	"depression": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/crippling-depression.mp3");
		},
		description: "Plays the sound effect: I have crippling depression"
	},
	// Sound effect: Haha!
	"haha": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/nelson-haha.mp3");
		},
		description: "Plays the sound effect: Haha!"
	},
	// Show help for each command
	"help": {
		do: function(bot, msg, args) {
			msg.reply("ask here for help: https://discord.gg/E4m8QJh");
		},
		description: "Seriously?"
	},
	// Greets the author
	"hi": {
		do: function(bot, msg, args) {
			msg.channel.sendMessage(getReply("greeting").capitalizeFirstLetter() + ", " + msg.author);
		},
		description: "Greets you"
	},
	// Sound effect: My name is jeff
	"jeff": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/jeff.mp3");
		},
		description: "Plays the sound effect: My name is Jeff"
	},
	// Joins the voice channel the author is in
	"join": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			voiceChannel.join()
				.then(connection => {
					voice[msg.guild.id] = connection;
					msg.delete();
				})
				.catch(err => {
					msg.reply("I couldn't join the channel.");
				});
		},
		description: "Makes the bot join your voice channel"
	},
	// Sound effect: Leeroy Jenkins!
	"leeroy": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/leeroy-jenkins.mp3");
		},
		description: "Plays the sound effect: Leeroy Jenkins!"
	},
	// Makes the bot use tts to say something
	"say": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return;
			}

			var text = args.splice(1, args.length).join(' ');

			tts(text, voiceChannel);
		},
		description: "Will join the voice channel you are in"
	},
	// Last seen
	"seen": {
		do: function(bot, msg, args) {
			var user = msg.mentions.users.array()[1];

			updateLastSeen(user);

			if (seen[user.id] == null || seen[user.id] == "") {
				msg.reply("I've never seen that user.");
			} else {
				msg.reply("they were last seen on " + seen[user.id]);
			}
		},
		description: "Shows when a user was last seen"
	},
	// Leaves the voice channel
	"leave": {
		do: function(bot, msg, args) {
			msg.channel.guild.voiceConnection.disconnect();
			msg.delete(3000);
		},
		description: "Leaves a voice channel"
	},
	// Is only a game, why you heff to be mad
	"mad": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/mad.mp3");
		},
		description: "Plays the sound effect: Id only a game. Why you heff to be mad"
	},
	// Nuke a specified amount of messages
	"nuke": {
		do: function(bot, msg, args) {
			let messagecount = parseInt(args[1]) + 1;
			msg.channel.fetchMessages({limit: messagecount})
				.then(msgs => msg.channel.bulkDelete(msgs));
		},
		description: "Remove messages in bulk"
	},
	// Bruce says oh no!
	"ohno": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/ohno.mp3");
		},
		description: "Plays the sound effect: Oh no!"
	},
	// Pause the current audio stream
	"pause": {
		do: function(bot, msg, args) {
			pauseMusic(msg);
			msg.delete(3000);
		},
		description: "Pause music playback"
	},
	// Pong!
	"ping": {
		do: function(bot, msg, args) {
			var startTime = now();
			msg.channel.sendMessage('Pong!')
				.then(msg => {
					var endTime = now();
					return msg.edit('Pong! Took ' + (endTime - startTime).toFixed(0) + ' ms.');
				}).catch(console.error);
		},
		description: "Pong!"
	},
	// Plays a song from YouTube
	"play": {
		do: function(bot, msg, args) {
			msg.delete(5000);
			var song = {};

			// Handle links
			if (args[1].startsWith("https://") || args[1].startsWith("http://")) {
				song.id = args[1].substr(args[1].length - 11);

				youtube.getById(song.id, function(error, result) {
					if (error) {
						console.log(error);
					}
					else {
						song.title = result["items"][0]["snippet"]["title"];
						addToQueue(msg, song);
					}
				});
			}
			else {
				// Handle searches
				var query = args.join(' ');
				youtube.search(query, 1, function(error, result) {
					if (error) {
						console.log(error);
					}
					else {
						song.id = result["items"][0]["id"]["videoId"];
						song.title = result["items"][0]["snippet"]["title"];
						addToQueue(msg, song);
					}
				});
			}
		},
		description: "Play a YouTube song"
	},
	// Wacth your profamity
	"profamity": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/profamity.mp3");
		},
		description: "Plays the sound effect: Watch yo profamity"
	},
	// Shows the current queue
	"queue": {
		do: function(bot, msg, args) {
			msg.delete(2000);
			msg.channel.sendMessage(getQueueMessage(msg))
				.then(message => {
					message.delete(60000);
				})
				.catch(e => {
					console.log(e);
				});
		},
		description: "Show the queue"
	},
	// Resume the current audio stream
	"resume" : {
		do: function(bot, msg, args) {
			resumeMusic(msg);
			msg.delete(3000);
		},
		description: "Resume playing music"
	},
	// Skip the curretn song
	"skip": {
		do: function(bot, msg, args) {
			playNextInQueue(msg);
			msg.delete(3000);
		},
		description: "Skip the current song"
	},
	// Allows the user to set a timer.
	// Takes the first argument as a time in seconds
	"timer": {
		do: function(bot, msg, args) {
			var time = args[1];
			if (isNaN(time)) {
				msg.reply("That's not a fucking number... Idiot.");
				return;
			}

			msg.reply("I will remind you in " + time + " seconds.");

			setTimeout(function () {
				msg.channel.sendTTSMessage(msg.author.toString() + ", your timer is done!");
			}, time * 1000);
		},
		description: "Set a timer"
	},
	// Alias for join
	"summon": {
		do: function(bot, msg, args) {
			commands["join"].do(bot, msg, args);
		},
		description: "Alias for join"
	},
	// Sound effect: Surprise motherfucka
	"surprise": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/surprise-motherfucker.mp3");
		},
		description: "Plays the sound effect: Surprise motherfucker"
	},
	// Start listening to all channels again
	"unbind": {
		do: function(bot, msg, args) {
			msg.reply("unfortunately this command is not yet implemented.");
		},
		description: "Unbind the bot from any channel"
	},
	// Adjust the volume
	"volume": {
		do: function(bot, msg, args) {
			var volume = parseInt(args[1]);
			if (typeof volume === "number") {
				setVolume(msg, volume);
				msg.delete(3000);
			}
		},
		description: "Set the volume"
	}
};

// Init bot and modules
var bot = new Discord.Client();
var youtube = new YouTube();
youtube.setKey(auth.api.youtube);

bot.on("ready", function() {
	logMsg("info", "Started " + bot.user.username + " v" + version);
	setInterval(function() {
		var game = getReply("game");
		if (game.indexOf("{{ servers }}") > -1) {
			game = game.replace("{{ servers }}", bot.guilds.array().length);
		}
		if (game.indexOf("{{ users }}") > -1) {
			game = game.replace("{{ users }}", getOnlineUsersCount());
		}
		bot.user.setPresence({game: {name: game}, status: "online"})
			.catch(e => {
				logMsg("error", "Could not set status: " + e);
			});
	}, BOT_STATUS_UPDATE_DELAY);
});

bot.on("disconnect", () => {
	logMsg("error", "Lost connection!");
});

bot.on("reconnecting", () => {
	logMsg("info", "Trying to reconnect");
});

bot.on("error", (e) => {
	logMsg("error", "Serious connection error: " + e);
});

bot.on("message", function(msg) {
	// Handle message
	messageHandler(msg);
});

bot.on("presenceUpdate", function(oldMember, newMember) {
	if (newMember.presence.status == "offline") {
		seen[newMember.id] = new Date().toLocaleString();
	}
});

bot.on('voiceStateUpdate', function(oldMember, newMember) {
	if (newMember.user.id == bot.user.id) {
		return;
	}

	var voiceChannel = newMember.voiceChannel;

	if (!voiceChannel || newMember.voiceChannelID == newMember.guild.afkChannelID || voiceChannel.userLimit != 0) {
		userLeftVoiceChannel(newMember, oldMember.voiceChannel);
	} else {
		userJoinedVoiceChannel(newMember, voiceChannel);
	}
});

// Add a song to the queue
function addToQueue(msg, song) {
	if (!queues[msg.guild.id]) {
		queues[msg.guild.id] = {"songs": [], "queuemessageid": null};
	}

	queues[msg.guild.id].songs.push(song);

	msg.channel.sendMessage(getQueueMessage(msg))
		.then(message => {
			message.delete(10000);
		})
		.catch(e => {
			console.log(e);
		});

	if (queues[msg.guild.id].songs.length == 1) {
		playNextInQueue(msg);
	}
}

// Check if file exists
function doesFileExist(file) {
	try {
		fs.accessSync(file, fs.F_OK);
	} catch (e) {
		return false
	}

	return true;
}

// Download TTS mp3
function downloadTTS(url, dest) {
	return new Promise(function (resolve, reject) {
		var info = urlParse(url);
		var httpClient = info.protocol === 'https:' ? https : http;
		var options = {
			host: info.host,
			path: info.path,
			headers: {
				'user-agent': 'WHAT_EVER'
			}
		};

		httpClient.get(options, function(res) {
			// check status code
			if (res.statusCode !== 200) {
				reject(new Error('request to ' + url + ' failed, status code = ' + res.statusCode + ' (' + res.statusMessage + ')'));
				return;
			}

			var file = fs.createWriteStream(dest);
			file.on('finish', function() {
				// close() is async, call resolve after close completes.
				file.close(resolve);
			});
			file.on('error', function (err) {
				// Delete the file async. (But we don't check the result)
				fs.unlink(dest);
				reject(err);
			});

			res.pipe(file);

		})
		.on('error', function(err) {
			reject(err);
		})
		.end();
	});
}

// Get the number of online users
function getOnlineUsersCount() {
	var amount = 0;
	var guilds = bot.guilds.array();
	for (var i = 0; i < guilds.length; i++) {
		var members = guilds[i].members.array();
		for (var j = 0; j < members.length; j++) {
			if (members[j].user.status == "online" && !members[j].user.bot) {
				amount++;
			}
		}
	}

	if (amount <= 1) {
		amount = "a couple";
	}

	return amount;
}

// Get the string for the queue message
function getQueueMessage(msg) {
	if (!queues[msg.guild.id] || queues[msg.guild.id].songs.length < 1) {
		return "There are no songs in the queue!";
	}
	var songs = queues[msg.guild.id].songs
	var string = "Currently playing: **" + songs[0].title + "**\n\n";
	if (songs.length > 1) {
		string += "**These songs are next in queue:**\n"
		for (var i = 1; i < songs.length; i++) {
			string += "**" + i + ".** " + songs[i].title + "\n";
		}
	}
	return string;
}

// Gets a random reply
function getReply(type) {
	var rs = replies[type];
	return rs[parseInt(Math.random() * rs.length)];
}

// Logs a message to the console
function logMsg(priority, message) {
	var now = new Date().format("yyyy-mm-dd HH:MM:ss.l");
	console.log(now + " [" + priority.toUpperCase() + "] " + message);
}

// Handle messages
function messageHandler(msg) {
	// Don't respond to yourself or other bots
	if (msg.author.not || msg.author.id == bot.user.id) {
		return;
	}

	// Don't respond if we're not mentioned
	if (!msg.isMentioned(bot.user)) {
		return;
	}

	var args = msg.content.split(' ')
	args = args.splice(1, args.length);
	var cmd = commands[args[0]];
	// Command not found
	if (cmd == null) {
		msg.reply(getReply("bad-command"));
		return;
	}

	try {
		cmd.do(bot, msg, args);
	} catch (e) {
		logMsg("error", "Something went wrong executing command '" + args[0] + "': " + e);
	}
}

// Pauses the music player
function pauseMusic(msg) {
	if (!voice[msg.guild.id]) {
		return;
	} else {
		voice[msg.guild.id].dispatcher.pause();
	}
}

function playFileInVoiceChannel(voiceChannel, file) {
	voiceChannel.join()
		.then(connection => {
			const dispatcher = connection.playFile(file);
		})
		.catch(err => {
			console.error(err);
		});
}

// Play the next song in queue
function playNextInQueue(msg) {
	const streamOptions = { volume: 0.15 };
	var voiceChannel = msg.member.voiceChannel;
	if (!voiceChannel) {
		return msg.reply("you must be in a voice channel first.");
	}

	voiceChannel.join()
		.then(connection => {
			if (!voice[msg.guild.id]) {
				voice[msg.guild.id] = {};
			} else {
				voice[msg.guild.id].connection = connection;
			}

			var song = queues[msg.guild.id].songs[0];

			if (song == null) {
				return;
			}

			const stream = ytdl("https://www.youtube.com/watch?v=" + song.id, {filter : 'audioonly'})
			var dispatcher = connection.playStream(stream, streamOptions)
				.on("end", () => {
					var songs = queues[msg.guild.id].songs;
					songs = songs.splice(1, songs.length);
					queues[msg.guild.id].songs = songs;

					playNextInQueue(msg);
				})
				.on("error", (e) => {
					logMsg("error", "the streamdispatcher encountered an error: " + e);
				});
			voice[msg.guild.id].dispatcher = dispatcher;
		})
		.catch(e => {
			logMsg("error", e);
		})
}

// Resumes the music player
function resumeMusic(msg) {
	if (!voice[msg.guild.id]) {
		return;
	} else {
		voice[msg.guild.id].dispatcher.resume();
	}
}

// Write an updated .json file to disk
function saveData(file, callback) {
	var object;
	switch(file) {
		case "./data/config.json":
		object = configs;
		break;
	}
	fs.writeFile(file, JSON.stringify(object), function(err) {
		callback(err);
	});
}

// Adjust the volume
function setVolume(msg, volume) {
	if (!voice[msg.guild.id]) {
		return;
	} else {
		voice[msg.guild.id].dispatcher.setVolume(volume / 100);
	}
}

// Text to speech
function tts(text, voiceChannel) {
	if (text.length > MAX_TTS_LENGTH) {
		return;
	}

	var filename = text.replace(/\s+/g, '-').toLowerCase();
	var dest = 'tts/' + filename + '.mp3';

	if (doesFileExist(dest)) {
		playFileInVoiceChannel(voiceChannel, dest);
		return;
	} else {
		googleTTS(text)
			.then(function (url) {
				var dest_path = path.resolve(__dirname, dest); // file destination
				return downloadTTS(url, dest_path);
			})
			.then(function () {
				playFileInVoiceChannel(voiceChannel, dest);
			})
			.catch(function (err) {
				console.error(err.stack);
			});
	}
}

// Update last seen time
function updateLastSeen(user) {
	if (user.presence.status != "offline") {
		seen[user.id] = new Date().toLocaleString();
	}
}

// Do stuff when user joins a voice channel
function userJoinedVoiceChannel(newMember, voiceChannel) {
	tts(newMember.user.username + ' joined the channel.', voiceChannel);
}

// Do stuff when user leaves a voice channel
function userLeftVoiceChannel(newMember, voiceChannel) {
	tts(newMember.user.username + ' left the channel.', voiceChannel);
}

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

bot.login(auth.api.discord);
