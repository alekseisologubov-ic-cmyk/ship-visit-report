/*
  ============================================================
  SHIP VISIT REPORT
  review.js
  ============================================================
*/


import {
  SECTIONS
} from './data.js';


import {
  getState,
  getMeta,
  getReviewer,
  getReportId
} from './state.js';


import {
  saveOpenReport,
  sendToShipReview
} from './supabase.js';


/* =========================================================
   CALLBACKS
========================================================= */

let callbacks = {

  sentToShip:null

};


export function setReviewCallbacks(
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
   CHECKED POINTS
========================================================= */

export function getCheckedReviewPoints(){

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
            Only points marked checked
            are sent to Ship Review.
          */

          if(
            !item ||
            !item.checked
          ){

            return;

          }


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
   RENDER
========================================================= */

export function renderShipReview(){

  const container =
    document.getElementById(
      'ship-review-content'
    );


  if(
    !container
  ){

    return;

  }


  const meta =
    getMeta();


  const points =
    getCheckedReviewPoints();


  const followUps =
    points.filter(
      point =>
        point.followUpNeeded
    );


  let html = `

    <div
      style="
        margin-bottom:16px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:17px;
          font-weight:800;
        "
      >

        READY TO SEND TO SHIP

      </div>


      <div
        style="
          margin-top:5px;
          color:var(--vv-gray);
          font-size:12px;
          line-height:1.6;
        "
      >

        <b>Ship:</b>
        ${escapeHtml(meta.ship)}

        <br>

        <b>Visit:</b>
        ${escapeHtml(meta.dateOn)}

        ${
          meta.dateOff
            ? ` → ${escapeHtml(meta.dateOff)}`
            : ''
        }

        <br>

        <b>Reviewer:</b>
        ${escapeHtml(
          getReviewer() ||
          meta.reviewer
        )}

      </div>

    </div>

  `;


  if(
    points.length === 0
  ){

    html += `

      <div
        class="empty"
      >

        No checklist points have been checked.

      </div>

    `;


    container.innerHTML =
      html;


    return;

  }


  html += `

    <div
      style="
        margin-bottom:15px;
        padding:12px;
        background:var(--vv-bg);
        border-radius:8px;
        font-size:12px;
        line-height:1.6;
      "
    >

      <b>
        ${points.length}
      </b>

      checked point(s)

      <br>

      <b>
        ${followUps.length}
      </b>

      point(s) require ship follow-up.

    </div>

  `;


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


      if(
        !group
      ){

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


  const bottom =
    document.getElementById(
      'ship-review-all'
    );


  if(
    bottom
  ){

    bottom.innerHTML = `

      <div
        style="
          margin-top:16px;
          padding-top:15px;
          border-top:1px solid var(--vv-line);
        "
      >

        <div
          style="
            color:var(--vv-squid);
            font-size:14px;
            font-weight:800;
          "
        >

          SEND REPORT TO SHIP

        </div>


        <div
          style="
            margin-top:5px;
            color:var(--vv-gray);
            font-size:11px;
            line-height:1.5;
          "
        >

          After sending, this report will appear
          in Ship Response Report. The ship will
          enter the response for each follow-up
          point and submit the report.

        </div>

      </div>

    `;

  }

}


/* =========================================================
   REVIEW POINT
========================================================= */

function renderReviewPoint(
  point
){

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

      <div
        style="
          display:flex;
          gap:9px;
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

  `;


  if(
    point.followUpNeeded
  ){

    html += `

      <div
        style="
          margin-top:9px;
        "
      >

        <span class="status blue">

          FOLLOW-UP NEEDED FROM SHIP

        </span>

      </div>

    `;

  }


  if(
    point.comments.length
  ){

    html += `

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

    `;

  }


  if(
    point.photos.length
  ){

    html += `

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


  html += `

    </div>

  `;


  return html;

}


/* =========================================================
   SAVE BEFORE REVIEW
========================================================= */

async function saveBeforeReview(){

  const reportId =
    getReportId();


  if(
    !reportId
  ){

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
   PREPARE
========================================================= */

export async function prepareShipReview(){

  const saved =
    await saveBeforeReview();


  if(
    !saved ||
    !saved.success
  ){

    alert(
      'Could not save the report before Ship Review.\n\n' +
      (
        saved?.error?.message ||
        'Unknown error'
      )
    );


    return false;

  }


  renderShipReview();


  return true;

}


/* =========================================================
   SEND CURRENT REPORT TO SHIP
========================================================= */

export async function sendCurrentReportToShip(){

  const reportId =
    getReportId();


  if(
    !reportId
  ){

    alert(
      'No active report was found.'
    );


    return false;

  }


  const points =
    getCheckedReviewPoints();


  if(
    points.length === 0
  ){

    alert(
      'Please check at least one checklist point before sending the report.'
    );


    return false;

  }


  const confirmed =
    window.confirm(
      'Send this report to the ship?\n\n' +
      'The report will move to Ship Response Report.'
    );


  if(
    !confirmed
  ){

    return false;

  }


  const result =
    await sendToShipReview({

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

    alert(
      'The report could not be sent to the ship.\n\n' +
      (
        result?.error?.message ||
        'Unknown error'
      )
    );


    return false;

  }


  if(
    callbacks.sentToShip
  ){

    await callbacks.sentToShip(
      result.data
    );

  }


  return true;

}


/* =========================================================
   COMPATIBILITY
========================================================= */

export async function submitCurrentReport(){

  return sendCurrentReportToShip();

}


/* =========================================================
   DEFAULT
========================================================= */

export default {

  renderShipReview,

  getCheckedReviewPoints,

  prepareShipReview,

  sendCurrentReportToShip,

  submitCurrentReport,

  setReviewCallbacks

};
