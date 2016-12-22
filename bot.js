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
const omdb = require('omdb');
require("write-file-atomic");

logMsg("info", "Loaded all modules");

// Get all files
var auth = require('./data/auth.json');
var config = require("./data/config.json");
var replies = require("./data/replies.json");

logMsg("info", "Loaded all files");

// Vars
var version = "0.1.0";
const BOT_STATUS_UPDATE_DELAY = 30000;
const MAX_TTS_LENGTH = 140;
const EMBED_COLOR = 12697012;

var queues = {};
var voice = {};
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
	// Show a link to add Potato to another server
	"add": {
		do: function(bot, msg, args) {
			msg.channel.sendMessage("", {embed: {
				color: EMBED_COLOR,
				author: {
					name: "Click to add Potato to your server!",
					icon_url: bot.user.avatarURL,
					url: "https://discordapp.com/oauth2/authorize?client_id=233636104132231168&scope=bot&permissions=36826112"
				}
			}});
		},
		description: "Show a link so you can add the bot to your own server"
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
		description: "Block a user from executing a command"
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
	// Get a random cat fact
	"cat": {
		do: function(bot, msg, args) {
			msg.channel.startTyping();
			var factOptions = {
				host: "catfacts-api.appspot.com",
				path: "/api/facts"
			}

			var factCallback = function(factResponse) {
				factResponse.on('data', function(factChunk) {
					var fact = JSON.parse(factChunk).facts[0].toString();
					var imageOptions = {
						host: "random.cat",
						path: "/meow"
					}

					var imageCallback = function(imageResponse) {
						imageResponse.on('data', function(imageChunk) {
							var image = JSON.parse(imageChunk).file;
							msg.channel.sendMessage("", {embed: {
								color: 14920496,
								author: {
									name: "Cat Facts™",
									icon_url: "http://icons.iconarchive.com/icons/paomedia/small-n-flat/256/cat-icon.png",
									url: image
								},
								description: fact,
								image: {
									url: image
								},
								footer: {
									text: "meow!"
								}
							}});
						});
					}

					var imageReq = http.request(imageOptions, imageCallback).end();
				});
			};

			var factReq = http.request(factOptions, factCallback).end();
			msg.channel.stopTyping();
		},
		description: "Get a random cat fact and picture"
	},
	// Show the changelog
	"changelog": {
		do: function(bot, msg, args) {
			msg.reply("unfortunately this command is not yet implemented.");
		},
		description: "Shows the changelog"
	},
	// Sound effect: China
	"china": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/china.mp3");
		},
		description: "Plays the sound effect: Make america great again"
	},
	// Sound effect: Make america great again
	"choppa": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/choppa.mp3");
		},
		description: "Plays the sound effect: Choppa"
	},
	// Cricket sounds
	"crickets": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/crickets.mp3");
		},
		description: "Plays the sound effect: Crickets"
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
	// Sound effect from Unreal Tournament 2004
	"denied": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/denied.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
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
	// Palpatine saying do it
	"doit": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/do-it.mp3");
		},
		description: "Palpatine saying do it"
	},
	// Sound effect from Unreal Tournament 2004
	"dominating": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/dominating.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	// Sound effect from Unreal Tournament 2004
	"doublekill": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/double-kill.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	// Eval
	"eval": {
		do: function(bot, msg, args) {
			var startTime = now();
			if (msg.author.id !== auth.ownerid) {
				msg.reply(getReply("bad-access-level"));
				return;
			};

			var js = args.slice(1, args.length).join(' ');
			var output;
			try {
				output = eval(js);
				var endTime = now();
				msg.channel.sendMessage("", {embed: {
					color: 0x0CCA4A,
					author: {
						icon_url: bot.user.avatarURL,
						name: "Output"
					},
					description: output.toString(),
					timestamp: new Date(),
					footer: {
						text: (endTime - startTime).toFixed(0) + " ms"
					}
				}});
			} catch (e) {
				output = e;
				var endTime = now();
				msg.channel.sendMessage("", {embed: {
					color: 0xDB3A34,
					author: {
						icon_url: bot.user.avatarURL,
						name: "Output"
					},
					description: output.toString(),
					timestamp: new Date(),
					footer: {
						text: (endTime - startTime).toFixed(0) + " ms"
					}
				}});
			}
		},
		description: "If you're reading this, it's not for you"
	},
	// Sound effect: FUS RO DAH
	"fusrodah": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/fus-ro-dah.mp3");
		},
		description: "Plays the sound effect: FUS RO DAH"
	},
	// Github status
	"github": {
		do: function(bot, msg, args) {
			var options = {
				host: "status.github.com",
				path: "/api/last-message.json"
			}

			var callback = function(response) {
				response.setEncoding('utf8');
				response.on('data', function(chunk) {
					var last_message = JSON.parse(chunk);

					var timestamp = new Date(last_message.created_on);

					var statusColor = 0xDB3A34;
					var iconURL = "https://status.github.com/images/status-icon-red.png";

					if (last_message.status == "good") {
						statusColor = 0x0CCA4A;
						iconURL = "https://status.github.com/images/status-icon-green.png";
					} else if (last_message.status == "minor") {
						statusColor = 0xF29D50;
						iconURL = "https://status.github.com/images/status-icon-orange.png";
					}

					msg.channel.sendMessage("", {embed: {
						color: statusColor,
						author: {
							name: "GitHub Status",
							url: "https://status.github.com/"
						},
						description: last_message.body,
						timestamp: timestamp,
						footer: {
							icon_url: iconURL,
							text: 'Last update on'
						}
					}});
				});
			};

			var req = https.request(options, callback).end();


		},
		description: "Get GitHub status"
	},
	// Sound effect from Unreal Tournament 2004
	"godlike": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/godlike.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	// Sound effect: Ha GAYYYY
	"hagay": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/ha-gay.mp3");
		},
		description: "Sound effect: HA GAYYYY"
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
	// Sound effect from Unreal Tournament 2004
	"headshot": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/headshot.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	// Show help for each command
	"help": {
		do: function(bot, msg, args) {
			var text = "Here is a list for commands:\n";
			text += "Mention " + bot.user.toString() + " followed by a command.";
			text += "\n\n";
			for (var key in commands) {
				text += "`" + key + "` - **" + commands[key].description + "**\n";
			}

			msg.channel.sendMessage(text, {split:true}).catch(console.error);
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
	// Sound effect from Unreal Tournament 2004
	"holyshit": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/holy-shit.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	"itsatrap": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/its-a-trap.mp3");
		},
		description: "Admiral Akbar says \"It's a trap\""
	},
	// Sound effect from Unreal Tournament 2004
	"invulnerable": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/invulnerable.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
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

			logMsg('info', voiceChannel.guild.id + " (" + voiceChannel.guild.name + "): " + voiceChannel.id + " (" + voiceChannel.name + "): Joining voice channel");
			voiceChannel.join()
				.then(connection => {
					voice[msg.guild.id] = connection;
				})
				.catch(err => {
					msg.reply("I couldn't join the channel.");
				});
		},
		description: "Makes the bot join your voice channel"
	},
	// Just do it
	"justdoit": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/just-do-it.mp3");
		},
		description: "Just do it!"
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
	// Leaves the voice channel
	"leave": {
		do: function(bot, msg, args) {
			msg.channel.guild.voiceConnection.disconnect();
		},
		description: "Leaves a voice channel"
	},
	// Palpatine saying "Let the hate flow through you"
	"letthehate": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/let-the-hate-flow-through-you.mp3");
		},
		description: "Palpatine saying \"Let the hate flow through you\""
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
	// Sound effect: Make america great again
	"maga": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/maga.mp3");
		},
		description: "Plays the sound effect: Make america great again"
	},
	// Sound effect from Unreal Tournament 2004
	"megakill": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/megakill.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	// Sound effect from Unreal Tournament 2004
	"monsterkill": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/monsterkill.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	// Sound effect: nein
	"nein": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/nein.mp3");
		},
		description: "Plays the sound effect: nein"
	},
	// Sound effect: NI!
	"ni": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/ni.mp3");
		},
		description: "Plays the sound effect: NI!"
	},
	// Nuke a specified amount of messages
	"nuke": {
		do: function(bot, msg, args) {
			if (msg.author.id !== auth.ownerid) {
				msg.reply(getReply("bad-access-level"));
				return;
			};

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
	// Show info about a Netflix title
	"omdb": {
		do: function(bot, msg, args) {
			var title = args.splice(1, args.length).join('+');

			omdb.get(title, true, function(err, movie) {
				if (err || !movie) {
					msg.channel.sendMessage("Something went wrong. (Perhaps the title doesn't exist?)");
				} else {
					var displayTitle = movie.title + " (" + movie.year + ")";

					if (movie.type == "series") {
						if (movie.year.to != undefined) {
							displayTitle = movie.title + " (" + movie.year.from + "-" + movie.year.to + ")";
						} else {
							displayTitle = movie.title + " (" + movie.year.from + "-)";
						}
					}

					msg.channel.sendMessage("", {embed: {
						color: EMBED_COLOR,
						author: {
							name: displayTitle,
							icon_url: movie.poster,
							url: "http://www.imdb.com/title/" + movie.imdb.id
						},
						thumbnail: {
							url: movie.poster
						},
						description: movie.plot,
						fields: [
							{
								name: "Rating",
								value: ":star: " + movie.imdb.rating + "/10",
								inline: true
							}
						]
					}});
				}
			});
		},
		description: "Show info about a movie or series"
	},
	// Sound effect: I have osteoporosis
	"osteoporosis": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/osteoporosis.mp3");
		},
		description: "Plays the sound effect: I have osteoporosis"
	},
	// Pause the current audio stream
	"pause": {
		do: function(bot, msg, args) {
			pauseMusic(msg);
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
			msg.channel.sendMessage(getQueueMessage(msg))
				.then(message => {
				})
				.catch(e => {
					console.log(e);
				});
		},
		description: "Show the queue"
	},
	// Sound effect from Unreal Tournament 2004
	"rampage": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/rampage.mp3");
		},
		description: "Unreal Tournament 2004 sound effect"
	},
	// Resume the current audio stream
	"resume" : {
		do: function(bot, msg, args) {
			resumeMusic(msg);
		},
		description: "Resume playing music"
	},
	// Sound effect: That's retarded
	"retarded": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/retarded.mp3");
		},
		description: "Plays the sound effect: That's retarded"
	},
	// Sound effect: Sad trombone
	"sadtrombone": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/sad-trombone.mp3");
		},
		description: "Plays the sound effect: Sad trombone"
	},
	// Makes the bot use tts to say something
	"say": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return;
			}

			var text = args.splice(1, args.length).join(' ');

			if (text.length > MAX_TTS_LENGTH) {
				msg.reply("that's too long.");
				return;
			}

			tts(text, voiceChannel);
		},
		description: "Will say something in the voicechannel you are in"
	},
	// Display guild info
	"server": {
		do: function(bot, msg, args) {
			var guild = msg.guild;
			var fields = [];

			fields.push({
				name: "Owner",
				value: guild.owner.user.username + " #" + guild.owner.user.discriminator,
				inline: true
			});

			fields.push({
				name: "Created",
				value: guild.createdAt.toLocaleString(),
				inline: true
			});

			var onlineMembers = guild.members.filter(function(member) {
				if (member.presence.status != "offline") return true;
			}).size;

			fields.push({
				name: "Online members",
				value: onlineMembers + " / " + guild.memberCount + "",
				inline: true
			});

			fields.push({
				name: "Region",
				value: guild.region,
				inline: true
			});

			var textChannels = guild.channels.filter(function(channel) {
				if (channel.type == "text") return true;
			}).size;

			fields.push({
				name: "Text channels",
				value: textChannels,
				inline: true
			});

			var voiceChannels = guild.channels.filter(function(channel) {
				if (channel.type == "voice") return true;
			}).size;

			fields.push({
				name: "Voice channels",
				value: voiceChannels,
				inline: true
			});

			fields.push({
				name: "Roles",
				value: guild.roles.size,
				inline: true
			});

			fields.push({
				name: "Emoji",
				value: guild.emojis.size,
				inline: true
			});

			msg.channel.sendMessage("", {embed: {
				color: EMBED_COLOR,
				author: {
					name: guild.name
				},
				thumbnail: {
					url: guild.iconURL
				},
				description: "Server ID: " + guild.id,
				fields: fields,
				timestamp: new Date()
			}});
		},
		description: "Display server info"
	},
	// Skip the curretn song
	"skip": {
		do: function(bot, msg, args) {
			playNextInQueue(msg);
		},
		description: "Skip the current song"
	},
	// Sound effect: Don't be stupid be a smarty join the nazi party
	"smarty": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/be-a-smarty.mp3");
		},
		description: "Don't be stupid be a smarty come and join the nazi party"
	},
	// SHow bot stats
	"stats": {
		do: function(bot, msg, args) {
			var fields = [];

			fields.push({
				name: "Owner",
				value: "Bramskyyy #1706",
				inline: true
			});

			fields.push({
				name: "Uptime",
				value: secondsToHHMMSS(Math.round(bot.uptime / 1000)),
				inline: true
			});

			fields.push({
				name: "Users",
				value: getOnlineUsersCount(),
				inline: true
			});

			fields.push({
				name: "Servers",
				value: bot.guilds.size,
				inline: true
			});

			if (msg.author.id == auth.ownerid) {
				fields.push({
					name: "CPU usage",
					value: 'Unavailable',
					inline: true
				});

				fields.push({
					name: "Memory usage",
					value: Math.round(process.memoryUsage().rss / 1000000, -1) + " MB",
					inline: true
				});
			}

			msg.channel.sendMessage("", {embed: {
				color: EMBED_COLOR,
				author: {
					name: bot.user.username
				},
				thumbnail: {
					url: "http://i.imgur.com/IERDoA4.png"
				},
				description: bot.user.username + " v" + version,
				fields: fields,
				timestamp: new Date()
			}});
		},
		description: "Show stats for the bot"
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
	// Show a Ron Swanson quote
	"swanson": {
		do: function(bot, msg, args) {
			var options = {
				host: "ron-swanson-quotes.herokuapp.com",
				path: "/v2/quotes"
			}

			var callback = function(response) {
				response.on('data', function(chunk) {
					var quote = JSON.parse(chunk)[0].toString();

					msg.channel.sendMessage("", {embed: {
						color: 11240561,
						author: {
							name: "Ron Swanson",
							icon_url: "http://i.imgur.com/VTMQFUG.png",
							url: "https://en.wikipedia.org/wiki/Ron_Swanson"
						},
						description: quote
					}});
				});
			};

			var req = http.request(options, callback).end();
		},
		description: "Get a Ron Swanson quote"
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
	// Start listening to all channels again
	"unbind": {
		do: function(bot, msg, args) {
			msg.reply("unfortunately this command is not yet implemented.");
		},
		description: "Unbind the bot from any channel"
	},
	// Palpatine saying "Unlimited poweeeeeeer"
	"unlimitedpower": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/unlimited-power.mp3");
		},
		description: "Palpatine saying \"Unlimited poweeeeeeer\""
	},
	// Show info about a user
	"user": {
		do: function(bot, msg, args) {
			msg.channel.startTyping()

			if (msg.mentions.users.size != 2) {
				msg.reply(getReply("bad-command"));
				msg.channel.stopTyping();
				return;
			}

			var user = msg.mentions.users.array()[1];
			if (user.id == bot.user.id) user = msg.mentions.users.array()[0]
			var member = msg.guild.member(bot.users.get(user.id));
			updateLastSeen(user);

			var fields = [];

			fields.push({
				name: "ID",
				value: user.id,
				inline: true
			});

			fields.push({
				name: "Discriminator",
				value: "#" + user.discriminator,
				inline: true
			});

			var roles = member.roles.array();
			var rolesString = "";

			for (var i = 0; i < roles.length; i++) {
				rolesString += roles[i].name.unmention() + ", ";
			}

			fields.push({
				name: "Roles",
				value: rolesString.slice(0, -2)
			});

			fields.push({
				name: "Joined Discord",
				value: user.createdAt.toLocaleString(),
				inline: true
			});

			if (seen[user.id] != null && seen[user.id] != "") {
				var time = (Date.now() - seen[msg.author.id]) / 1000 | 0;
				if (time < 10) {
					time = "just now";
				} else {
					time = secondsToHHMMSS(time);
				}

				fields.push({
					name: "Last seen",
					value: time,
					inline: true
				});
			}

			if (user.presence.game) {
				fields.push({
					name: "Playing",
					value: user.presence.game.name
				});
			}

			msg.channel.sendMessage("", {embed: {
				color: EMBED_COLOR,
				author: {
					name: user.username,
					icon_url: user.avatarURL
				},
				thumbnail: {
					url: user.avatarURL
				},
				fields: fields
			}})
			.then(function() {
				msg.channel.stopTyping();
			});
			msg.channel.stopTyping();
		},
		description: "Show info about a user"
	},
	// Adjust the volume
	"volume": {
		do: function(bot, msg, args) {
			var volume = parseInt(args[1]);
			if (typeof volume === "number") {
				setVolume(msg, volume);
			}
		},
		description: "Set the volume"
	},
	// Sound effect: Great great wall
	"wall": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/wall.mp3");
		},
		description: "Plays the sound effect: I will build a wall"
	},
	// Sound effect: GTA V Wasted
	"wasted": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/wasted.mp3");
		},
		description: "Plays the sound effect: GTA V Wasted"
	},
	// Ned Stark says "Winter is coming"
	"winteriscoming": {
		do: function(bot, msg, args) {
			var voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.reply("you must be in a voice channel first.");
			}
			playFileInVoiceChannel(voiceChannel, "sound/winter-is-coming.mp3");
		},
		description: "Ned Stark says \"Winter is coming\""
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
	logMsg("error", "Serious error: " + e);
});

