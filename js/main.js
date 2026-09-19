/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  main.js
  ============================================================

  STABLE MASTER CONTROLLER

  IMPORTANT:
  This version intentionally does NOT depend on reports.js
  for loading Open Reports, Ship Response Reports, or
  Submitted Reports.

  That removes one of the current freeze points.

  FLOW:

    HOME
      |
      +-- CREATE REPORT
      |      |
      |      +-- DEPARTMENT HOME
      |             |
      |             +-- CHECKLIST
      |             |
      |             +-- REPORT SUMMARY
      |             |
      |             +-- SEND TO SHIP REVIEW
      |
      +-- OPEN REPORTS
      |      |
      |      +-- OPEN REPORT
      |
      +-- SHIP RESPONSE REPORT
      |      |
      |      +-- SHIP RESPONSE
      |             |
      |             +-- SUBMITTED
      |
      +-- SUBMITTED REPORTS
             |
             +-- REVIEW REPORT
                    |
                    +-- SAVE PDF
*/


/* ============================================================
   CORE IMPORTS
============================================================ */

import {
  SECTIONS
} from './data.js';


import {
  startNewReport,
  resetReport,
  loadReport,
  getMeta,
  getState,
  getReviewer,
  setReviewer,
  getReportId,
  setReportId
} from './state.js';


import {
  saveOpenReport,
  getOpenReports,
  getShipReviewReports,
  getSubmittedReports,
  getReport,
  submitShipResponse
} from './supabase.js';


/* ============================================================
   MODULE CACHE
============================================================ */

let checklistModule = null;

let reviewModule = null;

let pdfModule = null;


/* ============================================================
   NAVIGATION STATE
============================================================ */

let checklistReturnScreen =
  'home';


let summaryReturnScreen =
  'checklist';


let currentSubmittedReport =
  null;


/* ============================================================
   ADMIN
============================================================ */

const ADMIN_EMAILS = [
  'alebass80@gmail.com'
];


let adminMode =
  false;
function isAdmin(){

  return Boolean(
    adminMode
  );

}


/* ============================================================
   SCREENS
============================================================ */

const SCREENS = [
  'home',
  'setup',
  'checklist',
  'review',
  'summary',
  'followups',
  'open',
  'submitted',
  'responses'
];


/* ============================================================
   GLOBAL ADMIN FUNCTION
============================================================ */

window.shipVisitIsAdmin =
function(){

  return Boolean(
    adminMode
  );

};


/* ============================================================
   START
============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


/* ============================================================
   INITIALIZE
============================================================ */

function initializeApp(){

  console.log(
    'Ship Visit Report starting...'
  );


  window.__SHIP_VISIT_SECTIONS__ =
    SECTIONS;


  restoreAdminMode();

  setupDefaultDate();

  bindAdminButton();

  bindHomeButtons();

  bindCreateReport();

  bindChecklistButtons();

  bindReviewButtons();

  bindSummaryButtons();

  bindFollowUpButtons();

  bindPDFButtons();

  bindHeaderBackButtons();

  updateAdminButton();


  /*
    Always start on HOME.
  */

  showScreen(
    'home'
  );


  console.log(
    'Ship Visit Report ready.'
  );

}


/* ============================================================
   SAFE MODULE LOADERS
============================================================ */

async function getChecklistModule(){

  if(
    checklistModule
  ){

    return checklistModule;

  }


  try{

    checklistModule =
      await import(
        './checklist.js'
      );


    return checklistModule;

  }catch(error){

    console.error(
      'checklist.js:',
      error
    );


    showError(
      'Checklist module could not be loaded.',
      error
    );


    return null;

  }

}


async function getReviewModule(){

  if(
    reviewModule
  ){

    return reviewModule;

  }


  try{

    reviewModule =
      await import(
        './review.js'
      );


    return reviewModule;

  }catch(error){

    console.error(
      'review.js:',
      error
    );


    showError(
      'Ship Review module could not be loaded.',
      error
    );


    return null;

  }

}


async function getPDFModule(){

  if(
    pdfModule
  ){

    return pdfModule;

  }


  try{

    pdfModule =
      await import(
        './pdf.js'
      );


    return pdfModule;

  }catch(error){

    console.error(
      'pdf.js:',
      error
    );


    showError(
      'PDF module could not be loaded.',
      error
    );


    return null;

  }

}


/* ============================================================
   SCREEN NAVIGATION
============================================================ */

export function showScreen(
  screen
){

  const target =
    SCREENS.includes(
      screen
    )
      ? screen
      : 'home';


  SCREENS.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if(
        !element
      ){

        return;

      }


      if(
        id === target
      ){

        element.classList.remove(
          'hidden'
        );


        element.style.display =
          '';

      }else{

        element.classList.add(
          'hidden'
        );


        element.style.display =
          'none';

      }

    }
  );


  window.scrollTo(
    0,
    0
  );

}


/* ============================================================
   CLICK HELPER
============================================================ */

function bindClick(
  id,
  handler
){

  const element =
    document.getElementById(
      id
    );


  if(
    !element
  ){

    return;

  }


  element.addEventListener(
    'click',
    handler
  );

}


/* ============================================================
   HOME
============================================================ */

function bindHomeButtons(){

  bindClick(
    'createReport',
    function(){

      clearSetupFields();

      setupDefaultDate();

      currentSubmittedReport =
        null;

      checklistReturnScreen =
        'setup';

      summaryReturnScreen =
        'checklist';

      showScreen(
        'setup'
      );

    }
  );


  bindClick(
    'openReport',
    async function(){

      showScreen(
        'open'
      );


      await loadOpenReportsScreen();

    }
  );


  bindClick(
    'submittedReports',
    async function(){

      showScreen(
        'submitted'
      );


      await loadSubmittedReportsScreen();

    }
  );


  bindClick(
    'shipResponseReport',
    async function(){

      /*
        IMPORTANT:
        Show the page first.
        The Back button is therefore immediately available.
      */

      showScreen(
        'responses'
      );


      await loadShipResponsesScreen();

    }
  );


  bindClick(
    'setupHome',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'openHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'reportsHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'responsesHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'followupsHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );

}


/* ============================================================
   SETUP
============================================================ */

