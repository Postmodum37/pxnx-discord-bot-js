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
	// --- The Anomalies (Legendary · 12) ---
	{ description: "a biological threat to the server", sizeEmoji: "8================D~~~" },
	{ description: "a low-clearance bridge problem", sizeEmoji: "8===============D~~~" },
	{ description: "a structural failure in reality", sizeEmoji: "8==============D~~" },
	{ description: "a reason to start a religion", sizeEmoji: "8=============D~~" },
	{ description: "a humanitarian crisis in sweatpants", sizeEmoji: "8============D~~" },
	{ description: "a terrible gift from a cruel God", sizeEmoji: "8============D~" },
	{ description: "a zoning-law violation", sizeEmoji: "8===========D~" },
	{ description: "a witness protection liability", sizeEmoji: "8===========D~" },
	{ description: "a chiropractor's retirement fund", sizeEmoji: "8==========D~" },
	{ description: "a restraining order in physical form", sizeEmoji: "8==========D~" },
	{ description: "a neighborhood evacuation notice", sizeEmoji: "8=========D~" },
	{ description: "an adults-only warning label", sizeEmoji: "8=========D~" },
	// --- The Defaults (Average · 22) ---
	{ description: "a factory default", sizeEmoji: "8======D" },
	{ description: "an aggressively mediocre", sizeEmoji: "8======D" },
	{ description: "a technically functional", sizeEmoji: "8======D" },
	{ description: "a government-issued standard", sizeEmoji: "8=====D" },
	{ description: "a chain restaurant special", sizeEmoji: "8=====D" },
	{ description: "a store brand", sizeEmoji: "8=====D" },
	{ description: "a standard issue, no extras", sizeEmoji: "8=====D" },
	{ description: "a participation award", sizeEmoji: "8====D" },
	{ description: "a no-refunds policy", sizeEmoji: "8====D" },
	{ description: "an honorable mention", sizeEmoji: "8====D" },
	{ description: "a lukewarm glass of tap water", sizeEmoji: "8====D" },
	{ description: "a perfectly serviceable sedan", sizeEmoji: "8====D" },
	{ description: "a mid-season filler episode", sizeEmoji: "8====D" },
	{ description: "a results-may-vary warranty", sizeEmoji: "8===D" },
	{ description: "a some assembly required", sizeEmoji: "8===D" },
	{ description: "a generous estimate", sizeEmoji: "8===D" },
	{ description: "a certified pre-owned", sizeEmoji: "8===D" },
	{ description: "a discount-bin special", sizeEmoji: "8===D" },
	{ description: "a floor-model special", sizeEmoji: "8===D" },
	{ description: "a terms and conditions apply", sizeEmoji: "8===D" },
	{ description: "a clearance rack find", sizeEmoji: "8===D" },
	{ description: "a demo version", sizeEmoji: "8===D" },
	// --- The Inconveniences (Small · 28) ---
	{ description: "a typo in the blueprint", sizeEmoji: "8==D" },
	{ description: "a don't-laugh challenge", sizeEmoji: "8==D" },
	{ description: "a free trial with ads", sizeEmoji: "8==D" },
	{ description: "an optical illusion", sizeEmoji: "8==D" },
	{ description: "a doctor's long pause", sizeEmoji: "8==D" },
	{ description: "a quiet apology to the world", sizeEmoji: "8==D" },
	{ description: "a disappointment but not a surprise", sizeEmoji: "8=D" },
	{ description: "a generational curse", sizeEmoji: "8=D" },
	{ description: "a personality doing heavy lifting", sizeEmoji: "8=D" },
	{ description: "a travel-size", sizeEmoji: "8=D" },
	{ description: "a compensation package required", sizeEmoji: "8=D" },
	{ description: "a reason to stay dressed", sizeEmoji: "8=D" },
	{ description: "an apology in advance", sizeEmoji: "8=D" },
	{ description: "a faith-based estimate", sizeEmoji: "8=D" },
	{ description: "a biological apology for my personality", sizeEmoji: "8=D" },
	{ description: "a speedbump on a highway", sizeEmoji: "8=D" },
	{ description: "a kickstand on a unicycle", sizeEmoji: "8=D" },
	{ description: "a why the lights stay off", sizeEmoji: "8=D" },
	{ description: "a loud exhaust pipe", sizeEmoji: "8D" },
	{ description: "a reverse puberty", sizeEmoji: "8D" },
	{ description: "a permanent before photo", sizeEmoji: "8D" },
	{ description: "a shrinkage defense", sizeEmoji: "8D" },
	{ description: "a why foreplay was invented", sizeEmoji: "8D" },
	{ description: "a wallet-assisted miracle", sizeEmoji: "8D" },
	{ description: "a hope you're funny at least", sizeEmoji: "8D" },
	{ description: "a cruel joke by Mother Nature", sizeEmoji: "8D" },
	{ description: "a reason he tips 30%", sizeEmoji: "8D" },
	{ description: "a tiny monument to failure", sizeEmoji: "8D" },
	// --- The Existential (Micro · 18) ---
	{ description: "a rounding error in the simulation", sizeEmoji: "8" },
	{ description: "a theoretical concept", sizeEmoji: "8" },
	{ description: "an administrative oversight", sizeEmoji: "8" },
	{ description: "a rumor that didn't spread", sizeEmoji: "8" },
	{ description: "a cruel trick of the light", sizeEmoji: "8" },
	{ description: "a biological prank by the universe", sizeEmoji: "8" },
	{ description: "an evolutionary dead end", sizeEmoji: "." },
	{ description: "a buffering dot", sizeEmoji: "." },
	{ description: "a vasectomy advertisement", sizeEmoji: "." },
	{ description: "a gene pool exit sign", sizeEmoji: "." },
	{ description: "a clerical error", sizeEmoji: "." },
	{ description: "a render distance issue", sizeEmoji: "." },
	{ description: "a statistical anomaly", sizeEmoji: " " },
	{ description: "a proof God has favorites", sizeEmoji: " " },
	{ description: "a footnote in the genome", sizeEmoji: " " },
	{ description: "a missing person report", sizeEmoji: " " },
	{ description: "a completely missing", sizeEmoji: " " },
	{ description: "a real tragedy of a", sizeEmoji: " " },
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
