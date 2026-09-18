/*
  checklist.js

  Handles the checklist screen.

  Each checklist point supports:

  - Checked / Not Checked
  - Reviewer comments
  - Reviewer photos
  - Follow-Up Needed from Ship
  - Existing Ship comments
  - Automatic Supabase save

  Data flow:

  Checklist Point
      |
      +-- Reviewer Comment(s)
      |
      +-- Photo(s)
      |
      +-- Follow-Up Needed
              |
              +-- Ship Comment(s)
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
   CALLBACK
========================================================= */

let checklistChangedCallback = null;


export function setChecklistChangedCallback(
  callback
) {

  checklistChangedCallback =
    typeof callback === 'function'
      ? callback
      : null;

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
   MESSAGE
========================================================= */

function showMessage(
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


  console.log(
    message
  );

}


/* =========================================================
   SAVE CURRENT OPEN REPORT
========================================================= */

async function saveCurrentReport() {

  const reportId =
    getReportId();


  if (
    !reportId
  ) {

    showMessage(
      'Report ID is not available yet.'
    );

    return false;

  }


  const result =
    await saveOpenReport({

      reportId,

      meta:
        getMeta(),

      state:
        getState()

    });


  if (
    !result ||
    !result.success
  ) {

    console.error(
      'Checklist save failed:',
      result?.error
    );


    showMessage(
      'Could not save report.'
    );


    return false;

  }


  if (
    checklistChangedCallback
  ) {

    try {

      await checklistChangedCallback(
        result.data
      );

    } catch (error) {

      console.error(
        'Checklist callback failed:',
        error
      );

    }

  }


  return true;

}


/* =========================================================
   CHECKLIST COUNTS
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

  let shipComments =
    0;


  Object.values(
    state
  ).forEach(
    item => {

      total++;


      if (
        item &&
        item.checked
      ) {

        checked++;

      }


      if (
        item &&
        Array.isArray(
          item.comments
        )
      ) {

        comments +=
          item.comments.length;

      }


      if (
        item &&
        Array.isArray(
          item.photos
        )
      ) {

        photos +=
          item.photos.length;

      }


      if (
        item &&
        item.followUpNeeded
      ) {

        followUps++;

      }


      if (
        item &&
        Array.isArray(
          item.shipComments
        )
      ) {

        shipComments +=
          item.shipComments.length;

      }

    }
  );


  return {

    total,

    checked,

    comments,

    photos,

    followUps,

    shipComments

  };

}


/* =========================================================
   SECTION COUNT
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


  if (
    !container
  ) {

    console.error(
      'Checklist container #sections not found.'
    );

    return;

  }


  container.innerHTML =
    '';


  SECTIONS.forEach(
    (
      section,
      sectionIndex
    ) => {

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

  const element =
    document.createElement(
      'div'
    );


  element.className =
    'section' +
    (
      sectionIndex === 0
        ? ' open'
        : ''
    );


  element.innerHTML = `

    <div class="section-head">

      <h2>
        ${escapeHtml(
          section.title
        )}
      </h2>


      <div class="section-right">

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
    element.querySelector(
      '.section-head'
    );


  header.addEventListener(
    'click',
    () => {

      element.classList.toggle(
        'open'
      );

    }
  );


  const body =
    element.querySelector(
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
    (
      text,
      index
    ) => {

      body.appendChild(
        createChecklistItem(
          section,
          text,
          index
        )
      );

    }
  );


  return element;

}


/* =========================================================
   CREATE ITEM
========================================================= */

function createChecklistItem(
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

      <!-- REVIEWER COMMENTS -->

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


      <!-- PHOTOS -->

      <div
        class="photos"
        id="photos-${key}"
      ></div>


      <!-- FOLLOW-UP -->

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


      <!-- EXISTING SHIP COMMENTS -->

      <div
        class="ship-comments"
        id="ship-comments-${key}"
      ></div>


      <!-- PHOTO INPUT

           IMPORTANT:
           data-key connects the photo
           to this exact checklist point.
      -->

      <input
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden photo-input"
        data-key="${key}"
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


  /* =======================================================
     CHECK BUTTONS
  ======================================================= */

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


            if (
              !key
            ) {

              return;

            }


            toggleChecked(
              key
            );


            refreshChecklistUI();


            await saveCurrentReport();

          }
        );

      }
    );


  /* =======================================================
     COMMENT BUTTONS
  ======================================================= */

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


            openDetailArea(
              key
            );


            const input =
              document.getElementById(
                `comment-input-${key}`
              );


            if (
              input
            ) {

              setTimeout(
                () => input.focus(),
                50
              );

            }

          }
        );

      }
    );


  /* =======================================================
     PHOTO BUTTONS
  ======================================================= */

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


  /* =======================================================
     PHOTO INPUTS

     ONLY ONE CHANGE EVENT PER INPUT.
  ======================================================= */

  document
    .querySelectorAll(
      '.photo-input'
    )
    .forEach(
      input => {

        input.addEventListener(
          'change',
          async event => {

            const key =
              input.dataset.key;


            await handlePhoto(
              event,
              key
            );

          }
        );

      }
    );


  /* =======================================================
     REVIEWER COMMENT BUTTONS
  ======================================================= */

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


            if (
              !input
            ) {

              return;

            }


            const text =
              input.value.trim();


            if (
              !text
            ) {

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


  /* =======================================================
     FOLLOW-UP CHECKBOXES
  ======================================================= */

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


            openDetailArea(
              key
            );


            refreshChecklistUI();


            await saveCurrentReport();

          }
        );

      }
    );

}