function bindCreateReport(){

  bindClick(
    'startBtn',
    handleStartReport
  );

}


function clearSetupFields(){

  [
    'ship',
    'dateOn',
    'dateOff',
    'reviewer'

  ].forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if(
        element
      ){

        element.value =
          '';

      }

    }
  );

}


function setupDefaultDate(){

  const element =
    document.getElementById(
      'dateOn'
    );


  if(
    element &&
    !element.value
  ){

    element.value =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

  }

}


/* ============================================================
   CREATE REPORT
============================================================ */

async function handleStartReport(){

  const ship =
    document
      .getElementById(
        'ship'
      )
      ?.value
      .trim() ||
    '';


  const dateOn =
    document
      .getElementById(
        'dateOn'
      )
      ?.value ||
    '';


  const dateOff =
    document
      .getElementById(
        'dateOff'
      )
      ?.value ||
    '';


  const reviewer =
    document
      .getElementById(
        'reviewer'
      )
      ?.value
      .trim() ||
    '';


  if(
    !ship
  ){

    alert(
      'Please enter the ship.'
    );


    return;

  }


  if(
    !reviewer
  ){

    alert(
      'Please enter the reviewer.'
    );


    return;

  }


  try{

    startNewReport({

      ship,

      dateOn,

      dateOff,

      reviewer

    });


    checklistReturnScreen =
      'setup';


    summaryReturnScreen =
      'checklist';


    /*
      Create database record first.
    */

    const result =
      await withTimeout(
        saveOpenReport({

          reportId:null,

          meta:
            getMeta(),

          state:
            getState()

        }),
        15000,
        'Creating report timed out.'
      );


    if(
      !result ||
      !result.success ||
      !result.data
    ){

      throw (
        result?.error ||
        new Error(
          'Could not create the report.'
        )
      );

    }


    setReportId(
      result.data.id
    );


    const checklist =
      await getChecklistModule();


    if(
      !checklist
    ){

      return;

    }


    if(
      typeof checklist.updateChecklistHeader ===
      'function'
    ){

      checklist.updateChecklistHeader();

    }


    checklist.renderChecklist();


    showScreen(
      'checklist'
    );


    showToast(
      'OPEN REPORT CREATED'
    );

  }catch(error){

    console.error(
      'handleStartReport:',
      error
    );


    showError(
      'Could not create the report.',
      error
    );

  }

}


/* ============================================================
   SAVE CURRENT REPORT
============================================================ */

async function saveCurrentReport(){

  const reportId =
    getReportId();


  if(
    !reportId
  ){

    return false;

  }


  try{

    const result =
      await withTimeout(
        saveOpenReport({

          reportId,

          meta:
            getMeta(),

          state:
            getState()

        }),
        15000,
        'Saving report timed out.'
      );


    return Boolean(
      result &&
      result.success
    );

  }catch(error){

    console.error(
      'saveCurrentReport:',
      error
    );


    return false;

  }

}


/* ============================================================
   CHECKLIST BUTTONS
============================================================ */

function bindChecklistButtons(){

  bindClick(
    'summaryBtn',
    async function(){

      const saved =
        await saveCurrentReport();


      if(
        !saved
      ){

        alert(
          'Could not save the report.'
        );


        return;

      }


      summaryReturnScreen =
        'checklist';


      renderCurrentReportSummary(
        {
          id:
            getReportId(),

          ship:
            getMeta().ship,

          date_on:
            getMeta().dateOn,

          date_off:
            getMeta().dateOff,

          reviewer:
            getMeta().reviewer,

          report_data:{

            meta:
              getMeta(),

            state:
              getState()

          }

        }
      );


      setSummaryMode(
        false
      );


      showScreen(
        'summary'
      );

    }
  );


  bindClick(
    'shipReviewBtn',
    async function(){

      await openShipReview();

    }
  );


  const reviewer =
    document.getElementById(
      'hdrReviewer'
    );


  if(
    reviewer
  ){

    reviewer.addEventListener(
      'change',
      async function(
        event
      ){

        setReviewer(
          event.target.value
        );


        await saveCurrentReport();

      }
    );

  }

}


/* ============================================================
   OPEN SHIP REVIEW
============================================================ */

async function openShipReview(){

  const saved =
    await saveCurrentReport();


  if(
    !saved
  ){

    alert(
      'Could not save the report.'
    );


    return;

  }


  const review =
    await getReviewModule();


  if(
    !review
  ){

    return;

  }


  try{

    if(
      typeof review.setReviewCallbacks ===
      'function'
    ){

      review.setReviewCallbacks({

        sentToShip:
          async function(){

            showToast(
              'REPORT SENT TO SHIP'
            );


            showScreen(
              'responses'
            );


            await loadShipResponsesScreen();

          }

      });

    }


    const prepared =
      await withTimeout(
        review.prepareShipReview(),
        15000,
        'Preparing Ship Review timed out.'
      );


    if(
      prepared === false
    ){

      return;

    }


    showScreen(
      'review'
    );

  }catch(error){

    console.error(
      'openShipReview:',
      error
    );


    showError(
      'Could not open Ship Review.',
      error
    );

  }

}


/* ============================================================
   REVIEW
============================================================ */

function bindReviewButtons(){

  bindClick(
    'reviewBackBtn',
    async function(){

      await returnToChecklist();

    }
  );


  bindClick(
    'reviewSubmitBtn',
    async function(){

      const review =
        await getReviewModule();


      if(
        !review
      ){

        return;

      }


      try{

        await review.sendCurrentReportToShip();

      }catch(error){

        console.error(
          'reviewSubmitBtn:',
          error
        );


        showError(
          'Could not send the report to Ship Review.',
          error
        );

      }

    }
  );

}


async function returnToChecklist(){

  const checklist =
    await getChecklistModule();


  if(
    !checklist
  ){

    return;

  }


  if(
    typeof checklist.updateChecklistHeader ===
    'function'
  ){

    checklist.updateChecklistHeader();

  }


  checklist.renderChecklist();


  showScreen(
    'checklist'
  );

}


/* ============================================================
   SUMMARY
============================================================ */

