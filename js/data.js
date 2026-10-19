/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  data.js
  ============================================================

  Checklist version 2 is used for new reports and existing OPEN reports.
  Older Ship Review / Submitted reports without a version marker retain the
  exact legacy checklist. SECTIONS is mutated in place so existing imports
  continue to reference the active list.
*/

export const CURRENT_CHECKLIST_VERSION = 2;

const CURRENT_SECTIONS = [
  {
    id: 'culinary',
    title: 'CULINARY & GALLEY OPERATIONS',
    items: [
      'Recipe Compliance: Verified that recipe tablets and matrices are accessible and actively used in all venues.',
      'Food Quality: Checked menu execution and general food quality across all culinary outlets.',
      'Tasting Spoons: Confirmed tasting spoons are available and routinely used in all kitchens.',
      'Venue Operations: Checked line-ups and Galley walk-up manning to ensure service SOPs are met.',
      'Pre-Shift Meetings: Verified daily pre-shift meetings are held in the galley, including daily special tastings and explanations.',
      'Butcher Operations: Audited meat allocation for venues (including The Kitchen Table) and verified the meat ordering sheet.',
      'Equipment Safety: Inspected the butcher bandsaw for proper operating condition and verified all safety guards are in place.',
      'Freezer Loading: Inspected walk-in freezers to ensure they are not overloaded.',
      'Galley Equipment Budget & Spending: Conducted budget review covering overall Galley equipment spending and equipment cost-reduction feedback.',
      'Crew Overtime: Reviewed ship overtime usage and management across the department.',
      'Promotions & Step-Ups: Reviewed promotion and step-up files and ensured proper follow-up.',
      'Crew Roundtables: Conducted a dedicated crew roundtable with the Culinary team.',
      'Crew Appreciation: Verified recognition and crew appreciation initiatives for the Culinary team are actively in place.',
      'Uniforms & Safety Shoes: Checked the condition and availability of uniforms and safety shoes for the Culinary crew.',
      'Training Records: Verified the monthly training file for regularity and confirmed Galley Fire Safety Training is complete for all culinary crew.',
      'AIMS Maintenance & Report Follow-up: Reviewed previous ship visit reports, meeting notes with the Hotel Service Engineer, and outstanding AIMS maintenance reports to ensure repeat findings are resolved.'
    ]
  },
  {
    id: 'bar',
    title: 'BEVERAGE OPERATIONS (BARS)',
    items: [
      'FOH Setup: Audited Front-of-House bar setups against current SOPs.',
      'Hours of Operation: Reviewed operating hours across all bar venues.',
      'Equipment Status: Verified all bar equipment is fully operational and in place.',
      'Recipe Adherence & Stock Availability: Verified that all drink recipes are strictly followed by bartending staff and that all required beverage ingredients are fully available and in stock.',
      'Procurement Communication: Ensured missing item lists are updated and sent to Procurement.',
      'Standard Operating Procedures: Confirmed compliance with all VMS bar SOPs and the "Raise the Bar" program.',
      'Team Communication: Verified daily pre-shift meetings are conducted and held alignment meetings with the F&B Director.',
      'Crew Feedback: Conducted a dedicated crew roundtable for bar staff.'
    ]
  },
  {
    id: 'restaurant',
    title: 'RESTAURANT & SERVICE OPERATIONS',
    items: [
      'FOH Setups & Flow: Audited restaurant FOH setups, operating hours, and general Sailor flow.',
      'Service Knowledge: Assessed waiter menu knowledge, culinary program understanding, and waiter tasting meetings.',
      'Operating Supplies & Plateware Condition: Inspected plateware condition to ensure items are free of chips, cracks, or heavy wear.',
      'Plateware Stock & PAR Levels: Verified plateware inventory stock levels match the required quantities per the restaurant plateware file.',
      'Furniture Condition: Audited restaurant furniture to ensure chairs, tables, and booths are clean, sturdy, and in good repair.',
      'Flooring & Carpet Condition: Checked carpets and floor surfaces throughout the restaurant to confirm they are clean, well-maintained, and clear of trip hazards.',
      'Specialty Equipment (Gunbae Grills): Audited Gunbae grills to ensure all units are clean, fully functional, and in good operating condition.',
      '"Treat Yourself" Revenue & Execution: Verified proper waiter explanations, upselling, proper charging, and correct entry in the Chargeable Tracker for the "Treat Yourself" program.',
      'Ship Eats (Room Service): Checked food quality, preparation, and presentation for Ship Eats orders.',
      'Venue Standards: Audited menu variety, overall station cleanliness, and proper labeling in The Kitchen Table area.'
    ]
  },
  {
    id: 'procurement',
    title: 'PROVISIONING & PROCUREMENT',
    items: [
      'Storage Compliance: Verified proper storage standards for all food items, fresh fish, seafood, and high-value flagged items (e.g., caviar).',
      'Produce Management: Checked Fruit & Vegetable rooms for strict First-In, First-Out (FIFO) rotation and box maintenance.',
      'Inventory Checks: Performed spot checks and completed the Deck 2 galley equipment inventory per SOP.',
      'Stock Monitoring: Reviewed expiry dates alongside non-moving and slow-moving stock lists.',
      'Ordering & System Usage: Audited future orders and confirmed proper usage of ERP templates.',
      'Supply Liaison: Updated and communicated missing item lists directly with Procurement.'
    ]
  },
  {
    id: 'sanitation',
    title: 'PUBLIC HEALTH & SANITATION',
    items: [
      'Logs & Tracking: Confirmed Shellfish logs, Cooling logs, and updated/approved Time Control Plans are actively maintained.',
      'Thermometers: Inspected walk-in, reach-in, and food thermometers to ensure they are in place and actively used.',
      'Hygiene Systems: Verified the 3-bucket sanitation system is properly set up with active chemical concentration testing.',
      'Chemical Safety: Audited chemical storage areas to ensure correct segregation and safety protocols.',
      'Inspections: Conducted systematic inspections using the inspection grid, ensuring findings are logged and followed up.',
      'VMS Standards: Confirmed general sanitation practices align strictly with VMS SOPs.'
    ]
  }
];

