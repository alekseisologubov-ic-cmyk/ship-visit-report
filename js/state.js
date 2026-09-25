/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  state.js
  ============================================================

  Central application state.

  Stores:
  - Report ID
  - Ship
  - Visit dates
  - Reviewer
  - Checklist status
  - Reviewer comments
  - Photos
  - Follow-up flags
  - Ship responses
  - Report status
  - Submission date
*/


import {
  SECTIONS,
  emptyState
} from './data.js';


/* ============================================================
   INTERNAL STATE
============================================================ */

let reportId = null;


let meta = {

  ship: '',

  dateOn: '',

  dateOff: '',

  reviewer: ''

};


let currentReviewer = '';


const DEPARTMENT_GENERAL_PREFIX = '__department_general__';

let state = emptyState();


let reportStatus = 'open';


let submittedAt = null;


/* ============================================================
   BASIC HELPERS
============================================================ */

function cleanText(value) {

  return String(
    value ?? ''
  ).trim();

}


function departmentGeneralKey(sectionId) {
  return `${DEPARTMENT_GENERAL_PREFIX}${sectionId}`;
}

function isDepartmentGeneralKey(key) {
  return String(key || '').startsWith(DEPARTMENT_GENERAL_PREFIX);
}

function normalizeDepartmentGeneralComments(value, reviewerName = '') {
  let source = value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    source = value.comments ?? [];
  }
  return toArray(source).map(entry => {
    if (typeof entry === 'string') {
      const text = cleanText(entry);
      return text ? { name: reviewerName || 'Reviewer', text, timestamp: null } : null;
    }
    if (!entry || typeof entry !== 'object') return null;
    const text = cleanText(entry.text ?? entry.comment ?? entry.message ?? entry.value ?? '');
    if (!text) return null;
    return {
      name: cleanText(entry.name ?? entry.reviewer ?? entry.author ?? reviewerName ?? 'Reviewer') || 'Reviewer',
      text,
      timestamp: entry.timestamp ?? entry.createdAt ?? null
    };
  }).filter(Boolean);
}


function clone(value) {

  return JSON.parse(
    JSON.stringify(
      value
    )
  );

}


function toArray(value) {

  if (
    Array.isArray(value)
  ) {

    return value;

  }


  if (
    typeof value === 'string'
  ) {

    const text =
      value.trim();


    if (!text) {

      return [];

    }


    try {

      const parsed =
        JSON.parse(
          text
        );


      return Array.isArray(
        parsed
      )
        ? parsed
        : [];

    } catch (
      _error
    ) {

      return [];

    }

  }


  return [];

}


/* ============================================================
   NORMALIZE REVIEWER COMMENTS
============================================================ */

function normalizeReviewerComments(
  value,
  reviewerName = ''
) {

  const source =
    toArray(
      value
    );


  return source
    .map(
      entry => {

        if (
          typeof entry === 'string'
        ) {

          const text =
            cleanText(
              entry
            );


          if (!text) {

            return null;

          }


          return {

            name:
              reviewerName ||
              'Reviewer',

            text,

            timestamp:
              null

          };

        }


        if (
          !entry ||
          typeof entry !== 'object'
        ) {

          return null;

        }


        const text =
          cleanText(
            entry.text ??
            entry.comment ??
            entry.message ??
            entry.value ??
            ''
          );


        if (!text) {

          return null;

        }


        return {

          name:
            cleanText(
              entry.name ??
              entry.reviewer ??
              entry.author ??
              reviewerName ??
              'Reviewer'
            ) ||
            'Reviewer',

          text,

          timestamp:
            entry.timestamp ??
            entry.createdAt ??
            null

        };

      }
    )
    .filter(
      Boolean
    );

}


/* ============================================================
   NORMALIZE SHIP COMMENTS
============================================================ */

function normalizeShipComments(
  value
) {

  const source =
    toArray(
      value
    );


  return source
    .map(
      entry => {

        if (
          typeof entry === 'string'
        ) {

          const text =
            cleanText(
              entry
            );


          if (!text) {

            return null;

          }


          return {

            name: 'Ship',

            text,

            timestamp: null

          };

        }


        if (
          !entry ||
          typeof entry !== 'object'
        ) {

          return null;

        }


        const text =
          cleanText(
            entry.text ??
            entry.comment ??
            entry.message ??
            entry.value ??
            ''
          );


        if (!text) {

          return null;

        }


        return {

          name:
            cleanText(
              entry.name ??
              entry.ship ??
              'Ship'
            ) ||
            'Ship',

          text,

          timestamp:
            entry.timestamp ??
            entry.createdAt ??
            null

        };

      }
    )
    .filter(
      Boolean
    );

}


/* ============================================================
   NORMALIZE PHOTOS
============================================================ */

