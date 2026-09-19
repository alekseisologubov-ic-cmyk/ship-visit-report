/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  checklist.js
  ============================================================

  NEW NAVIGATION:

  CHECKLIST HOME
        |
        +-- CULINARY
        |
        +-- BAR
        |
        +-- RESTAURANT
        |
        +-- PROCUREMENT
        |
        +-- SANITATION

  Clicking a department opens only that department's
  checklist points.

  Existing functionality preserved:
  - Check / Uncheck
  - Reviewer comments
  - Photos
  - Follow-Up Needed
  - Ship comments
  - Automatic Supabase saving
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


/* ============================================================
   STATE
============================================================ */

let currentDepartmentId = null;

let checklistChangedCallback = null;


/* ============================================================
   CALLBACK
============================================================ */

export function setChecklistChangedCallback(
  callback
){

  checklistChangedCallback =
    typeof callback === 'function'
      ? callback
      : null;

}


/* ============================================================
   HTML ESCAPE
============================================================ */

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


/* ============================================================
   MESSAGE
============================================================ */

function showMessage(
  message
){

  if(
    typeof window.showToast ===
    'function'
  ){

    window.showToast(
      message
    );

    return;

  }

  console.log(
    message
  );

}


/* ============================================================
   SAVE CURRENT REPORT
============================================================ */

