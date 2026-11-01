/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  data.js
  ============================================================

  Checklist versions
    1 = original checklist (reports without a version marker)
    2 = department checklist used until 31 Oct 2026
    3 = Standard Department Checklists: a General step (12 standard
        points) followed by the five departments with their own points.

  Version 3 is used ONLY for newly created reports. Every existing report
  keeps the checklist it was created with. SECTIONS is mutated in place so
  existing imports continue to reference the active list.
*/

export const CURRENT_CHECKLIST_VERSION = 3;

const SECTIONS_V3 = [
  {
    id: "general",
    title: "GENERAL — STANDARD POINTS FOR EVERY DEPARTMENT",
    items: [
      "Crew Roundtable: Conducted a dedicated crew roundtable with the department team and captured their feedback.",
      "Crew Appreciation: Verified recognition and crew appreciation initiatives for the department are actively in place.",
      "Uniforms & Safety Gear: Checked that uniforms, name badges, and required safety shoes or PPE are clean, in good condition, and available for all crew.",
      "Pre-Shift & Team Communication: Verified daily pre-shift meetings are held and alignment meetings take place with the F&B Director.",
      "SOP Compliance: Confirmed all current VMS SOPs for the department are available to the team and followed in practice.",
      "Training Records: Verified the monthly training file is regular and up to date, and that mandatory training (including Fire Safety and Food Safety) is complete for all crew.",
      "AIMS Maintenance & Report Follow-up: Reviewed previous ship visit reports, meeting notes with the Hotel Service Engineer, and outstanding AIMS maintenance reports to ensure repeat findings are resolved.",
      "Equipment & Area Condition: Checked that equipment, fixtures, and work areas are clean, fully operational, and in good repair.",
      "Cleanliness & Housekeeping: Confirmed cleaning schedules are in place and followed, and that work areas are free of safety hazards.",
      "Procurement Communication: Ensured missing item lists are updated and communicated to Procurement.",
      "Crew Overtime & Rostering: Reviewed overtime usage and rosters to ensure they are managed within the department plan.",
      "Promotions & Step-Ups: Reviewed promotion and step-up files and ensured proper follow-up."
    ]
  },
  {
    id: "culinary",
    title: "CULINARY & GALLEY OPERATIONS",
    items: [
      "Recipe Compliance: Verified that recipe tablets and matrices are accessible and actively used in all venues.",
      "Food Quality: Checked menu execution and general food quality across all culinary outlets.",
      "Tasting Spoons: Confirmed tasting spoons are available and routinely used in all kitchens.",
      "Venue Operations: Checked line-ups and Galley walk-up manning to ensure service SOPs are met.",
      "Daily Special Tastings: Verified daily special tastings and explanations are held in the galley as part of pre-shift meetings.",
      "Butcher Operations: Audited meat allocation for venues (including The Kitchen Table) and verified the meat ordering sheet.",
      "Equipment Safety: Inspected the butcher bandsaw for proper operating condition and verified all safety guards are in place.",
      "Freezer Loading: Inspected walk-in freezers to ensure they are not overloaded.",
      "Galley Equipment Budget & Spending: Conducted a budget review covering overall Galley equipment spending and equipment cost-reduction feedback.",
      "Kitchen Table – Food Variety, Vegan Options & Sea Day Lunch Specials: Verified that the minimum food variety matrix is followed, vegan options are available as required by the matrix, and specials are actively implemented during sea-day lunch.",
      "Allergen Management: Verified allergen procedures are followed in the galley, including separation, labelling, and clear communication to service teams.",
      "Mise en Place & Station Readiness: Checked that stations are fully prepped, labelled, and dated before service.",
      "Food Waste & Portion Control: Reviewed portion standards and food waste practices across the galley and outlets."
    ]
  },
  {
    id: "bar",
    title: "BEVERAGE OPERATIONS (BARS)",
    items: [
      "FOH Setup: Audited Front-of-House bar setups against current SOPs.",
      "Hours of Operation: Reviewed operating hours across all bar venues.",
      "Equipment Status: Verified all bar equipment is fully operational and in place.",
      "Recipe Adherence & Stock Availability: Verified that all drink recipes are strictly followed by bartending staff and that all required beverage ingredients are fully available and in stock.",
      "“Raise the Bar” Program: Confirmed compliance with the “Raise the Bar” program.",
      "Glassware & Garnish Standards: Checked that glassware is clean and correct for each drink, and that garnishes are fresh, prepared, and labelled.",
      "Bar Stock & PAR Levels: Verified bar stock levels match the required PAR levels and that stock counts are completed and recorded.",
      "Pouring & Cost Control: Checked pouring standards, measures, spillage, and complimentary drink records.",
      "Menu & POS Accuracy: Verified beverage menus, prices, and POS items are correct and consistent across all bars.",
      "Responsible Alcohol Service: Confirmed age checks and responsible service procedures are followed by all bar crew.",
      "Ice, Dispensers & Lines: Inspected ice machines, dispensers, and draught or soda lines to ensure they are clean and cleaning is logged."
    ]
  },
  {
    id: "restaurant",
    title: "RESTAURANT & SERVICE OPERATIONS",
    items: [
      "FOH Setups & Flow: Audited restaurant FOH setups, operating hours, and general Sailor flow.",
      "Service Knowledge: Assessed waiter menu knowledge, culinary program understanding, and waiter tasting meetings.",
      "Operating Supplies & Plateware Condition: Inspected plateware condition to ensure items are free of chips, cracks, or heavy wear.",
      "Plateware Stock & PAR Levels: Verified plateware inventory stock levels match the required quantities per the restaurant plateware file.",
      "Furniture Condition: Audited restaurant furniture to ensure chairs, tables, and booths are clean, sturdy, and in good repair.",
      "Flooring & Carpet Condition: Checked carpets and floor surfaces throughout the restaurant to confirm they are clean, well-maintained, and clear of trip hazards.",
      "Specialty Equipment (Gunbae Grills): Audited Gunbae grills to ensure all units are clean, fully functional, and in good operating condition.",
      "“Treat Yourself” Revenue & Execution: Verified proper waiter explanations, upselling, proper charging, and correct entry in the Chargeable Tracker for the “Treat Yourself” program.",
      "Ship Eats (Room Service): Checked food quality, preparation, and presentation for Ship Eats orders.",
      "Venue Standards: Audited menu variety, overall station cleanliness, and proper labeling in The Kitchen Table area.",
      "Kitchen Table – Labels, Allergens & Dietary Identification: Verified that Kitchen Table labelling requirements are followed, allergen information is visible on labels, and vegan and vegetarian items are clearly identified.",
      "Glassware, Cutlery & Linen: Inspected glassware, cutlery, and table linen to ensure items are clean, polished, and free of damage or stains.",
      "Menus & Signage: Checked that menus and venue signage are clean, current, and correct.",
      "Allergen & Dietary Requests: Verified waiters handle allergen and dietary requests correctly, from order taking through to delivery at the table.",
      "Table Setting & Service Standards: Checked that table settings, service sequence, and Sailor greeting meet VMS service standards.",
      "Sailor Feedback & Complaints: Reviewed recent Sailor feedback and complaints for the venue and confirmed follow-up actions are in place."
    ]
  },
  {
    id: "procurement",
    title: "PROVISIONING & PROCUREMENT",
    items: [
      "Storage Compliance: Verified proper storage standards for all food items, fresh fish, seafood, and high-value flagged items (e.g., caviar).",
      "Produce Management: Checked Fruit & Vegetable rooms for strict First-In, First-Out (FIFO) rotation and box maintenance.",
      "Inventory Checks: Performed spot checks and completed the Deck 2 galley equipment inventory per SOP.",
      "Stock Monitoring: Reviewed expiry dates alongside non-moving and slow-moving stock lists.",
      "Ordering & System Usage: Audited future orders and confirmed proper usage of ERP templates.",
      "Receiving & Quality Checks: Verified incoming goods are checked for temperature, damage, and expiry dates, and discrepancies are recorded.",
      "Store Room Temperatures & Cold Chain: Checked that chiller, freezer, and dry store temperatures are monitored, recorded, and within limits.",
      "Store Organisation & Labelling: Confirmed stores are organised, shelving is clear of the floor, and items are labelled and dated.",
      "Stores Security & Access: Verified high-value items are secured and access to stores is controlled.",
      "Write-offs & Waste: Reviewed write-offs and spoilage records to ensure reasons are documented and trends are followed up."
    ]
  },
  {
    id: "sanitation",
    title: "PUBLIC HEALTH & SANITATION",
    items: [
      "Logs & Tracking: Confirmed Shellfish logs, Cooling logs, and updated/approved Time Control Plans are actively maintained.",
      "Thermometers: Inspected walk-in, reach-in, and food thermometers to ensure they are in place and actively used.",
      "Hygiene Systems: Verified the 3-bucket sanitation system is properly set up with active chemical concentration testing.",
      "Chemical Safety: Audited chemical storage areas to ensure correct segregation and safety protocols.",
      "Inspections: Conducted systematic inspections using the inspection grid, ensuring findings are logged and followed up.",
      "Personal Hygiene & Handwashing: Checked handwashing stations are stocked and accessible, and that crew follow personal hygiene and illness reporting procedures.",
      "Pest Control: Reviewed pest control monitoring and records, and checked for any signs of pest activity.",
      "Allergen & Cross-Contamination Controls: Verified procedures to prevent allergen cross-contact and cross-contamination are in place and followed.",
      "Waste Handling: Checked that waste is segregated, stored, and removed in line with procedure.",
      "External Inspection Follow-up: Reviewed findings from official public health inspections and confirmed corrective actions are closed.",
      "Cooking & Holding Temperatures: Verified hot and cold holding temperatures are monitored and recorded during service."
    ]
  }
];

