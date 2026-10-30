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
  getReport,
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

  // Photo lightbox: click any reviewer photo to open it in a popup.
  // Use event delegation so it continues working after rerenders.
  if (!container.dataset.photoPreviewBound) {
    container.dataset.photoPreviewBound = 'true';
    container.addEventListener('click', event => {
      const trigger = event.target.closest('.ship-review-photo-preview-trigger');
      if (!trigger) return;
      const src = trigger.dataset.photoSrc;
      if (!src) {
        alert('The photo URL is not available for preview.');
        return;
      }
      let modal = document.getElementById('ship-review-photo-lightbox');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ship-review-photo-lightbox';
        modal.innerHTML = `
          <div class="ship-review-photo-lightbox-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;" role="dialog" aria-modal="true" aria-label="Photo preview">
            <div style="position:relative;max-width:95vw;max-height:94vh;display:flex;flex-direction:column;align-items:center;gap:10px;">
              <button type="button" class="ship-review-photo-lightbox-close" aria-label="Close photo preview" style="align-self:flex-end;border:1px solid #fff;background:#fff;color:#321044;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;">Close ✕</button>
              <div class="ship-review-photo-lightbox-name" style="color:#fff;font-size:14px;overflow-wrap:anywhere;"></div>
              <img class="ship-review-photo-lightbox-image" alt="Photo preview" style="display:block;max-width:92vw;max-height:80vh;object-fit:contain;border-radius:8px;background:#fff;">
            </div>
          </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => {
          if (e.target === modal || e.target.classList.contains('ship-review-photo-lightbox-backdrop') || e.target.closest('.ship-review-photo-lightbox-close')) modal.style.display = 'none';
        });
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape') modal.style.display = 'none';
        });
      }
      modal.querySelector('.ship-review-photo-lightbox-image').src = src;
      modal.querySelector('.ship-review-photo-lightbox-name').textContent = trigger.dataset.photoName || 'Report photo';
      modal.style.display = 'block';
    });
  }


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
                    .map(
                      photo => `

                        <div class="response-photo">

                          <button
                            type="button"
                            class="ship-review-photo-preview-trigger"
                            data-photo-src="${escapeHtml(typeof photo === 'string' ? photo : (photo?.url || photo?.signedUrl || photo?.signed_url || photo?.publicUrl || photo?.public_url || photo?.path || photo?.storagePath || photo?.storage_path || ''))}"
                            data-photo-name="${escapeHtml(typeof photo === 'string' ? (photo.split('/').pop().split('?')[0] || 'Report photo') : (photo?.filename || photo?.name || 'Report photo'))}"
                            aria-label="Click to preview photo"
                            style="border:0;background:transparent;padding:0;cursor:zoom-in;max-width:100%;"
                          >
                            <img
                              src="${escapeHtml(typeof photo === 'string' ? photo : (photo?.url || photo?.signedUrl || photo?.signed_url || photo?.publicUrl || photo?.public_url || photo?.path || photo?.storagePath || photo?.storage_path || ''))}"
                              alt="${escapeHtml(typeof photo === 'string' ? (photo.split('/').pop().split('?')[0] || 'Report photo') : (photo?.filename || photo?.name || 'Report photo'))}"
                              style="cursor:zoom-in;max-width:100%;height:auto;"
                            >
                          </button>

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
    Shipboard photos are saved by a separate secure RPC. The checklist
    state in this browser can be older than the database state, so fetch
    the latest report and merge its shipPhotos into the outgoing state
    before saving or changing the status. This prevents the final save
    from overwriting photo references added by shipboard users.
  */
  let outgoingState = JSON.parse(JSON.stringify(getState() || {}));
  const latestResult = await getReport(reportId);
  if (!latestResult?.success || !latestResult.data) {
    alert('Could not verify the latest saved report before sending. Please retry.');
    return false;
  }
  const latestState = latestResult.data?.report_data?.state || {};
  for (const [key, latestItem] of Object.entries(latestState)) {
    if (!latestItem || !Array.isArray(latestItem.shipPhotos) || latestItem.shipPhotos.length === 0) continue;
    const localItem = outgoingState[key] && typeof outgoingState[key] === 'object' ? outgoingState[key] : {};
    const localPhotos = Array.isArray(localItem.shipPhotos) ? localItem.shipPhotos : [];
    const seen = new Set(localPhotos.map(photo => {
      if (typeof photo === 'string') return photo;
      return String(photo?.path || photo?.storagePath || photo?.storage_path || photo?.filename || '');
    }));
    const mergedPhotos = [...localPhotos];
    for (const photo of latestItem.shipPhotos) {
      const identity = typeof photo === 'string' ? photo : String(photo?.path || photo?.storagePath || photo?.storage_path || photo?.filename || '');
      if (!seen.has(identity)) { mergedPhotos.push(photo); seen.add(identity); }
    }
    outgoingState[key] = { ...localItem, shipPhotos: mergedPhotos };
  }

  const saved =
    await saveOpenReport({
      reportId,
      meta: getMeta(),
      state: outgoingState
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


  // Use the same merged state for the status transition; do not fall back
  // to getState(), which may not contain shipboard-uploaded photo references.
  const result =
    await sendToShipReview({
      reportId,
      meta: getMeta(),
      state: outgoingState
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