async function saveCurrentReport(){

  const reportId =
    getReportId();


  if(
    !reportId
  ){

    showMessage(
      'Report ID is not available yet.'
    );

    return false;

  }


  try{

    const result =
      await saveOpenReport({

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

      console.error(
        'Checklist save failed:',
        result?.error
      );


      showMessage(
        'Could not save report.'
      );


      return false;

    }


    if(
      checklistChangedCallback
    ){

      try{

        await checklistChangedCallback(
          result.data
        );

      }catch(error){

        console.error(
          'Checklist callback failed:',
          error
        );

      }

    }


    return true;

  }catch(error){

    console.error(
      'saveCurrentReport:',
      error
    );


    showMessage(
      'Could not save report.'
    );


    return false;

  }

}


/* ============================================================
   CHECKLIST COUNTS
============================================================ */

export function getChecklistCounts(){

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


      if(
        item &&
        item.checked
      ){

        checked++;

      }


      if(
        item &&
        Array.isArray(
          item.comments
        )
      ){

        comments +=
          item.comments.length;

      }


      if(
        item &&
        Array.isArray(
          item.photos
        )
      ){

        photos +=
          item.photos.length;

      }


      if(
        item &&
        item.followUpNeeded
      ){

        followUps++;

      }


      if(
        item &&
        Array.isArray(
          item.shipComments
        )
      ){

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


/* ============================================================
   DEPARTMENT COUNT
============================================================ */

function getDepartmentCount(
  section
){

  const state =
    getState();


  let checked =
    0;


  section.items.forEach(
    (
      _,
      index
    ) => {

      const key =
        `${section.id}__${index}`;


      if(
        state[key]?.checked
      ){

        checked++;

      }

    }
  );


  return {

    checked,

    total:
      section.items.length

  };

}


/* ============================================================
   DEPARTMENT ICON
============================================================ */

function getDepartmentIcon(
  section
){

  const icons = {

    culinary: `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          d="M19 8v18c0 6 4 10 9 11v19"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M13 8v14M19 8v14M25 8v14"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M43 8v48"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M43 8c8 7 8 17 0 24"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    `,

    bar: `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          d="M14 10h36l-13 19v27"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M25 56h24"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    `,

    restaurant: `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="21"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          d="M17 25h30M18 39h28"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M25 18v28M39 18v28"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    `,

    procurement: `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          d="M10 22h44v34H10z"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linejoin="round"
        />
        <path
          d="M20 22v-8h24v8"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linejoin="round"
        />
        <path
          d="M10 31h44"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
        />
      </svg>
    `,

    sanitation: `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          d="M22 10h20"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M27 10v10L17 51c-1 4 2 7 6 7h18c4 0 7-3 6-7L37 20V10"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linejoin="round"
        />
        <path
          d="M23 38h18"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    `

  };


  return (
    icons[section.id] ||
    icons.restaurant
  );

}


/* ============================================================
   RENDER CHECKLIST
   DEFAULT = DEPARTMENT HOME
============================================================ */

export function renderChecklist(){

  const container =
    document.getElementById(
      'sections'
    );


  if(
    !container
  ){

    console.error(
      'Checklist container #sections not found.'
    );

    return;

  }


  /*
    Always return to department home
    whenever the main checklist is opened.
  */

  currentDepartmentId =
    null;


  renderDepartmentHome();

}


/* ============================================================
   DEPARTMENT HOME
============================================================ */

function renderDepartmentHome(){

  const container =
    document.getElementById(
      'sections'
    );


  if(
    !container
  ){

    return;

  }


  const counts =
    getChecklistCounts();


  container.innerHTML = `

    <div class="department-home">


      <div class="department-overview">


        <div class="department-overview-title">

          REPORT OVERVIEW

        </div>


        <div class="department-overview-grid">


          <div
            class="department-overview-card"
          >

            <strong>

              ${counts.checked}

            </strong>

            <span>

              of ${counts.total}

            </span>


            <small>

              POINTS CHECKED

            </small>

          </div>


          <div
            class="department-overview-card"
          >

            <strong>

              ${counts.comments}

            </strong>


            <small>

              COMMENTS

            </small>

          </div>


          <div
            class="department-overview-card"
          >

            <strong>

              ${counts.photos}

            </strong>


            <small>

              PHOTOS

            </small>

          </div>


          <div
            class="department-overview-card"
          >

            <strong>

              ${counts.followUps}

            </strong>


            <small>

              FOLLOW-UPS

            </small>

          </div>


        </div>

      </div>


      <div
        class="department-heading"
      >

        DEPARTMENTS

      </div>


      <div
        class="department-grid"
      >

        ${
          SECTIONS
            .map(
              section =>
                renderDepartmentCard(
                  section
                )
            )
            .join('')
        }

      </div>


      <div
        class="department-help"
      >

        Select a department to open
        its checklist points.

      </div>


    </div>

  `;


  bindDepartmentCards();

}


/* ============================================================
   DEPARTMENT CARD
============================================================ */

function renderDepartmentCard(
  section
){

  const count =
    getDepartmentCount(
      section
    );


  const complete =
    count.checked ===
    count.total;


  return `

    <button
      type="button"
      class="department-card ${
        complete
          ? 'complete'
          : ''
      }"
      data-department-id="${escapeHtml(
        section.id
      )}"
    >

      <div
        class="department-icon"
      >

        ${getDepartmentIcon(
          section
        )}

      </div>


      <div
        class="department-card-name"
      >

        ${escapeHtml(
          section.title
        )}

      </div>


      <div
        class="department-card-count"
      >

        ${count.checked}

        /

        ${count.total}

      </div>


      <div
        class="department-card-label"
      >

        ${
          complete
            ? 'COMPLETE'
            : 'OPEN CHECKLIST'
        }

      </div>


      ${
        section.note
          ? `
            <div
              class="department-card-note"
            >

              ${escapeHtml(
                section.note
              )}

            </div>
          `
          : ''
      }

    </button>

  `;

}


/* ============================================================
   BIND DEPARTMENT CARDS
============================================================ */

function bindDepartmentCards(){

  document
    .querySelectorAll(
      '[data-department-id]'
    )
    .forEach(
      card => {

        card.addEventListener(
          'click',
          () => {

            const departmentId =
              card.dataset.departmentId;


            openDepartment(
              departmentId
            );

          }
        );

      }
    );

}


/* ============================================================
   OPEN DEPARTMENT
============================================================ */

export function openDepartment(
  departmentId
){

  const section =
    SECTIONS.find(
      item =>
        item.id ===
        departmentId
    );


  if(
    !section
  ){

    return;

  }


  currentDepartmentId =
    section.id;


  renderDepartmentChecklist(
    section
  );


  window.scrollTo(
    0,
    0
  );

}


/* ============================================================
   CLOSE DEPARTMENT
============================================================ */

export function closeDepartment(){

  currentDepartmentId =
    null;


  renderDepartmentHome();


  window.scrollTo(
    0,
    0
  );

}


/* ============================================================
   DEPARTMENT CHECKLIST
============================================================ */

function renderDepartmentChecklist(
  section
){

  const container =
    document.getElementById(
      'sections'
    );


  if(
    !container
  ){

    return;

  }


  const count =
    getDepartmentCount(
      section
    );


  container.innerHTML = `

    <div
      class="department-checklist"
      data-current-department="${escapeHtml(
        section.id
      )}"
    >


      <div
        class="department-checklist-top"
      >

        <button
          type="button"
          class="department-back"
          id="departmentBackBtn"
        >

          ← Departments

        </button>


        <div
          class="department-checklist-title"
        >

          <div
            class="department-checklist-icon"
          >

            ${getDepartmentIcon(
              section
            )}

          </div>


          <div>

            <div
              class="department-checklist-name"
            >

              ${escapeHtml(
                section.title
              )}

            </div>


            <div
              class="department-checklist-count"
              id="currentDepartmentCount"
            >

              ${count.checked}/${count.total}
              checked

            </div>

          </div>

        </div>

      </div>


      ${
        section.note
          ? `

            <div
              class="department-note"
            >

              ${escapeHtml(
                section.note
              )}

            </div>

          `
          : ''
      }


      <div
        class="department-point-list"
        id="departmentPointList"
      ></div>


    </div>

  `;


  renderDepartmentPoints(
    section
  );


  const back =
    document.getElementById(
      'departmentBackBtn'
    );


  if(
    back
  ){

    back.addEventListener(
      'click',
      closeDepartment
    );

  }

}


/* ============================================================
   RENDER DEPARTMENT POINTS
============================================================ */

function renderDepartmentPoints(
  section
){

  const container =
    document.getElementById(
      'departmentPointList'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML =
    '';


  section.items.forEach(
    (
      text,
      index
    ) => {

      const element =
        createChecklistItem(
          section,
          text,
          index
        );


      container.appendChild(
        element
      );

    }
  );


  bindChecklistEvents();

  refreshChecklistUI();

}


/* ============================================================
   CREATE CHECKLIST ITEM
============================================================ */

function createChecklistItem(
  section,
  text,
  index
){

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
        data-key="${escapeHtml(
          key
        )}"
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
          data-key="${escapeHtml(
            key
          )}"
        >

          Comment

        </button>


        <button
          type="button"
          class="action photo-button"
          data-key="${escapeHtml(
            key
          )}"
        >

          Photo

        </button>


      </div>


    </div>


    <div
      class="extra hidden"
      id="extra-${escapeHtml(
        key
      )}"
    >


      <div
        class="comments-list"
        id="comments-${escapeHtml(
          key
        )}"
      ></div>


      <div
        class="comment-row"
      >

        <textarea
          id="comment-input-${escapeHtml(
            key
          )}"
          placeholder="Add a reviewer comment"
        ></textarea>


        <button
          type="button"
          class="add-comment"
          data-key="${escapeHtml(
            key
          )}"
        >

          Add

        </button>

      </div>


      <div
        class="photos"
        id="photos-${escapeHtml(
          key
        )}"
      ></div>


      <div
        class="followup-row"
      >

        <input
          type="checkbox"
          class="followup-check"
          id="followup-${escapeHtml(
            key
          )}"
          data-key="${escapeHtml(
            key
          )}"
        >


        <label
          for="followup-${escapeHtml(
            key
          )}"
        >

          Follow-Up Needed from Ship

        </label>


      </div>


      <div
        class="ship-comments"
        id="ship-comments-${escapeHtml(
          key
        )}"
      ></div>


      <input
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden photo-input"
        data-key="${escapeHtml(
          key
        )}"
        id="photo-input-${escapeHtml(
          key
        )}"
      />


    </div>

  `;


  return element;

}


/* ============================================================
   CHECKLIST EVENTS
============================================================ */

function bindChecklistEvents(){

  /*
    CHECK BUTTONS
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


            if(
              !key
            ){

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


  /*
    COMMENT BUTTONS
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


            openDetailArea(
              key
            );


            const input =
              document.getElementById(
                `comment-input-${key}`
              );


            if(
              input
            ){

              setTimeout(
                () => {

                  input.focus();

                },
                50
              );

            }

          }
        );

      }
    );


  /*
    PHOTO BUTTONS
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


            openDetailArea(
              key
            );


            const input =
              document.getElementById(
                `photo-input-${key}`
              );


            if(
              input
            ){

              input.click();

            }

          }
        );

      }
    );


  /*
    PHOTO INPUTS
  */

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


  /*
    ADD COMMENT
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


            if(
              !input
            ){

              return;

            }


            const text =
              input.value.trim();


            if(
              !text
            ){

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


            openDetailArea(
              key
            );


            await saveCurrentReport();

          }
        );

      }
    );


  /*
    FOLLOW-UP
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


/* ============================================================
   OPEN DETAILS
============================================================ */

function openDetailArea(
  key
){

  const extra =
    document.getElementById(
      `extra-${key}`
    );


  if(
    extra
  ){

    extra.classList.remove(
      'hidden'
    );

  }


  const noteButton =
    document.querySelector(
      `.note-button[data-key="${CSS.escape(
        key
      )}"]`
    );


  if(
    noteButton
  ){

    noteButton.classList.add(
      'active'
    );

  }

}


