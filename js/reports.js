/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  reports.js
  ============================================================

  SUBMITTED REPORTS

  Main screen:
    - Shows report information
    - Shows status
    - Shows ONE Review Report button
    - Admin can delete

  Report review screen:
    - Report Overall
    - Points To Follow Up
    - PDF / Print are handled inside the report
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


/* =========================================================
   CALLBACKS
========================================================= */

let callbacks = {

  openReport:null,

  viewSummary:null,

  viewFollowUps:null,

  showHome:null

};


export function setReportCallbacks(
  newCallbacks={}
){

  callbacks = {

    ...callbacks,

    ...newCallbacks

  };

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
   DATE FORMAT
========================================================= */

function formatDate(
  value,
  withTime=false
){

  if(
    !value
  ){

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


/* =========================================================
   ADMIN DELETE BUTTON
========================================================= */

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
      style="
        margin-top:8px;
        width:100%;
        padding:8px 12px;
        border:1px solid #CC0000;
        border-radius:7px;
        background:#FFFFFF;
        color:#CC0000;
        font-size:10px;
        font-weight:700;
        cursor:pointer;
      "
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
   OPEN REPORT CARD
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

        ${
          followUps
            ? `

              <br>

              <b>
                Follow-Ups:
              </b>

              ${followUps}

            `
            : ''
        }

        <br>


        <span class="status red">

          OPEN / ONGOING

        </span>

      </div>


      <div
        style="
          margin-top:12px;
        "
      >

        <button
          type="button"
          class="open"
          data-open-report="${escapeHtml(
            report.id
          )}"
          style="
            width:100%;
            min-height:40px;
            padding:8px 14px;
            border-radius:7px;
            font-size:11px;
          "
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
   OPEN ONE REPORT
========================================================= */

export async function openReport(
  reportId,
  destination='checklist'
){

  try{

    const result =
      await getReport(
        reportId
      );


    if(
      !result ||
      !result.success ||
      !result.data
    ){

      throw (
        result?.error ||
        new Error(
          'Could not open report.'
        )
      );

    }


    loadReport(
      result.data
    );


    if(
      destination === 'checklist'
    ){

      if(
        callbacks.openReport
      ){

        await callbacks.openReport(
          result.data
        );

      }


      return true;

    }


    if(
      destination === 'summary'
    ){

      if(
        callbacks.viewSummary
      ){

        await callbacks.viewSummary(
          result.data
        );

      }


      return true;

    }


    if(
      destination === 'followups'
    ){

      if(
        callbacks.viewFollowUps
      ){

        await callbacks.viewFollowUps(
          result.data
        );

      }


      return true;

    }


    return true;

  }catch(error){

    console.error(
      'openReport:',
      error
    );


    alert(
      error?.message ||
      'Could not open report.'
    );


    return false;

  }

}


/* =========================================================
   ADMIN DELETE
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
          async event => {

            event.stopPropagation();


            await handleAdminDelete(
              button.dataset.adminDelete
            );

          }
        );

      }
    );

}


async function handleAdminDelete(
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


  const first =
    window.confirm(
      'Delete this report permanently?'
    );


  if(
    !first
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
        error?.message ||
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


    /*
      ONE CLEAN CARD PER REPORT.
    */

    container.innerHTML =
      reports
        .map(
          renderSubmittedReportCard
        )
        .join('');


    bindSubmittedReportButtons();

  }catch(error){

    console.error(
      'renderSubmittedReports:',
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
   SUBMITTED REPORT CARD
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


  return `

    <div
      class="report-card green"
      style="
        padding:16px;
        margin-bottom:14px;
      "
    >

      <!-- ===============================================
           REPORT NAME
      ================================================= -->

      <h3
        style="
          margin-bottom:10px;
          font-size:17px;
        "
      >

        ${escapeHtml(
          report.ship ||
          'Unnamed Ship'
        )}

      </h3>


      <!-- ===============================================
           INFORMATION
      ================================================= -->

      <div
        class="report-meta"
        style="
          line-height:1.7;
        "
      >

        <b>
          Visit:
        </b>

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


        <b>
          Reviewer:
        </b>

        ${escapeHtml(
          report.reviewer ||
          ''
        )}

        <br>


        <b>
          Submitted:
        </b>

        ${escapeHtml(
          formatDate(
            report.submitted_at ||
            report.updated_at,
            true
          )
        )}

        <br>


        <b>
          Follow-Ups:
        </b>

        ${completed}/${followUps}

        <br>


        <span
          class="status green"
          style="
            margin-top:4px;
          "
        >

          SUBMITTED

        </span>

      </div>


      <!-- ===============================================
           ONLY REVIEW BUTTON
      ================================================= -->

      <div
        style="
          margin-top:14px;
        "
      >

        <button
          type="button"
          class="submitted-review-button"
          data-review-submitted="${escapeHtml(
            report.id
          )}"
          style="
            width:100%;
            min-height:40px;
            padding:8px 14px;
            border:1px solid var(--vv-squid);
            border-radius:7px;
            background:var(--vv-squid);
            color:#FFFFFF;
            font-family:inherit;
            font-size:11px;
            font-weight:800;
            cursor:pointer;
          "
        >

          REVIEW REPORT

        </button>

      </div>


      <!-- ===============================================
           ADMIN DELETE
      ================================================= -->

      ${
        isAdmin()
          ? `

            <div
              style="
                margin-top:7px;
              "
            >

              ${adminDeleteButton(
                report.id
              )}

            </div>

          `
          : ''
      }

    </div>

  `;

}


/* =========================================================
   SUBMITTED BUTTON
========================================================= */

function bindSubmittedReportButtons(){

  document
    .querySelectorAll(
      '[data-review-submitted]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await openReport(
              button.dataset.reviewSubmitted,
              'summary'
            );

          }
        );

      }
    );


  bindAdminDeleteButtons();

}


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


  if(
    !container
  ){

    return;

  }


  const state =
    report
      ?.report_data
      ?.state ||
    {};

  window.__SHIP_VISIT_RENDER_STATE__ = state;


  const points =
    getAllPoints(
      state
    )
    .filter(
      point =>
        point.checked
    );


  const hasGeneralComments = SECTIONS.some(section => {
    const comments = state[`__department_general__${section.id}`]?.comments;
    return Array.isArray(comments) && comments.length > 0;
  });

  if(points.length === 0 && !hasGeneralComments){

    container.innerHTML = `
      <div class="empty">
        No checklist points were marked as checked.
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

  const groups = [];
  points.forEach(point => {
    let group = groups.find(item => item.section === point.section);
    if(!group){
      group = { section: point.section, points: [] };
      groups.push(group);
    }
    group.points.push(point);
  });

  const state = window.__SHIP_VISIT_RENDER_STATE__ || {};

  return SECTIONS.map(section => {

    const group = groups.find(item => item.section === section.title);
    const comments = state[`__department_general__${section.id}`]?.comments;
    const generalComments = Array.isArray(comments) ? comments : [];

    if((!group || !group.points.length) && !generalComments.length){
      return '';
    }

    return `
      <div style="margin-bottom:20px;">
        <div style="margin-bottom:10px;padding-bottom:7px;border-bottom:2px solid var(--vv-red);color:var(--vv-squid);font-size:15px;font-weight:800;">
          ${escapeHtml(section.title)}
        </div>
        ${generalComments.length ? `
          <div style="margin-bottom:10px;padding:10px 12px;border-left:4px solid var(--vv-squid);border-radius:8px;background:#F8F5FA;">
            <div class="response-label">GENERAL COMMENTS</div>
            ${generalComments.map(comment => `
              <div style="margin-top:6px;font-size:11px;line-height:1.5;">
                <strong>${escapeHtml(comment.name || 'Reviewer')}:</strong> ${escapeHtml(comment.text || '')}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${group ? group.points.map(renderOverallPoint).join('') : ''}
      </div>
    `;

  }).join('');

}



/* =========================================================
   OVERALL POINT
========================================================= */

function renderOverallPoint(
  point
){

  const completed =
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

      <!-- POINT -->

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


      <!-- FOLLOW-UP STATUS -->

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

          `

          : ''

      }


      <!-- REVIEWER COMMENTS -->

      ${
        renderComments(
          point.comments,
          'REVIEWER COMMENTS'
        )
      }


      <!-- REVIEWER PHOTOS -->

      ${
        renderPhotos(
          point.photos
        )
      }


      <!-- SHIP RESPONSES -->

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
   COMMENTS
========================================================= */

function renderComments(
  comments,
  title
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
        margin-top:10px;
      "
    >

      <div class="response-label">

        ${escapeHtml(
          title
        )}

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
   PHOTOS
========================================================= */

function renderPhotos(
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
        margin-top:10px;
      "
    >

      <div class="response-label">

        ATTACHED PHOTOS

      </div>


      <div
        class="response-photos"
      >

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
   SHIP COMMENTS
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
   FOLLOW-UP REPORT
========================================================= */

export function renderReportFollowUps(
  report
){

  const container =
    document.getElementById(
      'report-followups-content'
    );


  if(
    !container
  ){

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

        No points were marked
        Follow-Up Needed from Ship.

      </div>

    `;


    return;

  }


  const completed =
    points.filter(
      point =>
        point.shipComments.length > 0
    ).length;


  container.innerHTML = `

    <div
      style="
        margin-bottom:16px;
        padding:12px;
        background:var(--vv-bg);
        border-top:3px solid var(--vv-red);
        border-radius:7px;
        font-size:11px;
        line-height:1.6;
      "
    >

      <strong>
        Follow-Up Points:
      </strong>

      ${points.length}


      <br>


      <strong>
        Responses Completed:
      </strong>

      ${completed}/${points.length}

    </div>


    ${
      points
        .map(
          renderFollowUpPoint
        )
        .join('')
    }

  `;

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
        renderComments(
          point.comments,
          'REVIEWER COMMENTS'
        )
      }


      ${
        renderPhotos(
          point.photos
        )
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
