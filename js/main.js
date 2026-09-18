/*
  ============================================================
  SHIP VISIT REPORT
  main.js
  ============================================================

  Main application controller.

  FLOW:

  HOME
    |
    +-- CREATE REPORT
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
    |      |
    |      +-- CONTINUE
    |             |
    |             v
    |          CHECKLIST
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
  getReportId,
  setReportId
} from './state.js';


import {
  saveOpenReport,
  getOpenReports,
  getSubmittedReports,
  getReport,
  saveShipResponse
} from './supabase.js';


import {
  renderChecklist,
  updateChecklistHeader
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

let currentSubmittedReport = null;


/* =========================================================
   SCREEN IDS
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

  /*
    Make the checklist data available globally.
    This also keeps compatibility with helper code
    in the other modules.
  */

  window.__SHIP_VISIT_SECTIONS__ =
    SECTIONS;


  setupDefaultDate();

  bindHomeButtons();

  bindCreateReport();

  bindChecklistButtons();

  bindReviewButtons();

  bindSummaryButtons();

  bindFollowUpButtons();

  bindPDFButtons();

  bindReportCallbacks();

  bindReviewCallbacks();

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
    !SCREENS.includes(screen)
  ){

    screen =
      'home';

  }


  SCREENS.forEach(
    id => {

      const element =
        document.getElementById(id);


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

        /*
          Override any stale display:none
          that may have been left by another
          version of the app.
        */

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
   HOME BUTTONS
========================================================= */

function bindHomeButtons(){

  /* -------------------------------------------------------
     CREATE REPORT
  ------------------------------------------------------- */

  bindClick(
    'createReport',
    () => {

      clearSetupFields();

      setupDefaultDate();

      showScreen(
        'setup'
      );

    }
  );


  /* -------------------------------------------------------
     OPEN REPORTS
  ------------------------------------------------------- */

  bindClick(
    'openReport',
    async () => {

      showScreen(
        'open'
      );


      await loadOpenReportsScreen();

    }
  );


  /* -------------------------------------------------------
     SUBMITTED REPORTS
  ------------------------------------------------------- */

  bindClick(
    'submittedReports',
    async () => {

      showScreen(
        'submitted'
      );


      await loadSubmittedReportsScreen();

    }
  );


  /* -------------------------------------------------------
     SHIP RESPONSE REPORT
  ------------------------------------------------------- */

  bindClick(
    'shipResponseReport',
    async () => {

      showScreen(
        'responses'
      );


      await loadShipResponseReports();

    }
  );


  /* -------------------------------------------------------
     BACK BUTTONS
  ------------------------------------------------------- */

  bindClick(
    'setupHome',
    () => showScreen('home')
  );


  bindClick(
    'openHomeBtn',
    () => showScreen('home')
  );


  bindClick(
    'reportsHomeBtn',
    () => showScreen('home')
  );


  bindClick(
    'responsesHomeBtn',
    () => showScreen('home')
  );


  bindClick(
    'summaryHomeBtn',
    () => showScreen('home')
  );


  bindClick(
    'followupsHomeBtn',
    () => showScreen('home')
  );

}


/* =========================================================
   UNIVERSAL CLICK HELPER
========================================================= */

function bindClick(
  id,
  handler
){

  const element =
    document.getElementById(id);


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
   CREATE REPORT
========================================================= */

function bindCreateReport(){

  bindClick(
    'startBtn',
    handleStartReport
  );

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
   CLEAR SETUP FIELDS
========================================================= */

function clearSetupFields(){

  const fields = [

    'ship',
    'dateOn',
    'dateOff',
    'reviewer'

  ];


  fields.forEach(
    id => {

      const element =
        document.getElementById(id);


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
   START NEW REPORT
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


  /*
    Required fields.
  */

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
    Create fresh local report state.
  */

  startNewReport({

    ship,

    dateOn,

    dateOff,

    reviewer

  });


  /*
    Render checklist first.
  */

  updateChecklistHeader();

  renderChecklist();


  showScreen(
    'checklist'
  );


  /*
    Immediately create the report
    in Supabase as OPEN.
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


  if(
    !result ||
    !result.success
  ){

    alert(
      'The report could not be saved to Supabase.\n\n' +
      (
        result?.error?.message ||
        'Please check your Supabase table and policies.'
      )
    );


    return;

  }


  /*
    Save the database ID into
    the current report state.
  */

  if(
    result.data?.id
  ){

    setReportId(
      result.data.id
    );

  }


  showToast(
    'Open report created.'
  );

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

    console.warn(
      'No active report ID.'
    );


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
    !result ||
    !result.success
  ){

    console.error(
      'Save current report failed:',
      result?.error
    );


    return false;

  }


  return true;

}


/* =========================================================
   CHECKLIST BUTTONS
========================================================= */

function bindChecklistButtons(){

  /*
    Reviewer name changes.
  */

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
    Report Summary.
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
          'The report could not be saved.'
        );

        return;

      }


      buildCurrentSummary();


      showScreen(
        'summary'
      );

    }
  );


  /*
    Ship Review.
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
   REVIEW BUTTONS
========================================================= */

function bindReviewButtons(){

  /*
    Back to checklist.
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
    Submit report.
  */

  bindClick(
    'reviewSubmitBtn',
    handleSubmitReport
  );

}


/* =========================================================
   REVIEW CALLBACK
========================================================= */

function bindReviewCallbacks(){

  setReviewCallbacks({

    submitted:
      async report => {

        currentSubmittedReport =
          report ||
          null;


        /*
          Clear the current active report.
        */

        resetReport();

        clearSetupFields();


        /*
          Return to HOME after successful
          submission.
        */

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
   SUBMIT REPORT
========================================================= */

async function handleSubmitReport(){

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


  const result =
    await submitCurrentReport();


  if(
    !result
  ){

    return;

  }

}


/* =========================================================
   SUMMARY BUTTONS
========================================================= */

function bindSummaryButtons(){

  /*
    Back to checklist.
  */

  bindClick(
    'backBtn',
    () => {

      updateChecklistHeader();

      renderChecklist();


      showScreen(
        'checklist'
      );

    }
  );


  /*
    Ship Review from Summary.
  */

  bindClick(
    'summaryShipReviewBtn',
    openShipReview
  );

}


/* =========================================================
   CURRENT OPEN REPORT SUMMARY
========================================================= */

function buildCurrentSummary(){

  const meta =
    getMeta();


  const state =
    getState();


  /*
    Header
  */

  const title =
    document.getElementById(
      'sumTitle'
    );


  if(
    title
  ){

    title.textContent =
      meta.ship ||
      'Report Summary';

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


  /*
    IMPORTANT:
    Summary only contains CHECKED points.
  */

  const departments = [];


  SECTIONS.forEach(
    section => {

      const points = [];


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


      /*
        Do not display an empty department.
      */

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
    Totals.
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


  /*
    Stats.
  */

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


  /*
    Overall text for PDF.
  */

  const overall =
    document.getElementById(
      'overall'
    );


  if(
    overall
  ){

    overall.value =
      `${meta.ship || ''} Ship Visit Report. ` +
      `${checked} checked finding(s) recorded. ` +
      `${
        followUps
          ? `${followUps} finding(s) require ship follow-up. `
          : ''
      }` +
      `${
        photos
          ? `${photos} photo(s) attached.`
          : ''
      }`;

  }


  /*
    Department summaries.
  */

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


  /*
    Nothing checked.
  */

  if(
    departments.length === 0
  ){

    container.innerHTML = `

      <div
        style="
          margin-top:20px;
          padding:18px;
          background:var(--vv-bg);
          border-radius:8px;
          color:var(--vv-gray);
          font-size:13px;
          text-align:center;
        "
      >

        No checklist points have been marked
        as checked yet.

      </div>

    `;


    return;

  }


  /*
    Departments.
  */

  departments.forEach(
    department => {

      const block =
        document.createElement(
          'div'
        );


      block.className =
        'summary-section';


      block.innerHTML = `

        <div
          style="
            margin-top:22px;
            margin-bottom:10px;
            padding-bottom:7px;
            border-bottom:2px solid var(--vv-red);
          "
        >

          <h2
            style="
              margin:0;
              color:var(--vv-squid);
            "
          >

            ${escapeHtml(
              department.section.title
            )}

          </h2>


          <div
            style="
              margin-top:3px;
              color:var(--vv-gray);
              font-size:10px;
              font-weight:700;
            "
          >

            ${department.points.length}

            CHECKED POINT${
              department.points.length === 1
                ? ''
                : 'S'
            }

          </div>

        </div>

      `;


      /*
        Individual findings.
      */

      department.points.forEach(
        (
          point
        ) => {

          const finding =
            document.createElement(
              'div'
            );


          finding.style.cssText = `

            margin-bottom:15px;

            padding:14px;

            background:#fff;

            border:1px solid var(--vv-line);

            border-left:
              4px solid var(--vv-squid);

            border-radius:8px;

          `;


          let html = `

            <div
              style="
                display:flex;
                align-items:flex-start;
                gap:9px;
              "
            >

              <div
                style="
                  flex:0 0 auto;
                  width:22px;
                  height:22px;
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
                  font-size:14px;
                  line-height:1.5;
                  font-weight:600;
                "
              >

                ${escapeHtml(
                  point.text
                )}

              </div>

            </div>

          `;


          /*
            Follow-up status.
          */

          if(
            point.followUpNeeded
          ){

            const completed =
              point.shipComments.length >
              0;


            html += `

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

            `;

          }


          /*
            Reviewer comments.
          */

          if(
            point.comments.length
          ){

            html += `

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
                  point.comments
                    .map(
                      comment => `

                        <div
                          style="
                            margin-bottom:5px;
                            padding:8px 10px;
                            background:var(--vv-bg);
                            border-radius:6px;
                            font-size:12px;
                            line-height:1.45;
                          "
                        >

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

            `;

          }


          /*
            Reviewer photos.
          */

          if(
            point.photos.length
          ){

            html += `

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
                        (
                          photo,
                          index
                        ) => `

                          <div
                            style="
                              width:105px;
                              height:105px;
                              overflow:hidden;
                              border:1px solid var(--vv-line);
                              border-radius:7px;
                              background:#fff;
                            "
                          >

                            <img
                              src="${photo}"
                              alt="Finding photo ${index + 1}"
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

            `;

          }


          /*
            Ship responses if this is a follow-up.
          */

          if(
            point.followUpNeeded
          ){

            html += `

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
                    letter-spacing:.04em;
                    margin-bottom:5px;
                  "
                >

                  SHIP COMMENTS / RESPONSES

                </div>


                ${
                  point.shipComments.length

                    ? point.shipComments
                        .map(
                          comment => `

                            <div
                              style="
                                margin-bottom:5px;
                                padding:8px 10px;
                                background:var(--status-green-bg);
                                border-left:3px solid var(--status-green);
                                border-radius:6px;
                                color:#285536;
                                font-size:12px;
                                line-height:1.45;
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

                    : `

                        <div
                          style="
                            padding:8px 10px;
                            background:#fff8f8;
                            border-left:3px solid var(--vv-red);
                            border-radius:6px;
                            color:var(--vv-red);
                            font-size:11.5px;
                          "
                        >

                          No ship response yet.

                        </div>

                      `
                }

              </div>

            `;

          }


          finding.innerHTML =
            html;


          block.appendChild(
            finding
          );

        }
      );


      container.appendChild(
        block
      );

    }
  );

}


/* =========================================================
   OPEN REPORT SCREEN
========================================================= */

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

      container.innerHTML = `

        <div class="empty">

          Could not load open reports.

          <br><br>

          ${escapeHtml(
            result?.error?.message ||
            'Supabase error'
          )}

        </div>

      `;


      return;

    }


    if(
      !result.data ||
      result.data.length === 0
    ){

      container.innerHTML = `

        <div class="empty">

          No open reports yet.

          <br><br>

          Create a new report to see it here.

        </div>

      `;


      return;

    }


    /*
      reports.js creates the actual cards
      and continue buttons.
    */

    await renderOpenReports();

  }catch(error){

    console.error(
      'Open reports:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Open Reports could not be loaded.

        <br><br>

        ${escapeHtml(
          error.message ||
          'Unknown error'
        )}

      </div>

    `;

  }

}


/* =========================================================
   SUBMITTED REPORT SCREEN
========================================================= */

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

      container.innerHTML = `

        <div class="empty">

          Could not load submitted reports.

          <br><br>

          ${escapeHtml(
            result?.error?.message ||
            'Supabase error'
          )}

        </div>

      `;


      return;

    }


    if(
      !result.data ||
      result.data.length === 0
    ){

      container.innerHTML = `

        <div class="empty">

          No submitted reports yet.

        </div>

      `;


      return;

    }


    await renderSubmittedReports();

  }catch(error){

    console.error(
      'Submitted reports:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Submitted Reports could not be loaded.

        <br><br>

        ${escapeHtml(
          error.message ||
          'Unknown error'
        )}

      </div>

    `;

  }

}


/* =========================================================
   REPORT CALLBACKS
========================================================= */

function bindReportCallbacks(){

  setReportCallbacks({

    /*
      CONTINUE OPEN REPORT
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


        showToast(
          'Open report loaded.'
        );

      },


    /*
      REPORT OVERALL
    */

    viewSummary:
      async report => {

        currentSubmittedReport =
          report;


        /*
          Do NOT reset submitted report state.
          We want it available for PDF/review.
        */

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
   FOLLOW-UP SCREEN
========================================================= */

function bindFollowUpButtons(){

  bindClick(
    'followupPdfBtn',
    () => {

      if(
        !currentSubmittedReport
      ){

        showToast(
          'No submitted report selected.'
        );


        return;

      }


      generateFollowUpPDF(
        currentSubmittedReport
      );

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
   SHIP RESPONSE REPORT
========================================================= */

async function loadShipResponseReports(){

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
      Loading ship response reports...
    </div>

  `;


  try{

    const result =
      await getSubmittedReports();


    if(
      !result ||
      !result.success
    ){

      container.innerHTML = `

        <div class="empty">

          Could not load ship response reports.

          <br><br>

          ${escapeHtml(
            result?.error?.message ||
            'Supabase error'
          )}

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


    bindShipResponseSave();

  }catch(error){

    console.error(
      'Ship response reports:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Ship Response Report could not be loaded.

        <br><br>

        ${escapeHtml(
          error.message ||
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


  const complete =
    completed ===
    points.length;


  return `

    <div
      class="report-card ${
        complete
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

  return `

    <div
      class="response-point"
    >

      <!-- DEPARTMENT -->

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


      <!-- FOLLOW-UP -->

      <span
        class="status blue"
      >

        FOLLOW-UP NEEDED FROM SHIP

      </span>


      <!-- REVIEWER COMMENTS -->

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


      <!-- REVIEWER PHOTOS -->

      ${
        point.photos.length
          ? `

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
                          src="${photo}"
                          alt="Reviewer photo"
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


      <!-- EXISTING SHIP COMMENTS -->

      ${
        point.shipComments.length
          ? `

            <div
              style="
                margin-top:11px;
              "
            >

              <div
                class="response-label"
                style="
                  color:var(--status-green);
                "
              >

                SHIP COMMENTS

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


      <!-- NEW SHIP COMMENT -->

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
   SAVE SHIP RESPONSE
========================================================= */

function bindShipResponseSave(){

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
              button.dataset.reportId
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
  reportId
){

  /*
    Get the newest version from Supabase.
  */

  const result =
    await getReport(
      reportId
    );


  if(
    !result ||
    !result.success ||
    !result.data
  ){

    alert(
      'Could not load the submitted report.'
    );


    return;

  }


  const state =
    JSON.parse(
      JSON.stringify(
        result.data
          ?.report_data
          ?.state ||
        {}
      )
    );


  /*
    Find all response fields belonging
    to this specific report.
  */

  const inputs =
    document.querySelectorAll(
      `[data-response-report="${reportId}"]`
    );


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


      input.value =
        '';

    }
  );


  /*
    Save the updated state back
    into the SAME submitted report.
  */

  const saved =
    await saveShipResponse({

      reportId,

      state

    });


  if(
    !saved ||
    !saved.success
  ){

    alert(
      'Could not save ship response.\n\n' +
      (
        saved?.error?.message ||
        'Unknown error'
      )
    );


    return;

  }


  showToast(
    saved.complete
      ? 'All ship follow-ups completed.'
      : 'Ship response saved.'
  );


  /*
    Refresh so BLUE can become GREEN.
  */

  await loadShipResponseReports();

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
   ERROR HANDLING
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
