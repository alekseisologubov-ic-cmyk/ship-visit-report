/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  main.js
  ============================================================

  STABLE CONTROLLER

  Important:
  Secondary modules are loaded lazily so one broken module
  cannot freeze the entire application.

  Flow:

    HOME
      |
      +-- CREATE REPORT
      |
      +-- OPEN REPORTS
      |
      +-- REPORT CHECKLIST
      |
      +-- SHIP REVIEW
      |
      +-- SHIP RESPONSE
      |
      +-- SUBMITTED REPORTS
*/


/* ============================================================
   CORE IMPORTS ONLY
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
   LOAD CHECKLIST MODULE
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
      'Could not load checklist.js:',
      error
    );


    showError(
      'Checklist module could not be loaded.'
    );


    return null;

  }

}


/* ============================================================
   LOAD REVIEW MODULE
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
      'Could not load review.js:',
      error
    );


    showError(
      'Ship Review module could not be loaded.'
    );


    return null;

  }

}


/* ============================================================
   LOAD REPORTS MODULE
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
      'Could not load reports.js:',
      error
    );


    showError(
      'Reports module could not be loaded.'
    );


    return null;

  }

}


/* ============================================================
   LOAD PDF MODULE
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
      'Could not load pdf.js:',
      error
    );


    showError(
      'PDF module could not be loaded.'
    );


    return null;

  }

}


/* ============================================================
   ADMIN
============================================================ */

const ADMIN_EMAILS = [

  'alebass80@gmail.com'

];


let adminMode =
  false;


/* ============================================================
   NAVIGATION
============================================================ */

let checklistReturnScreen =
  'setup';


let summaryReturnScreen =
  'checklist';


let currentSubmittedReport =
  null;


/* ============================================================
   SCREEN LIST
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
   START APPLICATION
============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


/* ============================================================
   INITIALIZE
============================================================ */

