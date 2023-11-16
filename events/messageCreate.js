require("dotenv").config();
const { Events } = require("discord.js");
const { interact } = require("../utils/dialogapi.js");
const axios = require("axios");
const fetch = require("node-fetch");
const defaultQuestions = require("../defaultQuestions.json");

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
        console.log(error);
    }
}

async function queryOpenAI(userInput) {
    const url = "https://api.openai.com/v1/chat/completions";
    const api_key = process.env.OPENAI_KEY;

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
    };

    const data = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: process.env.ANSWER_FILTER,
            },
            {
                role: "user",
                content: `${userInput}`,
            },
        ],
        temperature: 0,
    };

    try {
        const response = await axios.post(url, data, { headers: headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error querying OpenAI:", error);
    }
}

// This function checkis if the user question is one of the most asked questions
// If it is, it should return which question it is

async function checkIfDefaultReply(userInput) {
    console.log(userInput);
    const url = "https://api.openai.com/v1/chat/completions";
    const api_key = process.env.OPENAI_KEY;

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
                    "trading rules': This intent should be assigned when the user's query is about trading rules, regulations, or guidelines. For example, questions about market rules, trading restrictions, or specific trading strategies. payout: Use this intent for questions related to payouts. This includes inquiries about the payout process, eligibility, payment timelines, or issues related to receiving payments. 'restricted rules': Choose this when the user asks about restricted rules or limitations within your platform. This covers questions about prohibited activities or the consequences of not following certain rules. 'ip address': Assign this intent for queries regarding the use or privacy of IP addresses, VPN use, & VPS use. This includes questions about how IP addresses are used, data protection, and privacy policies. 'news rules': This should be used for questions related to news rules. It includes inquiries about guidelines for sharing or using news on your platform and any specific rules regarding news content. 'discounts': This should only be used for questions regarding discount codes. Only use intents like 'trading rules', 'payout', 'restricted rules', 'ip address', 'discount' and 'news rules' in your classification. Do not add any other details to the message.",
            },
            {
                role: "user",
                content: `${userInput}`,
            },
        ],
        temperature: 0,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result.choices[0].message.content);
        return result.choices[0].message.content;
    } catch (error) {
        console.error("Error querying OpenAI:", error);
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) {
            return;
        }

        if (process.env.LIVEANSWERS_CHANNELS.includes(message.channel.id)) {
            const newob = JSON.stringify(message.member);
            const userRoles = JSON.parse(newob).roles;

            console.log(userRoles);

            // Moderator and support roles
            const moderatorRoles = ["1033766629319909427", "1150807715417952378"];

            // If the user who wrote the message has a mod role, we return
            // since the bot should not respond to a mod
            if (userRoles.some((item) => moderatorRoles.includes(item))) {
                console.log("is mod");
                return;
            }

            console.log("User message:", message.content);
            let liveAnswer = message;
            liveAnswer.isLive = true;
            const messageWithoutMention = message.content.replace(/^<@\!?(\d+)>/, "").trim();

            //TODO Legg til default sjekk her

            try {
                const defaultQuestion = await checkIfDefaultReply(messageWithoutMention);

                console.log("==================");
                console.log(defaultQuestion);

                const filter = (reaction, user) => {
                    return ["👍", "👎"].includes(reaction.emoji.name) && user.id === message.author.id;
                };

                // If the intent is any of the default questions, send the default response,
                // If not, get the answer from stackAI
                if (defaultQuestion.toLowerCase().includes("trading rules")) {
                    checkIfDefaultAnswerIsGood(message, messageWithoutMention, defaultQuestions.tradingRules, filter);
                } else if (defaultQuestion.toLowerCase().includes("payout")) {
                    checkIfDefaultAnswerIsGood(message, messageWithoutMention, defaultQuestions.payout, filter);
                } else if (defaultQuestion.toLowerCase().includes("restricted rules")) {
                    checkIfDefaultAnswerIsGood(message, messageWithoutMention, defaultQuestions.restrictedRules, filter);
                } else if (defaultQuestion.toLowerCase().includes("ip address")) {
                    checkIfDefaultAnswerIsGood(message, messageWithoutMention, defaultQuestions.ipAddress, filter);
                } else if (defaultQuestion.toLowerCase().includes("news rules")) {
                    checkIfDefaultAnswerIsGood(message, messageWithoutMention, defaultQuestions.newsRules, filter);
                } else if (defaultQuestion.toLowerCase().includes("discounts")) {
                    checkIfDefaultAnswerIsGood(message, messageWithoutMention, defaultQuestions.discounts, filter);
                }
                // Here we send the questioon to stackAI
                else {
                    console.log("Not a default question");
                    const result = await queryOpenAI(messageWithoutMention);
                    console.log(result);

                    if (result?.includes(1)) {
                        try {
                            query({
                                "in-0": `${messageWithoutMention}`,
                                "url-0": `https://fundingpips.freshdesk.com/support/home`,
                                user_id: message.author.id,
                            })
                                .then((response) => {
                                    console.log(response["out-0"]);

                                    if (
                                        response["out-0"].includes("please ask Prop-firm related questions") ||
                                        response["out-0"].includes("This information is not related to my understanding") ||
                                        response["out-0"].includes("Prop-firm related questions only")
                                    ) {
                                        return;
                                    } else {
                                        if (response["out-0"]) {
                                            message.reply(response["out-0"]);
                                        } else {
                                            return;
                                        }
                                    }
                                })
                                .catch((err) => {
                                    console.log(err);
                                    console.log("Error with query");
                                });
                        } catch (error) {
                            console.log(error);
                        }
                    } else {
                        console.log("Not a valid question");
                    }
                }
            } catch (error) {
                const result = await queryOpenAI(messageWithoutMention);
                console.log(result);

                if (result?.includes(1)) {
                    try {
                        query({
                            "in-0": `${messageWithoutMention}`,
                            "url-0": `https://fundingpips.freshdesk.com/support/home`,
                            user_id: message.author.id,
                        })
                            .then((response) => {
                                console.log(response["out-0"]);

                                if (
                                    response["out-0"].includes("please ask Prop-firm related questions") ||
                                    response["out-0"].includes("This information is not related to my understanding") ||
                                    response["out-0"].includes("Prop-firm related questions only")
                                ) {
                                    return;
                                } else {
                                    if (response["out-0"]) {
                                        message.reply(response["out-0"]);
                                    } else {
                                        return;
                                    }
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                console.log("Error with query");
                            });
                    } catch (error) {
                        console.log(error);
                    }
                } else {
                    console.log("Not a valid question");
                }
            }
        }
    },
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
                            console.log(err);
                            console.log("Error with query");
                        });
                } catch (error) {
                    await findingAnswerMessage.delete();
                    message.reply("No answer found");
                    console.log(error);
                }
            }
        });
        // collector.on("end", (collected) => {
        //     console.log(`Collected ${collected.size} reactions`);
        // });
    });
};
