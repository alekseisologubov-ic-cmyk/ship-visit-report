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
  removeReviewerComment,
  addDepartmentGeneralComment,
  removeDepartmentGeneralComment,
  getDepartmentGeneralComments,
  addReportGeneralComment,
  removeReportGeneralComment,
  getReportGeneralComments,
  addPhoto,
  removePhoto,
  setFollowUp,
  getMeta,
  getReviewer,
  getReportId
} from './state.js';


import {
  saveOpenReport,
  uploadPhotoDataUrl,
  getPhotoDisplayUrl,
  deleteStoragePhoto
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
           REPORT GENERAL COMMENTS
      ================================================= -->

      <div
        class="report-general-comments"
        style="
          margin-top:18px;
          margin-bottom:22px;
          padding:16px;
          background:#FFFFFF;
          border:1px solid var(--vv-line);
          border-radius:10px;
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
          GENERAL REPORT COMMENTS
        </div>

        <div
          id="report-general-comments-list"
          style="margin-bottom:10px;"
        ></div>

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:10px;
            align-items:stretch;
            width:100%;
          "
        >
          <textarea
            id="report-general-comment-input"
            placeholder="Add general comments for the overall ship visit report"
            style="
              display:block;
              flex:none;
              min-height:105px;
              width:100%;
              box-sizing:border-box;
              padding:12px;
              border:1px solid var(--vv-line);
              border-radius:8px;
              resize:vertical;
              font:inherit;
            "
          ></textarea>

          <button
            type="button"
            id="report-general-comment-add"
            class="btn-primary"
            style="
              align-self:stretch;
              width:100%;
              min-width:0;
              min-height:44px;
            "
          >
            Add Comment
          </button>
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


  renderReportGeneralComments();
  bindReportGeneralComment();
  bindDepartmentButtons();

}


/* ============================================================
   REPORT GENERAL COMMENTS
============================================================ */

function renderReportGeneralComments(){
  const container = getElement('report-general-comments-list');
  if(!container) return;

  const comments = getReportGeneralComments();

  container.innerHTML = comments.map((comment, index) => `
    <div
      style="
        position:relative;
        margin-bottom:8px;
        padding:10px 42px 10px 12px;
        border-left:4px solid var(--vv-squid);
        border-radius:7px;
        background:#F8F5FA;
        font-size:12px;
        line-height:1.5;
      "
    >
      <button
        type="button"
        data-remove-report-general-comment="${index}"
        aria-label="Delete general report comment"
        title="Delete comment"
        style="
          position:absolute;
          top:8px;
          right:8px;
          width:26px;
          height:26px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0;
          border:1px solid rgba(60,16,83,.18);
          border-radius:50%;
          background:#FFFFFF;
          color:var(--vv-squid);
          font-size:18px;
          line-height:1;
          font-weight:800;
          cursor:pointer;
        "
      >×</button>

      <strong>${escapeHtml(comment.name || getReviewer() || 'Reviewer')}:</strong>
      <div style="margin-top:3px;">${escapeHtml(comment.text || '')}</div>
    </div>
  `).join('');

  container
    .querySelectorAll('[data-remove-report-general-comment]')
    .forEach(button => {
      button.addEventListener('click', async function(event){
        event.stopPropagation();

        const index = Number(button.dataset.removeReportGeneralComment);

        if(!Number.isInteger(index)) return;
        if(!window.confirm('Delete this comment?')) return;
        if(!removeReportGeneralComment(index)) return;

        renderReportGeneralComments();
        await saveCurrentReport();
      });
    });
}

function bindReportGeneralComment(){
  const button = getElement('report-general-comment-add');
  const input = getElement('report-general-comment-input');

  if(!button || !input) return;

  button.addEventListener('click', async function(){
    const text = input.value.trim();

    if(!text){
      input.focus();
      return;
    }

    if(!addReportGeneralComment(text)) return;

    input.value = '';
    renderReportGeneralComments();
    await saveCurrentReport();
  });
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
           GENERAL COMMENTS
      =============================================== -->

      <div class="department-general-comments">

        <div class="department-general-comments-title">
          GENERAL COMMENTS
        </div>

        <div
          id="general-comments-${escapeHtml(section.id)}"
          class="department-general-comments-list"
        ></div>

        <div class="department-general-comment-row">

          <textarea
            id="general-comment-input-${escapeHtml(section.id)}"
            placeholder="Add general comments for this department..."
          ></textarea>

          <button
            type="button"
            class="department-general-comment-add"
            data-general-comment-section="${escapeHtml(section.id)}"
          >
            Add Comment
          </button>

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


  bindDepartmentGeneralComment(section);
  renderDepartmentGeneralComments(section);

  renderDepartmentPoints(
    section
  );

}


