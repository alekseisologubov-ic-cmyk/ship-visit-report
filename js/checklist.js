/*
  checklist.js

  Handles the checklist screen.

  Responsibilities:
  - Render Culinary / Bar / Restaurant / Procurement / Sanitation
  - Check and uncheck points
  - Add reviewer comments
  - Add photos
  - Mark Follow-Up Needed from Ship
  - Display existing ship comments
  - Save changes to Supabase
*/


import {
  SECTIONS
} from './data.js';


import {
  getState,
  getItem,
  toggleChecked,
  addReviewerComment,
  addPhoto,
  removePhoto,
  setFollowUp,
  getMeta,
  getReviewer,
  getReportId
} from './state.js';


import {
  saveOpenReport
} from './supabase.js';


/* =========================================================
   MODULE CALLBACKS
========================================================= */

/*
  main.js can register a callback here to update
  the global application UI after checklist changes.
*/

let onChecklistChanged = null;


export function setChecklistChangedCallback(
  callback
) {

  onChecklistChanged =
    typeof callback === 'function'
      ? callback
      : null;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

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
   TOAST
========================================================= */

function showMessage(
  message
) {

  let element =
    document.getElementById(
      'checklist-toast'
    );


  if (!element) {

    element =
      document.createElement(
        'div'
      );


    element.id =
      'checklist-toast';


    element.style.cssText = `
      position:fixed;
      left:50%;
      bottom:90px;
      transform:translateX(-50%);
      z-index:99999;
      max-width:90%;
      padding:10px 15px;
      border-radius:8px;
      background:#1B1B1B;
      color:#fff;
      font-size:12px;
      box-shadow:0 4px 14px rgba(0,0,0,.25);
      pointer-events:none;
    `;


    document.body.appendChild(
      element
    );

  }


  element.textContent =
    message;


  element.style.display =
    'block';


  clearTimeout(
    element._timer
  );


  element._timer =
    setTimeout(
      () => {

        element.style.display =
          'none';

      },
      2500
    );

}


/* =========================================================
   SAVE CURRENT REPORT
========================================================= */

async function saveCurrentReport() {

  const reportId =
    getReportId();


  if (!reportId) {

    showMessage(
      'Start the report before saving checklist changes.'
    );

    return false;

  }


  const meta =
    getMeta();


  const state =
    getState();


  const result =
    await saveOpenReport({

      reportId,

      meta,

      state

    });


  if (
    !result.success
  ) {

    showMessage(
      'Could not save the report.'
    );

    return false;

  }


  if (
    onChecklistChanged
  ) {

    onChecklistChanged();

  }


  return true;

}


/* =========================================================
   TOTAL COUNTS
========================================================= */

export function getChecklistCounts() {

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

  let shipResponses =
    0;


  Object.values(
    state
  )
  .forEach(
    item => {

      total++;


      if (
        item.checked
      ) {

        checked++;

      }


      comments +=
        Array.isArray(
          item.comments
        )
          ? item.comments.length
          : 0;


      photos +=
        Array.isArray(
          item.photos
        )
          ? item.photos.length
          : 0;


      if (
        item.followUpNeeded
      ) {

        followUps++;


        shipResponses +=
          Array.isArray(
            item.shipComments
          )
            ? item.shipComments.length
            : 0;

      }

    }
  );


  return {

    total,

    checked,

    comments,

    photos,

    followUps,

    shipResponses

  };

}


/* =========================================================
   SECTION COUNTS
========================================================= */

function getSectionCount(
  section
) {

  const state =
    getState();


  let checked =
    0;


  section.items.forEach(
    (_,index) => {

      const key =
        `${section.id}__${index}`;


      if (
        state[key]?.checked
      ) {

        checked++;

      }

    }
  );


  return checked;

}


/* =========================================================
   RENDER CHECKLIST
========================================================= */

export function renderChecklist() {

  const container =
    document.getElementById(
      'sections'
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    '';


  SECTIONS.forEach(
    (section,sectionIndex) => {

      const sectionElement =
        createSectionElement(
          section,
          sectionIndex
        );


      container.appendChild(
        sectionElement
      );

    }
  );


  bindChecklistEvents();

  refreshChecklistUI();

}


/* =========================================================
   CREATE SECTION
========================================================= */

function createSectionElement(
  section,
  sectionIndex
) {

  const sectionElement =
    document.createElement(
      'div'
    );


  sectionElement.className =
    'section' +
    (
      sectionIndex === 0
        ? ' open'
        : ''
    );


  sectionElement.innerHTML = `

    <div class="section-head">

      <h2>
        ${escapeHtml(
          section.title
        )}
      </h2>


      <div
        style="
          display:flex;
          align-items:center;
          gap:10px
        "
      >

        <span
          class="section-count"
          id="count-${section.id}"
        >
          0/${section.items.length}
        </span>


        <span class="chevron"></span>

      </div>

    </div>


    <div
      class="section-body"
      id="body-${section.id}"
    ></div>

  `;


  const header =
    sectionElement.querySelector(
      '.section-head'
    );


  header.addEventListener(
    'click',
    () => {

      sectionElement
        .classList
        .toggle(
          'open'
        );

    }
  );


  const body =
    sectionElement.querySelector(
      '.section-body'
    );


  if (
    section.note
  ) {

    const note =
      document.createElement(
        'div'
      );


    note.className =
      'section-note';


    note.textContent =
      section.note;


    body.appendChild(
      note
    );

  }


  section.items.forEach(
    (text,index) => {

      const itemElement =
        createItemElement(
          section,
          text,
          index
        );


      body.appendChild(
        itemElement
      );

    }
  );


  return sectionElement;

}


/* =========================================================
   CREATE CHECKLIST ITEM
========================================================= */

function createItemElement(
  section,
  text,
  index
) {

  const key =
    `${section.id}__${index}`;


  const element =
    document.createElement(
      'div'
    );


  element.className =
    'item';


  element.id =
    `item-${key}`;


  element.innerHTML = `

    <div class="item-row">

      <button
        type="button"
        class="check-btn"
        data-key="${key}"
        aria-label="Mark checklist point reviewed"
      ></button>


      <div class="item-text">

        ${escapeHtml(
          text
        )}

      </div>


      <div class="item-actions">

        <button
          type="button"
          class="action note-button"
          data-key="${key}"
        >
          Comment
        </button>


        <button
          type="button"
          class="action photo-button"
          data-key="${key}"
        >
          Photo
        </button>

      </div>

    </div>


    <div
      class="extra hidden"
      id="extra-${key}"
    >

      <div
        class="comments-list"
        id="comments-${key}"
      ></div>


      <div class="comment-row">

        <textarea
          id="comment-input-${key}"
          placeholder="Add a reviewer comment"
        ></textarea>


        <button
          type="button"
          class="add-comment"
          data-key="${key}"
        >
          Add
        </button>

      </div>


      <div
        class="photos"
        id="photos-${key}"
      ></div>


      <div class="followup-row">

        <input
          type="checkbox"
          class="followup-check"
          id="followup-${key}"
          data-key="${key}"
        >


        <label
          for="followup-${key}"
          id="followup-label-${key}"
        >
          Follow-Up Needed from Ship
        </label>

      </div>


      <div
        class="ship-comments"
        id="ship-comments-${key}"
      ></div>


      <input
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        id="photo-input-${key}"
      >

    </div>

  `;


  return element;

}


/* =========================================================
   BIND EVENTS
========================================================= */

function bindChecklistEvents() {

  /*
    CHECK / UNCHECK
  */

  document
    .querySelectorAll(
      '.check-btn'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async event => {

            event.stopPropagation();


            const key =
              button.dataset.key;


            toggleChecked(
              key
            );


            refreshChecklistUI();


            await saveCurrentReport();

          }
        );

      }
    );


  /*
    COMMENT OPEN
  */

  document
    .querySelectorAll(
      '.note-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          event => {

            event.stopPropagation();


            const key =
              button.dataset.key;


            const extra =
              document.getElementById(
                `extra-${key}`
              );


            if (!extra) {
              return;
            }


            extra.classList.toggle(
              'hidden'
            );


            button.classList.toggle(
              'active'
            );

          }
        );

      }
    );


  /*
    PHOTO BUTTON
  */

  document
    .querySelectorAll(
      '.photo-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          event => {

            event.stopPropagation();


            const key =
              button.dataset.key;


            const input =
              document.getElementById(
                `photo-input-${key}`
              );


            if (
              input
            ) {

              input.click();

            }

          }
        );

      }
    );


  /*
    PHOTO INPUT
  */

  document
    .querySelectorAll(
      '.photo-input'
    )
    .forEach(
      input => {

        input.addEventListener(
          'change',
          event => {

            handlePhoto(
              event,
              input.dataset.key
            );

          }
        );

      }
    );


  /*
    The CSS class above is not
    present on the generated file input
    in some older versions, therefore
    also bind every file input.
  */

  document
    .querySelectorAll(
      'input[type="file"]'
    )
    .forEach(
      input => {

        input.addEventListener(
          'change',
          event => {

            if (
              !input.dataset.key
            ) {

              return;

            }


            handlePhoto(
              event,
              input.dataset.key
            );

          }
        );

      }
    );


  /*
    ADD REVIEWER COMMENT
  */

  document
    .querySelectorAll(
      '.add-comment'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async event => {

            event.stopPropagation();


            const key =
              button.dataset.key;


            const input =
              document.getElementById(
                `comment-input-${key}`
              );


            if (!input) {
              return;
            }


            const text =
              input.value.trim();


            if (!text) {

              input.focus();

              return;

            }


            addReviewerComment(
              key,
              text
            );


            input.value =
              '';


            renderComments(
              key
            );


            await saveCurrentReport();

          }
        );

      }
    );


  /*
    FOLLOW-UP CHECKBOX
  */

  document
    .querySelectorAll(
      '.followup-check'
    )
    .forEach(
      checkbox => {

        checkbox.addEventListener(
          'change',
          async event => {

            event.stopPropagation();


            const key =
              checkbox.dataset.key;


            setFollowUp(
              key,
              checkbox.checked
            );


            refreshChecklistUI();


            await saveCurrentReport();

          }
        );

      }
    );

}


