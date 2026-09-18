/*
  ============================================================
  SHIP VISIT REPORT
  reports.js
  ============================================================

  Handles:

  - Open Reports
  - Submitted Reports
  - Report Overall
  - Points To Follow Up
  - Admin Delete
  - Report navigation callbacks
*/


import {
  SECTIONS
} from './data.js';


import {
  getReportColor,
  getReportStatusText,
  reportNeedsFollowUp,
  getFollowUpPoints,
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

  openReport: null,

  viewSummary: null,

  viewFollowUps: null,

  showHome: null

};


export function setReportCallbacks(
  newCallbacks = {}
) {

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
) {

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    character => ({

      '&': '&amp;',

      '<': '&lt;',

      '>': '&gt;',

      '"': '&quot;',

      "'": '&#39;'

    }[character])
  );

}


/* =========================================================
   DATE
========================================================= */

function formatDate(
  value,
  withTime = false
) {

  if (
    !value
  ) {

    return '';

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return withTime
    ? date.toLocaleString()
    : date.toLocaleDateString();

}


/* =========================================================
   ADMIN CHECK
========================================================= */

function isAdmin() {

  if (
    typeof window.shipVisitIsAdmin ===
    'function'
  ) {

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
) {

  if (
    !isAdmin()
  ) {

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
        background:#fff;
        color:#CC0000;
        border:1.5px solid #CC0000;
      "
    >
      Delete Report
    </button>

  `;

}


/* =========================================================
   OPEN REPORTS
========================================================= */

export async function renderOpenReports() {

  const container =
    document.getElementById(
      'openList'
    );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML = `

    <div class="empty">
      Loading open reports...
    </div>

  `;


  try {

    const module =
      await import(
        './supabase.js'
      );


    const result =
      await module.getOpenReports();


    if (
      !result.success
    ) {

      throw (
        result.error ||
        new Error(
          'Could not load open reports.'
        )
      );

    }


    const reports =
      result.data || [];


    if (
      reports.length === 0
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


    container.innerHTML =
      reports
        .map(
          report =>
            renderOpenReportCard(
              report
            )
        )
        .join('');


    bindOpenReportButtons();

  } catch (error) {

    console.error(
      'renderOpenReports:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load open reports.

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
) {

  const state =
    report.report_data?.state ||
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


        ${
          followUps
            ? `

              <b>
                Follow-Ups:
              </b>

              ${followUps}

              <br>

            `
            : ''
        }


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
   OPEN REPORT BUTTONS
========================================================= */

function bindOpenReportButtons() {

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
   ADMIN DELETE BUTTONS
========================================================= */

function bindAdminDeleteButtons() {

  document
    .querySelectorAll(
      '.admin-delete'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            await handleAdminDelete(
              button.dataset.adminDelete
            );

          }
        );

      }
    );

}


/* =========================================================
   HANDLE ADMIN DELETE
========================================================= */

async function handleAdminDelete(
  reportId
) {

  if (
    !isAdmin()
  ) {

    alert(
      'Administrator access required.'
    );

    return;

  }


  const firstConfirm =
    window.confirm(
      'ADMIN ACTION\n\n' +
      'Delete this report permanently?'
    );


  if (
    !firstConfirm
  ) {

    return;

  }


  const secondConfirm =
    window.confirm(
      'This will permanently remove the report and its saved data.\n\n' +
      'Continue?'
    );


  if (
    !secondConfirm
  ) {

    return;

  }


  try {

    const module =
      await import(
        './supabase.js'
      );


    const result =
      await module.deleteReport(
        reportId
      );


    if (
      !result.success
    ) {

      alert(
        'Report could not be deleted.\n\n' +
        (
          result.error?.message ||
          'Supabase error'
        )
      );

      return;

    }


    showToast(
      'Report deleted.'
    );


    await renderOpenReports();

    await renderSubmittedReports();

  } catch (error) {

    console.error(
      'Admin delete:',
      error
    );


    alert(
      'Report could not be deleted.\n\n' +
      (
        error.message ||
        'Unknown error'
      )
    );

  }

}


/* =========================================================
   OPEN REPORT FROM DATABASE
========================================================= */

export async function openReport(
  reportId,
  destination = 'checklist'
) {

  const result =
    await getReport(
      reportId
    );


  if (
    !result.success ||
    !result.data
  ) {

    alert(
      result.error?.message ||
      'Could not open report.'
    );


    return false;

  }


  loadReport(
    result.data
  );


  if (
    destination === 'checklist' &&
    callbacks.openReport
  ) {

    await callbacks.openReport(
      result.data
    );

    return true;

  }


  if (
    destination === 'summary' &&
    callbacks.viewSummary
  ) {

    await callbacks.viewSummary(
      result.data
    );

    return true;

  }


  if (
    destination === 'followups' &&
    callbacks.viewFollowUps
  ) {

    await callbacks.viewFollowUps(
      result.data
    );

    return true;

  }


  return true;

}


/* =========================================================
   SUBMITTED REPORTS
========================================================= */

export async function renderSubmittedReports() {

  const container =
    document.getElementById(
      'reportList'
    );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML = `

    <div class="empty">

      Loading submitted reports...

    </div>

  `;


  try {

    const module =
      await import(
        './supabase.js'
      );


    const result =
      await module.getSubmittedReports();


    if (
      !result.success
    ) {

      throw (
        result.error ||
        new Error(
          'Could not load submitted reports.'
        )
      );

    }


    const reports =
      result.data || [];


    if (
      reports.length === 0
    ) {

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
          report =>
            renderSubmittedReportCard(
              report
            )
        )
        .join('');


    bindSubmittedReportButtons();

  } catch (error) {

    console.error(
      'renderSubmittedReports:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load submitted reports.

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
) {

  const color =
    getReportColor(
      report
    );


  const status =
    getReportStatusText(
      report
    );


  const state =
    report.report_data?.state ||
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
            report.created_at,
            true
          )
        )}

        <br>


        ${
          followUps

            ? `

              <b>
                Follow-Ups:
              </b>

              ${completed}/${followUps}

              <br>

            `

            : `

              <b>
                Follow-Ups:
              </b>

              None

              <br>

            `
        }


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
          ? `

            <div
              class="report-actions"
              style="
                margin-top:8px;
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
   SUBMITTED BUTTONS
========================================================= */

function bindSubmittedReportButtons() {

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


            if (
              !result.success ||
              !result.data
            ) {

              alert(
                result.error?.message ||
                'Could not load report.'
              );

              return;

            }


            loadReport(
              result.data
            );


            if (
              callbacks.viewSummary
            ) {

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


            if (
              !result.success ||
              !result.data
            ) {

              alert(
                result.error?.message ||
                'Could not load report.'
              );

              return;

            }


            loadReport(
              result.data
            );


            if (
              callbacks.viewSummary
            ) {

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
   REPORT OVERALL
========================================================= */

export function renderReportOverall(
  report
) {

  const container =
    document.getElementById(
      'report-overall-content'
    );


  if (
    !container
  ) {

    return;

  }


  const state =
    report?.report_data?.state ||
    {};


  const points =
    getAllPoints(
      state
    );


  const checkedPoints =
    points.filter(
      point =>
        point.checked
    );


  if (
    checkedPoints.length === 0
  ) {

    container.innerHTML = `

      ${renderReportHeader(
        report
      )}


      <div class="empty">

        No checklist points were marked
        as checked in this report.

      </div>

    `;


    return;

  }


  container.innerHTML = `

    ${renderReportHeader(
      report
    )}


    <div
      style="
        margin-top:18px;
      "
    >

      ${
        renderOverallCheckedPoints(
          checkedPoints
        )
      }

    </div>

  `;

}


/* =========================================================
   REPORT HEADER
========================================================= */

function renderReportHeader(
  report
) {

  return `

    <div
      style="
        margin-bottom:15px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:17px;
          font-weight:800;
          margin-bottom:6px;
        "
      >

        ${escapeHtml(
          report.ship ||
          'Ship Visit Report'
        )}

      </div>


      <div
        style="
          color:var(--vv-gray);
          font-size:12px;
          line-height:1.6;
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

        ${
          report.submitted_at
            ? `

              <br>

              <b>
                Submitted:
              </b>

              ${escapeHtml(
                formatDate(
                  report.submitted_at,
                  true
                )
              )}

            `
            : ''
        }

      </div>

    </div>

  `;

}


/* =========================================================
   ALL CHECKED POINTS
========================================================= */

function getAllPoints(
  state
) {

  const result =
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


          result.push({

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


  return result;

}


/* =========================================================
   CHECKED POINTS BY DEPARTMENT
========================================================= */

function renderOverallCheckedPoints(
  points
) {

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


      if (
        !group
      ) {

        group = {

          section:
            point.section,

          points: []

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
) {

  const followupComplete =
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
                  followupComplete
                    ? 'green'
                    : 'blue'
                }"
              >

                ${
                  followupComplete
                    ? 'SHIP FOLLOW-UP COMPLETED'
                    : 'FOLLOW-UP NEEDED FROM SHIP'
                }

              </span>

            </div>

          `
          : ''
      }


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
) {

  if (
    !comments ||
    comments.length === 0
  ) {

    return '';

  }


  return `

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

        ${escapeHtml(
          title
        )}

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
   PHOTOS
========================================================= */

function renderPhotos(
  photos
) {

  if (
    !photos ||
    photos.length === 0
  ) {

    return '';

  }


  return `

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
          photos
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
                    alt="Report photo"
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


/* =========================================================
   SHIP COMMENTS
========================================================= */

function renderShipComments(
  comments
) {

  if (
    !comments ||
    comments.length === 0
  ) {

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
      }

    </div>

  `;

}


/* =========================================================
   POINTS TO FOLLOW UP
========================================================= */

export function renderReportFollowUps(
  report
) {

  const container =
    document.getElementById(
      'report-followups-content'
    );


  if (
    !container
  ) {

    return;

  }


  const points =
    getAllPoints(
      report?.report_data?.state ||
      {}
    )
    .filter(
      point =>
        point.followUpNeeded
    );


  if (
    points.length === 0
  ) {

    container.innerHTML = `

      ${renderReportHeader(
        report
      )}


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

    ${renderReportHeader(
      report
    )}


    <div
      style="
        margin-bottom:18px;
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
          point =>
            renderFollowUpPoint(
              point
            )
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
) {

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
   REFRESH
========================================================= */

export async function refreshAllReports() {

  await renderOpenReports();

  await renderSubmittedReports();

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

  refreshAllReports,

  setReportCallbacks

};
