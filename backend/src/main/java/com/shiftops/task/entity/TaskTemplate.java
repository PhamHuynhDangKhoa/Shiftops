package com.shiftops.task.entity;

import com.shiftops.branch.entity.Branch;
import com.shiftops.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "task_templates",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_task_template_branch_name", columnNames = {"branch_id", "name"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskTemplate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Builder.Default
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<TaskTemplateItem> items = new ArrayList<>();

    public void addItem(TaskTemplateItem item) {
        items.add(item);
        item.setTemplate(this);
    }

    public void removeItem(TaskTemplateItem item) {
        items.remove(item);
        item.setTemplate(null);
    }
}
