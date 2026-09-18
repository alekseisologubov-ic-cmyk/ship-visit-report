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
    |      +-- CHECKLIST
    |              |
    |              +-- SHIP REVIEW
    |                      |
    |                      +-- SUBMIT
    |
    +-- OPEN REPORTS
    |      |
    |      +-- CONTINUE
    |              |
    |              +-- CHECKLIST
    |                      |
    |                      +-- SHIP REVIEW
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
   GLOBAL APPLICATION STATE
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
   START APPLICATION
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeApp() {

  /*
    Make checklist data available globally
    for any legacy/helper code that may need it.
  */

  window.__SHIP_VISIT_SECTIONS__ =
    SECTIONS;


  setupDefaultDate();

  bindHomeButtons();

  bindCreateReport();

  bindChecklist();

  bindReview();

  bindSummary();

  bindOpenReports();

  bindSubmittedReports();

  bindFollowUps();

  bindShipResponseReport();

  bindReportCallbacks();

  bindReviewCallbacks();

  bindPdfAndPrint();

  showScreen(
    'home'
  );

}


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

export function showScreen(
  screen
) {

  if (
    !SCREENS.includes(
      screen
    )
  ) {

    screen =
      'home';

  }


  SCREENS.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if (
        element
      ) {

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
   TOAST
========================================================= */

function showToast(
  message
) {

  if (
    typeof window.showToast ===
    'function'
  ) {

    window.showToast(
      message
    );

    return;

  }


  let toast =
    document.getElementById(
      'main-toast'
    );


  if (
    !toast
  ) {

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
      color:#FFFFFF;
      font-family:Arial,sans-serif;
      font-size:12px;
      box-shadow:0 4px 14px rgba(0,0,0,.25);
      display:none;
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
   HOME BUTTONS
========================================================= */

function bindHomeButtons() {

  /*
    CREATE REPORT
  */

  const create =
    document.getElementById(
      'createReport'
    );


  if (
    create
  ) {

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


  /*
    OPEN REPORTS
  */

  const open =
    document.getElementById(
      'openReport'
    );


  if (
    open
  ) {

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


  /*
    SUBMITTED REPORTS
  */

  const submitted =
    document.getElementById(
      'submittedReports'
    );


  if (
    submitted
  ) {

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


  /*
    SHIP RESPONSE REPORT
  */

  const shipResponse =
    document.getElementById(
      'shipResponseReport'
    );


  if (
    shipResponse
  ) {

    shipResponse.addEventListener(
      'click',
      async () => {

        await renderShipResponseReports();

        showScreen(
          'responses'
        );

      }
    );

  }


  /*
    BACK TO HOME BUTTONS
  */

  bindSimpleHomeButton(
    'setupHome'
  );


  bindSimpleHomeButton(
    'openHomeBtn'
  );


  bindSimpleHomeButton(
    'reportsHomeBtn'
  );


  bindSimpleHomeButton(
    'responsesHomeBtn'
  );


  bindSimpleHomeButton(
    'summaryHomeBtn'
  );


  bindSimpleHomeButton(
    'followupsHomeBtn'
  );

}


function bindSimpleHomeButton(
  id
) {

  const button =
    document.getElementById(
      id
    );


  if (
    button
  ) {

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

function bindCreateReport() {

  const start =
    document.getElementById(
      'startBtn'
    );


  if (
    start
  ) {

    start.addEventListener(
      'click',
      handleStartReport
    );

  }

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setupDefaultDate() {

  const input =
    document.getElementById(
      'dateOn'
    );


  if (
    input &&
    !input.value
  ) {

    const today =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );


    input.value =
      today;

  }

}


/* =========================================================
   CLEAR SETUP FIELDS
========================================================= */

function clearSetupFields() {

  const fields = [

    'ship',
    'dateOn',
    'dateOff',
    'reviewer'

  ];


  fields.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if (
        element
      ) {

        element.value =
          '';

      }

    }
  );

}


/* =========================================================
   START NEW REPORT
========================================================= */

async function handleStartReport() {

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
    Required fields
  */

  if (
    !ship
  ) {

    alert(
      'Please enter the ship.'
    );

    return;

  }


  if (
    !reviewer
  ) {

    alert(
      'Please enter the reviewer.'
    );

    return;

  }


  /*
    Create local report state.
  */

  startNewReport({

    ship,

    dateOn,

    dateOff,

    reviewer

  });


  /*
    Display checklist immediately.
  */

  updateChecklistHeader();

  renderChecklist();

  showScreen(
    'checklist'
  );


  /*
    Immediately create the OPEN
    report in Supabase.
  */

  const result =
    await saveOpenReport({

      reportId:null,

      meta:
        getMeta(),

      state:
        getState()

    });


  if (
    !result ||
    !result.success
  ) {

    alert(
      'The report could not be saved to Supabase.\n\n' +
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

  if (
    result.data?.id
  ) {

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

async function saveCurrentReport() {

  const reportId =
    getReportId();


  if (
    !reportId
  ) {

    console.warn(
      'No current report ID.'
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


  if (
    !result ||
    !result.success
  ) {

    console.error(
      'Could not save current report:',
      result?.error
    );


    return false;

  }


  return true;

}


/* =========================================================
   CHECKLIST EVENTS
========================================================= */

function bindChecklist() {

  /*
    Reviewer field
  */

  const reviewer =
    document.getElementById(
      'hdrReviewer'
    );


  if (
    reviewer
  ) {

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
    Generate Summary
  */

  const summary =
    document.getElementById(
      'summaryBtn'
    );


  if (
    summary
  ) {

    summary.addEventListener(
      'click',
      async () => {

        const saved =
          await saveCurrentReport();


        if (
          !saved
        ) {

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

  }


  /*
    Ship Review
  */

  const shipReview =
    document.getElementById(
      'shipReviewBtn'
    );


  if (
    shipReview
  ) {

    shipReview.addEventListener(
      'click',
      openShipReview
    );

  }

}


/* =========================================================
   OPEN SHIP REVIEW
========================================================= */

async function openShipReview() {

  const saved =
    await saveCurrentReport();


  if (
    !saved
  ) {

    alert(
      'The report could not be saved before Ship Review.'
    );

    return;

  }


  const prepared =
    await prepareShipReview();


  if (
    !prepared
  ) {

    return;

  }


  showScreen(
    'review'
  );

}


/* =========================================================
   REVIEW EVENTS
========================================================= */

function bindReview() {

  /*
    Back to checklist
  */

  const back =
    document.getElementById(
      'reviewBackBtn'
    );


  if (
    back
  ) {

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


  /*
    Submit
  */

  const submit =
    document.getElementById(
      'reviewSubmitBtn'
    );


  if (
    submit
  ) {

    submit.addEventListener(
      'click',
      handleSubmitReport
    );

  }

}


/* =========================================================
   REVIEW CALLBACKS
========================================================= */

function bindReviewCallbacks() {

  setReviewCallbacks({

    submitted:
      async report => {

        currentSubmittedReport =
          report ||
          null;


        /*
          Clear current active report.
        */

        resetReport();

        clearSetupFields();


        /*
          Return to main screen
          after successful submission.
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

async function handleSubmitReport() {

  const confirmed =
    window.confirm(
      'Submit this Ship Visit Report?\n\n' +
      'The report will move from Open Reports to Submitted Reports.'
    );


  if (
    !confirmed
  ) {

    return;

  }


  const result =
    await submitCurrentReport();


  if (
    !result
  ) {

    return;

  }

}


/* =========================================================
   SUMMARY EVENTS
========================================================= */

function bindSummary() {

  /*
    Back to checklist
  */

  const back =
    document.getElementById(
      'backBtn'
    );


  if (
    back
  ) {

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


  /*
    Ship Review from Summary
  */

  const review =
    document.getElementById(
      'summaryShipReviewBtn'
    );


  if (
    review
  ) {

    review.addEventListener(
      'click',
      openShipReview
    );

  }

}


/* =========================================================
   BUILD CURRENT OPEN REPORT SUMMARY
========================================================= */

function buildCurrentSummary() {

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


  if (
    title
  ) {

    title.textContent =
      meta.ship ||
      'Report Overall';

  }


  const metaElement =
    document.getElementById(
      'sumMeta'
    );


  if (
    metaElement
  ) {

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


  /*
    Totals
  */

  let total =
    0;

  let checked =
    0;

  let reviewerComments =
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
        item?.checked
      ) {

        checked++;

      }


      if (
        Array.isArray(
          item?.comments
        )
      ) {

        reviewerComments +=
          item.comments.length;

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
        item?.followUpNeeded
      ) {

        followUps++;

      }

    }
  );


  /*
    Stats
  */

  const stats =
    document.getElementById(
      'stats'
    );


  if (
    stats
  ) {

    stats.innerHTML = `

      <div class="stat">

        <div class="stat-number">
          ${checked}/${total}
        </div>

        <div class="stat-label">
          POINTS CHECKED
        </div>

      </div>


      <div class="stat">

        <div class="stat-number">
          ${reviewerComments}
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
    Overall text.
  */

  const overall =
    document.getElementById(
      'overall'
    );


  if (
    overall
  ) {

    overall.value =
      `Ship visit report for ${meta.ship || ''}. ` +
      `Reviewed by ${meta.reviewer || ''}. ` +
      `${checked} of ${total} checklist points checked. ` +
      `${followUps} point(s) marked for ship follow-up.`;

  }


  /*
    Section summaries.
  */

  const sectionContainer =
    document.getElementById(
      'sumSections'
    );


  if (
    !sectionContainer
  ) {

    return;

  }


  sectionContainer.innerHTML =
    '';


  SECTIONS.forEach(
    section => {

      let sectionChecked =
        0;

      let sectionFollowUps =
        0;

      const sectionPhotos =
        [];


      section.items.forEach(
        (_,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if (
            item?.checked
          ) {

            sectionChecked++;

          }


          if (
            item?.followUpNeeded
          ) {

            sectionFollowUps++;

          }


          (
            item?.photos ||
            []
          )
          .forEach(
            photo => {

              sectionPhotos.push(
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


              <div
                class="summary-photos"
              >

                ${
                  sectionPhotos
                    .map(
                      photo => `

                        <div
                          class="summary-photo"
                        >

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


      sectionContainer.appendChild(
        block
      );

    }
  );

}


/* =========================================================
   OPEN REPORTS
========================================================= */

function bindOpenReports() {

  /*
    Nothing extra is required here.
    reports.js creates the report buttons.
  */

}


/* =========================================================
   SUBMITTED REPORTS
========================================================= */

function bindSubmittedReports() {

  /*
    reports.js creates:

      Report Overall
      Points To Follow Up
      Save PDF
      Print

    buttons.
  */

}


/* =========================================================
   REPORT CALLBACKS
========================================================= */

function bindReportCallbacks() {

  setReportCallbacks({

    /*
      Continue Open Report
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
   FOLLOW-UP NAVIGATION
========================================================= */

function bindFollowUps() {

  const home =
    document.getElementById(
      'followupsHomeBtn'
    );


  if (
    home
  ) {

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


  if (
    pdf
  ) {

    pdf.addEventListener(
      'click',
      () => {

        if (
          currentSubmittedReport
        ) {

          generateFollowUpPDF(
            currentSubmittedReport
          );

        } else {

          showToast(
            'No report selected.'
          );

        }

      }
    );

  }


  const print =
    document.getElementById(
      'followupPrintBtn'
    );


  if (
    print
  ) {

    print.addEventListener(
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

function bindShipResponseReport() {

  const home =
    document.getElementById(
      'responsesHomeBtn'
    );


  if (
    home
  ) {

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

async function renderShipResponseReports() {

  const container =
    document.getElementById(
      'responseList'
    );


  if (
    !container
  ) {

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
    !result ||
    !result.success
  ) {

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


      if (
        points.length
      ) {

        groups.push({

          report,

          points

        });

      }

    }
  );


  if (
    !groups.length
  ) {

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


  bindShipResponseSave();

}


/* =========================================================
   EXTRACT FOLLOW-UP POINTS
========================================================= */

function extractFollowUpPoints(
  report
) {

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


          if (
            item &&
            item.followUpNeeded
          ) {

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
   RENDER SHIP RESPONSE GROUP
========================================================= */

function renderShipResponseGroup(
  group
) {

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
   RENDER SHIP RESPONSE POINT
========================================================= */

function renderShipResponsePoint(
  reportId,
  point
) {

  return `

    <div
      class="response-point"
      style="
        padding:14px 0;
        border-top:1px solid var(--vv-line);
      "
    >

      <!-- DEPARTMENT -->

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


      <!-- CHECKLIST POINT -->

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


      <!-- FOLLOW-UP STATUS -->

      <div
        class="status blue"
        style="
          margin-top:7px;
        "
      >

        FOLLOW-UP NEEDED FROM SHIP

      </div>


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


      <!-- REVIEWER PHOTOS -->

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
                style="
                  color:var(--status-green);
                  font-size:9px;
                  font-weight:800;
                  margin-bottom:5px;
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

function bindShipResponseSave() {

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
) {

  /*
    Get latest database version.
  */

  const result =
    await getReport(
      reportId
    );


  if (
    !result ||
    !result.success ||
    !result.data
  ) {

    alert(
      'Could not load the submitted report.'
    );

    return;

  }


  const report =
    result.data;


  /*
    Clone current state.
  */

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
    Find all new ship comments
    for this report.
  */

  const inputs =
    document.querySelectorAll(
      `[data-response-report="${reportId}"]`
    );


  inputs.forEach(
    input => {

      const text =
        input.value.trim();


      if (
        !text
      ) {

        return;

      }


      const key =
        input.dataset.responseKey;


      if (
        !state[key]
      ) {

        return;

      }


      if (
        !Array.isArray(
          state[key]
            .shipComments
        )
      ) {

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
    Save into same submitted report.
  */

  const save =
    await saveShipResponse({

      reportId,

      state

    });


  if (
    !save ||
    !save.success
  ) {

    alert(
      'Could not save ship responses.\n\n' +
      (
        save?.error?.message ||
        'Unknown error'
      )
    );

    return;

  }


  /*
    Refresh the screen.

    BLUE:
      follow-up still open

    GREEN:
      all follow-ups answered
  */

  showToast(
    save.complete
      ? 'All ship follow-ups completed.'
      : 'Ship response saved.'
  );


  await renderShipResponseReports();

}


/* =========================================================
   PDF AND PRINT
========================================================= */

function bindPdfAndPrint() {

  /*
    Current report PDF
  */

  const pdf =
    document.getElementById(
      'pdfBtn'
    );


  if (
    pdf
  ) {

    pdf.addEventListener(
      'click',
      () => {

        generatePDF();

      }
    );

  }


  /*
    Current report print
  */

  const print =
    document.getElementById(
      'printBtn'
    );


  if (
    print
  ) {

    print.addEventListener(
      'click',
      () => {

        printReport();

      }
    );

  }

}


/* =========================================================
   REPORT UPDATE EVENT
========================================================= */

document.addEventListener(
  'shipVisitGeneratePDF',
  () => {

    generatePDF();

  }
);


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


/* =========================================================
   HELPER
========================================================= */

function escapeHtml(
  value
) {

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