function bindSummaryButtons(){

  bindClick(
    'summaryBackToReportBtn',
    async function(){

      await returnToChecklist();

    }
  );


  bindClick(
    'summarySubmitBtn',
    async function(){

      await openShipReview();

    }
  );


  bindClick(
    'summaryBackToSubmittedBtn',
    async function(){

      showScreen(
        'submitted'
      );


      await loadSubmittedReportsScreen();

    }
  );


  bindClick(
    'summaryPdfBtn',
    async function(){

      if(
        !currentSubmittedReport
      ){

        alert(
          'No submitted report selected.'
        );


        return;

      }


      const pdf =
        await getPDFModule();


      if(
        !pdf
      ){

        return;

      }


      try{

        loadReport(
          currentSubmittedReport
        );


        pdf.generatePDF();

      }catch(error){

        console.error(
          'summaryPdfBtn:',
          error
        );


        showError(
          'Could not save PDF.',
          error
        );

      }

    }
  );

}


/* ============================================================
   SUMMARY MODE
============================================================ */

function setSummaryMode(
  submitted
){

  const active =
    document.getElementById(
      'summaryActiveActions'
    );


  const submittedActions =
    document.getElementById(
      'summarySubmittedActions'
    );


  if(
    active
  ){

    active.classList.toggle(
      'hidden',
      Boolean(
        submitted
      )
    );

  }


  if(
    submittedActions
  ){

    submittedActions.classList.toggle(
      'hidden',
      !submitted
    );

  }

}


/* ============================================================
   REPORT POINTS
============================================================ */

function getReportPoints(
  report,
  onlyChecked = true
){

  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const reviewer =
    report?.reviewer ||
    report
      ?.report_data
      ?.meta
      ?.reviewer ||
    '';


  const points =
    [];


  SECTIONS.forEach(
    section => {

      if(
        !Array.isArray(
          section.items
        )
      ){

        return;

      }


      section.items.forEach(
        (
          text,
          index
        ) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if(
            !item
          ){

            return;

          }


          if(
            onlyChecked &&
            !item.checked
          ){

            return;

          }


          points.push({

            key,

            section:
              section.title,

            text,

            checked:
              Boolean(
                item.checked
              ),

            comments:
              getReviewerComments(
                item,
                reviewer
              ),

            photos:
              getPhotos(
                item
              ),

            followUpNeeded:
              Boolean(
                item.followUpNeeded
              ),

            shipComments:
              getShipComments(
                item
              )

          });

        }
      );

    }
  );


  return points;

}


/* ============================================================
   REVIEWER COMMENTS
============================================================ */

function getReviewerComments(
  item,
  fallbackReviewer = ''
){

  if(
    !item
  ){

    return [];

  }


  const candidates = [

    item.comments,

    item.reviewerComments,

    item.reviewer_comments,

    item.reviewComments

  ];


  for(
    const candidate of
    candidates
  ){

    const normalized =
      normalizeCommentValue(
        candidate,
        fallbackReviewer
      );


    if(
      normalized.length
    ){

      return normalized;

    }

  }


  const legacyFields = [

    'reviewerComment',

    'reviewer_comment',

    'reviewComment',

    'review_comment',

    'comment',

    'note'

  ];


  for(
    const field of
    legacyFields
  ){

    if(
      typeof item[field] ===
      'string' &&
      item[field].trim()
    ){

      return [

        {

          name:
            fallbackReviewer ||
            'Reviewer',

          text:
            item[field].trim(),

          timestamp:
            null

        }

      ];

    }

  }


  return [];

}


function normalizeCommentValue(
  value,
  fallbackName
){

  if(
    !value
  ){

    return [];

  }


  if(
    Array.isArray(
      value
    )
  ){

    return value
      .map(
        comment =>
          normalizeOneComment(
            comment,
            fallbackName
          )
      )
      .filter(
        Boolean
      );

  }


  const one =
    normalizeOneComment(
      value,
      fallbackName
    );


  return one
    ? [one]
    : [];

}


function normalizeOneComment(
  value,
  fallbackName
){

  if(
    typeof value ===
    'string'
  ){

    const text =
      value.trim();


    if(
      !text
    ){

      return null;

    }


    return {

      name:
        fallbackName ||
        'Reviewer',

      text,

      timestamp:
        null

    };

  }


  if(
    !value ||
    typeof value !==
      'object'
  ){

    return null;

  }


  const text =
    String(
      value.text ??
      value.comment ??
      value.message ??
      value.value ??
      ''
    ).trim();


  if(
    !text
  ){

    return null;

  }


  return {

    name:
      String(
        value.name ??
        value.reviewer ??
        value.author ??
        fallbackName ??
        'Reviewer'
      ).trim() ||
      'Reviewer',

    text,

    timestamp:
      value.timestamp ??
      value.createdAt ??
      null

  };

}


/* ============================================================
   PHOTOS
============================================================ */

