/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  main.js
  ============================================================

  MASTER APPLICATION CONTROLLER

  FLOW

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

  - Secondary modules are loaded lazily.
  - No direct call to undefined checklist functions.
  - Reviewer comments are normalized in every report view.
  - Admin can delete a Ship Response report.
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
   GLOBAL ADMIN CHECK
============================================================ */

window.shipVisitIsAdmin =
function(){

  return Boolean(
    adminMode
  );

};


/* ============================================================
   START APPLICATION
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


  showScreen(
    'home'
  );


  console.log(
    'Ship Visit Report ready.'
  );

}


/* ============================================================
   MODULE: CHECKLIST
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


/* ============================================================
   MODULE: REVIEW
============================================================ */

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


/* ============================================================
   MODULE: REPORTS
============================================================ */

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


    return reportsModule;

  }catch(error){

    console.error(
      'reports.js:',
      error
    );


    showError(
      'Reports module could not be loaded.',
      error
    );


    return null;

  }

}


/* ============================================================
   MODULE: PDF
============================================================ */

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
   SAFE CLICK BIND
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
   HTML ESCAPE
============================================================ */

function escapeHtml(
  value
){

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    character => {

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


/* ============================================================
   ERROR
============================================================ */

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
   ADMIN
============================================================ */

function restoreAdminMode(){

  adminMode =
    sessionStorage.getItem(
      'ship_visit_admin'
    ) === 'true';

}


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
   HOME
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
   CREATE REPORT
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
   START NEW REPORT
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
      Create local state first.
    */

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
      Create database report BEFORE opening
      the checklist screen.
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


    setReportId(
      result.data.id
    );


    /*
      Now load the checklist.
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
      This function belongs to checklist.js.
      Never call updateChecklistHeader()
      directly from main.js.
    */

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


      await buildActiveSummary();


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


  /*
    Reconnect callback every time.

    This guarantees that after Send to Ship
    the report is shown in Ship Response
    and is no longer treated as an open report.
  */

  if(
    typeof review.setReviewCallbacks ===
    'function'
  ){

    review.setReviewCallbacks({

      sentToShip:
        async function(){

          currentSubmittedReport =
            null;


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
    await review.prepareShipReview();


  if(
    !prepared
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

      const checklist =
        await getChecklistModule();


      if(
        checklist
      ){

        if(
          typeof checklist.updateChecklistHeader ===
          'function'
        ){

          checklist.updateChecklistHeader();

        }


        checklist.renderChecklist();

      }


      showScreen(
        'checklist'
      );

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
   SUMMARY BUTTONS
============================================================ */

function bindSummaryButtons(){

  /*
    Back from active report summary.
  */

  bindClick(
    'summaryBackToReportBtn',
    async function(){

      const checklist =
        await getChecklistModule();


      if(
        checklist
      ){

        if(
          typeof checklist.updateChecklistHeader ===
          'function'
        ){

          checklist.updateChecklistHeader();

        }


        checklist.renderChecklist();

      }


      showScreen(
        'checklist'
      );

    }
  );


  /*
    Active report -> Ship Review.
  */

  bindClick(
    'summarySubmitBtn',
    async function(){

      await openShipReview();

    }
  );


  /*
    Submitted report -> Submitted Reports.
  */

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
    Submitted Report -> Save PDF.
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
   FOLLOW-UP BUTTONS
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

      const checklist =
        await getChecklistModule();


      if(
        checklist
      ){

        if(
          typeof checklist.updateChecklistHeader ===
          'function'
        ){

          checklist.updateChecklistHeader();

        }


        checklist.renderChecklist();

      }


      showScreen(
        'checklist'
      );

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
   REPORT CALLBACKS
============================================================ */

function configureReportsCallbacks(
  module
){

  if(
    !module ||
    typeof module.setReportCallbacks !==
    'function'
  ){

    return;

  }


  module.setReportCallbacks({

    /*
      Open report from Open Reports.
    */

    openReport:
      async function(
        report
      ){

        await openSavedReport(
          report
        );

      },


    /*
      Review submitted report.
    */

    viewSummary:
      async function(
        report
      ){

        await openSubmittedReport(
          report
        );

      },


    /*
      Follow-up view.
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
      await getOpenReports();


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


    const module =
      await getReportsModule();


    if(
      module
    ){

      configureReportsCallbacks(
        module
      );


      if(
        typeof module.renderOpenReports ===
        'function'
      ){

        await module.renderOpenReports();

        return;

      }

    }


    renderBasicReportList(
      container,
      result.data || [],
      'open'
    );

  }catch(error){

    console.error(
      'Open Reports:',
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

    const result =
      await getSubmittedReports();


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


    const module =
      await getReportsModule();


    if(
      module
    ){

      configureReportsCallbacks(
        module
      );


      if(
        typeof module.renderSubmittedReports ===
        'function'
      ){

        await module.renderSubmittedReports();

        return;

      }

    }


    renderBasicReportList(
      container,
      result.data || [],
      'submitted'
    );

  }catch(error){

    console.error(
      'Submitted Reports:',
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
   BASIC REPORT LIST FALLBACK
============================================================ */

function renderBasicReportList(
  container,
  reports,
  type
){

  if(
    !Array.isArray(
      reports
    ) ||
    reports.length === 0
  ){

    container.innerHTML = `

      <div class="empty">

        ${
          type === 'submitted'
            ? 'No submitted reports yet.'
            : 'No open reports yet.'
        }

      </div>

    `;


    return;

  }


  container.innerHTML =
    reports
      .map(
        report => `

          <div
            class="report-card ${
              type === 'submitted'
                ? 'green'
                : 'red'
            }"
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


            <button
              type="button"
              class="btn-primary"
              data-basic-report-id="${escapeHtml(
                report.id
              )}"
            >

              ${
                type === 'submitted'
                  ? 'REVIEW REPORT'
                  : 'OPEN REPORT'
              }

            </button>

          </div>

        `
      )
      .join('');


  container
    .querySelectorAll(
      '[data-basic-report-id]'
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
                    button.dataset.basicReportId
                  )
              );


            if(
              !report
            ){

              return;

            }


            if(
              type === 'submitted'
            ){

              await openSubmittedReport(
                report
              );

            }else{

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


    showToast(
      'OPEN REPORT LOADED'
    );

  }catch(error){

    console.error(
      'Open report:',
      error
    );


    showError(
      'Could not open this report.',
      error
    );

  }

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


    /*
      Use our own renderer so reviewer comments
      are always shown.
    */

    renderSubmittedReportSummary(
      report
    );


    setSummaryMode(
      true
    );


    showScreen(
      'summary'
    );

  }catch(error){

    console.error(
      'Open submitted report:',
      error
    );


    showError(
      'Could not open submitted report.',
      error
    );

  }

}


/* ============================================================
   NORMALIZE REVIEWER COMMENTS
============================================================ */

function normalizeReviewerComments(
  item
){

  if(
    !item
  ){

    return [];

  }


  const value =
    item.comments ??
    item.reviewerComments ??
    item.reviewer_comments ??
    item.reviewComments ??
    null;


  /*
    ARRAY
  */

  if(
    Array.isArray(
      value
    )
  ){

    return value
      .map(
        comment => {

          if(
            typeof comment ===
            'string'
          ){

            const text =
              comment.trim();


            if(
              !text
            ){

              return null;

            }


            return {

              name:
                item.reviewer ||
                'Reviewer',

              text,

              timestamp:null

            };

          }


          if(
            !comment ||
            typeof comment !==
              'object'
          ){

            return null;

          }


          const text =
            String(
              comment.text ??
              comment.comment ??
              comment.message ??
              comment.value ??
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
                comment.name ??
                comment.reviewer ??
                comment.author ??
                item.reviewer ??
                'Reviewer'
              ).trim() ||
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


  /*
    SINGLE OBJECT
  */

  if(
    value &&
    typeof value ===
    'object'
  ){

    const text =
      String(
        value.text ??
        value.comment ??
        value.message ??
        value.value ??
        ''
      ).trim();


    if(
      text
    ){

      return [

        {

          name:
            String(
              value.name ??
              value.reviewer ??
              value.author ??
              item.reviewer ??
              'Reviewer'
            ).trim() ||
            'Reviewer',

          text,

          timestamp:
            value.timestamp ??
            value.createdAt ??
            null

        }

      ];

    }

  }


  /*
    LEGACY FIELDS
  */

  const legacyFields = [

    'reviewerComment',

    'reviewer_comment',

    'reviewComment',

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
            item.reviewer ||
            'Reviewer',

          text:
            item[field].trim(),

          timestamp:null

        }

      ];

    }

  }


  return [];

}


/* ============================================================
   NORMALIZE PHOTOS
============================================================ */

function normalizePhotos(
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
   NORMALIZE SHIP COMMENTS
============================================================ */

function normalizeShipComments(
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
        comment => {

          if(
            typeof comment ===
            'string'
          ){

            const text =
              comment.trim();


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
            typeof comment !==
              'object'
          ){

            return null;

          }


          const text =
            String(
              comment.text ??
              comment.comment ??
              comment.message ??
              ''
            ).trim();


          if(
            !text
          ){

            return null;

          }


          return {

            name:
              comment.name ??
              comment.ship ??
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


  if(
    typeof value ===
    'string' &&
    value.trim()
  ){

    return [

      {

        name:'Ship',

        text:
          value.trim(),

        timestamp:null

      }

    ];

  }


  return [];

}


/* ============================================================
   GET REPORT POINTS
============================================================ */

function getReportPoints(
  report,
  includeOnlyChecked = true
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
            includeOnlyChecked &&
            !item?.checked
          ){

            return;

          }


          if(
            !item
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
              normalizeReviewerComments(
                item
              ),

            photos:
              normalizePhotos(
                item
              ),

            followUpNeeded:
              Boolean(
                item.followUpNeeded
              ),

            shipComments:
              normalizeShipComments(
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
   REPORT SUMMARY
============================================================ */

function renderSubmittedReportSummary(
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


  const meta =
    report
      ?.report_data
      ?.meta ||
    {};


  const points =
    getReportPoints(
      report,
      true
    );


  if(
    points.length === 0
  ){

    container.innerHTML = `

      <div class="empty">

        No checklist points were marked as checked.

      </div>

    `;


    return;

  }


  const groups =
    groupPointsBySection(
      points
    );


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
          margin-bottom:7px;
        "
      >

        REPORT OVERALL

      </div>


      <div
        style="
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
                    renderReportPoint
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


/* ============================================================
   GROUP POINTS
============================================================ */

function groupPointsBySection(
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


/* ============================================================
   REPORT POINT
============================================================ */

function renderReportPoint(
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


      <!-- POINT -->

      <div
        style="
          display:flex;
          gap:8px;
          align-items:flex-start;
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
            background:var(--vv-red);
            color:#FFFFFF;
            border-radius:50%;
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


      <!-- FOLLOW-UP -->

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


      <!-- REVIEWER COMMENTS -->

      ${
        point.comments.length > 0

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

          : ''
      }


      <!-- REVIEWER PHOTOS -->

      ${
        point.photos.length > 0

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


      <!-- SHIP RESPONSE -->

      ${
        point.shipComments.length > 0

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


    </div>

  `;

}


/* ============================================================
   SUBMITTED FOLLOW-UP VIEW
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
      points.length === 0
    ){

      container.innerHTML = `

        <div class="empty">

          No points were marked
          Follow-Up Needed from Ship.

        </div>

      `;


      showScreen(
        'followups'
      );


      return;

    }


    const completed =
      points.filter(
        point =>
          point.shipComments.length >
          0
      ).length;


    container.innerHTML = `

      <div
        style="
          margin-bottom:15px;
          padding:12px;
          background:var(--vv-bg);
          border-top:3px solid var(--vv-red);
          border-radius:7px;
          font-size:11px;
          line-height:1.7;
        "
      >

        <strong>

          Follow-Up Points:

        </strong>

        ${points.length}


        <br>


        <strong>

          Responses Completed:

        </strong>

        ${completed}/${points.length}

      </div>


      ${
        points
          .map(
            point =>
              renderReportPoint(
                point
              )
          )
          .join('')
      }

    `;


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
   SHIP RESPONSE REPORTS
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
      reports.length ===
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


    renderShipResponseReports(
      container,
      reports
    );

  }catch(error){

    console.error(
      'Ship Response:',
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
   SHIP RESPONSE REPORT RENDER
============================================================ */

function renderShipResponseReports(
  container,
  reports
){

  const cards =
    reports
      .map(
        report =>
          renderShipResponseReport(
            report
          )
      )
      .join('');


  container.innerHTML =
    cards;


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


  if(
    points.length ===
    0
  ){

    return '';

  }


  return `

    <div
      class="report-card blue"
      data-response-report="${escapeHtml(
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


      ${
        point.comments.length > 0

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


      ${
        point.photos.length > 0

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


      ${
        point.shipComments.length > 0

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
   IS ADMIN
============================================================ */

function isAdmin(){

  return Boolean(
    adminMode
  );

}


/* ============================================================
   SHIP RESPONSE BUTTONS
============================================================ */

function bindShipResponseButtons(){

  /*
    Submit
  */

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


  /*
    Admin delete
  */

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


  const first =
    window.confirm(
      'Delete this report permanently?'
    );


  if(
    !first
  ){

    return;

  }


  const second =
    window.confirm(
      'This cannot be undone.\n\nContinue?'
    );


  if(
    !second
  ){

    return;

  }


  try{

    const supabase =
      await import(
        './supabase.js'
      );


    if(
      typeof supabase.deleteReport !==
      'function'
    ){

      throw new Error(
        'Delete function is not available in supabase.js.'
      );

    }


    const result =
      await supabase.deleteReport(
        reportId
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not delete report.'
        )
      );

    }


    showToast(
      'REPORT DELETED'
    );


    await loadShipResponsesScreen();

  }catch(error){

    console.error(
      'Delete Ship Response report:',
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


    const state =
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
        `[data-response-report="${CSS.escape(
          String(
            reportId
          )
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
          !state[key]
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
        state
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

        state

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


    await loadShipResponsesScreen();

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
   GLOBAL REPORT ACTION HELPERS
============================================================ */

function bindGlobalErrorHandling(){

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

}


/* ============================================================
   INITIAL GLOBAL ERROR HANDLING
============================================================ */

bindGlobalErrorHandling();


/* ============================================================
   EXPORTS
============================================================ */

export {

  getChecklistModule,

  getReviewModule,

  getReportsModule,

  getPDFModule,

  saveCurrentReport,

  loadOpenReportsScreen,

  loadSubmittedReportsScreen,

  loadShipResponsesScreen

};
