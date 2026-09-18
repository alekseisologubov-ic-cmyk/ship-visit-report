/*
  state.js

  Controls the current Ship Visit Report.

  This module keeps:
  - current report ID
  - ship
  - dates
  - reviewer
  - checklist state
  - report status
  - ship response information
*/


import { emptyState } from './data.js';


/* =========================================================
   CURRENT REPORT
========================================================= */

let reportId = null;


let meta = {
  ship: '',
  dateOn: '',
  dateOff: '',
  reviewer: ''
};


let currentReviewer = '';


let state = emptyState();


let reportStatus = 'open';


let submittedAt = null;


/* =========================================================
   REPORT ID
========================================================= */

export function getReportId() {
  return reportId;
}


export function setReportId(id) {
  reportId = id || null;
}


/* =========================================================
   META
========================================================= */

export function getMeta() {
  return {
    ...meta
  };
}


export function setMeta(newMeta) {

  meta = {
    ship: newMeta?.ship || '',
    dateOn: newMeta?.dateOn || '',
    dateOff: newMeta?.dateOff || '',
    reviewer: newMeta?.reviewer || ''
  };

}


/* =========================================================
   REVIEWER
========================================================= */

export function getReviewer() {
  return currentReviewer;
}


export function setReviewer(name) {

  currentReviewer =
    String(name || '').trim();

  meta.reviewer =
    currentReviewer;

}


/* =========================================================
   CHECKLIST STATE
========================================================= */

export function getState() {

  return state;

}


export function getStateCopy() {

  return JSON.parse(
    JSON.stringify(state)
  );

}


export function setState(newState) {

  const initial =
    emptyState();


  Object.keys(newState || {})
    .forEach(key => {

      if (!initial[key]) {
        return;
      }


      const saved =
        newState[key];


      initial[key] = {

        ...initial[key],

        ...saved,

        comments:
          Array.isArray(saved.comments)
            ? saved.comments
            : [],

        photos:
          Array.isArray(saved.photos)
            ? saved.photos
            : [],

        followUpNeeded:
          Boolean(
            saved.followUpNeeded
          ),

        shipComments:
          Array.isArray(
            saved.shipComments
          )
            ? saved.shipComments
            : []

      };

    });


  state =
    initial;

}


/* =========================================================
   INDIVIDUAL CHECKLIST ITEM
========================================================= */

export function getItem(key) {

  return state[key];

}


export function updateItem(
  key,
  changes
) {

  if (!state[key]) {
    return;
  }


  state[key] = {

    ...state[key],

    ...changes

  };

}


/* =========================================================
   CHECKED
========================================================= */

export function toggleChecked(key) {

  if (!state[key]) {
    return false;
  }


  state[key].checked =
    !state[key].checked;


  return state[key].checked;

}


export function isChecked(key) {

  return Boolean(
    state[key]?.checked
  );

}


/* =========================================================
   REVIEWER COMMENTS
========================================================= */

export function addReviewerComment(
  key,
  text
) {

  if (!state[key]) {
    return;
  }


  const cleanText =
    String(text || '').trim();


  if (!cleanText) {
    return;
  }


  state[key].comments.push({

    name:
      currentReviewer ||
      meta.reviewer ||
      'Reviewer',

    text:
      cleanText,

    timestamp:
      new Date().toISOString()

  });

}


/* =========================================================
   PHOTOS
========================================================= */

export function addPhoto(
  key,
  photo
) {

  if (!state[key]) {
    return;
  }


  if (!photo) {
    return;
  }


  state[key].photos.push(
    photo
  );

}


export function removePhoto(
  key,
  index
) {

  if (!state[key]) {
    return;
  }


  if (
    index < 0 ||
    index >= state[key].photos.length
  ) {

    return;

  }


  state[key].photos.splice(
    index,
    1
  );

}


/* =========================================================
   FOLLOW UP
========================================================= */

export function setFollowUp(
  key,
  needed
) {

  if (!state[key]) {
    return;
  }


  state[key].followUpNeeded =
    Boolean(needed);


  /*
    If follow-up is removed,
    clear the pending ship comments
    and response display.
  */

  if (!needed) {

    state[key].shipComments =
      [];

  }

}


/* =========================================================
   SHIP COMMENTS
========================================================= */

export function addShipComment(
  key,
  text
) {

  if (!state[key]) {
    return;
  }


  const cleanText =
    String(text || '').trim();


  if (!cleanText) {
    return;
  }


  state[key].shipComments.push({

    name:
      'Ship',

    text:
      cleanText,

    timestamp:
      new Date().toISOString()

  });

}


/* =========================================================
   SHIP RESPONSE HELPERS
========================================================= */

export function setShipComments(
  key,
  comments
) {

  if (!state[key]) {
    return;
  }


  state[key].shipComments =
    Array.isArray(comments)
      ? comments
      : [];

}


/* =========================================================
   REPORT STATUS
========================================================= */

export function getReportStatus() {
  return reportStatus;
}


export function setReportStatus(
  status
) {

  const validStatuses = [
    'open',
    'submitted'
  ];


  reportStatus =
    validStatuses.includes(status)
      ? status
      : 'open';

}


export function isOpenReport() {

  return (
    reportStatus ===
    'open'
  );

}


