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
	// Legendary tier - BDE, absolute unit, pop culture
	{ description: "a legendary, radiating Big Dick Energy", sizeEmoji: "8==========D~~~" },
	{
		description: "an absolute unit (in awe at the size of this lad)",
		sizeEmoji: "8==========D~~~",
	},
	{ description: "a certified weapon of mass seduction", sizeEmoji: "8==========D~~~" },
	{ description: "a third leg situation, needs its own passport", sizeEmoji: "8==========D~~~" },
	{ description: "a Moby Dick (call me Ishmael)", sizeEmoji: "8==========D~~~" },
	{ description: "a 'hung like a horse, no cap' situation", sizeEmoji: "8==========D~~~" },

	// Impressive tier - meme references
	{ description: "a shower AND a grower, best of both worlds", sizeEmoji: "8========D~~" },
	{ description: "a 'that's a big boy' certified, no cap", sizeEmoji: "8========D~~" },
	{ description: "a certified chonker, an absolute unit of meat", sizeEmoji: "8========D~~" },
	{ description: "a 'respectfully, that's massive' situation", sizeEmoji: "8========D~~" },
	{ description: "a Magnum dong, monster condom certified", sizeEmoji: "8========D~~" },
	{ description: "an impressively large, top 1% sigma", sizeEmoji: "8========D~~" },

	// Average tier - balanced memes
	{ description: "perfectly balanced, as all things should be", sizeEmoji: "8======D~" },
	{ description: "a solidly mid-sized, it's giving average", sizeEmoji: "8======D~" },
	{ description: "standard issue, factory default settings", sizeEmoji: "8======D~" },
	{ description: "an NPC-tier, nothing special here", sizeEmoji: "8======D~" },
	{ description: "a mid-tier, not small but not impressive either", sizeEmoji: "8======D~" },
	{ description: "a regular-sized, nothing to write home about", sizeEmoji: "8======D~" },

	// Compact tier - short king energy
	{ description: "a 'trust me bro, it grows' sized", sizeEmoji: "8====D" },
	{ description: "a travel-sized, pocket edition", sizeEmoji: "8====D" },
	{ description: "compact but mighty, like a corgi", sizeEmoji: "8====D" },
	{ description: "a short king, crown still fits", sizeEmoji: "8====D" },
	{ description: "a 'it's average I swear' delulu", sizeEmoji: "8==D" },
	{ description: "a fun-sized, snack pack edition", sizeEmoji: "8==D" },

	// Microscopic tier - F in chat
	{ description: "a tragically tiny, minus 1000 aura", sizeEmoji: "8=D" },
	{ description: "hung like a hamster, but twice as energetic", sizeEmoji: "8=D" },
	{ description: "a 'where did it go?' tiny", sizeEmoji: "8D" },
	{ description: "an almost invisible, F in the chat", sizeEmoji: "8D" },
	{ description: "a blink-and-you-miss-it micro", sizeEmoji: "8D" },
	{ description: "an 'is it in yet?' sized", sizeEmoji: "8D" },
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
