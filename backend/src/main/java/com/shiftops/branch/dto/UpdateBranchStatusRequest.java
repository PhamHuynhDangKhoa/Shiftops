package com.shiftops.branch.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBranchStatusRequest {

    @NotNull(message = "Active status is required")
    private Boolean active;
}