/* =========================================================
   OPEN DETAIL AREA
========================================================= */

function openDetailArea(
  key
) {

  const extra =
    document.getElementById(
      `extra-${key}`
    );


  if (
    extra
  ) {

    extra.classList.remove(
      'hidden'
    );

  }


  const noteButton =
    document.querySelector(
      `.note-button[data-key="${key}"]`
    );


  if (
    noteButton
  ) {

    noteButton.classList.add(
      'active'
    );

  }

}


/* =========================================================
   PHOTO HANDLER
========================================================= */

async function handlePhoto(
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


  if (
    !key
  ) {

    console.error(
      'Photo key is missing.'
    );

    return;

  }


  /*
    Make sure this point's
    detail area is visible.
  */

  openDetailArea(
    key
  );


  try {

    const dataUrl =
      await compressImage(
        file
      );


    addPhoto(
      key,
      dataUrl
    );


    renderPhotos(
      key
    );


    await saveCurrentReport();


    showMessage(
      'Photo added.'
    );

  } catch (error) {

    console.error(
      'Photo processing failed:',
      error
    );


    showMessage(
      'Could not add photo.'
    );

  } finally {

    /*
      Allows the SAME photo to be
      selected again later.
    */

    event.target.value =
      '';

  }

}


/* =========================================================
   IMAGE COMPRESSION
========================================================= */