// Previous department checklist (version 2) — kept for reports already created with it.
const SECTIONS_V2 = [
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
      'AIMS Maintenance & Report Follow-up: Reviewed previous ship visit reports, meeting notes with the Hotel Service Engineer, and outstanding AIMS maintenance reports to ensure repeat findings are resolved.',
      'Kitchen Table — Food Variety, Vegan Options & Sea Day Lunch Specials: Verified that the minimum food variety matrix is followed, vegan options are available as required by the matrix, and specials are actively implemented during sea-day lunch.'
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
      'Venue Standards: Audited menu variety, overall station cleanliness, and proper labeling in The Kitchen Table area.',
      'Kitchen Table — Labels, Allergens & Dietary Identification: Verified that Kitchen Table labelling requirements are followed, allergen information is visible on labels, and vegan and vegetarian items are clearly identified.'
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


// Original checklist (version 1).
const SECTIONS_V1 = [
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


const CHECKLISTS = {
  1: SECTIONS_V1,
  2: SECTIONS_V2,
  3: SECTIONS_V3
};

function cloneSections(source) {
  return source.map(section => ({
    ...section,
    items: [...section.items]
  }));
}

// Keep this array object stable. Other modules import this reference once.
export const SECTIONS = cloneSections(SECTIONS_V3);
let activeChecklistVersion = CURRENT_CHECKLIST_VERSION;
let legacyChecklistArchive = null;

export function setActiveChecklistVersion(version) {
  const number = Math.floor(Number(version));
  activeChecklistVersion = CHECKLISTS[number] ? number : 1;
  SECTIONS.splice(0, SECTIONS.length, ...cloneSections(CHECKLISTS[activeChecklistVersion]));
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

/*
  Select the checklist that belongs to one stored report.
  - Report with a stored version marker -> exactly that checklist.
  - Report without a marker -> the original checklist (version 1).
  - No report (a brand-new one) -> the newest checklist (version 3).
  Nothing is rewritten in the database.
*/
export function prepareReportForChecklist(report) {
  if (!report || typeof report !== 'object') {
    setActiveChecklistVersion(CURRENT_CHECKLIST_VERSION);
    legacyChecklistArchive = null;
    return report;
  }

  const storedVersion = Number(
    report.report_data?.checklistVersion ||
    report.report_data?.checklist_version ||
    1
  );
  setActiveChecklistVersion(storedVersion);
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
        shoreFollowUpNeeded: false,
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
