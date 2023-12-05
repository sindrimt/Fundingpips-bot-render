require("dotenv").config();
const { Events, MessageActionRow, MessageButton, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageEmbed, EmbedBuilder } = require("discord.js");
const { interact } = require("../utils/dialogapi.js");
const axios = require("axios");
const fetch = require("node-fetch");
const defaultQuestions = require("../defaultQuestions.json");

const userActiveMessages = new Map();

async function query(data) {
    try {
        const response = await fetch(process.env.STACKAI_LINK, {
            headers: { Authorization: process.env.STACKAI_KEY, "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify(data),
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.log(error?.message);
    }
}

async function checkIfDefaultReply(userInput) {
    const url = "https://api.openai.com/v1/chat/completions";
    const api_key = process.env.OPENAI_KEY; // Replace with your actual API key

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
    };

    const data = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content:
                    "As the multilingual assistant for Fundingpips on Discord, your objective is to assist users with their questions regarding Fundingpips prop firm across various languages. When you analyze a message, if it asks for information or support directly related to Fundingpips' services—such as the 'hot seat program,' details about what a 'prop firm' is, specifics regarding 'Fundingpips,' or our 'affiliate program'—regardless of the language, you will assign a score of '1'. This score indicates a relevant and actionable query. Assign a score of '0' if the message is, vague, lacks context, or includes silly, irrelevant, or insulting content (e.g., 'What is the Eiffel Tower?', 'And what is that?', 'What is a sock?'). These could include messages about non-related subjects or nonsensical remarks. Your function is to offer prompt and accurate assistance in the same language as the query, helping to streamline user interactions by prioritizing relevant communications. Provide the score as a direct numerical answer without additional commentary.",
            },
            {
                role: "user",
                content: userInput,
            },
        ],
        temperature: 0,
    };

    try {
        const response = await axios.post(url, data, { headers: headers });
        const classification = response.data.choices[0].message.content.trim();

        // Check the response to see if it contains 'smalltalk' or 'support'
        return classification.toLowerCase().includes("0") ? "smalltalk" : "support";
    } catch (error) {
        console.error("Error querying OpenAI:", error);
        return "Error";
    }
}

async function queryVoiceflow(userInput, userId) {
    return new Promise((resolve, reject) => {
        const url = `https://general-runtime.voiceflow.com/state/user/${userId}/interact`;

        const headers = {
            "Content-Type": "application/json",
            Authorization: `${process.env.VOICEFLOW_API_KEY}`,
        };

        const actionBody = {
            action: {
                type: "text",
                payload: userInput,
            },
            config: {
                tts: false,
                stripSSML: true,
                stopAll: true,
                excludeTypes: ["path", "debug", "flow", "block"],
            },
        };

        axios
            .post(url, actionBody, { headers: headers })
            .then((response) => {
                if (response.data[0]?.payload?.message) {
                    resolve(response.data[0]?.payload?.message);
                } else {
                    resolve("support");
                }
            })
            .catch((err) => {
                console.log("======Error msg=======");
                console.log(err.message);
                reject(err.message);
            });
    });
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) {
            return;
        }

        const existingMessageId = userActiveMessages.get(message.author.id);

        if (existingMessageId) {
            return;
        }

        if (process.env.LIVEANSWERS_CHANNELS.includes(message.channel.id)) {
            const newob = JSON.stringify(message.member);
            const userRoles = JSON.parse(newob).roles;

            // Moderator and support roles
            const moderatorRoles = ["1033766629319909427", "1150807715417952378"];

            // If the user who wrote the message has a mod role, we return
            // since the bot should not respond to a mod
            if (userRoles.some((item) => moderatorRoles.includes(item))) {
                console.log("is mod");
                return;
            }

            // checkIfDefaultReply(message.content).then((res) => {
            const messageId = message.id;

            //if (res.includes("support")) {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`time_limits-${messageId}`).setLabel("⏱️ Time Limits").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`payout_rules-${messageId}`).setLabel("💰 Payout Rules").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`current_discounts-${messageId}`).setLabel("💸 Discounts").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`news_rules-${messageId}`).setLabel("🗞️ News Rules").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`restricted_countries-${messageId}`)
                    .setLabel("🚫 Restricted Countries")
                    .setStyle(ButtonStyle.Secondary)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`prohibited_strategies-${messageId}`)
                    .setLabel("⛔️ Prohibited Strategies")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`trading_rules-${message.id}`).setLabel("📜 Trading Rules").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`ask_ai-${message.id}`).setLabel("❓🤖 Ask AI").setStyle(ButtonStyle.Primary)
                // Add more buttons here if needed, up to 5 per row
            );

            const embed = new EmbedBuilder().setColor("#0099ff").setTitle("Response to your message").setDescription("Here are your options:");

            // Send the initial reply with buttons
            message
                .reply({
                    content: `**Please select a button below or choose ask AI, otherwise buttons will disappear in 30 seconds**`,
                    components: [row1, row2],
                    ephemeral: true,
                })
                .then((sentMessage) => {
                    userActiveMessages.set(message.author.id, sentMessage.id);

                    // Delete the message after 15 seconds
                    setTimeout(() => {
                        sentMessage.delete().catch((e) => console.error("Error deleting message: ", e));
                        userActiveMessages.delete(message.author.id);
                    }, 30000); // 30 seconds timeout
                })
                .catch((e) => console.error("Message is already deleted"));
            // } else {
            //     return;
            // }
            //});
        }
    },

    query,
    queryVoiceflow,
    userActiveMessages,
};

const checkIfDefaultAnswerIsGood = (message, messageWithoutMention, defaultAnswer, filter) => {
    message.reply(defaultAnswer).then((sentMessage) => {
        sentMessage.react("👍");
        sentMessage.react("👎");

        const collector = sentMessage.createReactionCollector({ filter, max: 1, time: 300000 });

        collector.on("collect", async (reaction, user) => {
            if (reaction.emoji.name === "👎") {
                // Call another function here
                const findingAnswerMessage = await message.reply("Finding you a better answer...⏱️");
                try {
                    query({
                        "in-0": `${messageWithoutMention}`,
                        "url-0": `https://fundingpips.freshdesk.com/support/home`,
                        user_id: message.author.id,
                    })
                        .then(async (response) => {
                            console.log(response["out-0"]);

                            // Delete the 'finding better answer' message
                            if (findingAnswerMessage) {
                                await findingAnswerMessage.delete();
                            }

                            if (
                                response["out-0"].includes("please ask Prop-firm related questions") ||
                                response["out-0"].includes("This information is not related to my understanding") ||
                                response["out-0"].includes("Prop-firm related questions only")
                            ) {
                                message.reply(response["out-0"]);
                                return;
                            } else {
                                if (response["out-0"]) {
                                    message.reply(response["out-0"]);
                                } else {
                                    return;
                                }
                            }
                        })
                        .catch(async (err) => {
                            await findingAnswerMessage.delete();
                            message.reply("No answer found");
                            console.log(err.message);
                        });
                } catch (error) {
                    await findingAnswerMessage.delete();
                    message.reply("No answer found");
                    console.log(error.message);
                }
            }
        });
    });
};
