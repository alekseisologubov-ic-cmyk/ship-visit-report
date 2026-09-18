/*
  reports.js

  Handles:
  - Open Reports
  - Submitted Reports
  - Report Overall
  - Points To Follow Up
  - Reviewer comments
  - Ship comments
  - Reviewer photos
  - Follow-up status
*/


import {
  SECTIONS,
  itemInfo
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
  withTime = false
) {

  if (!value) {

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
   STATUS HELPERS
========================================================= */

function statusColor(
  report
) {

  return getReportColor(
    report
  );

}


function statusText(
  report
) {

  return getReportStatusText(
    report
  );

}


/* =========================================================
   OPEN REPORTS
========================================================= */

export async function renderOpenReports() {

  const container =
    document.getElementById(
      'openList'
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    `
      <div class="empty">
        Loading open reports...
      </div>
    `;


  try {

    const {
      data,
      error
    } =
      await getOpenReportsForModule();


    if (error) {

      throw error;

    }


    if (!data.length) {

      container.innerHTML =
        `
          <div class="empty">
            No open reports.
          </div>
        `;

      return;

    }


    container.innerHTML =
      data
        .map(
          report =>
            renderOpenReportCard(
              report
            )
        )
        .join('');


    bindOpenReportActions();

  } catch (error) {

    console.error(
      'Open reports error:',
      error
    );


    container.innerHTML =
      `
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
   LOAD OPEN REPORTS
========================================================= */

async function getOpenReportsForModule() {

  /*
    Importing dynamically here avoids creating a
    circular module dependency.
  */

  const module =
    await import(
      './supabase.js'
    );


  return module.getOpenReports();

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


  const lastUpdated =
    formatDate(
      report.updated_at,
      true
    );


  return `

    <div
      class="report-card red"
      data-report-card="${escapeHtml(
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
          lastUpdated
        )}

        <br>


        ${
          followUps
            ? `
              <b>
                Follow-Up Points:
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


      <div
        class="report-actions"
      >

        <button
          type="button"
          class="open"
          data-open-report="${escapeHtml(
            report.id
          )}"
        >
          Open Report
        </button>


        <button
          type="button"
          data-delete-report="${escapeHtml(
            report.id
          )}"
        >
          Delete
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   OPEN REPORT ACTIONS
========================================================= */

function bindOpenReportActions() {

  const container =
    document.getElementById(
      'openList'
    );


  if (!container) {

    return;

  }


  container
    .querySelectorAll(
      '[data-open-report]'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const id =
              button.dataset.openReport;


            await openReportFromDatabase(
              id,
              'checklist'
            );

          };

      }
    );


  container
    .querySelectorAll(
      '[data-delete-report]'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const confirmed =
              window.confirm(
                'Delete this open report?'
              );


            if (!confirmed) {

              return;

            }


            const module =
              await import(
                './supabase.js'
              );


            const result =
              await module.deleteOpenReport(
                button.dataset.deleteReport
              );


            if (!result.success) {

              alert(
                result.error?.message ||
                'Could not delete the report.'
              );

              return;

            }


            await renderOpenReports();

          };

      }
    );

}


/* =========================================================
   OPEN A REPORT
========================================================= */

export async function openReportFromDatabase(
  id,
  destination = 'checklist'
) {

  const result =
    await getReport(
      id
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


  /*
    Put the database report into the
    application state.
  */

  loadReport(
    result.data
  );


  /*
    Tell main.js what screen to show.
  */

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


  if (!container) {

    return;

  }


  container.innerHTML =
    `
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
          'Could not load reports.'
        )
      );

    }


    const reports =
      result.data || [];


    if (!reports.length) {

      container.innerHTML =
        `
          <div class="empty">
            No submitted reports.
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


    bindSubmittedReportActions();

  } catch (error) {

    console.error(
      'Submitted reports error:',
      error
    );


    container.innerHTML =
      `
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
    statusColor(
      report
    );


  const text =
    statusText(
      report
    );


  const state =
    report.report_data?.state ||
    {};


  const followUpCount =
    countFollowUps(
      state
    );


  const completedFollowUps =
    countCompletedFollowUps(
      state
    );


  const submittedDate =
    formatDate(
      report.submitted_at ||
      report.created_at,
      true
    );


  return `

    <div
      class="report-card ${color}"
      data-submitted-card="${escapeHtml(
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


        <b>Submitted:</b>

        ${escapeHtml(
          submittedDate
        )}

        <br>


        ${
          followUpCount
            ? `
              <b>
                Follow-Ups:
              </b>

              ${completedFollowUps}/${followUpCount}

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
            text
          )}

        </span>

      </div>


      <div
        style="
          margin-top:13px;
          font-size:11px;
          color:var(--vv-gray);
        "
      >
        Select what you want to review:
      </div>


      <div
        class="report-actions"
        style="
          margin-top:8px;
        "
      >

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
          Points to Follow Up
        </button>

      </div>


      <div
        class="report-actions"
        style="
          margin-top:8px;
        "
      >

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

    </div>

  `;

}


/* =========================================================
   SUBMITTED REPORT ACTIONS
========================================================= */

function bindSubmittedReportActions() {

  const container =
    document.getElementById(
      'reportList'
    );


  if (!container) {

    return;

  }


  /*
    REPORT OVERALL
  */

  container
    .querySelectorAll(
      '[data-overall-report]'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            await openReportFromDatabase(
              button.dataset.overallReport,
              'summary'
            );

          };

      }
    );


  /*
    POINTS TO FOLLOW UP
  */

  container
    .querySelectorAll(
      '[data-followup-report]'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            await openReportFromDatabase(
              button.dataset.followupReport,
              'followups'
            );

          };

      }
    );


  /*
    PDF
  */

  container
    .querySelectorAll(
      '[data-pdf-report]'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const result =
              await getReport(
                button.dataset.pdfReport
              );


            if (
              !result.success
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

                const event =
                  new CustomEvent(
                    'shipVisitGeneratePDF'
                  );


                document.dispatchEvent(
                  event
                );

              },
              100
            );

          };

      }
    );


  /*
    PRINT
  */

  container
    .querySelectorAll(
      '[data-print-report]'
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const result =
              await getReport(
                button.dataset.printReport
              );


            if (
              !result.success
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
              180
            );

          };

      }
    );

}


/* =========================================================
   REPORT OVERALL VIEW
========================================================= */

export function renderReportOverall(
  report
) {

  const container =
    document.getElementById(
      'report-overall-content'
    );


  if (!container) {

    return;

  }


  const state =
    report?.report_data?.state ||
    {};


  const reportPoints =
    getAllPoints(
      state
    );


  const totals =
    calculateReportTotals(
      reportPoints
    );


  container.innerHTML = `

    <div
      style="
        margin-bottom:18px;
      "
    >

      ${renderReportHeader(
        report
      )}

    </div>


    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(4,1fr);
        gap:8px;
        margin-bottom:20px;
      "
    >

      ${statBox(
        totals.checked,
        'CHECKED'
      )}

      ${statBox(
        totals.total,
        'TOTAL'
      )}

      ${statBox(
        totals.comments,
        'COMMENTS'
      )}

      ${statBox(
        totals.photos,
        'PHOTOS'
      )}

    </div>


    <div>

      ${
        reportPoints
          .map(
            point =>
              renderOverallPoint(
                point
              )
          )
          .join('')
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

      ${
        report.submitted_at
          ? `
            <b>Submitted:</b>
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

  `;

}


/* =========================================================
   STAT BOX
========================================================= */

function statBox(
  value,
  label
) {

  return `

    <div
      style="
        padding:10px;
        background:var(--vv-bg);
        border-top:3px solid var(--vv-red);
        border-radius:6px;
      "
    >

      <div
        style="
          font-size:21px;
          font-weight:800;
        "
      >
        ${escapeHtml(
          value
        )}
      </div>


      <div
        style="
          color:var(--vv-gray);
          font-size:9px;
          font-weight:700;
        "
      >
        ${escapeHtml(
          label
        )}
      </div>

    </div>

  `;

}


/* =========================================================
   ALL POINTS
========================================================= */

function getAllPoints(
  state
) {

  const points = [];


  SECTIONS.forEach(
    section => {

      section.items.forEach(
        (text,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key] ||
            {

              checked:false,

              comments:[],

              photos:[],

              followUpNeeded:false,

              shipComments:[]

            };


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
   TOTALS
========================================================= */

function calculateReportTotals(
  points
) {

  return {

    total:
      points.length,

    checked:
      points.filter(
        point =>
          point.checked
      ).length,

    comments:
      points.reduce(
        (
          total,
          point
        ) =>
          total +
          point.comments.length +
          point.shipComments.length,
        0
      ),

    photos:
      points.reduce(
        (
          total,
          point
        ) =>
          total +
          point.photos.length,
        0
      )

  };

}


/* =========================================================
   OVERALL POINT
========================================================= */

function renderOverallPoint(
  point
) {

  const status =
    point.followUpNeeded
      ? (
          point.shipComments.length
            ? 'FOLLOW-UP COMPLETED'
            : 'FOLLOW-UP OPEN'
        )
      : (
          point.checked
            ? 'CHECKED'
            : 'NOT CHECKED'
        );


  const statusClass =
    point.followUpNeeded
      ? (
          point.shipComments.length
            ? 'green'
            : 'blue'
        )
      : '';


  return `

    <div
      style="
        padding:14px 0;
        border-top:1px solid var(--vv-line);
        page-break-inside:avoid;
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
          font-size:13.5px;
          line-height:1.45;
        "
      >

        ${escapeHtml(
          point.text
        )}

      </div>


      <div
        style="
          margin-top:6px;
        "
      >

        <span
          class="status ${statusClass}"
        >

          ${
            point.checked
              ? '✓ CHECKED'
              : '□ NOT CHECKED'
          }

          ${
            point.followUpNeeded
              ? ` • ${status}`
              : ''
          }

        </span>

      </div>


      ${
        renderCommentsBlock(
          point.comments,
          'REVIEWER COMMENTS'
        )
      }


      ${
        renderPhotosBlock(
          point.photos,
          'ATTACHED PHOTOS'
        )
      }


      ${
        point.followUpNeeded
          ? renderShipCommentsBlock(
              point.shipComments
            )
          : ''
      }

    </div>

  `;

}


/* =========================================================
   REVIEWER COMMENTS
========================================================= */

function renderCommentsBlock(
  comments,
  title
) {

  if (
    !comments ||
    !comments.length
  ) {

    return '';

  }


  return `

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
                style="
                  padding:7px 9px;
                  background:var(--vv-bg);
                  border-radius:6px;
                  font-size:11.5px;
                  line-height:1.4;
                  margin-bottom:4px;
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


/* =========================================================
   SHIP COMMENTS
========================================================= */

function renderShipCommentsBlock(
  comments
) {

  if (
    !comments ||
    !comments.length
  ) {

    return `

      <div
        style="
          margin-top:9px;
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
        margin-top:9px;
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
                  padding:7px 9px;
                  background:var(--status-green-bg);
                  border-left:3px solid var(--status-green);
                  border-radius:6px;
                  color:#285536;
                  font-size:11.5px;
                  line-height:1.4;
                  margin-bottom:4px;
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
   PHOTOS
========================================================= */

function renderPhotosBlock(
  photos,
  title = 'PHOTOS'
) {

  if (
    !photos ||
    !photos.length
  ) {

    return '';

  }


  return `

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
          margin-bottom:6px;
        "
      >

        ${escapeHtml(
          title
        )}

      </div>


      <div
        class="summary-photos"
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
                    width:96px;
                    height:96px;
                    overflow:hidden;
                    border:1px solid var(--vv-line);
                    border-radius:7px;
                    background:#fff;
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
   POINTS TO FOLLOW UP
========================================================= */

export function renderReportFollowUps(
  report
) {

  const container =
    document.getElementById(
      'report-followups-content'
    );


  if (!container) {

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


  const completed =
    points.filter(
      point =>
        point.shipComments.length > 0
    ).length;


  container.innerHTML = `

    <div
      style="
        margin-bottom:18px;
      "
    >

      ${renderReportHeader(
        report
      )}

    </div>


    <div
      style="
        padding:12px;
        background:var(--vv-bg);
        border-top:3px solid var(--vv-red);
        border-radius:7px;
        margin-bottom:18px;
      "
    >

      <strong>
        Points to Follow Up:
      </strong>

      ${points.length}


      <br>


      <strong>
        Responses Completed:
      </strong>

      ${completed}


    </div>


    ${
      points.length
        ? points
            .map(
              point =>
                renderFollowUpPoint(
                  point
                )
            )
            .join('')
        : `
            <div
              class="empty"
            >
              No points were marked
              Follow-Up Needed from Ship.
            </div>
          `
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
        style="
          color:var(--vv-squid);
          font-size:10px;
          font-weight:800;
          margin-bottom:4px;
        "
      >

        ${escapeHtml(
          point.section
        )}

      </div>


      <div
        style="
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
        style="
          margin-top:7px;
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
              ? 'FOLLOW-UP COMPLETED'
              : 'FOLLOW-UP OPEN'
          }

        </span>

      </div>


      ${
        renderCommentsBlock(
          point.comments,
          'REVIEWER COMMENTS'
        )
      }


      ${
        renderPhotosBlock(
          point.photos,
          'REVIEWER PHOTOS'
        )
      }


      ${
        renderShipCommentsBlock(
          point.shipComments
        )
      }

    </div>

  `;

}


/* =========================================================
   GET FOLLOW-UP POINT COUNT
========================================================= */

export function getFollowUpSummary(
  report
) {

  const points =
    getFollowUpPoints(
      report
    );


  const total =
    points.length;


  const completed =
    points.filter(
      point =>
        Array.isArray(
          point.shipComments
        ) &&
        point.shipComments.length > 0
    ).length;


  return {

    total,

    completed,

    open:
      total -
      completed

  };

}


/* =========================================================
   REPORT HAS FOLLOW-UP
========================================================= */

export function reportHasFollowUp(
  report
) {

  const points =
    getFollowUpPoints(
      report
    );


  return (
    points.length > 0
  );

}


/* =========================================================
   STATUS DESCRIPTION
========================================================= */

export function getReportStatusDescription(
  report
) {

  const color =
    statusColor(
      report
    );


  return {

    color,

    text:
      statusText(
        report
      ),

    needsFollowUp:
      reportNeedsFollowUp(
        report
      ),

    followUps:
      getFollowUpSummary(
        report
      )

  };

}


/* =========================================================
   REFRESH
========================================================= */

export async function refreshAllReports() {

  await renderOpenReports();

  await renderSubmittedReports();

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  renderOpenReports,

  renderSubmittedReports,

  renderReportOverall,

  renderReportFollowUps,

  openReportFromDatabase,

  getFollowUpSummary,

  reportHasFollowUp,

  getReportStatusDescription,

  refreshAllReports,

  setReportCallbacks

};
