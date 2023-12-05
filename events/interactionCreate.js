const { Events } = require("discord.js");
const { query } = require("./messageCreate.js"); // Ensure this path is correct
const defaultQuestions = require("../defaultQuestions.json");
const { MessageActionRow, MessageButton, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageEmbed, EmbedBuilder } = require("discord.js");

const { userActiveMessages } = require("./messageCreate.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            userActiveMessages.delete(interaction.user.id);
        } catch {
            console.log("error deleting user from active messages");
        }

        if (interaction.isButton()) {
            const [customId, originalMessageId] = interaction?.customId?.split("-");

            const formattedQuestion = interaction?.message?.content?.replaceAll("**", "");

            const originalMessageUserId = interaction?.message.mentions?.repliedUser?.id;

            // Check if the user who clicked the button is the same as the user who sent the original message
            if (interaction?.user?.id !== originalMessageUserId) {
                // Inform the user that they are not allowed to use these buttons
                return;
                //return interaction.reply({ content: "You are not allowed to use these buttons.", ephemeral: true });
            }

            const originalMessage = await interaction.channel.messages.fetch(originalMessageId);

            try {
                // Ensure that the message is not already deleted and is deletable
                if (interaction.message && !interaction.message.deleted) {
                    await interaction.message.delete();
                }
            } catch (error) {
                console.error("Message already deleted.");
            }

            try {
                let responseMessage;

                switch (customId) {
                    case "time_limits":
                        responseMessage = defaultQuestions.time_limits;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "payout_rules":
                        responseMessage = defaultQuestions.payout_rules;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "current_discounts":
                        responseMessage = defaultQuestions.current_discounts;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "news_rules":
                        responseMessage = defaultQuestions.news_rules;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "restricted_countries":
                        responseMessage = defaultQuestions.restricted_countries;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "prohibited_strategies":
                        responseMessage = defaultQuestions.prohibited_strategies;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "weekend_trading":
                        responseMessage = defaultQuestions.weekend_trading;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "drawdown_question":
                        responseMessage = defaultQuestions.drawdown;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "profit_loss":
                        responseMessage = defaultQuestions.profit_loss;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "tradeable_assets":
                        responseMessage = defaultQuestions.tradeable_assets;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "account_credentials":
                        responseMessage = defaultQuestions.account_credentials;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "scaling":
                        responseMessage = defaultQuestions.scaling;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "refunds":
                        responseMessage = defaultQuestions.refunds;
                        await interaction.reply({ content: responseMessage, ephemeral: true }); // Reply to the interaction
                        break;
                    case "trading_rules":
                        const row1 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`profit_loss-${originalMessage.id}`)
                                .setLabel("⚖️ Profit & Loss Limits")
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`tradeable_assets-${originalMessage.id}`)
                                .setLabel("💹 Tradable assets")
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`account_credentials-${originalMessage.id}`)
                                .setLabel("🔐 Account Credentials")
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId(`scaling-${originalMessage.id}`).setLabel("📈 Scaling").setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId(`refunds-${originalMessage.id}`).setLabel("💸 Refunds").setStyle(ButtonStyle.Secondary)
                        );

                        const row2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`ask_ai-${originalMessage.id}`).setLabel("❓🤖 Ask AI").setStyle(ButtonStyle.Primary)
                        );

                        originalMessage.reply({ content: responseMessage, components: [row1, row2] }).then((sentMessage) => {
                            setTimeout(() => {
                                sentMessage.delete().catch((e) => console.error("Error deleting message: ", e));
                                userActiveMessages.delete(interaction.user.id);
                            }, 30000); // 30 seconds timeout
                        });

                        break;
                    case "ask_ai":
                        //await interaction.deferReply({ ephemeral: false, content: originalMessage.content });
                        const user = interaction.user; // The user who clicked the button

                        await interaction.deferReply({ ephemeral: true }); // Acknowledge the interaction

                        setTimeout(async () => {
                            // Construct a personalized response
                            const responseContent = `${user} Finding an answer to: **${originalMessage.content}**... ⏱️`;

                            // Update the reply with the personalized response
                            await interaction.editReply({ content: responseContent, ephemeral: true });
                        }, 1500);

                        console.log("=======Before StackAI=======");
                        console.log(originalMessage.content);
                        console.log(interaction.user.id);

                        responseMessage = await query({
                            "in-0": originalMessage?.content,
                            user_id: interaction?.user?.id,
                        });

                        console.log(responseMessage["out-0"]);

                        if (
                            responseMessage["out-0"].includes("please ask Prop-firm related questions") ||
                            responseMessage["out-0"].includes("This information is not related to my understanding") ||
                            responseMessage["out-0"].includes("Prop-firm related questions only")
                        ) {
                            responseMessage = "This information is not related to my understanding. Try rephrasing your question please";
                        } else {
                            responseMessage = responseMessage["out-0"] ? responseMessage["out-0"] : "No response from query.";
                        }

                        // Reply directly to the user's original message
                        await originalMessage.reply({ content: responseMessage });

                        for (let [key, value] of userActiveMessages.entries()) {
                            if (value === interaction.user.id) {
                                map.delete(key);
                            }
                        }

                        break;

                    default:
                        responseMessage = "Unknown option selected.";
                        await interaction.reply({ content: responseMessage }); // Acknowledge the interaction for default case
                        break;
                }

                // If not 'ask_ai', edit the deferred reply with actual content
                if (customId !== "ask_ai") {
                    await originalMessage.reply({ content: responseMessage });
                    //await interaction.editReply({ content: responseMessage });
                }
            } catch (error) {
                console.error("Error during interaction:", error.message);
                if (!interaction.replied && !interaction.deferred) {
                    // Interaction hasn't been replied or deferred
                    await interaction.reply({
                        content: "There was an error while processing your request. Please try again.",
                        ephemeral: true,
                    });
                } else {
                    // Interaction has been deferred
                    await interaction.followUp({
                        content: "There was an error while processing your request. Please try again.",
                        ephemeral: true,
                    });
                }
            }
        }
    },
};
