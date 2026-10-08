package com.shiftops.handover.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

@Builder
public record CreateHandoverRequest(
        @Size(max = 2000, message = "Notes cannot exceed 2000 characters")
        String notes,

        @Valid
        List<HandoverItemRequest> items
) {
    public CreateHandoverRequest {
        if (items == null) {
            items = new ArrayList<>();
        }
    }

    public String getNotes() {
        return notes();
    }

    public List<HandoverItemRequest> getItems() {
        return items();
    }
}
