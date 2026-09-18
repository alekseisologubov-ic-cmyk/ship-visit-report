/*
  ============================================================
  SHIP VISIT REPORT
  reports.js
  ============================================================
*/


import {
  SECTIONS
} from './data.js';


import {
  getReportColor,
  getReportStatusText,
  countFollowUps,
  countCompletedFollowUps,
  getReport
} from './supabase.js';


import {
  loadReport
} from './state.js';


let callbacks = {

  openReport:null,

  viewSummary:null,

  viewFollowUps:null,

  showHome:null

};


/* =========================================================
   CALLBACKS
========================================================= */

export function setReportCallbacks(
  newCallbacks={}
){

  callbacks = {

    ...callbacks,

    ...newCallbacks

  };

}


/* =========================================================
   ESCAPE
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
   DATE
========================================================= */

function formatDate(
  value,
  withTime=false
){

  if(!value){

    return '';

  }


  const date =
    new Date(
      value
    );


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return value;

  }


  return withTime
    ? date.toLocaleString()
    : date.toLocaleDateString();

}


/* =========================================================
   ADMIN
========================================================= */

function isAdmin(){

  if(
    typeof window.shipVisitIsAdmin ===
    'function'
  ){

    return Boolean(
      window.shipVisitIsAdmin()
    );

  }


  return false;

}


function adminDeleteButton(
  reportId
){

  if(
    !isAdmin()
  ){

    return '';

  }


  return `

    <button
      type="button"
      class="admin-delete"
      data-admin-delete="${escapeHtml(
        reportId
      )}"
    >
      Delete Report
    </button>

  `;

}


/* =========================================================
   OPEN REPORTS
========================================================= */

