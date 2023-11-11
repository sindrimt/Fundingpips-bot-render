require("dotenv").config();
const { Events } = require("discord.js");
const { interact } = require("../utils/dialogapi.js");
const axios = require("axios");

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

            const result = await queryOpenAI(messageWithoutMention);
            console.log(result);

            if (result?.includes(1)) {
                try {
                    query({
                        "in-0": `${messageWithoutMention}`,
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
    },
};