/* =========================================================
   PHOTO HANDLER
========================================================= */

function handlePhoto(
  event,
  key
) {

  const file =
    event.target.files?.[0];


  if (
    !file
  ) {

    return;

  }


  /*
    Large images are resized before
    being saved so the report remains
    manageable.
  */

  const reader =
    new FileReader();


  reader.onload =
    readerEvent => {

      const image =
        new Image();


      image.onload =
        async () => {

          const maxWidth =
            1000;


          const scale =
            Math.min(
              1,
              maxWidth /
              image.width
            );


          const canvas =
            document.createElement(
              'canvas'
            );


          canvas.width =
            Math.round(
              image.width *
              scale
            );


          canvas.height =
            Math.round(
              image.height *
              scale
            );


          const context =
            canvas.getContext(
              '2d'
            );


          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );


          const dataUrl =
            canvas.toDataURL(
              'image/jpeg',
              .78
            );


          addPhoto(
            key,
            dataUrl
          );


          renderPhotos(
            key
          );


          /*
            Photo automatically opens
            the point detail area.
          */

          document
            .getElementById(
              `extra-${key}`
            )
            ?.classList
            .remove(
              'hidden'
            );


          await saveCurrentReport();

        };


      image.src =
        readerEvent.target.result;

    };


  reader.readAsDataURL(
    file
  );


  event.target.value =
    '';

}


