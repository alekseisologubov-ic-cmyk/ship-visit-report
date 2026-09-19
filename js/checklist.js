/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  checklist.js
  ============================================================

  CHECKLIST FLOW

    CHECKLIST HOME
        |
        +-- CULINARY
        +-- BAR
        +-- RESTAURANT
        +-- PROCUREMENT
        +-- SANITATION

    Click department
        |
        v
    Department checklist
        |
        v
    Back to Departments

  Features:
    - Department navigation
    - Checklist circle
    - Reviewer comments
    - Photos
    - Follow-up flag
    - Ship comments display
    - Supabase saving
    - Progress tracking
*/


/* ============================================================
   IMPORTS
============================================================ */

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
   CURRENT DEPARTMENT
============================================================ */

let currentDepartment = null;


/* ============================================================
   OPTIONAL CALLBACK
============================================================ */

let checklistChangedCallback = null;


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
    function(character){

      const map = {

        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'

      };

      return map[character];

    }
  );

}


/* ============================================================
   GET ELEMENT
============================================================ */

function getElement(
  id
){

  return document.getElementById(
    id
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

    /*
      New report may not have a database
      ID yet.
    */

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
        'Could not save report:',
        result?.error
      );


      return false;

    }


    if(
      typeof checklistChangedCallback ===
      'function'
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
      'saveCurrentReport error:',
      error
    );


    return false;

  }

}


/* ============================================================
   GLOBAL CHECKLIST COUNTS
============================================================ */