// Original checklist kept for reports already in Ship Review or Submitted.
const LEGACY_SECTIONS = [
  {
    id: 'culinary', title: 'CULINARY', items: [
      'All recipe tablets in place in the venues',
      'All recipes followed / food quality in the venues',
      'Tasting spoons available in the kitchens',
      'All equipment in place and in working order',
      'Missing item lists updated and communicated with Procurement',
      'Food cost discussions',
      'Walk-in freezers not being overloaded',
      'Proper explanation of the Treat Yourself program',
      'Matrix for The Galley followed up',
      'Galley walk-up manning in place / SOP being followed',
      'Review EXC, EXSC, CDC and SC positions',
      'Overtime discussion for the ship',
      'Review promotion / step-up file and follow-up',
      'Conducted a crew round table',
      'Appreciation of the Culinary crew',
      'Uniforms for the Culinary crew',
      'Shoe wear for the Culinary crew',
      'Galley fire safety training in place for all culinary crew',
      'Monthly training file checking and regularity of trainings',
      'Attendance of trainings',
      'Overall food cost budget met',
      'Galley equipment budget met',
      'Budget meeting conducted',
      'Cost reduction feedback',
      'All galley equipment in proper condition',
      'Meeting conducted with the Hotel Service Engineer',
      'Attend the maintenance meeting while on board',
      'Review AIMS report, outstanding maintenance follow-up'
    ]
  },
  {
    id: 'bar', title: 'BAR', note: 'The supplied checklist did not contain a dedicated Bar section, so shared FOH and operational controls are used here.', items: [
      'All set ups FOH followed as per the latest SOP',
      'All equipment in place and in working order',
      'Missing item lists updated and communicated with Procurement',
      'Review all Hours of Operation',
      'Conducted a crew round table',
      'Morning meetings in place',
      'Meetings held with F&B Director / team',
      'All SOPs followed as per VMS',
      'Review previous reports reviewed / repeat findings',
      'Budget meeting conducted',
      'Cost reduction feedback'
    ]
  },
  {
    id: 'restaurant', title: 'RESTAURANT', items: [
      'All set ups FOH followed as per the latest SOP',
      'Checking the Sailor flow of the restaurants',
      'Review all Hours of Operation',
      'Checking the quality of Ship Eats',
      'Quality of the Treat Yourself dishes',
      'Waiter knowledge and waiter meeting / tasting',
      'All recipe tablets in place in the venues',
      'All recipes followed / food quality in the venues',
      'Variety of the menu',
      'Proper cooking methods used for the crew',
      'Cleanliness in The Kitchen Table area',
      'Labels in The Kitchen Table followed up',
      'Production meeting in place',
      'Meeting with General Manager',
      'Meeting with F&B Director',
      'Meeting with Senior Executive Chef',
      'Closing meeting discussing / inspection'
    ]
  },
  {
    id: 'procurement', title: 'PROCUREMENT', items: [
      'Future orders',
      'All items stored properly',
      'All ERP templates followed',
      'Fruit and Vegetables rooms, FIFO in place',
      'All Fruit and Vegetables boxes maintained',
      'Deck 2 galley equipment inventory done as per SOP',
      'Proper storing of flagged items (caviar)',
      'Expiry, none and slow list moving followed up',
      'Conduct a Spot Check',
      'Meat ordering sheet and proper charging in place',
      'Butcher amounts for venues / Kitchen Table followed up',
      'Chargeables charging properly followed up',
      'Chargeable tracker filled in correct',
      'Proper storage of fresh fish and seafood',
      'Missing item lists updated and communicated with Procurement'
    ]
  },
  {
    id: 'sanitation', title: 'SANITATION', items: [
      'Shellfish logs in place',
      'Cooling logs in place',
      'Updated and approved time control plans',
      '3 bucket system in place with sanitation checking',
      'Inspections done properly',
      'Conducted inspections within the inspection grid',
      'Findings from the inspections properly followed up on',
      'Fridge Thermometers in place',
      'Food Thermometers in place and used',
      'All SOPs followed as per VMS',
      'Proper storage and cleanliness in the Butcher shop and walk-in rooms',
      'Bandsaw in good condition and all safety parts in place'
    ]
  }
];

