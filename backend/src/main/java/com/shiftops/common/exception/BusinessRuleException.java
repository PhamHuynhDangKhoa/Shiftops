package com.shiftops.common.exception;

import lombok.Getter;

@Getter
public class BusinessRuleException extends RuntimeException {
    private final String ruleCode;

    public BusinessRuleException(String ruleCode, String message) {
        super(message);
        this.ruleCode = ruleCode;
    }
}