/* ============================================================
   RENDER COMMENTS
============================================================ */

function renderComments(
  key
){

  const container =
    document.getElementById(
      `comments-${key}`
    );


  if(
    !container
  ){

    return;

  }


  const item =
    getItem(
      key
    );


  if(
    !item
  ){

    return;

  }


  const comments =
    Array.isArray(
      item.comments
    )
      ? item.comments
      : [];


  if(
    comments.length === 0
  ){

    container.innerHTML =
      '';


    return;

  }


  container.innerHTML = `

    <div
      class="response-label"
      style="
        margin-top:8px;
      "
    >

      REVIEWER COMMENTS

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


              <div
                style="
                  margin-top:3px;
                "
              >

                ${escapeHtml(
                  comment.text ||
                  ''
                )}

              </div>

            </div>

          `
        )
        .join('')
    }

  `;

}


/* ============================================================
   HANDLE PHOTO
============================================================ */

async function handlePhoto(
  event,
  key
){

  const file =
    event.target.files?.[0];


  if(
    !file
  ){

    return;

  }


  try{

    const dataUrl =
      await compressImage(
        file
      );


    addPhoto(
      key,
      dataUrl
    );


    openDetailArea(
      key
    );


    renderPhotos(
      key
    );


    await saveCurrentReport();

  }catch(error){

    console.error(
      'handlePhoto:',
      error
    );


    alert(
      'Could not add this photo.'
    );

  }


  event.target.value =
    '';

}


/* ============================================================
   COMPRESS IMAGE
============================================================ */

function compressImage(
  file
){

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          const image =
            new Image();


          image.onload =
            () => {

              const maxWidth =
                1280;


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


              if(
                !context
              ){

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


              resolve(
                canvas.toDataURL(
                  'image/jpeg',
                  0.78
                )
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
            reader.result;

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


/* ============================================================
   RENDER PHOTOS
============================================================ */

function renderPhotos(
  key
){

  const container =
    document.getElementById(
      `photos-${key}`
    );


  if(
    !container
  ){

    return;

  }


  const item =
    getItem(
      key
    );


  if(
    !item
  ){

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
      source,
      index
    ) => {

      const wrapper =
        document.createElement(
          'div'
        );


      wrapper.className =
        'photo';


      wrapper.innerHTML = `

        <img
          src="${escapeHtml(
            source
          )}"
          alt="Reviewer photo"
        >

      `;


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
        remove
      );


      container.appendChild(
        wrapper
      );

    }
  );

}


/* ============================================================
   RENDER SHIP COMMENTS
============================================================ */

function renderShipComments(
  key
){

  const container =
    document.getElementById(
      `ship-comments-${key}`
    );


  if(
    !container
  ){

    return;

  }


  const item =
    getItem(
      key
    );


  if(
    !item
  ){

    return;

  }


  const comments =
    Array.isArray(
      item.shipComments
    )
      ? item.shipComments
      : [];


  if(
    comments.length === 0
  ){

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


/* ============================================================
   REFRESH CHECKLIST UI
============================================================ */

export function refreshChecklistUI(){

  const state =
    getState();


  /*
    GLOBAL COUNTS
  */

  let total =
    0;

  let checked =
    0;


  Object.values(
    state
  ).forEach(
    item => {

      total++;


      if(
        item &&
        item.checked
      ){

        checked++;

      }

    }
  );


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


  if(
    fill
  ){

    fill.style.width =
      `${percentage}%`;

  }


  if(
    progress
  ){

    progress.textContent =
      `${checked} of ${total} points reviewed`;

  }


  /*
    If the department home is visible,
    refresh all cards.
  */

  if(
    !currentDepartmentId
  ){

    refreshDepartmentHomeCards();

    return;

  }


  /*
    Current department only.
  */

  const section =
    SECTIONS.find(
      item =>
        item.id ===
        currentDepartmentId
    );


  if(
    !section
  ){

    return;

  }


  const departmentCount =
    getDepartmentCount(
      section
    );


  const departmentCountElement =
    document.getElementById(
      'currentDepartmentCount'
    );


  if(
    departmentCountElement
  ){

    departmentCountElement.textContent =
      `${departmentCount.checked}/${departmentCount.total} checked`;

  }


  /*
    Update every point.
  */

  section.items.forEach(
    (
      _,
      index
    ) => {

      const key =
        `${section.id}__${index}`;


      const item =
        state[key];


      const button =
        document.querySelector(
          `.check-btn[data-key="${CSS.escape(
            key
          )}"]`
        );


      const extra =
        document.getElementById(
          `extra-${key}`
        );


      const followup =
        document.getElementById(
          `followup-${key}`
        );


      const pointHasDetails =
        Boolean(
          item &&
          (
            (
              Array.isArray(
                item.comments
              ) &&
              item.comments.length > 0
            ) ||
            (
              Array.isArray(
                item.photos
              ) &&
              item.photos.length > 0
            ) ||
            item.followUpNeeded ||
            (
              Array.isArray(
                item.shipComments
              ) &&
              item.shipComments.length > 0
            )
          )
        );


      if(
        button
      ){

        button.classList.toggle(
          'checked',
          Boolean(
            item?.checked
          )
        );

      }


      if(
        followup
      ){

        followup.checked =
          Boolean(
            item?.followUpNeeded
          );

      }


      if(
        pointHasDetails
      ){

        openDetailArea(
          key
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


      if(
        extra
      ){

        if(
          pointHasDetails
        ){

          extra.classList.remove(
            'hidden'
          );

        }

      }

    }
  );

}