function cloneSections(source) {
  return source.map(section => ({
    ...section,
    items: [...section.items]
  }));
}

// Keep this array object stable. Other modules import this reference once.
export const SECTIONS = cloneSections(CURRENT_SECTIONS);
let activeChecklistVersion = CURRENT_CHECKLIST_VERSION;
let legacyChecklistArchive = null;

export function setActiveChecklistVersion(version) {
  activeChecklistVersion = Number(version) >= CURRENT_CHECKLIST_VERSION ? CURRENT_CHECKLIST_VERSION : 1;
  const source = activeChecklistVersion === CURRENT_CHECKLIST_VERSION ? CURRENT_SECTIONS : LEGACY_SECTIONS;
  SECTIONS.splice(0, SECTIONS.length, ...cloneSections(source));
  return activeChecklistVersion;
}

export function getActiveChecklistVersion() {
  return activeChecklistVersion;
}

export function clearLegacyChecklistArchive() {
  legacyChecklistArchive = null;
}

export function getLegacyChecklistArchive() {
  return legacyChecklistArchive ? JSON.parse(JSON.stringify(legacyChecklistArchive)) : null;
}

function hasSavedPointData(item) {
  return Boolean(
    item && typeof item === 'object' && (
      item.checked ||
      item.followUpNeeded ||
      item.follow_up_needed ||
      (Array.isArray(item.comments) && item.comments.length) ||
      (Array.isArray(item.photos) && item.photos.length) ||
      (Array.isArray(item.shipComments) && item.shipComments.length) ||
      (Array.isArray(item.ship_comments) && item.ship_comments.length)
    )
  );
}

