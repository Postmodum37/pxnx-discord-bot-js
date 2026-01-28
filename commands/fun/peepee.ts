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
	{ description: "a biological threat to the server", sizeEmoji: "8================D~~~" },
	{ description: "an absolute unit", sizeEmoji: "8===============D~~~" },
	{ description: "a structural failure in reality", sizeEmoji: "8==============D~~" },
	{ description: "a weapon of mass seduction", sizeEmoji: "8=============D~~" },
	{ description: "a Geneva Convention violation", sizeEmoji: "8============D~~" },
	{ description: "a genuinely concerning", sizeEmoji: "8============D~~" },
	{ description: "a legally questionable", sizeEmoji: "8===========D~" },
	{ description: "a not my business but damn", sizeEmoji: "8===========D~" },
	{ description: "a conversation starter", sizeEmoji: "8==========D~" },
	{ description: "a priest's wet dream", sizeEmoji: "8==========D~" },
	{ description: "a why she stayed", sizeEmoji: "8=========D~" },
	{ description: "an alimony worthy", sizeEmoji: "8=========D~" },
	{ description: "a not suitable for children", sizeEmoji: "8========D~" },
	{ description: "a keep out of reach", sizeEmoji: "8========D~" },
	{ description: "a handle with care", sizeEmoji: "8=======D~" },
	// --- The Defaults (Average) ---
	{ description: "a factory default settings", sizeEmoji: "8======D" },
	{ description: "an aggressive mediocrity", sizeEmoji: "8======D" },
	{ description: "a government-issued standard", sizeEmoji: "8=====D" },
	{ description: "an it is what it is", sizeEmoji: "8=====D" },
	{ description: "an unapologetically mid", sizeEmoji: "8=====D" },
	{ description: "a questionable at best", sizeEmoji: "8====D" },
	{ description: "a take it or leave it", sizeEmoji: "8====D" },
	{ description: "an honorable mention", sizeEmoji: "8====D" },
	{ description: "a participation award", sizeEmoji: "8====D" },
	{ description: "an up for interpretation", sizeEmoji: "8===D" },
	{ description: "a your mileage may vary", sizeEmoji: "8===D" },
	{ description: "a generous estimate", sizeEmoji: "8===D" },
	{ description: "a some assembly required", sizeEmoji: "8===D" },
	{ description: "a refurbished", sizeEmoji: "8===D" },
	{ description: "a temu special", sizeEmoji: "8===D" },
	// --- The Inconveniences (Small) ---
	{ description: "a visual typo", sizeEmoji: "8==D" },
	{ description: "a low-polygon rendering", sizeEmoji: "8==D" },
	{ description: "a we don't talk about it", sizeEmoji: "8==D" },
	{ description: "a that's between you and god", sizeEmoji: "8==D" },
	{ description: "a yikes but quietly", sizeEmoji: "8==D" },
	{ description: "a fragile", sizeEmoji: "8=D" },
	{ description: "a why she left", sizeEmoji: "8=D" },
	{ description: "a daddy issues origin", sizeEmoji: "8=D" },
	{ description: "a mommy issues confirmed", sizeEmoji: "8=D" },
	{ description: "a disappointment but not a surprise", sizeEmoji: "8=D" },
	{ description: "a family disappointment", sizeEmoji: "8=D" },
	{ description: "a generational curse", sizeEmoji: "8=D" },
	{ description: "a birth defect personality couldn't fix", sizeEmoji: "8=D" },
	{ description: "a reason to stay dressed", sizeEmoji: "8=D" },
	{ description: "a why the lights stay off", sizeEmoji: "8=D" },
	{ description: "a 'I've had worse' material", sizeEmoji: "8=D" },
	{ description: "a personality better be good", sizeEmoji: "8=D" },
	{ description: "a hope you're funny", sizeEmoji: "8=D" },
	{ description: "a why he tries so hard", sizeEmoji: "8D" },
	{ description: "a Napoleon complex origin", sizeEmoji: "8D" },
	{ description: "a short man energy source", sizeEmoji: "8D" },
	{ description: "a gym membership motivation", sizeEmoji: "8D" },
	{ description: "a loud exhaust pipe", sizeEmoji: "8D" },
	{ description: "a reverse puberty", sizeEmoji: "8D" },
	{ description: "a viagra stock investment", sizeEmoji: "8D" },
	{ description: "a reason she fakes it", sizeEmoji: "8D" },
	{ description: "a seek professional help", sizeEmoji: "8D" },
	{ description: "a side effects include crying", sizeEmoji: "8D" },
	{ description: "a why she texts her ex after", sizeEmoji: "8D" },
	{ description: "a why foreplay matters", sizeEmoji: "8D" },
	// --- The Existential (Micro) ---
	{ description: "a rounding error in the simulation", sizeEmoji: "8" },
	{ description: "a theoretical meat", sizeEmoji: "8" },
	{ description: "a thoughts and prayers", sizeEmoji: "8" },
	{ description: "an evolutionary dead end", sizeEmoji: "." },
	{ description: "a gene pool exit", sizeEmoji: "." },
	{ description: "a darwin award nominee", sizeEmoji: "." },
	{ description: "a natural selection target", sizeEmoji: "." },
	{ description: "a vasectomy advertisement", sizeEmoji: "." },
	{ description: "a condom advertisement", sizeEmoji: "." },
	{ description: "a catholic school success story", sizeEmoji: " " },
	{ description: "a the talk your parents skip", sizeEmoji: " " },
	{ description: "a proof god has favorites", sizeEmoji: " " },
	{ description: "a proof god makes mistakes", sizeEmoji: " " },
	{ description: "a hospital mix-up hopeful", sizeEmoji: " " },
	{ description: "a Christmas dinner topic", sizeEmoji: " " },
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