/* ============================================================
   GENERAL COMMENTS
============================================================ */

function renderDepartmentGeneralComments(section){

  const container = getElement(`general-comments-${section.id}`);
  if(!container) return;

  const comments = getDepartmentGeneralComments(section.id);

  container.innerHTML = comments.map((comment, index) => `
    <div
      class="department-general-comment"
      style="position:relative;padding-right:42px;"
    >
      <button
        type="button"
        data-remove-department-general-comment="${index}"
        aria-label="Delete department general comment"
        title="Delete comment"
        style="
          position:absolute;
          top:7px;
          right:7px;
          width:25px;
          height:25px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0;
          border:1px solid rgba(60,16,83,.18);
          border-radius:50%;
          background:#FFFFFF;
          color:var(--vv-squid);
          font-size:17px;
          line-height:1;
          font-weight:800;
          cursor:pointer;
        "
      >×</button>

      <strong>${escapeHtml(comment.name || getReviewer() || 'Reviewer')}:</strong>
      <div style="margin-top:3px;">${escapeHtml(comment.text || '')}</div>
    </div>
  `).join('');

  container
    .querySelectorAll('[data-remove-department-general-comment]')
    .forEach(button => {
      button.addEventListener('click', async function(event){
        event.stopPropagation();

        const index = Number(button.dataset.removeDepartmentGeneralComment);

        if(!Number.isInteger(index)) return;
        if(!window.confirm('Delete this comment?')) return;
        if(!removeDepartmentGeneralComment(section.id, index)) return;

        renderDepartmentGeneralComments(section);
        await saveCurrentReport();
      });
    });

}