export function getChecklistCounts(){

  const state =
    getState();


  let total = 0;

  let checked = 0;

  let comments = 0;

  let photos = 0;

  let followUps = 0;

  let shipComments = 0;


  SECTIONS.forEach(
    section => {

      if(
        !Array.isArray(
          section.items
        )
      ){

        return;

      }


      total +=
        section.items.length;


      section.items.forEach(
        (
          _text,
          index
        ) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if(
            !item
          ){

            return;

          }


          if(
            item.checked
          ){

            checked++;

          }


          if(
            Array.isArray(
              item.comments
            )
          ){

            comments +=
              item.comments.length;

          }


          if(
            Array.isArray(
              item.photos
            )
          ){

            photos +=
              item.photos.length;

          }


          if(
            item.followUpNeeded
          ){

            followUps++;

          }


          if(
            Array.isArray(
              item.shipComments
            )
          ){

            shipComments +=
              item.shipComments.length;

          }

        }
      );

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


  let checked = 0;


  const total =
    Array.isArray(
      section.items
    )
      ? section.items.length
      : 0;


  section.items.forEach(
    (
      _text,
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

    total

  };

}


/* ============================================================
   MAIN CHECKLIST RENDER
============================================================ */

export function renderChecklist(){

  const container =
    getElement(
      'sections'
    );


  if(
    !container
  ){

    console.error(
      'Checklist container #sections was not found.'
    );


    return;

  }


  currentDepartment =
    null;


  renderDepartmentHome();

}


/* ============================================================
   DEPARTMENT HOME
============================================================ */

function renderDepartmentHome(){

  const container =
    getElement(
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


      <!-- ================================================
           REPORT OVERVIEW
      ================================================= -->

      <div
        class="department-overview"
      >

        <div
          class="department-overview-title"
        >

          REPORT OVERVIEW

        </div>


        <div
          class="department-overview-grid"
        >


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


      <!-- ================================================
           DEPARTMENTS
      ================================================= -->

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

        Select a department to open its checklist.

      </div>


    </div>

  `;


  bindDepartmentButtons();

}


/* ============================================================
   DEPARTMENT CARD
   NO ICONS / NO PICTURES
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
      data-department="${escapeHtml(
        section.id
      )}"
    >

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

        ${count.checked}/${count.total}

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

    </button>

  `;

}


/* ============================================================
   DEPARTMENT BUTTON EVENTS
============================================================ */

function bindDepartmentButtons(){

  const buttons =
    document.querySelectorAll(
      '[data-department]'
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        function(){

          const departmentId =
            button.dataset.department;


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

    console.error(
      'Department not found:',
      departmentId
    );


    return;

  }


  currentDepartment =
    departmentId;


  renderDepartment(
    section
  );


  window.scrollTo(
    0,
    0
  );

}


/* ============================================================
   BACK TO DEPARTMENTS
============================================================ */

export function closeDepartment(){

  currentDepartment =
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

function renderDepartment(
  section
){

  const container =
    getElement(
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
    >


      <!-- ==============================================
           DEPARTMENT HEADER
      =============================================== -->

      <div
        class="department-checklist-top"
      >


        <button
          type="button"
          id="departmentBackBtn"
          class="department-back"
        >

          ← Departments

        </button>


        <div
          class="department-checklist-title"
        >

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
              id="departmentCurrentCount"
            >

              ${count.checked}/${count.total}
              checked

            </div>

          </div>

        </div>


      </div>


      <!-- ==============================================
           CHECKLIST POINTS
      =============================================== -->

      <div
        id="departmentPoints"
        class="department-point-list"
      ></div>


    </div>

  `;


  const back =
    getElement(
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


  renderDepartmentPoints(
    section
  );

}


/* ============================================================
   RENDER DEPARTMENT POINTS
============================================================ */

function renderDepartmentPoints(
  section
){

  const container =
    getElement(
      'departmentPoints'
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

      const point =
        createChecklistPoint(
          section,
          text,
          index
        );


      container.appendChild(
        point
      );

    }
  );


  refreshChecklistUI();

}


/* ============================================================
   CREATE CHECKLIST POINT
============================================================ */

function createChecklistPoint(
  section,
  text,
  index
){

  const key =
    `${section.id}__${index}`;


  const item =
    getItem(
      key
    ) || {};


  const wrapper =
    document.createElement(
      'div'
    );


  wrapper.className =
    'item';


  wrapper.id =
    `item-${key}`;


  wrapper.innerHTML = `

    <div
      class="item-row"
    >


      <!-- CHECK CIRCLE -->

      <button
        type="button"
        class="check-btn ${
          item.checked
            ? 'checked'
            : ''
        }"
        data-key="${escapeHtml(
          key
        )}"
        aria-label="Mark checklist point reviewed"
      >

        ${
          item.checked
            ? '✓'
            : ''
        }

      </button>


      <!-- POINT -->

      <div
        class="item-text"
      >

        ${escapeHtml(
          text
        )}

      </div>


      <!-- ACTIONS -->

      <div
        class="item-actions"
      >


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


    <!-- ==============================================
         DETAILS
    =============================================== -->

    <div
      class="extra ${
        hasDetails(item)
          ? ''
          : 'hidden'
      }"
      id="extra-${escapeHtml(
        key
      )}"
    >


      <!-- REVIEWER COMMENTS -->

      <div
        id="comments-${escapeHtml(
          key
        )}"
        class="comments-list"
      ></div>


      <!-- ADD COMMENT -->

      <div
        class="comment-row"
      >


        <textarea
          id="comment-input-${escapeHtml(
            key
          )}"
          placeholder="Add reviewer comment"
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


      <!-- PHOTOS -->

      <div
        id="photos-${escapeHtml(
          key
        )}"
        class="photos"
      ></div>


      <!-- FOLLOW-UP -->

      <div
        class="followup-row"
      >


        <input
          type="checkbox"
          id="followup-${escapeHtml(
            key
          )}"
          class="followup-check"
          data-key="${escapeHtml(
            key
          )}"
          ${
            item.followUpNeeded
              ? 'checked'
              : ''
          }
        >


        <label
          for="followup-${escapeHtml(
            key
          )}"
        >

          Follow-Up Needed from Ship

        </label>


      </div>


      <!-- SHIP RESPONSES -->

      <div
        id="ship-comments-${escapeHtml(
          key
        )}"
      ></div>


      <!-- PHOTO INPUT -->

      <input
        type="file"
        id="photo-input-${escapeHtml(
          key
        )}"
        class="photo-input hidden"
        data-key="${escapeHtml(
          key
        )}"
        accept="image/*"
        capture="environment"
      >


    </div>

  `;


  bindPointEvents(
    wrapper,
    key
  );


  renderComments(
    key
  );


  renderPhotos(
    key
  );


  renderShipComments(
    key
  );


  return wrapper;

}


/* ============================================================
   CHECK IF ITEM HAS DETAILS
============================================================ */

function hasDetails(
  item
){

  if(
    !item
  ){

    return false;

  }


  return (

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

    Boolean(
      item.followUpNeeded
    )

    ||

    (
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length > 0
    )

  );

}


/* ============================================================
   POINT EVENTS
============================================================ */

function bindPointEvents(
  element,
  key
){

  const checkButton =
    element.querySelector(
      '.check-btn'
    );


  const commentButton =
    element.querySelector(
      '.note-button'
    );


  const photoButton =
    element.querySelector(
      '.photo-button'
    );


  const addCommentButton =
    element.querySelector(
      '.add-comment'
    );


  const followUp =
    element.querySelector(
      '.followup-check'
    );


  const photoInput =
    element.querySelector(
      '.photo-input'
    );


  /* ==========================================================
     CHECK
  ========================================================== */

  if(
    checkButton
  ){

    checkButton.addEventListener(
      'click',
      async function(
        event
      ){

        event.stopPropagation();


        const checked =
          toggleChecked(
            key
          );


        checkButton.classList.toggle(
          'checked',
          checked
        );


        checkButton.textContent =
          checked
            ? '✓'
            : '';


        refreshChecklistUI();


        await saveCurrentReport();

      }
    );

  }


  /* ==========================================================
     COMMENT
  ========================================================== */

  if(
    commentButton
  ){

    commentButton.addEventListener(
      'click',
      function(
        event
      ){

        event.stopPropagation();


        openDetails(
          key
        );


        const input =
          getElement(
            `comment-input-${key}`
          );


        if(
          input
        ){

          input.focus();

        }

      }
    );

  }


  /* ==========================================================
     PHOTO
  ========================================================== */

  if(
    photoButton
  ){

    photoButton.addEventListener(
      'click',
      function(
        event
      ){

        event.stopPropagation();


        openDetails(
          key
        );


        if(
          photoInput
        ){

          photoInput.click();

        }

      }
    );

  }


  /* ==========================================================
     ADD COMMENT
  ========================================================== */

  if(
    addCommentButton
  ){

    addCommentButton.addEventListener(
      'click',
      async function(
        event
      ){

        event.stopPropagation();


        const input =
          getElement(
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


        openDetails(
          key
        );


        renderComments(
          key
        );


        await saveCurrentReport();

      }
    );

  }


  /* ==========================================================
     FOLLOW-UP
  ========================================================== */

  if(
    followUp
  ){

    followUp.addEventListener(
      'change',
      async function(
        event
      ){

        event.stopPropagation();


        setFollowUp(
          key,
          followUp.checked
        );


        openDetails(
          key
        );


        await saveCurrentReport();

      }
    );

  }


  /* ==========================================================
     PHOTO INPUT
  ========================================================== */

  if(
    photoInput
  ){

    photoInput.addEventListener(
      'change',
      async function(
        event
      ){

        const file =
          event.target.files &&
          event.target.files[0];


        if(
          !file
        ){

          return;

        }


        try{

          const photo =
            await readAndResizeImage(
              file
            );


          addPhoto(
            key,
            photo
          );


          openDetails(
            key
          );


          renderPhotos(
            key
          );


          await saveCurrentReport();

        }catch(error){

          console.error(
            'Photo error:',
            error
          );


          alert(
            'Could not add the photo.'
          );

        }


        photoInput.value =
          '';

      }
    );

  }

}


/* ============================================================
   OPEN DETAILS
============================================================ */

function openDetails(
  key
){

  const extra =
    getElement(
      `extra-${key}`
    );


  if(
    extra
  ){

    extra.classList.remove(
      'hidden'
    );

  }

}


/* ============================================================
   REVIEWER COMMENTS
============================================================ */

function renderComments(
  key
){

  const container =
    getElement(
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


  const comments =
    Array.isArray(
      item?.comments
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
      style="
        margin-top:8px;
        margin-bottom:5px;
        color:var(--vv-squid);
        font-size:9px;
        font-weight:800;
        letter-spacing:.04em;
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
                  getReviewer() ||
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
   PHOTOS
============================================================ */

function renderPhotos(
  key
){

  const container =
    getElement(
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


  const photos =
    Array.isArray(
      item?.photos
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


      const image =
        document.createElement(
          'img'
        );


      image.src =
        source;


      image.alt =
        'Reviewer photo';


      wrapper.appendChild(
        image
      );


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
        async function(
          event
        ){

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
   SHIP COMMENTS
============================================================ */

function renderShipComments(
  key
){

  const container =
    getElement(
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


  const comments =
    Array.isArray(
      item?.shipComments
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
        margin-top:10px;
        margin-bottom:5px;
        color:var(--vv-squid);
        font-size:9px;
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
            >

              <strong>

                ${escapeHtml(
                  comment.name ||
                  'Ship'
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
   IMAGE RESIZE
============================================================ */

function readAndResizeImage(
  file
){

  return new Promise(
    function(
      resolve,
      reject
    ){

      const reader =
        new FileReader();


      reader.onload =
        function(){

          const image =
            new Image();


          image.onload =
            function(){

              const maxWidth =
                1280;


              const ratio =
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
                    ratio
                  )
                );


              const height =
                Math.max(
                  1,
                  Math.round(
                    image.height *
                    ratio
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
            function(){

              reject(
                new Error(
                  'Could not load image.'
                )
              );

            };


          image.src =
            reader.result;

        };


      reader.onerror =
        function(){

          reject(
            new Error(
              'Could not read image.'
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
   REFRESH CHECKLIST UI
============================================================ */

export function refreshChecklistUI(){

  const state =
    getState();


  let total =
    0;


  let checked =
    0;


  SECTIONS.forEach(
    section => {

      if(
        !Array.isArray(
          section.items
        )
      ){

        return;

      }


      section.items.forEach(
        (
          _text,
          index
        ) => {

          total++;


          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if(
            item?.checked
          ){

            checked++;

          }


          const button =
            document.querySelector(
              `.check-btn[data-key="${key}"]`
            );


          if(
            button
          ){

            const isChecked =
              Boolean(
                item?.checked
              );


            button.classList.toggle(
              'checked',
              isChecked
            );


            button.textContent =
              isChecked
                ? '✓'
                : '';

          }

        }
      );

    }
  );


  /*
    GLOBAL PROGRESS
  */

  const progress =
    getElement(
      'progress'
    );


  const fill =
    getElement(
      'fill'
    );


  const percentage =
    total > 0
      ? Math.round(
          checked /
          total *
          100
        )
      : 0;


  if(
    progress
  ){

    progress.textContent =
      `${checked} of ${total} points reviewed`;

  }


  if(
    fill
  ){

    fill.style.width =
      `${percentage}%`;

  }


  /*
    CURRENT DEPARTMENT COUNT
  */

  if(
    currentDepartment
  ){

    const section =
      SECTIONS.find(
        item =>
          item.id ===
          currentDepartment
      );


    if(
      section
    ){

      const count =
        getDepartmentCount(
          section
        );


      const element =
        getElement(
          'departmentCurrentCount'
        );


      if(
        element
      ){

        element.textContent =
          `${count.checked}/${count.total} checked`;

      }

    }

  }


  /*
    Refresh details for currently
    displayed points.
  */

  if(
    currentDepartment
  ){

    const section =
      SECTIONS.find(
        item =>
          item.id ===
          currentDepartment
      );


    if(
      section
    ){

      section.items.forEach(
        (
          _text,
          index
        ) => {

          const key =
            `${section.id}__${index}`;


          renderComments(
            key
          );


          renderPhotos(
            key
          );


          renderShipComments(
            key
          );

        }
      );

    }

  }


}


/* ============================================================
   UPDATE HEADER
============================================================ */

export function updateChecklistHeader(){

  const meta =
    getMeta();


  const ship =
    getElement(
      'hdrShip'
    );


  const reviewer =
    getElement(
      'hdrReviewer'
    );


  const visit =
    getElement(
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

              followUpNeeded:
                true,

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
            state[key] ||
            {};


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
    getElement(
      'sections'
    );


  if(
    container
  ){

    container.innerHTML =
      '';

  }


  currentDepartment =
    null;


  const progress =
    getElement(
      'progress'
    );


  if(
    progress
  ){

    progress.textContent =
      '0 of 0 points reviewed';

  }


  const fill =
    getElement(
      'fill'
    );


  if(
    fill
  ){

    fill.style.width =
      '0%';

  }

}


/* ============================================================
   EXPORT
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
