require("dotenv").config();
const { Events } = require("discord.js");
const { interact } = require("../utils/dialogapi.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) {
            return;
        }

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

        if (process.env.LIVEANSWERS_CHANNELS.includes(message.channel.id)) {
            console.log("User message:", message.content);
            let liveAnswer = message;
            liveAnswer.isLive = true;
            const messageWithoutMention = message.content.replace(/^<@\!?(\d+)>/, "").trim();

            try {
                await interact(liveAnswer, message.author.id, false, false, true, messageWithoutMention);
            } catch (error) {
                console.log("Ups error");
                console.log(error.message);
            }
        }
    },
};