function getPhotos(
  item
){

  if(
    !item
  ){

    return [];

  }


  if(
    !Array.isArray(
      item.photos
    )
  ){

    return [];

  }


  return item.photos
    .map(
      photo => {

        if(
          typeof photo ===
          'string'
        ){

          return photo;

        }


        if(
          photo &&
          typeof photo ===
          'object'
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
    .filter(
      Boolean
    );

}


/* ============================================================
   SHIP COMMENTS
============================================================ */

function getShipComments(
  item
){

  if(
    !item
  ){

    return [];

  }


  const value =
    item.shipComments ??
    item.ship_comments ??
    item.shipComment ??
    [];


  if(
    Array.isArray(
      value
    )
  ){

    return value
      .map(
        comment =>
          normalizeShipComment(
            comment
          )
      )
      .filter(
        Boolean
      );

  }


  if(
    typeof value ===
    'string' &&
    value.trim()
  ){

    return [

      {

        name:
          'Ship',

        text:
          value.trim(),

        timestamp:
          null

      }

    ];

  }


  return [];

}


function normalizeShipComment(
  value
){

  if(
    typeof value ===
    'string'
  ){

    const text =
      value.trim();


    return text
      ? {

          name:
            'Ship',

          text,

          timestamp:
            null

        }
      : null;

  }


  if(
    !value ||
    typeof value !==
      'object'
  ){

    return null;

  }


  const text =
    String(
      value.text ??
      value.comment ??
      value.message ??
      ''
    ).trim();


  if(
    !text
  ){

    return null;

  }


  return {

    name:
      value.name ||
      value.ship ||
      'Ship',

    text,

    timestamp:
      value.timestamp ??
      value.createdAt ??
      null

  };

}


/* ============================================================
   SUMMARY RENDERER
============================================================ */

function renderCurrentReportSummary(
  report
){

  const container =
    document.getElementById(
      'report-overall-content'
    );


  if(
    !container
  ){

    return;

  }


  const points =
    getReportPoints(
      report,
      true
    );


  if(
    points.length ===
    0
  ){

    container.innerHTML = `

      <div class="empty">

        No checklist points were checked.

      </div>

    `;


    return;

  }


  const groups =
    groupPoints(
      points
    );


  const meta =
    report
      ?.report_data
      ?.meta ||
    {};


  container.innerHTML = `

    <div
      style="
        margin-bottom:18px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:16px;
          font-weight:800;
        "
      >

        REPORT OVERALL

      </div>


      <div
        style="
          margin-top:6px;
          color:var(--vv-gray);
          font-size:11px;
          line-height:1.7;
        "
      >

        <b>Ship:</b>

        ${escapeHtml(
          report.ship ||
          meta.ship ||
          ''
        )}

        <br>


        <b>Visit:</b>

        ${escapeHtml(
          report.date_on ||
          meta.dateOn ||
          ''
        )}

        ${
          report.date_off ||
          meta.dateOff
            ? ` → ${escapeHtml(
                report.date_off ||
                meta.dateOff ||
                ''
              )}`
            : ''
        }

        <br>


        <b>Reviewer:</b>

        ${escapeHtml(
          report.reviewer ||
          meta.reviewer ||
          ''
        )}

      </div>

    </div>


    ${
      groups
        .map(
          group => `

            <div
              style="
                margin-bottom:20px;
              "
            >

              <div
                style="
                  margin-bottom:9px;
                  padding-bottom:6px;
                  border-bottom:2px solid var(--vv-red);
                  color:var(--vv-squid);
                  font-size:14px;
                  font-weight:800;
                "
              >

                ${escapeHtml(
                  group.section
                )}

              </div>


              ${
                group.points
                  .map(
                    renderSummaryPoint
                  )
                  .join('')
              }

            </div>

          `
        )
        .join('')
    }

  `;

}


function groupPoints(
  points
){

  const groups =
    [];


  points.forEach(
    point => {

      let group =
        groups.find(
          entry =>
            entry.section ===
            point.section
        );


      if(
        !group
      ){

        group = {

          section:
            point.section,

          points:[]

        };


        groups.push(
          group
        );

      }


      group.points.push(
        point
      );

    }
  );


  return groups;

}


function renderSummaryPoint(
  point
){

  const completed =
    point.followUpNeeded &&
    point.shipComments.length >
      0;


  return `

    <div
      style="
        margin-bottom:11px;
        padding:12px;
        border:1px solid var(--vv-line);
        border-left:4px solid var(--vv-squid);
        border-radius:8px;
        background:#FFFFFF;
      "
    >

      <div
        style="
          display:flex;
          align-items:flex-start;
          gap:8px;
        "
      >

        <div
          style="
            width:22px;
            height:22px;
            flex:0 0 22px;
            display:flex;
            align-items:center;
            justify-content:center;
            border-radius:50%;
            background:var(--vv-red);
            color:#FFFFFF;
            font-size:11px;
            font-weight:800;
          "
        >

          ✓

        </div>


        <div
          style="
            flex:1;
            font-size:13px;
            line-height:1.5;
            font-weight:700;
          "
        >

          ${escapeHtml(
            point.text
          )}

        </div>

      </div>


      ${
        point.followUpNeeded
          ? `

            <div
              style="
                margin-top:9px;
              "
            >

              <span
                class="status ${
                  completed
                    ? 'green'
                    : 'blue'
                }"
              >

                ${
                  completed
                    ? 'SHIP FOLLOW-UP COMPLETED'
                    : 'FOLLOW-UP NEEDED FROM SHIP'
                }

              </span>

            </div>

          `
          : ''
      }


      ${
        point.comments.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
              >

                REVIEWER COMMENTS

              </div>


              ${
                point.comments
                  .map(
                    comment => `

                      <div
                        class="comment"
                      >

                        <strong>

                          ${escapeHtml(
                            comment.name ||
                            'Reviewer'
                          )}:

                        </strong>


                        <div
                          style="
                            margin-top:3px;
                          "
                        >

                          ${escapeHtml(
                            comment.text
                          )}

                        </div>

                      </div>

                    `
                  )
                  .join('')
              }

            </div>

          `
          : ''
      }


      ${
        point.photos.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
              >

                ATTACHED PHOTOS

              </div>


              <div
                class="response-photos"
              >

                ${
                  point.photos
                    .map(
                      photo => `

                        <div
                          class="response-photo"
                        >

                          <img
                            src="${escapeHtml(
                              photo
                            )}"
                            alt="Reviewer photo"
                          >

                        </div>

                      `
                    )
                    .join('')
                }

              </div>

            </div>

          `
          : ''
      }


      ${
        point.shipComments.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
                style="
                  color:var(--status-green);
                "
              >

                SHIP COMMENTS / RESPONSES

              </div>


              ${
                point.shipComments
                  .map(
                    comment => `

                      <div
                        class="ship-response-display"
                      >

                        <strong>

                          ${escapeHtml(
                            comment.name
                          )}:

                        </strong>


                        <div
                          style="
                            margin-top:3px;
                          "
                        >

                          ${escapeHtml(
                            comment.text
                          )}

                        </div>

                      </div>

                    `
                  )
                  .join('')
              }

            </div>

          `
          : ''
      }


    </div>

  `;

}
/* ============================================================
   OPEN REPORTS
============================================================ */

async function loadOpenReportsScreen(){

  const container =
    document.getElementById(
      'openList'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML = `

    <div class="empty">

      Loading open reports...

    </div>

  `;


  try{

    const result =
      await withTimeout(
        getOpenReports(),
        15000,
        'Loading open reports timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load open reports.'
        )
      );

    }


    const reports =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    renderOpenReports(
      container,
      reports
    );

  }catch(error){

    console.error(
      'loadOpenReportsScreen:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load Open Reports.

        <br><br>

        ${escapeHtml(
          error?.message ||
          'Unknown error'
        )}

      </div>

    `;

  }

}


