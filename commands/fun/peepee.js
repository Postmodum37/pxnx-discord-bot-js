const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const getRandomElement = require("../../utils/randomElement");

const peepeeSize = [
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

function buildPeepeeEmbed(user) {
  const randomPeepeeSize = getRandomElement(peepeeSize);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("PeePee Inspection Time")
    .setDescription(`${user.displayName} has ${randomPeepeeSize} peepee!`)
    .setThumbnail(user.avatarURL());

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("peepee")
    .setDescription("Get your peepee size."),
  async execute(interaction) {
    const embed = buildPeepeeEmbed(interaction.user);

    await interaction.reply({ embeds: [embed] });
  },
};
