/*
  ============================================================
  VIRGIN VOYAGES
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
  getDepartmentGeneralComments,
  getReportId
} from './state.js';


import {
  saveOpenReport,
  sendToShipReview,
  supabase,
  getPhotoDisplayUrl
} from './supabase.js';


/* =========================================================
   CALLBACKS
========================================================= */

let callbacks = {

  sentToShip:null

};

const reviewPhotoRefs = new Map();
let reviewPhotoCounter = 0;
function reviewPhotoName(photo, index = 0){
  let raw = photo && typeof photo === 'object'
    ? (photo.filename || photo.fileName || photo.originalName || photo.name || photo.storagePath || photo.storage_path || photo.path || '')
    : (typeof photo === 'string' ? photo.replace(/^storage:\/\//, '') : '');
  raw = String(raw || '').split(/[?#]/, 1)[0].replace(/\\/g, '/').split('/').pop();
  try { raw = decodeURIComponent(raw); } catch (_) {}
  return raw || `Photo ${index + 1}`;
}
function reviewPhotoButton(photo, index = 0){
  const id = `review-photo-${++reviewPhotoCounter}`;
  reviewPhotoRefs.set(id, photo);
  return `<button type="button" class="response-photo-open" data-review-photo-id="${id}"><span aria-hidden="true">▧</span><span>${escapeHtml(reviewPhotoName(photo,index))}</span><span class="response-photo-hint">Click to preview</span></button>`;
}
function bindReviewPhotoPreview(root){
  if(!document.getElementById('review-photo-preview-style')){
    const style = document.createElement('style');
    style.id = 'review-photo-preview-style';
    style.textContent = '#review-photo-preview[hidden]{display:none!important}#review-photo-preview{position:fixed;inset:0;z-index:10020;background:rgba(12,5,18,.94);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}#review-photo-preview img{max-width:96vw;max-height:88vh;object-fit:contain;border-radius:8px}#review-photo-preview button{position:absolute;top:18px;right:20px;width:44px;height:44px;border-radius:50%;font-size:28px;background:#fff;color:#3C1053;border:1px solid #ddd;cursor:pointer}#review-photo-preview-status{color:white;text-align:center;padding:16px}';
    document.head.appendChild(style);
  }
  let overlay = document.getElementById('review-photo-preview');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'review-photo-preview';
    overlay.hidden = true;
    overlay.innerHTML = '<button type="button" aria-label="Close photo preview">×</button><div id="review-photo-preview-status">Loading photo…</div><img alt="Report photo preview" hidden>';
    document.body.appendChild(overlay);
    const close = () => { overlay.hidden = true; overlay.querySelector('img').removeAttribute('src'); };
    overlay.querySelector('button').addEventListener('click', close);
    overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !overlay.hidden) close(); });
  }
  root.querySelectorAll('[data-review-photo-id]').forEach(button => {
    if(button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', async () => {
      const photo = reviewPhotoRefs.get(button.dataset.reviewPhotoId);
      if(!photo) return;
      const status = overlay.querySelector('#review-photo-preview-status');
      const img = overlay.querySelector('img');
      overlay.hidden = false; img.hidden = true; img.removeAttribute('src'); status.hidden = false; status.textContent = 'Loading photo…';
      try {
        const url = await getPhotoDisplayUrl(photo);
        if(!url) throw new Error('Photo reference is missing.');
        img.onload = () => { img.hidden = false; status.hidden = true; };
        img.onerror = () => { img.hidden = true; status.hidden = false; status.textContent = 'The image could not be displayed. Check its saved Storage reference.'; };
        img.src = url;
      } catch(error) {
        status.hidden = false; status.textContent = `Could not load photo: ${error?.message || 'unknown error'}`;
      }
    });
  });
}



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
   GET CHECKED POINTS
========================================================= */

