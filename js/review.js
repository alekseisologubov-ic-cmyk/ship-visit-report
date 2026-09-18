/*
  ============================================================
  SHIP VISIT REPORT
  review.js
  ============================================================

  SHIP REVIEW

  Shows ONLY checklist points that were reviewed/checked.

  For each checked point:

  - Checklist point
  - Reviewer comments
  - Attached photos
  - Follow-Up Needed from Ship
  - Existing Ship response

  Unchecked points are NOT displayed.

  After review:
      SUBMIT REPORT
        |
        v
      Submitted Reports
*/


import {
  SECTIONS
} from './data.js';


import {
  getState,
  getMeta,
  getReviewer,
  getReportId,
  setReportStatus
} from './state.js';


import {
  saveOpenReport,
  submitReport
} from './supabase.js';


/* =========================================================
   CALLBACK
========================================================= */

let callbacks = {

  submitted: null

};


export function setReviewCallbacks(
  newCallbacks = {}
) {

  callbacks = {

    ...callbacks,

    ...newCallbacks

  };

}


/* =========================================================
   ESCAPE HTML
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
   GET CHECKED POINTS
========================================================= */

export function getCheckedReviewPoints() {

  const state =
    getState();


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


          /*
            ONLY CHECKED POINTS
          */

          if (
            !item ||
            !item.checked
          ) {

            return;

          }


          points.push({

            key,

            section:
              section.title,

            text,

            checked:
              true,

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
   GET FOLLOW-UP POINTS
========================================================= */

export function getReviewFollowUps() {

  return getCheckedReviewPoints()
    .filter(
      point =>
        point.followUpNeeded
    );

}


/* =========================================================
   COUNTS
========================================================= */

function getReviewCounts() {

  const points =
    getCheckedReviewPoints();


  const comments =
    points.reduce(
      (
        total,
        point
      ) =>
        total +
        point.comments.length +
        point.shipComments.length,
      0
    );


  const photos =
    points.reduce(
      (
        total,
        point
      ) =>
        total +
        point.photos.length,
      0
    );


  const followUps =
    points.filter(
      point =>
        point.followUpNeeded
    ).length;


  return {

    checked:
      points.length,

    comments,

    photos,

    followUps

  };

}


/* =========================================================
   RENDER SHIP REVIEW
========================================================= */

export function renderShipReview() {

  const container =
    document.getElementById(
      'ship-review-content'
    );


  if (
    !container
  ) {

    console.error(
      '#ship-review-content not found.'
    );

    return;

  }


  const meta =
    getMeta();


  const points =
    getCheckedReviewPoints();


  const counts =
    getReviewCounts();


  /*
    ---------------------------------------------------------
    HEADER
    ---------------------------------------------------------
  */

  let html = `

    <div
      style="
        margin-bottom:18px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:17px;
          font-weight:800;
          margin-bottom:5px;
        "
      >

        SHIP REVIEW

      </div>


      <div
        style="
          color:var(--vv-gray);
          font-size:12px;
          line-height:1.6;
        "
      >

        <b>Ship:</b>

        ${escapeHtml(
          meta.ship ||
          ''
        )}

        <br>

        <b>Visit:</b>

        ${escapeHtml(
          meta.dateOn ||
          ''
        )}

        ${
          meta.dateOff
            ? ` → ${escapeHtml(
                meta.dateOff
              )}`
            : ''
        }

        <br>

        <b>Reviewer:</b>

        ${escapeHtml(
          getReviewer() ||
          meta.reviewer ||
          ''
        )}

      </div>

    </div>


    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(3,1fr);
        gap:8px;
        margin-bottom:20px;
      "
    >

      ${renderStat(
        counts.checked,
        'CHECKED'
      )}

      ${renderStat(
        counts.comments,
        'COMMENTS'
      )}

      ${renderStat(
        counts.followUps,
        'FOLLOW-UPS'
      )}

    </div>

  `;


  /*
    ---------------------------------------------------------
    NO CHECKED POINTS
    ---------------------------------------------------------
  */

  if (
    points.length === 0
  ) {

    html += `

      <div
        style="
          padding:18px;
          background:var(--vv-bg);
          border-radius:8px;
          color:var(--vv-gray);
          text-align:center;
          font-size:13px;
          line-height:1.5;
        "
      >

        No checklist points have been checked yet.

        <br><br>

        Return to the checklist and mark the points
        you have reviewed.

      </div>

    `;


    container.innerHTML =
      html;


    renderCompleteReview();


    return;

  }


  /*
    ---------------------------------------------------------
    INTRODUCTION
    ---------------------------------------------------------
  */

  html += `

    <div
      style="
        margin-bottom:13px;
        color:var(--vv-gray);
        font-size:12px;
        line-height:1.5;
      "
    >

      The following points were reviewed.
      Please check the findings and follow-up requirements
      before submitting the report.

    </div>

  `;


  /*
    ---------------------------------------------------------
    DEPARTMENT GROUPS
    ---------------------------------------------------------
  */

  const groups =
    groupByDepartment(
      points
    );


  groups.forEach(
    group => {

      html += `

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

      `;


      group.points.forEach(
        point => {

          html +=
            renderReviewPoint(
              point
            );

        }
      );

    }
  );


  container.innerHTML =
    html;


  /*
    Complete review area.
  */

  renderCompleteReview();

}


/* =========================================================
   STAT BOX
========================================================= */

function renderStat(
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
          font-size:20px;
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
          font-weight:800;
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
   GROUP BY DEPARTMENT
========================================================= */

function groupByDepartment(
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


  return groups;

}


/* =========================================================
   REVIEW POINT
========================================================= */

function renderReviewPoint(
  point
) {

  const followUpComplete =
    point.followUpNeeded &&
    point.shipComments.length > 0;


  let html = `

    <div
      style="
        margin-bottom:13px;
        padding:14px;
        background:#fff;
        border:1px solid var(--vv-line);
        border-left:4px solid var(--vv-squid);
        border-radius:8px;
      "
    >

      <!-- POINT -->

      <div
        style="
          display:flex;
          align-items:flex-start;
          gap:9px;
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
            color:var(--vv-body);
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

  `;


  /*
    FOLLOW-UP
  */

  if (
    point.followUpNeeded
  ) {

    html += `

      <div
        style="
          margin-top:9px;
        "
      >

        <span
          class="status ${
            followUpComplete
              ? 'green'
              : 'blue'
          }"
        >

          ${
            followUpComplete
              ? 'SHIP FOLLOW-UP COMPLETED'
              : 'FOLLOW-UP NEEDED FROM SHIP'
          }

        </span>

      </div>

    `;

  }


  /*
    REVIEWER COMMENTS
  */

  if (
    point.comments.length
  ) {

    html += `

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

  } else {

    html += `

      <div
        style="
          margin-top:9px;
          color:var(--vv-gray);
          font-size:10px;
        "
      >

        No reviewer comment added.

      </div>

    `;

  }


  /*
    PHOTOS
  */

  if (
    point.photos.length
  ) {

    html += `

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
                      alt="Reviewer photo ${index + 1}"
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
    SHIP RESPONSE
  */

  if (
    point.followUpNeeded
  ) {

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

    `;

  }


  html += `

    </div>

  `;


  return html;

}


/* =========================================================
   COMPLETE REVIEW
========================================================= */

export function renderCompleteReview() {

  const container =
    document.getElementById(
      'ship-review-all'
    );


  if (
    !container
  ) {

    return;

  }


  const points =
    getCheckedReviewPoints();


  /*
    The previous version showed ALL points here.
    That was the problem.

    Now only checked points are shown.
  */

  if (
    points.length === 0
  ) {

    container.innerHTML =
      '';

    return;

  }


  container.innerHTML = `

    <div
      style="
        margin-top:20px;
        padding-top:16px;
        border-top:1px solid var(--vv-line);
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:14px;
          font-weight:800;
          margin-bottom:10px;
        "
      >

        REVIEWED POINTS

      </div>


      <div
        style="
          color:var(--vv-gray);
          font-size:11px;
          line-height:1.45;
          margin-bottom:10px;
        "
      >

        Only checklist points marked as reviewed
        are included in this report.

      </div>


      ${
        points
          .map(
            point =>
              renderCompactPoint(
                point
              )
          )
          .join('')
      }

    </div>

  `;

}


/* =========================================================
   COMPACT REVIEW POINT
========================================================= */

function renderCompactPoint(
  point
) {

  const completed =
    point.followUpNeeded &&
    point.shipComments.length > 0;


  return `

    <div
      style="
        margin-bottom:10px;
        padding:10px;
        background:var(--vv-bg);
        border-radius:7px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:9px;
          font-weight:800;
        "
      >

        ${escapeHtml(
          point.section
        )}

      </div>


      <div
        style="
          margin-top:3px;
          font-size:12px;
          line-height:1.4;
        "
      >

        ${escapeHtml(
          point.text
        )}

      </div>


      ${
        point.followUpNeeded
          ? `

            <div
              style="
                margin-top:5px;
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
                    ? 'FOLLOW-UP COMPLETED'
                    : 'FOLLOW-UP NEEDED'
                }

              </span>

            </div>

          `
          : ''
      }

    </div>

  `;

}


/* =========================================================
   SAVE BEFORE REVIEW
========================================================= */

export async function saveBeforeReview(){

  const reportId =
    getReportId();


  if (
    !reportId
  ) {

    return {

      success:false,

      error:
        new Error(
          'Report ID is missing.'
        )

    };

  }


  return saveOpenReport({

    reportId,

    meta:
      getMeta(),

    state:
      getState()

  });

}


/* =========================================================
   PREPARE SHIP REVIEW
========================================================= */

export async function prepareShipReview(){

  const saved =
    await saveBeforeReview();


  if (
    !saved.success
  ) {

    alert(
      'The report could not be saved before Ship Review.\n\n' +
      (
        saved.error?.message ||
        'Unknown error'
      )
    );


    return false;

  }


  renderShipReview();


  return true;

}


/* =========================================================
   SUBMIT REPORT
========================================================= */

export async function submitCurrentReport(){

  const reportId =
    getReportId();


  if (
    !reportId
  ) {

    alert(
      'No active report was found.'
    );


    return false;

  }


  const meta =
    getMeta();


  const state =
    getState();


  const result =
    await submitReport({

      reportId,

      meta,

      state

    });


  if (
    !result ||
    !result.success
  ) {

    alert(
      'The report could not be submitted.\n\n' +
      (
        result?.error?.message ||
        'Unknown error'
      )
    );


    return false;

  }


  /*
    Mark local state as submitted.
  */

  setReportStatus(
    'submitted'
  );


  /*
    Notify main.js.
  */

  if (
    callbacks.submitted
  ) {

    await callbacks.submitted(
      result.data
    );

  }


  return true;

}


/* =========================================================
   SUBMIT CONFIRMATION
========================================================= */

export function askSubmitConfirmation(){

  return window.confirm(
    'Submit this Ship Visit Report?\n\n' +
    'The report will move from Open Reports to Submitted Reports.'
  );

}


/* =========================================================
   REVIEW SUMMARY
========================================================= */

export function getReviewSummary(){

  const meta =
    getMeta();


  const counts =
    getReviewCounts();


  return {

    ship:
      meta.ship || '',

    dateOn:
      meta.dateOn || '',

    dateOff:
      meta.dateOff || '',

    reviewer:
      getReviewer() ||
      meta.reviewer ||
      '',

    checked:
      counts.checked,

    comments:
      counts.comments,

    photos:
      counts.photos,

    followUps:
      counts.followUps

  };

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  renderShipReview,

  renderCompleteReview,

  getCheckedReviewPoints,

  getReviewFollowUps,

  prepareShipReview,

  saveBeforeReview,

  submitCurrentReport,

  askSubmitConfirmation,

  getReviewSummary,

  setReviewCallbacks

};
