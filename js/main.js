/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  main.js
  ============================================================

  FLOW

  CREATE REPORT
      ↓
  OPEN REPORTS
      ↓
  CHECKLIST
      ↓
  REPORT OVERALL
      ↓
  SHIP REVIEW
      ↓
  SEND TO SHIP
      ↓
  SHIP RESPONSE REPORT
      ↓
  SUBMIT SHIP RESPONSE
      ↓
  SUBMITTED REPORTS
*/


/* =========================================================
   IMPORTS
========================================================= */

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


import {
  renderChecklist,
  updateChecklistHeader
} from './checklist.js';


import {
  prepareShipReview,
  sendCurrentReportToShip,
  setReviewCallbacks
} from './review.js';


import {
  renderOpenReports,
  renderSubmittedReports,
  renderReportOverall,
  renderReportFollowUps,
  setReportCallbacks
} from './reports.js';


import {
  generatePDF,
  generateFollowUpPDF,
  printReport
} from './pdf.js';


/* =========================================================
   ADMIN
========================================================= */

const ADMIN_EMAILS = [
  'alebass80@gmail.com'
];


let adminMode = false;


/* =========================================================
   NAVIGATION
========================================================= */

let checklistReturnScreen = 'setup';

let summaryReturnScreen = 'checklist';


/* =========================================================
   CURRENT SUBMITTED REPORT
========================================================= */

let currentSubmittedReport = null;


/* =========================================================
   SCREEN LIST
========================================================= */

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


/* =========================================================
   ADMIN GLOBAL
========================================================= */

window.shipVisitIsAdmin =
function(){

  return adminMode;

};


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeApp(){

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

  bindReportCallbacks();

  bindReviewCallbacks();

  updateAdminButton();

  showScreen(
    'home'
  );

}