/* =========================================================
   RENDER COMMENTS
========================================================= */

function renderComments(
  key
) {

  const container =
    document.getElementById(
      `comments-${key}`
    );


  if (
    !container
  ) {

    return;

  }


  const item =
    getItem(
      key
    );


  if (
    !item
  ) {

    return;

  }


  const comments =
    Array.isArray(
      item.comments
    )
      ? item.comments
      : [];


  container.innerHTML =
    comments
      .map(
        comment => `

          <div class="comment">

            <b>
              ${escapeHtml(
                comment.name ||
                getReviewer() ||
                'Reviewer'
              )}:
            </b>

            ${escapeHtml(
              comment.text ||
              ''
            )}

          </div>

        `
      )
      .join('');

}


/* =========================================================
   RENDER PHOTOS
========================================================= */

function renderPhotos(
  key
) {

  const container =
    document.getElementById(
      `photos-${key}`
    );


  if (
    !container
  ) {

    return;

  }


  const item =
    getItem(
      key
    );


  if (
    !item
  ) {

    return;

  }


  const photos =
    Array.isArray(
      item.photos
    )
      ? item.photos
      : [];


  container.innerHTML =
    '';


  photos.forEach(
    (photo,index) => {

      const wrapper =
        document.createElement(
          'div'
        );


      wrapper.className =
        'photo';


      const image =
        document.createElement(
          'img'
        );


      image.src =
        photo;


      image.alt =
        'Checklist photo';


      const remove =
        document.createElement(
          'button'
        );


      remove.type =
        'button';


      remove.className =
        'photo-remove';


      remove.textContent =
        '×';


      remove.addEventListener(
        'click',
        async event => {

          event.stopPropagation();


          removePhoto(
            key,
            index
          );


          renderPhotos(
            key
          );


          await saveCurrentReport();

        }
      );


      wrapper.appendChild(
        image
      );


      wrapper.appendChild(
        remove
      );


      container.appendChild(
        wrapper
      );

    }
  );

}


