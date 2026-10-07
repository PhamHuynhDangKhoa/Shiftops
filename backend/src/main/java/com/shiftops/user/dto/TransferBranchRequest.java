package com.shiftops.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferBranchRequest {

    @NotNull(message = "Target branch ID is required")
    private UUID targetBranchId;
}
