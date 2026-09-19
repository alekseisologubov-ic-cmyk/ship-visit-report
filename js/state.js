/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  state.js
  ============================================================

  Central state manager.

  Keeps together:

  - Report ID
  - Ship
  - Visit dates
  - Reviewer
  - Checklist state
  - Reviewer comments
  - Photos
  - Follow-up flags
  - Ship comments
  - Report status
  - Submission date
*/


import {
  emptyState
} from './data.js';


/* ============================================================
   CURRENT REPORT
============================================================ */

let reportId = null;


let meta = {

  ship: '',

  dateOn: '',

  dateOff: '',

  reviewer: ''

};


let currentReviewer = '';


let state =
  emptyState();


let reportStatus =
  'open';


let submittedAt =
  null;


/* ============================================================
   BASIC HELPERS
============================================================ */

function cleanText(
  value
){

  return String(
    value ?? ''
  ).trim();

}


function safeArray(
  value
){

  if(
    Array.isArray(value)
  ){

    return value;

  }


  /*
    Support JSON strings from
    older/saved report records.
  */

  if(
    typeof value === 'string'
  ){

    const text =
      value.trim();


    if(
      !text
    ){

      return [];

    }


    try{

      const parsed =
        JSON.parse(
          text
        );


      return Array.isArray(
        parsed
      )
        ? parsed
        : [];

    }catch(error){

      return [];

    }

  }


  return [];

}


/* ============================================================
   NORMALIZE REVIEWER COMMENTS
============================================================ */