export function isSubmittedReport() {

  return (
    reportStatus ===
    'submitted'
  );

}


/* =========================================================
   SUBMITTED DATE
========================================================= */

export function getSubmittedAt() {

  return submittedAt;

}


export function setSubmittedAt(
  value
) {

  submittedAt =
    value || null;

}


/* =========================================================
   FOLLOW-UP COUNTS
========================================================= */

export function getFollowUpCount() {

  return Object.values(
    state
  )
  .filter(
    item =>
      item &&
      item.followUpNeeded
  )
  .length;

}


export function getCompletedFollowUpCount() {

  return Object.values(
    state
  )
  .filter(
    item =>
      item &&
      item.followUpNeeded &&
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length > 0
  )
  .length;

}


export function hasFollowUps() {

  return (
    getFollowUpCount() > 0
  );

}


export function areAllFollowUpsComplete() {

  const followUps =
    Object.values(
      state
    )
    .filter(
      item =>
        item &&
        item.followUpNeeded
    );


  /*
    If there are no follow-up
    points, there is nothing
    waiting for a ship response.
  */

  if (!followUps.length) {

    return true;

  }


  return followUps.every(
    item =>

      Array.isArray(
        item.shipComments
      ) &&

      item.shipComments.length > 0
  );

}


/* =========================================================
   REPORT COLOR
========================================================= */

export function getStatusColor() {

  if (
    reportStatus ===
    'open'
  ) {

    return 'red';

  }


  if (
    areAllFollowUpsComplete()
  ) {

    return 'green';

  }


  return 'blue';

}


/* =========================================================
   RESET REPORT
========================================================= */

export function resetReport() {

  reportId =
    null;


  meta = {

    ship: '',
    dateOn: '',
    dateOff: '',
    reviewer: ''

  };


  currentReviewer =
    '';


  state =
    emptyState();


  reportStatus =
    'open';


  submittedAt =
    null;

}


/* =========================================================
   START NEW REPORT
========================================================= */

export function startNewReport({
  ship,
  dateOn,
  dateOff,
  reviewer
}) {

  reportId =
    null;


  meta = {

    ship:
      String(ship || '').trim(),

    dateOn:
      String(dateOn || ''),

    dateOff:
      String(dateOff || ''),

    reviewer:
      String(reviewer || '').trim()

  };


  currentReviewer =
    meta.reviewer;


  state =
    emptyState();


  reportStatus =
    'open';


  submittedAt =
    null;

}


/* =========================================================
   LOAD REPORT FROM SUPABASE
========================================================= */

export function loadReport(
  report
) {

  if (!report) {

    resetReport();

    return;

  }


  setReportId(
    report.id
  );


  meta = {

    ship:
      report.ship ||
      report.report_data?.meta?.ship ||
      '',

    dateOn:
      report.date_on ||
      report.report_data?.meta?.dateOn ||
      '',

    dateOff:
      report.date_off ||
      report.report_data?.meta?.dateOff ||
      '',

    reviewer:
      report.reviewer ||
      report.report_data?.meta?.reviewer ||
      ''

  };


  currentReviewer =
    meta.reviewer;


  setState(
    report.report_data?.state ||
    {}
  );


  setReportStatus(
    report.status ||
    'open'
  );


  setSubmittedAt(
    report.submitted_at ||
    null
  );

}


/* =========================================================
   EXPORT REPORT DATA
========================================================= */

export function getReportData() {

  return {

    meta:
      getMeta(),

    state:
      getStateCopy()

  };

}


/* =========================================================
   COMPLETE SNAPSHOT
========================================================= */

export function getSnapshot() {

  return {

    id:
      reportId,

    meta:
      getMeta(),

    currentReviewer,

    state:
      getStateCopy(),

    status:
      reportStatus,

    submittedAt

  };

}


/* =========================================================
   VALIDATION
========================================================= */

export function isValidReport() {

  return Boolean(

    meta.ship &&
    meta.reviewer

  );

}


export function missingRequiredFields() {

  const missing = [];


  if (!meta.ship) {

    missing.push(
      'Ship'
    );

  }


  if (!meta.reviewer) {

    missing.push(
      'Reviewer'
    );

  }


  return missing;

}


/* =========================================================
   SUMMARY COUNTS
========================================================= */

export function getSummaryCounts() {

  let total =
    0;

  let checked =
    0;

  let photos =
    0;

  let comments =
    0;

  let followUps =
    0;

  let shipResponses =
    0;


  Object.values(
    state
  )
  .forEach(
    item => {

      total++;


      if (
        item.checked
      ) {

        checked++;

      }


      photos +=
        Array.isArray(
          item.photos
        )
          ? item.photos.length
          : 0;


      comments +=
        Array.isArray(
          item.comments
        )
          ? item.comments.length
          : 0;


      if (
        item.followUpNeeded
      ) {

        followUps++;


        shipResponses +=
          Array.isArray(
            item.shipComments
          )
            ? item.shipComments.length
            : 0;

      }

    }
  );


  return {

    total,

    checked,

    photos,

    comments,

    followUps,

    shipResponses,

    followUpsComplete:
      getCompletedFollowUpCount()

  };

}
