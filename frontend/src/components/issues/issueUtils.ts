import { Issue } from '../../lib/types';

/**
 * Generates realistic domain fallback incidents for Shibuya Flagship operations.
 * Fully synchronized with Spring Boot Issue JPA schema and DTO contracts.
 */
export const generateFallbackIssues = (
  branchId: string = 'b1',
  branchName: string = 'Shibuya Flagship'
): Issue[] => {
  const now = new Date();
  const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3600 * 1000).toISOString();

  return [
    {
      id: 'iss-001',
      branchId,
      branchName,
      reportedById: 'u-staff-1',
      reportedByName: 'Kenji Sato',
      reportedByRole: 'STAFF',
      title: 'Espresso Group 2 head pressure loss',
      description:
        'Group head 2 on the La Marzocco drops pressure immediately upon engagement. Boiler pressure reads normal at 1.5 bar, but extraction pressure fails to reach standard 9.0 bar. Group head gasket inspected; technician service required.',
      category: 'EQUIPMENT',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      assignedToId: 'u-manager-1',
      assignedToName: 'Marcus Tanaka',
      attachments: [
        {
          id: 'att-001',
          issueId: 'iss-001',
          uploaderId: 'u-staff-1',
          uploaderName: 'Kenji Sato',
          originalFileName: 'la_marzocco_gauge_error.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 245000,
          downloadUrl: '/api/v1/issues/iss-001/attachments/att-001/file',
          createdAt: minutesAgo(42),
        },
      ],
      comments: [
        {
          id: 'com-001',
          issueId: 'iss-001',
          authorId: 'u-staff-1',
          authorName: 'Kenji Sato',
          authorRole: 'STAFF',
          message:
            'Swapped portafilter basket and backflushed with blind disc, still stuck at 1.8 bar. Rerouting orders to Group 1 & 3.',
          systemGenerated: false,
          createdAt: minutesAgo(35),
        },
        {
          id: 'com-002',
          issueId: 'iss-001',
          authorId: 'u-manager-1',
          authorName: 'Marcus Tanaka',
          authorRole: 'MANAGER',
          message:
            'Dispatched emergency maintenance request to UCC Coffee Systems support ticket #TK-8891. Technician ETA 11:30 AM.',
          systemGenerated: false,
          createdAt: minutesAgo(18),
        },
      ],
      version: 2,
      createdAt: minutesAgo(45),
      updatedAt: minutesAgo(18),
    },
    {
      id: 'iss-002',
      branchId,
      branchName,
      reportedById: 'u-staff-2',
      reportedByName: 'Jordan Kim',
      reportedByRole: 'STAFF',
      title: 'Walk-in dairy cooler temperature alarm (+6.8°C)',
      description:
        'Walk-in cooler sensor triggered high-temp alarm at 09:15. External display reading fluctuated between 6.4°C and 6.8°C. Door seal verified closed. Immediate stock temperature probe test required to safeguard milk and cream supplies.',
      category: 'EQUIPMENT',
      priority: 'HIGH',
      status: 'OPEN',
      attachments: [],
      comments: [
        {
          id: 'com-003',
          issueId: 'iss-002',
          authorId: 'u-staff-2',
          authorName: 'Jordan Kim',
          authorRole: 'STAFF',
          message:
            'Condenser fan spinning but airflow feels warm. Kept doors locked to prevent ambient air ingress.',
          systemGenerated: false,
          createdAt: minutesAgo(20),
        },
      ],
      version: 1,
      createdAt: minutesAgo(25),
      updatedAt: minutesAgo(20),
    },
    {
      id: 'iss-003',
      branchId,
      branchName,
      reportedById: 'u-staff-3',
      reportedByName: 'Aoi Takahashi',
      reportedByRole: 'STAFF',
      title: 'POS Terminal 3 receipt printer paper feed jam',
      description:
        'Epson TM-T88VI thermal receipt printer jamming paper roll during cutter stroke. Cleared roller obstruction and performed reset cycle.',
      category: 'EQUIPMENT',
      priority: 'NORMAL',
      status: 'RESOLVED',
      assignedToId: 'u-manager-1',
      assignedToName: 'Marcus Tanaka',
      resolvedById: 'u-manager-1',
      resolvedByName: 'Marcus Tanaka',
      resolvedAt: hoursAgo(1),
      attachments: [],
      comments: [
        {
          id: 'com-004',
          issueId: 'iss-003',
          authorId: 'u-manager-1',
          authorName: 'Marcus Tanaka',
          authorRole: 'MANAGER',
          message:
            'Replaced paper roll with correct 80mm specification and vacuumed dust from cutter blade. Test print successful.',
          systemGenerated: false,
          createdAt: hoursAgo(1),
        },
      ],
      version: 3,
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'iss-004',
      branchId,
      branchName,
      reportedById: 'u-staff-1',
      reportedByName: 'Kenji Sato',
      reportedByRole: 'STAFF',
      title: 'Service bar mop sink drain sluggish',
      description:
        'Mop sink water draining sluggishly with gurgling sound in the air gap pipe. Grease trap inspection overdue by 2 days.',
      category: 'FACILITY',
      priority: 'NORMAL',
      status: 'ASSIGNED',
      assignedToId: 'u-staff-4',
      assignedToName: 'Daiki Watanabe',
      attachments: [],
      comments: [],
      version: 1,
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'iss-005',
      branchId,
      branchName,
      reportedById: 'u-owner-1',
      reportedByName: 'Elena Rostova',
      reportedByRole: 'OWNER',
      title: 'Front entrance glass decal peeling at bottom corner',
      description:
        'Operating hours decal on main sliding door is lifting at lower left corner. Re-applied with heat gun and squeegee.',
      category: 'FACILITY',
      priority: 'LOW',
      status: 'CLOSED',
      assignedToId: 'u-manager-1',
      assignedToName: 'Marcus Tanaka',
      closedById: 'u-manager-1',
      closedByName: 'Marcus Tanaka',
      closedAt: hoursAgo(5),
      attachments: [],
      comments: [
        {
          id: 'com-005',
          issueId: 'iss-005',
          authorId: 'u-manager-1',
          authorName: 'Marcus Tanaka',
          authorRole: 'MANAGER',
          message: 'Repaired adhesive and verified clean presentation.',
          systemGenerated: false,
          createdAt: hoursAgo(5),
        },
      ],
      version: 2,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(5),
    },
  ];
};