bot.on("message", function(msg) {
	// Handle message
	messageHandler(msg);
});

bot.on("presenceUpdate", function(oldMember, newMember) {
	if (newMember.presence.status == "offline") {
		seen[newMember.id] = Date.now() + "";
	}
});

bot.on('voiceStateUpdate', function(oldMember, newMember) {
	if (newMember.user.id == bot.user.id ||
		newMember.user.bot ||
		newMember.guild.id != "115880548303372297" ||
		newMember.voiceChannelID == oldMember.voiceChannelID) {
		return;
	}

	if (!newMember.voiceChannel || newMember.voiceChannelID == newMember.guild.afkChannelID || newMember.voiceChannel.userLimit != 0) {

		//Only actual users, no bots
		var realUsers = oldMember.voiceChannel.members.filter(function(member) {
			return !member.user.bot;
		});

		if (realUsers.size <= 1) {
			oldMember.voiceChannel.leave();
		} else {
			userLeftVoiceChannel(newMember, oldMember.voiceChannel);
		}
	} else {
		userJoinedVoiceChannel(newMember, newMember.voiceChannel);
	}
});

process.on("unhandledRejection", err => {
	logMsg('error', "Uncaught Promise Error: \n" + err.stack)
});

// Add a song to the queue
function addToQueue(msg, song) {
	if (!queues[msg.guild.id]) {
		queues[msg.guild.id] = {"songs": [], "queuemessageid": null};
	}

	queues[msg.guild.id].songs.push(song);

	msg.channel.sendMessage(getQueueMessage(msg))
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
	return bot.users.filter(function(user) {
		if (user.presence.status != "offline") return true;
	}).size;
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
	var log = now + " [" + priority.toUpperCase() + "] " + message;
	console.log(log);
	fs.appendFile('data/log.txt', log + '\n', function (err) {});
}

