/*
  main.js

  Main controller for the Ship Visit Report application.

  FLOW

  HOME
    |
    +-- CREATE REPORT
    |      |
    |      v
    |    OPEN REPORT
    |      |
    |      v
    |    CHECKLIST
    |      |
    |      v
    |    SHIP REVIEW
    |      |
    |      v
    |    SUBMIT
    |      |
    |      v
    |    HOME
    |
    +-- OPEN REPORTS
    |
    +-- SUBMITTED REPORTS
    |      |
    |      +-- REPORT OVERALL
    |      |
    |      +-- POINTS TO FOLLOW UP
    |      |
    |      +-- SAVE PDF
    |      |
    |      +-- PRINT
    |
    +-- SHIP RESPONSE REPORT
           |
           +-- Reviewer comments
           +-- Reviewer photos
           +-- Ship comments
           +-- Save response
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
  getReportId
} from './state.js';


import {
  saveOpenReport,
  getOpenReports,
  getSubmittedReports,
  getReport,
  deleteOpenReport,
  saveShipResponse
} from './supabase.js';


import {
  renderChecklist,
  updateChecklistHeader,
  refreshChecklistUI,
  saveChecklist
} from './checklist.js';


import {
  prepareShipReview,
  submitCurrentReport,
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
   APPLICATION STATE
========================================================= */

let currentSubmittedReport =
  null;


let currentResponseReport =
  null;


/* =========================================================
   SCREENS
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
   START
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeApp(){

  setupDefaultDate();

  bindHome();

  bindCreateReport();

  bindChecklist();

  bindShipReview();

  bindSummary();

  bindOpenReports();

  bindSubmittedReports();

  bindFollowUps();

  bindShipResponses();

  bindReportCallbacks();

  bindReviewCallbacks();

  bindPDFButtons();

  showScreen(
    'home'
  );

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
        element
      ){

        element.classList.toggle(
          'hidden',
          id !== screen
        );

      }

    }
  );


  window.scrollTo(
    0,
    0
  );

}


/* =========================================================
   HOME
========================================================= */

function bindHome(){

  const create =
    document.getElementById(
      'createReport'
    );


  if(
    create
  ){

    create.addEventListener(
      'click',
      () => {

        clearSetupFields();

        setupDefaultDate();

        showScreen(
          'setup'
        );

      }
    );

  }


  const open =
    document.getElementById(
      'openReport'
    );


  if(
    open
  ){

    open.addEventListener(
      'click',
      async () => {

        await renderOpenReports();

        showScreen(
          'open'
        );

      }
    );

  }


  const submitted =
    document.getElementById(
      'submittedReports'
    );


  if(
    submitted
  ){

    submitted.addEventListener(
      'click',
      async () => {

        await renderSubmittedReports();

        showScreen(
          'submitted'
        );

      }
    );

  }


  const responses =
    document.getElementById(
      'shipResponseReport'
    );


  if(
    responses
  ){

    responses.addEventListener(
      'click',
      async () => {

        await renderShipResponseReports();

        showScreen(
          'responses'
        );

      }
    );

  }


  bindHomeButton(
    'setupHome'
  );

  bindHomeButton(
    'openHomeBtn'
  );

  bindHomeButton(
    'reportsHomeBtn'
  );

  bindHomeButton(
    'responsesHomeBtn'
  );

  bindHomeButton(
    'summaryHomeBtn'
  );

  bindHomeButton(
    'followupsHomeBtn'
  );

}


function bindHomeButton(
  id
){

  const button =
    document.getElementById(
      id
    );


  if(
    button
  ){

    button.addEventListener(
      'click',
      () => {

        showScreen(
          'home'
        );

      }
    );

  }

}


/* =========================================================
   CREATE REPORT
========================================================= */

function bindCreateReport(){

  const start =
    document.getElementById(
      'startBtn'
    );


  if(
    start
  ){

    start.addEventListener(
      'click',
      handleStartReport
    );

  }

}


/* =========================================================
   DEFAULT DATE
========================================================= */

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


/* =========================================================
   CLEAR SETUP
========================================================= */

