/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  checklist.js
  ============================================================

  MAIN FLOW

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
   CURRENT DEPARTMENT
============================================================ */

let currentDepartmentId = null;


/* ============================================================
   CALLBACK
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
   HELPERS
============================================================ */

function escapeHtml(
  value
){

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    function(
      character
    ){

      return {

        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'

      }[character];

    }
  );

}


function getElement(
  id
){

  return document.getElementById(
    id
  );

}


/* ============================================================
   SAVE
============================================================ */

async function saveCurrentReport(){

  const reportId =
    getReportId();


  if(
    !reportId
  ){

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
          'Checklist callback error:',
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
   GLOBAL COUNTS
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

      total +=
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
   DEPARTMENT COUNTS
============================================================ */

function getDepartmentCounts(
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
   DEPARTMENT ICON
============================================================ */

function getDepartmentIcon(
  id
){

  const icons = {

    culinary: '🍴',

    bar: '🍸',

    restaurant: '🍽',

    procurement: '📦',

    sanitation: '🧼'

  };


  return (
    icons[id] ||
    '✓'
  );

}


/* ============================================================
   RENDER MAIN CHECKLIST
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
      '#sections not found'
    );


    return;

  }


  currentDepartmentId =
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


      <div class="department-overview">

        <div class="department-overview-title">

          REPORT OVERVIEW

        </div>


        <div class="department-overview-grid">


          <div class="department-overview-card">

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


          <div class="department-overview-card">

            <strong>
              ${counts.comments}
            </strong>

            <small>
              COMMENTS
            </small>

          </div>


          <div class="department-overview-card">

            <strong>
              ${counts.photos}
            </strong>

            <small>
              PHOTOS
            </small>

          </div>


          <div class="department-overview-card">

            <strong>
              ${counts.followUps}
            </strong>

            <small>
              FOLLOW-UPS
            </small>

          </div>


        </div>

      </div>


      <div class="department-heading">

        DEPARTMENTS

      </div>


      <div class="department-grid">


        ${
          SECTIONS.map(
            section => {

              const departmentCounts =
                getDepartmentCounts(
                  section
                );


              const complete =
                departmentCounts.checked ===
                departmentCounts.total;


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

                  <div class="department-icon">

                    <span
                      aria-hidden="true"
                    >

                      ${getDepartmentIcon(
                        section.id
                      )}

                    </span>

                  </div>


                  <div class="department-card-name">

                    ${escapeHtml(
                      section.title
                    )}

                  </div>


                  <div class="department-card-count">

                    ${departmentCounts.checked}/${departmentCounts.total}

                  </div>


                  <div class="department-card-label">

                    ${
                      complete
                        ? 'COMPLETE'
                        : 'OPEN CHECKLIST'
                    }

                  </div>


                </button>

              `;

            }
          ).join('')
        }


      </div>


      <div class="department-help">

        Select a department to open
        its checklist points.

      </div>


    </div>

  `;


  /*
    Bind department buttons.
  */

  const buttons =
    container.querySelectorAll(
      '[data-department]'
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        function(){

          openDepartment(
            button.dataset.department
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


  currentDepartmentId =
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

  currentDepartmentId =
    null;


  renderDepartmentHome();


  window.scrollTo(
    0,
    0
  );

}


/* ============================================================
   RENDER DEPARTMENT
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


  const counts =
    getDepartmentCounts(
      section
    );


  container.innerHTML = `

    <div class="department-checklist">


      <div class="department-checklist-top">


        <button
          type="button"
          id="departmentBackBtn"
          class="department-back"
        >

          ← Departments

        </button>


        <div class="department-checklist-title">


          <div class="department-checklist-icon">

            <span>

              ${getDepartmentIcon(
                section.id
              )}

            </span>

          </div>


          <div>

            <div class="department-checklist-name">

              ${escapeHtml(
                section.title
              )}

            </div>


            <div
              class="department-checklist-count"
              id="departmentCurrentCount"
            >

              ${counts.checked}/${counts.total}
              checked

            </div>

          </div>


        </div>


      </div>


      ${
        section.note
          ? `

            <div class="department-note">

              ${escapeHtml(
                section.note
              )}

            </div>

          `
          : ''
      }


      <div
        id="departmentPoints"
        class="department-point-list"
      ></div>


    </div>

  `;


  const backButton =
    getElement(
      'departmentBackBtn'
    );


  if(
    backButton
  ){

    backButton.addEventListener(
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

      container.appendChild(
        createChecklistItem(
          section,
          text,
          index
        )
      );

    }
  );


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


  const item =
    getItem(
      key
    ) || {};


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
        class="check-btn ${
          item.checked
            ? 'checked'
            : ''
        }"
        data-key="${escapeHtml(
          key
        )}"
        aria-label="Mark point checked"
      >

        ${
          item.checked
            ? '✓'
            : ''
        }

      </button>


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
      class="extra ${
        hasDetails(
          item
        )
          ? ''
          : 'hidden'
      }"
      id="extra-${key}"
    >


      <div
        id="comments-${key}"
        class="comments-list"
      ></div>


      <div class="comment-row">


        <textarea
          id="comment-input-${key}"
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
        id="photos-${key}"
        class="photos"
      ></div>


      <div class="followup-row">


        <input
          type="checkbox"
          class="followup-check"
          data-key="${escapeHtml(
            key
          )}"
          id="followup-${key}"
          ${
            item.followUpNeeded
              ? 'checked'
              : ''
          }
        >


        <label
          for="followup-${key}"
        >

          Follow-Up Needed from Ship

        </label>


      </div>


      <div
        id="ship-comments-${key}"
        class="ship-comments"
      ></div>


      <input
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden photo-input"
        id="photo-input-${key}"
        data-key="${escapeHtml(
          key
        )}"
      >


    </div>

  `;


  bindItemEvents(
    element,
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


  return element;

}


/* ============================================================
   HAS DETAILS
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
   ITEM EVENTS
============================================================ */

function bindItemEvents(
  element,
  key
){

  const checkButton =
    element.querySelector(
      '.check-btn'
    );


  const noteButton =
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


  if(
    noteButton
  ){

    noteButton.addEventListener(
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

          const data =
            await readAndResizeImage(
              file
            );


          addPhoto(
            key,
            data
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
   COMMENTS
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

            <div class="comment">

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

            <div class="ship-response-display">

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
   IMAGE READER
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
                    'Canvas unavailable.'
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
   REFRESH UI
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

      total +=
        section.items.length;


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


          const button =
            document.querySelector(
              `.check-btn[data-key="${key}"]`
            );


          if(
            button
          ){

            const isChecked =
              Boolean(
                state[key]?.checked
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


  const fill =
    getElement(
      'fill'
    );


  const progress =
    getElement(
      'progress'
    );


  if(
    fill
  ){

    const percentage =
      total > 0
        ? Math.round(
            checked /
            total *
            100
          )
        : 0;


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
    Department count.
  */

  if(
    currentDepartmentId
  ){

    const section =
      SECTIONS.find(
        item =>
          item.id ===
          currentDepartmentId
      );


    if(
      section
    ){

      const counts =
        getDepartmentCounts(
          section
        );


      const current =
        getElement(
          'departmentCurrentCount'
        );


      if(
        current
      ){

        current.textContent =
          `${counts.checked}/${counts.total} checked`;

      }

    }

  }else{

    refreshDepartmentHome();

  }

}


/* ============================================================
   REFRESH DEPARTMENT HOME
============================================================ */

function refreshDepartmentHome(){

  const cards =
    document.querySelectorAll(
      '.department-card'
    );


  cards.forEach(
    card => {

      const id =
        card.dataset.department;


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


      const counts =
        getDepartmentCounts(
          section
        );


      const count =
        card.querySelector(
          '.department-card-count'
        );


      const label =
        card.querySelector(
          '.department-card-label'
        );


      if(
        count
      ){

        count.textContent =
          `${counts.checked}/${counts.total}`;

      }


      const complete =
        counts.checked ===
        counts.total;


      card.classList.toggle(
        'complete',
        complete
      );


      if(
        label
      ){

        label.textContent =
          complete
            ? 'COMPLETE'
            : 'OPEN CHECKLIST';

      }

    }
  );


  const counts =
    getChecklistCounts();


  const overview =
    document.querySelectorAll(
      '.department-overview-card'
    );


  if(
    overview.length >= 4
  ){

    const checked =
      overview[0]
        .querySelector(
          'strong'
        );


    const total =
      overview[0]
        .querySelector(
          'span'
        );


    const comments =
      overview[1]
        .querySelector(
          'strong'
        );


    const photos =
      overview[2]
        .querySelector(
          'strong'
        );


    const followUps =
      overview[3]
        .querySelector(
          'strong'
        );


    if(
      checked
    ){

      checked.textContent =
        counts.checked;

    }


    if(
      total
    ){

      total.textContent =
        `of ${counts.total}`;

    }


    if(
      comments
    ){

      comments.textContent =
        counts.comments;

    }


    if(
      photos
    ){

      photos.textContent =
        counts.photos;

    }


    if(
      followUps
    ){

      followUps.textContent =
        counts.followUps;

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

              followUpNeeded:true,

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
            state[key] || {};


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
   CLEAR UI
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


  currentDepartmentId =
    null;


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
