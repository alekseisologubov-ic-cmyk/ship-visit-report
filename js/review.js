/*
  review.js

  Handles the SHIP REVIEW stage.

  Flow:

  OPEN REPORT
      ↓
  Reviewer completes checklist
      ↓
  SHIP REVIEW
      ↓
  Reviewer sees:
    - All points
    - Reviewer comments
    - Reviewer photos
    - Points marked Follow-Up Needed
      ↓
  SUBMIT REPORT
      ↓
  SUBMITTED REPORT
*/

import {
  SECTIONS
} from './data.js';


import {
  getState,
  getMeta,
  getReviewer,
  getReportId,
  setReportStatus,
  getReportStatus
} from './state.js';


import {
  saveOpenReport,
  submitReport
} from './supabase.js';


/* =========================================================
   CALLBACK
========================================================= */

let onSubmitted = null;


export function setReviewCallbacks({
  submitted
} = {}) {

  onSubmitted =
    typeof submitted === 'function'
      ? submitted
      : null;

}


/* =========================================================
   ESCAPE
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
   REVIEW COUNTS
========================================================= */

function getReviewCounts() {

  const state =
    getState();


  let total =
    0;

  let checked =
    0;

  let comments =
    0;

  let photos =
    0;

  let followUps =
    0;


  Object.values(
    state
  ).forEach(
    item => {

      total++;


      if (
        item.checked
      ) {

        checked++;

      }


      if (
        Array.isArray(
          item.comments
        )
      ) {

        comments +=
          item.comments.length;

      }


      if (
        Array.isArray(
          item.photos
        )
      ) {

        photos +=
          item.photos.length;

      }


      if (
        item.followUpNeeded
      ) {

        followUps++;

      }

    }
  );


  return {

    total,

    checked,

    comments,

    photos,

    followUps

  };

}


/* =========================================================
   FOLLOW-UP POINTS
========================================================= */

