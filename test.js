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

query({
    "in-0": `What is the eiffel tower?`,
}).then((response) => {
    console.log(JSON.stringify(response));
});