// Handle messages
function messageHandler(msg) {
	// Don't respond to yourself or other bots
	if (msg.author.bot || msg.author.id == bot.user.id) return;
	// Don't respond if we're not mentioned
	if (!msg.isMentioned(bot.user)) return;

	// Don't respond if there is text before the mention
	if (!msg.content.startsWith("<@" + bot.user.id + ">")) return;

	var args = msg.content.split(' ')
	args = args.splice(1, args.length);
	var cmd = commands[args[0]];
	// Command not found
	if (cmd == null) {
		msg.reply(getReply("bad-command"));
		return;
	}

	logMsg('info', msg.guild.id + " (" + msg.guild.name + "): " + msg.channel.id + " (" + msg.channel.name + "): " + msg.author.id + " (" + msg.author.username + "#" + msg.author.discriminator + "): " + msg.cleanContent);

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
	if (voiceChannel.guild.afkChannelID == voiceChannel.id) {
		return;
	}

	logMsg('info', voiceChannel.guild.id + " (" + voiceChannel.guild.name + "): " + voiceChannel.id + " (" + voiceChannel.name + "): Joining voice channel");
	voiceChannel.join()
		.then(connection => {
			logMsg('info', voiceChannel.guild.id + " (" + voiceChannel.guild.name + "): " + voiceChannel.id + " (" + voiceChannel.name + "): " + "Play " + file);
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

	logMsg('info', voiceChannel.guild.id + " (" + voiceChannel.guild.name + "): " + voiceChannel.id + " (" + voiceChannel.name + "): Joining voice channel");
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
		object = config;
		break;
	}
	fs.writeFile(file, JSON.stringify(object), function(err) {
		callback(err);
	});
}

function secondsToHHMMSS(totalSeconds) {
	var hours   = Math.floor(totalSeconds / 3600);
	var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
	var seconds = totalSeconds - (hours * 3600) - (minutes * 60);

	// round seconds
	seconds = Math.round(seconds * 100) / 100

	var result = (hours < 10 ? "0" + hours : hours);

	result += "h " + (minutes < 10 ? "0" + minutes : minutes);
	result += "m " + (seconds  < 10 ? "0" + seconds : seconds) + "s";

	return result;
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
	tts(newMember.user.username + ' joined the channel', voiceChannel);
}

// Do stuff when user leaves a voice channel
function userLeftVoiceChannel(newMember, voiceChannel) {
	tts(newMember.user.username + ' left the channel', voiceChannel);
}

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.unmention = function() {
	return this.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
}

if (config.env == "prod") bot.login(auth.api.discord.production);
if (config.env == "dev") bot.login(auth.api.discord.dev);