export function getFollowUpPoints() {

  const state =
    getState();


  const points =
    [];


  SECTIONS.forEach(
    section => {

      section.items.forEach(
        (text,index) => {

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
   ALL REPORT POINTS
========================================================= */

export function getAllReportPoints() {

  const state =
    getState();


  const points =
    [];


  SECTIONS.forEach(
    section => {

      section.items.forEach(
        (text,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


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

    return;

  }


  const meta =
    getMeta();


  const counts =
    getReviewCounts();


  const followUps =
    getFollowUpPoints();


  container.innerHTML =
    `

      <div
        class="review-header"
        style="
          margin-bottom:18px;
        "
      >

        <div
          style="
            color:var(--vv-squid);
            font-size:15px;
            font-weight:800;
            margin-bottom:6px;
          "
        >
          ${escapeHtml(
            meta.ship
          )}
        </div>


        <div
          style="
            color:var(--vv-gray);
            font-size:12px;
            line-height:1.5;
          "
        >

          Visit:
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

          Reviewer:
          ${escapeHtml(
            getReviewer() ||
            meta.reviewer ||
            ''
          )}

        </div>

      </div>


      <div
        class="review-summary-box"
        style="
          display:grid;
          grid-template-columns:
            repeat(4,1fr);
          gap:8px;
          margin-bottom:20px;
        "
      >

        <div
          style="
            background:var(--vv-bg);
            border-top:3px solid var(--vv-red);
            border-radius:6px;
            padding:10px;
          "
        >

          <div
            style="
              font-size:20px;
              font-weight:800;
            "
          >
            ${counts.checked}
          </div>

          <div
            style="
              color:var(--vv-gray);
              font-size:9px;
              font-weight:700;
            "
          >
            REVIEWED
          </div>

        </div>


        <div
          style="
            background:var(--vv-bg);
            border-top:3px solid var(--vv-red);
            border-radius:6px;
            padding:10px;
          "
        >

          <div
            style="
              font-size:20px;
              font-weight:800;
            "
          >
            ${counts.total}
          </div>

          <div
            style="
              color:var(--vv-gray);
              font-size:9px;
              font-weight:700;
            "
          >
            TOTAL
          </div>

        </div>


        <div
          style="
            background:var(--vv-bg);
            border-top:3px solid var(--vv-red);
            border-radius:6px;
            padding:10px;
          "
        >

          <div
            style="
              font-size:20px;
              font-weight:800;
            "
          >
            ${counts.comments}
          </div>

          <div
            style="
              color:var(--vv-gray);
              font-size:9px;
              font-weight:700;
            "
          >
            COMMENTS
          </div>

        </div>


        <div
          style="
            background:var(--vv-bg);
            border-top:3px solid var(--vv-red);
            border-radius:6px;
            padding:10px;
          "
        >

          <div
            style="
              font-size:20px;
              font-weight:800;
            "
          >
            ${counts.followUps}
          </div>

          <div
            style="
              color:var(--vv-gray);
              font-size:9px;
              font-weight:700;
            "
          >
            FOLLOW-UPS
          </div>

        </div>

      </div>


      <div
        style="
          color:var(--vv-squid);
          font-size:16px;
          font-weight:800;
          margin-bottom:12px;
        "
      >
        Points to Follow Up
      </div>


      ${
        followUps.length
          ? followUps
              .map(
                point =>
                  renderFollowUpPoint(
                    point
                  )
              )
              .join('')
          : `
              <div
                style="
                  padding:18px;
                  background:var(--vv-bg);
                  border-radius:8px;
                  color:var(--vv-gray);
                  font-size:13px;
                "
              >
                No points were marked
                Follow-Up Needed from Ship.
              </div>
            `
      }


      <div
        style="
          margin-top:24px;
          padding-top:18px;
          border-top:1px solid var(--vv-line);
        "
      >

        <div
          style="
            color:var(--vv-squid);
            font-size:15px;
            font-weight:800;
            margin-bottom:8px;
          "
        >
          Reviewer Confirmation
        </div>


        <p
          style="
            margin:0;
            color:var(--vv-gray);
            font-size:12px;
            line-height:1.5;
          "
        >
          Review the follow-up points above.
          Once the report is ready, submit it
          to move it from Open Reports to
          Submitted Reports.
        </p>

      </div>

    `;

}


/* =========================================================
   RENDER FOLLOW-UP POINT
========================================================= */

function renderFollowUpPoint(
  point
) {

  return `

    <div
      class="review-followup"
      style="
        margin-bottom:14px;
        padding:15px;
        border:1.5px solid var(--vv-line);
        border-radius:10px;
        background:#fff;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:10px;
          font-weight:800;
          letter-spacing:.05em;
          margin-bottom:5px;
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
          margin-bottom:9px;
        "
      >
        ${escapeHtml(
          point.text
        )}
      </div>


      <div
        style="
          display:inline-block;
          padding:4px 8px;
          border-radius:15px;
          background:#fff0f0;
          color:var(--vv-red);
          font-size:9px;
          font-weight:800;
          margin-bottom:10px;
        "
      >
        FOLLOW-UP NEEDED FROM SHIP
      </div>


      ${
        point.comments.length
          ? `

            <div
              style="
                margin-top:7px;
              "
            >

              <div
                style="
                  color:var(--vv-squid);
                  font-size:10px;
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
                        style="
                          padding:7px 9px;
                          background:var(--vv-bg);
                          border-radius:6px;
                          font-size:12px;
                          line-height:1.4;
                          margin-bottom:5px;
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
                  font-size:10px;
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
                            width:100px;
                            height:100px;
                            overflow:hidden;
                            border:1px solid var(--vv-line);
                            border-radius:7px;
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


      ${
        point.shipComments.length
          ? `

            <div
              style="
                margin-top:12px;
              "
            >

              <div
                style="
                  color:var(--status-green);
                  font-size:10px;
                  font-weight:800;
                  margin-bottom:5px;
                "
              >
                EXISTING SHIP COMMENTS
              </div>


              ${
                point.shipComments
                  .map(
                    comment => `

                      <div
                        style="
                          padding:7px 9px;
                          background:var(--status-green-bg);
                          border-left:3px solid var(--status-green);
                          border-radius:6px;
                          font-size:12px;
                          line-height:1.4;
                          margin-bottom:5px;
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

    </div>

  `;

}


/* =========================================================
   RENDER ALL POINTS FOR REVIEW
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
    getAllReportPoints();


  container.innerHTML =
    points
      .map(
        point => `

          <div
            style="
              padding:13px 0;
              border-top:1px solid var(--vv-line);
            "
          >

            <div
              style="
                color:var(--vv-squid);
                font-size:10px;
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
                font-size:13px;
                line-height:1.45;
              "
            >
              ${escapeHtml(
                point.text
              )}
            </div>


            <div
              style="
                margin-top:5px;
                color:${
                  point.checked
                    ? '#555'
                    : 'var(--vv-red)'
                };
                font-size:10px;
                font-weight:700;
              "
            >
              ${
                point.checked
                  ? 'CHECKED'
                  : 'NOT CHECKED'
              }

              ${
                point.followUpNeeded
                  ? ' • FOLLOW-UP'
                  : ''
              }

            </div>


            ${
              point.comments.length
                ? `

                  <div
                    style="
                      margin-top:6px;
                      color:var(--vv-gray);
                      font-size:11.5px;
                    "
                  >

                    ${
                      point.comments
                        .map(
                          comment =>
                            `

                              <div
                                style="
                                  margin-bottom:3px;
                                "
                              >

                                <strong>
                                  ${escapeHtml(
                                    comment.name ||
                                    'Reviewer'
                                  )}:
                                </strong>

                                ${escapeHtml(
                                  comment.text
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
                      display:flex;
                      gap:6px;
                      flex-wrap:wrap;
                      margin-top:7px;
                    "
                  >

                    ${
                      point.photos
                        .map(
                          photo =>
                            `

                              <img
                                src="${photo}"
                                style="
                                  width:70px;
                                  height:70px;
                                  object-fit:cover;
                                  border-radius:6px;
                                  border:1px solid var(--vv-line);
                                "
                                alt="Reviewer photo"
                              >

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
                    style="
                      margin-top:7px;
                      padding:7px 9px;
                      background:var(--status-green-bg);
                      border-left:3px solid var(--status-green);
                      border-radius:6px;
                      color:#285536;
                      font-size:11.5px;
                    "
                  >

                    ${
                      point.shipComments
                        .map(
                          comment =>
                            `

                              <div
                                style="
                                  margin-bottom:3px;
                                "
                              >

                                <strong>
                                  ${escapeHtml(
                                    comment.name ||
                                    'Ship'
                                  )}:
                                </strong>

                                ${escapeHtml(
                                  comment.text
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

          </div>

        `
      )
      .join('');

}


/* =========================================================
   SAVE BEFORE SHIP REVIEW
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


  const result =
    await saveOpenReport({

      reportId,

      meta:
        getMeta(),

      state:
        getState()

    });


  return result;

}


/* =========================================================
   PREPARE REVIEW
========================================================= */

export async function prepareShipReview(){

  const saved =
    await saveBeforeReview();


  if (
    !saved.success
  ) {

    return false;

  }


  renderShipReview();

  renderCompleteReview();

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

    showSubmitError(
      'No report is currently open.'
    );

    return false;

  }


  const meta =
    getMeta();


  const state =
    getState();


  /*
    Final save as submitted.
  */

  const result =
    await submitReport({

      reportId,

      meta,

      state

    });


  if (
    !result.success
  ) {

    showSubmitError(
      result.error?.message ||
      'The report could not be submitted.'
    );


    return false;

  }


  /*
    Update local state.
  */

  setReportStatus(
    'submitted'
  );


  /*
    Notify main application.
  */

  if (
    onSubmitted
  ) {

    await onSubmitted(
      result.data
    );

  }


  return true;

}


/* =========================================================
   SUBMIT ERROR
========================================================= */

function showSubmitError(
  message
){

  alert(
    `Could not submit report.\n\n${message}`
  );

}


/* =========================================================
   SUBMIT CONFIRMATION
========================================================= */

export function askSubmitConfirmation(){

  return confirm(
    'Submit this Ship Visit Report?\n\n' +
    'After submission, the report will move from Open Reports to Submitted Reports.'
  );

}


/* =========================================================
   REVIEWER SIGN-OFF
========================================================= */

export function getReviewSummary(){

  const counts =
    getReviewCounts();


  const meta =
    getMeta();


  const followUps =
    getFollowUpPoints();


  return {

    ship:
      meta.ship,

    dateOn:
      meta.dateOn,

    dateOff:
      meta.dateOff,

    reviewer:
      getReviewer() ||
      meta.reviewer,

    total:
      counts.total,

    checked:
      counts.checked,

    comments:
      counts.comments,

    photos:
      counts.photos,

    followUps:
      followUps.length,

    readyToSubmit:
      Boolean(
        meta.ship &&
        (
          getReviewer() ||
          meta.reviewer
        )
      )

  };

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  renderShipReview,

  renderCompleteReview,

  getFollowUpPoints,

  getAllReportPoints,

  prepareShipReview,

  saveBeforeReview,

  submitCurrentReport,

  askSubmitConfirmation,

  getReviewSummary,

  setReviewCallbacks

};
