/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  checklist.js
  ============================================================

  CLEAN DEPARTMENT NAVIGATION

  Main screen:
    - Report overview
    - Department cards

  Department screen:
    - Checklist points
    - Circle check
    - Comment
    - Photo
    - Follow-up

  Compatible with current main.js
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

let currentDepartment = null;


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
   ESCAPE HTML
============================================================ */

function escapeHtml(
  value
){

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    character => {

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
        'Save report failed:',
        result?.error
      );


      return false;

    }


    if(
      typeof checklistChangedCallback ===
      'function'
    ){

      await checklistChangedCallback(
        result.data
      );

    }


    return true;

  }catch(error){

    console.error(
      'saveCurrentReport:',
      error
    );


    return false;

  }

}


/* ============================================================
   TOTAL COUNTS
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

    total:
      section.items.length

  };

}


/* ============================================================
   DEPARTMENT ICON
============================================================ */

function getDepartmentIcon(
  id
){

  const icons = {

    culinary:'🍴',

    bar:'🍸',

    restaurant:'🍽',

    procurement:'📦',

    sanitation:'🧼'

  };


  return (
    icons[id] ||
    '✓'
  );

}


/* ============================================================
   MAIN RENDER
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


  currentDepartment =
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


      <div class="department-help">

        Select a department to open
        its checklist.

      </div>


    </div>

  `;


  bindDepartmentButtons();

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
      data-department="${escapeHtml(
        section.id
      )}"
    >

      <div class="department-icon">

        <span>

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

        ${count.checked}/${count.total}

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


/* ============================================================
   DEPARTMENT BUTTONS
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
   CLOSE DEPARTMENT
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
   DEPARTMENT PAGE
============================================================ */

function renderDepartment(
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

              ${count.checked}/${count.total}
              checked

            </div>

          </div>


        </div>


      </div>


      <div
        id="departmentPoints"
        class="department-point-list"
      ></div>


    </div>

  `;


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


  renderDepartmentPoints(
    section
  );

}


/* ============================================================
   DEPARTMENT POINTS
============================================================ */

function renderDepartmentPoints(
  section
){

  const container =
    document.getElementById(
      'departmentPoints'
    );


  if(
    !container
  ){

    return;

  }


  section.items.forEach(
    (
      text,
      index
    ) => {

      const item =
        createPoint(
          section,
          text,
          index
        );


      container.appendChild(
        item
      );

    }
  );


  refreshChecklistUI();

}


/* ============================================================
   CREATE POINT
============================================================ */

function createPoint(
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
        hasDetails(item)
          ? ''
          : 'hidden'
      }"
      id="extra-${escapeHtml(
        key
      )}"
    >


      <div
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


      <div
        id="photos-${escapeHtml(
          key
        )}"
        class="photos"
      ></div>


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


      <div
        id="ship-comments-${escapeHtml(
          key
        )}"
      ></div>


      <input
        type="file"
        class="photo-input hidden"
        id="photo-input-${escapeHtml(
          key
        )}"
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
   DETAILS
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

  const check =
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


  const addComment =
    element.querySelector(
      '.add-comment'
    );


  const followup =
    element.querySelector(
      '.followup-check'
    );


  const photoInput =
    element.querySelector(
      '.photo-input'
    );


  /*
    CHECK
  */

  if(
    check
  ){

    check.addEventListener(
      'click',
      async function(
        event
      ){

        event.stopPropagation();


        const checked =
          toggleChecked(
            key
          );


        check.classList.toggle(
          'checked',
          checked
        );


        check.textContent =
          checked
            ? '✓'
            : '';


        refreshChecklistUI();


        await saveCurrentReport();

      }
    );

  }


  /*
    COMMENT
  */

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
          document.getElementById(
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


  /*
    PHOTO
  */

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


  /*
    ADD COMMENT
  */

  if(
    addComment
  ){

    addComment.addEventListener(
      'click',
      async function(
        event
      ){

        event.stopPropagation();


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


  /*
    FOLLOW-UP
  */

  if(
    followup
  ){

    followup.addEventListener(
      'change',
      async function(
        event
      ){

        event.stopPropagation();


        setFollowUp(
          key,
          followup.checked
        );


        openDetails(
          key
        );


        await saveCurrentReport();

      }
    );

  }


  /*
    PHOTO INPUT
  */

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
            await readImage(
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
            'Could not add photo.'
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

}


/* ============================================================
   COMMENTS
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
                  getReviewer() ||
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

  `;

}


/* ============================================================
   PHOTOS
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
   READ IMAGE
============================================================ */

function readImage(
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
                Math.round(
                  image.width *
                  ratio
                );


              const height =
                Math.round(
                  image.height *
                  ratio
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
                    'Could not create canvas.'
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
              `[data-key="${key}"].check-btn`
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
    Progress.
  */

  const progress =
    document.getElementById(
      'progress'
    );


  const fill =
    document.getElementById(
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
    Department count.
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
        document.getElementById(
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
   ALL POINTS
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
   CLEAR UI
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


  currentDepartment =
    null;


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

}


/* ============================================================
   DEFAULT
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