/* =========================================================
   RENDER SHIP COMMENTS
========================================================= */

function renderShipComments(
  key
) {

  const container =
    document.getElementById(
      `ship-comments-${key}`
    );


  if (
    !container
  ) {

    return;

  }


  const item =
    getItem(
      key
    );


  if (
    !item
  ) {

    return;

  }


  const comments =
    Array.isArray(
      item.shipComments
    )
      ? item.shipComments
      : [];


  if (
    !comments.length
  ) {

    container.innerHTML =
      '';


    return;

  }


  container.innerHTML = `

    <div
      style="
        margin-top:10px;
        color:var(--vv-squid);
        font-size:10px;
        font-weight:800;
        letter-spacing:.04em;
      "
    >
      SHIP COMMENTS
    </div>

    ${
      comments
        .map(
          comment => `

            <div
              class="ship-response-display"
              style="
                margin-top:5px;
              "
            >

              <b>
                ${escapeHtml(
                  comment.name ||
                  'Ship'
                )}:
              </b>

              ${escapeHtml(
                comment.text ||
                ''
              )}

            </div>

          `
        )
        .join('')
    }

  `;

}


/* =========================================================
   REFRESH WHOLE UI
========================================================= */

export function refreshChecklistUI() {

  const counts =
    getChecklistCounts();


  const progressElement =
    document.getElementById(
      'progress'
    );


  const fillElement =
    document.getElementById(
      'fill'
    );


  if (
    progressElement
  ) {

    progressElement.textContent =
      `${counts.checked} of ${counts.total} points reviewed`;

  }


  if (
    fillElement
  ) {

    const percentage =
      counts.total
        ? Math.round(
            counts.checked /
            counts.total *
            100
          )
        : 0;


    fillElement.style.width =
      `${percentage}%`;

  }


  SECTIONS.forEach(
    section => {

      const checked =
        getSectionCount(
          section
        );


      const counter =
        document.getElementById(
          `count-${section.id}`
        );


      if (
        counter
      ) {

        counter.textContent =
          `${checked}/${section.items.length}`;

      }


      section.items.forEach(
        (_,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            getItem(
              key
            );


          if (
            !item
          ) {

            return;

          }


          /*
            Check button
          */

          const check =
            document.querySelector(
              `.check-btn[data-key="${key}"]`
            );


          if (
            check
          ) {

            check.classList.toggle(
              'checked',
              Boolean(
                item.checked
              )
            );

          }


          /*
            Follow-up checkbox
          */

          const followup =
            document.querySelector(
              `.followup-check[data-key="${key}"]`
            );


          if (
            followup
          ) {

            followup.checked =
              Boolean(
                item.followUpNeeded
              );

          }


          /*
            Follow-up label
          */

          const label =
            document.getElementById(
              `followup-label-${key}`
            );


          if (
            label
          ) {

            const complete =
              item.followUpNeeded &&
              Array.isArray(
                item.shipComments
              ) &&
              item.shipComments.length > 0;


            label.classList.toggle(
              'followup-complete',
              complete
            );

          }


          renderComments(
            key
          );


          renderPhotos(
            key
          );


          renderShipComments(
            key
          );


          /*
            Automatically open the
            detail area when there is
            content.
          */

          if(
            (
              item.comments &&
              item.comments.length
            ) ||

            (
              item.photos &&
              item.photos.length
            ) ||

            item.followUpNeeded ||

            (
              item.shipComments &&
              item.shipComments.length
            )
          ){

            document
              .getElementById(
                `extra-${key}`
              )
              ?.classList
              .remove(
                'hidden'
              );

          }

        }
      );

    }
  );

}


