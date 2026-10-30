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
  getPhotoDisplayUrl,
  supabase
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
              Array.isArray(item.photos) ? item.photos : [],

            shipPhotos:
              Array.isArray(item.shipPhotos)
                ? item.shipPhotos
                : (Array.isArray(item.ship_photos) ? item.ship_photos : []),

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
  reviewPhotoRefs.clear();
  reviewPhotoSequence = 0;

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

  bindReviewPhotoButtons(container);

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
   REVIEW PHOTO PREVIEW + ORDERED PHOTO GROUPS
========================================================= */

const reviewPhotoRefs = new Map();
let reviewPhotoSequence = 0;

function reviewPhotoName(photo, index){
  if(photo && typeof photo === 'object'){
    const candidate = photo.filename || photo.fileName || photo.originalName || photo.name || photo.storagePath || photo.storage_path || photo.path;
    if(candidate) return String(candidate).split('/').pop();
  }
  if(typeof photo === 'string') return photo.split('/').pop().replace(/^storage:\/\//, '').split('/').pop();
  return `Photo ${index + 1}`;
}

function renderReviewPhotoGroup(photos, title, kind){
  if(!Array.isArray(photos) || photos.length === 0) return '';
  return `
    <div style="margin-top:11px;">
      <div class="response-label">${escapeHtml(title)}</div>
      <div style="display:grid;grid-template-columns:1fr;gap:7px;margin-top:6px;">
        ${photos.map((photo, index) => {
          const id = `review-photo-${++reviewPhotoSequence}`;
          reviewPhotoRefs.set(id, photo);
          const name = reviewPhotoName(photo, index);
          return `
            <button type="button" class="review-photo-open" data-review-photo-id="${id}" style="display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--vv-line);border-radius:8px;background:#fff;color:var(--vv-squid);text-align:left;cursor:pointer;">
              <span aria-hidden="true">▧</span>
              <strong style="overflow-wrap:anywhere;">${escapeHtml(name)}</strong>
              <span style="margin-left:auto;font-size:11px;font-weight:400;white-space:nowrap;">Click to preview</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function ensureReviewPhotoModal(){
  let overlay = document.getElementById('review-photo-modal');
  if(overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'review-photo-modal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(15,8,20,.92);display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
  overlay.innerHTML = `
    <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
      <button type="button" data-review-photo-close="true" aria-label="Close photo preview" style="position:absolute;right:0;top:0;width:44px;height:44px;border:1px solid #fff;border-radius:50%;background:#fff;color:#3C1053;font-size:28px;cursor:pointer;z-index:2;">×</button>
      <div data-review-photo-status="true" style="color:#fff;font:600 15px Arial,sans-serif;text-align:center;">Loading photo…</div>
      <img data-review-photo-image="true" alt="Report photo preview" style="display:none;max-width:96vw;max-height:90vh;width:auto;height:auto;object-fit:contain;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.5);" />
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { overlay.style.display = 'none'; const img=overlay.querySelector('[data-review-photo-image]'); img.removeAttribute('src'); document.body.style.overflow=''; };
  overlay.querySelector('[data-review-photo-close]').addEventListener('click', close);
  overlay.addEventListener('click', event => { if(event.target === overlay) close(); });
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && overlay.style.display !== 'none') close(); });
  overlay._closeReviewPhoto = close;
  return overlay;
}

function bindReviewPhotoButtons(root){
  root.querySelectorAll('button[data-review-photo-id]').forEach(button => {
    if(button.dataset.reviewPhotoBound === 'true') return;
    button.dataset.reviewPhotoBound = 'true';
    button.addEventListener('click', async () => {
      const photo = reviewPhotoRefs.get(button.dataset.reviewPhotoId);
      if(!photo) return;
      const overlay = ensureReviewPhotoModal();
      const img = overlay.querySelector('[data-review-photo-image]');
      const status = overlay.querySelector('[data-review-photo-status]');
      overlay.style.display = 'flex';
      img.style.display = 'none';
      img.removeAttribute('src');
      status.style.display = 'block';
      status.textContent = 'Loading photo…';
      document.body.style.overflow = 'hidden';
      try{
        const url = await getPhotoDisplayUrl(photo);
        if(!url) throw new Error('No valid photo URL was returned.');
        img.onload = () => { img.style.display='block'; status.style.display='none'; };
        img.onerror = () => { img.style.display='none'; status.style.display='block'; status.textContent='The photo link opened, but the image could not be displayed.'; };
        img.src = url;
        if(img.complete && img.naturalWidth > 0){ img.style.display='block'; status.style.display='none'; }
      }catch(error){
        console.error('Could not preview report photo:', error);
        status.style.display='block';
        status.textContent = `Could not load photo: ${error?.message || 'unknown error'}`;
      }
    });
  });
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
            <div style="margin-top:11px;">
              <div class="response-label">SHORESIDE COMMENTS</div>
              ${point.comments.map(comment => `
                <div class="comment">
                  <strong>${escapeHtml(comment.name || 'Reviewer')}:</strong>
                  ${escapeHtml(comment.text || '')}
                </div>
              `).join('')}
            </div>
          `
          : ''
      }

      ${renderReviewPhotoGroup(point.photos, 'SHORESIDE PHOTOS', 'shore')}

      ${
        point.shipComments.length
          ? `
            <div style="margin-top:11px;">
              <div class="response-label">SHIP RESPONSE</div>
              ${point.shipComments.map(comment => `
                <div class="ship-response-comment" style="margin-top:6px;padding:10px 12px;border-left:4px solid #16A36A;border-radius:8px;background:#EAF7EF;font-size:12px;line-height:1.5;">
                  <strong style="color:#007B50;">${escapeHtml(comment.name || comment.email || 'Shipboard')}:</strong>
                  <div>${escapeHtml(comment.text || comment.comment || '')}</div>
                  ${comment.timestamp || comment.created_at ? `<div style="margin-top:4px;color:#6B7280;font-size:10px;">${escapeHtml(comment.timestamp || comment.created_at)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          `
          : ''
      }

      ${renderReviewPhotoGroup(point.shipPhotos, 'SHIP RESPONSE PHOTOS', 'ship')}

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
