package com.shiftops.notification.service;

import com.shiftops.notification.entity.NotificationType;
import com.shiftops.notification.entity.ReferenceType;
import com.shiftops.notification.repository.NotificationRepository;
import com.shiftops.shift.entity.Shift;
import com.shiftops.shift.entity.ShiftAssignment;
import com.shiftops.shift.repository.ShiftRepository;
import com.shiftops.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShiftReminderScheduler {

    private final ShiftRepository shiftRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    @Scheduled(cron = "0 */5 * * * *")
    public void scheduleShiftReminders() {
        sendShiftReminders();
    }

    public int sendShiftReminders() {
        Instant now = clock.instant();
        Instant windowEnd = now.plus(Duration.ofMinutes(35));

        List<Shift> upcomingShifts = shiftRepository.findPublishedShiftsStartingBetween(now, windowEnd);
        int sentCount = 0;

        for (Shift shift : upcomingShifts) {
            if (shift.getAssignments() == null) continue;

            for (ShiftAssignment assignment : shift.getAssignments()) {
                User user = assignment.getUser();
                if (user == null || !user.isActive()) continue;

                String idempotencyKey = "shift:" + shift.getId() + ":user:" + user.getId() + ":reminder";

                boolean alreadySent = notificationRepository.existsByIdempotencyKey(idempotencyKey)
                        || notificationRepository.existsByRecipientIdAndTypeAndReferenceId(
                                user.getId(),
                                NotificationType.SHIFT_REMINDER,
                                shift.getId()
                        );

                if (!alreadySent) {
                    long minutesUntilStart = Math.max(1, Duration.between(now, shift.getStartTime()).toMinutes());
                    String branchName = shift.getBranch() != null ? shift.getBranch().getName() : "your branch";
                    String msg = "Your shift starts in " + minutesUntilStart + " minutes at " + branchName;
                    var result = notificationService.createNotification(
                            user.getId(),
                            NotificationType.SHIFT_REMINDER,
                            "Upcoming Shift Reminder",
                            msg,
                            ReferenceType.SHIFT,
                            shift.getId(),
                            idempotencyKey
                    );
                    if (result.isPresent()) {
                        sentCount++;
                    }
                }
            }
        }

        if (sentCount > 0) {
            log.info("Sent {} shift reminder notifications", sentCount);
        }
        return sentCount;
    }
}