function bindDepartmentGeneralComment(section){

  const button = document.querySelector(
    `[data-general-comment-section="${section.id}"]`
  );
  const input = getElement(
    `general-comment-input-${section.id}`
  );

  if(!button || !input) return;

  button.addEventListener('click', async function(){

    const text = input.value.trim();
    if(!text){
      input.focus();
      return;
    }

    if(!addDepartmentGeneralComment(section.id, text)) return;

    input.value = '';
    renderDepartmentGeneralComments(section);
    await saveCurrentReport();

  });

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
     PHOTO INPUT & DRAG AND DROP
  ========================================================== */

  if(
    photoInput
  ){

    const addPhotoFile = async function(
      file
    ){

      if(
        !file ||
        !file.type.startsWith('image/')
      ){

        return;

      }


      try{

        const reportId = getReportId();
        if(!reportId){
          throw new Error('Create or open a report before attaching photos.');
        }

        const dataUrl = await readAndResizeImage(file);
        const photoRef = await uploadPhotoDataUrl(
          reportId,
          key,
          dataUrl,
          file.name || 'photo.jpg'
        );

        addPhoto(
          key,
          photoRef
        );

        openDetails(key);
        renderPhotos(key);

        const saved = await saveCurrentReport();
        if(!saved){
          throw new Error('The photo uploaded, but the report could not be saved. Please retry saving before closing the report.');
        }

      }catch(error){

        console.error(
          'Photo error:',
          error
        );


        alert(
          'Could not add the photo.'
        );

      }

    };


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


        await addPhotoFile(
          file
        );


        photoInput.value =
          '';

      }
    );


    /*
      Drag & Drop target binding (Card + Button)
    */

    const dragTargets = [element, photoButton].filter(Boolean);

    dragTargets.forEach(target => {

      target.addEventListener(
        'dragenter',
        function(event){

          event.preventDefault();

          event.stopPropagation();

          element.classList.add('drag-over');

        }
      );


      target.addEventListener(
        'dragover',
        function(event){

          event.preventDefault();

          event.stopPropagation();

          if(event.dataTransfer){

            event.dataTransfer.dropEffect = 'copy';

          }

          element.classList.add('drag-over');

        }
      );


      target.addEventListener(
        'dragleave',
        function(event){

          event.preventDefault();

          event.stopPropagation();

          if(!element.contains(event.relatedTarget)){

            element.classList.remove('drag-over');

          }

        }
      );


      target.addEventListener(
        'drop',
        async function(event){

          event.preventDefault();

          event.stopPropagation();

          element.classList.remove('drag-over');


          const files =
            event.dataTransfer &&
            event.dataTransfer.files;


          if(!files || files.length === 0){

            return;

          }


          for(let i = 0; i < files.length; i++){

            if(files[i].type.startsWith('image/')){

              openDetails(key);

              await addPhotoFile(files[i]);

            }

          }

        }
      );

    });

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
          (comment, index) => `

            <div
              class="comment"
              style="
                position:relative;
                padding-right:42px;
              "
            >

              <button
                type="button"
                data-remove-reviewer-comment="${index}"
                aria-label="Delete reviewer comment"
                title="Delete comment"
                style="
                  position:absolute;
                  top:7px;
                  right:7px;
                  width:25px;
                  height:25px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  padding:0;
                  border:1px solid rgba(60,16,83,.18);
                  border-radius:50%;
                  background:#FFFFFF;
                  color:var(--vv-squid);
                  font-size:17px;
                  line-height:1;
                  font-weight:800;
                  cursor:pointer;
                "
              >×</button>

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


  container
    .querySelectorAll('[data-remove-reviewer-comment]')
    .forEach(button => {
      button.addEventListener('click', async function(event){
        event.stopPropagation();

        const index = Number(button.dataset.removeReviewerComment);

        if(!Number.isInteger(index)) return;
        if(!window.confirm('Delete this comment?')) return;
        if(!removeReviewerComment(key, index)) return;

        renderComments(key);
        await saveCurrentReport();
      });
    });

}


/* ============================================================
   PHOTOS
============================================================ */

/* ============================================================
   PHOTO LIGHTBOX + LAZY THUMBNAILS
============================================================ */

let photoLightbox = null;
let photoLightboxImage = null;
let photoLightboxStatus = null;
let photoLightboxPreviousOverflow = '';

function ensurePhotoLightbox(){
  if(photoLightbox && photoLightbox.isConnected) return;

  if(!document.getElementById('ship-report-photo-lightbox-style')){
    const style = document.createElement('style');
    style.id = 'ship-report-photo-lightbox-style';
    style.textContent = `
      .photo img { cursor: zoom-in; }
      #ship-report-photo-lightbox[hidden] { display: none !important; }
      #ship-report-photo-lightbox {
        position: fixed; inset: 0; z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        padding: 24px; box-sizing: border-box;
        background: rgba(12, 5, 18, .94);
      }
      #ship-report-photo-lightbox .photo-lightbox-panel {
        position: relative; display: flex; align-items: center; justify-content: center;
        width: 100%; height: 100%; min-width: 0; min-height: 0;
      }
      #ship-report-photo-lightbox .photo-lightbox-image {
        display: block; max-width: 96vw; max-height: 90vh; width: auto; height: auto;
        object-fit: contain; border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,.45);
      }
      #ship-report-photo-lightbox .photo-lightbox-close {
        position: absolute; top: 0; right: 0; z-index: 1;
        width: 44px; height: 44px; border: 1px solid rgba(255,255,255,.65);
        border-radius: 50%; background: #fff; color: #3C1053; font-size: 30px;
        line-height: 1; cursor: pointer;
      }
      #ship-report-photo-lightbox .photo-lightbox-status {
        color: #fff; font: 600 16px/1.5 Arial, sans-serif; text-align: center;
        padding: 16px; max-width: 80vw;
      }
      #ship-report-photo-lightbox .photo-lightbox-status[hidden] { display: none; }
      @media (max-width: 600px) {
        #ship-report-photo-lightbox { padding: 10px; }
        #ship-report-photo-lightbox .photo-lightbox-image { max-width: 98vw; max-height: 86vh; }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = 'ship-report-photo-lightbox';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Photo preview');

  const panel = document.createElement('div');
  panel.className = 'photo-lightbox-panel';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'photo-lightbox-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close photo preview');

  const status = document.createElement('div');
  status.className = 'photo-lightbox-status';
  status.textContent = 'Loading photo…';

  const preview = document.createElement('img');
  preview.className = 'photo-lightbox-image';
  preview.alt = 'Enlarged report photo';
  preview.hidden = true;
  preview.decoding = 'async';

  panel.append(close, status, preview);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  close.addEventListener('click', closePhotoLightbox);
  overlay.addEventListener('click', event => {
    if(event.target === overlay) closePhotoLightbox();
  });
  panel.addEventListener('click', event => {
    if(event.target === panel) closePhotoLightbox();
  });

  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && photoLightbox && !photoLightbox.hidden){
      closePhotoLightbox();
    }
  });

  photoLightbox = overlay;
  photoLightboxImage = preview;
  photoLightboxStatus = status;
}