/* ============================================================
   RENDER OPEN REPORTS
============================================================ */

function renderOpenReports(
  container,
  reports
){

  if(
    reports.length ===
    0
  ){

    container.innerHTML = `

      <div class="empty">

        No open reports.

      </div>

    `;


    return;

  }


  container.innerHTML =
    reports
      .map(
        report => `

          <div
            class="report-card red"
          >

            <h3>

              ${escapeHtml(
                report.ship ||
                'Unnamed Ship'
              )}

            </h3>


            <div
              class="report-meta"
              style="
                line-height:1.7;
              "
            >

              <b>Visit:</b>

              ${escapeHtml(
                report.date_on ||
                ''
              )}

              ${
                report.date_off
                  ? ` → ${escapeHtml(
                      report.date_off
                    )}`
                  : ''
              }

              <br>


              <b>Reviewer:</b>

              ${escapeHtml(
                report.reviewer ||
                ''
              )}

            </div>


            <div
              class="report-actions"
            >

              <button
                type="button"
                class="btn-primary"
                data-open-report-id="${escapeHtml(
                  report.id
                )}"
              >

                OPEN REPORT

              </button>

            </div>

          </div>

        `
      )
      .join('');


  container
    .querySelectorAll(
      '[data-open-report-id]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(){

            const report =
              reports.find(
                item =>
                  String(
                    item.id
                  ) ===
                  String(
                    button.dataset.openReportId
                  )
              );


            if(
              report
            ){

              await openSavedReport(
                report
              );

            }

          }
        );

      }
    );

}


/* ============================================================
   OPEN SAVED REPORT
============================================================ */

async function openSavedReport(
  report
){

  try{

    loadReport(
      report
    );


    currentSubmittedReport =
      null;


    checklistReturnScreen =
      'open';


    const checklist =
      await getChecklistModule();


    if(
      !checklist
    ){

      return;

    }


    if(
      typeof checklist.updateChecklistHeader ===
      'function'
    ){

      checklist.updateChecklistHeader();

    }


    checklist.renderChecklist();


    showScreen(
      'checklist'
    );

  }catch(error){

    console.error(
      'openSavedReport:',
      error
    );


    showError(
      'Could not open this report.',
      error
    );

  }

}


/* ============================================================
   SHIP RESPONSE SCREEN
============================================================ */

async function loadShipResponsesScreen(){

  const container =
    document.getElementById(
      'responseList'
    );


  if(
    !container
  ){

    return;

  }


  /*
    Render loading only inside the list.
    Header and Back button remain fully active.
  */

  container.innerHTML = `

    <div
      class="empty"
    >

      Loading reports waiting for ship response...

    </div>

  `;


  try{

    const result =
      await withTimeout(
        getShipReviewReports(),
        15000,
        'Loading Ship Response reports timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load Ship Response reports.'
        )
      );

    }


    const reports =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    renderShipResponseReports(
      container,
      reports
    );

  }catch(error){

    console.error(
      'loadShipResponsesScreen:',
      error
    );


    container.innerHTML = `

      <div
        class="empty"
      >

        Could not load Ship Response reports.

        <br><br>

        ${escapeHtml(
          error?.message ||
          'Unknown error'
        )}


        <br><br>


        <button
          type="button"
          class="btn-secondary"
          id="retryShipResponsesBtn"
        >

          TRY AGAIN

        </button>

      </div>

    `;


    const retry =
      document.getElementById(
        'retryShipResponsesBtn'
      );


    if(
      retry
    ){

      retry.addEventListener(
        'click',
        loadShipResponsesScreen
      );

    }

  }

}


/* ============================================================
   RENDER SHIP RESPONSE REPORTS
============================================================ */

function renderShipResponseReports(
  container,
  reports
){

  /*
    Only reports containing a follow-up point.
  */

  const waiting =
    reports.filter(
      report =>
        getReportPoints(
          report,
          true
        )
        .some(
          point =>
            point.followUpNeeded
        )
    );


  if(
    waiting.length ===
    0
  ){

    container.innerHTML = `

      <div class="empty">

        No reports are currently waiting
        for ship response.

      </div>

    `;


    return;

  }


  container.innerHTML =
    waiting
      .map(
        renderShipResponseReport
      )
      .join('');


  bindShipResponseButtons();

}


/* ============================================================
   SHIP RESPONSE REPORT
============================================================ */

function renderShipResponseReport(
  report
){

  const points =
    getReportPoints(
      report,
      true
    )
    .filter(
      point =>
        point.followUpNeeded
    );


  return `

    <div
      class="report-card blue"
    >

      <h3>

        ${escapeHtml(
          report.ship ||
          'Unnamed Ship'
        )}

      </h3>


      <div
        class="report-meta"
        style="
          line-height:1.7;
        "
      >

        <b>Visit:</b>

        ${escapeHtml(
          report.date_on ||
          ''
        )}

        ${
          report.date_off
            ? ` → ${escapeHtml(
                report.date_off
              )}`
            : ''
        }

        <br>


        <b>Reviewer:</b>

        ${escapeHtml(
          report.reviewer ||
          ''
        )}

      </div>


      <div
        class="response-status"
      >

        SHIP RESPONSE REQUIRED

      </div>


      ${
        points
          .map(
            point =>
              renderShipResponsePoint(
                report.id,
                point
              )
          )
          .join('')
      }


      <button
        type="button"
        class="btn-primary submit-ship-response"
        data-response-report-id="${escapeHtml(
          report.id
        )}"
      >

        Submit Report

      </button>


      ${
        isAdmin()
          ? `

            <button
              type="button"
              class="admin-delete"
              data-response-delete-id="${escapeHtml(
                report.id
              )}"
              style="
                width:100%;
                min-height:38px;
                margin-top:8px;
                padding:8px 10px;
                border:1px solid #CC0000;
                border-radius:7px;
                background:#FFFFFF;
                color:#CC0000;
                font-family:inherit;
                font-size:9px;
                font-weight:800;
                cursor:pointer;
              "
            >

              DELETE REPORT

            </button>

          `
          : ''
      }

    </div>

  `;

}


