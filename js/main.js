/*
  ============================================================
  SHIP VISIT REPORT
  main.js
  ============================================================
*/

import { SECTIONS } from './data.js';

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
   GLOBAL STATE
========================================================= */

let currentSubmittedReport = null;


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

function initializeApp() {

  window.__SHIP_VISIT_SECTIONS__ =
    SECTIONS;

  setupDefaultDate();

  bindHomeButtons();

  bindCreateReport();

  bindChecklist();

  bindReview();

  bindSummary();

  bindReportCallbacks();

  bindReviewCallbacks();

  bindFollowUps();

  bindPDFButtons();

  bindBackButtons();

  showScreen('home');

}


/* =========================================================
   SHOW SCREEN
========================================================= */

function showScreen(
  screen
) {

  SCREENS.forEach(
    id => {

      const element =
        document.getElementById(id);

      if (!element) {
        return;
      }

      if (id === screen) {
        element.classList.remove('hidden');
        element.style.display = '';
      } else {
        element.classList.add('hidden');
        element.style.display = 'none';
      }

    }
  );

  window.scrollTo(0, 0);

}


/* =========================================================
   HOME
========================================================= */

function bindHomeButtons() {

  const createButton =
    document.getElementById(
      'createReport'
    );

  if (createButton) {

    createButton.onclick =
      () => {

        clearSetupFields();

        setupDefaultDate();

        showScreen('setup');

      };

  }


  const openButton =
    document.getElementById(
      'openReport'
    );

  if (openButton) {

    openButton.onclick =
      async () => {

        showScreen('open');

        await loadOpenReportsScreen();

      };

  }


  const submittedButton =
    document.getElementById(
      'submittedReports'
    );

  if (submittedButton) {

    submittedButton.onclick =
      async () => {

        showScreen('submitted');

        await loadSubmittedReportsScreen();

      };

  }


  const responseButton =
    document.getElementById(
      'shipResponseReport'
    );

  if (responseButton) {

    responseButton.onclick =
      async () => {

        showScreen('responses');

        await loadShipResponseScreen();

      };

  }

}


/* =========================================================
   SETUP
========================================================= */

function bindCreateReport() {

  const start =
    document.getElementById(
      'startBtn'
    );

  if (start) {

    start.onclick =
      handleStartReport;

  }

}


function setupDefaultDate() {

  const input =
    document.getElementById(
      'dateOn'
    );

  if (
    input &&
    !input.value
  ) {

    input.value =
      new Date()
        .toISOString()
        .slice(0, 10);

  }

}


function clearSetupFields() {

  [
    'ship',
    'dateOn',
    'dateOff',
    'reviewer'
  ].forEach(
    id => {

      const element =
        document.getElementById(id);

      if (element) {
        element.value = '';
      }

    }
  );

}