function closePhotoLightbox(){
  if(!photoLightbox) return;
  photoLightbox.hidden = true;
  if(photoLightboxImage){
    photoLightboxImage.removeAttribute('src');
    photoLightboxImage.hidden = true;
    photoLightboxImage.onload = null;
    photoLightboxImage.onerror = null;
  }
  if(photoLightboxStatus){
    photoLightboxStatus.hidden = false;
    photoLightboxStatus.textContent = 'Loading photo…';
  }
  document.body.style.overflow = photoLightboxPreviousOverflow;
}

function photoStoragePathForChecklist(source){
  if(source && typeof source === 'object' && typeof source.storagePath === 'string'){
    return source.storagePath;
  }
  if(typeof source === 'string' && source.startsWith('storage://')){
    return source.slice('storage://'.length);
  }
  return '';
}

function directPhotoUrlForChecklist(source){
  if(typeof source === 'string' && !source.startsWith('storage://')) return source;
  if(source && typeof source === 'object') return source.url || source.src || source.data || '';
  return '';
}

async function openPhotoLightbox(source, getThumbnailUrl){
  ensurePhotoLightbox();
  photoLightbox.hidden = false;
  photoLightboxPreviousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  photoLightboxImage.hidden = true;
  photoLightboxImage.removeAttribute('src');
  photoLightboxStatus.hidden = false;
  photoLightboxStatus.textContent = 'Loading photo…';

  try{
    // Reuse the lazy-loaded thumbnail URL when possible. Storage URLs are signed
    // only when the thumbnail is about to display or the user opens the photo.
    const url = typeof getThumbnailUrl === 'function'
      ? await getThumbnailUrl()
      : (directPhotoUrlForChecklist(source) || await getPhotoDisplayUrl(source));
    if(!url) throw new Error('Photo reference is missing.');
    if(!photoLightbox || photoLightbox.hidden) return;

    photoLightboxImage.onload = () => {
      photoLightboxImage.hidden = false;
      photoLightboxStatus.hidden = true;
    };
    photoLightboxImage.onerror = () => {
      photoLightboxImage.hidden = true;
      photoLightboxStatus.hidden = false;
      photoLightboxStatus.textContent = 'Could not load this photo. Please close and try again.';
    };
    photoLightboxImage.src = url;
    // Data URLs / cached URLs can finish loading before handlers fire in some browsers.
    if(photoLightboxImage.complete && photoLightboxImage.naturalWidth > 0){
      photoLightboxImage.hidden = false;
      photoLightboxStatus.hidden = true;
    }
  }catch(error){
    console.error('Could not open photo preview:', error);
    if(photoLightbox && !photoLightbox.hidden){
      photoLightboxStatus.hidden = false;
      photoLightboxStatus.textContent = 'Could not load this photo. Please close and try again.';
    }
  }
}

