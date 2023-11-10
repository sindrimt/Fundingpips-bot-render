const axios = require("axios");

async function query(data) {
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
                content: `You are Fundingpips assitant, a bot on Discord. You try to help users with their requests regarding Fundingpips prop firm. Analyze the user input. Assign a score of '1' if the message represents a well-formed, relevant question that requires assistance, clarification, or support related to our services or offerings (e.g., 'What is the hot seat program?', 'What is a prop firm?', 'What is Funding pips?', 'What is the affiliate program?'). Assign a score of '0' if the message is unrelated, vague, lacks context, is not a question, or includes silly, irrelevant, or insulting content (e.g., 'What is the Eiffel Tower?', 'And what is that?', 'What is a sock?', 'Only affiliate link if u are new'). This classification helps in efficiently responding to user inquiries and filtering out irrelevant or inappropriate content. Always return a raw value as your answer.`,
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

const main = async () => {
    // Example usage with user input
    const userInput = "how to purchase an account am new here";

    const result = await queryOpenAI(userInput);
    console.log(result);

    if (result.includes(1)) {
        query({
            "in-0": `${userInput}`,
            "url-0": `https://fundingpips.freshdesk.com/support/home`,
        }).then((response) => {
            console.log(response["out-0"]);

            if (
                response["out-0"].includes("please ask Prop-firm related questions") ||
                response["out-0"].includes("This information is not related to my understanding") ||
                response["out-0"].includes("Prop-firm related questions only")
            ) {
                console.log("NOT VALID, will NOT be sent to discord");
            } else {
                console.log("VALID question, this will be sent to discord");
            }
        });
    } else {
        console.log("Not a valid question");
    }
};

main();