function clearSetupFields(){

  const ids = [

    'ship',

    'dateOn',

    'dateOff',

    'reviewer'

  ];


  ids.forEach(
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


  /*
    Create brand-new local report.
  */

  startNewReport({

    ship,

    dateOn,

    dateOff,

    reviewer

  });


  /*
    Render checklist.
  */

  updateChecklistHeader();

  renderChecklist();

  showScreen(
    'checklist'
  );


  /*
    Save immediately to Supabase
    as an OPEN report.
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

    alert(
      'The report could not be created in Supabase.\n\n' +
      (
        result?.error?.message ||
        'Unknown error'
      )
    );


    resetReport();

    clearSetupFields();

    showScreen(
      'setup'
    );

    return;

  }


  /*
    Save database report ID.
  */

  if(
    result.data?.id
  ){

    const stateModule =
      await import(
        './state.js'
      );


    stateModule.setReportId(
      result.data.id
    );

  }


  showToast(
    'Open report created.'
  );

}


/* =========================================================
   CHECKLIST
========================================================= */

function bindChecklist(){

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
    Generate Summary button.
  */

  const summary =
    document.getElementById(
      'summaryBtn'
    );


  if(
    summary
  ){

    summary.addEventListener(
      'click',
      async () => {

        await saveCurrentReport();

        buildCurrentSummary();

        showScreen(
          'summary'
        );

      }
    );

  }

}


/* =========================================================
   SAVE CURRENT OPEN REPORT
========================================================= */

async function saveCurrentReport(){

  const reportId =
    getReportId();


  if(
    !reportId
  ){

    return false;

  }


  const result =
    await saveOpenReport({

      reportId,

      meta:
        getMeta(),

      state:
        getState()

    });


  if(
    !result?.success
  ){

    console.error(
      'Current report save failed:',
      result?.error
    );

    return false;

  }


  return true;

}


/* =========================================================
   SHIP REVIEW
========================================================= */

function bindShipReview(){

  const button =
    document.getElementById(
      'shipReviewBtn'
    );


  if(
    button
  ){

    button.addEventListener(
      'click',
      async () => {

        await openShipReview();

      }
    );

  }


  const reviewBack =
    document.getElementById(
      'reviewBackBtn'
    );


  if(
    reviewBack
  ){

    reviewBack.addEventListener(
      'click',
      () => {

        updateChecklistHeader();

        renderChecklist();

        showScreen(
          'checklist'
        );

      }
    );

  }


  const submit =
    document.getElementById(
      'reviewSubmitBtn'
    );


  if(
    submit
  ){

    submit.addEventListener(
      'click',
      async () => {

        await handleSubmit();

      }
    );

  }


  const summaryReview =
    document.getElementById(
      'summaryShipReviewBtn'
    );


  if(
    summaryReview
  ){

    summaryReview.addEventListener(
      'click',
      async () => {

        await openShipReview();

      }
    );

  }

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
      'The report could not be saved before Ship Review.'
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
   REVIEW CALLBACK
========================================================= */

function bindReviewCallbacks(){

  setReviewCallbacks({

    submitted:
      async submittedReport => {

        /*
          Store submitted report temporarily
          in case the user wants to inspect it.
        */

        currentSubmittedReport =
          submittedReport ||
          null;


        /*
          Report is now submitted.
        */

        resetReport();

        clearSetupFields();

        showScreen(
          'home'
        );


        showToast(
          'Report submitted successfully.'
        );

      }

  });

}


/* =========================================================
   SUBMIT
========================================================= */

async function handleSubmit(){

  const confirmed =
    window.confirm(
      'Submit this Ship Visit Report?\n\n' +
      'The report will move from Open Reports to Submitted Reports.'
    );


  if(
    !confirmed
  ){

    return;

  }


  const submitted =
    await submitCurrentReport();


  if(
    !submitted
  ){

    return;

  }

}


/* =========================================================
   SUMMARY
========================================================= */

function bindSummary(){

  const back =
    document.getElementById(
      'backBtn'
    );


  if(
    back
  ){

    back.addEventListener(
      'click',
      () => {

        updateChecklistHeader();

        renderChecklist();

        showScreen(
          'checklist'
        );

      }
    );

  }

}


/* =========================================================
   CURRENT SUMMARY
========================================================= */

function buildCurrentSummary(){

  /*
    This summary is mainly useful while
    the report is still open.

    Submitted reports use reports.js
    and REPORT OVERALL separately.
  */

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
      'Visit Summary';

  }


  const metaElement =
    document.getElementById(
      'sumMeta'
    );


  if(
    metaElement
  ){

    metaElement.textContent =
      `${meta.dateOn || ''}` +
      (
        meta.dateOff
          ? ` → ${meta.dateOff}`
          : ''
      ) +
      ` • Reviewer: ${
        meta.reviewer ||
        ''
      }`;

  }


  let total =
    0;


  let checked =
    0;


  let comments =
    0;


  let photos =
    0;


  let followUps =
    0;


  Object.values(
    state
  ).forEach(
    item => {

      total++;


      if(
        item.checked
      ){

        checked++;

      }


      comments +=
        Array.isArray(
          item.comments
        )
          ? item.comments.length
          : 0;


      photos +=
        Array.isArray(
          item.photos
        )
          ? item.photos.length
          : 0;


      if(
        item.followUpNeeded
      ){

        followUps++;

      }


    }
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
          ${checked}/${total}
        </div>

        <div class="stat-label">
          Points Checked
        </div>
      </div>


      <div class="stat">
        <div class="stat-number">
          ${comments}
        </div>

        <div class="stat-label">
          Comments
        </div>
      </div>


      <div class="stat">
        <div class="stat-number">
          ${photos}
        </div>

        <div class="stat-label">
          Photos
        </div>
      </div>


      <div class="stat">
        <div class="stat-number">
          ${followUps}
        </div>

        <div class="stat-label">
          Follow-Ups
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
      `Ship visit report for ${meta.ship || ''}. ` +
      `Reviewed by ${meta.reviewer || ''}. ` +
      `${checked} of ${total} checklist points checked. ` +
      `${followUps} point(s) marked for ship follow-up.`;

  }


  const container =
    document.getElementById(
      'sumSections'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML =
    '';


  SECTIONS.forEach(
    section => {

      let sectionChecked =
        0;


      let sectionFollowUps =
        0;


      const photos = [];


      section.items.forEach(
        (_,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if(
            item?.checked
          ){

            sectionChecked++;

          }


          if(
            item?.followUpNeeded
          ){

            sectionFollowUps++;

          }


          (
            item?.photos ||
            []
          ).forEach(
            photo => {

              photos.push(
                photo
              );

            }
          );

        }
      );


      const block =
        document.createElement(
          'div'
        );


      block.className =
        'summary-section';


      block.innerHTML = `

        <h2>
          ${escapeHtml(
            section.title
          )}
        </h2>


        <textarea
          rows="4"
          readonly
        >${
          escapeHtml(
            `${sectionChecked} of ${section.items.length} points checked.` +
            (
              sectionFollowUps
                ? ` ${sectionFollowUps} point(s) require ship follow-up.`
                : ''
            )
          )
        }</textarea>


        ${
          photos.length
            ? `

              <div
                style="
                  margin-top:8px;
                  color:var(--vv-squid);
                  font-size:10px;
                  font-weight:800;
                "
              >
                ATTACHED PHOTOS
              </div>


              <div class="summary-photos">

                ${
                  photos
                    .map(
                      photo => `

                        <div class="summary-photo">

                          <img
                            src="${photo}"
                            alt="Checklist photo"
                          >

                        </div>

                      `
                    )
                    .join('')
                }

              </div>

            `
            : ''
        }

      `;


      container.appendChild(
        block
      );

    }
  );

}


/* =========================================================
   REPORT CALLBACKS
========================================================= */

function bindReportCallbacks(){

  setReportCallbacks({

    /*
      OPEN REPORT
    */

    openReport:
      async report => {

        loadReport(
          report
        );


        updateChecklistHeader();

        renderChecklist();

        showScreen(
          'checklist'
        );

      },


    /*
      REPORT OVERALL
    */

    viewSummary:
      async report => {

        currentSubmittedReport =
          report;


        loadReport(
          report
        );


        renderReportOverall(
          report
        );


        showScreen(
          'summary'
        );

      },


    /*
      POINTS TO FOLLOW UP
    */

    viewFollowUps:
      async report => {

        currentSubmittedReport =
          report;


        renderReportFollowUps(
          report
        );


        showScreen(
          'followups'
        );

      },


    showHome:
      () => {

        showScreen(
          'home'
        );

      }

  });

}


/* =========================================================
   OPEN REPORTS
========================================================= */

function bindOpenReports(){

  const home =
    document.getElementById(
      'openHomeBtn'
    );


  if(
    home
  ){

    home.addEventListener(
      'click',
      () => {

        showScreen(
          'home'
        );

      }
    );

  }

}


/* =========================================================
   SUBMITTED REPORTS
========================================================= */

function bindSubmittedReports(){

  const home =
    document.getElementById(
      'reportsHomeBtn'
    );


  if(
    home
  ){

    home.addEventListener(
      'click',
      () => {

        showScreen(
          'home'
        );

      }
    );

  }

}


/* =========================================================
   FOLLOW-UP VIEW
========================================================= */

function bindFollowUps(){

  const home =
    document.getElementById(
      'followupsHomeBtn'
    );


  if(
    home
  ){

    home.addEventListener(
      'click',
      () => {

        showScreen(
          'home'
        );

      }
    );

  }


  const pdf =
    document.getElementById(
      'followupPdfBtn'
    );


  if(
    pdf
  ){

    pdf.addEventListener(
      'click',
      () => {

        if(
          currentSubmittedReport
        ){

          generateFollowUpPDF(
            currentSubmittedReport
          );

        }

      }
    );

  }


  const print =
    document.getElementById(
      'followupPrintBtn'
    );


  if(
    print
  ){

    print.addEventListener(
      'click',
      () => {

        printReport();

      }
    );

  }

}


/* =========================================================
   SHIP RESPONSE
========================================================= */

function bindShipResponses(){

  const home =
    document.getElementById(
      'responsesHomeBtn'
    );


  if(
    home
  ){

    home.addEventListener(
      'click',
      () => {

        showScreen(
          'home'
        );

      }
    );

  }

}


/* =========================================================
   RENDER SHIP RESPONSE REPORTS
========================================================= */

async function renderShipResponseReports(){

  const container =
    document.getElementById(
      'responseList'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML =
    `
      <div class="empty">
        Loading ship response reports...
      </div>
    `;


  const result =
    await getSubmittedReports();


  if(
    !result ||
    !result.success
  ){

    container.innerHTML =
      `
        <div class="empty">
          Could not load submitted reports.
        </div>
      `;

    return;

  }


  const reports =
    result.data || [];


  const groups =
    [];


  reports.forEach(
    report => {

      const points =
        extractFollowUpPoints(
          report
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
    !groups.length
  ){

    container.innerHTML =
      `
        <div class="empty">

          No points currently require
          ship follow-up.

        </div>
      `;

    return;

  }


  container.innerHTML =
    groups
      .map(
        group =>
          renderShipResponseGroup(
            group
          )
      )
      .join('');


  bindShipResponseInputs();

}


/* =========================================================
   EXTRACT FOLLOW-UP POINTS
========================================================= */

function extractFollowUpPoints(
  report
){

  const savedState =
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
            savedState[key];


          if(
            item &&
            item.followUpNeeded
          ){

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


  return points;

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
        Array.isArray(
          point.shipComments
        ) &&
        point.shipComments.length > 0
    ).length;


  const allComplete =
    completed ===
    points.length;


  return `

    <div
      class="report-card ${
        allComplete
          ? 'green'
          : 'blue'
      }"
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


        <span
          class="status ${
            allComplete
              ? 'green'
              : 'blue'
          }"
        >

          ${
            allComplete
              ? 'SHIP RESPONSE COMPLETE'
              : 'FOLLOW-UP OPEN'
          }

          — ${completed}/${points.length}

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
          margin-top:12px;
        "
      >
        Save Ship Responses
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

  const shipComments =
    point.shipComments || [];


  return `

    <div
      class="response-point"
      style="
        padding:14px 0;
        border-top:1px solid var(--vv-line);
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:10px;
          font-weight:800;
          letter-spacing:.04em;
        "
      >

        ${escapeHtml(
          point.section
        )}

      </div>


      <div
        style="
          margin-top:4px;
          font-size:14px;
          line-height:1.45;
          font-weight:600;
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

              <div
                style="
                  color:var(--vv-squid);
                  font-size:9px;
                  font-weight:800;
                  margin-bottom:5px;
                "
              >
                REVIEWER COMMENTS
              </div>


              ${
                point.comments
                  .map(
                    comment => `

                      <div
                        class="comment"
                        style="
                          margin-top:5px;
                        "
                      >

                        <b>

                          ${escapeHtml(
                            comment.name ||
                            'Reviewer'
                          )}:

                        </b>

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
                margin-top:10px;
              "
            >

              <div
                style="
                  color:var(--vv-squid);
                  font-size:9px;
                  font-weight:800;
                  margin-bottom:6px;
                "
              >
                REVIEWER PHOTOS
              </div>


              <div
                style="
                  display:flex;
                  flex-wrap:wrap;
                  gap:8px;
                "
              >

                ${
                  point.photos
                    .map(
                      photo => `

                        <div
                          style="
                            width:105px;
                            height:105px;
                            overflow:hidden;
                            border:1px solid var(--vv-line);
                            border-radius:8px;
                            background:#fff;
                          "
                        >

                          <img
                            src="${photo}"
                            alt="Reviewer photo"
                            style="
                              width:100%;
                              height:100%;
                              object-fit:cover;
                            "
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
        shipComments.length
          ? `

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
                EXISTING SHIP COMMENTS
              </div>


              ${
                shipComments
                  .map(
                    comment => `

                      <div
                        class="ship-response-display"
                        style="
                          margin-top:5px;
                        "
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

        <label>
          ADD SHIP COMMENT
        </label>


        <textarea
          rows="3"
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


/* =========================================================
   SHIP RESPONSE INPUTS
========================================================= */

function bindShipResponseInputs(){

  document
    .querySelectorAll(
      '.save-ship-response'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await saveShipResponseGroup(
              button.dataset.reportId,
              button
            );

          }
        );

      }
    );

}


/* =========================================================
   SAVE SHIP RESPONSE GROUP
========================================================= */

async function saveShipResponseGroup(
  reportId,
  button
){

  if(
    !reportId
  ){

    return;

  }


  /*
    Load latest version from Supabase.
  */

  const result =
    await getReport(
      reportId
    );


  if(
    !result.success ||
    !result.data
  ){

    alert(
      'Could not load report.'
    );

    return;

  }


  const report =
    result.data;


  const state =
    JSON.parse(
      JSON.stringify(
        report
          .report_data
          ?.state ||
        {}
      )
    );


  /*
    Find all inputs belonging
    to this report.
  */

  document
    .querySelectorAll(
      `[data-response-report="${reportId}"]`
    )
    .forEach(
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
            state[key]
              .shipComments
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


        input.value =
          '';

      }
    );


  /*
    Save complete state back to
    the same submitted report.
  */

  const save =
    await saveShipResponse({

      reportId,

      state

    });


  if(
    !save.success
  ){

    alert(
      'Could not save ship responses.\n\n' +
      (
        save.error?.message ||
        'Unknown error'
      )
    );

    return;

  }


  showToast(
    save.complete
      ? 'All ship follow-ups completed.'
      : 'Ship response saved.'
  );


  /*
    Refresh screen so the report
    changes to green when complete.
  */

  await renderShipResponseReports();

}


/* =========================================================
   PDF
========================================================= */

function bindPDFButtons(){

  const pdf =
    document.getElementById(
      'pdfBtn'
    );


  if(
    pdf
  ){

    pdf.addEventListener(
      'click',
      () => {

        generatePDF();

      }
    );

  }


  const print =
    document.getElementById(
      'printBtn'
    );


  if(
    print
  ){

    print.addEventListener(
      'click',
      () => {

        printReport();

      }
    );

  }

}


/* =========================================================
   ESCAPE HTML
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


  let toast =
    document.getElementById(
      'main-toast'
    );


  if(
    !toast
  ){

    toast =
      document.createElement(
        'div'
      );


    toast.id =
      'main-toast';


    toast.style.cssText = `

      position:fixed;

      left:50%;

      bottom:90px;

      transform:translateX(-50%);

      z-index:99999;

      max-width:90%;

      padding:10px 15px;

      border-radius:8px;

      background:#1B1B1B;

      color:#fff;

      font-family:Arial,sans-serif;

      font-size:12px;

      box-shadow:
        0 4px 14px rgba(0,0,0,.25);

      pointer-events:none;

    `;


    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.style.display =
    'block';


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      () => {

        toast.style.display =
          'none';

      },
      3000
    );

}


/* =========================================================
   GLOBAL ERROR HANDLING
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