export function getCheckedReviewPoints(){

  const state =
    getState();


  const points = [];


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
   RENDER SHIP REVIEW
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

        REPORT READY FOR SHIP REVIEW

      </div>


      <div
        style="
          margin-top:6px;
          color:var(--vv-gray);
          font-size:12px;
          line-height:1.6;
        "
      >

        <b>Ship:</b>

        ${escapeHtml(
          meta.ship
        )}

        <br>

        <b>Visit:</b>

        ${escapeHtml(
          meta.dateOn
        )}

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


  const departmentsWithComments = SECTIONS.filter(
    section => getDepartmentGeneralComments(section.id).length > 0
  );

  if(
    points.length === 0 &&
    departmentsWithComments.length === 0
  ){

    container.innerHTML = `
      <div class="empty">
        No checklist points have been checked.
      </div>
    `;

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


  const groups = [];


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


  SECTIONS.forEach(section => {

    const group = groups.find(item => item.section === section.title);
    const generalComments = getDepartmentGeneralComments(section.id);

    if((!group || group.points.length === 0) && !generalComments.length){
      return;
    }

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
        ${escapeHtml(section.title)}
      </div>
    `;

    if(generalComments.length){
      html += `
        <div
          style="
            margin-bottom:10px;
            padding:10px 12px;
            border-left:4px solid var(--vv-squid);
            border-radius:8px;
            background:#F8F5FA;
          "
        >
          <div class="response-label">GENERAL COMMENTS</div>
          ${generalComments.map(comment => `
            <div style="margin-top:6px;font-size:11px;line-height:1.5;color:var(--vv-body);">
              <strong>${escapeHtml(comment.name || 'Reviewer')}:</strong>
              ${escapeHtml(comment.text || '')}
            </div>
          `).join('')}
        </div>
      `;
    }

    if(group){
      group.points.forEach(point => {
        html += renderReviewPoint(point);
      });
    }

  });


  container.innerHTML =
    html;
  bindReviewPhotoPreview(container);


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
          padding:14px;
          background:var(--vv-bg);
          border-radius:8px;
        "
      >

        <div
          style="
            color:var(--vv-squid);
            font-size:14px;
            font-weight:800;
          "
        >

          READY TO SEND

        </div>


        <div
          style="
            margin-top:5px;
            color:var(--vv-gray);
            font-size:11px;
            line-height:1.5;
          "
        >

          After sending, this report will leave
          Open Reports and appear in
          Ship Response Report.

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


      ${
        point.followUpNeeded
          ? `

            <div
              style="
                margin-top:9px;
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
                margin-top:11px;
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

          `
          : ''
      }


      ${
        point.photos.length
          ? `

            <div
              style="
                margin-top:11px;
              "
            >

              <div
                class="response-label"
              >

                ATTACHED PHOTOS

              </div>


              <div
                class="response-photos"
              >

                ${
                  point.photos
                    .map((photo, photoIndex) => `<div class="response-photo">${reviewPhotoButton(photo, photoIndex)}</div>`)
                    .join('')
                }

              </div>

            </div>

          `
          : ''
      }


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
   PREPARE SHIP REVIEW
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


  /*
    Save one final time.
  */

  const saved =
    await saveOpenReport({

      reportId,

      meta:
        getMeta(),

      state:
        getState()

    });


  if(
    !saved ||
    !saved.success
  ){

    alert(
      'Could not save the report before sending it to the ship.'
    );


    return false;

  }


  const confirmed =
    window.confirm(
      'Send this report to the ship?\n\n' +
      'It will leave Open Reports and move to Ship Response Report.'
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


  /*
    The report is now in SHIP REVIEW.
    Trigger the deployed Supabase Edge Function
    so the notification email is sent automatically.

    TEST MODE: the Edge Function currently sends
    the email to Aleksei's test address only.
  */

  let emailResult;

  try{

    emailResult =
      await supabase.functions.invoke(
        'send-ship-report',
        {
          body:{
            reportId
          }
        }
      );

  }catch(error){

    console.error(
      'send-ship-report invocation failed:',
      error
    );


    alert(
      'The report was moved to Ship Response, but the email could not be sent.\n\n' +
      (
        error?.message ||
        'Unknown email error'
      )
    );


    return false;

  }


  if(
    emailResult?.error
  ){

    console.error(
      'send-ship-report returned an error:',
      emailResult.error
    );


    alert(
      'The report was moved to Ship Response, but the email could not be sent.\n\n' +
      (
        emailResult.error.message ||
        'Unknown email error'
      )
    );


    return false;

  }


  if(
    !emailResult?.data?.success
  ){

    console.error(
      'send-ship-report failed:',
      emailResult?.data
    );


    alert(
      'The report was moved to Ship Response, but the email could not be sent.\n\n' +
      (
        emailResult?.data?.error ||
        'Unknown email error'
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
