/*
  ============================================================
  SHIP VISIT REPORT
  main.js
  ============================================================

  Main application controller.
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
   ADMIN
========================================================= */

const ADMIN_EMAILS = [

  'alebass80@gmail.com'

];


let adminMode =
  false;


/* =========================================================
   MAKE ADMIN STATUS AVAILABLE
========================================================= */

window.shipVisitIsAdmin =
  function(){

    return adminMode;

  };


/* =========================================================
   RESTORE ADMIN SESSION
========================================================= */

function restoreAdminMode(){

  adminMode =
    sessionStorage.getItem(
      'ship_visit_admin'
    ) === 'true';

}


/* =========================================================
   ENABLE ADMIN MODE
========================================================= */

function enableAdminMode(){

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
    ADMIN_EMAILS
      .map(
        item =>
          item.toLowerCase()
      )
      .includes(
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


  showToast(
    'Admin mode enabled.'
  );


  updateAdminButton();

}


/* =========================================================
   DISABLE ADMIN MODE
========================================================= */

function disableAdminMode(){

  adminMode =
    false;


  sessionStorage.removeItem(
    'ship_visit_admin'
  );


  updateAdminButton();

}


/* =========================================================
   ADMIN BUTTON
========================================================= */

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

  }else{

    button.textContent =
      'ADMIN';


    button.style.background =
      '';


    button.style.color =
      '';

  }

}


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
   CURRENT REPORT
========================================================= */

let currentSubmittedReport =
  null;


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


  bindReportCallbacks();


  bindReviewCallbacks();


  updateAdminButton();


  showScreen(
    'home'
  );

}


/* =========================================================
   ADMIN BUTTON
========================================================= */

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

          disableAdminMode();

        }

        return;

      }


      enableAdminMode();

    }
  );

}


/* =========================================================
   NAVIGATION
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
   HOME
========================================================= */

function bindHomeButtons(){

  /*
    CREATE
  */

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


  /*
    OPEN
  */

  bindClick(
    'openReport',
    async () => {

      showScreen(
        'open'
      );


      await loadOpenReports();

    }
  );


  /*
    SUBMITTED
  */

  bindClick(
    'submittedReports',
    async () => {

      showScreen(
        'submitted'
      );


      await loadSubmittedReports();

    }
  );


  /*
    SHIP RESPONSE
  */

  bindClick(
    'shipResponseReport',
    async () => {

      showScreen(
        'responses'
      );


      await loadShipResponses();

    }
  );


  /*
    HOME BUTTONS
  */

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
   GENERIC CLICK
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
   CREATE
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
   CLEAR CREATE FORM
========================================================= */

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


  startNewReport({

    ship,

    dateOn,

    dateOff,

    reviewer

  });


  updateChecklistHeader();

  renderChecklist();


  showScreen(
    'checklist'
  );


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
      'The report could not be saved to Supabase.\n\n' +
      (
        result?.error?.message ||
        'Check the Supabase table and policies.'
      )
    );


    return;

  }


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

  const id =
    getReportId();


  if(
    !id
  ){

    return false;

  }


  const result =
    await saveOpenReport({

      reportId:id,

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
      result?.error
    );


    return false;

  }


  return true;

}


/* =========================================================
   CHECKLIST
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
    Summary
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


      buildCurrentSummary();


      showScreen(
        'summary'
      );

    }
  );


  /*
    Ship Review
  */

  bindClick(
    'shipReviewBtn',
    openShipReview
  );

}


/* =========================================================
   SHIP REVIEW
========================================================= */

async function openShipReview(){

  const saved =
    await saveCurrentReport();


  if(
    !saved
  ){

    alert(
      'Could not save report before Ship Review.'
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
   REVIEW
========================================================= */

function bindReviewButtons(){

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
   SUMMARY
========================================================= */

function bindSummaryButtons(){

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


  bindClick(
    'summaryShipReviewBtn',
    openShipReview
  );

}


/* =========================================================
   BUILD OPEN REPORT SUMMARY
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
    Only checked points.
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
    Hidden PDF data.
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
    Legacy hidden summary data.
  */

  const hiddenSections =
    document.getElementById(
      'sumSections'
    );


  if(
    hiddenSections
  ){

    hiddenSections.innerHTML =
      '';

  }


  /*
    IMPORTANT:
    Visible Report Overall should show
    only checked findings.
  */

  const visible =
    document.getElementById(
      'report-overall-content'
    );


  if(
    visible
  ){

    if(
      departments.length === 0
    ){

      visible.innerHTML = `

        <div class="empty">

          No checklist points have been
          marked as checked yet.

        </div>

      `;

    }else{

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
                    margin-top:18px;
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
                      point =>
                        renderCurrentSummaryPoint(
                          point
                        )
                    )
                    .join('')
                }

              </div>

            `
          )
          .join('');

    }

  }

}


/* =========================================================
   CURRENT SUMMARY POINT
========================================================= */

function renderCurrentSummaryPoint(
  point
){

  const complete =
    point.followUpNeeded &&
    point.shipComments.length > 0;


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
            justify-content:center;
            align-items:center;
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

              <span
                class="status ${
                  complete
                    ? 'green'
                    : 'blue'
                }"
              >

                ${
                  complete
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
                      photo => `

                        <div
                          style="
                            width:105px;
                            height:105px;
                            overflow:hidden;
                            border:1px solid var(--vv-line);
                            border-radius:8px;
                          "
                        >

                          <img
                            src="${photo}"
                            alt="Finding photo"
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
        point.followUpNeeded
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
                  : `

                      <div
                        style="
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

                    `
              }

            </div>

          `
          : ''
      }

    </div>

  `;

}


/* =========================================================
   LOAD OPEN REPORTS
========================================================= */

async function loadOpenReports(){

  try{

    await renderOpenReports();

  }catch(error){

    console.error(
      error
    );

  }

}


/* =========================================================
   LOAD SUBMITTED REPORTS
========================================================= */

async function loadSubmittedReports(){

  try{

    await renderSubmittedReports();

  }catch(error){

    console.error(
      error
    );

  }

}


/* =========================================================
   SHIP RESPONSES
========================================================= */

async function loadShipResponses(){

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

      throw (
        result?.error ||
        new Error(
          'Could not load ship response reports.'
        )
      );

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


    bindShipResponseButtons();

  }catch(error){

    console.error(
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load ship response reports.

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
   RENDER SHIP RESPONSE GROUP
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
      style="
        padding:14px 0;
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
          font-size:14px;
          line-height:1.45;
          font-weight:600;
        "
      >

        ${escapeHtml(
          point.text
        )}

      </div>


      <span
        class="status blue"
      >

        FOLLOW-UP NEEDED FROM SHIP

      </span>


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
   SHIP RESPONSE BUTTON
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


  await loadShipResponses();

}


/* =========================================================
   PDF
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
          'No report selected.'
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
   CUSTOM PDF EVENT
========================================================= */

document.addEventListener(
  'shipVisitGeneratePDF',
  () => {

    generatePDF();

  }
);


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
   GLOBAL ERRORS
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