/* ============================================================
   SHIP RESPONSE POINT
============================================================ */

function renderShipResponsePoint(
  reportId,
  point
){

  return `

    <div
      class="response-point"
      style="
        margin-top:14px;
        padding-top:14px;
        border-top:1px solid var(--vv-line);
      "
    >

      <div
        class="response-section"
      >

        ${escapeHtml(
          point.section
        )}

      </div>


      <div
        style="
          margin-top:4px;
          color:var(--vv-body);
          font-size:13px;
          line-height:1.45;
          font-weight:700;
        "
      >

        ${escapeHtml(
          point.text
        )}

      </div>


      <div
        class="status blue"
        style="
          margin-top:7px;
        "
      >

        FOLLOW-UP NEEDED FROM SHIP

      </div>


      <!-- ORIGINAL REVIEWER COMMENT -->

      ${
        point.comments.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
              >

                REVIEWER COMMENTS

              </div>


              ${
                point.comments
                  .map(
                    comment => `

                      <div
                        class="comment"
                      >

                        <strong>

                          ${escapeHtml(
                            comment.name ||
                            'Reviewer'
                          )}:

                        </strong>


                        <div
                          style="
                            margin-top:3px;
                          "
                        >

                          ${escapeHtml(
                            comment.text ||
                            ''
                          )}

                        </div>

                      </div>

                    `
                  )
                  .join('')
              }

            </div>

          `
          : `

            <div
              style="
                margin-top:8px;
                color:var(--vv-gray);
                font-size:9px;
              "
            >

              No reviewer comment was entered.

            </div>

          `
      }


      <!-- ORIGINAL REVIEWER PHOTO -->

      ${
        point.photos.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
              >

                REVIEWER PHOTOS

              </div>


              <div
                class="response-photos"
              >

                ${
                  point.photos
                    .map(
                      photo => `

                        <div
                          class="response-photo"
                        >

                          <img
                            src="${escapeHtml(
                              photo
                            )}"
                            alt="Reviewer photo"
                          >

                        </div>

                      `
                    )
                    .join('')
                }

              </div>

            </div>

          `
          : ''
      }


      <!-- EXISTING SHIP RESPONSES -->

      ${
        point.shipComments.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
                style="
                  color:var(--status-green);
                "
              >

                PREVIOUS SHIP RESPONSE

              </div>


              ${
                point.shipComments
                  .map(
                    comment => `

                      <div
                        class="ship-response-display"
                      >

                        <strong>

                          ${escapeHtml(
                            comment.name ||
                            'Ship'
                          )}:

                        </strong>


                        <div
                          style="
                            margin-top:3px;
                          "
                        >

                          ${escapeHtml(
                            comment.text ||
                            ''
                          )}

                        </div>

                      </div>

                    `
                  )
                  .join('')
              }

            </div>

          `
          : ''
      }


      <!-- SHIP INPUT -->

      <div
        class="field"
        style="
          margin-top:11px;
          margin-bottom:0;
        "
      >

        <label>

          SHIP COMMENT

        </label>


        <textarea
          class="ship-response-input"
          data-response-report="${escapeHtml(
            reportId
          )}"
          data-response-key="${escapeHtml(
            point.key
          )}"
          placeholder="Enter ship response"
        ></textarea>

      </div>


    </div>

  `;

}


/* ============================================================
   SHIP RESPONSE EVENTS
============================================================ */

function bindShipResponseButtons(){

  document
    .querySelectorAll(
      '.submit-ship-response'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(){

            await submitShipResponseForReport(
              button.dataset.responseReportId
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '[data-response-delete-id]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(
            event
          ){

            event.stopPropagation();


            await deleteShipResponseReport(
              button.dataset.responseDeleteId
            );

          }
        );

      }
    );

}


/* ============================================================
   DELETE SHIP RESPONSE REPORT
============================================================ */

async function deleteShipResponseReport(
  reportId
){

  if(
    !isAdmin()
  ){

    alert(
      'Administrator access required.'
    );


    return;

  }


  if(
    !reportId
  ){

    alert(
      'Report ID is missing.'
    );


    return;

  }


  const confirmed =
    window.confirm(
      'Delete this report permanently?'
    );


  if(
    !confirmed
  ){

    return;

  }


  try{

    const module =
      await import(
        './supabase.js'
      );


    if(
      typeof module.deleteReport !==
      'function'
    ){

      throw new Error(
        'deleteReport is not available in supabase.js.'
      );

    }


    const result =
      await withTimeout(
        module.deleteReport(
          reportId
        ),
        15000,
        'Delete operation timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not delete the report.'
        )
      );

    }


    showToast(
      'REPORT DELETED'
    );


    await loadShipResponsesScreen();

  }catch(error){

    console.error(
      'deleteShipResponseReport:',
      error
    );


    showError(
      'Could not delete the report.',
      error
    );

  }

}


/* ============================================================
   SUBMIT SHIP RESPONSE
============================================================ */

async function submitShipResponseForReport(
  reportId
){

  try{

    const current =
      await withTimeout(
        getReport(
          reportId
        ),
        15000,
        'Loading report timed out.'
      );


    if(
      !current ||
      !current.success ||
      !current.data
    ){

      throw (
        current?.error ||
        new Error(
          'Could not load report.'
        )
      );

    }


    const newState =
      JSON.parse(
        JSON.stringify(
          current.data
            ?.report_data
            ?.state ||
          {}
        )
      );


    const inputs =
      document.querySelectorAll(
        `[data-response-report="${cssEscape(
          reportId
        )}"]`
      );


    let added =
      0;


    inputs.forEach(
      input => {

        const text =
          input.value.trim();


        if(
          !text
        ){

          return;

        }


        const key =
          input.dataset.responseKey;


        if(
          !newState[key]
        ){

          return;

        }


        if(
          !Array.isArray(
            newState[key].shipComments
          )
        ){

          newState[key].shipComments =
            [];

        }


        newState[key].shipComments.push({

          name:
            'Ship',

          text,

          timestamp:
            new Date().toISOString()

        });


        added++;

      }
    );


    if(
      added ===
      0
    ){

      alert(
        'Please enter at least one ship response.'
      );


      return;

    }


    const incomplete =
      Object.values(
        newState
      )
      .filter(
        item =>
          item &&
          item.checked &&
          item.followUpNeeded &&
          !(
            Array.isArray(
              item.shipComments
            ) &&
            item.shipComments.length >
            0
          )
      );


    if(
      incomplete.length >
      0
    ){

      alert(
        `${incomplete.length} follow-up point(s) still need a ship response.`
      );


      return;

    }


    if(
      !window.confirm(
        'Submit Ship Response?\n\n' +
        'The report will move to Submitted Reports.'
      )
    ){

      return;

    }


    const result =
      await withTimeout(
        submitShipResponse({

          reportId,

          state:
            newState

        }),
        15000,
        'Submitting Ship Response timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not submit Ship Response.'
        )
      );

    }


    showToast(
      'SHIP RESPONSE SUBMITTED'
    );


    await loadShipResponsesScreen();

  }catch(error){

    console.error(
      'submitShipResponseForReport:',
      error
    );


    showError(
      'Could not submit Ship Response.',
      error
    );

  }

}