/* ============================================================
   REFRESH DEPARTMENT CARDS
============================================================ */

function refreshDepartmentHomeCards(){

  document
    .querySelectorAll(
      '.department-card'
    )
    .forEach(
      card => {

        const id =
          card.dataset.departmentId;


        const section =
          SECTIONS.find(
            item =>
              item.id ===
              id
          );


        if(
          !section
        ){

          return;

        }


        const count =
          getDepartmentCount(
            section
          );


        const countElement =
          card.querySelector(
            '.department-card-count'
          );


        const labelElement =
          card.querySelector(
            '.department-card-label'
          );


        if(
          countElement
        ){

          countElement.textContent =
            `${count.checked}/${count.total}`;

        }


        const complete =
          count.checked ===
          count.total;


        card.classList.toggle(
          'complete',
          complete
        );


        if(
          labelElement
        ){

          labelElement.textContent =
            complete
              ? 'COMPLETE'
              : 'OPEN CHECKLIST';

        }

      }
    );


  /*
    Refresh overview numbers.
  */

  const counts =
    getChecklistCounts();


  const values = {

    checked:
      counts.checked,

    comments:
      counts.comments,

    photos:
      counts.photos,

    followUps:
      counts.followUps

  };


  const cards =
    document.querySelectorAll(
      '.department-overview-card'
    );


  if(
    cards.length >= 4
  ){

    cards[0]
      .querySelector('strong')
      .textContent =
        values.checked;


    cards[0]
      .querySelector('span')
      .textContent =
        `of ${counts.total}`;


    cards[1]
      .querySelector('strong')
      .textContent =
        values.comments;


    cards[2]
      .querySelector('strong')
      .textContent =
        values.photos;


    cards[3]
      .querySelector('strong')
      .textContent =
        values.followUps;

  }

}


