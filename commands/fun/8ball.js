const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const getRandomElement = require("../../utils/randomElement");

const answers = [
  "Fo shizzle, it's a yes.",
  "Yaaas queen, affirmative.",
  "Yeet, it's happening.",
  "Certified fresh, no doubt.",
  "On fleek, defo yes.",
  "Such certainty, much wow.",
  "Yuppers, it's a go.",
  "Thumbs up emoji.",
  "Swiggity swooty, it's a yes.",
  "No cap, it's a yes.",
  "Error 404: Answer not found.",
  "¯_(ツ)_/¯ Ask later.",
  "Shh, it's a secret.",
  "Hazy AF, try again.",
  "Buffering... ask again later.",
  "Big oof, I wouldn't.",
  "Nope.exe.",
  "It's a no from me, dawg.",
  "That's gonna be a yikes from me.",
  "Not even in an alternate universe.",
];

function build8BallEmbed(question, answer) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎱 The Magic 8-Ball")
    .setDescription(`**Question:** ${question}\n**Answer:** ${answer}`)

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball a question")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question you want to ask")
        .setRequired(true)
    ),
  async execute(interaction) {
    const question = interaction.options.getString("question");
    const answer = getRandomElement(answers);
    const embed = build8BallEmbed(question, answer);

    await interaction.reply({ embeds: [embed] });
  },
};