export async function renderOpenReports(){

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

    const module =
      await import(
        './supabase.js'
      );


    const result =
      await module.getOpenReports();


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load open reports.'
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

          No open reports yet.

        </div>

      `;


      return;

    }


    container.innerHTML =
      reports
        .map(
          renderOpenReportCard
        )
        .join('');


    bindOpenReportButtons();

  }catch(error){

    console.error(
      'renderOpenReports:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load open reports.

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
   OPEN CARD
========================================================= */

function renderOpenReportCard(
  report
){

  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const followUps =
    countFollowUps(
      state
    );


  return `

    <div
      class="report-card red"
      data-report-id="${escapeHtml(
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


        <b>Last Updated:</b>

        ${escapeHtml(
          formatDate(
            report.updated_at,
            true
          )
        )}

        <br>


        <b>Follow-Ups:</b>

        ${followUps}

        <br>


        <span class="status red">

          OPEN / ONGOING

        </span>

      </div>


      <div class="report-actions">

        <button
          type="button"
          class="open"
          data-open-report="${escapeHtml(
            report.id
          )}"
        >

          Open Report

        </button>


        ${adminDeleteButton(
          report.id
        )}

      </div>

    </div>

  `;

}


/* =========================================================
   OPEN BUTTONS
========================================================= */

function bindOpenReportButtons(){

  document
    .querySelectorAll(
      '[data-open-report]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await openReport(
              button.dataset.openReport,
              'checklist'
            );

          }
        );

      }
    );


  bindAdminDeleteButtons();

}


/* =========================================================
   OPEN REPORT
========================================================= */

export async function openReport(
  reportId,
  destination='checklist'
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
      result?.error?.message ||
      'Could not open report.'
    );


    return false;

  }


  loadReport(
    result.data
  );


  if(
    destination === 'checklist' &&
    callbacks.openReport
  ){

    await callbacks.openReport(
      result.data
    );


    return true;

  }


  if(
    destination === 'summary' &&
    callbacks.viewSummary
  ){

    await callbacks.viewSummary(
      result.data
    );


    return true;

  }


  if(
    destination === 'followups' &&
    callbacks.viewFollowUps
  ){

    await callbacks.viewFollowUps(
      result.data
    );


    return true;

  }


  return true;

}


/* =========================================================
   DELETE
========================================================= */

function bindAdminDeleteButtons(){

  document
    .querySelectorAll(
      '.admin-delete'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await handleDelete(
              button.dataset.adminDelete
            );

          }
        );

      }
    );

}


async function handleDelete(
  reportId
){

  if(
    !isAdmin()
  ){

    alert(
      'Administrator access required.'
    );


    return;

  }


  const confirmed =
    window.confirm(
      'Delete this report permanently?'
    );


  if(
    !confirmed
  ){

    return;

  }


  const second =
    window.confirm(
      'This cannot be undone.\n\nContinue?'
    );


  if(
    !second
  ){

    return;

  }


  try{

    const module =
      await import(
        './supabase.js'
      );


    const result =
      await module.deleteReport(
        reportId
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not delete report.'
        )
      );

    }


    showToast(
      'Report deleted.'
    );


    await renderOpenReports();

    await renderSubmittedReports();

  }catch(error){

    console.error(
      'Delete report:',
      error
    );


    alert(
      'Could not delete report.\n\n' +
      (
        error.message ||
        'Unknown error'
      )
    );

  }

}


/* =========================================================
   SUBMITTED REPORTS
========================================================= */

export async function renderSubmittedReports(){

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

    const module =
      await import(
        './supabase.js'
      );


    const result =
      await module.getSubmittedReports();


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load submitted reports.'
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

          No submitted reports yet.

        </div>

      `;


      return;

    }


    container.innerHTML =
      reports
        .map(
          renderSubmittedReportCard
        )
        .join('');


    bindSubmittedButtons();

  }catch(error){

    console.error(
      'renderSubmittedReports:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load submitted reports.

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
   SUBMITTED CARD
========================================================= */

function renderSubmittedReportCard(
  report
){

  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const followUps =
    countFollowUps(
      state
    );


  const completed =
    countCompletedFollowUps(
      state
    );


  const color =
    getReportColor(
      report
    );


  const status =
    getReportStatusText(
      report
    );


  return `

    <div
      class="report-card ${color}"
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


        <b>Submitted:</b>

        ${escapeHtml(
          formatDate(
            report.submitted_at ||
            report.updated_at,
            true
          )
        )}

        <br>


        <b>Follow-Ups:</b>

        ${completed}/${followUps}

        <br>


        <span
          class="status ${color}"
        >

          ${escapeHtml(
            status
          )}

        </span>

      </div>


      <div
        style="
          margin-top:12px;
          color:var(--vv-gray);
          font-size:11px;
        "
      >

        Select what you want to review:

      </div>


      <div class="report-actions">

        <button
          type="button"
          class="open"
          data-overall-report="${escapeHtml(
            report.id
          )}"
        >

          Report Overall

        </button>


        <button
          type="button"
          data-followup-report="${escapeHtml(
            report.id
          )}"
        >

          Points To Follow Up

        </button>

      </div>


      <div class="report-actions">

        <button
          type="button"
          data-pdf-report="${escapeHtml(
            report.id
          )}"
        >

          Save PDF

        </button>


        <button
          type="button"
          data-print-report="${escapeHtml(
            report.id
          )}"
        >

          Print

        </button>

      </div>


      ${
        adminDeleteButton(
          report.id
        )
      }

    </div>

  `;

}


/* =========================================================
   SUBMITTED BUTTONS
========================================================= */

function bindSubmittedButtons(){

  document
    .querySelectorAll(
      '[data-overall-report]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await openReport(
              button.dataset.overallReport,
              'summary'
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '[data-followup-report]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await openReport(
              button.dataset.followupReport,
              'followups'
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '[data-pdf-report]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const result =
              await getReport(
                button.dataset.pdfReport
              );


            if(
              !result ||
              !result.success ||
              !result.data
            ){

              alert(
                'Could not load report.'
              );


              return;

            }


            loadReport(
              result.data
            );


            currentReportForSummary =
              result.data;


            if(
              callbacks.viewSummary
            ){

              await callbacks.viewSummary(
                result.data
              );

            }


            setTimeout(
              () => {

                document.dispatchEvent(
                  new CustomEvent(
                    'shipVisitGeneratePDF'
                  )
                );

              },
              200
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '[data-print-report]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const result =
              await getReport(
                button.dataset.printReport
              );


            if(
              !result ||
              !result.success ||
              !result.data
            ){

              alert(
                'Could not load report.'
              );


              return;

            }


            loadReport(
              result.data
            );


            if(
              callbacks.viewSummary
            ){

              await callbacks.viewSummary(
                result.data
              );

            }


            setTimeout(
              () => {

                window.print();

              },
              200
            );

          }
        );

      }
    );


  bindAdminDeleteButtons();

}


