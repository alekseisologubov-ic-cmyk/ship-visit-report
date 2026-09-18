/*
  main.js

  Main application controller.

  FLOW:

  HOME
    |
    +-- CREATE REPORT
    |       |
    |       +-- Ship / Dates / Reviewer
    |       |
    |       +-- OPEN REPORT
    |              |
    |              +-- Checklist
    |              |
    |              +-- SHIP REVIEW
    |                     |
    |                     +-- SUBMIT
    |
    +-- OPEN REPORTS
    |       |
    |       +-- Continue Open Report
    |
    +-- SUBMITTED REPORTS
    |       |
    |       +-- REPORT OVERALL
    |       |
    |       +-- POINTS TO FOLLOW UP
    |       |
    |       +-- PDF
    |       |
    |       +-- PRINT
    |
    +-- SHIP RESPONSE REPORT
            |
            +-- Ship comments / responses
*/


import {
  startNewReport,
  resetReport,
  loadReport,
  getMeta,
  getState,
  getReviewer,
  setReviewer,
  getReportId,
  setReportStatus,
  getReportStatus
} from './state.js';


import {
  createOpenReport,
  saveOpenReport,
  submitReport,
  getReport,
  getOpenReports,
  getSubmittedReports,
  saveShipResponse,
  getReportColor,
  getReportStatusText,
  reportNeedsFollowUp,
  getFollowUpPoints,
  areFollowUpsComplete
} from './supabase.js';


import {
  renderChecklist,
  refreshChecklistUI,
  updateChecklistHeader
} from './checklist.js';


import {
  renderShipReview,
  renderCompleteReview,
  prepareShipReview
} from './review.js';


import {
  renderOpenReports,
  renderSubmittedReports,
  renderReportOverall,
  renderReportFollowUps,
  openReportFromDatabase,
  setReportCallbacks
} from './reports.js';


import {
  generatePDF,
  generateFollowUpPDF,
  printReport
} from './pdf.js';


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


/* =========================================================
   GLOBAL APP STATE
========================================================= */

let currentScreen =
  'home';


let loadedSubmittedReport =
  null;


/* =========================================================
   SCREEN DEFINITIONS
========================================================= */

const SCREENS = [
  'home',
  'setup',
  'checklist',
  'review',
  'summary',
  'open',
  'submitted',
  'followups',
  'responses'
];


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

function initializeApp(){

  bindNavigation();

  bindCreateReport();

  bindChecklistNavigation();

  bindReviewNavigation();

  bindSummaryNavigation();

  bindOpenReportsNavigation();

  bindSubmittedReportsNavigation();

  bindFollowUpNavigation();

  bindShipResponseNavigation();

  bindReportCallbacks();

  bindPDFEvents();

  bindPrintEvents();

  setupDefaultDate();

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

  if (
    !SCREENS.includes(screen)
  ){

    screen =
      'home';

  }


  SCREENS.forEach(
    screenId => {

      const element =
        document.getElementById(
          screenId
        );


      if (
        element
      ){

        element.classList.toggle(
          'hidden',
          screenId !== screen
        );

      }

    }
  );


  currentScreen =
    screen;


  window.scrollTo(
    0,
    0
  );

}


/* =========================================================
   HOME / TOP NAVIGATION
========================================================= */