function normalizeReviewerComments(
  comments,
  reviewerName=''
){

  const source =
    safeArray(
      comments
    );


  return source
    .map(
      comment => {

        /*
          Older format may have been
          saved as a plain string.
        */

        if(
          typeof comment === 'string'
        ){

          const text =
            cleanText(
              comment
            );


          if(
            !text
          ){

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


        if(
          !comment ||
          typeof comment !== 'object'
        ){

          return null;

        }


        const text =
          cleanText(
            comment.text ??
            comment.comment ??
            comment.message ??
            comment.value ??
            ''
          );


        if(
          !text
        ){

          return null;

        }


        return {

          name:
            cleanText(
              comment.name ??
              comment.reviewer ??
              comment.author ??
              reviewerName ??
              'Reviewer'
            ) ||
            'Reviewer',

          text,

          timestamp:
            comment.timestamp ??
            comment.createdAt ??
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
  comments
){

  const source =
    safeArray(
      comments
    );


  return source
    .map(
      comment => {

        if(
          typeof comment === 'string'
        ){

          const text =
            cleanText(
              comment
            );


          if(
            !text
          ){

            return null;

          }


          return {

            name:'Ship',

            text,

            timestamp:null

          };

        }


        if(
          !comment ||
          typeof comment !== 'object'
        ){

          return null;

        }


        const text =
          cleanText(
            comment.text ??
            comment.comment ??
            comment.message ??
            comment.value ??
            ''
          );


        if(
          !text
        ){

          return null;

        }


        return {

          name:
            cleanText(
              comment.name ??
              comment.ship ??
              'Ship'
            ) ||
            'Ship',

          text,

          timestamp:
            comment.timestamp ??
            comment.createdAt ??
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
  photos
){

  const source =
    safeArray(
      photos
    );


  return source
    .map(
      photo => {

        if(
          typeof photo === 'string'
        ){

          return cleanText(
            photo
          );

        }


        if(
          photo &&
          typeof photo === 'object'
        ){

          return (
            photo.url ||
            photo.src ||
            photo.data ||
            photo.image ||
            ''
          );

        }


        return '';

      }
    )
    .map(
      cleanText
    )
    .filter(
      Boolean
    );

}


/* ============================================================
   NORMALIZE ONE CHECKLIST ITEM
============================================================ */

function normalizeItem(
  saved,
  reviewerName=''
){

  const item =
    (
      saved &&
      typeof saved === 'object'
    )
      ? saved
      : {};


  return {

    /*
      Preserve checked state.
    */

    checked:
      Boolean(
        item.checked
      ),


    /*
      Preserve reviewer comments.
    */

    comments:
      normalizeReviewerComments(
        item.comments ??
        item.reviewerComments ??
        item.reviewer_comments ??
        item.reviewComments ??
        [],
        reviewerName
      ),


    /*
      Preserve photos.
    */

    photos:
      normalizePhotos(
        item.photos ??
        item.photo ??
        []
      ),


    /*
      Preserve follow-up.
    */

    followUpNeeded:
      Boolean(
        item.followUpNeeded ??
        item.follow_up_needed ??
        false
      ),


    /*
      Preserve ship responses.
    */

    shipComments:
      normalizeShipComments(
        item.shipComments ??
        item.ship_comments ??
        item.shipComment ??
        []
      )

  };

}


/* ============================================================
   NORMALIZE COMPLETE STATE
============================================================ */

function normalizeState(
  savedState,
  reviewerName=''
){

  const initial =
    emptyState();


  const saved =
    (
      savedState &&
      typeof savedState === 'object'
    )
      ? savedState
      : {};


  Object.keys(
    initial
  )
  .forEach(
    key => {

      initial[key] =
        normalizeItem(
          saved[key],
          reviewerName
        );

    }
  );


  /*
    Preserve only valid checklist keys.
  */

  Object.keys(
    saved
  )
  .forEach(
    key => {

      if(
        !initial[key]
      ){

        return;

      }


      /*
        If the saved item contains additional
        application properties, preserve them
        while making sure our core fields are
        normalized.
      */

      initial[key] = {

        ...initial[key],

        ...(
          saved[key] &&
          typeof saved[key] === 'object'
            ? saved[key]
            : {}
        ),

        checked:
          Boolean(
            saved[key]?.checked
          ),

        comments:
          normalizeReviewerComments(
            saved[key]?.comments ??
            saved[key]?.reviewerComments ??
            saved[key]?.reviewer_comments ??
            saved[key]?.reviewComments ??
            [],
            reviewerName
          ),

        photos:
          normalizePhotos(
            saved[key]?.photos ??
            saved[key]?.photo ??
            []
          ),

        followUpNeeded:
          Boolean(
            saved[key]?.followUpNeeded ??
            saved[key]?.follow_up_needed ??
            false
          ),

        shipComments:
          normalizeShipComments(
            saved[key]?.shipComments ??
            saved[key]?.ship_comments ??
            saved[key]?.shipComment ??
            []
          )

      };

    }
  );


  return initial;

}


/* ============================================================
   REPORT ID
============================================================ */

export function getReportId(){

  return reportId;

}


export function setReportId(
  id
){

  reportId =
    id ||
    null;

}


/* ============================================================
   META
============================================================ */

export function getMeta(){

  return {

    ...meta

  };

}


export function setMeta(
  newMeta
){

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

export function getReviewer(){

  return currentReviewer;

}


export function setReviewer(
  name
){

  currentReviewer =
    cleanText(
      name
    );


  meta.reviewer =
    currentReviewer;

}


/* ============================================================
   STATE
============================================================ */

export function getState(){

  return state;

}


export function getStateCopy(){

  return JSON.parse(
    JSON.stringify(
      state
    )
  );

}


export function setState(
  newState
){

  state =
    normalizeState(
      newState,
      currentReviewer ||
      meta.reviewer ||
      'Reviewer'
    );

}


/* ============================================================
   GET ITEM
============================================================ */

export function getItem(
  key
){

  return state[key];

}


/* ============================================================
   UPDATE ITEM
============================================================ */

export function updateItem(
  key,
  changes
){

  if(
    !state[key]
  ){

    return;

  }


  state[key] = {

    ...state[key],

    ...(changes || {})

  };


  /*
    Immediately normalize the
    core data after an update.
  */

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
){

  if(
    !state[key]
  ){

    return false;

  }


  state[key].checked =
    !state[key].checked;


  return state[key].checked;

}


export function isChecked(
  key
){

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
){

  if(
    !state[key]
  ){

    return;

  }


  const clean =
    cleanText(
      text
    );


  if(
    !clean
  ){

    return;

  }


  if(
    !Array.isArray(
      state[key].comments
    )
  ){

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

}


/* ============================================================
   REPLACE REVIEWER COMMENTS
============================================================ */

export function setReviewerComments(
  key,
  comments
){

  if(
    !state[key]
  ){

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
){

  if(
    !state[key]
  ){

    return;

  }


  const clean =
    cleanText(
      photo
    );


  if(
    !clean
  ){

    return;

  }


  if(
    !Array.isArray(
      state[key].photos
    )
  ){

    state[key].photos =
      [];

  }


  state[key].photos.push(
    clean
  );

}


export function removePhoto(
  key,
  index
){

  if(
    !state[key]
  ){

    return;

  }


  if(
    !Array.isArray(
      state[key].photos
    )
  ){

    return;

  }


  if(
    index < 0 ||
    index >=
      state[key].photos.length
  ){

    return;

  }


  state[key].photos.splice(
    index,
    1
  );

}


/* ============================================================
   FOLLOW-UP
============================================================ */

export function setFollowUp(
  key,
  needed
){

  if(
    !state[key]
  ){

    return;

  }


  state[key].followUpNeeded =
    Boolean(
      needed
    );


  /*
    When follow-up is removed,
    ship responses are cleared.
  */

  if(
    !state[key].followUpNeeded
  ){

    state[key].shipComments =
      [];

  }

}


/* ============================================================
   SHIP COMMENTS
============================================================ */

export function addShipComment(
  key,
  text
){

  if(
    !state[key]
  ){

    return;

  }


  const clean =
    cleanText(
      text
    );


  if(
    !clean
  ){

    return;

  }


  if(
    !Array.isArray(
      state[key].shipComments
    )
  ){

    state[key].shipComments =
      [];

  }


  state[key].shipComments.push({

    name:'Ship',

    text:
      clean,

    timestamp:
      new Date().toISOString()

  });

}


/* ============================================================
   REPLACE SHIP COMMENTS
============================================================ */

export function setShipComments(
  key,
  comments
){

  if(
    !state[key]
  ){

    return;

  }


  state[key].shipComments =
    normalizeShipComments(
      comments
    );

}


/* ============================================================
   REPORT STATUS
============================================================ */

export function getReportStatus(){

  return reportStatus;

}


export function setReportStatus(
  status
){

  const allowed = [

    'open',

    'submitted'

  ];


  reportStatus =
    allowed.includes(
      status
    )
      ? status
      : 'open';

}


export function isOpenReport(){

  return (
    reportStatus ===
    'open'
  );

}


export function isSubmittedReport(){

  return (
    reportStatus ===
    'submitted'
  );

}


/* ============================================================
   SUBMITTED DATE
============================================================ */

export function getSubmittedAt(){

  return submittedAt;

}


export function setSubmittedAt(
  value
){

  submittedAt =
    value ||
    null;

}


/* ============================================================
   FOLLOW-UP COUNT
============================================================ */

export function getFollowUpCount(){

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


export function getCompletedFollowUpCount(){

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


export function hasFollowUps(){

  return (
    getFollowUpCount() >
    0
  );

}


export function areAllFollowUpsComplete(){

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
    No follow-ups means the report
    is already complete.
  */

  if(
    followUps.length === 0
  ){

    return true;

  }


  return followUps.every(
    item =>
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length >
        0
  );

}


/* ============================================================
   STATUS COLOR
============================================================ */

export function getStatusColor(){

  if(
    reportStatus ===
    'open'
  ){

    return 'red';

  }


  if(
    areAllFollowUpsComplete()
  ){

    return 'green';

  }


  return 'blue';

}


/* ============================================================
   RESET
============================================================ */

export function resetReport(){

  reportId =
    null;


  meta = {

    ship:'',

    dateOn:'',

    dateOff:'',

    reviewer:''

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

}){

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
){

  if(
    !report
  ){

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
    Meta can exist both at the
    top level and inside report_data.
  */

  const savedMeta =
    report
      ?.report_data
      ?.meta ||
    {};


  meta = {

    ship:
      cleanText(
        report.ship ??
        savedMeta.ship
      ),

    dateOn:
      cleanText(
        report.date_on ??
        savedMeta.dateOn
      ),

    dateOff:
      cleanText(
        report.date_off ??
        savedMeta.dateOff
      ),

    reviewer:
      cleanText(
        report.reviewer ??
        savedMeta.reviewer
      )

  };


  currentReviewer =
    meta.reviewer;


  /*
    IMPORTANT:
    Normalize the complete report state
    instead of simply spreading it.

    This preserves reviewer comments,
    photos, follow-ups and ship responses.
  */

  const savedState =
    report
      ?.report_data
      ?.state ||
    {};


  state =
    normalizeState(
      savedState,
      currentReviewer ||
      meta.reviewer ||
      'Reviewer'
    );


  /*
    Status
  */

  setReportStatus(
    report.status ||
    'open'
  );


  /*
    Submitted date
  */

  setSubmittedAt(
    report.submitted_at ||
    null
  );

}


/* ============================================================
   REPORT DATA
============================================================ */

export function getReportData(){

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

export function getSnapshot(){

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

export function isValidReport(){

  return Boolean(

    meta.ship &&
    meta.reviewer

  );

}


export function missingRequiredFields(){

  const missing =
    [];


  if(
    !meta.ship
  ){

    missing.push(
      'Ship'
    );

  }


  if(
    !meta.reviewer
  ){

    missing.push(
      'Reviewer'
    );

  }


  return missing;

}


/* ============================================================
   SUMMARY COUNTS
============================================================ */

export function getSummaryCounts(){

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


      if(
        item