function normalizePhotos(
  value
) {

  const source =
    toArray(
      value
    );


  return source
    .map(
      entry => {

        if (
          typeof entry === 'string'
        ) {

          return cleanText(
            entry
          );

        }


        if (
          entry &&
          typeof entry === 'object'
        ) {

          return cleanText(
            entry.url ??
            entry.src ??
            entry.data ??
            entry.image ??
            ''
          );

        }


        return '';

      }
    )
    .filter(
      Boolean
    );

}


/* ============================================================
   NORMALIZE ONE ITEM
============================================================ */

function normalizeItem(
  item,
  reviewerName = ''
) {

  const source =
    (
      item &&
      typeof item === 'object'
    )
      ? item
      : {};


  return {

    /*
      Preserve any additional fields.
    */

    ...source,


    checked:
      Boolean(
        source.checked
      ),


    comments:
      normalizeReviewerComments(
        source.comments ??
        source.reviewerComments ??
        source.reviewer_comments ??
        source.reviewComments ??
        [],
        reviewerName
      ),


    photos:
      normalizePhotos(
        source.photos ??
        source.photo ??
        []
      ),


    followUpNeeded:
      Boolean(
        source.followUpNeeded ??
        source.follow_up_needed ??
        false
      ),


    shipComments:
      normalizeShipComments(
        source.shipComments ??
        source.ship_comments ??
        source.shipComment ??
        []
      )

  };

}


/* ============================================================
   NORMALIZE COMPLETE STATE
============================================================ */

function normalizeState(
  incoming,
  reviewerName = ''
) {

  const base =
    emptyState();

  SECTIONS.forEach(section => {
    base[departmentGeneralKey(section.id)] = {
      isDepartmentGeneral: true,
      comments: []
    };
  });


  const source =
    (
      incoming &&
      typeof incoming === 'object'
    )
      ? incoming
      : {};


  Object.keys(
    base
  ).forEach(
    key => {

      if (isDepartmentGeneralKey(key)) {
        base[key] = {
          isDepartmentGeneral: true,
          comments: normalizeDepartmentGeneralComments(
            source[key],
            reviewerName
          )
        };
        return;
      }

      base[key] =
        normalizeItem(
          source[key],
          reviewerName
        );

    }
  );


  return base;

}


/* ============================================================
   REPORT ID
============================================================ */

export function getReportId() {

  return reportId;

}


export function setReportId(
  id
) {

  reportId =
    id ||
    null;

}


/* ============================================================
   META
============================================================ */

export function getMeta() {

  return {

    ...meta

  };

}


export function setMeta(
  newMeta
) {

  meta = {

    ship:
      cleanText(
        newMeta?.ship
      ),

    dateOn:
      cleanText(
        newMeta?.dateOn
      ),

    dateOff:
      cleanText(
        newMeta?.dateOff
      ),

    reviewer:
      cleanText(
        newMeta?.reviewer
      )

  };


  currentReviewer =
    meta.reviewer;

}


/* ============================================================
   REVIEWER
============================================================ */

export function getReviewer() {

  return currentReviewer;

}


export function setReviewer(
  name
) {

  currentReviewer =
    cleanText(
      name
    );


  meta.reviewer =
    currentReviewer;

}


/* ============================================================
   STATE ACCESS
============================================================ */

export function getState() {

  return state;

}


export function getStateCopy() {

  return clone(
    state
  );

}


export function setState(
  newState
) {

  state =
    normalizeState(
      newState,
      currentReviewer ||
      meta.reviewer ||
      'Reviewer'
    );

}


/* ============================================================
   ITEM ACCESS
============================================================ */

export function getItem(
  key
) {

  return state[key];

}


export function updateItem(
  key,
  changes
) {

  if (
    !state[key]
  ) {

    return;

  }


  state[key] = {

    ...state[key],

    ...(changes || {})

  };


  state[key] =
    normalizeItem(
      state[key],
      currentReviewer ||
      meta.reviewer ||
      'Reviewer'
    );

}


/* ============================================================
   CHECKED
============================================================ */

export function toggleChecked(
  key
) {

  if (
    !state[key]
  ) {

    return false;

  }


  state[key].checked =
    !state[key].checked;


  return state[key].checked;

}


export function isChecked(
  key
) {

  return Boolean(
    state[key]?.checked
  );

}


/* ============================================================
   REVIEWER COMMENTS
============================================================ */

export function addReviewerComment(
  key,
  text
) {

  if (
    !state[key]
  ) {

    return false;

  }


  const clean =
    cleanText(
      text
    );


  if (
    !clean
  ) {

    return false;

  }


  if (
    !Array.isArray(
      state[key].comments
    )
  ) {

    state[key].comments =
      [];

  }


  state[key].comments.push({

    name:
      currentReviewer ||
      meta.reviewer ||
      'Reviewer',

    text:
      clean,

    timestamp:
      new Date().toISOString()

  });


  return true;

}


