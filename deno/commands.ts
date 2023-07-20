import {nextOneCard} from "./projection.ts";

const sendCommand = async (cardId: String, payload: JSON, commandName: String) => {
    const card = nextOneCard(cardId);
    const body = JSON.stringify(payload);
    let reply = await fetch("http://localhost:8081/v1/contexts/default/commands/" + commandName, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body,
    });
    if (reply.status === 200) {
        return {"success": card}
    } else {
        return {"error": await reply.json()}
    }
}

export const sendIssueCardCommand = async (cardId: String, initialValue: number) => {
    const payload = <JSON>{
        id: cardId,
        amount: initialValue
    }
    return sendCommand(cardId, payload, "io.axoniq.demo.giftcard.api.IssueCardCommand")
}

export const sendRedeemCardCommand = async (cardId: String, value: number) => {
    const payload = <JSON>{
        id: cardId,
        amount: value
    }
    return sendCommand(cardId, payload, "io.axoniq.demo.giftcard.api.RedeemCardCommand")
}

export const sendCancelCardCommand = async (cardId: String) => {
    const payload = <JSON>{
        id: cardId,
    }
    return sendCommand(cardId, payload, "io.axoniq.demo.giftcard.api.CancelCardCommand")
}