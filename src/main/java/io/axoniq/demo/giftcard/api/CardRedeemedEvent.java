package io.axoniq.demo.giftcard.api;

public record CardRedeemedEvent(
        String id,
        int amount
) {

}