export function setReviewerComments(
  key,
  comments
) {

  if (
    !state[key]
  ) {

    return;

  }


  state[key].comments =
    normalizeReviewerComments(
      comments,
      currentReviewer ||
      meta.reviewer ||
      'Reviewer'
    );

}


/* ============================================================
   PHOTOS
============================================================ */

export function addPhoto(
  key,
  photo
) {

  if (
    !state[key]
  ) {

    return false;

  }


  const clean =
    cleanText(
      photo
    );


  if (
    !clean
  ) {

    return false;

  }


  if (
    !Array.isArray(
      state[key].photos
    )
  ) {

    state[key].photos =
      [];

  }


  state[key].photos.push(
    clean
  );


  return true;

}


export function setPhotos(
  key,
  photos
) {

  if (
    !state[key]
  ) {

    return;

  }


  state[key].photos =
    normalizePhotos(
      photos
    );

}


export function removePhoto(
  key,
  index
) {

  if (
    !state[key]
  ) {

    return false;

  }


  if (
    !Array.isArray(
      state[key].photos
    )
  ) {

    return false;

  }


  if (
    index < 0 ||
    index >= state[key].photos.length
  ) {

    return false;

  }


  state[key].photos.splice(
    index,
    1
  );


  return true;

}


/* ============================================================
   FOLLOW-UP
============================================================ */

export function setFollowUp(
  key,
  needed
) {

  if (
    !state[key]
  ) {

    return;

  }


  state[key].followUpNeeded =
    Boolean(
      needed
    );

}


/* ============================================================
   SHIP COMMENTS
============================================================ */

export function addShipComment(
  key,
  text
) {

  if (
    !state[key]
  ) {

    return false;

  }


  const clean =
    cleanText(
      text
    );


  if (
    !clean
  ) {

    return false;

  }


  if (
    !Array.isArray(
      state[key].shipComments
    )
  ) {

    state[key].shipComments =
      [];

  }


  state[key].shipComments.push({

    name:
      'Ship',

    text:
      clean,

    timestamp:
      new Date().toISOString()

  });


  return true;

}


export function setShipComments(
  key,
  comments
) {

  if (
    !state[key]
  ) {

    return;

  }


  state[key].shipComments =
    normalizeShipComments(
      comments
    );

}


/* ============================================================
   DEPARTMENT GENERAL COMMENTS
============================================================ */

export function getDepartmentGeneralComments(sectionId) {
  const comments = state[departmentGeneralKey(sectionId)]?.comments;
  return Array.isArray(comments) ? comments : [];
}

export function addDepartmentGeneralComment(sectionId, text) {
  const clean = cleanText(text);
  if (!clean) return false;
  const key = departmentGeneralKey(sectionId);
  if (!state[key]) {
    state[key] = { isDepartmentGeneral: true, comments: [] };
  }
  if (!Array.isArray(state[key].comments)) state[key].comments = [];
  state[key].comments.push({
    name: currentReviewer || meta.reviewer || 'Reviewer',
    text: clean,
    timestamp: new Date().toISOString()
  });
  return true;
}

export function setDepartmentGeneralComments(sectionId, comments) {
  state[departmentGeneralKey(sectionId)] = {
    isDepartmentGeneral: true,
    comments: normalizeDepartmentGeneralComments(
      comments,
      currentReviewer || meta.reviewer || 'Reviewer'
    )
  };
}


/* ============================================================
   REPORT STATUS
============================================================ */

export function getReportStatus() {

  return reportStatus;

}


export function setReportStatus(
  status
) {

  const allowed = [

    'open',

    'ship_review',

    'submitted'

  ];


  reportStatus =
    allowed.includes(
      status
    )
      ? status
      : 'open';

}


export function isOpenReport() {

  return (
    reportStatus ===
    'open'
  );

}


export function isShipReviewReport() {

  return (
    reportStatus ===
    'ship_review'
  );

}


export function isSubmittedReport() {

  return (
    reportStatus ===
    'submitted'
  );

}


/* ============================================================
   SUBMITTED DATE
============================================================ */

export function getSubmittedAt() {

  return submittedAt;

}


export function setSubmittedAt(
  value
) {

  submittedAt =
    value ||
    null;

}


