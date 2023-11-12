async function query(data) {
    const response = await fetch("https://www.stack-inference.com/run_deployed_flow?flow_id=x&org=sdf-9810-4a3a-bcc5-b6ab1335b664", {
        headers: { Authorization: "Bearer c01b8c21-bdf1-46be-sdfs-sdfsdf", "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(data),
    });
    const result = await response.json();
    return result;
}

query({
    "in-0": `How can I apply for that?`,
    "url-0": `https://fundingpips.freshdesk.com/support/home`,
    user_id: `999`,
}).then((response) => {
    console.log(JSON.stringify(response));
});