function photoFileDisplayNameForChecklist(source, index){
  // Existing legacy photos are stored as data URLs, so their original upload
  // filenames were not retained. Use a stored filename/path when available;
  // otherwise use a stable, human-readable label.
  let candidate = '';
  if(source && typeof source === 'object'){
    candidate = source.fileName || source.filename || source.originalName || source.name || '';
    if(!candidate && typeof source.storagePath === 'string') candidate = source.storagePath;
  }else if(typeof source === 'string' && source.startsWith('storage://')){
    candidate = source.slice('storage://'.length);
  }

  candidate = String(candidate || '').split(/[?#]/, 1)[0].replace(/\\/g, '/');
  if(candidate.includes('/')) candidate = candidate.slice(candidate.lastIndexOf('/') + 1);
  try{ candidate = decodeURIComponent(candidate); }catch(_error){}
  candidate = candidate.trim();
  if(candidate && /\.[a-z0-9]{2,5}$/i.test(candidate)) return candidate;

  let extension = 'jpg';
  const mimeMatch = (typeof source === 'string' ? source : '')
    .match(/^data:image\/([a-z0-9.+-]+);/i);
  if(mimeMatch){
    const mimeExtension = mimeMatch[1].toLowerCase();
    extension = mimeExtension === 'jpeg' ? 'jpg' : mimeExtension.replace(/^svg\+xml$/, 'svg');
  }else if(source && typeof source === 'object' && typeof source.type === 'string'){
    const typeExtension = source.type.split('/')[1];
    if(typeExtension) extension = typeExtension.toLowerCase() === 'jpeg' ? 'jpg' : typeExtension.toLowerCase();
  }
  return `Photo ${String(index + 1).padStart(2, '0')}.${extension}`;
}

function renderPhotos(
  key
){
  const container = getElement(`photos-${key}`);
  if(!container) return;

  const item = getItem(key);
  const photos = Array.isArray(item?.photos) ? item.photos : [];
  container.innerHTML = '';

  // Display an attachment-style list rather than downloading/rendering every
  // image inline. Actual image bytes are requested only after a file is clicked.
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'stretch';
  container.style.gap = '8px';

  photos.forEach((source, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo photo-file-entry';
    Object.assign(wrapper.style, {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      maxWidth: '520px',
      minHeight: '46px',
      boxSizing: 'border-box',
      padding: '8px 48px 8px 12px',
      margin: '0',
      border: '1px solid rgba(60, 16, 83, 0.22)',
      borderRadius: '8px',
      background: '#fff'
    });

    const fileButton = document.createElement('button');
    fileButton.type = 'button';
    fileButton.className = 'photo-file-open';
    fileButton.textContent = photoFileDisplayNameForChecklist(source, index);
    fileButton.title = 'Click to open photo preview';
    fileButton.setAttribute('aria-label', `Open photo ${index + 1}: ${fileButton.textContent}`);
    Object.assign(fileButton.style, {
      display: 'block',
      flex: '1 1 auto',
      minWidth: '0',
      padding: '4px 0',
      border: '0',
      background: 'transparent',
      color: '#3C1053',
      font: '600 14px/1.4 Arial, sans-serif',
      textAlign: 'left',
      textDecoration: 'underline',
      overflowWrap: 'anywhere',
      cursor: 'pointer'
    });
    fileButton.addEventListener('click', () => {
      openPhotoLightbox(source, async () => {
        const storagePath = photoStoragePathForChecklist(source);
        if(storagePath) return await getPhotoDisplayUrl(source);
        return directPhotoUrlForChecklist(source) || await getPhotoDisplayUrl(source);
      });
    });
    wrapper.appendChild(fileButton);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'photo-remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${fileButton.textContent}`);
    remove.addEventListener('click', async function(event){
      event.stopPropagation();
      const removedPhoto = getItem(key)?.photos?.[index];
      removePhoto(key, index);
      renderPhotos(key);

      const saved = await saveCurrentReport();
      if(saved && removedPhoto && typeof removedPhoto === 'object' && removedPhoto.storagePath){
        try{ await deleteStoragePhoto(removedPhoto.storagePath); }
        catch(storageError){ console.warn('Photo reference removed, but Storage cleanup failed:', storageError); }
      }
    });
    wrapper.appendChild(remove);
    container.appendChild(wrapper);
  });
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

      renderDepartmentGeneralComments(section);

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
