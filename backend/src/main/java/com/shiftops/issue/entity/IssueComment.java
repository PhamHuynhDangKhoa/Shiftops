package com.shiftops.issue.entity;

import com.shiftops.common.entity.BaseEntity;
import com.shiftops.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "issue_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "is_internal", nullable = false)
    @Builder.Default
    private boolean isInternal = false;
}