async function handleStartReport() {

  const ship =
    document
      .getElementById('ship')
      ?.value
      .trim();

  const dateOn =
    document
      .getElementById('dateOn')
      ?.value || '';

  const dateOff =
    document
      .getElementById('dateOff')
      ?.value || '';

  const reviewer =
    document
      .getElementById('reviewer')
      ?.value
      .trim();


  if (!ship) {

    alert(
      'Please enter the ship.'
    );

    return;

  }


  if (!reviewer) {

    alert(
      'Please enter the reviewer.'
    );

    return;

  }


  startNewReport({

    ship,
    dateOn,
    dateOff,
    reviewer

  });


  updateChecklistHeader();

  renderChecklist();

  showScreen('checklist');


  const result =
    await saveOpenReport({

      reportId: null,

      meta: getMeta(),

      state: getState()

    });


  if (
    !result ||
    !result.success
  ) {

    alert(
      'The report could not be saved.\n\n' +
      (
        result?.error?.message ||
        'Check the Supabase table and policies.'
      )
    );

    return;

  }


  if (result.data?.id) {

    setReportId(
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

function bindChecklist() {

  const reviewer =
    document.getElementById(
      'hdrReviewer'
    );

  if (reviewer) {

    reviewer.onchange =
      async event => {

        setReviewer(
          event.target.value
        );

        await saveCurrentReport();

      };

  }


  const summary =
    document.getElementById(
      'summaryBtn'
    );

  if (summary) {

    summary.onclick =
      async () => {

        const saved =
          await saveCurrentReport();

        if (!saved) {

          alert(
            'Could not save the report.'
          );

          return;

        }

        buildCurrentSummary();

        showScreen('summary');

      };

  }


  const review =
    document.getElementById(
      'shipReviewBtn'
    );

  if (review) {

    review.onclick =
      openShipReview;

  }

}


async function saveCurrentReport() {

  const id =
    getReportId();

  if (!id) {

    return false;

  }

  const result =
    await saveOpenReport({

      reportId: id,

      meta: getMeta(),

      state: getState()

    });


  return Boolean(
    result?.success
  );

}


/* =========================================================
   SHIP REVIEW
========================================================= */

function bindReview() {

  const back =
    document.getElementById(
      'reviewBackBtn'
    );

  if (back) {

    back.onclick =
      () => {

        updateChecklistHeader();

        renderChecklist();

        showScreen('checklist');

      };

  }


  const submit =
    document.getElementById(
      'reviewSubmitBtn'
    );

  if (submit) {

    submit.onclick =
      async () => {

        const ok =
          window.confirm(
            'Submit this Ship Visit Report?\n\n' +
            'The report will move to Submitted Reports.'
          );

        if (!ok) {
          return;
        }

        const result =
          await submitCurrentReport();

        if (!result) {
          return;
        }

      };

  }

}


async function openShipReview() {

  const saved =
    await saveCurrentReport();

  if (!saved) {

    alert(
      'Could not save the report before Ship Review.'
    );

    return;

  }


  const prepared =
    await prepareShipReview();

  if (!prepared) {
    return;
  }


  showScreen('review');

}


/* =========================================================
   REVIEW CALLBACK
========================================================= */

function bindReviewCallbacks() {

  setReviewCallbacks({

    submitted:
      async report => {

        currentSubmittedReport =
          report || null;

        resetReport();

        clearSetupFields();

        showScreen('home');

        showToast(
          'Report submitted successfully.'
        );

      }

  });

}


/* =========================================================
   REPORT CALLBACKS
========================================================= */

function bindReportCallbacks() {

  setReportCallbacks({

    openReport:
      async report => {

        loadReport(report);

        updateChecklistHeader();

        renderChecklist();

        showScreen('checklist');

      },


    viewSummary:
      async report => {

        currentSubmittedReport =
          report;

        loadReport(report);

        renderReportOverall(report);

        showScreen('summary');

      },


    viewFollowUps:
      async report => {

        currentSubmittedReport =
          report;

        renderReportFollowUps(report);

        showScreen('followups');

      },


    showHome:
      () => {

        showScreen('home');

      }

  });

}


/* =========================================================
   OPEN REPORTS
========================================================= */

async function loadOpenReportsScreen() {

  const container =
    document.getElementById(
      'openList'
    );

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="empty">
      Loading open reports...
    </div>
  `;


  try {

    const result =
      await getOpenReports();


    if (!result.success) {

      container.innerHTML = `
        <div class="empty">
          Could not load open reports.
          <br><br>
          ${escapeHtml(
            result.error?.message ||
            'Supabase error'
          )}
        </div>
      `;

      return;

    }


    if (
      !result.data ||
      result.data.length === 0
    ) {

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
      reports.js also has its own renderer.
      Use it after successfully confirming
      the database response.
    */

    await renderOpenReports();

  } catch (error) {

    console.error(
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
   SUBMITTED REPORTS
========================================================= */

async function loadSubmittedReportsScreen() {

  const container =
    document.getElementById(
      'reportList'
    );

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="empty">
      Loading submitted reports...
    </div>
  `;


  try {

    const result =
      await getSubmittedReports();


    if (!result.success) {

      container.innerHTML = `
        <div class="empty">
          Could not load submitted reports.
          <br><br>
          ${escapeHtml(
            result.error?.message ||
            'Supabase error'
          )}
        </div>
      `;

      return;

    }


    if (
      !result.data ||
      result.data.length === 0
    ) {

      container.innerHTML = `
        <div class="empty">
          No submitted reports yet.
        </div>
      `;

      return;

    }


    await renderSubmittedReports();

  } catch (error) {

    console.error(
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
   SHIP RESPONSE REPORT
========================================================= */

async function loadShipResponseScreen() {

  const container =
    document.getElementById(
      'responseList'
    );

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="empty">
      Loading ship response reports...
    </div>
  `;


  try {

    const result =
      await getSubmittedReports();


    if (!result.success) {

      container.innerHTML = `
        <div class="empty">
          Could not load ship response reports.
          <br><br>
          ${escapeHtml(
            result.error?.message ||
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


                if (
                  item &&
                  item.followUpNeeded
                ) {

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


        if (points.length) {

          groups.push({

            report,

            points

          });

        }

      }
    );


    if (!groups.length) {

      container.innerHTML = `
        <div class="empty">
          No points currently require ship follow-up.
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


    bindShipResponseSaveButtons();

  } catch (error) {

    console.error(
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
) {

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
    completed === points.length;


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
) {

  return `

    <div
      class="response-point"
    >

      <div
        class="response-section"
      >
        ${escapeHtml(
          point.section
        )}
      </div>


      <div
        class="response-text"
      >
        ${escapeHtml(
          point.text
        )}
      </div>


      <span class="status blue">
        FOLLOW-UP NEEDED FROM SHIP
      </span>


      ${
        point.comments.length
          ? `

            <div
              class="response-comment"
            >

              <strong>
                REVIEWER COMMENTS
              </strong>


              ${
                point.comments
                  .map(
                    comment => `

                      <div
                        class="comment"
                        style="margin-top:5px;"
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


      ${
        point.shipComments.length
          ? `

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
   SAVE SHIP RESPONSE
========================================================= */

function bindShipResponseSaveButtons() {

  document
    .querySelectorAll(
      '.save-ship-response'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            await saveShipResponseGroup(
              button.dataset.reportId
            );

          };

      }
    );

}


async function saveShipResponseGroup(
  reportId
) {

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
      'Could not load submitted report.'
    );

    return;

  }


  const state =
    JSON.parse(
      JSON.stringify(
        result.data
          .report_data
          ?.state ||
        {}
      )
    );


  document
    .querySelectorAll(
      `[data-response-report="${reportId}"]`
    )
    .forEach(
      input => {

        const text =
          input.value.trim();


        if (!text) {
          return;
        }


        const key =
          input.dataset.responseKey;


        if (!state[key]) {
          return;
        }


        if (
          !Array.isArray(
            state[key].shipComments
          )
        ) {

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


        input.value =
          '';

      }
    );


  const saved =
    await saveShipResponse({

      reportId,

      state

    });


  if (
    !saved.success
  ) {

    alert(
      'Could not save ship response.\n\n' +
      (
        saved.error?.message ||
        'Unknown error'
      )
    );

    return;

  }


  showToast(
    saved.complete
      ? 'All follow-ups completed.'
      : 'Ship response saved.'
  );


  await loadShipResponseScreen();

}


/* =========================================================
   SUMMARY
========================================================= */

function bindSummary() {

  const back =
    document.getElementById(
      'backBtn'
    );


  if (
    back
  ) {

    back.onclick =
      () => {

        updateChecklistHeader();

        renderChecklist();

        showScreen(
          'checklist'
        );

      };

  }


  const review =
    document.getElementById(
      'summaryShipReviewBtn'
    );


  if (
    review
  ) {

    review.onclick =
      openShipReview;

  }

}


/* =========================================================
   BACK BUTTONS
========================================================= */

function bindBackButtons() {

  [
    'setupHome',
    'openHomeBtn',
    'reportsHomeBtn',
    'responsesHomeBtn',
    'summaryHomeBtn',
    'followupsHomeBtn'
  ]
  .forEach(
    id => {

      const button =
        document.getElementById(
          id
        );


      if (
        button
      ) {

        button.onclick =
          () => {

            showScreen(
              'home'
            );

          };

      }

    }
  );

}


/* =========================================================
   PDF
========================================================= */

function bindPDFButtons() {

  const pdf =
    document.getElementById(
      'pdfBtn'
    );


  if (
    pdf
  ) {

    pdf.onclick =
      () => {

        generatePDF();

      };

  }


  const print =
    document.getElementById(
      'printBtn'
    );


  if (
    print
  ) {

    print.onclick =
      () => {

        printReport();

      };

  }


  const followupPdf =
    document.getElementById(
      'followupPdfBtn'
    );


  if (
    followupPdf
  ) {

    followupPdf.onclick =
      () => {

        if (
          currentSubmittedReport
        ) {

          generateFollowUpPDF(
            currentSubmittedReport
          );

        }

      };

  }


  const followupPrint =
    document.getElementById(
      'followupPrintBtn'
    );


  if (
    followupPrint
  ) {

    followupPrint.onclick =
      () => {

        printReport();

      };

  }

}


/* =========================================================
   HTML ESCAPE
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

      padding:10px 15px;

      background:#1B1B1B;

      color:#fff;

      border-radius:8px;

      font-size:12px;

      box-shadow:
        0 4px 14px rgba(0,0,0,.25);

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
   GLOBAL ERROR LOG
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