/* ============================================================
   SUBMITTED REPORTS
============================================================ */

async function loadSubmittedReportsScreen(){

  const container =
    document.getElementById(
      'reportList'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML = `

    <div class="empty">

      Loading submitted reports...

    </div>

  `;


  try{

    const result =
      await withTimeout(
        getSubmittedReports(),
        15000,
        'Loading submitted reports timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load submitted reports.'
        )
      );

    }


    const reports =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    renderSubmittedReports(
      container,
      reports
    );

  }catch(error){

    console.error(
      'loadSubmittedReportsScreen:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load Submitted Reports.

        <br><br>

        ${escapeHtml(
          error?.message ||
          'Unknown error'
        )}

      </div>

    `;

  }

}


/* ============================================================
   RENDER SUBMITTED REPORTS
============================================================ */

function renderSubmittedReports(
  container,
  reports
){

  if(
    reports.length ===
    0
  ){

    container.innerHTML = `

      <div class="empty">

        No submitted reports.

      </div>

    `;


    return;

  }


  /*
    Three cards across on desktop comes from
    #reportList CSS.
  */

  container.innerHTML =
    reports
      .map(
        report => `

          <div
            class="submitted-card"
          >

            <h2>

              ${escapeHtml(
                report.ship ||
                'Unnamed Ship'
              )}

            </h2>


            <p>

              <b>Visit:</b>

              ${escapeHtml(
                report.date_on ||
                ''
              )}

              ${
                report.date_off
                  ? ` → ${escapeHtml(
                      report.date_off
                    )}`
                  : ''
              }

            </p>


            <p>

              <b>Reviewer:</b>

              ${escapeHtml(
                report.reviewer ||
                ''
              )}

            </p>


            <p>

              <b>Submitted:</b>

              ${formatSubmittedDate(
                report.submitted_at ||
                report.updated_at
              )}

            </p>


            <div
              class="submitted-status"
              style="
                margin-top:5px;
              "
            >

              SUBMITTED

            </div>


            <button
              type="button"
              class="btn-primary"
              data-submitted-review-id="${escapeHtml(
                report.id
              )}"
              style="
                margin-top:12px;
              "
            >

              REVIEW REPORT

            </button>

          </div>

        `
      )
      .join('');


  container
    .querySelectorAll(
      '[data-submitted-review-id]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(){

            const report =
              reports.find(
                item =>
                  String(
                    item.id
                  ) ===
                  String(
                    button.dataset.submittedReviewId
                  )
              );


            if(
              report
            ){

              await openSubmittedReport(
                report
              );

            }

          }
        );

      }
    );

}


/* ============================================================
   OPEN SUBMITTED REPORT
============================================================ */

async function openSubmittedReport(
  report
){

  try{

    currentSubmittedReport =
      report;


    summaryReturnScreen =
      'submitted';


    loadReport(
      report
    );


    const container =
      document.getElementById(
        'report-overall-content'
      );


    if(
      container
    ){

      renderCurrentReportSummary(
        report
      );

    }


    setSummaryMode(
      true
    );


    showScreen(
      'summary'
    );

  }catch(error){

    console.error(
      'openSubmittedReport:',
      error
    );


    showError(
      'Could not open the submitted report.',
      error
    );

  }

}


/* ============================================================
   FOLLOW-UP VIEW
============================================================ */

async function openSubmittedFollowUps(
  report
){

  try{

    currentSubmittedReport =
      report;


    loadReport(
      report
    );


    const container =
      document.getElementById(
        'report-followups-content'
      );


    if(
      !container
    ){

      return;

    }


    const points =
      getReportPoints(
        report,
        true
      )
      .filter(
        point =>
          point.followUpNeeded
      );


    if(
      points.length ===
      0
    ){

      container.innerHTML = `

        <div class="empty">

          No Follow-Up Needed points.

        </div>

      `;


      showScreen(
        'followups'
      );


      return;

    }


    container.innerHTML =
      points
        .map(
          renderSummaryPoint
        )
        .join('');


    showScreen(
      'followups'
    );

  }catch(error){

    console.error(
      'openSubmittedFollowUps:',
      error
    );


    showError(
      'Could not open follow-up points.',
      error
    );

  }

}


/* ============================================================
   FOLLOW-UP BUTTON
============================================================ */

function bindFollowUpButtons(){

  bindClick(
    'followupPdfBtn',
    async function(){

      if(
        !currentSubmittedReport
      ){

        alert(
          'No report selected.'
        );


        return;

      }


      const pdf =
        await getPDFModule();


      if(
        !pdf
      ){

        return;

      }


      try{

        pdf.generateFollowUpPDF(
          currentSubmittedReport
        );

      }catch(error){

        console.error(
          'followupPdfBtn:',
          error
        );


        showError(
          'Could not save Follow-Up PDF.',
          error
        );

      }

    }
  );

}


/* ============================================================
   PDF
============================================================ */

function bindPDFButtons(){

  bindClick(
    'pdfBtn',
    async function(){

      const pdf =
        await getPDFModule();


      if(
        !pdf
      ){

        return;

      }


      try{

        pdf.generatePDF();

      }catch(error){

        console.error(
          'pdfBtn:',
          error
        );


        showError(
          'Could not save PDF.',
          error
        );

      }

    }
  );

}


/* ============================================================
   HEADER BACK BUTTONS
============================================================ */

function bindHeaderBackButtons(){

  /*
    These are bound during initial application startup.
    They do NOT wait for database calls.
  */

  bindClick(
    'setupHeaderBack',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'checklistHeaderBack',
    async function(){

      if(
        checklistReturnScreen ===
        'open'
      ){

        showScreen(
          'open'
        );


        await loadOpenReportsScreen();


        return;

      }


      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'reviewHeaderBack',
    async function(){

      await returnToChecklist();

    }
  );


  bindClick(
    'summaryHeaderBack',
    async function(){

      if(
        summaryReturnScreen ===
        'submitted'
      ){

        showScreen(
          'submitted'
        );


        await loadSubmittedReportsScreen();


        return;

      }


      showScreen(
        'checklist'
      );

    }
  );


  bindClick(
    'followupsHeaderBack',
    async function(){

      showScreen(
        'submitted'
      );


      await loadSubmittedReportsScreen();

    }
  );


  /*
    THIS IS THE RED BACK BUTTON IN SHIP RESPONSE.
    It is deliberately bound directly during initialization.
  */

  bindClick(
    'responsesHeaderBack',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'openHeaderBack',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'submittedHeaderBack',
    function(){

      showScreen(
        'home'
      );

    }
  );

}


/* ============================================================
   ADMIN
============================================================ */

function bindAdminButton(){

  const button =
    document.getElementById(
      'adminButton'
    );


  if(
    !button
  ){

    return;

  }


  button.addEventListener(
    'click',
    function(){

      if(
        adminMode
      ){

        if(
          window.confirm(
            'Disable Admin Mode?'
          )
        ){

          adminMode =
            false;


          sessionStorage.removeItem(
            'ship_visit_admin'
          );


          updateAdminButton();


          /*
            Re-render Ship Response screen
            so DELETE buttons disappear.
          */

          if(
            document
              .getElementById(
                'responses'
              )
              ?.classList
              .contains(
                'hidden'
              ) === false
          ){

            loadShipResponsesScreen();

          }

        }


        return;

      }


      const email =
        window.prompt(
          'Enter administrator email:'
        );


      if(
        !email
      ){

        return;

      }


      if(
        !ADMIN_EMAILS.includes(
          email
            .trim()
            .toLowerCase()
        )
      ){

        alert(
          'Administrator access denied.'
        );


        return;

      }


      adminMode =
        true;


      sessionStorage.setItem(
        'ship_visit_admin',
        'true'
      );


      updateAdminButton();


      showToast(
        'Admin mode enabled.'
      );


      /*
        Refresh Ship Response if it is
        currently visible.
      */

      if(
        document
          .getElementById(
            'responses'
          )
          ?.classList
          .contains(
            'hidden'
          ) === false
      ){

        loadShipResponsesScreen();

      }

    }
  );

}


function updateAdminButton(){

  const button =
    document.getElementById(
      'adminButton'
    );


  if(
    !button
  ){

    return;

  }


  if(
    adminMode
  ){

    button.textContent =
      'ADMIN MODE ON';


    button.style.background =
      '#E10A0A';


    button.style.color =
      '#FFFFFF';


    button.style.borderColor =
      '#E10A0A';

  }else{

    button.textContent =
      'ADMIN';


    button.style.background =
      '#FFFFFF';


    button.style.color =
      '#3C1053';


    button.style.borderColor =
      '#3C1053';

  }

}


function restoreAdminMode(){

  adminMode =
    sessionStorage.getItem(
      'ship_visit_admin'
    ) ===
    'true';

}


/* ============================================================
   UTILITIES
============================================================ */

function formatSubmittedDate(
  value
){

  if(
    !value
  ){

    return '';

  }


  try{

    return new Date(
      value
    ).toLocaleString();

  }catch(
    _error
  ){

    return String(
      value
    );

  }

}


function cssEscape(
  value
){

  const text =
    String(
      value ?? ''
    );


  if(
    window.CSS &&
    typeof window.CSS.escape ===
    'function'
  ){

    return window.CSS.escape(
      text
    );

  }


  return text.replace(
    /(["\\])/g,
    '\\$1'
  );

}


function withTimeout(
  promise,
  milliseconds,
  message
){

  let timer = null;


  const timeout =
    new Promise(
      (
        _resolve,
        reject
      ) => {

        timer =
          setTimeout(
            function(){

              reject(
                new Error(
                  message
                )
              );

            },
            milliseconds
          );

      }
    );


  return Promise.race(
    [
      promise,
      timeout

    ]
  )
  .finally(
    function(){

      if(
        timer
      ){

        clearTimeout(
          timer
        );

      }

    }
  );

}


function escapeHtml(
  value
){

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    function(character){

      const map = {

        '&':'&amp;',

        '<':'&lt;',

        '>':'&gt;',

        '"':'&quot;',

        "'":'&#39;'

      };


      return map[
        character
      ];

    }
  );

}


function showError(
  message,
  error = null
){

  console.error(
    message,
    error
  );


  alert(
    message +
    (
      error?.message
        ? `\n\n${error.message}`
        : ''
    )
  );

}


function showToast(
  message
){

  if(
    typeof window.showToast ===
    'function'
  ){

    window.showToast(
      message
    );


    return;

  }


  console.log(
    message
  );

}


/* ============================================================
   GLOBAL ERROR LOGGING
============================================================ */

window.addEventListener(
  'error',
  function(
    event
  ){

    console.error(
      'Ship Visit Report error:',
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  'unhandledrejection',
  function(
    event
  ){

    console.error(
      'Ship Visit Report promise error:',
      event.reason
    );

  }
);


/* ============================================================
   EXPORTS
============================================================ */

export {

  getChecklistModule,

  getReviewModule,

  getPDFModule,

  saveCurrentReport,

  loadOpenReportsScreen,

  loadSubmittedReportsScreen,

  loadShipResponsesScreen,

  openSavedReport,

  openSubmittedReport,

  openSubmittedFollowUps

};
