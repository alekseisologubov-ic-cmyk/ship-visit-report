export const SECTIONS = [
  {
    id: 'culinary',
    title: 'CULINARY',
    items: [
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
    id: 'bar',
    title: 'BAR',
    note:
      'The supplied checklist did not contain a dedicated Bar section, so shared FOH and operational controls are used here.',
    items: [
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
    id: 'restaurant',
    title: 'RESTAURANT',
    items: [
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
    id: 'procurement',
    title: 'PROCUREMENT',
    items: [
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
    id: 'sanitation',
    title: 'SANITATION',
    items: [
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