function compressImage(
  file
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();


      reader.onload =
        event => {

          const image =
            new Image();


          image.onload =
            () => {

              const maxWidth =
                1200;


              const scale =
                Math.min(
                  1,
                  maxWidth /
                  image.width
                );


              const width =
                Math.max(
                  1,
                  Math.round(
                    image.width *
                    scale
                  )
                );


              const height =
                Math.max(
                  1,
                  Math.round(
                    image.height *
                    scale
                  )
                );


              const canvas =
                document.createElement(
                  'canvas'
                );


              canvas.width =
                width;


              canvas.height =
                height;


              const context =
                canvas.getContext(
                  '2d'
                );


              if (
                !context
              ) {

                reject(
                  new Error(
                    'Could not create image canvas.'
                  )
                );

                return;

              }


              context.drawImage(
                image,
                0,
                0,
                width,
                height
              );


              const output =
                canvas.toDataURL(
                  'image/jpeg',
                  0.78
                );


              resolve(
                output
              );

            };


          image.onerror =
            () => {

              reject(
                new Error(
                  'Could not read image.'
                )
              );

            };


          image.src =
            event.target.result;

        };


      reader.onerror =
        () => {

          reject(
            new Error(
              'Could not read selected file.'
            )
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

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
    comments.length
      ? comments
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
          .join('')
      : '';

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
    (
      photo,
      index
    ) => {

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


      remove.setAttribute(
        'aria-label',
        'Remove photo'
      );


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
        margin-top:11px;
        margin-bottom:5px;
        color:var(--vv-squid);
        font-size:10px;
        font-weight:800;
        letter-spacing:.04em;
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
              style="
                margin-top:5px;
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

  `;

}


/* =========================================================
   REFRESH UI
========================================================= */

export function refreshChecklistUI() {

  const state =
    getState();


  let total =
    0;

  let checked =
    0;


  SECTIONS.forEach(
    section => {

      let sectionChecked =
        0;


      section.items.forEach(
        (_,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if (
            !item
          ) {

            return;

          }


          total++;


          if (
            item.checked
          ) {

            checked++;

            sectionChecked++;

          }


          /*
            CHECK
          */

          const checkButton =
            document.querySelector(
              `.check-btn[data-key="${key}"]`
            );


          if (
            checkButton
          ) {

            checkButton.classList.toggle(
              'checked',
              Boolean(
                item.checked
              )
            );

          }


          /*
            FOLLOW-UP
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
            FOLLOW-UP LABEL
          */

          const label =
            document.getElementById(
              `followup-label-${key}`
            );


          if (
            label
          ) {

            const complete =
              Boolean(
                item.followUpNeeded &&
                Array.isArray(
                  item.shipComments
                ) &&
                item.shipComments.length > 0
              );


            label.classList.toggle(
              'followup-complete',
              complete
            );

          }


          /*
            CONTENT
          */

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
            Open details whenever
            the point already contains
            content.
          */

          if (

            (
              Array.isArray(
                item.comments
              ) &&
              item.comments.length > 0
            )

            ||

            (
              Array.isArray(
                item.photos
              ) &&
              item.photos.length > 0
            )

            ||

            item.followUpNeeded

            ||

            (
              Array.isArray(
                item.shipComments
              ) &&
              item.shipComments.length > 0
            )

          ) {

            openDetailArea(
              key
            );

          }

        }
      );


      /*
        SECTION COUNT
      */

      const counter =
        document.getElementById(
          `count-${section.id}`
        );


      if (
        counter
      ) {

        counter.textContent =
          `${sectionChecked}/${section.items.length}`;

      }

    }
  );


  /*
    GLOBAL PROGRESS
  */

  const fill =
    document.getElementById(
      'fill'
    );


  const progress =
    document.getElementById(
      'progress'
    );


  const percentage =
    total
      ? Math.round(
          checked /
          total *
          100
        )
      : 0;


  if (
    fill
  ) {

    fill.style.width =
      `${percentage}%`;

  }


  if (
    progress
  ) {

    progress.textContent =
      `${checked} of ${total} points reviewed`;

  }

}


/* =========================================================
   UPDATE HEADER
========================================================= */

export function updateChecklistHeader() {

  const meta =
    getMeta();


  const ship =
    document.getElementById(
      'hdrShip'
    );


  const reviewer =
    document.getElementById(
      'hdrReviewer'
    );


  const visit =
    document.getElementById(
      'visitMeta'
    );


  if (
    ship
  ) {

    ship.textContent =
      (
        meta.ship ||
        ''
      ).toUpperCase();

  }


  if (
    reviewer
  ) {

    reviewer.value =
      getReviewer() ||
      meta.reviewer ||
      '';

  }


  if (
    visit
  ) {

    visit.textContent =
      `${meta.dateOn || ''}` +
      (
        meta.dateOff
          ? ` → ${meta.dateOff}`
          : ''
      );

  }

}


/* =========================================================
   GET FOLLOW-UP POINTS
========================================================= */

export function getChecklistFollowUps() {

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
   GET ALL POINTS
========================================================= */

export function getAllChecklistPoints() {

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


          points.push({

            key,

            section:
              section.title,

            text,

            checked:
              Boolean(
                item?.checked
              ),

            comments:
              Array.isArray(
                item?.comments
              )
                ? item.comments
                : [],

            photos:
              Array.isArray(
                item?.photos
              )
                ? item.photos
                : [],

            followUpNeeded:
              Boolean(
                item?.followUpNeeded
              ),

            shipComments:
              Array.isArray(
                item?.shipComments
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
   SAVE CHECKLIST
========================================================= */

export async function saveChecklist() {

  return saveCurrentReport();

}


/* =========================================================
   CLEAR CHECKLIST
========================================================= */

export function clearChecklistUI() {

  const container =
    document.getElementById(
      'sections'
    );


  if (
    container
  ) {

    container.innerHTML =
      '';

  }


  const fill =
    document.getElementById(
      'fill'
    );


  if (
    fill
  ) {

    fill.style.width =
      '0%';

  }


  const progress =
    document.getElementById(
      'progress'
    );


  if (
    progress
  ) {

    progress.textContent =
      '0 of 0 points reviewed';

  }

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

  getAllChecklistPoints,

  saveChecklist,

  setChecklistChangedCallback

};