function mergePointData(target, source) {
  if (!target || !source || typeof source !== 'object') return;
  target.checked = Boolean(target.checked || source.checked);
  target.followUpNeeded = Boolean(target.followUpNeeded || source.followUpNeeded || source.follow_up_needed);
  for (const [targetKey, sourceKeys] of Object.entries({
    comments: ['comments'],
    photos: ['photos'],
    shipComments: ['shipComments', 'ship_comments']
  })) {
    const existing = Array.isArray(target[targetKey]) ? target[targetKey] : [];
    const incoming = sourceKeys.flatMap(key => Array.isArray(source[key]) ? source[key] : []);
    target[targetKey] = [...existing, ...incoming];
  }
}

// Only move legacy point data when its meaning clearly matches a corrected point.
// Unmatched findings are archived in the report payload instead of being discarded.
const LEGACY_TO_CURRENT = {
  culinary: {
    0: ['culinary__0'], 1: ['culinary__1'], 2: ['culinary__2'],
    4: ['procurement__5'], 6: ['culinary__7'], 7: ['restaurant__7'],
    8: ['culinary__0'], 9: ['culinary__3'], 11: ['culinary__9'],
    12: ['culinary__10'], 13: ['culinary__11'], 14: ['culinary__12'],
    15: ['culinary__13'], 16: ['culinary__13'], 17: ['culinary__14'],
    18: ['culinary__14'], 19: ['culinary__14'], 21: ['culinary__8'],
    22: ['culinary__8'], 23: ['culinary__8'], 25: ['culinary__15'],
    26: ['culinary__15'], 27: ['culinary__15']
  },
  bar: {
    0: ['bar__0'], 1: ['bar__2'], 2: ['bar__4'], 3: ['bar__1'],
    4: ['bar__7'], 5: ['bar__6'], 6: ['bar__6'], 7: ['bar__5']
  },
  restaurant: {
    0: ['restaurant__0'], 1: ['restaurant__0'], 2: ['restaurant__0'],
    3: ['restaurant__8'], 4: ['restaurant__7'], 5: ['restaurant__1'],
    6: ['culinary__0'], 7: ['culinary__1'], 8: ['restaurant__9'],
    10: ['restaurant__9'], 11: ['restaurant__9']
  },
  procurement: {
    0: ['procurement__4'], 1: ['procurement__0'], 2: ['procurement__4'],
    3: ['procurement__1'], 4: ['procurement__1'], 5: ['procurement__2'],
    6: ['procurement__0'], 7: ['procurement__3'], 8: ['procurement__2'],
    9: ['culinary__5'], 10: ['culinary__5'], 11: ['restaurant__7'],
    12: ['restaurant__7'], 13: ['procurement__0'], 14: ['procurement__5']
  },
  sanitation: {
    0: ['sanitation__0'], 1: ['sanitation__0'], 2: ['sanitation__0'],
    3: ['sanitation__2'], 4: ['sanitation__4'], 5: ['sanitation__4'],
    6: ['sanitation__4'], 7: ['sanitation__1'], 8: ['sanitation__1'],
    9: ['sanitation__5'], 10: ['procurement__0'], 11: ['culinary__6']
  }
};