/* =========================================================
   ADMIN
========================================================= */

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
    () => {

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


      const allowed =
        ADMIN_EMAILS.includes(
          normalized
        );


      if(
        !allowed
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


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

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


/* =========================================================
   GENERIC CLICK BINDING
========================================================= */

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


/* =========================================================
   HOME BUTTONS
========================================================= */

function bindHomeButtons(){

  /* CREATE REPORT */

  bindClick(
    'createReport',
    () => {

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


  /* OPEN REPORTS */

  bindClick(
    'openReport',
    async () => {

      showScreen(
        'open'
      );


      await loadOpenReports();

    }
  );


  /* SUBMITTED REPORTS */

  bindClick(
    'submittedReports',
    async () => {

      showScreen(
        'submitted'
      );


      await loadSubmittedReports();

    }
  );


  /* SHIP RESPONSE REPORT */

  bindClick(
    'shipResponseReport',
    async () => {

      showScreen(
        'responses'
      );


      await loadShipReviewReports();

    }
  );


  /* HOME BUTTONS */

  bindClick(
    'setupHome',
    () => {

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'openHomeBtn',
    () => {

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'reportsHomeBtn',
    () => {

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'responsesHomeBtn',
    () => {

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'followupsHomeBtn',
    () => {

      showScreen(
        'home'
      );

    }
  );

}


/* =========================================================
   HEADER BACK BUTTONS
========================================================= */

function bindHeaderBackButtons(){

  /* SETUP → HOME */

  bindClick(
    'setupHeaderBack',
    () => {

      showScreen(
        'home'
      );

    }
  );


  /* CHECKLIST → PREVIOUS */

  bindClick(
    'checklistHeaderBack',
    async () => {

      const destination =
        checklistReturnScreen ||
        'home';


      showScreen(
        destination
      );


      if(
        destination === 'open'
      ){

        await loadOpenReports();

      }

    }
  );


  /* SHIP REVIEW → CHECKLIST */

  bindClick(
    'reviewHeaderBack',
    () => {

      updateChecklistHeader();

      renderChecklist();


      showScreen(
        'checklist'
      );

    }
  );


  /* SUMMARY → PREVIOUS */

  bindClick(
    'summaryHeaderBack',
    async () => {

      const destination =
        summaryReturnScreen ||
        'checklist';


      if(
        destination === 'submitted'
      ){

        showScreen(
          'submitted'
        );


        await loadSubmittedReports();


        return;

      }


      /*
        Active report.
      */

      setSummaryMode(
        false
      );


      updateChecklistHeader();

      renderChecklist();


      showScreen(
        'checklist'
      );

    }
  );


  /* FOLLOW UPS → SUBMITTED */

  bindClick(
    'followupsHeaderBack',
    async () => {

      showScreen(
        'submitted'
      );


      await loadSubmittedReports();

    }
  );


  /* OPEN → HOME */

  bindClick(
    'openHeaderBack',
    () => {

      showScreen(
        'home'
      );

    }
  );


  /* SUBMITTED → HOME */

  bindClick(
    'submittedHeaderBack',
    () => {

      showScreen(
        'home'
      );

    }
  );


  /* RESPONSES → HOME */

  bindClick(
    'responsesHeaderBack',
    () => {

      showScreen(
        'home'
      );

    }
  );

}


/* =========================================================
   CREATE REPORT
========================================================= */

function bindCreateReport(){

  bindClick(
    'startBtn',
    handleStartReport
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


function clearSetupFields(){

  [
    'ship',
    'dateOn',
    'dateOff',
    'reviewer'
  ]
  .forEach(
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


/* =========================================================
   START REPORT
========================================================= */

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
      Initialize local report state.
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


    updateChecklistHeader();

    renderChecklist();


    showScreen(
      'checklist'
    );


    /*
      Create OPEN report in Supabase.
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
          'Could not create the report in Supabase.'
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
      'Create report:',
      error
    );


    alert(
      'Could not create the report.\n\n' +
      (
        error?.message ||
        'Unknown error'
      )
    );

  }

}


/* =========================================================
   SAVE CURRENT REPORT
========================================================= */

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


/* =========================================================
   CHECKLIST BUTTONS
========================================================= */

function bindChecklistButtons(){

  const reviewer =
    document.getElementById(
      'hdrReviewer'
    );


  if(
    reviewer
  ){

    reviewer.addEventListener(
      'change',
      async event => {

        setReviewer(
          event.target.value
        );


        await saveCurrentReport();

      }
    );

  }


  /*
    REPORT OVERALL
  */

  bindClick(
    'summaryBtn',
    async () => {

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


      /*
        This is an ACTIVE report.
      */

      summaryReturnScreen =
        'checklist';


      setSummaryMode(
        false
      );


      buildCurrentSummary();


      showScreen(
        'summary'
      );

    }
  );


  /*
    SEND TO SHIP REVIEW
  */

  bindClick(
    'shipReviewBtn',
    openShipReview
  );

}


/* =========================================================
   OPEN SHIP REVIEW
========================================================= */

async function openShipReview(){

  const saved =
    await saveCurrentReport();


  if(
    !saved
  ){

    alert(
      'Could not save the report before Ship Review.'
    );


    return;

  }


  const prepared =
    await prepareShipReview();


  if(
    !prepared
  ){

    return;

  }


  showScreen(
    'review'
  );

}


/* =========================================================
   REVIEW BUTTONS
========================================================= */

function bindReviewButtons(){

  /*
    BACK
  */

  bindClick(
    'reviewBackBtn',
    () => {

      updateChecklistHeader();

      renderChecklist();


      showScreen(
        'checklist'
      );

    }
  );


  /*
    SEND TO SHIP
  */

  bindClick(
    'reviewSubmitBtn',
    async () => {

      await sendCurrentReportToShip();

    }
  );

}


/* =========================================================
   REVIEW CALLBACK
========================================================= */

function bindReviewCallbacks(){

  setReviewCallbacks({

    sentToShip:
      async report => {

        /*
          Clear local active report.
        */

        resetReport();

        clearSetupFields();


        currentSubmittedReport =
          null;


        /*
          Important:
          once sent, immediately show Ship Response.
        */

        showScreen(
          'responses'
        );


        showToast(
          'REPORT SENT TO SHIP'
        );


        /*
          Load the report from the
          ship_review status.
        */

        await loadShipReviewReports();

      }

  });

}


/* =========================================================
   SUMMARY BUTTONS
========================================================= */

function bindSummaryButtons(){

  /*
    ACTIVE REPORT:
    Back to Checklist.
  */

  bindClick(
    'summaryBackToReportBtn',
    () => {

      setSummaryMode(
        false
      );


      updateChecklistHeader();

      renderChecklist();


      showScreen(
        'checklist'
      );

    }
  );


  /*
    ACTIVE REPORT:
    Send to Ship Review.
  */

  bindClick(
    'summarySubmitBtn',
    async () => {

      await openShipReview();

    }
  );


  /*
    SUBMITTED REPORT:
    Back to Submitted Reports.
  */

  bindClick(
    'summaryBackToSubmittedBtn',
    async () => {

      showScreen(
        'submitted'
      );


      await loadSubmittedReports();

    }
  );


  /*
    SUBMITTED REPORT:
    Save PDF.
  */

  bindClick(
    'summaryPdfBtn',
    async () => {

      if(
        !currentSubmittedReport
      ){

        showToast(
          'No submitted report selected.'
        );


        return;

      }


      try{

        loadReport(
          currentSubmittedReport
        );


        renderReportOverall(
          currentSubmittedReport
        );


        await wait(
          150
        );


        generatePDF();

      }catch(error){

        console.error(
          'Generate PDF:',
          error
        );


        alert(
          'Could not generate PDF.\n\n' +
          (
            error?.message ||
            'Unknown error'
          )
        );

      }

    }
  );


  /*
    SUBMITTED REPORT:
    Print.
  */

  bindClick(
    'summaryPrintBtn',
    async () => {

      if(
        !currentSubmittedReport
      ){

        showToast(
          'No submitted report selected.'
        );


        return;

      }


      try{

        loadReport(
          currentSubmittedReport
        );


        renderReportOverall(
          currentSubmittedReport
        );


        await wait(
          150
        );


        window.print();

      }catch(error){

        console.error(
          'Print:',
          error
        );


        alert(
          'Could not print the report.'
        );

      }

    }
  );

}


/* =========================================================
   SUMMARY MODE
========================================================= */

function setSummaryMode(
  submitted
){

  const activeActions =
    document.getElementById(
      'summaryActiveActions'
    );


  const submittedActions =
    document.getElementById(
      'summarySubmittedActions'
    );


  const submittedPrintRow =
    document.getElementById(
      'summarySubmittedPrintRow'
    );


  /*
    ACTIVE REPORT
  */

  if(
    !submitted
  ){

    if(
      activeActions
    ){

      activeActions.classList.remove(
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


    if(
      submittedPrintRow
    ){

      submittedPrintRow.classList.add(
        'hidden'
      );

    }


    return;

  }


  /*
    SUBMITTED REPORT
  */

  if(
    activeActions
  ){

    activeActions.classList.add(
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


  if(
    submittedPrintRow
  ){

    submittedPrintRow.classList.remove(
      'hidden'
    );

  }

}


/* =========================================================
   SUMMARY
========================================================= */

function buildCurrentSummary(){

  const meta =
    getMeta();


  const state =
    getState();


  const title =
    document.getElementById(
      'sumTitle'
    );


  if(
    title
  ){

    title.textContent =
      meta.ship ||
      'Report Overall';

  }


  const subtitle =
    document.getElementById(
      'sumMeta'
    );


  if(
    subtitle
  ){

    subtitle.textContent =
      `${meta.dateOn || ''}` +
      (
        meta.dateOff
          ? ` → ${meta.dateOff}`
          : ''
      ) +
      ` • Reviewer: ${
        meta.reviewer ||
        getReviewer() ||
        ''
      }`;

  }


  const departments =
    [];


  SECTIONS.forEach(
    section => {

      const points =
        [];


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
            !item ||
            !item.checked
          ){

            return;

          }


          points.push({

            key,

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
      );


      if(
        points.length
      ){

        departments.push({

          section,

          points

        });

      }

    }
  );


  /*
    Hidden PDF statistics.
  */

  const checked =
    departments.reduce(
      (
        total,
        department
      ) =>
        total +
        department.points.length,
      0
    );


  const comments =
    departments.reduce(
      (
        total,
        department
      ) =>
        total +
        department.points.reduce(
          (
            count,
            point
          ) =>
            count +
            point.comments.length +
            point.shipComments.length,
          0
        ),
      0
    );


  const photos =
    departments.reduce(
      (
        total,
        department
      ) =>
        total +
        department.points.reduce(
          (
            count,
            point
          ) =>
            count +
            point.photos.length,
          0
        ),
      0
    );


  const followUps =
    departments.reduce(
      (
        total,
        department
      ) =>
        total +
        department.points.filter(
          point =>
            point.followUpNeeded
        ).length,
      0
    );


  const stats =
    document.getElementById(
      'stats'
    );


  if(
    stats
  ){

    stats.innerHTML = `

      <div class="stat">

        <div class="stat-number">
          ${checked}
        </div>

        <div class="stat-label">
          CHECKED POINTS
        </div>

      </div>


      <div class="stat">

        <div class="stat-number">
          ${comments}
        </div>

        <div class="stat-label">
          COMMENTS
        </div>

      </div>


      <div class="stat">

        <div class="stat-number">
          ${photos}
        </div>

        <div class="stat-label">
          PHOTOS
        </div>

      </div>


      <div class="stat">

        <div class="stat-number">
          ${followUps}
        </div>

        <div class="stat-label">
          FOLLOW-UPS
        </div>

      </div>

    `;

  }


  const overall =
    document.getElementById(
      'overall'
    );


  if(
    overall
  ){

    overall.value =
      `${meta.ship || ''} Ship Visit Report. ` +
      `${checked} checked point(s). ` +
      `${followUps} follow-up point(s). ` +
      `${photos} attached photo(s).`;

  }


  const visible =
    document.getElementById(
      'report-overall-content'
    );


  if(
    !visible
  ){

    return;

  }


  if(
    departments.length === 0
  ){

    visible.innerHTML = `

      <div class="empty">

        No checklist points have been
        marked as checked yet.

      </div>

    `;


    return;

  }


  visible.innerHTML =
    departments
      .map(
        department => `

          <div
            style="
              margin-bottom:20px;
            "
          >

            <div
              style="
                margin-bottom:10px;
                padding-bottom:7px;
                border-bottom:2px solid var(--vv-red);
                color:var(--vv-squid);
                font-size:15px;
                font-weight:800;
              "
            >

              ${escapeHtml(
                department.section.title
              )}

            </div>


            ${
              department.points
                .map(
                  renderSummaryPoint
                )
                .join('')
            }

          </div>

        `
      )
      .join('');

}


/* =========================================================
   SUMMARY POINT
========================================================= */

function renderSummaryPoint(
  point
){

  return `

    <div
      style="
        margin-bottom:12px;
        padding:13px;
        background:#fff;
        border:1px solid var(--vv-line);
        border-left:4px solid var(--vv-squid);
        border-radius:8px;
      "
    >

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
            color:#fff;
            border-radius:50%;
            font-size:12px;
            font-weight:800;
          "
        >

          ✓

        </div>


        <div
          style="
            flex:1;
            font-size:13.5px;
            line-height:1.5;
            font-weight:600;
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
                margin-top:8px;
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
        renderReviewerComments(
          point.comments
        )
      }


      ${
        renderReviewerPhotos(
          point.photos
        )
      }


      ${
        point.followUpNeeded
          ? renderShipComments(
              point.shipComments
            )
          : ''
      }

    </div>

  `;

}


/* =========================================================
   REVIEWER COMMENTS
========================================================= */

function renderReviewerComments(
  comments
){

  if(
    !Array.isArray(
      comments
    ) ||
    comments.length === 0
  ){

    return '';

  }


  return `

    <div
      style="
        margin-top:11px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:9px;
          font-weight:800;
          letter-spacing:.04em;
          margin-bottom:5px;
        "
      >

        REVIEWER COMMENTS

      </div>


      ${
        comments
          .map(
            comment => `

              <div class="comment">

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

  `;

}


/* =========================================================
   REVIEWER PHOTOS
========================================================= */

function renderReviewerPhotos(
  photos
){

  if(
    !Array.isArray(
      photos
    ) ||
    photos.length === 0
  ){

    return '';

  }


  return `

    <div
      style="
        margin-top:11px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:9px;
          font-weight:800;
          letter-spacing:.04em;
          margin-bottom:6px;
        "
      >

        ATTACHED PHOTOS

      </div>


      <div class="response-photos">

        ${
          photos
            .map(
              photo => `

                <div
                  class="response-photo"
                >

                  <img
                    src="${photo}"
                    alt="Reviewer photo"
                  >

                </div>

              `
            )
            .join('')
        }

      </div>

    </div>

  `;

}


/* =========================================================
   SHIP COMMENTS FOR SUMMARY
========================================================= */

function renderShipComments(
  comments
){

  if(
    !Array.isArray(
      comments
    ) ||
    comments.length === 0
  ){

    return `

      <div
        style="
          margin-top:10px;
          padding:8px 10px;
          background:#fff8f8;
          border-left:3px solid var(--vv-red);
          border-radius:6px;
          color:var(--vv-red);
          font-size:11px;
        "
      >

        No ship response yet.

      </div>

    `;

  }


  return `

    <div
      style="
        margin-top:11px;
      "
    >

      <div
        style="
          color:var(--status-green);
          font-size:9px;
          font-weight:800;
          margin-bottom:5px;
        "
      >

        SHIP COMMENTS / RESPONSES

      </div>


      ${
        comments
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

  `;

}


/* =========================================================
   OPEN REPORTS
========================================================= */

async function loadOpenReports(){

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

    await renderOpenReports();

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


/* =========================================================
   SUBMITTED REPORTS
========================================================= */

async function loadSubmittedReports(){

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

    await renderSubmittedReports();

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


/* =========================================================
   SHIP RESPONSE REPORT
========================================================= */

async function loadShipReviewReports(){

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
          'Could not load Ship Response Report.'
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


    const groups =
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


                /*
                  Only checked Follow-Up
                  points go to the ship.
                */

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

          groups.push({

            report,

            points

          });

        }

      }
    );


    if(
      groups.length === 0
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
      groups
        .map(
          renderShipResponseGroup
        )
        .join('');


    bindShipResponseButtons();

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


/* =========================================================
   SHIP RESPONSE GROUP
========================================================= */

function renderShipResponseGroup(
  group
){

  const report =
    group.report;


  const points =
    group.points;


  const completed =
    points.filter(
      point =>
        point.shipComments.length > 0
    ).length;


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


      <div class="report-meta">

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

        <br>


        <b>Responses:</b>

        ${completed}/${points.length}

        <br>


        <span class="status blue">

          SHIP RESPONSE REQUIRED

        </span>

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
        class="btn-primary save-ship-response"
        data-report-id="${escapeHtml(
          report.id
        )}"
        style="
          margin-top:15px;
        "
      >

        Submit Report

      </button>

    </div>

  `;

}


/* =========================================================
   SHIP RESPONSE POINT
========================================================= */

function renderShipResponsePoint(
  reportId,
  point
){

  return `

    <div
      class="response-point"
    >

      <!-- SECTION -->

      <div
        class="response-section"
      >

        ${escapeHtml(
          point.section
        )}

      </div>


      <!-- CHECKLIST POINT -->

      <div
        class="response-text"
      >

        ${escapeHtml(
          point.text
        )}

      </div>


      <!-- FOLLOW UP -->

      <div
        style="
          margin-top:8px;
        "
      >

        <span class="status blue">

          FOLLOW-UP NEEDED FROM SHIP

        </span>

      </div>


      <!-- ORIGINAL REVIEWER COMMENTS -->

      ${
        point.comments &&
        point.comments.length > 0

          ? `

            <div
              style="
                margin-top:13px;
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
                margin-top:10px;
                color:var(--vv-gray);
                font-size:11px;
              "
            >

              No reviewer comment was entered.

            </div>

          `
      }


      <!-- ORIGINAL REVIEWER PHOTOS -->

      ${
        point.photos &&
        point.photos.length > 0

          ? `

            <div
              style="
                margin-top:13px;
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

                        <div
                          class="response-photo"
                        >

                          <img
                            src="${photo}"
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


      <!-- PREVIOUS SHIP COMMENTS -->

      ${
        point.shipComments &&
        point.shipComments.length > 0

          ? `

            <div
              style="
                margin-top:13px;
              "
            >

              <div
                class="response-label"
                style="
                  color:var(--status-green);
                "
              >

                PREVIOUS SHIP COMMENTS

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


      <!-- NEW SHIP COMMENT -->

      <div
        class="field"
        style="
          margin-top:14px;
          margin-bottom:0;
        "
      >

        <label>
          SHIP COMMENT
        </label>


        <textarea
          class="ship-response-input"
          rows="4"
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


/* =========================================================
   SHIP RESPONSE BUTTONS
========================================================= */

function bindShipResponseButtons(){

  document
    .querySelectorAll(
      '.save-ship-response'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await handleSubmitShipResponse(
              button.dataset.reportId
            );

          }
        );

      }
    );

}


/* =========================================================
   SUBMIT SHIP RESPONSE
========================================================= */

async function handleSubmitShipResponse(
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
        'Could not load the report.'
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


    /*
      Add the new ship comments.
    */

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

          state[key]
            .shipComments =
            [];

        }


        state[key]
          .shipComments
          .push({

            name:
              'Ship',

            text,

            timestamp:
              new Date()
                .toISOString()

          });


        added++;

      }
    );


    if(
      added === 0
    ){

      alert(
        'Please enter at least one ship response before submitting.'
      );


      return;

    }


    /*
      All follow-up points must be answered.
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


    /*
      Refresh.

      Because status is now submitted,
      this report disappears from
      Ship Response Report.
    */

    await loadShipReviewReports();

  }catch(error){

    console.error(
      'Submit Ship Response:',
      error
    );


    alert(
      'Could not submit Ship Response.\n\n' +
      (
        error?.message ||
        'Unknown error'
      )
    );

  }

}


/* =========================================================
   FOLLOW-UP BUTTONS
========================================================= */

function bindFollowUpButtons(){

  bindClick(
    'followupPdfBtn',
    () => {

      if(
        currentSubmittedReport
      ){

        generateFollowUpPDF(
          currentSubmittedReport
        );

      }else{

        showToast(
          'No submitted report selected.'
        );

      }

    }
  );


  bindClick(
    'followupPrintBtn',
    () => {

      printReport();

    }
  );

}


/* =========================================================
   PDF BUTTONS
========================================================= */

function bindPDFButtons(){

  bindClick(
    'pdfBtn',
    () => {

      generatePDF();

    }
  );


  bindClick(
    'printBtn',
    () => {

      printReport();

    }
  );

}


/* =========================================================
   REPORT CALLBACKS
========================================================= */

function bindReportCallbacks(){

  setReportCallbacks({

    /*
      OPEN REPORT → CHECKLIST
    */

    openReport:
      async report => {

        checklistReturnScreen =
          'open';


        loadReport(
          report
        );


        updateChecklistHeader();

        renderChecklist();


        showScreen(
          'checklist'
        );


        showToast(
          'OPEN REPORT LOADED'
        );

      },


    /*
      SUBMITTED REPORT → OVERALL
    */

    viewSummary:
      async report => {

        currentSubmittedReport =
          report;


        summaryReturnScreen =
          'submitted';


        loadReport(
          report
        );


        renderReportOverall(
          report
        );


        /*
          This is the important part:
          Submitted reports do NOT have
          Send to Ship controls.
        */

        setSummaryMode(
          true
        );


        showScreen(
          'summary'
        );

      },


    /*
      SUBMITTED REPORT → FOLLOW UPS
    */

    viewFollowUps:
      async report => {

        currentSubmittedReport =
          report;


        loadReport(
          report
        );


        renderReportFollowUps(
          report
        );


        showScreen(
          'followups'
        );

      },


    /*
      HOME
    */

    showHome:
      () => {

        showScreen(
          'home'
        );

      }

  });

}


/* =========================================================
   WAIT
========================================================= */

function wait(
  milliseconds
){

  return new Promise(
    resolve => {

      setTimeout(
        resolve,
        milliseconds
      );

    }
  );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

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


/* =========================================================
   TOAST
========================================================= */

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


  alert(
    message
  );

}


/* =========================================================
   GLOBAL ERROR HANDLERS
========================================================= */

window.addEventListener(
  'error',
  event => {

    console.error(
      'Ship Visit Report error:',
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  'unhandledrejection',
  event => {

    console.error(
      'Ship Visit Report promise error:',
      event.reason
    );

  }
);
