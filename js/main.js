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
   NAVIGATION
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
   ADMIN GLOBAL
========================================================= */

window.shipVisitIsAdmin =
function(){

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
   HOME
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


      await loadShipReviewReports();

    }
  );


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
   HEADER BACK
========================================================= */

function bindHeaderBackButtons(){

  bindClick(
    'setupHeaderBack',
    () => {

      showScreen(
        'home'
      );

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
    () => {

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'submittedHeaderBack',
    () => {

      showScreen(
        'home'
      );

    }
  );


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
      'Start report:',
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


    return Boolean(
      result &&
      result.success
    );

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
      async () => {

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


        await loadShipReviewReports();

      }

  });

}


/* =========================================================
   SUMMARY BUTTONS
========================================================= */

function bindSummaryButtons(){

  /*
    Active report.
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
    Active report.
  */

  bindClick(
    'summarySubmitBtn',
    async () => {

      await openShipReview();

    }
  );


  /*
    Submitted report.
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
    Submitted report PDF.
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
    Submitted report print.
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


  const printRow =
    document.getElementById(
      'summarySubmittedPrintRow'
    );


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
      printRow
    ){

      printRow.classList.add(
        'hidden'
      );

    }


    return;

  }


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
    printRow
  ){

    printRow.classList.remove(
      'hidden'
    );

  }

}


/* =========================================================
   BUILD ACTIVE SUMMARY
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
              getReviewerComments(
                item
              ),

            photos:
              getPhotos(
                item
              ),

            followUpNeeded:
              Boolean(
                item.followUpNeeded
              ),

            shipComments:
              getShipComments(
                item
              )

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
   NORMALIZE REVIEWER COMMENTS
========================================================= */

function getReviewerComments(
  item
){

  if(
    !item
  ){

    return [];

  }


  /*
    CURRENT FORMAT:

    comments: [
      {
        name,
        text,
        timestamp
      }
    ]
  */

  if(
    Array.isArray(
      item.comments
    )
  ){

    return item.comments
      .filter(
        comment => {

          if(
            !comment
          ){

            return false;

          }


          const text =
            comment.text ??
            comment.comment ??
            comment.message ??
            '';


          return Boolean(
            String(
              text
            ).trim()
          );

        }
      )
      .map(
        comment => ({

          name:
            comment.name ||
            comment.reviewer ||
            getReviewer() ||
            'Reviewer',

          text:
            String(
              comment.text ??
              comment.comment ??
              comment.message ??
              ''
            ).trim(),

          timestamp:
            comment.timestamp ||
            null

        })
      );

  }


  /*
    LEGACY FORMAT:
    comment: "..."
  */

  if(
    typeof item.comment ===
    'string'
  ){

    const text =
      item.comment.trim();


    if(
      text
    ){

      return [
        {

          name:
            item.reviewer ||
            getReviewer() ||
            'Reviewer',

          text,

          timestamp:null

        }
      ];

    }

  }


  /*
    LEGACY FORMAT:
    reviewerComment: "..."
  */

  if(
    typeof item.reviewerComment ===
    'string'
  ){

    const text =
      item.reviewerComment.trim();


    if(
      text
    ){

      return [
        {

          name:
            item.reviewer ||
            getReviewer() ||
            'Reviewer',

          text,

          timestamp:null

        }
      ];

    }

  }


  /*
    LEGACY FORMAT:
    reviewerComments: [...]
  */

  if(
    Array.isArray(
      item.reviewerComments
    )
  ){

    return item.reviewerComments
      .map(
        comment => {

          if(
            typeof comment ===
            'string'
          ){

            return {

              name:
                getReviewer() ||
                'Reviewer',

              text:
                comment.trim(),

              timestamp:null

            };

          }


          return {

            name:
              comment?.name ||
              comment?.reviewer ||
              getReviewer() ||
              'Reviewer',

            text:
              String(
                comment?.text ??
                comment?.comment ??
                ''
              ).trim(),

            timestamp:
              comment?.timestamp ||
              null

          };

        }
      )
      .filter(
        comment =>
          comment.text
      );

  }


  return [];

}


/* =========================================================
   NORMALIZE PHOTOS
========================================================= */

function getPhotos(
  item
){

  if(
    !item
  ){

    return [];

  }


  if(
    Array.isArray(
      item.photos
    )
  ){

    return item.photos.filter(
      photo =>
        Boolean(
          photo
        )
    );

  }


  if(
    typeof item.photo ===
    'string' &&
    item.photo.trim()
  ){

    return [
      item.photo.trim()
    ];

  }


  return [];

}


/* =========================================================
   NORMALIZE SHIP COMMENTS
========================================================= */

function getShipComments(
  item
){

  if(
    !item
  ){

    return [];

  }


  if(
    Array.isArray(
      item.shipComments
    )
  ){

    return item.shipComments
      .filter(
        comment =>
          comment &&
          String(
            comment.text ||
            ''
          ).trim()
      );

  }


  return [];

}


/* =========================================================
   SUMMARY POINT
========================================================= */

function renderSummaryPoint(
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
        background:#FFFFFF;
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
            color:#FFFFFF;
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


      ${renderReviewerComments(
        point.comments
      )}


      ${renderReviewerPhotos(
        point.photos
      )}


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
   REVIEWER COMMENTS HTML
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

      <div class="response-label">

        REVIEWER COMMENTS

      </div>


      ${
        comments
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

  `;

}


/* =========================================================
   REVIEWER PHOTOS HTML
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

      <div class="response-label">

        REVIEWER PHOTOS

      </div>


      <div class="response-photos">

        ${
          photos
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

  `;

}


/* =========================================================
   SHIP COMMENTS HTML
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
          background:#FFF8F8;
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
                      getReviewerComments(
                        item
                      ),

                    photos:
                      getPhotos(
                        item
                      ),

                    shipComments:
                      getShipComments(
                        item
                      )

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
      'Ship Response Reports:',
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

      <div class="response-section">

        ${escapeHtml(
          point.section
        )}

      </div>


      <!-- POINT -->

      <div class="response-text">

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


      <!-- REVIEWER COMMENTS -->

      ${
        point.comments.length > 0

          ? `

            <div
              style="
                margin-top:13px;
              "
            >

              <div class="response-label">

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
                margin-top:10px;
                padding:8px 9px;
                border-left:3px solid var(--vv-line);
                border-radius:5px;
                background:#F8F6F9;
                color:var(--vv-gray);
                font-size:10px;
              "
            >

              No reviewer comment was entered.

            </div>

          `
      }


      <!-- REVIEWER PHOTOS -->

      ${
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


      <!-- PREVIOUS SHIP COMMENTS -->

      ${
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

            name:'Ship',

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
          'OPEN REPORT LOADED'
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


        setSummaryMode(
          true
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
