require("dotenv").config();
const { Events } = require("discord.js");
const { interact } = require("../utils/dialogapi.js");
const axios = require("axios");

async function query(data) {
    try {
        const response = await fetch(
            "https://www.stack-inference.com/run_deployed_flow?flow_id=654d27cb08992ae93d05abd8&org=efb9c8f5-9810-4a3a-bcc5-b6ab1335b664",
            {
                headers: { Authorization: "Bearer c01b8c21-bdf1-46be-b539-87bccedc77a4", "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        const result = await response.json();
        return result;
    } catch (error) {
        console.log(error);
    }
}

async function queryOpenAI(userInput) {
    const url = "https://api.openai.com/v1/chat/completions";
    const api_key = "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"; // Replace with your actual API key

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
    };

    const data = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: `You are Fundingpips assitant, a bot on Discord. You try to help users with their requests regarding Fundingpips prop firm. Analyze the user input. Assign a score of '1' if the message represents relevant question that requires assistance, clarification, or support related to our services or offerings (e.g., 'What is the hot seat program?', 'What is a prop firm?', 'What is Funding pips?', 'What is the affiliate program?'). Assign a score of '0' if the message is unrelated, vague, lacks context, is not a question, or includes silly, irrelevant, or insulting content (e.g., 'What is the Eiffel Tower?', 'And what is that?', 'What is a sock?', 'Only affiliate link if u are new'). This classification helps in efficiently responding to user inquiries and filtering out irrelevant or inappropriate content. Always return a raw value as your answer.`,
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

            if (result.includes(1)) {
                try {
                    query({
                        "in-0": `${messageWithoutMention}`,
                        "url-0": `https://fundingpips.freshdesk.com/support/home`,
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
                        .catch(() => {
                            console.log("error");
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
