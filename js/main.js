/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  main.js
  ============================================================

  STABLE APPLICATION CONTROLLER

  FLOW

    HOME
      |
      +-- CREATE REPORT
      |      |
      |      +-- DEPARTMENT HOME
      |             |
      |             +-- DEPARTMENT CHECKLIST
      |             |
      |             +-- REPORT SUMMARY
      |             |
      |             +-- SHIP REVIEW
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


  IMPORTANT

  - No undefined updateChecklistHeader() calls.
  - Checklist header is called through checklist module.
  - Secondary modules are loaded only when needed.
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
   LAZY MODULES
============================================================ */

let checklistModule = null;

let reviewModule = null;

let reportsModule = null;

let pdfModule = null;


/* ============================================================
   NAVIGATION STATE
============================================================ */

let checklistReturnScreen =
  'setup';


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


/* ============================================================
   SCREEN IDS
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
   ADMIN GLOBAL
============================================================ */

window.shipVisitIsAdmin =
function(){

  return adminMode;

};


/* ============================================================
   START APP
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

  bindAdminButton();

  setupDefaultDate();

  bindHomeButtons();

  bindCreateReport();

  bindChecklistButtons();

  bindReviewButtons();

  bindSummaryButtons();

  bindFollowUpButtons();

  bindPDFButtons();

  bindHeaderBackButtons();

  /*
    IMPORTANT:
    We do NOT load review.js, reports.js,
    checklist.js or pdf.js here.

    They are loaded only when used.
  */


  updateAdminButton();


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
      'Checklist module error:',
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


    configureReviewCallbacks(
      reviewModule
    );


    return reviewModule;

  }catch(error){

    console.error(
      'Review module error:',
      error
    );


    showError(
      'Ship Review module could not be loaded.',
      error
    );


    return null;

  }

}


