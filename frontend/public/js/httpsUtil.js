function getAPIURL() {
    return "http://localhost:8000";
}

async function post(url, objekt, sessionID = "") {
    if (sessionID === null) sessionID = "";
    objekt.sessionID = sessionID;
    const respons = await fetch(url, {
        method: "POST",
        body: JSON.stringify(objekt),
        headers: {
            "Content-Type": "application/json",
        },
    });
    return await respons.json();
}

async function get(url, sessionID = "") {
    if (sessionID === null) sessionID = "";
    if (sessionID !== "") {
        if (url.includes("?")) {
            url += "&sessionID=" + sessionID;
        } else {
            if (url.endsWith("?")) {
                url += "sessionID=" + sessionID;
            } else {
                url += "?sessionID=" + sessionID;
            }
        }
    }
    const respons = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    return await respons.json();
}

async function put(url, objekt, sessionID = "") {
    if (sessionID === null) sessionID = "";
    objekt.sessionID = sessionID;
    const respons = await fetch(url, {
        method: "PUT",
        body: JSON.stringify(objekt),
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (respons.status !== 204) throw new Error(respons.status);
}

export { getAPIURL, post, get, put };