async function initializeApp(){

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


  bindGlobalReportActions();


  updateAdminButton();


  /*
    HOME IS SHOWN FIRST.

    No secondary module needs to be loaded
    just to display the home screen.
  */

  showScreen(
    'home'
  );


  console.log(
    'Ship Visit Report ready.'
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
   SHOW SCREEN
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
   SAFE BIND
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
   CREATE REPORT
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


    updateChecklistHeader();


    /*
      Load checklist only now.
    */

    const checklist =
      await getChecklistModule();


    if(
      !checklist
    ){

      return;

    }


    /*
      Render checklist.
    */

    checklist.renderChecklist();


    showScreen(
      'checklist'
    );


    /*
      Create record in Supabase.
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
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not create the report.'
        )
      );

    }


    if(
      result.data?.id
    ){

      setReportId(
        result.data.id
      );

    }


    showToast(
      'OPEN REPORT CREATED'
    );

  }catch(error){

    console.error(
      'Create report error:',
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


      const checklist =
        await getChecklistModule();


      if(
        checklist
      ){

        if(
          typeof checklist.setSummaryMode ===
          'function'
        ){

          checklist.setSummaryMode(
            false
          );

        }


        updateChecklistHeader();

      }


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
   REVIEW
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

        checklist.updateChecklistHeader();

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
   REVIEW CALLBACKS
============================================================ */

async function bindGlobalReportActions(){

  /*
    review.js exposes callbacks.
    Load it only when application is ready.
  */

  try{

    const review =
      await getReviewModule();


    if(
      review &&
      typeof review.setReviewCallbacks ===
      'function'
    ){

      review.setReviewCallbacks({

        sentToShip:
          async function(){

            resetReport();

            clearSetupFields();

            currentSubmittedReport =
              null;


            showScreen(
              'responses'
            );


            showToast(
              'REPORT SENT TO SHIP'
            );


            await loadShipResponsesScreen();

          }

      });

    }

  }catch(error){

    console.error(
      'Review callback setup:',
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

        pdf.generatePDF();

      }catch(error){

        console.error(
          'PDF error:',
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
   ACTIVE SUMMARY
============================================================ */

async function buildActiveSummary(){

  const meta =
    getMeta();


  const state =
    getState();


  const container =
    document.getElementById(
      'report-overall-content'
    );


  if(
    !container
  ){

    return;

  }


  let checkedPoints =
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
            item.checked
          ){

            checkedPoints.push({

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

              followUpNeeded:
                Boolean(
                  item.followUpNeeded
                ),

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


  if(
    checkedPoints.length === 0
  ){

    container.innerHTML = `

      <div class="empty">

        No checklist points have been checked yet.

      </div>

    `;


    return;

  }


  /*
    Group by department.
  */

  const groups =
    [];


  checkedPoints.forEach(
    point => {

      let group =
        groups.find(
          item =>
            item.section ===
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


  container.innerHTML = `

    <div
      style="
        margin-bottom:15px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:16px;
          font-weight:800;
        "
      >

        REPORT SUMMARY

      </div>


      <div
        style="
          margin-top:5px;
          color:var(--vv-gray);
          font-size:11px;
        "
      >

        Ship:
        ${escapeHtml(
          meta.ship
        )}

        <br>

        Visit:
        ${escapeHtml(
          meta.dateOn
        )}

        ${
          meta.dateOff
            ? ` → ${escapeHtml(meta.dateOff)}`
            : ''
        }

        <br>

        Reviewer:
        ${escapeHtml(
          meta.reviewer
        )}

      </div>

    </div>


    ${
      groups
        .map(
          group => `

            <div
              style="
                margin-bottom:18px;
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
                    point =>
                      renderSummaryPoint(
                        point
                      )
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
   SUMMARY POINT
============================================================ */

function renderSummaryPoint(
  point
){

  return `

    <div
      style="
        margin-bottom:10px;
        padding:11px;
        border:1px solid var(--vv-line);
        border-left:4px solid var(--vv-squid);
        border-radius:7px;
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
            width:23px;
            height:23px;
            flex:0 0 23px;
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
            font-size:12px;
            line-height:1.45;
            font-weight:600;
          "
        >

          ${escapeHtml(
            point.text
          )}

        </div>

      </div>


      ${
        point.comments.length
          ? `

            <div
              style="
                margin-top:9px;
              "
            >

              <div class="response-label">

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
          : ''
      }


      ${
        point.photos.length
          ? `

            <div
              style="
                margin-top:9px;
              "
            >

              <div class="response-label">

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
        point.followUpNeeded
          ? `

            <div
              style="
                margin-top:9px;
              "
            >

              <span class="status blue">

                FOLLOW-UP NEEDED FROM SHIP

              </span>

            </div>

          `
          : ''
      }


      ${
        point.shipComments.length
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

    </div>

  `;

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
      await getOpenReports();


    if(
      !reports ||
      !reports.success
    ){

      throw (
        reports?.error ||
        new Error(
          'Could not load open reports.'
        )
      );

    }


    /*
      Use reports module if available.
    */

    const module =
      await getReportsModule();


    if(
      module &&
      typeof module.renderOpenReports ===
      'function'
    ){

      await module.renderOpenReports();


      return;

    }


    /*
      Fallback renderer.
    */

    renderBasicReportList(
      container,
      reports.data || [],
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
   SUBMITTED
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
      await getSubmittedReports();


    if(
      !reports ||
      !reports.success
    ){

      throw (
        reports?.error ||
        new Error(
          'Could not load submitted reports.'
        )
      );

    }


    const module =
      await getReportsModule();


    if(
      module &&
      typeof module.renderSubmittedReports ===
      'function'
    ){

      await module.renderSubmittedReports();


      return;

    }


    renderBasicReportList(
      container,
      reports.data || [],
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
   SHIP RESPONSE
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


    /*
      Prefer existing response renderer
      if it can be loaded.
    */

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


    renderShipResponseFallback(
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
   BASIC REPORT LIST
============================================================ */

function renderBasicReportList(
  container,
  reports,
  type
){

  if(
    !reports ||
    reports.length === 0
  ){

    container.innerHTML = `

      <div class="empty">

        ${
          type === 'submitted'
            ? 'No submitted reports.'
            : 'No open reports.'
        }

      </div>

    `;


    return;

  }


  container.innerHTML =
    reports
      .map(
        report => `

          <div class="report-card">

            <h3>

              ${escapeHtml(
                report.ship ||
                'Unnamed Report'
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
              class="report-actions"
            >

              <button
                type="button"
                class="btn-primary"
                data-basic-report-id="${escapeHtml(
                  report.id
                )}"
              >

                ${
                  type === 'submitted'
                    ? 'Review Report'
                    : 'Open Report'
                }

              </button>

            </div>

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
              type === 'open'
            ){

              await openSavedReport(
                report
              );

            }else{

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


    const checklist =
      await getChecklistModule();


    if(
      !checklist
    ){

      return;

    }


    checklist.updateChecklistHeader();


    checklist.renderChecklist();


    checklistReturnScreen =
      'open';


    showScreen(
      'checklist'
    );


    showToast(
      'OPEN REPORT LOADED'
    );

  }catch(error){

    console.error(
      'Open saved report:',
      error
    );


    showError(
      'Could not open this report.',
      error
    );

  }

}


/* ============================================================
   OPEN SUBMITTED
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
      First use the reports module.
    */

    const module =
      await getReportsModule();


    if(
      module &&
      typeof module.renderReportOverall ===
      'function'
    ){

      module.renderReportOverall(
        report
      );

    }else{

      await buildSubmittedSummaryFallback(
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
   SUBMITTED SUMMARY FALLBACK
============================================================ */

async function buildSubmittedSummaryFallback(
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


  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const meta =
    report
      ?.report_data
      ?.meta ||
    {

      ship:
        report.ship ||
        '',

      dateOn:
        report.date_on ||
        '',

      dateOff:
        report.date_off ||
        '',

      reviewer:
        report.reviewer ||
        ''

    };


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
            item.checked
          ){

            points.push({

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

              followUpNeeded:
                Boolean(
                  item.followUpNeeded
                ),

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


  if(
    points.length === 0
  ){

    container.innerHTML = `

      <div class="empty">

        No checked points in this report.

      </div>

    `;


    return;

  }


  const groups =
    [];


  points.forEach(
    point => {

      let group =
        groups.find(
          item =>
            item.section ===
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


  container.innerHTML = `

    <div
      style="
        margin-bottom:16px;
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
          line-height:1.6;
        "
      >

        <b>Ship:</b>

        ${escapeHtml(
          meta.ship ||
          ''
        )}

        <br>


        <b>Visit:</b>

        ${escapeHtml(
          meta.dateOn ||
          ''
        )}

        ${
          meta.dateOff
            ? ` → ${escapeHtml(
                meta.dateOff
              )}`
            : ''
        }

        <br>


        <b>Reviewer:</b>

        ${escapeHtml(
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
                margin-bottom:18px;
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
                    point =>
                      renderSummaryPoint(
                        point
                      )
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
   SHIP RESPONSE FALLBACK
============================================================ */

function renderShipResponseFallback(
  container,
  reports
){

  const cards =
    [];


  reports.forEach(
    report => {

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


      if(
        points.length
      ){

        cards.push({

          report,

          points

        });

      }

    }
  );


  if(
    cards.length === 0
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
    cards
      .map(
        group => `

          <div class="report-card blue">


            <h3>

              ${escapeHtml(
                group.report.ship ||
                ''
              )}

            </h3>


            <div class="report-meta">

              <b>Visit:</b>

              ${escapeHtml(
                group.report.date_on ||
                ''
              )}

              ${
                group.report.date_off
                  ? ` → ${escapeHtml(
                      group.report.date_off
                    )}`
                  : ''
              }

              <br>


              <b>Reviewer:</b>

              ${escapeHtml(
                group.report.reviewer ||
                ''
              )}

            </div>


            ${
              group.points
                .map(
                  point =>
                    renderResponseFallbackPoint(
                      group.report.id,
                      point
                    )
                )
                .join('')
            }


            <button
              type="button"
              class="btn-primary save-ship-response"
              data-report-id="${escapeHtml(
                group.report.id
              )}"
              style="
                margin-top:12px;
              "
            >

              Submit Report

            </button>


          </div>

        `
      )
      .join('');


  bindShipResponseInputs();

}


/* ============================================================
   SHIP RESPONSE POINT
============================================================ */

function renderResponseFallbackPoint(
  reportId,
  point
){

  return `

    <div
      style="
        margin-top:12px;
        padding-top:12px;
        border-top:1px solid var(--vv-line);
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:8px;
          font-weight:800;
          text-transform:uppercase;
        "
      >

        ${escapeHtml(
          point.section
        )}

      </div>


      <div
        style="
          margin-top:4px;
          color:var(--vv-body);
          font-size:12px;
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
        point.comments.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div class="response-label">

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
        point.photos.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div class="response-label">

                REVIEWER PHOTOS

              </div>


              <div class="response-photos">

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
   SHIP RESPONSE INPUTS
============================================================ */

function bindShipResponseInputs(){

  document
    .querySelectorAll(
      '.save-ship-response'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(){

            await submitFallbackShipResponse(
              button.dataset.reportId
            );

          }
        );

      }
    );

}


/* ============================================================
   SUBMIT SHIP RESPONSE
============================================================ */

async function submitFallbackShipResponse(
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
        `[data-response-report="${reportId}"]`
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
      added === 0
    ){

      alert(
        'Please enter at least one ship response.'
      );


      return;

    }


    /*
      Require every follow-up point
      to have a ship response.
    */

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


    if(
      !window.confirm(
        'Submit Ship Response?\n\n' +
        'The report will move to Submitted Reports.'
      )
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
      'Submit ship response:',
      error
    );


    showError(
      'Could not submit Ship Response.',
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
   FOLLOW UPS
============================================================ */

function bindFollowUpButtons(){

  bindClick(
    'followupPdfBtn',
    async function(){

      if(
        !currentSubmittedReport
      ){

        return;

      }


      const pdf =
        await getPDFModule();


      if(
        !pdf
      ){

        return;

      }


      pdf.generateFollowUpPDF(
        currentSubmittedReport
      );

    }
  );

}


/* ============================================================
   PDF
============================================================ */

function bindPDFButtons(){

  /*
    Active report PDF
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


      pdf.generatePDF();

    }
  );

}


/* ============================================================
   HEADER BACK
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

      showScreen(
        checklistReturnScreen ||
        'home'
      );


      if(
        checklistReturnScreen ===
        'open'
      ){

        await loadOpenReportsScreen();

      }

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
   APP ERROR
============================================================ */

function showError(
  message,
  error=null
){

  console.error(
    message,
    error
  );


  /*
    Do not freeze the application.
    Show a normal alert instead.
  */

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
  function(event){

    console.error(
      'Ship Visit Report error:',
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  'unhandledrejection',
  function(event){

    console.error(
      'Ship Visit Report promise error:',
      event.reason
    );

  }
);
