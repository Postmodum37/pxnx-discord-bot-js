import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	type Guild,
	type GuildMember,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import { logger } from "../../utils/logger";
import getRandomElement from "../../utils/randomElement";

const defaultEmojis = ["🍆", "😏", "🤣", "💀", "🔥", "👀", "😳", "🤏", "📏", "🏆"];

function getRandomEmoji(guild: Guild): string {
	const customEmojis = [...guild.emojis.cache.filter((e) => e.available).values()];
	if (customEmojis.length > 0) {
		return getRandomElement(customEmojis).toString();
	}
	return getRandomElement(defaultEmojis);
}

interface PeepeeSize {
	description: string;
	sizeEmoji: string;
}

const peepeeSizes: PeepeeSize[] = [
	// --- The Anomalies (Legendary) ---
    { description: "a biological threat to the server", 				sizeEmoji: "8================D~~~" },
    { description: "an absolute unit", 									sizeEmoji: "8===============D~~~" },
    { description: "a structural failure in reality", 					sizeEmoji: "8==============D~~" },
    { description: "genuinely alarming Big Dick Energy", 				sizeEmoji: "8=============D~~" },
    { description: "a weapon of mass seduction", 						sizeEmoji: "8============D~~" },
	{ description: "breaches the Geneva Convention", 					sizeEmoji: "8============D~~" },
    // --- The Problems (Impressive) ---
    { description: "illegal in 14 states and the UK", 					sizeEmoji: "8===========D~" },
    { description: "a heavy-duty industrial unit", 						sizeEmoji: "8=========D~" },
	{ description: "a certified chonker, an absolute unit of meat", 	sizeEmoji: "8========D~~" },
	{ description: "a bio-engineered meat sculpture", 					sizeEmoji: "8========D~~" },
	{ description: "a Magnum dong, monster condom certified",	 		sizeEmoji: "8========D~~" },
	{ description: "a 'that's a big boy' certified", 					sizeEmoji: "8========D~~" },
    { description: "a shower, a grower, and a fighter", 				sizeEmoji: "8========D~" },
    { description: "uncomfortably high-definition", 					sizeEmoji: "8=======D~" },
    // --- The Defaults (Average) ---
	{ description: "a shower AND a grower, best of both worlds", 		sizeEmoji: "8======D" },
    { description: "the factory default settings", 						sizeEmoji: "8======D" },
    { description: "aggressive mediocrity", 							sizeEmoji: "8=====D" },
    { description: "government-issued standard", 						sizeEmoji: "8====D" },
	{ description: "a 'trust me bro, it grows' sized", 					sizeEmoji: "8====D" },
	{ description: "optimized for aerodynamic performance",				sizeEmoji: "8====D" },
    // --- The Inconveniences (Small) ---
	{ description: "a polite, ergonomic suggestion",					sizeEmoji: "8===D" },
	{ description: "a 'it's average I swear' delulu", 					sizeEmoji: "8==D" },
    { description: "compact but high-latency", 							sizeEmoji: "8==D" },
    { description: "a short king's secret weapon", 						sizeEmoji: "8=D" },
    // --- The Existential (Micro) ---
	{ description: "a visual typo", 									sizeEmoji: "8D" },
    { description: "a low-polygon rendering", 							sizeEmoji: "8" },
    { description: "a rounding error in the simulation", 				sizeEmoji: "." },
    { description: "theoretical meat", 									sizeEmoji: " " },
];

function buildPeepeeEmbed(user: GuildMember): EmbedBuilder {
	const size = getRandomElement(peepeeSizes);

	return new EmbedBuilder()
		.setColor(0x5865f2)
		.setTitle("PeePee Inspection Time")
		.setDescription(`${user.displayName} has ${size.description} peepee!\n\n\`${size.sizeEmoji}\``)
		.setThumbnail(user.displayAvatarURL());
}

const command: ChatCommand = {
	data: new SlashCommandBuilder().setName("peepee").setDescription("Get your peepee size."),
	async execute(interaction: ChatInputCommandInteraction) {
		try {
			if (!interaction.guild) {
				await interaction.reply({
					content: "This command can only be used in a server.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const member = interaction.member as GuildMember;
			const embed = buildPeepeeEmbed(member);

			await interaction.reply({ embeds: [embed] });

			try {
				const message = await interaction.fetchReply();
				const emoji = getRandomEmoji(interaction.guild);
				await message.react(emoji);
			} catch (error) {
				logger.error("Failed to add reaction to peepee message", error as Error, {
					userId: interaction.user.id,
					guildId: interaction.guild.id,
				});
			}
		} catch (error) {
			logger.error("Peepee command failed", error as Error, {
				userId: interaction.user.id,
				guildId: interaction.guildId,
			});

			try {
				await interaction.reply({
					content: "Failed to execute peepee command.",
					flags: MessageFlags.Ephemeral,
				});
			} catch {
				// Reply already sent or interaction expired
			}
		}
	},
};

export default command;