/* ============================================================
   FOLLOW-UP COUNTS
============================================================ */

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
    getFollowUpCount() >
    0
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


  if (
    followUps.length === 0
  ) {

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


/* ============================================================
   STATUS COLOR
============================================================ */

export function getStatusColor() {

  if (
    reportStatus ===
    'open'
  ) {

    return 'red';

  }


  if (
    reportStatus ===
    'ship_review'
  ) {

    return 'blue';

  }


  if (
    reportStatus ===
    'submitted'
  ) {

    return 'green';

  }


  return 'blue';

}


/* ============================================================
   RESET REPORT
============================================================ */

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


/* ============================================================
   START NEW REPORT
============================================================ */

export function startNewReport({
  ship,
  dateOn,
  dateOff,
  reviewer
} = {}) {

  reportId =
    null;


  meta = {

    ship:
      cleanText(
        ship
      ),

    dateOn:
      cleanText(
        dateOn
      ),

    dateOff:
      cleanText(
        dateOff
      ),

    reviewer:
      cleanText(
        reviewer
      )

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


/* ============================================================
   LOAD REPORT
============================================================ */

export function loadReport(
  report
) {

  if (
    !report
  ) {

    resetReport();


    return;

  }


  /*
    ID
  */

  setReportId(
    report.id
  );


  /*
    Meta
  */

  const storedMeta =
    report
      ?.report_data
      ?.meta ||
    {};


  meta = {

    ship:
      cleanText(
        report.ship ??
        storedMeta.ship ??
        ''
      ),

    dateOn:
      cleanText(
        report.date_on ??
        storedMeta.dateOn ??
        ''
      ),

    dateOff:
      cleanText(
        report.date_off ??
        storedMeta.dateOff ??
        ''
      ),

    reviewer:
      cleanText(
        report.reviewer ??
        storedMeta.reviewer ??
        ''
      )

  };


  currentReviewer =
    meta.reviewer;


  /*
    Checklist state.

    This is the important part:
    comments, photos, follow-up and ship
    responses are normalized when reports
    are loaded again.
  */

  const storedState =
    report
      ?.report_data
      ?.state ||
    {};


  state =
    normalizeState(
      storedState,
      currentReviewer ||
      meta.reviewer ||
      'Reviewer'
    );


  /*
    Report status.
  */

  setReportStatus(
    report.status ||
    'open'
  );


  /*
    Submitted time.
  */

  setSubmittedAt(
    report.submitted_at ||
    null
  );

}


/* ============================================================
   REPORT DATA
============================================================ */

export function getReportData() {

  return {

    meta:
      getMeta(),

    state:
      getStateCopy()

  };

}


/* ============================================================
   COMPLETE SNAPSHOT
============================================================ */

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


/* ============================================================
   VALIDATION
============================================================ */

export function isValidReport() {

  return Boolean(

    meta.ship &&
    meta.reviewer

  );

}


export function missingRequiredFields() {

  const missing =
    [];


  if (
    !meta.ship
  ) {

    missing.push(
      'Ship'
    );

  }


  if (
    !meta.reviewer
  ) {

    missing.push(
      'Reviewer'
    );

  }


  return missing;

}


/* ============================================================
   SUMMARY COUNTS
============================================================ */

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

      if (item?.isDepartmentGeneral) {
        return;
      }

      total++;


      if (
        item?.checked
      ) {

        checked++;

      }


      if (
        Array.isArray(
          item?.photos
        )
      ) {

        photos +=
          item.photos.length;

      }


      if (
        Array.isArray(
          item?.comments
        )
      ) {

        comments +=
          item.comments.length;

      }


      if (
        item?.followUpNeeded
      ) {

        followUps++;

      }


      if (
        Array.isArray(
          item?.shipComments
        )
      ) {

        shipResponses +=
          item.shipComments.length;

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

    completedFollowUps:
      getCompletedFollowUpCount()

  };

}


/* ============================================================
   CHECKED POINTS
============================================================ */

export function getCheckedPoints() {

  return Object.entries(
    state
  )
  .filter(
    (
      [
        _key,
        item
      ]
    ) =>
      item &&
      item.checked
  )
  .map(
    (
      [
        key,
        item
      ]
    ) => ({

      key,

      ...item

    })
  );

}


/* ============================================================
   FOLLOW-UP POINTS
============================================================ */

export function getFollowUpPoints() {

  return Object.entries(
    state
  )
  .filter(
    (
      [
        _key,
        item
      ]
    ) =>
      item &&
      item.followUpNeeded
  )
  .map(
    (
      [
        key,
        item
      ]
    ) => ({

      key,

      ...item

    })
  );

}


/* ============================================================
   EXPORT NORMALIZATION HELPERS
============================================================ */

export function normalizeReportState(
  value
) {

  return normalizeState(
    value,
    currentReviewer ||
    meta.reviewer ||
    'Reviewer'
  );

}


export function normalizeComments(
  value
) {

  return normalizeReviewerComments(
    value,
    currentReviewer ||
    meta.reviewer ||
    'Reviewer'
  );

}


export function normalizeShipResponseComments(
  value
) {

  return normalizeShipComments(
    value
  );

}


export function normalizeItemState(
  value
) {

  return normalizeItem(
    value,
    currentReviewer ||
    meta.reviewer ||
    'Reviewer'
  );

}