/* =========================================================
   CURRENT REPORT FOR PDF
========================================================= */

let currentReportForSummary = null;


/* =========================================================
   REPORT OVERALL
========================================================= */

export function renderReportOverall(
  report
){

  const container =
    document.getElementById(
      'report-overall-content'
    );


  if(!container){

    return;

  }


  currentReportForSummary =
    report;


  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const points =
    getAllPoints(
      state
    )
    .filter(
      point =>
        point.checked
    );


  if(
    points.length === 0
  ){

    container.innerHTML = `

      <div class="empty">

        No checklist points were marked
        as checked.

      </div>

    `;


    return;

  }


  container.innerHTML =
    renderOverallGroups(
      points
    );

}


/* =========================================================
   GET ALL POINTS
========================================================= */

function getAllPoints(
  state
){

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
            state[key] ||
            {};


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

    }
  );


  return points;

}


/* =========================================================
   OVERALL GROUPS
========================================================= */

function renderOverallGroups(
  points
){

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


      if(!group){

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


  return groups
    .map(
      group => `

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
              group.section
            )}

          </div>


          ${
            group.points
              .map(
                point =>
                  renderOverallPoint(
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
   OVERALL POINT
========================================================= */

function renderOverallPoint(
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
   SHIP COMMENTS
========================================================= */

function renderShipComments(
  comments
){

  if(
    !comments ||
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
        margin-top:10px;
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


/* =========================================================
   FOLLOW UPS
========================================================= */

export function renderReportFollowUps(
  report
){

  const container =
    document.getElementById(
      'report-followups-content'
    );


  if(!container){

    return;

  }


  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const points =
    getAllPoints(
      state
    )
    .filter(
      point =>
        point.checked &&
        point.followUpNeeded
    );


  if(
    points.length === 0
  ){

    container.innerHTML = `

      <div class="empty">

        No points were marked for ship follow-up.

      </div>

    `;


    return;

  }


  container.innerHTML =
    points
      .map(
        point =>
          renderFollowUpPoint(
            point
          )
      )
      .join('');

}


/* =========================================================
   FOLLOW-UP POINT
========================================================= */

function renderFollowUpPoint(
  point
){

  const complete =
    point.shipComments.length > 0;


  return `

    <div
      class="report-card ${
        complete
          ? 'green'
          : 'blue'
      }"
      style="
        margin-bottom:14px;
      "
    >

      <div class="response-section">

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
        class="status ${
          complete
            ? 'green'
            : 'blue'
        }"
      >

        ${
          complete
            ? 'FOLLOW-UP COMPLETED'
            : 'FOLLOW-UP OPEN'
        }

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


      ${
        renderShipComments(
          point.shipComments
        )
      }

    </div>

  `;

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
   DEFAULT EXPORT
========================================================= */

export default {

  renderOpenReports,

  renderSubmittedReports,

  renderReportOverall,

  renderReportFollowUps,

  openReport,

  setReportCallbacks

};