async function getReportsModule(){

  if(
    reportsModule
  ){

    return reportsModule;

  }


  try{

    reportsModule =
      await import(
        './reports.js'
      );


    configureReportsCallbacks(
      reportsModule
    );


    return reportsModule;

  }catch(error){

    console.error(
      'Reports module error:',
      error
    );


    showError(
      'Reports module could not be loaded.',
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
      'PDF module error:',
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

  if(
    !SCREENS.includes(
      screen
    )
  ){

    screen =
      'home';

  }


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
        id === screen
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
   SAFE CLICK BINDING
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
   HOME BUTTONS
============================================================ */

function bindHomeButtons(){

  bindClick(
    'createReport',
    function(){

      clearSetupFields();

      setupDefaultDate();

      checklistReturnScreen =
        'setup';

      summaryReturnScreen =
        'checklist';

      currentSubmittedReport =
        null;

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

      showScreen(
        'responses'
      );


      await loadShipResponseScreen();

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
   CREATE REPORT
============================================================ */

function bindCreateReport(){

  bindClick(
    'startBtn',
    handleStartReport
  );

}


/* ============================================================
   CLEAR SETUP
============================================================ */

function clearSetupFields(){

  [
    'ship',
    'dateOn',
    'dateOff',
    'reviewer'

  ].forEach(
    id => {

      const input =
        document.getElementById(
          id
        );


      if(
        input
      ){

        input.value =
          '';

      }

    }
  );

}


/* ============================================================
   DEFAULT DATE
============================================================ */

function setupDefaultDate(){

  const input =
    document.getElementById(
      'dateOn'
    );


  if(
    input &&
    !input.value
  ){

    input.value =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

  }

}


/* ============================================================
   CREATE REPORT HANDLER
============================================================ */

async function handleStartReport(){

  const ship =
    document
      .getElementById(
        'ship'
      )
      ?.value
      .trim();


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
      .trim();


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

    /*
      Start the in-memory report first.
    */

    startNewReport({

      ship,

      dateOn,

      dateOff,

      reviewer

    });


    /*
      CRITICAL:
      Create the database record BEFORE showing
      the checklist.

      This prevents a fake report screen from
      appearing when Supabase creation fails.
    */

    const result =
      await saveOpenReport({

        reportId:null,

        meta:
          getMeta(),

        state:
          getState()

      });


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


    /*
      Store the database ID.
    */

    setReportId(
      result.data.id
    );


    /*
      Load checklist module only now.
    */

    const checklist =
      await getChecklistModule();


    if(
      !checklist
    ){

      return;

    }


    /*
      IMPORTANT:
      updateChecklistHeader belongs to checklist.js,
      therefore call it through the module.
    */

    if(
      typeof checklist.updateChecklistHeader ===
      'function'
    ){

      checklist.updateChecklistHeader();

    }


    checklist.renderChecklist();


    checklistReturnScreen =
      'setup';


    summaryReturnScreen =
      'checklist';


    showScreen(
      'checklist'
    );


    showToast(
      'OPEN REPORT CREATED'
    );

  }catch(error){

    console.error(
      'Create report:',
      error
    );


    showError(
      'Could not create the report.',
      error
    );

  }

}


/* ============================================================
   CHECKLIST
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


      await showActiveSummary();

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
      await saveOpenReport({

        reportId,

        meta:
          getMeta(),

        state:
          getState()

      });


    if(
      !result ||
      !result.success
    ){

      console.error(
        'Save report failed:',
        result?.error
      );


      return false;

    }


    return true;

  }catch(error){

    console.error(
      'Save current report:',
      error
    );


    return false;

  }

}


/* ============================================================
   SHOW ACTIVE SUMMARY
============================================================ */

async function showActiveSummary(){

  const reports =
    await getReportsModule();


  if(
    reports &&
    typeof reports.renderReportOverall ===
    'function'
  ){

    /*
      Build a report object from the current state.
      reports.js uses report_data.state.
    */

    const report = {

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

      status:
        'open',

      report_data:{

        meta:
          getMeta(),

        state:
          getState()

      }

    };


    reports.renderReportOverall(
      report
    );

  }


  setSummaryMode(
    false
  );


  showScreen(
    'summary'
  );

}


/* ============================================================
   SHIP REVIEW
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


  const success =
    await review.prepareShipReview();


  if(
    !success
  ){

    return;

  }


  showScreen(
    'review'
  );

}


/* ============================================================
   REVIEW BUTTONS
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


      await review.sendCurrentReportToShip();

    }
  );

}


/* ============================================================
   REVIEW CALLBACK
============================================================ */

function configureReviewCallbacks(
  review
){

  if(
    !review ||
    typeof review.setReviewCallbacks !==
    'function'
  ){

    return;

  }


  review.setReviewCallbacks({

    sentToShip:
      async function(){

        /*
          Report is now in Ship Review.
        */

        const sentReport =
          arguments[0];


        currentSubmittedReport =
          sentReport ||
          null;


        showToast(
          'REPORT SENT TO SHIP'
        );


        /*
          Move user to Ship Response screen.
        */

        showScreen(
          'responses'
        );


        await loadShipResponseScreen();

      }

  });

}


/* ============================================================
   RETURN TO CHECKLIST
============================================================ */

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
   REPORT MODULE CALLBACKS
============================================================ */

function configureReportsCallbacks(
  reports
){

  if(
    !reports ||
    typeof reports.setReportCallbacks !==
    'function'
  ){

    return;

  }


  reports.setReportCallbacks({

    /*
      OPEN REPORT
    */

    openReport:
      async function(
        report
      ){

        await openReportFromCallback(
          report
        );

      },


    /*
      SUBMITTED -> REPORT OVERALL
    */

    viewSummary:
      async function(
        report
      ){

        await openSubmittedSummary(
          report
        );

      },


    /*
      SUBMITTED -> FOLLOW UPS
    */

    viewFollowUps:
      async function(
        report
      ){

        await openSubmittedFollowUps(
          report
        );

      },


    showHome:
      function(){

        showScreen(
          'home'
        );

      }

  });

}


/* ============================================================
   OPEN REPORT FROM CALLBACK
============================================================ */

async function openReportFromCallback(
  report
){

  if(
    !report
  ){

    return;

  }


  try{

    loadReport(
      report
    );


    checklistReturnScreen =
      'open';


    currentSubmittedReport =
      null;


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
      'Open report callback:',
      error
    );


    showError(
      'Could not open this report.',
      error
    );

  }

}


/* ============================================================
   OPEN SUBMITTED SUMMARY
============================================================ */

async function openSubmittedSummary(
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


    const reports =
      await getReportsModule();


    if(
      !reports
    ){

      return;

    }


    if(
      typeof reports.renderReportOverall ===
      'function'
    ){

      reports.renderReportOverall(
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
      'Submitted summary:',
      error
    );


    showError(
      'Could not open the submitted report.',
      error
    );

  }

}


/* ============================================================
   OPEN SUBMITTED FOLLOW UPS
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


    const reports =
      await getReportsModule();


    if(
      !reports
    ){

      return;

    }


    if(
      typeof reports.renderReportFollowUps ===
      'function'
    ){

      reports.renderReportFollowUps(
        report
      );

    }


    showScreen(
      'followups'
    );

  }catch(error){

    console.error(
      'Submitted follow-ups:',
      error
    );


    showError(
      'Could not open follow-up points.',
      error
    );

  }

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

    const reports =
      await getReportsModule();


    if(
      !reports
    ){

      return;

    }


    /*
      Configure callbacks again in case
      this is the first time module loaded.
    */

    configureReportsCallbacks(
      reports
    );


    await reports.renderOpenReports();

  }catch(error){

    console.error(
      'Open reports screen:',
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

    const reports =
      await getReportsModule();


    if(
      !reports
    ){

      return;

    }


    configureReportsCallbacks(
      reports
    );


    await reports.renderSubmittedReports();

  }catch(error){

    console.error(
      'Submitted reports screen:',
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
   SHIP RESPONSE SCREEN
============================================================ */

async function loadShipResponseScreen(){

  const container =
    document.getElementById(
      'responseList'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML = `

    <div class="empty">

      Loading reports waiting for ship response...

    </div>

  `;


  try{

    const result =
      await getShipReviewReports();


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
      result.data ||
      [];


    if(
      reports.length === 0
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
      reports
        .map(
          renderShipResponseReport
        )
        .join('');


    bindShipResponseButtons();

  }catch(error){

    console.error(
      'Ship response screen:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load Ship Response Report.

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
   SHIP RESPONSE REPORT CARD
============================================================ */

function renderShipResponseReport(
  report
){

  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const points =
    [];


  SECTIONS.forEach(
    section => {

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
            item &&
            item.checked &&
            item.followUpNeeded
          ){

            points.push({

              key,

              section:
                section.title,

              text,

              comments:
                Array.isArray(
                  item.comments
                )
                  ? item.comments
                  : [],

              photos:
                Array.isArray(
                  item.photos
                )
                  ? item.photos
                  : [],

              shipComments:
                Array.isArray(
                  item.shipComments
                )
                  ? item.shipComments
                  : []

            });

          }

        }
      );

    }
  );


  return `

    <div
      class="report-card blue"
      data-response-card="${escapeHtml(
        report.id
      )}"
    >

      <h3>

        ${escapeHtml(
          report.ship ||
          'Unnamed Ship'
        )}

      </h3>


      <div
        class="report-meta"
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
          font-size:13px;
          line-height:1.45;
          font-weight:700;
        "
      >

        ${escapeHtml(
          point.text
        )}

      </div>


      ${
        point.comments.length > 0

          ? `

            <div
              class="response-comments"
              style="
                margin-top:9px;
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

                      <div class="comment">

                        <strong>

                          ${escapeHtml(
                            comment.name ||
                            'Reviewer'
                          )}:

                        </strong>


                        ${escapeHtml(
                          comment.text ||
                          ''
                        )}

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


      ${
        point.photos.length > 0

          ? `

            <div
              style="
                margin-top:9px;
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

                        <div class="response-photo">

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
        point.shipComments.length > 0

          ? `

            <div
              style="
                margin-top:9px;
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


                        ${escapeHtml(
                          comment.text ||
                          ''
                        )}

                      </div>

                    `
                  )
                  .join('')
              }

            </div>

          `

          : ''

      }


      <div
        class="field"
        style="
          margin-top:11px;
          margin-bottom:0;
        "
      >

        <label
          for="ship-response-${escapeHtml(
            reportId
          )}-${escapeHtml(
            point.key
          )}"
        >

          SHIP COMMENT

        </label>


        <textarea
          id="ship-response-${escapeHtml(
            reportId
          )}-${escapeHtml(
            point.key
          )}"
          class="ship-response-input"
          data-report-id="${escapeHtml(
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
   BIND SHIP RESPONSE BUTTONS
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

}


/* ============================================================
   SUBMIT SHIP RESPONSE
============================================================ */

async function submitShipResponseForReport(
  reportId
){

  try{

    const current =
      await getReport(
        reportId
      );


    if(
      !current ||
      !current.success ||
      !current.data
    ){

      throw new Error(
        'Could not load report.'
      );

    }


    const sourceState =
      current.data
        ?.report_data
        ?.state ||
      {};


    const newState =
      JSON.parse(
        JSON.stringify(
          sourceState
        )
      );


    const inputs =
      document.querySelectorAll(
        `[data-report-id="${reportId}"]`
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
      added === 0
    ){

      alert(
        'Please enter at least one ship response.'
      );


      return;

    }


    /*
      Verify all follow-ups have responses.
    */

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
            item.shipComments.length > 0
          )
      );


    if(
      incomplete.length > 0
    ){

      alert(
        `${incomplete.length} follow-up point(s) still need a ship response.`
      );


      return;

    }


    const confirmed =
      window.confirm(
        'Submit Ship Response?\n\n' +
        'The report will move to Submitted Reports.'
      );


    if(
      !confirmed
    ){

      return;

    }


    const result =
      await submitShipResponse({

        reportId,

        state:
          newState

      });


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


    await loadShipResponseScreen();

  }catch(error){

    console.error(
      'Submit Ship Response:',
      error
    );


    showError(
      'Could not submit Ship Response.',
      error
    );

  }

}


/* ============================================================
   SUMMARY
============================================================ */

function bindSummaryButtons(){

  bindClick(
    'summaryBackToReportBtn',
    async function(){

      const checklist =
        await getChecklistModule();


      if(
        checklist
      ){

        checklist.renderChecklist();

      }


      showScreen(
        'checklist'
      );

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


  /*
    Save PDF only.
    No Print button.
  */

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
          'Save PDF:',
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
    submitted
  ){

    if(
      active
    ){

      active.classList.add(
        'hidden'
      );

    }


    if(
      submittedActions
    ){

      submittedActions.classList.remove(
        'hidden'
      );

    }

  }else{

    if(
      active
    ){

      active.classList.remove(
        'hidden'
      );

    }


    if(
      submittedActions
    ){

      submittedActions.classList.add(
        'hidden'
      );

    }

  }

}


/* ============================================================
   FOLLOW-UP SCREEN
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
          'Follow-up PDF:',
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

  /*
    Active checklist PDF if #pdfBtn exists.
  */

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
          'PDF:',
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


  bindClick(
    'responsesHeaderBack',
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

function restoreAdminMode(){

  adminMode =
    sessionStorage.getItem(
      'ship_visit_admin'
    ) === 'true';

}


function bindAdminButton(){

  bindClick(
    'adminButton',
    function(){

      if(
        adminMode
      ){

        const disable =
          window.confirm(
            'Disable Admin Mode?'
          );


        if(
          disable
        ){

          adminMode =
            false;


          sessionStorage.removeItem(
            'ship_visit_admin'
          );


          updateAdminButton();

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


      const normalized =
        email
          .trim()
          .toLowerCase();


      if(
        !ADMIN_EMAILS.includes(
          normalized
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


/* ============================================================
   RESET
============================================================ */

function resetToHome(){

  resetReport();

  currentSubmittedReport =
    null;

  checklistReturnScreen =
    'setup';

  summaryReturnScreen =
    'checklist';

  showScreen(
    'home'
  );

}


/* ============================================================
   TOAST
============================================================ */

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
   ERROR
============================================================ */

function showError(
  message,
  error=null
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


/* ============================================================
   HTML ESCAPE
============================================================ */

function escapeHtml(
  value
){

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    character => ({

      '&':'&amp;',

      '<':'&lt;',

      '>':'&gt;',

      '"':'&quot;',

      "'":'&#39;'

    }[character])
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
   EXPORT
============================================================ */

export {

  getChecklistModule,

  getReviewModule,

  getReportsModule,

  getPDFModule,

  saveCurrentReport,

  resetToHome

};
