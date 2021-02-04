const deepcopy = require('deepcopy');

class Starboard {
	constructor(channelID, guildID, options, manager) {
		this.channelID = channelID;
		this.guildID = guildID;
		this.options = options;
		this.manager = manager;
	}

	/**
	 * Gets the top of the most starred messages of this leaderboard
	 * @param {Discord.Snowflake} guildID
	 * @param {String} emoji
	 * @param {Number} count
	 */
	async leaderboard(count = 10) {
		const data = this.manager.starboards.find(s => s.guildID === this.guildID && s.options.emoji === this.options.emoji);
		if(!data) throw new Error('No starboard found for the parameters provided');

		const starChannel = this.manager.client.channels.cache.get(data.channelID);
		if (!starChannel) throw new Error(`The channel with id ${data.channelID} no longer exists or is not in the cache.`);

		const fetchedMessages = await starChannel.messages.fetch({ limit: 100 });

		return fetchedMessages
			.filter(m => m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.startsWith(this.options.emoji))
			.map(m => {
				const regex = new RegExp(`^${this.options.emoji}\\s([0-9]{1,3})\\s\\|\\s([0-9]{17,20})`);
				const star = regex.exec(m.embeds[0].footer.text);
				m.stars = parseInt(star[1]);
				if(m.embeds[0] && m.embeds[0].image && m.embeds[0].image.url) m.image = m.embeds[0] && m.embeds[0].image && m.embeds[0].image.url;
				return m;
			})
			.sort((a, b) => b.stars - a.stars)
			.slice(0, count);
	}

	/**
	 * Edit the current Starboard instance
	 * @param {Object} options
	 * @returns {Promise<Starboard>}
	 */
	edit(options = {}) {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async resolve => {

			const emoji = this.options.emoji;

			for(const element in options) {
				if(!Object.keys(this.options).includes(element)) return;
				this.options[element] = options[element];
			}

			// Call the db method
			await this.manager.editStarboard(this.channelID, emoji, this.toObject());
			resolve(this);
		});
	}


	/**
	 * Convert an instance of the Starboard class to a plain object
	 * @returns {Object}
	 */
	toObject() {
		return deepcopy({
			channelID: this.channelID,
			guildID: this.guildID,
			options: this.options,
		});
	}
}

module.exports = Starboard;