/* =========================================================
   UPDATE CHECKLIST META
========================================================= */

export function updateChecklistHeader(){

  const meta =
    getMeta();


  const shipElement =
    document.getElementById(
      'hdrShip'
    );


  const reviewerElement =
    document.getElementById(
      'hdrReviewer'
    );


  const visitElement =
    document.getElementById(
      'visitMeta'
    );


  if (
    shipElement
  ){

    shipElement.textContent =
      (
        meta.ship ||
        ''
      ).toUpperCase();

  }


  if (
    reviewerElement
  ){

    reviewerElement.value =
      getReviewer() ||
      meta.reviewer ||
      '';

  }


  if (
    visitElement
  ){

    visitElement.textContent =
      `${meta.dateOn || ''}` +
      (
        meta.dateOff
          ? ` → ${meta.dateOff}`
          : ''
      );

  }

}


/* =========================================================
   CLEAR CHECKLIST UI
========================================================= */

export function clearChecklistUI(){

  const container =
    document.getElementById(
      'sections'
    );


  if (
    container
  ){

    container.innerHTML =
      '';

  }


  const fill =
    document.getElementById(
      'fill'
    );


  if (
    fill
  ){

    fill.style.width =
      '0%';

  }


  const progress =
    document.getElementById(
      'progress'
    );


  if (
    progress
  ){

    progress.textContent =
      '0 points reviewed';

  }

}


/* =========================================================
   GET REVIEW FOLLOW-UP POINTS
========================================================= */

export function getChecklistFollowUps(){

  const result = [];


  const state =
    getState();


  SECTIONS.forEach(
    section => {

      section.items.forEach(
        (text,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if(
            item &&
            item.followUpNeeded
          ){

            result.push({

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


  return result;

}


/* =========================================================
   SAVE BEFORE LEAVING CHECKLIST
========================================================= */

export async function saveChecklist(){

  return saveCurrentReport();

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  renderChecklist,

  refreshChecklistUI,

  updateChecklistHeader,

  clearChecklistUI,

  getChecklistCounts,

  getChecklistFollowUps,

  saveChecklist,

  setChecklistChangedCallback

};
