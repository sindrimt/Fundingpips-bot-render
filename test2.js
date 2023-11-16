const axios = require("axios");

async function checkIfDefaultReply(userInput) {
    const url = "https://api.openai.com/v1/chat/completions";
    const api_key = "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";

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
                    "You are an expert at categorizing questions. There are only 6 questions you will look for. These are: 1. Trading rules 2. Payout 3. Restricted rules 4. IP Address 5. News rules 6. Discounts. If the user asks any of these questions, return the question category. If the user asks any other question, return '0'. IMPORTANT: You do not just look after keyword matches, you need to evaluate the context of the user message.",
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
        console.log(response.data.choices[0].message.content);
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error querying OpenAI:", error);
    }
}

checkIfDefaultReply("Are there any discounts going on atm?");