function bindNavigation(){

  const homeButtons = [
    'setupHome',
    'openHomeBtn',
    'reportsHomeBtn',
    'followupsHomeBtn',
    'responsesHomeBtn'
  ];


  homeButtons.forEach(
    buttonId => {

      const button =
        document.getElementById(
          buttonId
        );


      if (
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
  );

}


/* =========================================================
   CREATE REPORT
========================================================= */

function bindCreateReport(){

  const createButton =
    document.getElementById(
      'createReport'
    );


  if (
    createButton
  ){

    createButton.addEventListener(
      'click',
      () => {

        setupDefaultDate();

        showScreen(
          'setup'
        );

      }
    );

  }


  const startButton =
    document.getElementById(
      'startBtn'
    );


  if (
    startButton
  ){

    startButton.addEventListener(
      'click',
      handleStartReport
    );

  }

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setupDefaultDate(){

  const dateInput =
    document.getElementById(
      'dateOn'
    );


  if (
    dateInput &&
    !dateInput.value
  ){

    dateInput.value =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

  }

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


  if (
    !ship
  ){

    alert(
      'Please enter the ship.'
    );

    return;

  }


  if (
    !reviewer
  ){

    alert(
      'Please enter the reviewer.'
    );

    return;

  }


  /*
    Create brand-new report state.
  */

  startNewReport({

    ship,

    dateOn,

    dateOff,

    reviewer

  });


  /*
    Show checklist immediately.
  */

  updateChecklistHeader();

  renderChecklist();

  showScreen(
    'checklist'
  );


  /*
    Create the Open Report in Supabase.
  */

  const result =
    await saveOpenReport({

      reportId:
        null,

      meta:
        getMeta(),

      state:
        getState()

    });


  if (
    !result.success
  ){

    alert(
      'The report could not be created in Supabase.\n\n' +
      (
        result.error?.message ||
        'Unknown error'
      )
    );


    showScreen(
      'setup'
    );

    return;

  }


  /*
    Store returned database ID.
  */

  if (
    result.data?.id
  ){

    /*
      state.js owns report ID,
      so call setReportId().
    */

    import(
      './state.js'
    )
    .then(
      module => {

        module.setReportId(
          result.data.id
        );

      }
    );

  }


  showToast(
    'Open report created.'
  );

}


/* =========================================================
   CHECKLIST
========================================================= */

function bindChecklistNavigation(){

  const reviewerInput =
    document.getElementById(
      'hdrReviewer'
    );


  if (
    reviewerInput
  ){

    reviewerInput.addEventListener(
      'change',
      async event => {

        setReviewer(
          event.target.value
        );


        /*
          Save latest reviewer.
        */

        await saveCurrentReport();

      }
    );

  }


  /*
    Generate Summary
  */

  const summaryButton =
    document.getElementById(
      'summaryBtn'
    );


  if (
    summaryButton
  ){

    summaryButton.addEventListener(
      'click',
      async () => {

        await saveCurrentReport();

        showSummary();

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


  if (
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


  if (
    !result.success
  ){

    console.error(
      'Could not save current report:',
      result.error
    );

    return false;

  }


  return true;

}


/* =========================================================
   SHIP REVIEW
========================================================= */

function bindReviewNavigation(){

  /*
    The button can be called
    Ship Review from either the
    checklist or summary.
  */

  const reviewButtons =
    document.querySelectorAll(
      '[data-action="ship-review"]'
    );


  reviewButtons.forEach(
    button => {

      button.addEventListener(
        'click',
        async () => {

          await openShipReview();

        }
      );

    }
  );


  /*
    If there is a normal
    ID button, support it too.
  */

  const reviewButton =
    document.getElementById(
      'shipReviewBtn'
    );


  if (
    reviewButton
  ){

    reviewButton.addEventListener(
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


  if (
    !saved
  ){

    alert(
      'The report could not be saved before Ship Review.'
    );

    return;

  }


  const prepared =
    await prepareShipReview();


  if (
    !prepared
  ){

    return;

  }


  /*
    Both the new review container
    and legacy containers are supported.
  */

  renderReviewContainers();


  showScreen(
    'review'
  );

}


function renderReviewContainers(){

  try{

    renderShipReview();

  }catch(error){

    console.error(
      'Could not render Ship Review:',
      error
    );

  }


  try{

    renderCompleteReview();

  }catch(error){

    console.error(
      'Could not render complete review:',
      error
    );

  }

}


/* =========================================================
   SUMMARY
========================================================= */

function bindSummaryNavigation(){

  /*
    Back to checklist
  */

  const backButton =
    document.getElementById(
      'backBtn'
    );


  if (
    backButton
  ){

    backButton.addEventListener(
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


  /*
    Ship Review from summary.
  */

  const summaryReviewButton =
    document.getElementById(
      'summaryShipReviewBtn'
    );


  if (
    summaryReviewButton
  ){

    summaryReviewButton.addEventListener(
      'click',
      async () => {

        await openShipReview();

      }
    );

  }

}


/* =========================================================
   SHOW SUMMARY
========================================================= */

export function showSummary(){

  buildSummaryFromCurrentState();

  showScreen(
    'summary'
  );

}


/* =========================================================
   BUILD SUMMARY
========================================================= */

function buildSummaryFromCurrentState(){

  const meta =
    getMeta();


  const state =
    getState();


  const summaryTitle =
    document.getElementById(
      'sumTitle'
    );


  if (
    summaryTitle
  ){

    summaryTitle.textContent =
      meta.ship ||
      'Visit Summary';

  }


  const summaryMeta =
    document.getElementById(
      'sumMeta'
    );


  if (
    summaryMeta
  ){

    summaryMeta.textContent =
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


  /*
    Totals
  */

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
  )
  .forEach(
    item => {

      total++;


      if (
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


      comments +=
        Array.isArray(
          item.shipComments
        )
          ? item.shipComments.length
          : 0;


      photos +=
        Array.isArray(
          item.photos
        )
          ? item.photos.length
          : 0;


      if (
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


  if (
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


  /*
    Overall summary text.
  */

  const overall =
    document.getElementById(
      'overall'
    );


  if (
    overall &&
    !overall.value
  ){

    overall.value =
      `Ship visit report for ${meta.ship || ''}, ` +
      `${meta.dateOn || ''}` +
      (
        meta.dateOff
          ? ` to ${meta.dateOff}`
          : ''
      ) +
      `. Reviewed by ${
        meta.reviewer ||
        ''
      }. ` +
      `${checked} of ${total} points checked. ` +
      `${followUps} point(s) require ship follow-up.`;

  }


  /*
    Section summary
  */

  const sectionsContainer =
    document.getElementById(
      'sumSections'
    );


  if (
    !sectionsContainer
  ){

    return;

  }


  sectionsContainer.innerHTML =
    '';


  for (
    const section of
    getSections()
  ){

    const sectionItems =
      section.items.map(
        (text,index) => {

          const key =
            `${section.id}__${index}`;


          return {
            key,
            text,
            item:
              state[key]
          };

        }
      );


    const sectionChecked =
      sectionItems.filter(
        point =>
          point.item?.checked
      ).length;


    const sectionFollowUps =
      sectionItems.filter(
        point =>
          point.item?.followUpNeeded
      );


    const sectionPhotos =
      sectionItems.reduce(
        (
          result,
          point
        ) => {

          (
            point.item?.photos ||
            []
          )
          .forEach(
            photo => {

              result.push(
                photo
              );

            }
          );


          return result;

        },
        []
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
      >${
        escapeHtml(
          `${sectionChecked} of ${section.items.length} points checked.` +
          (
            sectionFollowUps.length
              ? ` ${sectionFollowUps.length} follow-up point(s) assigned to the ship.`
              : ''
          )
        )
      }</textarea>


      ${
        sectionPhotos.length
          ? `

            <div
              style="
                margin-top:9px;
                color:var(--vv-squid);
                font-size:10px;
                font-weight:800;
              "
            >
              ATTACHED PHOTOS
            </div>


            <div class="summary-photos">

              ${
                sectionPhotos
                  .map(
                    photo =>
                      `
                        <div class="summary-photo">

                          <img
                            src="${photo}"
                            alt="Report photo"
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


    sectionsContainer.appendChild(
      block
    );

  }

}


/* =========================================================
   GET SECTIONS
========================================================= */

function getSections(){

  /*
    This dynamic import avoids keeping
    data duplicated in this module.
  */

  /*
    We can't synchronously return from a
    dynamic import, so use the already-loaded
    global module when available.

    main.js gets this through the module cache.
  */

  if (
    window.__SHIP_VISIT_SECTIONS__
  ){

    return window.__SHIP_VISIT_SECTIONS__;

  }


  /*
    Fallback to the small local structure.
    This should be replaced by the
    shared data reference in data.js.
  */

  return [

    {
      id:'culinary',
      title:'CULINARY',
      items:[]
    },

    {
      id:'bar',
      title:'BAR',
      items:[]
    },

    {
      id:'restaurant',
      title:'RESTAURANT',
      items:[]
    },

    {
      id:'procurement',
      title:'PROCUREMENT',
      items:[]
    },

    {
      id:'sanitation',
      title:'SANITATION',
      items:[]
    }

  ];

}


/* =========================================================
   OPEN REPORTS
========================================================= */

document
  .getElementById(
    'openReport'
  )
  ?.addEventListener(
    'click',
    async () => {

      await renderOpenReports();

      showScreen(
        'open'
      );

    }
  );


/* =========================================================
   SUBMITTED REPORTS
========================================================= */

document
  .getElementById(
    'submittedReports'
  )
  ?.addEventListener(
    'click',
    async () => {

      await renderSubmittedReports();

      showScreen(
        'submitted'
      );

    }
  );


/* =========================================================
   REPORT CALLBACKS
========================================================= */

function bindReportCallbacks(){

  setReportCallbacks({

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


    viewSummary:
      async report => {

        loadedSubmittedReport =
          report;


        loadReport(
          report
        );


        /*
          The Overall report view is
          the summary-style submitted report.
        */

        renderReportOverall(
          report
        );


        showScreen(
          'summary'
        );

      },


    viewFollowUps:
      async report => {

        loadedSubmittedReport =
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
   FOLLOW-UP NAVIGATION
========================================================= */

function bindFollowUpNavigation(){

  const back =
    document.getElementById(
      'followupsHomeBtn'
    );


  if (
    back
  ){

    back.addEventListener(
      'click',
      () => {

        showScreen(
          'home'
        );

      }
    );

  }


  /*
    Generate follow-up PDF.
  */

  const followupPdf =
    document.getElementById(
      'followupPdfBtn'
    );


  if (
    followupPdf
  ){

    followupPdf.addEventListener(
      'click',
      () => {

        if (
          loadedSubmittedReport
        ){

          generateFollowUpPDF(
            loadedSubmittedReport
          );

        }

      }
    );

  }


  /*
    Print follow-up.
  */

  const followupPrint =
    document.getElementById(
      'followupPrintBtn'
    );


  if (
    followupPrint
  ){

    followupPrint.addEventListener(
      'click',
      () => {

        printReport();

      }
    );

  }

}


/* =========================================================
   SHIP RESPONSE REPORT
========================================================= */

function bindShipResponseNavigation(){

  const responseButton =
    document.getElementById(
      'shipResponseReport'
    );


  if (
    responseButton
  ){

    responseButton.addEventListener(
      'click',
      async () => {

        await renderAllShipResponses();

        showScreen(
          'responses'
        );

      }
    );

  }


  const homeButton =
    document.getElementById(
      'responsesHomeBtn'
    );


  if (
    homeButton
  ){

    homeButton.addEventListener(
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
   SHIP RESPONSE LIST
========================================================= */

async function renderAllShipResponses(){

  const container =
    document.getElementById(
      'responseList'
    );


  if (
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


  if (
    !result
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
    result.data ||
    [];


  const groups =
    [];


  reports.forEach(
    report => {

      const followUps =
        getFollowUpPoints(
          report
        );


      if (
        followUps.length
      ){

        groups.push({

          report,

          points:
            followUps

        });

      }

    }
  );


  if (
    !groups.length
  ){

    container.innerHTML =
      `
        <div class="empty">
          No points currently require ship follow-up.
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


  bindShipResponseSaveButtons();

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


  const completeCount =
    points.filter(
      point =>

        Array.isArray(
          point.shipComments
        ) &&

        point.shipComments.length > 0

    ).length;


  const complete =
    completeCount ===
    points.length;


  return `

    <div
      class="report-card ${
        complete
          ? 'green'
          : 'blue'
      }"
      data-response-report-card="${escapeHtml(
        report.id
      )}"
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
            complete
              ? 'green'
              : 'blue'
          }"
        >

          ${
            complete
              ? 'SHIP RESPONSE COMPLETE'
              : 'FOLLOW-UP OPEN'
          }

          — ${completeCount}/${points.length}

        </span>

      </div>


      ${
        points.map(
          point =>
            renderShipResponsePoint(
              report.id,
              point
            )
        ).join('')
      }


      <button
        type="button"
        class="btn-primary save-ship-response"
        data-save-ship-response="${escapeHtml(
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
    Array.isArray(
      point.shipComments
    )
      ? point.shipComments
      : [];


  return `

    <div
      class="response-point"
      data-response-point="${escapeHtml(
        point.key
      )}"
      style="
        padding:13px 0;
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
        point.comments &&
        point.comments.length
          ? `

            <div
              style="
                margin-top:9px;
              "
            >

              <div
                style="
                  color:var(--vv-squid);
                  font-size:9px;
                  font-weight:800;
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
        point.photos &&
        point.photos.length
          ? `

            <div
              style="
                margin-top:9px;
              "
            >

              <div
                style="
                  color:var(--vv-squid);
                  font-size:9px;
                  font-weight:800;
                "
              >
                REVIEWER PHOTOS
              </div>


              <div
                style="
                  display:flex;
                  flex-wrap:wrap;
                  gap:8px;
                  margin-top:6px;
                "
              >

                ${
                  point.photos
                    .map(
                      photo => `

                        <div
                          style="
                            width:100px;
                            height:100px;
                            overflow:hidden;
                            border:1px solid var(--vv-line);
                            border-radius:7px;
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
                margin-top:10px;
              "
            >

              <div
                style="
                  color:var(--status-green);
                  font-size:9px;
                  font-weight:800;
                "
              >
                SHIP COMMENTS
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
          margin-top:10px;
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
   SAVE SHIP RESPONSES
========================================================= */

function bindShipResponseSaveButtons(){

  document
    .querySelectorAll(
      '.save-ship-response'
    )
    .forEach(
      button => {

        button.onclick =
        async () => {

          const reportId =
            button.dataset.saveShipResponse;


          const result =
            await getReport(
              reportId
            );


          if (
            !result.success
          ){

            alert(
              'Could not load the report.'
            );

            return;

          }


          const report =
            result.data;


          const state =
            JSON.parse(
              JSON.stringify(
                report.report_data?.state ||
                {}
              )
            );


          const inputs =
            document.querySelectorAll(
              `[data-response-report="${reportId}"]`
            );


          inputs.forEach(
            input => {

              const key =
                input.dataset.responseKey;


              const text =
                input.value.trim();


              if (
                !text
              ){

                return;

              }


              if (
                !state[key]
              ){

                return;

              }


              if (
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

                  name:'Ship',

                  text,

                  timestamp:
                    new Date()
                      .toISOString()

                });


              /*
                Clear input after capturing it.
              */

              input.value =
                '';

            }
          );


          const save =
            await saveShipResponse({

              reportId,

              state

            });


          if (
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
              ? 'Ship response complete.'
              : 'Ship response saved.'
          );


          await renderAllShipResponses();

        };

      }
    );

}


/* =========================================================
   PDF
========================================================= */

function bindPDFEvents(){

  const pdfButton =
    document.getElementById(
      'pdfBtn'
    );


  if (
    pdfButton
  ){

    pdfButton.addEventListener(
      'click',
      () => {

        generatePDF();

      }
    );

  }


  /*
    Alternative button ID.
  */

  const savePdf =
    document.getElementById(
      'savePdfBtn'
    );


  if (
    savePdf
  ){

    savePdf.addEventListener(
      'click',
      () => {

        generatePDF();

      }
    );

  }

}


/* =========================================================
   PRINT
========================================================= */

function bindPrintEvents(){

  const printButton =
    document.getElementById(
      'printBtn'
    );


  if (
    printButton
  ){

    printButton.addEventListener(
      'click',
      () => {

        printReport();

      }
    );

  }

}


/* =========================================================
   HOME → OPEN REPORTS
========================================================= */

document
  .getElementById(
    'openReport'
  )
  ?.addEventListener(
    'click',
    async () => {

      await renderOpenReports();

      showScreen(
        'open'
      );

    }
  );


/* =========================================================
   HOME → SUBMITTED REPORTS
========================================================= */

document
  .getElementById(
    'submittedReports'
  )
  ?.addEventListener(
    'click',
    async () => {

      await renderSubmittedReports();

      showScreen(
        'submitted'
      );

    }
  );


/* =========================================================
   HOME → CREATE REPORT
========================================================= */

document
  .getElementById(
    'createReport'
  )
  ?.addEventListener(
    'click',
    () => {

      setupDefaultDate();

      showScreen(
        'setup'
      );

    }
  );


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

  let toast =
    document.getElementById(
      'main-toast'
    );


  if (
    !toast
  ){

    toast =
      document.createElement(
        'div'
      );


    toast.id =
      'main-toast';


    toast.className =
      'toast';


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
   BROWSER ERROR HANDLER
========================================================= */

window.addEventListener(
  'error',
  event => {

    console.error(
      'Application error:',
      event.error ||
      event.message
    );

  }
);


/* =========================================================
   UNHANDLED PROMISE HANDLER
========================================================= */

window.addEventListener(
  'unhandledrejection',
  event => {

    console.error(
      'Unhandled application promise:',
      event.reason
    );

  }
);