function migrateLegacyStateToCurrent(incomingState) {
  setActiveChecklistVersion(CURRENT_CHECKLIST_VERSION);
  const source = incomingState && typeof incomingState === 'object' ? incomingState : {};
  const migrated = emptyState();
  const mappedSourceKeys = new Set();

  // Keep report-level and department-level comments verbatim.
  for (const [key, value] of Object.entries(source)) {
    if (key === '__report_general__' || key.startsWith('__department_general__')) {
      migrated[key] = JSON.parse(JSON.stringify(value));
    }
  }

  for (const legacySection of LEGACY_SECTIONS) {
    legacySection.items.forEach((text, index) => {
      const sourceKey = `${legacySection.id}__${index}`;
      const targets = LEGACY_TO_CURRENT[legacySection.id]?.[index];
      const point = source[sourceKey];
      if (!targets || !hasSavedPointData(point)) return;
      mappedSourceKeys.add(sourceKey);
      for (const targetKey of targets) mergePointData(migrated[targetKey], point);
    });
  }

  const archivedItems = [];
  for (const legacySection of LEGACY_SECTIONS) {
    legacySection.items.forEach((text, index) => {
      const sourceKey = `${legacySection.id}__${index}`;
      const point = source[sourceKey];
      if (mappedSourceKeys.has(sourceKey) || !hasSavedPointData(point)) return;
      archivedItems.push({
        key: sourceKey,
        section: legacySection.title,
        point: text,
        data: JSON.parse(JSON.stringify(point))
      });
    });
  }

  return {
    state: migrated,
    archive: archivedItems.length ? {
      sourceChecklistVersion: 1,
      note: 'Stored for reference because these findings do not have a direct equivalent in checklist version 2.',
      items: archivedItems
    } : null
  };
}

/*
  Prepare one report for display without rewriting the database.
  - Legacy OPEN reports are displayed with checklist v2; matched annotations/photos
    are carried to corresponding new points, and nonmatching findings are archived.
  - Older Ship Review and Submitted reports remain on the legacy checklist.
  - A report already stamped v2 stays on v2 through later statuses.
*/
export function prepareReportForChecklist(report) {
  if (!report || typeof report !== 'object') {
    setActiveChecklistVersion(CURRENT_CHECKLIST_VERSION);
    legacyChecklistArchive = null;
    return report;
  }

  const storedVersion = Number(report.report_data?.checklistVersion || report.report_data?.checklist_version || 0);
  if (storedVersion >= CURRENT_CHECKLIST_VERSION) {
    setActiveChecklistVersion(CURRENT_CHECKLIST_VERSION);
    legacyChecklistArchive = report.report_data?.legacyChecklistArchive
      ? JSON.parse(JSON.stringify(report.report_data.legacyChecklistArchive))
      : null;
    return report;
  }

  if (String(report.status || '').toLowerCase() === 'open') {
    const result = migrateLegacyStateToCurrent(report.report_data?.state || {});
    legacyChecklistArchive = result.archive ? JSON.parse(JSON.stringify(result.archive)) : null;
    const reportData = {
      ...(report.report_data || {}),
      checklistVersion: CURRENT_CHECKLIST_VERSION,
      state: result.state
    };
    if (result.archive) reportData.legacyChecklistArchive = result.archive;
    return { ...report, report_data: reportData };
  }

  setActiveChecklistVersion(1);
  legacyChecklistArchive = report.report_data?.legacyChecklistArchive
    ? JSON.parse(JSON.stringify(report.report_data.legacyChecklistArchive))
    : null;
  return report;
}

export function emptyState() {
  const state = {};
  for (const section of SECTIONS) {
    section.items.forEach((text, index) => {
      const key = `${section.id}__${index}`;
      state[key] = {
        checked: false,
        comments: [],
        photos: [],
        followUpNeeded: false,
        shipComments: []
      };
    });
  }
  return state;
}

export function itemInfo(key) {
  const parts = String(key).split('__');
  const sectionId = parts[0];
  const index = Number(parts[1]);
  const section = SECTIONS.find(item => item.id === sectionId);
  return {
    section,
    text: section?.items[index] ?? '',
    index
  };
}
