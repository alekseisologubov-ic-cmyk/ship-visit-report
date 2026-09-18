/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  main.js
  ============================================================
*/


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
   NAVIGATION MEMORY
========================================================= */

let checklistReturnScreen = 'setup';

let summaryReturnScreen = 'checklist';


/* =========================================================
   CURRENT REPORT
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
   ADMIN ACCESS
========================================================= */

window.shipVisitIsAdmin = function(){

  return adminMode;

};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


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

  showScreen('home');

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


  if(!button){

    return;

  }


  button.addEventListener(
    'click',
    () => {

      if(adminMode){

        const disable =
          window.confirm(
            'Disable Admin Mode?'
          );


        if(disable){

          adminMode = false;

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


      if(!email){

        return;

      }


      const allowed =
        ADMIN_EMAILS.includes(
          email
            .trim()
            .toLowerCase()
        );


      if(!allowed){

        alert(
          'Administrator access denied.'
        );

        return;

      }


      adminMode = true;


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


  if(!button){

    return;

  }


  if(adminMode){

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
   NAVIGATION
========================================================= */

export function showScreen(
  screen
){

  if(
    !SCREENS.includes(screen)
  ){

    screen = 'home';

  }


  SCREENS.forEach(
    id => {

      const element =
        document.getElementById(id);


      if(!element){

        return;

      }


      if(id === screen){

        element.classList.remove(
          'hidden'
        );

        element.style.display = '';

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
   GENERIC CLICK
========================================================= */

function bindClick(
  id,
  handler
){

  const element =
    document.getElementById(id);


  if(!element){

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


  bindClick(
    'openReport',
    async () => {

      showScreen(
        'open'
      );

      await loadOpenReports();

    }
  );


  bindClick(
    'submittedReports',
    async () => {

      showScreen(
        'submitted'
      );

      await loadSubmittedReports();

    }
  );


  bindClick(
    'shipResponseReport',
    async () => {

      showScreen(
        'responses'
      );

      await loadShipResponseReports();

    }
  );


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
    'followupsHomeBtn',
    () => showScreen('home')
  );

}


/* =========================================================
   HEADER BACK
========================================================= */

function bindHeaderBackButtons(){

  bindClick(
    'setupHeaderBack',
    () => {

      showScreen('home');

    }
  );


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


      updateChecklistHeader();

      renderChecklist();

      showScreen(
        'checklist'
      );

    }
  );


  bindClick(
    'followupsHeaderBack',
    async () => {

      showScreen(
        'submitted'
      );

      await loadSubmittedReports();

    }
  );


  bindClick(
    'openHeaderBack',
    () => showScreen('home')
  );


  bindClick(
    'submittedHeaderBack',
    () => showScreen('home')
  );


  bindClick(
    'responsesHeaderBack',
    () => showScreen('home')
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
        .slice(0,10);

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
        document.getElementById(id);


      if(element){

        element.value = '';

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
      .getElementById('ship')
      ?.value
      .trim();


  const dateOn =
    document
      .getElementById('dateOn')
      ?.value ||
    '';


  const dateOff =
    document
      .getElementById('dateOff')
      ?.value ||
    '';


  const reviewer =
    document
      .getElementById('reviewer')
      ?.value
      .trim();


  if(!ship){

    alert(
      'Please enter the ship.'
    );

    return;

  }


  if(!reviewer){

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

      throw (
        result?.error ||
        new Error(
          'Could not save report to Supabase.'
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
      'Open report created.'
    );

  }catch(error){

    console.error(
      'Start report error:',
      error
    );


    alert(
      'Could not create the report.\n\n' +
      (
        error.message ||
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


  if(!reportId){

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


  if(reviewer){

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


  bindClick(
    'summaryBtn',
    async () => {

      const saved =
        await saveCurrentReport();


      if(!saved){

        alert(
          'Could not save the report.'
        );

        return;

      }


      summaryReturnScreen =
        'checklist';


      buildCurrentSummary();


      showScreen(
        'summary'
      );

    }
  );


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


  if(!saved){

    alert(
      'Could not save the report before Ship Review.'
    );

    return;

  }


  const prepared =
    await prepareShipReview();


  if(!prepared){

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
          Clear active reviewer state.
        */

        resetReport();

        clearSetupFields();


        currentSubmittedReport =
          null;


        /*
          IMPORTANT:
          go directly to Ship Response Report
          after successful send.
        */

        showScreen(
          'responses'
        );


        /*
          Show confirmation message.
        */

        showToast(
          'REPORT SENT TO SHIP'
        );


        /*
          Refresh the Ship Response
          Report list from Supabase.
        */

        await loadShipReviewReports();

      }

  });

}

/* =========================================================
   SUMMARY BUTTONS
========================================================= */

function bindSummaryButtons(){

  bindClick(
    'summaryBackToReportBtn',
    () => {

      updateChecklistHeader();

      renderChecklist();


      showScreen(
        'checklist'
      );

    }
  );


  bindClick(
    'summarySubmitBtn',
    async () => {

      await openShipReview();

    }
  );

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


  if(title){

    title.textContent =
      meta.ship ||
      'Report Overall';

  }


  const subtitle =
    document.getElementById(
      'sumMeta'
    );


  if(subtitle){

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


      if(points.length){

        departments.push({

          section,

          points

        });

      }

    }
  );


  const visible =
    document.getElementById(
      'report-overall-content'
    );


  if(!visible){

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
                    renderSummaryPoint(
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

            <div style="margin-top:8px;">

              <span class="status blue">

                FOLLOW-UP NEEDED FROM SHIP

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
                margin-top:10px;
              "
            >

              <div class="response-label">

                ATTACHED PHOTOS

              </div>


              <div class="response-photos">

                ${
                  point.photos
                    .map(
                      photo => `

                        <div class="response-photo">

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

            </div>

          `
          : ''
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


  if(!container){

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
      error
    );

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


  if(!container){

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
      error
    );

  }

}


/* =========================================================
   SHIP RESPONSE REPORTS
========================================================= */

async function loadShipReviewReports(){

  const container =
    document.getElementById(
      'responseList'
    );


  if(!container){

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
          'Could not load ship response reports.'
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


        if(points.length){

          groups.push({

            report,

            points

          });

        }

      }
    );


    if(groups.length === 0){

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
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load Ship Response Report.

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


        <b>Follow-Ups:</b>

        ${completed}/${points.length}

        <br>


        <span class="status blue">

          WAITING FOR SHIP RESPONSE

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
      >

        Submit Ship Response

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

    <div class="response-point">

      <div class="response-section">

        ${escapeHtml(
          point.section
        )}

      </div>


      <div class="response-text">

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


      ${
        point.shipComments.length
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


      <div
        class="field"
        style="
          margin-top:10px;
          margin-bottom:0;
        "
      >

        <label>
          SHIP COMMENT
        </label>


        <textarea
          class="ship-response-input"
          rows="3"
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
   SUBMIT SHIP RESPONSE
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


async function handleSubmitShipResponse(
  reportId
){

  const current =
    await getReport(
      reportId
    );


  if(
    !current ||
    !current.success ||
    !current.data
  ){

    alert(
      'Could not load the report.'
    );


    return;

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


      if(!text){

        return;

      }


      const key =
        input.dataset.responseKey;


      if(!state[key]){

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


      state[key]
        .shipComments
        .push({

          name:'Ship',

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
    Every follow-up must be answered
    before final submission.
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
          item.shipComments.length
        )
    );


  if(
    incomplete.length
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

    alert(
      'Could not submit Ship Response.\n\n' +
      (
        result?.error?.message ||
        'Unknown error'
      )
    );


    return;

  }


  showToast(
    'Ship Response submitted.'
  );


  await loadShipReviewReports();

}


/* =========================================================
   FOLLOW-UP
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

}


/* =========================================================
   REPORT CALLBACKS
========================================================= */

function bindReportCallbacks(){

  setReportCallbacks({

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
          'Open report loaded.'
        );

      },


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


        showScreen(
          'summary'
        );

      },


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


    showHome:
      () => {

        showScreen(
          'home'
        );

      }

  });

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
   ERROR HANDLERS
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