/* ============================================================
   UPDATE HEADER
============================================================ */

export function updateChecklistHeader(){

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


  if(
    ship
  ){

    ship.textContent =
      (
        meta.ship ||
        ''
      ).toUpperCase();

  }


  if(
    reviewer
  ){

    reviewer.value =
      getReviewer() ||
      meta.reviewer ||
      '';

  }


  if(
    visit
  ){

    visit.textContent =
      `${meta.dateOn || ''}` +
      (
        meta.dateOff
          ? ` → ${meta.dateOff}`
          : ''
      );

  }

}


/* ============================================================
   FOLLOW-UP POINTS
============================================================ */

export function getChecklistFollowUps(){

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


          if(
            item &&
            item.followUpNeeded
          ){

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


/* ============================================================
   ALL CHECKLIST POINTS
============================================================ */

export function getAllChecklistPoints(){

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


/* ============================================================
   SAVE CHECKLIST
============================================================ */

export async function saveChecklist(){

  return saveCurrentReport();

}


/* ============================================================
   CLEAR CHECKLIST UI
============================================================ */

export function clearChecklistUI(){

  const container =
    document.getElementById(
      'sections'
    );


  if(
    container
  ){

    container.innerHTML =
      '';

  }


  currentDepartmentId =
    null;


  const fill =
    document.getElementById(
      'fill'
    );


  if(
    fill
  ){

    fill.style.width =
      '0%';

  }


  const progress =
    document.getElementById(
      'progress'
    );


  if(
    progress
  ){

    progress.textContent =
      '0 of 0 points reviewed';

  }

}


/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {

  renderChecklist,

  openDepartment,

  closeDepartment,

  refreshChecklistUI,

  updateChecklistHeader,

  clearChecklistUI,

  getChecklistCounts,

  getChecklistFollowUps,

  getAllChecklistPoints,

  saveChecklist,

  setChecklistChangedCallback

};
