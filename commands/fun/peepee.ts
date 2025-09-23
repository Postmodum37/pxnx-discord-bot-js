import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import type { ChatCommand } from "../../types/chatCommand";
import getRandomElement from "../../utils/randomElement";

const peepeeSizes: string[] = [
	"a diminutive demon",
	"an ultra-thicc",
	"a colossal chad",
	"a huge, like really big",
	"a teeny tiny, smol",
	"an absolute chonker",
	"a thicc, double C flex",
	"a smol bean",
	"a hella large",
	"a micro-vibes, can't even",
	"a ginormous, like whoa",
	"a pint-sized",
	"a pocket-sized",
	"a galactic proportions",
	"a minuscule, barely there",
	"a fun-sized, not a snack, a whole meal",
	"a nano-squad, tiny but mighty",
	"a mega, boss level flex",
	"a wee lil' thing, tiniest of smols",
	"a petite pixie",
	"a thick, super-voluptuous",
	"a monumental titan",
	"a giant, almost overwhelming",
	"a teeny-weeny, ultra-mini",
	"an oversized fluffy boi",
	"a robust, splendid heft",
	"a little nugget",
	"a mega-gargantuan",
	"a miniscule, nearly invisible",
	"a humongous, eye-popping",
	"a teeny-tot",
	"a compact package",
	"an interstellar scale",
	"a tiny, almost non-existent",
	"a snack-sized, appetizing feast",
	"a micro-unit, feisty but cute",
	"a supreme, upper-tier size",
	"a itsy-bitsy, miniature charm",
];

function buildPeepeeEmbed(user: GuildMember): EmbedBuilder {
	const randomPeepeeSize: string = getRandomElement(peepeeSizes);

	return new EmbedBuilder()
		.setColor(0x5865f2)
		.setTitle("PeePee Inspection Time")
		.setDescription(`${user.displayName} has ${randomPeepeeSize} peepee!`)
		.setThumbnail(user.displayAvatarURL());
}

const command: ChatCommand = {
	data: new SlashCommandBuilder().setName("peepee").setDescription("Get your peepee size."),
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return;

		const member = interaction.guild.members.cache.get(interaction.user.id) ?? interaction.member;
		if (!member || !(member instanceof GuildMember)) return;

		const embed = buildPeepeeEmbed(member);

		await interaction.reply({ embeds: [embed] });
	},
};

export default command;
