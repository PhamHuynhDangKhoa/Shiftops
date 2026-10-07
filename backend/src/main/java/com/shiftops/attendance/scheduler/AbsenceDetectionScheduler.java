package com.shiftops.attendance.scheduler;

import com.shiftops.attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class AbsenceDetectionScheduler {

    private final AttendanceService attendanceService;
    private final Clock clock;

    @Scheduled(cron = "${app.attendance.absence-cron:0 */5 * * * *}")
    public void detectAndMarkAbsences() {
        Instant now = clock.instant();
        try {
            int marked = attendanceService.markAbsentShifts(now);
            if (marked > 0) {
                log.info("Absence detection scheduler marked {} unattended shift assignment(s) as ABSENT", marked);
            }
        } catch (Exception ex) {
            log.error("Error occurred during scheduled absence detection", ex);
        }
    }
}
