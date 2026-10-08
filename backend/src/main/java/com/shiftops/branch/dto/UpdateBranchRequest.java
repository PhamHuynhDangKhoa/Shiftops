package com.shiftops.branch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record UpdateBranchRequest(
        @NotBlank(message = "Branch name is required")
        @Size(max = 100, message = "Branch name must not exceed 100 characters")
        String name,

        @Size(max = 255, message = "Address must not exceed 255 characters")
        String address,

        @Size(max = 50, message = "Timezone must not exceed 50 characters")
        String timezone,

        Boolean active
) {
    public String getName() {
        return name();
    }

    public String getAddress() {
        return address();
    }

    public String getTimezone() {
        return timezone();
    }

    public Boolean getActive() {
        return active();
    }
}
