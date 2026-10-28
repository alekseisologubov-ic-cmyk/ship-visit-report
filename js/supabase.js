==========================================================================================
FILE: ship_visit_main_updated.txt
==========================================================================================

/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  main.js
  ============================================================

  STABLE MASTER CONTROLLER

  IMPORTANT:
  This version intentionally does NOT depend on reports.js
  for loading Open Reports, Ship Response Reports, or
  Submitted Reports.

  That removes one of the current freeze points.

  FLOW:

    HOME
      |
      +-- CREATE REPORT
      |      |
      |      +-- DEPARTMENT HOME
      |             |
      |             +-- CHECKLIST
      |             |
      |             +-- REPORT SUMMARY
      |             |
      |             +-- SEND TO SHIP REVIEW
      |
      +-- OPEN REPORTS
      |      |
      |      +-- OPEN REPORT
      |
      +-- SHIP RESPONSE REPORT
      |      |
      |      +-- SHIP RESPONSE
      |             |
      |             +-- SUBMITTED
      |
      +-- SUBMITTED REPORTS
             |
             +-- REVIEW REPORT
                    |
                    +-- SAVE PDF
*/


/* ============================================================
   CORE IMPORTS
============================================================ */

import {
  SECTIONS
} from './data.js';


import {
  startNewReport,
  resetReport,
  loadReport,
  getMeta,
  getState,
  getReviewer,
  setReviewer,
  getReportId,
  setReportId
} from './state.js';


import {
  saveOpenReport,
  getOpenReports,
  getShipReviewReports,
  getSubmittedReports,
  getReport,
  getReportByReference,
  submitShipResponse,
  saveShipboardOpenUpdates,
  getAuthContext,
  signInWithPassword,
  signOutUser,
  getPhotoDisplayUrl,
  migrateEmbeddedPhotosToStorage
} from './supabase.js';


// Photo sources stay in memory as references only; image bytes are requested
// from Supabase only after the user clicks a filename button.
const responsePhotoSources = new Map();
let responsePhotoSequence = 0;
let responsePhotoLightbox = null;
let responsePhotoLightboxImage = null;
let responsePhotoLightboxStatus = null;
let responsePhotoPreviousOverflow = '';

function responsePhotoFilename(photo, index = 0){
  let name = '';
  if(photo && typeof photo === 'object'){
    name = photo.filename || photo.fileName || photo.originalName || photo.name || photo.storagePath || '';
  }else if(typeof photo === 'string' && photo.startsWith('storage://')){
    name = photo.slice('storage://'.length);
  }
  name = String(name || '').split(/[?#]/, 1)[0].replace(/\\/g, '/');
  if(name.includes('/')) name = name.slice(name.lastIndexOf('/') + 1);
  try{ name = decodeURIComponent(name); }catch(_error){}
  return name.trim() || `Photo ${String(index + 1).padStart(2, '0')}.jpg`;
}

function photoImageAttributes(photo, index = 0){
  const refId = `response-photo-${++responsePhotoSequence}`;
  responsePhotoSources.set(refId, photo);
  const filename = responsePhotoFilename(photo, index);
  return `data-photo-ref-id="${refId}" data-photo-filename="${escapeHtml(filename)}" aria-label="Open ${escapeHtml(filename)}"`;
}

function ensureResponsePhotoLightbox(){
  if(responsePhotoLightbox && responsePhotoLightbox.isConnected) return;
  if(!document.getElementById('response-photo-lightbox-style')){
    const style = document.createElement('style');
    style.id = 'response-photo-lightbox-style';
    style.textContent = `
      #response-photo-lightbox[hidden]{display:none!important}
      #response-photo-lightbox{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(12,5,18,.94)}
      #response-photo-lightbox .response-photo-panel{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-width:0;min-height:0}
      #response-photo-lightbox .response-photo-image{max-width:96vw;max-height:90vh;width:auto;height:auto;object-fit:contain;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.45)}
      #response-photo-lightbox .response-photo-close{position:absolute;top:0;right:0;z-index:2;width:44px;height:44px;border:1px solid #fff;border-radius:50%;background:#fff;color:#3C1053;font-size:30px;line-height:1;cursor:pointer}
      #response-photo-lightbox .response-photo-status{color:#fff;font:600 16px/1.5 Arial,sans-serif;text-align:center;padding:16px;max-width:80vw}
      #response-photo-lightbox .response-photo-status[hidden]{display:none}
      .response-photo-open{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:10px 12px;border:1px solid rgba(60,16,83,.22);border-radius:8px;background:#fff;color:#3C1053;text-align:left;font:600 14px/1.4 Arial,sans-serif;cursor:pointer;overflow-wrap:anywhere}
      .response-photo-open:hover{background:#f7f2fa}
      .response-photo-open .response-photo-hint{margin-left:auto;font-size:11px;font-weight:400;white-space:nowrap;color:#6c5a76}
      @media(max-width:600px){#response-photo-lightbox{padding:10px}#response-photo-lightbox .response-photo-image{max-width:98vw;max-height:86vh}.response-photo-open .response-photo-hint{display:none}}
    `;
    document.head.appendChild(style);
  }
  const overlay=document.createElement('div');
  overlay.id='response-photo-lightbox';
  overlay.hidden=true;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Photo preview');
  const panel=document.createElement('div');
  panel.className='response-photo-panel';
  const close=document.createElement('button');
  close.type='button';
  close.className='response-photo-close';
  close.textContent='×';
  close.setAttribute('aria-label','Close photo preview');
  const status=document.createElement('div');
  status.className='response-photo-status';
  status.textContent='Loading photo…';
  const img=document.createElement('img');
  img.className='response-photo-image';
  img.alt='Enlarged report photo';
  img.hidden=true;
  img.decoding='async';
  panel.append(close,status,img);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  const closeLightbox=()=>{
    overlay.hidden=true;
    img.removeAttribute('src');
    img.hidden=true;
    img.onload=null;
    img.onerror=null;
    status.hidden=false;
    status.textContent='Loading photo…';
    document.body.style.overflow=responsePhotoPreviousOverflow;
  };
  close.addEventListener('click',closeLightbox);
  overlay.addEventListener('click',event=>{if(event.target===overlay) closeLightbox();});
  panel.addEventListener('click',event=>{if(event.target===panel) closeLightbox();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden)closeLightbox();});
  responsePhotoLightbox=overlay;
  responsePhotoLightboxImage=img;
  responsePhotoLightboxStatus=status;
  responsePhotoLightbox._close=closeLightbox;
}

async function openResponsePhoto(photo){
  ensureResponsePhotoLightbox();
  responsePhotoPreviousOverflow=document.body.style.overflow;
  responsePhotoLightbox.hidden=false;
  document.body.style.overflow='hidden';
  responsePhotoLightboxImage.hidden=true;
  responsePhotoLightboxImage.removeAttribute('src');
  responsePhotoLightboxStatus.hidden=false;
  responsePhotoLightboxStatus.textContent='Loading photo…';
  try{
    const url=await getPhotoDisplayUrl(photo);
    if(!url) throw new Error('Photo reference is missing.');
    if(responsePhotoLightbox.hidden) return;
    responsePhotoLightboxImage.onload=()=>{
      responsePhotoLightboxImage.hidden=false;
      responsePhotoLightboxStatus.hidden=true;
    };
    responsePhotoLightboxImage.onerror=()=>{
      responsePhotoLightboxImage.hidden=true;
      responsePhotoLightboxStatus.hidden=false;
      responsePhotoLightboxStatus.textContent='The photo link was created, but the browser could not display the image. Close this preview and retry.';
    };
    responsePhotoLightboxImage.src=url;
    if(responsePhotoLightboxImage.complete&&responsePhotoLightboxImage.naturalWidth>0){
      responsePhotoLightboxImage.hidden=false;
      responsePhotoLightboxStatus.hidden=true;
    }
  }catch(error){
    console.error('Could not open report photo:',error);
    if(!responsePhotoLightbox.hidden){
      responsePhotoLightboxStatus.hidden=false;
      responsePhotoLightboxStatus.textContent='Could not load this photo: ' + String(error?.message || 'unknown photo-access error');
    }
  }
}

async function hydratePhotoElements(root){
  if(!root || typeof root.querySelectorAll !== 'function') return;
  const buttons=[...root.querySelectorAll('button[data-photo-ref-id]')];
  for(const button of buttons){
    if(button.dataset.photoBound==='true') continue;
    button.dataset.photoBound='true';
    button.addEventListener('click',()=>{
      const photo=responsePhotoSources.get(button.dataset.photoRefId);
      if(photo) openResponsePhoto(photo);
    });
  }
}


/* ============================================================
   MODULE CACHE
============================================================ */

let checklistModule = null;

let reviewModule = null;

let pdfModule = null;


/* ============================================================
   NAVIGATION STATE
============================================================ */

let checklistReturnScreen =
  'home';


let summaryReturnScreen =
  'checklist';


let currentSubmittedReport =
  null;


let currentShipResponseReport =
  null;


/*
  TRUE when the app was opened from a Ship Visit Report email link.
  In this mode the browser is locked to the Ship Response screen.
*/
let shipResponseLinkMode = false;


/* ============================================================
   ADMIN
============================================================ */

let currentAppRole = null;
let currentAuthUserId = null;
let currentAuthUserEmail = '';
let activeReportRecord = null;
let adminMode = false;
let appBindingsInitialized = false;
let loginFormBound = false;
const storagePhotoUrlCache = new Map();

function isAdmin(){
  return currentAppRole === 'admin';
}

function isReviewer(){
  return currentAppRole === 'reviewer';
}

function isShipboard(){
  return currentAppRole === 'shipboard';
}

function isReportUser(){
  return currentAppRole === 'user';
}

function canDeleteReport(report){
  if(isAdmin()) return true;
  if(!isReportUser()) return false;
  const isOwner = Boolean(
    currentAuthUserId &&
    report?.created_by &&
    String(report.created_by) === String(currentAuthUserId)
  );
  // Shoreside users may also delete a report assigned to them by name,
  // using the explicit authenticated-email-to-reviewer-name mapping below.
  return isOwner || isNamedReviewerForReport(report);
}


// A standard User may edit/submit an OPEN report if they created it or their
// approved login email corresponds to a name in the report's Reviewer field.
// The name-to-email mapping is explicit so a similar/partial name cannot grant access.
const REVIEWER_NAME_ALIASES_BY_EMAIL = Object.freeze({
  'levi.mezick@virginvoyages.com': ['Levi Mezick'],
  'seidy.soderholm@virginvoyages.com': ['Seidy Soderholm'],
  'don.habets@virginvoyages.com': ['Don Habets'],
  'eszter.tary@virginvoyages.com': ['Eszter Tary'],
  'marin.lukin@virginvoyages.com': ['Marin Lukin'],
  'edina.smajic-ic@virginvoyages.com': ['Edina Smajic-IC', 'Edina Smajic IC'],
  'andras.rafajlovics@virginvoyages.com': ['Andras Rafajlovics'],
  'andrew.diclementi@virginvoyages.com': ['Andrew Di Clementi', 'Andrew Diclementi'],
  'jamesadam.noffsinger@virginvoyages.com': ['Adam Noffsinger', 'James Adam Noffsinger'],
  'mycca.argawanon-ic@virginvoyages.com': ['Mycca Argawanon-IC', 'Mycca Argawanon IC']
});

function normalizeReviewerIdentity(value){
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isNamedReviewerForReport(report){
  if(!isReportUser()) return false;
  const aliases = REVIEWER_NAME_ALIASES_BY_EMAIL[currentAuthUserEmail] || [];
  if(aliases.length === 0) return false;
  const rawReviewerText = [
    report?.reviewer,
    report?.report_data?.meta?.reviewer
  ].filter(Boolean).join(', ');
  const normalizedNames = normalizeReviewerIdentity(rawReviewerText);
  return aliases.some(alias => normalizedNames.includes(normalizeReviewerIdentity(alias)));
}

function canEditReport(report){
  if(isAdmin()) return true;
  if(!isReportUser() || String(report?.status || 'open') !== 'open') return false;
  const isOwner = Boolean(
    currentAuthUserId && report?.created_by &&
    String(report.created_by) === String(currentAuthUserId)
  );
  return isOwner || isNamedReviewerForReport(report);
}

function canEditActiveReport(){
  if(isAdmin()) return true;
  const meta = getMeta() || {};
  const active = activeReportRecord || {};
  const candidate = {
    ...active,
    id: getReportId() || active.id,
    status: active.status || 'open',
    reviewer: meta.reviewer || active.reviewer || '',
    report_data: {
      ...(active.report_data || {}),
      meta: { ...(active.report_data?.meta || {}), ...meta }
    }
  };
  return canEditReport(candidate);
}



/* ============================================================
   SCREENS
============================================================ */

const SCREENS = [
  'login',
  'home',
  'setup',
  'checklist',
  'review',
  'summary',
  'followups',
  'open',
  'submitted',
  'responses'
];


/* ============================================================
   GLOBAL ADMIN FUNCTION
============================================================ */

window.shipVisitIsAdmin =
function(){

  return Boolean(
    adminMode
  );

};

/* ============================================================
   ADMIN DELETE BUTTON
============================================================ */

function reportDeleteButton(report){
  if(!canDeleteReport(report)) return '';
  const reportId = report?.id;
  if(!reportId) return '';
  return `
    <button
      type="button"
      class="admin-delete"
      data-admin-delete="${escapeHtml(reportId)}"
      style="width:100%;min-height:34px;margin-top:8px;padding:7px 10px;border:1px solid #CC0000;border-radius:7px;background:#FFFFFF;color:#CC0000;font-family:inherit;font-size:9px;font-weight:800;cursor:pointer;"
    >DELETE REPORT</button>
  `;
}

/* ============================================================
   START
============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  initializeApp
);


/* ============================================================
   INITIALIZE AND AUTHENTICATE
============================================================ */

async function initializeApp(){
  console.log('Ship Visit Report starting...');
  window.__SHIP_VISIT_SECTIONS__ = SECTIONS;
  bindLoginForm();

  try{
    const context = await getAuthContext();
    if(!context){
      showScreen('login');
      return;
    }
    if(!['admin','reviewer','user','shipboard'].includes(context.role)){
      await signOutUser().catch(() => {});
      showLoginMessage('This email account is not enabled for Ship Visit Report. Contact the administrator.');
      showScreen('login');
      return;
    }
    await initializeAuthorizedApp(context);
  }catch(error){
    console.error('Authentication check failed:', error);
    showLoginMessage('Could not verify access. Please sign in again. ' + (error?.message || ''));
    showScreen('login');
  }
}

function bindLoginForm(){
  const form = document.getElementById('loginForm');
  if(!form || loginFormBound) return;
  loginFormBound = true;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('loginEmail')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    const button = document.getElementById('loginSubmit');
    if(button){ button.disabled = true; button.textContent = 'SIGNING IN…'; }
    showLoginMessage('');
    try{
      const result = await signInWithPassword(email, password);
      if(result?.error) throw result.error;

      // Confirm the authenticated account has an assigned app role before exposing any app screens.
      const context = await getAuthContext();
      if(!context || !['admin','reviewer','user','shipboard'].includes(context.role)){
        await signOutUser().catch(() => {});
        throw new Error('This account is not enabled for Ship Visit Report. Contact the administrator.');
      }
      const passwordField = document.getElementById('loginPassword');
      if(passwordField) passwordField.value = '';
      await initializeAuthorizedApp(context);
    }catch(error){
      console.error('Password sign-in failed:', error);
      showLoginMessage(error?.message || 'Could not sign in. Check your email and password, then try again.');
    }finally{
      if(button){ button.disabled = false; button.textContent = 'SIGN IN'; }
    }
  });
}

function showLoginMessage(message){
  const element = document.getElementById('loginError');
  if(element){
    element.textContent = String(message || '');
    element.style.display = message ? 'block' : 'none';
  }
}

async function initializeAuthorizedApp(context){
  if(!context || !['admin','reviewer','user','shipboard'].includes(context.role)){
    showScreen('login');
    return;
  }
  currentAppRole = context.role;
  currentAuthUserId = context.user?.id || null;
  currentAuthUserEmail = String(context.user?.email || '').trim().toLowerCase();
  adminMode = isAdmin();
  applyRoleUI();

  if(!appBindingsInitialized){
    setupDefaultDate();
    bindAdminButton();
    bindHomeButtons();
    bindCreateReport();
    bindChecklistButtons();
    bindReviewButtons();
    bindSummaryButtons();
    bindFollowUpButtons();
    bindPDFButtons();
    bindHeaderBackButtons();
    bindPhotoMigrationButton();
    appBindingsInitialized = true;
  }

  updateAdminButton();
  if(!handleDirectShipResponseLink()) showScreen('home');
  console.log('Ship Visit Report ready for role:', currentAppRole);
}

function applyRoleUI(){
  // Admins and standard report Users can create. Shipboard can view Open reports only.
  const mayCreateReports = isAdmin() || isReportUser();
  const createCard = document.getElementById('createReport');
  if(createCard) createCard.style.display = mayCreateReports ? '' : 'none';
  const openCard = document.getElementById('openReport');
  if(openCard) openCard.style.display = (isAdmin() || isReportUser() || isReviewer() || isShipboard()) ? '' : 'none';
  ['submittedReports','shipResponseReport'].forEach(id => {
    const element = document.getElementById(id);
    if(element) element.style.display = '';
  });
  const migration = document.getElementById('migratePhotosButton');
  if(migration) migration.style.display = isAdmin() ? '' : 'none';
  const roleLabel = document.getElementById('authRoleLabel');
  if(roleLabel){
    roleLabel.textContent = isAdmin()
      ? 'SIGNED IN • ADMIN'
      : isShipboard()
        ? 'SIGNED IN • SHIPBOARD'
        : isReportUser()
          ? 'SIGNED IN • SHORESIDE'
          : 'SIGNED IN • REVIEWER';
  }
}


/* ============================================================
   SHIP-ONLY EMAIL MODE
============================================================ */

function applyShipOnlyUI(){

  if(
    !shipResponseLinkMode
  ){

    return;

  }


  /* Hide Home cards and Admin control if present. */
  [
    'createReport',
    'openReport',
    'submittedReports',
    'shipResponseReport'
  ].forEach(
    id => {

      const element =
        document.getElementById(id);

      if(element){
        element.style.display = 'none';
      }

    }
  );


  /* Hide all report navigation buttons/back buttons. */
  [
    'setupHeaderBack',
    'checklistHeaderBack',
    'reviewHeaderBack',
    'summaryHeaderBack',
    'followupsHeaderBack',
    'openHeaderBack',
    'submittedHeaderBack',
    'responsesHeaderBack',
    'responsesHomeBtn'
  ].forEach(
    id => {

      const element =
        document.getElementById(id);

      if(element){
        element.style.display = 'none';
      }

    }
  );

}


/* ============================================================
   DIRECT SHIP RESPONSE LINK
============================================================ */

function handleDirectShipResponseLink(){

  const params =
    new URLSearchParams(
      window.location.search
    );

  const reportRef =
    String(
      params.get('ref') ||
      ''
    ).trim();

  const reportId =
    String(
      params.get('report') ||
      params.get('reportId') ||
      ''
    ).trim();

  if (!reportRef && !reportId) {
    return false;
  }

  shipResponseLinkMode = true;

  applyShipOnlyUI();

  showScreen('responses');

  /*
    The email link contains both report and token.
    The token is intentionally not exposed to the normal
    application state. A later server-side validation step
    can enforce the token before allowing a public response.
  */

  window.__SHIP_RESPONSE_LINK__ = {
    reportId,
    reportRef,
    token: params.get('token') || ''
  };

  /*
    Open the report after the normal startup bindings exist.
    This keeps the existing app flow intact for normal users.
  */

  Promise.resolve()
    .then(async function(){

      try {

        const result =
          await withTimeout(
            reportRef
              ? getReportByReference(reportRef)
              : getReport(reportId),
            15000,
            'Loading linked report timed out.'
          );

        if (
          !result ||
          !result.success ||
          !result.data
        ) {

          throw (
            result?.error ||
            new Error(
              'This report could not be opened.'
            )
          );

        }

        const report =
          result.data;

        if (
          report.status !==
          'ship_review'
        ) {

          showScreen('home');

          alert(
            'This Ship Visit Report is no longer waiting for ship response.'
          );

          return;

        }

        openShipResponseReport(
          report
        );

        showScreen(
          'responses'
        );

      } catch (error) {

        console.error(
          'Direct Ship Response Link:',
          error
        );

        showScreen('home');

        showError(
          'Could not open the report from the email link.',
          error
        );

      }

    });

  return true;

}


/* ============================================================
   SAFE MODULE LOADERS
============================================================ */

async function getChecklistModule(){

  if(
    checklistModule
  ){

    return checklistModule;

  }


  try{

    checklistModule =
      await import(
        './checklist.js'
      );


    return checklistModule;

  }catch(error){

    console.error(
      'checklist.js:',
      error
    );


    showError(
      'Checklist module could not be loaded.',
      error
    );


    return null;

  }

}


async function getReviewModule(){

  if(
    reviewModule
  ){

    return reviewModule;

  }


  try{

    reviewModule =
      await import(
        './review.js'
      );


    return reviewModule;

  }catch(error){

    console.error(
      'review.js:',
      error
    );


    showError(
      'Ship Review module could not be loaded.',
      error
    );


    return null;

  }

}


async function getPDFModule(){

  if(
    pdfModule
  ){

    return pdfModule;

  }


  try{

    pdfModule =
      await import(
        './pdf.js'
      );


    return pdfModule;

  }catch(error){

    console.error(
      'pdf.js:',
      error
    );


    showError(
      'PDF module could not be loaded.',
      error
    );


    return null;

  }

}


/* ============================================================
   SCREEN NAVIGATION
============================================================ */

export function showScreen(
  screen
){

  let target =
    SCREENS.includes(
      screen
    )
      ? screen
      : 'home';

  if(!currentAppRole && target !== 'login') target = 'login';
  if(isReviewer() && ['setup','checklist','review'].includes(target)) target = 'home';
  if(isShipboard() && ['setup','checklist','review','followups'].includes(target)) target = 'home';

  /*
    A direct Ship Response link may only display the responses screen.
    All normal application navigation is blocked in this mode.
  */
  if(
    shipResponseLinkMode &&
    target !== 'responses'
  ){

    target = 'responses';

  }


  SCREENS.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if(
        !element
      ){

        return;

      }


      if(
        id === target
      ){

        element.classList.remove(
          'hidden'
        );


        element.style.display =
          '';

      }else{

        element.classList.add(
          'hidden'
        );


        element.style.display =
          'none';

      }

    }
  );


  window.scrollTo(
    0,
    0
  );

}


/* ============================================================
   CLICK HELPER
============================================================ */

function bindClick(
  id,
  handler
){

  const element =
    document.getElementById(
      id
    );


  if(
    !element
  ){

    return;

  }


  element.addEventListener(
    'click',
    handler
  );

}


/* ============================================================
   HOME
============================================================ */

function bindHomeButtons(){

  bindClick(
    'createReport',
    function(){

      clearSetupFields();

      setupDefaultDate();

      currentSubmittedReport =
        null;

      checklistReturnScreen =
        'setup';

      summaryReturnScreen =
        'checklist';

      showScreen(
        'setup'
      );

    }
  );


  bindClick(
    'openReport',
    async function(){

      showScreen(
        'open'
      );


      await loadOpenReportsScreen();

    }
  );


  bindClick(
    'submittedReports',
    async function(){

      showScreen(
        'submitted'
      );


      await loadSubmittedReportsScreen();

    }
  );


  bindClick(
    'shipResponseReport',
    async function(){

      /*
        IMPORTANT:
        Show the page first.
        The Back button is therefore immediately available.
      */

      showScreen(
        'responses'
      );


      await loadShipResponsesScreen();

    }
  );


  bindClick(
    'setupHome',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'openHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'reportsHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'responsesHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'followupsHomeBtn',
    function(){

      showScreen(
        'home'
      );

    }
  );

}


/* ============================================================
   SETUP
============================================================ */

function bindCreateReport(){

  bindClick(
    'startBtn',
    handleStartReport
  );

}


function clearSetupFields(){

  [
    'ship',
    'dateOn',
    'dateOff',
    'reviewer'

  ].forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if(
        element
      ){

        element.value =
          '';

      }

    }
  );

}


function setupDefaultDate(){

  const element =
    document.getElementById(
      'dateOn'
    );


  if(
    element &&
    !element.value
  ){

    element.value =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

  }

}


/* ============================================================
   CREATE REPORT
============================================================ */

async function handleStartReport(){

  if(!isAdmin() && !isReportUser()){ alert('Admin or Shoreside access is required to create reports.'); return; }

  const ship =
    document
      .getElementById(
        'ship'
      )
      ?.value
      .trim() ||
    '';


  const dateOn =
    document
      .getElementById(
        'dateOn'
      )
      ?.value ||
    '';


  const dateOff =
    document
      .getElementById(
        'dateOff'
      )
      ?.value ||
    '';


  const reviewer =
    document
      .getElementById(
        'reviewer'
      )
      ?.value
      .trim() ||
    '';


  if(
    !ship
  ){

    alert(
      'Please enter the ship.'
    );


    return;

  }


  if(
    !reviewer
  ){

    alert(
      'Please enter the reviewer.'
    );


    return;

  }


  try{

    startNewReport({

      ship,

      dateOn,

      dateOff,

      reviewer

    });


    checklistReturnScreen =
      'setup';


    summaryReturnScreen =
      'checklist';


    /*
      Create database record first.
    */

    const result =
      await withTimeout(
        saveOpenReport({

          reportId:null,

          meta:
            getMeta(),

          state:
            getState()

        }),
        15000,
        'Creating report timed out.'
      );


    if(
      !result ||
      !result.success ||
      !result.data
    ){

      throw (
        result?.error ||
        new Error(
          'Could not create the report.'
        )
      );

    }


    setReportId(
      result.data.id
    );
    activeReportRecord = result.data;


    const checklist =
      await getChecklistModule();


    if(
      !checklist
    ){

      return;

    }


    if(
      typeof checklist.updateChecklistHeader ===
      'function'
    ){

      checklist.updateChecklistHeader();

    }


    checklist.renderChecklist();


    showScreen(
      'checklist'
    );


    showToast(
      'OPEN REPORT CREATED'
    );

  }catch(error){

    console.error(
      'handleStartReport:',
      error
    );


    showError(
      'Could not create the report.',
      error
    );

  }

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

    return false;

  }

  if(!canEditActiveReport()){
    alert('You can only edit reports you created or Open reports that list your name as Reviewer.');
    return false;
  }


  try{

    const result =
      await withTimeout(
        saveOpenReport({

          reportId,

          meta:
            getMeta(),

          state:
            getState()

        }),
        15000,
        'Saving report timed out.'
      );


    if(result?.success && result.data){
      activeReportRecord = result.data;
    }

    return Boolean(
      result &&
      result.success
    );

  }catch(error){

    console.error(
      'saveCurrentReport:',
      error
    );


    return false;

  }

}


/* ============================================================
   CHECKLIST BUTTONS
============================================================ */

function bindChecklistButtons(){

  bindClick(
    'summaryBtn',
    async function(){

      const saved =
        await saveCurrentReport();


      if(
        !saved
      ){

        alert(
          'Could not save the report.'
        );


        return;

      }


      summaryReturnScreen =
        'checklist';


      renderCurrentReportSummary(
        {
          id:
            getReportId(),

          ship:
            getMeta().ship,

          date_on:
            getMeta().dateOn,

          date_off:
            getMeta().dateOff,

          reviewer:
            getMeta().reviewer,

          report_data:{

            meta:
              getMeta(),

            state:
              getState()

          }

        }
      );


      setSummaryMode(
        false
      );


      showScreen(
        'summary'
      );

    }
  );


  bindClick(
    'shipReviewBtn',
    async function(){

      await openShipReview();

    }
  );


  const reviewer =
    document.getElementById(
      'hdrReviewer'
    );


  if(
    reviewer
  ){

    reviewer.addEventListener(
      'change',
      async function(
        event
      ){

        setReviewer(
          event.target.value
        );


        await saveCurrentReport();

      }
    );

  }

}


/* ============================================================
   OPEN SHIP REVIEW
============================================================ */

async function openShipReview(){

  if(!isAdmin() && !canEditActiveReport()){ alert('You can send a report to Ship Review only if you created it or your name is listed as Reviewer on this Open report.'); return; }

  const saved =
    await saveCurrentReport();


  if(
    !saved
  ){

    alert(
      'Could not save the report.'
    );


    return;

  }


  const review =
    await getReviewModule();


  if(
    !review
  ){

    return;

  }


  try{

    if(
      typeof review.setReviewCallbacks ===
      'function'
    ){

      review.setReviewCallbacks({

        sentToShip:
          async function(){

            showToast(
              'REPORT SENT TO SHIP'
            );


            showScreen(
              'responses'
            );


            await loadShipResponsesScreen();

          }

      });

    }


    const prepared =
      await withTimeout(
        review.prepareShipReview(),
        15000,
        'Preparing Ship Review timed out.'
      );


    if(
      prepared === false
    ){

      return;

    }


    showScreen(
      'review'
    );

  }catch(error){

    console.error(
      'openShipReview:',
      error
    );


    showError(
      'Could not open Ship Review.',
      error
    );

  }

}


/* ============================================================
   REVIEW
============================================================ */

function bindReviewButtons(){

  bindClick(
    'reviewBackBtn',
    async function(){

      await returnToChecklist();

    }
  );


  bindClick(
    'reviewSubmitBtn',
    async function(){

      const review =
        await getReviewModule();


      if(
        !review
      ){

        return;

      }


      try{

        await review.sendCurrentReportToShip();

      }catch(error){

        console.error(
          'reviewSubmitBtn:',
          error
        );


        showError(
          'Could not send the report to Ship Review.',
          error
        );

      }

    }
  );

}


async function returnToChecklist(){

  const checklist =
    await getChecklistModule();


  if(
    !checklist
  ){

    return;

  }


  if(
    typeof checklist.updateChecklistHeader ===
    'function'
  ){

    checklist.updateChecklistHeader();

  }


  checklist.renderChecklist();


  showScreen(
    'checklist'
  );

}


/* ============================================================
   SUMMARY
============================================================ */

function bindSummaryButtons(){

  bindClick(
    'summaryBackToReportBtn',
    async function(){

      await returnToChecklist();

    }
  );


  bindClick(
    'summarySubmitBtn',
    async function(){

      await openShipReview();

    }
  );


  bindClick(
    'summaryBackToSubmittedBtn',
    async function(){

      const returnToOpen = summaryReturnScreen === 'open';
      showScreen(returnToOpen ? 'open' : 'submitted');
      if(returnToOpen){
        await loadOpenReportsScreen();
      }else{
        await loadSubmittedReportsScreen();
      }

    }
  );


  bindClick(
    'summaryPdfBtn',
    async function(){

      if(
        !currentSubmittedReport
      ){

        alert(
          'No submitted report selected.'
        );


        return;

      }


      const pdf =
        await getPDFModule();


      if(
        !pdf
      ){

        return;

      }


      try{

        loadReport(
          currentSubmittedReport
        );


        await pdf.generatePDF();

      }catch(error){

        console.error(
          'summaryPdfBtn:',
          error
        );


        showError(
          'Could not save PDF.',
          error
        );

      }

    }
  );

}


/* ============================================================
   SUMMARY MODE
============================================================ */

function setSummaryMode(
  submitted
){

  const active =
    document.getElementById(
      'summaryActiveActions'
    );


  const submittedActions =
    document.getElementById(
      'summarySubmittedActions'
    );


  if(
    active
  ){

    active.classList.toggle(
      'hidden',
      Boolean(
        submitted
      )
    );

  }


  if(
    submittedActions
  ){

    submittedActions.classList.toggle(
      'hidden',
      !submitted
    );

  }

}


/* ============================================================
   REPORT POINTS
============================================================ */

function getReportPoints(
  report,
  onlyChecked = true
){

  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const reviewer =
    report?.reviewer ||
    report
      ?.report_data
      ?.meta
      ?.reviewer ||
    '';


  const points =
    [];


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
          text,
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
            onlyChecked &&
            !item.checked
          ){

            return;

          }


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
              getReviewerComments(
                item,
                reviewer
              ),

            photos:
              getPhotos(
                item
              ),

            followUpNeeded:
              Boolean(
                item.followUpNeeded
              ),

            shipComments:
              getShipComments(
                item
              )

          });

        }
      );

    }
  );


  return points;

}


/* ============================================================
   REVIEWER COMMENTS
============================================================ */

function getReviewerComments(
  item,
  fallbackReviewer = ''
){

  if(
    !item
  ){

    return [];

  }


  const candidates = [

    item.comments,

    item.reviewerComments,

    item.reviewer_comments,

    item.reviewComments

  ];


  for(
    const candidate of
    candidates
  ){

    const normalized =
      normalizeCommentValue(
        candidate,
        fallbackReviewer
      );


    if(
      normalized.length
    ){

      return normalized;

    }

  }


  const legacyFields = [

    'reviewerComment',

    'reviewer_comment',

    'reviewComment',

    'review_comment',

    'comment',

    'note'

  ];


  for(
    const field of
    legacyFields
  ){

    if(
      typeof item[field] ===
      'string' &&
      item[field].trim()
    ){

      return [

        {

          name:
            fallbackReviewer ||
            'Reviewer',

          text:
            item[field].trim(),

          timestamp:
            null

        }

      ];

    }

  }


  return [];

}


function normalizeCommentValue(
  value,
  fallbackName
){

  if(
    !value
  ){

    return [];

  }


  if(
    Array.isArray(
      value
    )
  ){

    return value
      .map(
        comment =>
          normalizeOneComment(
            comment,
            fallbackName
          )
      )
      .filter(
        Boolean
      );

  }


  const one =
    normalizeOneComment(
      value,
      fallbackName
    );


  return one
    ? [one]
    : [];

}


function normalizeOneComment(
  value,
  fallbackName
){

  if(
    typeof value ===
    'string'
  ){

    const text =
      value.trim();


    if(
      !text
    ){

      return null;

    }


    return {

      name:
        fallbackName ||
        'Reviewer',

      text,

      timestamp:
        null

    };

  }


  if(
    !value ||
    typeof value !==
      'object'
  ){

    return null;

  }


  const text =
    String(
      value.text ??
      value.comment ??
      value.message ??
      value.value ??
      ''
    ).trim();


  if(
    !text
  ){

    return null;

  }


  return {

    name:
      String(
        value.name ??
        value.reviewer ??
        value.author ??
        fallbackName ??
        'Reviewer'
      ).trim() ||
      'Reviewer',

    text,

    timestamp:
      value.timestamp ??
      value.createdAt ??
      null

  };

}


/* ============================================================
   PHOTOS
============================================================ */

function getPhotos(
  item
){

  if(
    !item
  ){

    return [];

  }


  if(
    !Array.isArray(
      item.photos
    )
  ){

    return [];

  }


  return item.photos
    .map(photo => {
      if(typeof photo === 'string') return photo;

      if(photo && typeof photo === 'object'){
        // Accept references saved by either the current or older naming format.
        const legacyPhotoId = photo.legacyPhotoId || photo.legacy_photo_id || photo.photoId || photo.photo_id || null;
        const storagePath = photo.storagePath || photo.storage_path || photo.path || null;

        if(legacyPhotoId || storagePath){
          return {
            ...photo,
            ...(legacyPhotoId ? { legacyPhotoId: String(legacyPhotoId) } : {}),
            ...(storagePath ? { storagePath: String(storagePath) } : {})
          };
        }

        const directSource = photo.url || photo.src || photo.data || photo.image || '';
        if(directSource) return directSource;
      }

      return '';
    })
    .filter(Boolean);

}


/* ============================================================
   SHIP COMMENTS
============================================================ */

function getShipComments(
  item
){

  if(
    !item
  ){

    return [];

  }


  const value =
    item.shipComments ??
    item.ship_comments ??
    item.shipComment ??
    [];


  if(
    Array.isArray(
      value
    )
  ){

    return value
      .map(
        comment =>
          normalizeShipComment(
            comment
          )
      )
      .filter(
        Boolean
      );

  }


  if(
    typeof value ===
    'string' &&
    value.trim()
  ){

    return [

      {

        name:
          'Ship',

        text:
          value.trim(),

        timestamp:
          null

      }

    ];

  }


  return [];

}


function normalizeShipComment(
  value
){

  if(
    typeof value ===
    'string'
  ){

    const text =
      value.trim();


    return text
      ? {

          name:
            'Ship',

          text,

          timestamp:
            null

        }
      : null;

  }


  if(
    !value ||
    typeof value !==
      'object'
  ){

    return null;

  }


  const text =
    String(
      value.text ??
      value.comment ??
      value.message ??
      ''
    ).trim();


  if(
    !text
  ){

    return null;

  }


  return {

    name:
      value.name ||
      value.ship ||
      'Ship',

    text,

    timestamp:
      value.timestamp ??
      value.createdAt ??
      null

  };

}


function getDepartmentGeneralCommentsFromReport(report, sectionId){
  const state = report?.report_data?.state || {};
  const value = state[`__department_general__${sectionId}`]?.comments;
  return Array.isArray(value) ? value : [];
}


/* ============================================================
   SUMMARY RENDERER
============================================================ */

function renderCurrentReportSummary(
  report,
  includeUnchecked = false
){

  const container =
    document.getElementById(
      'report-overall-content'
    );


  if(
    !container
  ){

    return;

  }


  // Keep the current report's saved ship focus requests available to the PDF/print module.
  window.__shipVisitShipFocusRequests = report?.report_data?.shipFocusRequests || {};
  window.__shipVisitCanManageShipFocus = !isShipboard() && String(report?.status || 'open') === 'open';
  window.__shipVisitActiveReportId = report?.id || null;

  const points =
    getReportPoints(
      report,
      !includeUnchecked
    );


  const departmentsWithComments = SECTIONS.filter(
    section => getDepartmentGeneralCommentsFromReport(report, section.id).length > 0
  );

  const hasShipFocusRequests = Object.values(report?.report_data?.shipFocusRequests || {})
    .some(value => String(typeof value === 'string' ? value : (value?.text || '')).trim());

  if(
    points.length === 0 &&
    departmentsWithComments.length === 0 &&
    !hasShipFocusRequests
  ){

    container.innerHTML = `
      <div class="empty">
        No checklist points were checked.
      </div>
    `;

    return;
  }


  const groups =
    groupPoints(
      points
    );

  // When a read-only user is allowed to see unchecked checklist items,
  // consistently keep checked findings first and leave unchecked items unchecked.
  groups.forEach(group => {
    group.points.sort((a, b) => Number(Boolean(b.checked)) - Number(Boolean(a.checked)));
  });

  const checkedPointCount = points.filter(point => point.checked).length;
  const uncheckedPointCount = points.length - checkedPointCount;


  const meta =
    report
      ?.report_data
      ?.meta ||
    {};


  container.innerHTML = `

    <div
      style="
        margin-bottom:18px;
      "
    >

      <div
        style="
          color:var(--vv-squid);
          font-size:16px;
          font-weight:800;
        "
      >

        REPORT OVERALL

      </div>


      <div
        style="
          margin-top:6px;
          color:var(--vv-gray);
          font-size:11px;
          line-height:1.7;
        "
      >

        <b>Ship:</b>

        ${escapeHtml(
          report.ship ||
          meta.ship ||
          ''
        )}

        <br>


        <b>Visit:</b>

        ${escapeHtml(
          report.date_on ||
          meta.dateOn ||
          ''
        )}

        ${
          report.date_off ||
          meta.dateOff
            ? ` → ${escapeHtml(
                report.date_off ||
                meta.dateOff ||
                ''
              )}`
            : ''
        }

        <br>


        <b>Reviewer:</b>

        ${escapeHtml(
          report.reviewer ||
          meta.reviewer ||
          ''
        )}

      </div>

      ${includeUnchecked ? `
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:11px;">
          <span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#FCEBEC;color:#9D1010;font-size:11px;font-weight:800;">${checkedPointCount} CHECKED</span>
          <span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#F0EDF3;color:#554760;font-size:11px;font-weight:800;">${uncheckedPointCount} NOT YET CHECKED</span>
        </div>
      ` : ''}

    </div>


    ${(() => {
      const requests = report?.report_data?.shipFocusRequests || {};
      const entries = Object.entries(requests).map(([sectionId, value]) => ({
        sectionId,
        section: SECTIONS.find(item => item.id === sectionId)?.title || sectionId,
        text: typeof value === 'string' ? value : (value?.text || ''),
        name: typeof value === 'object' && value ? (value.name || value.email || 'Ship') : 'Ship'
      })).filter(item => String(item.text || '').trim());
      if(!entries.length) return '';
      return `<div style="margin:0 0 18px;padding:12px;border:1px solid var(--vv-line);border-radius:9px;background:#F0FAF5;">
        <div style="margin-bottom:8px;color:#087443;font-size:12px;font-weight:800;">SHIP FOCUS REQUESTS</div>
        ${entries.map(item => `<div style="margin-top:8px;padding:8px 10px;border-left:3px solid #079455;border-radius:5px;background:#fff;">
          <div style="font-size:10px;font-weight:800;color:var(--vv-squid);">${escapeHtml(item.section)}</div>
          <div style="margin-top:4px;font-size:11px;line-height:1.5;color:var(--vv-body);white-space:pre-wrap;">${escapeHtml(item.text)}</div>
          <div style="margin-top:4px;font-size:9px;color:var(--vv-gray);">From ship${item.name && item.name !== 'Ship' ? ` — ${escapeHtml(item.name)}` : ''}</div>
        </div>`).join('')}
      </div>`;
    })()}

    ${
      SECTIONS.map(section => {

        const group = groups.find(item => item.section === section.title);
        const generalComments = getDepartmentGeneralCommentsFromReport(report, section.id);
        const checkedPoints = group ? group.points.filter(point => point.checked) : [];
        const uncheckedPoints = includeUnchecked && group
          ? group.points.filter(point => !point.checked)
          : [];

        if((!group || group.points.length === 0) && !generalComments.length){
          return '';
        }

        return `
          <div style="margin-bottom:20px;">
            <div
              style="
                margin-bottom:9px;
                padding-bottom:6px;
                border-bottom:2px solid var(--vv-red);
                color:var(--vv-squid);
                font-size:14px;
                font-weight:800;
              "
            >
              ${escapeHtml(section.title)}
            </div>

            ${
              generalComments.length
                ? `
                  <div
                    style="
                      margin-bottom:10px;
                      padding:10px 12px;
                      border-left:4px solid var(--vv-squid);
                      border-radius:8px;
                      background:#F8F5FA;
                    "
                  >
                    <div style="color:var(--vv-squid);font-size:9px;font-weight:800;letter-spacing:.04em;">GENERAL COMMENTS</div>
                    ${generalComments.map(comment => `
                      <div style="margin-top:7px;font-size:11px;line-height:1.5;color:var(--vv-body);">
                        <strong>${escapeHtml(comment.name || 'Reviewer')}:</strong> ${escapeHtml(comment.text || '')}
                      </div>
                    `).join('')}
                  </div>
                `
                : ''
            }

            ${checkedPoints.map(renderSummaryPoint).join('')}

            ${uncheckedPoints.length ? `
              <div style="margin:14px 0 8px;padding-top:9px;border-top:1px dashed var(--vv-line);color:var(--vv-gray);font-size:11px;font-weight:800;letter-spacing:.02em;">
                NOT YET CHECKED (${uncheckedPoints.length})
              </div>
              ${uncheckedPoints.map(renderSummaryPoint).join('')}
            ` : ''}
          </div>
        `;

      }).join('')
    }

  `;

  // The read-only report summary is the screen used by Shipboard and Reviewers.
  // Bind photo buttons after the markup has been inserted into the page.
  hydratePhotoElements(container);

}


/* ============================================================
   SHIPBOARD READ-ONLY OPEN REPORT — DEPARTMENT HOME
   Mirrors the Shoreside department-card layout without exposing
   checklist edit controls to Shipboard users.
============================================================ */

function renderShipboardOpenReportDepartments(report){
  const container = document.getElementById('report-overall-content');
  if(!container) return;

  const points = getReportPoints(report, false);
  const checkedPoints = points.filter(point => Boolean(point.checked));
  const uncheckedPoints = points.filter(point => !point.checked);
  const followUpCount = points.filter(point => Boolean(point.followUpNeeded)).length;
  const meta = report?.report_data?.meta || {};

  container.innerHTML = `
    <div style="margin-bottom:20px;">
      <div style="color:var(--vv-squid);font-size:16px;font-weight:800;">REPORT OVERALL</div>
      <div style="margin-top:6px;color:var(--vv-gray);font-size:11px;line-height:1.7;">
        <b>Ship:</b> ${escapeHtml(report.ship || meta.ship || '')}<br>
        <b>Visit:</b> ${escapeHtml(report.date_on || meta.dateOn || '')}
        ${(report.date_off || meta.dateOff) ? ` → ${escapeHtml(report.date_off || meta.dateOff || '')}` : ''}<br>
        <b>Reviewer:</b> ${escapeHtml(report.reviewer || meta.reviewer || '')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
        <span style="display:inline-block;padding:7px 11px;border-radius:7px;background:#FCEBEC;color:#9D1010;font-size:11px;font-weight:800;">${checkedPoints.length} CHECKED</span>
        <span style="display:inline-block;padding:7px 11px;border-radius:7px;background:#F0EDF3;color:#554760;font-size:11px;font-weight:800;">${uncheckedPoints.length} NOT YET CHECKED</span>
        <span style="display:inline-block;padding:7px 11px;border-radius:7px;background:#EAF2FC;color:#234A78;font-size:11px;font-weight:800;">${followUpCount} SHIP FOLLOW-UPS</span>
      </div>
    </div>

    <div style="margin-bottom:10px;color:var(--vv-squid);font-size:15px;font-weight:800;">DEPARTMENTS</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">
      ${SECTIONS.map(section => {
        const departmentPoints = points.filter(point => point.section === section.title);
        const departmentChecked = departmentPoints.filter(point => Boolean(point.checked)).length;
        const departmentFollowUps = departmentPoints.filter(point => Boolean(point.followUpNeeded)).length;
        return `
          <button type="button" data-shipboard-department="${escapeHtml(section.id)}"
            style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;padding:20px 16px;border:1px solid var(--vv-line);border-radius:14px;background:#FFFFFF;color:var(--vv-squid);text-align:center;cursor:pointer;font-family:inherit;">
            <span style="font-size:14px;font-weight:800;line-height:1.45;">${escapeHtml(section.title)}</span>
            <span style="font-size:26px;font-weight:800;line-height:1;">${departmentChecked}/${departmentPoints.length}</span>
            <span style="font-size:9px;font-weight:800;color:var(--vv-gray);">POINTS CHECKED</span>
            <span style="font-size:10px;color:var(--vv-gray);">${departmentFollowUps} ship follow-up${departmentFollowUps === 1 ? '' : 's'}</span>
            <span style="font-size:10px;font-weight:800;">OPEN DEPARTMENT →</span>
          </button>
        `;
      }).join('')}
    </div>
    <div style="margin-top:12px;color:var(--vv-gray);font-size:11px;line-height:1.5;">Select a department to review checked findings, unchecked points, reviewer comments, photos, and ship follow-ups. Reviewer findings are read-only. Shipboard comments and focus requests can be saved.</div>
  `;

  container.querySelectorAll('[data-shipboard-department]').forEach(button => {
    button.addEventListener('click', () => {
      renderShipboardOpenReportDepartment(report, button.dataset.shipboardDepartment);
    });
  });
}


/* ============================================================
   SHIPBOARD READ-ONLY OPEN REPORT — DEPARTMENT DETAIL
============================================================ */

function renderShipboardShipCommentField(point){
  if(!point.followUpNeeded) return '';
  const comments = Array.isArray(point.shipComments) ? point.shipComments : [];
  const current = comments.find(c =>
    String(c?.email || '').toLowerCase() === String(currentAuthUserEmail || '').toLowerCase()
  ) || comments[comments.length - 1] || null;
  const text = current?.text || '';
  const key = escapeHtml(point.key);
  return `
    <section data-ship-comment-panel="${key}"
      style="margin:-4px 0 12px 30px;padding:12px;border:1px solid #D9D3E0;border-radius:9px;background:#fff;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">
        <strong style="font-size:11px;color:var(--vv-squid);">SHIP TEAM COMMENT</strong>
        <div style="display:flex;gap:7px;">
          <button type="button" data-ship-comment-focus="${key}"
            style="padding:8px 11px;border:1px solid #D9D3E0;border-radius:7px;background:#fff;color:var(--vv-squid);font:inherit;font-size:11px;font-weight:800;cursor:pointer;">Comment</button>
          <button type="button" data-ship-photo-notice="${key}"
            style="padding:8px 11px;border:1px solid #D9D3E0;border-radius:7px;background:#fff;color:var(--vv-squid);font:inherit;font-size:11px;font-weight:800;cursor:pointer;">Photo</button>
        </div>
      </div>
      ${text ? `
        <article style="position:relative;margin-bottom:10px;padding:11px 44px 11px 12px;border-left:3px solid var(--vv-squid);border-radius:7px;background:#F8F5FA;">
          <strong style="display:block;margin-bottom:5px;font-size:11px;color:var(--vv-squid);">${escapeHtml(current?.name || 'Ship team')}</strong>
          <div style="font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;">${escapeHtml(text)}</div>
          <button type="button" data-delete-ship-comment-key="${key}" aria-label="Delete my saved ship comment" title="Delete comment"
            style="position:absolute;top:8px;right:8px;width:29px;height:29px;border:1px solid #D9D3E0;border-radius:50%;background:#fff;color:#B4232D;font-size:20px;font-weight:800;cursor:pointer;">×</button>
        </article>` : ''}
      <textarea data-ship-comment-key="${key}" rows="3" maxlength="3000"
        placeholder="Add the ship-side response for this follow-up..."
        style="display:block;width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--vv-line);border-radius:7px;font:inherit;font-size:12px;resize:vertical;">${escapeHtml(text)}</textarea>
      <button type="button" data-add-ship-comment-key="${key}"
        style="display:block;width:100%;min-height:40px;margin-top:8px;padding:9px;border:0;border-radius:7px;background:var(--vv-squid);color:#fff;font:inherit;font-size:12px;font-weight:800;cursor:pointer;">Add</button>
      <div data-ship-comment-local-status="${key}" role="status" aria-live="polite"
        style="margin-top:6px;font-size:11px;color:var(--vv-gray);"></div>
    </section>`;
}

function renderShipboardOpenReportDepartment(report, departmentId){
  const container = document.getElementById('report-overall-content');
  if(!container) return;

  const section = SECTIONS.find(item => item.id === departmentId);
  if(!section){
    renderShipboardOpenReportDepartments(report);
    return;
  }

  const points = getReportPoints(report, false).filter(point => point.section === section.title);
  const checkedPoints = points.filter(point => Boolean(point.checked));
  const uncheckedPoints = points.filter(point => !point.checked);
  const generalComments = getDepartmentGeneralCommentsFromReport(report, section.id);
  const meta = report?.report_data?.meta || {};

  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <button type="button" data-shipboard-back-departments
        style="min-height:38px;margin-bottom:15px;padding:8px 13px;border:1px solid var(--vv-squid);border-radius:8px;background:#FFFFFF;color:var(--vv-squid);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">
        ← Back to Departments
      </button>
      <div style="color:var(--vv-squid);font-size:16px;font-weight:800;">${escapeHtml(section.title)}</div>
      <div style="margin-top:6px;color:var(--vv-gray);font-size:11px;line-height:1.7;">
        <b>Ship:</b> ${escapeHtml(report.ship || meta.ship || '')}<br>
        <b>Visit:</b> ${escapeHtml(report.date_on || meta.dateOn || '')}
        ${(report.date_off || meta.dateOff) ? ` → ${escapeHtml(report.date_off || meta.dateOff || '')}` : ''}<br>
        <b>Reviewer:</b> ${escapeHtml(report.reviewer || meta.reviewer || '')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
        <span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#FCEBEC;color:#9D1010;font-size:11px;font-weight:800;">${checkedPoints.length} CHECKED</span>
        <span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#F0EDF3;color:#554760;font-size:11px;font-weight:800;">${uncheckedPoints.length} NOT YET CHECKED</span>
      </div>
      <div style="margin-top:12px;padding:12px;border:1px solid var(--vv-line);border-radius:9px;background:#FBFAFC;">
        <label for="ship-focus-${escapeHtml(section.id)}" style="display:block;margin-bottom:6px;color:var(--vv-squid);font-size:11px;font-weight:800;">SHIP FOCUS REQUEST — ${escapeHtml(section.title)}</label>
        <textarea id="ship-focus-${escapeHtml(section.id)}" data-ship-focus-section="${escapeHtml(section.id)}" rows="2" maxlength="3000"
          placeholder="Add a request or focus area for this department..."
          style="width:100%;box-sizing:border-box;padding:9px;border:1px solid var(--vv-line);border-radius:6px;font:inherit;font-size:12px;resize:vertical;">${escapeHtml((() => { const v = report?.report_data?.shipFocusRequests?.[section.id]; return typeof v === 'string' ? v : (v?.text || ''); })())}</textarea>
        <div style="margin-top:6px;color:var(--vv-gray);font-size:10px;">Only shipboard comments and focus requests are saved; reviewer findings remain unchanged.</div>
      </div>
    </div>

    ${generalComments.length ? `
      <div style="margin-bottom:12px;padding:10px 12px;border-left:4px solid var(--vv-squid);border-radius:8px;background:#F8F5FA;">
        <div style="color:var(--vv-squid);font-size:10px;font-weight:800;letter-spacing:.04em;">DEPARTMENT GENERAL COMMENTS</div>
        ${generalComments.map(comment => `<div style="margin-top:7px;font-size:11px;line-height:1.5;color:var(--vv-body);"><strong>${escapeHtml(comment.name || 'Reviewer')}:</strong> ${escapeHtml(comment.text || '')}</div>`).join('')}
      </div>
    ` : ''}

    <div style="margin:12px 0 8px;padding-bottom:6px;border-bottom:2px solid var(--vv-red);color:var(--vv-squid);font-size:13px;font-weight:800;">CHECKED POINTS${checkedPoints.length ? ` (${checkedPoints.length})` : ''}</div>
    ${checkedPoints.length ? checkedPoints.map(point => renderSummaryPoint(point) + renderShipboardShipCommentField(point)).join('') : '<div class="empty" style="margin-bottom:12px;">No points have been checked in this department.</div>'}

    <div style="margin:16px 0 8px;padding:9px 0 6px;border-bottom:1px dashed var(--vv-line);color:var(--vv-gray);font-size:12px;font-weight:800;">NOT YET CHECKED (${uncheckedPoints.length})</div>
    ${uncheckedPoints.length ? uncheckedPoints.map(point => renderSummaryPoint(point) + renderShipboardShipCommentField(point)).join('') : '<div class="empty">All points in this department have been checked.</div>'}

    <div style="position:sticky;bottom:8px;z-index:5;margin:18px 0 6px;padding:12px;border:1px solid var(--vv-line);border-radius:10px;background:#FFFFFF;box-shadow:0 4px 18px rgba(30,15,40,.12);">
      <button type="button" data-save-shipboard-updates style="width:100%;min-height:44px;padding:11px 16px;border:0;border-radius:8px;background:var(--vv-squid);color:#fff;font:inherit;font-size:12px;font-weight:800;cursor:pointer;">SAVE SHIP COMMENTS AND FOCUS REQUEST</button>
      <div data-shipboard-save-status role="status" aria-live="polite" style="margin-top:7px;text-align:center;font-size:11px;color:var(--vv-gray);"></div>
    </div>
  `;

  const backButton = container.querySelector('[data-shipboard-back-departments]');
  if(backButton){
    backButton.addEventListener('click', () => renderShipboardOpenReportDepartments(report));
  }

  const saveButtons = [...container.querySelectorAll('[data-save-shipboard-updates]')];
  if(saveButtons.length){
    const handleShipboardSave = async () => {
      const status = container.querySelector('[data-shipboard-save-status]');
      saveButtons.forEach(button => { button.disabled = true; button.textContent = 'SAVING...'; });
      if(status) status.textContent = 'Saving...';
      const comments = {};
      container.querySelectorAll('[data-ship-comment-key]').forEach(input => {
        const value = input.value.trim();
        comments[input.dataset.shipCommentKey] = value;
      });
      const focusRequests = {};
      container.querySelectorAll('[data-ship-focus-section]').forEach(input => {
        focusRequests[input.dataset.shipFocusSection] = input.value.trim();
      });
      try{
        const result = await saveShipboardOpenUpdates({ reportId: report.id, comments, focusRequests });
        if(!result?.success) throw (result?.error || new Error('Could not save shipboard updates.'));
        report.report_data = {
          ...(report.report_data || {}),
          state: result.data?.state || report.report_data?.state || {},
          shipFocusRequests: result.data?.shipFocusRequests || { ...(report.report_data?.shipFocusRequests || {}), ...focusRequests }
        };
        if(status) status.textContent = 'Saved successfully';
      }catch(error){
        console.error('Saving shipboard open updates failed:', error);
        if(status) status.textContent = `Save failed: ${error?.message || 'Please try again.'}`;
      }finally{
        saveButtons.forEach(button => { button.disabled = false; button.textContent = 'SAVE SHIP COMMENTS AND FOCUS REQUEST'; });
      }
    };
    saveButtons.forEach(button => button.addEventListener('click', handleShipboardSave));
    container.querySelectorAll('[data-add-ship-comment-key]').forEach(button => {
      button.addEventListener('click', async () => {
        const key = button.dataset.addShipCommentKey;
        const input = [...container.querySelectorAll('[data-ship-comment-key]')]
          .find(item => item.dataset.shipCommentKey === key);
        if(!input) return;
        if(!input.value.trim()){
          const local = container.querySelector(`[data-ship-comment-local-status="${CSS.escape(key)}"]`);
          if(local) local.textContent = 'Enter a comment before saving.';
          input.focus();
          return;
        }
        await handleShipboardSave();
        // Refresh this report's saved representation after the secure RPC completes.
        const local = container.querySelector(`[data-ship-comment-local-status="${CSS.escape(key)}"]`);
        const status = container.querySelector('[data-shipboard-save-status]');
        if(local && status) local.textContent = status.textContent;
      });
    });
    container.querySelectorAll('[data-ship-comment-focus]').forEach(button => {
      button.addEventListener('click', () => {
        const input = [...container.querySelectorAll('[data-ship-comment-key]')]
          .find(item => item.dataset.shipCommentKey === button.dataset.shipCommentFocus);
        input?.focus();
      });
    });
    container.querySelectorAll('[data-ship-photo-notice]').forEach(button => {
      button.addEventListener('click', () => {
        const key = button.dataset.shipPhotoNotice;
        const local = container.querySelector(`[data-ship-comment-local-status="${CSS.escape(key)}"]`);
        if(local) local.textContent = 'Photo attachments need the matching Supabase comment-photo migration before they can be saved.';
      });
    });
    container.querySelectorAll('[data-delete-ship-comment-key]').forEach(button => {
      button.addEventListener('click', async () => {
        const key = button.dataset.deleteShipCommentKey;
        const input = [...container.querySelectorAll('[data-ship-comment-key]')]
          .find(item => item.dataset.shipCommentKey === key);
        if(!input) return;
        if(!window.confirm('Delete your saved ship comment for this checklist point?')) return;
        input.value = '';
        await handleShipboardSave();
      });
    });
  }

  hydratePhotoElements(container);
}


function groupPoints(
  points
){

  const groups =
    [];


  points.forEach(
    point => {

      let group =
        groups.find(
          entry =>
            entry.section ===
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


  return groups;

}


function renderSummaryPoint(
  point
){

  const completed =
    point.followUpNeeded &&
    point.shipComments.length >
      0;

  const pointChecked = Boolean(point.checked);
  const markerBackground = pointChecked ? 'var(--vv-red)' : '#F0EDF3';
  const markerColor = pointChecked ? '#FFFFFF' : '#655A70';


  return `

    <div
      style="
        margin-bottom:11px;
        padding:12px;
        border:1px solid var(--vv-line);
        border-left:4px solid ${point.checked ? 'var(--vv-squid)' : '#9B91A2'};
        border-radius:8px;
        background:${point.checked ? '#FFFFFF' : '#F7F6F8'};
      "
    >

      <div
        style="
          display:flex;
          align-items:flex-start;
          gap:8px;
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
            border-radius:50%;
            box-sizing:border-box;
            border:${point.checked ? '0' : '2px solid #9B91A2'};
            background:${point.checked ? 'var(--vv-red)' : '#FFFFFF'};
            color:${point.checked ? '#FFFFFF' : '#9B91A2'};
            font-size:11px;
            font-weight:800;
          "
        >

          ${point.checked ? '✓' : ''}

        </div>


        <div
          style="
            flex:1;
            font-size:13px;
            line-height:1.5;
            font-weight:700;
          "
        >

          ${escapeHtml(point.text)}
          ${!point.checked ? '<span style="display:inline-block;margin-left:7px;padding:2px 6px;border-radius:4px;background:#ECE8F0;color:#6E6278;font-size:9px;font-weight:800;vertical-align:middle;">NOT CHECKED</span>' : ''}

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

              <span
                class="status ${
                  completed
                    ? 'green'
                    : 'blue'
                }"
              >

                ${
                  completed
                    ? 'SHIP FOLLOW-UP COMPLETED'
                    : 'FOLLOW-UP NEEDED FROM SHIP'
                }

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
                margin-top:10px;
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
                            comment.text
                          )}

                        </div>

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
                margin-top:10px;
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
                      (photo, photoIndex) => `

                        <div class="response-photo">
                          <button type="button" class="response-photo-open" ${photoImageAttributes(photo, photoIndex)}>
                            <span aria-hidden="true">▧</span>
                            <span>${escapeHtml(responsePhotoFilename(photo, photoIndex))}</span>
                            <span class="response-photo-hint">Click to preview</span>
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


      ${
        point.shipComments.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
                style="
                  color:var(--status-green);
                "
              >

                SHIP COMMENTS / RESPONSES

              </div>


              ${
                point.shipComments
                  .map(
                    comment => `

                      <div
                        class="ship-response-display"
                        style="position:relative;padding-right:${isShipboard() && String(activeReportRecord?.status || 'open') === 'open' ? '38px' : '10px'};"
                      >

                        <strong>

                          ${escapeHtml(
                            comment.name
                          )}:

                        </strong>

                        <div style="margin-top:3px;">
                          ${escapeHtml(comment.text)}
                        </div>
                        ${isShipboard() && String(activeReportRecord?.status || 'open') === 'open' ? `
                          <button type="button" data-delete-green-ship-comment-key="${escapeHtml(point.key)}"
                            aria-label="Delete your ship comment" title="Delete your saved ship comment"
                            style="position:absolute;top:7px;right:7px;width:24px;height:24px;border:1px solid #E4D8E8;border-radius:50%;background:#fff;color:#C41425;font-size:18px;line-height:1;font-weight:800;cursor:pointer;">×</button>
                        ` : ''}
                      </div>

                    `
                  )
                  .join('')
              }

            </div>

          `
          : ''
      }


    </div>

  `;

  hydratePhotoElements(container);

}
/* ============================================================
   OPEN REPORTS
============================================================ */

async function loadOpenReportsScreen(){

  const container =
    document.getElementById(
      'openList'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML = `

    <div class="empty">

      Loading open reports...

    </div>

  `;


  try{

    const result =
      await withTimeout(
        getOpenReports(),
        15000,
        'Loading open reports timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load open reports.'
        )
      );

    }


    const reports =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    renderOpenReports(
      container,
      reports
    );

  }catch(error){

    console.error(
      'loadOpenReportsScreen:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load Open Reports.

        <br><br>

        ${escapeHtml(
          error?.message ||
          'Unknown error'
        )}

      </div>

    `;

  }

}


/* ============================================================
   RENDER OPEN REPORTS
============================================================ */

function renderOpenReports(
  container,
  reports
){

  if(
    reports.length ===
    0
  ){

    container.innerHTML = `

      <div class="empty">

        No open reports.

      </div>

    `;


    return;

  }


  container.innerHTML =
    reports
      .map(
        report => `

          <div
            class="report-card red"
          >

            <h3>

              ${escapeHtml(
                report.ship ||
                'Unnamed Ship'
              )}

            </h3>


            <div
              class="report-meta"
              style="
                line-height:1.7;
              "
            >

              <b>Visit:</b>

              ${escapeHtml(
                report.date_on ||
                ''
              )}

              ${
                report.date_off
                  ? ` → ${escapeHtml(
                      report.date_off
                    )}`
                  : ''
              }

              <br>


              <b>Reviewer:</b>

              ${escapeHtml(
                report.reviewer ||
                ''
              )}

            </div>


            <div
              class="report-actions"
            >

              <button
                type="button"
                class="btn-primary"
                data-open-report-id="${escapeHtml(
                  report.id
                )}"
              >

                ${canEditReport(report) ? 'OPEN REPORT' : 'VIEW REPORT'}

              </button>

            </div>

            ${reportDeleteButton(
              report
            )}

          </div>

        `
      )
      .join('');


  container
    .querySelectorAll(
      '[data-open-report-id]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(){

            const report =
              reports.find(
                item =>
                  String(
                    item.id
                  ) ===
                  String(
                    button.dataset.openReportId
                  )
              );


            if(
              report
            ){

              await openSavedReport(
                report
              );

            }

          }
        );

      }
    );


  bindAdminDeleteButtons();

}


/* ============================================================
   READ-ONLY REPORT VIEW FOR STANDARD USERS
============================================================ */

async function openReadOnlyReport(report, returnScreen = 'submitted'){
  try{
    if(report?.id && !report?.report_data?.state){
      const detailed = await withTimeout(
        getReport(report.id),
        60000,
        'Loading report details timed out after 60 seconds.'
      );
      if(!detailed?.success || !detailed.data){
        throw (detailed?.error || new Error('Could not load report details.'));
      }
      report = detailed.data;
    }
    currentSubmittedReport = report;
    activeReportRecord = report;
    // PDF/print templates can include the saved ship-side focus requests for this report.
    window.__shipVisitShipFocusRequests = report?.report_data?.shipFocusRequests || {};
  window.__shipVisitCanManageShipFocus = !isShipboard() && String(report?.status || 'open') === 'open';
  window.__shipVisitActiveReportId = report?.id || null;
    summaryReturnScreen = returnScreen;
    loadReport(report);
    const isShipboardOpenReport = isShipboard() && String(report?.status || 'open') === 'open';
    if(isShipboardOpenReport){
      // Normalize the report state against the active checklist without saving it.
      // This ensures every current point is shown while preserving each stored checked flag.
      const normalizedState = JSON.parse(JSON.stringify(getState() || {}));
      const shipboardDisplayReport = {
        ...report,
        report_data: {
          ...(report.report_data || {}),
          state: normalizedState
        }
      };
      renderShipboardOpenReportDepartments(shipboardDisplayReport);
    }else{
      renderCurrentReportSummary(report, false);
    }
    setSummaryMode(true);
    showScreen('summary');
  }catch(error){
    console.error('openReadOnlyReport:', error);
    showError('Could not open this report.', error);
  }
}


/* ============================================================
   OPEN SAVED REPORT
============================================================ */

async function openSavedReport(
  report
){

  try{

    if(report?.id && !report?.report_data?.state){
      const detailed = await withTimeout(getReport(report.id), 60000, 'Loading report details timed out after 60 seconds.');
      if(!detailed?.success || !detailed.data) throw (detailed?.error || new Error('Could not load report details.'));
      report = detailed.data;
    }

    if(isShipboard() || isReviewer()){
      await openReadOnlyReport(report, 'open');
      return;
    }

    if(isReportUser() && !canEditReport(report)){
      await openReadOnlyReport(report, 'open');
      return;
    }

    activeReportRecord = report;
    // Make the persisted ship focus requests available to checklist.js when
    // a shoreside reviewer opens the report in the editable checklist view.
    window.__shipVisitShipFocusRequests = report?.report_data?.shipFocusRequests || {};
  window.__shipVisitCanManageShipFocus = !isShipboard() && String(report?.status || 'open') === 'open';
  window.__shipVisitActiveReportId = report?.id || null;
    loadReport(
      report
    );


    currentSubmittedReport =
      null;


    checklistReturnScreen =
      'open';


    const checklist =
      await getChecklistModule();


    if(
      !checklist
    ){

      return;

    }


    if(
      typeof checklist.updateChecklistHeader ===
      'function'
    ){

      checklist.updateChecklistHeader();

    }


    checklist.renderChecklist();


    showScreen(
      'checklist'
    );

  }catch(error){

    console.error(
      'openSavedReport:',
      error
    );


    showError(
      'Could not open this report.',
      error
    );

  }

}


/* ============================================================
   SHIP RESPONSE SCREEN
============================================================ */

async function loadShipResponsesScreen(){

  const container =
    document.getElementById(
      'responseList'
    );


  if(
    !container
  ){

    return;

  }


  /*
    Render loading only inside the list.
    Header and Back button remain fully active.
  */

  container.innerHTML = `

    <div
      class="empty"
    >

      Loading reports waiting for ship response...

    </div>

  `;


  try{

    const result =
      await withTimeout(
        getShipReviewReports(),
        15000,
        'Loading Ship Response reports timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load Ship Response reports.'
        )
      );

    }


    const reports =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    renderShipResponseReports(
      container,
      reports
    );

  }catch(error){

    console.error(
      'loadShipResponsesScreen:',
      error
    );


    container.innerHTML = `

      <div
        class="empty"
      >

        Could not load Ship Response reports.

        <br><br>

        ${escapeHtml(
          error?.message ||
          'Unknown error'
        )}


        <br><br>


        <button
          type="button"
          class="btn-secondary"
          id="retryShipResponsesBtn"
        >

          TRY AGAIN

        </button>

      </div>

    `;


    const retry =
      document.getElementById(
        'retryShipResponsesBtn'
      );


    if(
      retry
    ){

      retry.addEventListener(
        'click',
        loadShipResponsesScreen
      );

    }

  }

}


/* ============================================================
   RENDER SHIP RESPONSE REPORTS
============================================================ */

function renderShipResponseReports(
  container,
  reports
){

  /*
    The Ship Response landing page shows ONE CARD PER REPORT.
    The full report is opened only after clicking OPEN REPORT.
  */

  /*
    EVERY report sent to the ship must appear here.
    A report does NOT need a Follow-Up Needed point
    in order to require ship review and submission.
  */

  const waiting =
    Array.isArray(reports)
      ? reports
      : [];


  currentShipResponseReport =
    null;


  if(
    waiting.length ===
    0
  ){

    container.innerHTML = `

      <div class="empty">

        No reports are currently waiting
        for ship response.

      </div>

    `;


    return;

  }


  container.innerHTML =
    waiting
      .map(
        renderShipResponseReportCard
      )
      .join('');


  bindShipResponseButtons();

}


/* ============================================================
   SHIP RESPONSE REPORT CARD
============================================================ */

function renderShipResponseReportCard(
  report
){

  return `

    <div
      class="report-card blue"
    >

      <h3>

        ${escapeHtml(
          report.ship ||
          'Unnamed Ship'
        )}

      </h3>


      <div
        class="report-meta"
        style="
          line-height:1.7;
        "
      >

        <b>Visit:</b>

        ${escapeHtml(
          report.date_on ||
          ''
        )}

        ${
          report.date_off
            ? ` → ${escapeHtml(
                report.date_off
              )}`
            : ''
        }

        <br>


        <b>Reviewer:</b>

        ${escapeHtml(
          report.reviewer ||
          ''
        )}

        <br>


      </div>


      <div
        class="response-status"
      >

        ${isReportUser() ? 'IN REVIEW • READ ONLY' : 'IN REVIEW • OPEN TO ADD SHIP COMMENTS AND SUBMIT'}

      </div>


      <button
        type="button"
        class="btn-primary open-ship-response-report"
        data-open-response-report-id="${escapeHtml(
          report.id
        )}"
        style="
          margin-top:12px;
        "
      >

        ${isReportUser() ? 'VIEW REPORT' : 'OPEN REPORT'}

      </button>


      ${
        canDeleteReport(report)
          ? `

            <button
              type="button"
              class="admin-delete"
              data-response-delete-id="${escapeHtml(
                report.id
              )}"
              style="
                width:100%;
                min-height:38px;
                margin-top:8px;
                padding:8px 10px;
                border:1px solid #CC0000;
                border-radius:7px;
                background:#FFFFFF;
                color:#CC0000;
                font-family:inherit;
                font-size:9px;
                font-weight:800;
                cursor:pointer;
              "
            >

              DELETE REPORT

            </button>

          `
          : ''
      }

    </div>

  `;

}


/* ============================================================
   OPEN FULL SHIP RESPONSE REPORT
============================================================ */

async function openShipResponseReport(
  report
){

  if(report?.id && !report?.report_data?.state){
    const detailed = await withTimeout(getReport(report.id), 60000, 'Loading report details timed out after 60 seconds.');
    if(!detailed?.success || !detailed.data){
      showError('Could not open the ship response report.', detailed?.error || null);
      return;
    }
    report = detailed.data;
  }

  if(
    !report
  ){

    return;

  }


  currentShipResponseReport =
    report;


  const container =
    document.getElementById(
      'responseList'
    );


  if(
    !container
  ){

    return;

  }


  const points =
    getReportPoints(
      report,
      true
    );


  container.innerHTML = `

    <div
      style="
        margin-bottom:14px;
      "
    >

      ${
        shipResponseLinkMode
          ? ''
          : `
            <button
              type="button"
              class="btn-secondary"
              id="shipResponseListBackBtn"
              style="
                margin-bottom:12px;
              "
            >
              ← Back to Reports
            </button>
          `
      }


      <div
        class="report-card blue"
        style="
          margin-bottom:0;
        "
      >

        <h3>

          ${escapeHtml(
            report.ship ||
            'Unnamed Ship'
          )}

        </h3>


        <div
          class="report-meta"
          style="
            line-height:1.7;
          "
        >

          <b>Visit:</b>

          ${escapeHtml(
            report.date_on ||
            ''
          )}

          ${
            report.date_off
              ? ` → ${escapeHtml(
                  report.date_off
                )}`
              : ''
          }

          <br>


          <b>Reviewer:</b>

          ${escapeHtml(
            report.reviewer ||
            ''
          )}

        </div>


        <div
          class="response-status"
          style="
            margin-top:9px;
          "
        >

          FULL REPORT — SHIP RESPONSE

        </div>

      </div>

    </div>


    <div>

      ${
        SECTIONS
          .map(
            section => {

              const sectionPoints =
                points.filter(
                  point =>
                    point.section ===
                    section.title
                );


              const generalComments =
                getDepartmentGeneralCommentsFromReport(
                  report,
                  section.id
                );


              if(
                sectionPoints.length === 0 &&
                generalComments.length === 0
              ){

                return '';

              }


              return `

                <div
                  style="
                    margin-top:20px;
                  "
                >

                  <div
                    style="
                      margin-bottom:10px;
                      padding-bottom:7px;
                      border-bottom:2px solid var(--vv-red);
                      color:var(--vv-squid);
                      font-size:15px;
                      font-weight:800;
                    "
                  >

                    ${escapeHtml(
                      section.title
                    )}

                  </div>


                  ${
                    generalComments.length
                      ? `

                        <div
                          style="
                            margin-bottom:10px;
                            padding:10px 12px;
                            border-left:4px solid var(--vv-squid);
                            border-radius:8px;
                            background:#F8F5FA;
                          "
                        >

                          <div
                            style="
                              color:var(--vv-squid);
                              font-size:9px;
                              font-weight:800;
                              letter-spacing:.04em;
                            "
                          >

                            GENERAL COMMENTS

                          </div>


                          ${
                            generalComments
                              .map(
                                comment => `

                                  <div
                                    style="
                                      margin-top:7px;
                                      font-size:11px;
                                      line-height:1.5;
                                      color:var(--vv-body);
                                    "
                                  >

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
                    sectionPoints
                      .map(
                        point =>
                          renderShipResponsePoint(
                            report.id,
                            point
                          )
                      )
                      .join('')
                  }

                </div>

              `;

            }
          )
          .join('')
      }

    </div>


    <button
      type="button"
      class="btn-primary submit-ship-response"
      data-response-report-id="${escapeHtml(
        report.id
      )}"
      style="
        margin-top:20px;
      "
    >

      Submit Report

    </button>


    ${
      isAdmin()
        ? `

          <button
            type="button"
            class="admin-delete"
            data-response-delete-id="${escapeHtml(
              report.id
            )}"
            style="
              width:100%;
              min-height:38px;
              margin-top:8px;
              padding:8px 10px;
              border:1px solid #CC0000;
              border-radius:7px;
              background:#FFFFFF;
              color:#CC0000;
              font-family:inherit;
              font-size:9px;
              font-weight:800;
              cursor:pointer;
            "
          >

            DELETE REPORT

          </button>

        `
        : ''
    }

  `;


  const back =
    document.getElementById(
      'shipResponseListBackBtn'
    );


  if(
    back
  ){

    back.addEventListener(
      'click',
      async function(){

        await loadShipResponsesScreen();

      }
    );

  }


  bindShipResponseButtons();

}


/* ============================================================
   SHIP RESPONSE POINT
============================================================ */

function renderShipResponsePoint(
  reportId,
  point
){

  return `

    <div
      class="response-point"
      style="
        margin-top:14px;
        padding-top:14px;
        border-top:1px solid var(--vv-line);
      "
    >

      <div
        class="response-section"
      >

        ${escapeHtml(
          point.section
        )}

      </div>


      <div
        style="
          margin-top:4px;
          color:var(--vv-body);
          font-size:13px;
          line-height:1.45;
          font-weight:700;
        "
      >

        ${escapeHtml(
          point.text
        )}

      </div>


      <div
        class="status ${
          point.followUpNeeded
            ? 'blue'
            : 'green'
        }"
        style="
          margin-top:7px;
        "
      >

        ${
          point.followUpNeeded
            ? 'FOLLOW-UP NEEDED FROM SHIP'
            : 'CHECKED — NO SHIP RESPONSE REQUIRED'
        }

      </div>


      <!-- ORIGINAL REVIEWER COMMENT -->

      ${
        point.comments.length
          ? `

            <div
              style="
                margin-top:10px;
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

            </div>

          `
          : `

            <div
              style="
                margin-top:8px;
                color:var(--vv-gray);
                font-size:9px;
              "
            >

              No reviewer comment was entered.

            </div>

          `
      }


      <!-- ORIGINAL REVIEWER PHOTO -->

      ${
        point.photos.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
              >

                REVIEWER PHOTOS

              </div>


              <div
                class="response-photos"
              >

                ${
                  point.photos
                    .map(
                      (photo, photoIndex) => `

                        <div class="response-photo">
                          <button type="button" class="response-photo-open" ${photoImageAttributes(photo, photoIndex)}>
                            <span aria-hidden="true">▧</span>
                            <span>${escapeHtml(responsePhotoFilename(photo, photoIndex))}</span>
                            <span class="response-photo-hint">Click to preview</span>
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


      <!-- EXISTING SHIP RESPONSES -->

      ${
        point.shipComments.length
          ? `

            <div
              style="
                margin-top:10px;
              "
            >

              <div
                class="response-label"
                style="
                  color:var(--status-green);
                "
              >

                PREVIOUS SHIP RESPONSE

              </div>


              ${
                point.shipComments
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

            </div>

          `
          : ''
      }


      <!-- SHIP INPUT ONLY FOR FOLLOW-UP -->

      ${
        point.followUpNeeded
          ? `

            <div
              class="field"
              style="
                margin-top:11px;
                margin-bottom:0;
              "
            >

              <label>

                SHIP COMMENT

              </label>


              <textarea
                class="ship-response-input"
                data-response-report="${escapeHtml(
                  reportId
                )}"
                data-response-key="${escapeHtml(
                  point.key
                )}"
                placeholder="Enter ship response"
              ></textarea>

            </div>

          `
          : ''
      }


    </div>

  `;

  hydratePhotoElements(container);

}


/* ============================================================
   SHIP RESPONSE EVENTS
============================================================ */

function bindShipResponseButtons(){

  document
    .querySelectorAll(
      '.open-ship-response-report'
    )
    .forEach(
      button => {

        if(
          button.dataset.openResponseBound === 'true'
        ){

          return;

        }


        button.dataset.openResponseBound = 'true';

        button.addEventListener(
          'click',
          async function(){

            const reportId =
              button.dataset.openResponseReportId;


            const result =
              await withTimeout(
                getReport(reportId),
                15000,
                'Loading report timed out.'
              );


            if(
              !result ||
              !result.success ||
              !result.data
            ){

              showError(
                'Could not open this report.',
                result?.error || null
              );

              return;

            }


            if(isReportUser()){
              await openReadOnlyReport(result.data, 'responses');
            }else{
              openShipResponseReport(
                result.data
              );
            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      '.submit-ship-response'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(){

            await submitShipResponseForReport(
              button.dataset.responseReportId
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '[data-response-delete-id]'
    )
    .forEach(
      button => {

        if(
          button.dataset.adminDeleteBound === 'true'
        ){

          return;

        }


        button.dataset.adminDeleteBound = 'true';

        button.addEventListener(
          'click',
          async function(
            event
          ){

            event.stopPropagation();

            await handleAdminDeleteReport(
              button.dataset.responseDeleteId
            );

          }
        );

      }
    );

}


/* ============================================================
   DELETE SHIP RESPONSE REPORT
============================================================ */

async function deleteShipResponseReport(
  reportId
){

  if(
    !isAdmin()
  ){

    alert(
      'Administrator access required.'
    );


    return;

  }


  if(
    !reportId
  ){

    alert(
      'Report ID is missing.'
    );


    return;

  }


  const confirmed =
    window.confirm(
      'Delete this report permanently?'
    );


  if(
    !confirmed
  ){

    return;

  }


  try{

    const module =
      await import(
        './supabase.js'
      );


    if(
      typeof module.deleteReport !==
      'function'
    ){

      throw new Error(
        'deleteReport is not available in supabase.js.'
      );

    }


    const result =
      await withTimeout(
        module.deleteReport(
          reportId
        ),
        15000,
        'Delete operation timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not delete the report.'
        )
      );

    }


    showToast(
      'REPORT DELETED'
    );


    await loadShipResponsesScreen();

  }catch(error){

    console.error(
      'deleteShipResponseReport:',
      error
    );


    showError(
      'Could not delete the report.',
      error
    );

  }

}


/* ============================================================
   ADMIN DELETE HANDLER
============================================================ */

function bindAdminDeleteButtons(){

  document
    .querySelectorAll(
      '[data-admin-delete]'
    )
    .forEach(
      button => {

        if(
          button.dataset.adminDeleteBound === 'true'
        ){

          return;

        }


        button.dataset.adminDeleteBound = 'true';


        button.addEventListener(
          'click',
          async function(event){

            event.stopPropagation();

            await handleAdminDeleteReport(
              button.dataset.adminDelete
            );

          }
        );

      }
    );

}


async function handleAdminDeleteReport(
  reportId
){

  if(!isAdmin() && !isReportUser()){
    alert('You do not have permission to delete this report.');
    return;
  }


  if(
    !reportId
  ){

    alert(
      'Report ID is missing.'
    );

    return;

  }


  if(
    !window.confirm(
      'Delete this report permanently?'
    )
  ){

    return;

  }


  try{

    const module =
      await import(
        './supabase.js'
      );

    if(!isAdmin()){
      const ownerResult = await module.getReportOwnership(reportId);
      const reportForAccessCheck = ownerResult?.data || null;
      const isOwner = Boolean(
        reportForAccessCheck?.created_by &&
        String(reportForAccessCheck.created_by) === String(currentAuthUserId || '')
      );
      const isAssignedReviewer = isNamedReviewerForReport(reportForAccessCheck);
      if(!ownerResult?.success || (!isOwner && !isAssignedReviewer)){
        throw new Error('You can delete only a report you created or one assigned to you in the Reviewer field.');
      }
    }

    if(
      typeof module.deleteReport !==
      'function'
    ){

      throw new Error(
        'deleteReport is not available in supabase.js.'
      );

    }


    const result =
      await withTimeout(
        module.deleteReport(reportId),
        15000,
        'Delete operation timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not delete the report.'
        )
      );

    }


    showToast(
      'REPORT DELETED'
    );


    await loadOpenReportsScreen();
    await loadSubmittedReportsScreen();
    await loadShipResponsesScreen();

  }catch(error){

    console.error(
      'handleAdminDeleteReport:',
      error
    );


    showError(
      'Could not delete the report.',
      error
    );

  }

}


/* ============================================================
   SUBMIT SHIP RESPONSE
============================================================ */

async function submitShipResponseForReport(
  reportId
){

  try{

    const current =
      await withTimeout(
        getReport(
          reportId
        ),
        15000,
        'Loading report timed out.'
      );


    if(
      !current ||
      !current.success ||
      !current.data
    ){

      throw (
        current?.error ||
        new Error(
          'Could not load report.'
        )
      );

    }


    const newState =
      JSON.parse(
        JSON.stringify(
          current.data
            ?.report_data
            ?.state ||
          {}
        )
      );


    const inputs =
      document.querySelectorAll(
        `[data-response-report="${cssEscape(
          reportId
        )}"]`
      );


    let added =
      0;


    inputs.forEach(
      input => {

        const text =
          input.value.trim();


        if(
          !text
        ){

          return;

        }


        const key =
          input.dataset.responseKey;


        if(
          !newState[key]
        ){

          return;

        }


        if(
          !Array.isArray(
            newState[key].shipComments
          )
        ){

          newState[key].shipComments =
            [];

        }


        newState[key].shipComments.push({

          name:
            'Ship',

          text,

          timestamp:
            new Date().toISOString()

        });


        added++;

      }
    );


    /*
      Ship responses are required only for points
      explicitly marked Follow-Up Needed.
      A report with zero follow-ups can still be
      submitted after the ship reviews the full report.
    */

    const incomplete =
      Object.values(
        newState
      )
      .filter(
        item =>
          item &&
          item.checked &&
          item.followUpNeeded &&
          !(
            Array.isArray(
              item.shipComments
            ) &&
            item.shipComments.length >
            0
          )
      );


    if(
      incomplete.length >
      0
    ){

      alert(
        `${incomplete.length} follow-up point(s) still need a ship response.`
      );


      return;

    }


    if(
      !window.confirm(
        'Submit Ship Response?\n\n' +
        'The report will move to Submitted Reports.'
      )
    ){

      return;

    }


    const result =
      await withTimeout(
        submitShipResponse({

          reportId,

          state:
            newState

        }),
        15000,
        'Submitting Ship Response timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not submit Ship Response.'
        )
      );

    }


    showToast(
      'SHIP RESPONSE SUBMITTED'
    );


    await loadShipResponsesScreen();

  }catch(error){

    console.error(
      'submitShipResponseForReport:',
      error
    );


    showError(
      'Could not submit Ship Response.',
      error
    );

  }

}


/* ============================================================
   SUBMITTED REPORTS
============================================================ */

async function loadSubmittedReportsScreen(){

  const container =
    document.getElementById(
      'reportList'
    );


  if(
    !container
  ){

    return;

  }


  container.innerHTML = `

    <div class="empty">

      Loading submitted reports...

    </div>

  `;


  try{

    const result =
      await withTimeout(
        getSubmittedReports(),
        15000,
        'Loading submitted reports timed out.'
      );


    if(
      !result ||
      !result.success
    ){

      throw (
        result?.error ||
        new Error(
          'Could not load submitted reports.'
        )
      );

    }


    const reports =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    renderSubmittedReports(
      container,
      reports
    );

  }catch(error){

    console.error(
      'loadSubmittedReportsScreen:',
      error
    );


    container.innerHTML = `

      <div class="empty">

        Could not load Submitted Reports.

        <br><br>

        ${escapeHtml(
          error?.message ||
          'Unknown error'
        )}

      </div>

    `;

  }

}


/* ============================================================
   RENDER SUBMITTED REPORTS
============================================================ */

function renderSubmittedReports(
  container,
  reports
){

  if(
    reports.length ===
    0
  ){

    container.innerHTML = `

      <div class="empty">

        No submitted reports.

      </div>

    `;


    return;

  }


  /*
    Three cards across on desktop comes from
    #reportList CSS.
  */

  container.innerHTML =
    reports
      .map(
        report => `

          <div
            class="submitted-card"
          >

            <h2>

              ${escapeHtml(
                report.ship ||
                'Unnamed Ship'
              )}

            </h2>


            <p>

              <b>Visit:</b>

              ${escapeHtml(
                report.date_on ||
                ''
              )}

              ${
                report.date_off
                  ? ` → ${escapeHtml(
                      report.date_off
                    )}`
                  : ''
              }

            </p>


            <p>

              <b>Reviewer:</b>

              ${escapeHtml(
                report.reviewer ||
                ''
              )}

            </p>


            <p>

              <b>Submitted:</b>

              ${formatSubmittedDate(
                report.submitted_at ||
                report.updated_at
              )}

            </p>


            <div
              class="submitted-status"
              style="
                margin-top:5px;
              "
            >

              SUBMITTED

            </div>


            <button
              type="button"
              class="btn-primary"
              data-submitted-review-id="${escapeHtml(
                report.id
              )}"
              style="
                margin-top:12px;
              "
            >

              ${(isReportUser() || isShipboard()) ? 'VIEW REPORT' : 'REVIEW REPORT'}

            </button>

            ${reportDeleteButton(
              report
            )}

          </div>

        `
      )
      .join('');


  container
    .querySelectorAll(
      '[data-submitted-review-id]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async function(){

            const report =
              reports.find(
                item =>
                  String(
                    item.id
                  ) ===
                  String(
                    button.dataset.submittedReviewId
                  )
              );


            if(
              report
            ){

              await openSubmittedReport(
                report
              );

            }

          }
        );

      }
    );


  bindAdminDeleteButtons();

}


/* ============================================================
   OPEN SUBMITTED REPORT
============================================================ */

async function openSubmittedReport(
  report
){

  try{

    if(report?.id && !report?.report_data?.state){
      const detailed = await withTimeout(getReport(report.id), 60000, 'Loading report details timed out after 60 seconds.');
      if(!detailed?.success || !detailed.data) throw (detailed?.error || new Error('Could not load submitted report details.'));
      report = detailed.data;
    }

    currentSubmittedReport =
      report;


    summaryReturnScreen =
      'submitted';


    loadReport(
      report
    );


    const container =
      document.getElementById(
        'report-overall-content'
      );


    if(
      container
    ){

      // FINAL SUBMITTED REPORTS show checked findings only.
      // This keeps reviewer comments, attached photos, follow-up flags, and
      // ship response comments attached to checked points, while fully omitting
      // unchecked points and their point-level details from the final view.
      renderCurrentReportSummary(
        report,
        false
      );

    }


    setSummaryMode(
      true
    );


    showScreen(
      'summary'
    );

  }catch(error){

    console.error(
      'openSubmittedReport:',
      error
    );


    showError(
      'Could not open the submitted report.',
      error
    );

  }

}


/* ============================================================
   FOLLOW-UP VIEW
============================================================ */

async function openSubmittedFollowUps(
  report
){

  try{

    if(report?.id && !report?.report_data?.state){
      const detailed = await withTimeout(getReport(report.id), 60000, 'Loading report details timed out after 60 seconds.');
      if(!detailed?.success || !detailed.data) throw (detailed?.error || new Error('Could not load report details.'));
      report = detailed.data;
    }

    currentSubmittedReport =
      report;


    loadReport(
      report
    );


    const container =
      document.getElementById(
        'report-followups-content'
      );


    if(
      !container
    ){

      return;

    }


    const points =
      getReportPoints(
        report,
        true
      )
      .filter(
        point =>
          point.followUpNeeded
      );


    if(
      points.length ===
      0
    ){

      container.innerHTML = `

        <div class="empty">

          No Follow-Up Needed points.

        </div>

      `;


      showScreen(
        'followups'
      );


      return;

    }


    container.innerHTML =
      points
        .map(
          renderSummaryPoint
        )
        .join('');


    showScreen(
      'followups'
    );

  }catch(error){

    console.error(
      'openSubmittedFollowUps:',
      error
    );


    showError(
      'Could not open follow-up points.',
      error
    );

  }

}


/* ============================================================
   FOLLOW-UP BUTTON
============================================================ */

function bindFollowUpButtons(){

  bindClick(
    'followupPdfBtn',
    async function(){

      if(
        !currentSubmittedReport
      ){

        alert(
          'No report selected.'
        );


        return;

      }


      const pdf =
        await getPDFModule();


      if(
        !pdf
      ){

        return;

      }


      try{

        pdf.generateFollowUpPDF(
          currentSubmittedReport
        );

      }catch(error){

        console.error(
          'followupPdfBtn:',
          error
        );


        showError(
          'Could not save Follow-Up PDF.',
          error
        );

      }

    }
  );

}


/* ============================================================
   PDF
============================================================ */

function bindPDFButtons(){

  bindClick(
    'pdfBtn',
    async function(){

      const pdf =
        await getPDFModule();


      if(
        !pdf
      ){

        return;

      }


      try{

        await pdf.generatePDF();

      }catch(error){

        console.error(
          'pdfBtn:',
          error
        );


        showError(
          'Could not save PDF.',
          error
        );

      }

    }
  );

}


/* ============================================================
   HEADER BACK BUTTONS
============================================================ */

function bindHeaderBackButtons(){

  /*
    These are bound during initial application startup.
    They do NOT wait for database calls.
  */

  bindClick(
    'setupHeaderBack',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'checklistHeaderBack',
    async function(){

      if(
        checklistReturnScreen ===
        'open'
      ){

        showScreen(
          'open'
        );


        await loadOpenReportsScreen();


        return;

      }


      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'reviewHeaderBack',
    async function(){

      await returnToChecklist();

    }
  );


  bindClick(
    'summaryHeaderBack',
    async function(){
      if(summaryReturnScreen === 'submitted'){
        showScreen('submitted');
        await loadSubmittedReportsScreen();
        return;
      }
      if(summaryReturnScreen === 'open'){
        showScreen('open');
        await loadOpenReportsScreen();
        return;
      }
      if(summaryReturnScreen === 'responses'){
        showScreen('responses');
        await loadShipResponsesScreen();
        return;
      }
      showScreen('checklist');
    }
  );


  bindClick(
    'followupsHeaderBack',
    async function(){

      showScreen(
        'submitted'
      );


      await loadSubmittedReportsScreen();

    }
  );


  /*
    THIS IS THE RED BACK BUTTON IN SHIP RESPONSE.
    It is deliberately bound directly during initialization.
  */

  bindClick(
    'responsesHeaderBack',
    function(){

      if(
        shipResponseLinkMode
      ){

        return;

      }

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'openHeaderBack',
    function(){

      showScreen(
        'home'
      );

    }
  );


  bindClick(
    'submittedHeaderBack',
    function(){

      showScreen(
        'home'
      );

    }
  );

}


/* ============================================================
   ADMIN
============================================================ */

function bindAdminButton(){
  const button = document.getElementById('adminButton');
  if(!button || button.dataset.authBound === 'true') return;
  button.dataset.authBound = 'true';
  button.addEventListener('click', async function(){
    if(!window.confirm('Sign out of Ship Visit Report?')) return;
    try{ await signOutUser(); }
    catch(error){ console.error('Sign out failed:', error); }
    currentAppRole = null;
    currentAuthUserId = null;
    currentAuthUserEmail = '';
    activeReportRecord = null;
    adminMode = false;
    shipResponseLinkMode = false;
    currentSubmittedReport = null;
    currentShipResponseReport = null;
    const email = document.getElementById('loginEmail');
    if(email) email.value = '';
    const password = document.getElementById('loginPassword');
    if(password) password.value = '';
    showLoginMessage('');
    showScreen('login');
  });
}

function updateAdminButton(){
  const button = document.getElementById('adminButton');
  if(button){
    button.textContent = 'SIGN OUT';
    button.style.background = '#FFFFFF';
    button.style.color = '#3C1053';
    button.style.borderColor = '#3C1053';
    button.style.display = currentAppRole ? '' : 'none';
  }
  applyRoleUI();
}

function restoreAdminMode(){
  // Access is determined by Supabase Auth and app_user_roles, never sessionStorage.
  adminMode = isAdmin();
}

function bindPhotoMigrationButton(){
  const button = document.getElementById('migratePhotosButton');
  if(!button || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.textContent = 'OPTIMIZE PHOTOS FOR CLICK-TO-LOAD';
  button.addEventListener('click', async function(){
    if(!isAdmin()){
      alert('Administrator access required.');
      return;
    }
    const defaultId = '9a36fd0b-2bfd-4ced-af6b-abbbd9e640f2';
    const reportId = window.prompt('Enter the open report ID whose embedded photos should be optimized for click-to-load:', defaultId);
    if(!reportId) return;
    if(!window.confirm('Move embedded photos into private, access-controlled photo records and replace the large image data in the report with small references? After this, each photo is fetched only when clicked. This change is transactional; continue?')) return;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'OPTIMIZING PHOTOS…';
    try{
      const result = await migrateEmbeddedPhotosToStorage(reportId.trim(), progress => {
        button.textContent = 'OPTIMIZING PHOTOS…';
      });
      if(!result?.success) throw (result?.error || new Error('Photo migration failed.'));
      alert(`${result.migrated} photo(s) prepared for click-to-load. The report now stores small references rather than full image data. Reopen the report, click several photos, and verify the PDF before making other changes.`);
      await loadOpenReportsScreen();
    }catch(error){
      console.error('Legacy photo migration failed:', error);
      alert('Photo migration failed. The original report data was kept.\n\n' + (error?.message || 'Unknown error'));
    }finally{
      button.disabled = false;
      button.textContent = 'OPTIMIZE PHOTOS FOR CLICK-TO-LOAD';
    }
  });
}


/* ============================================================
   UTILITIES
============================================================ */

function formatSubmittedDate(
  value
){

  if(
    !value
  ){

    return '';

  }


  try{

    return new Date(
      value
    ).toLocaleString();

  }catch(
    _error
  ){

    return String(
      value
    );

  }

}


function cssEscape(
  value
){

  const text =
    String(
      value ?? ''
    );


  if(
    window.CSS &&
    typeof window.CSS.escape ===
    'function'
  ){

    return window.CSS.escape(
      text
    );

  }


  return text.replace(
    /(["\\])/g,
    '\\$1'
  );

}


function withTimeout(
  promise,
  milliseconds,
  message
){

  let timer = null;


  const timeout =
    new Promise(
      (
        _resolve,
        reject
      ) => {

        timer =
          setTimeout(
            function(){

              reject(
                new Error(
                  message
                )
              );

            },
            milliseconds
          );

      }
    );


  return Promise.race(
    [
      promise,
      timeout

    ]
  )
  .finally(
    function(){

      if(
        timer
      ){

        clearTimeout(
          timer
        );

      }

    }
  );

}


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


      return map[
        character
      ];

    }
  );

}


function showError(
  message,
  error = null
){

  console.error(
    message,
    error
  );


  alert(
    message +
    (
      error?.message
        ? `\n\n${error.message}`
        : ''
    )
  );

}


function showToast(
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
   GLOBAL ERROR LOGGING
============================================================ */

window.addEventListener(
  'error',
  function(
    event
  ){

    console.error(
      'Ship Visit Report error:',
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  'unhandledrejection',
  function(
    event
  ){

    console.error(
      'Ship Visit Report promise error:',
      event.reason
    );

  }
);


/* ============================================================
   EXPORTS
============================================================ */

export {

  getChecklistModule,

  getReviewModule,

  getPDFModule,

  saveCurrentReport,

  loadOpenReportsScreen,

  loadSubmittedReportsScreen,

  loadShipResponsesScreen,

  openSavedReport,

  openSubmittedReport,

  openSubmittedFollowUps

};

==========================================================================================
FILE: supabase_current.txt
==========================================================================================

/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  supabase.js
  ============================================================
*/

import { getActiveChecklistVersion, getLegacyChecklistArchive } from './data.js';


/* =========================================================
   CONFIG
========================================================= */

export const SUPABASE_URL =
  'https://jpvtqvzsyqqawfenseua.supabase.co';


export const SUPABASE_KEY =
  'sb_publishable_2U4FJYEvgBYwfkUfJ768Qw_XtyshTJz';


export const PHOTO_BUCKET = 'ship-report-photos';


/* =========================================================
   CLIENT
========================================================= */

if(
  !window.supabase ||
  typeof window.supabase.createClient !== 'function'
){

  throw new Error(
    'Supabase library did not load.'
  );

}


export const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   PAYLOAD
========================================================= */

function buildPayload({
  meta,
  state,
  status
}){

  return {

    ship:
      meta?.ship ||
      '',

    date_on:
      meta?.dateOn ||
      null,

    date_off:
      meta?.dateOff ||
      null,

    reviewer:
      meta?.reviewer ||
      '',

    status:
      status ||
      'open',

    report_data:{

      checklistVersion: getActiveChecklistVersion(),

      ...(getLegacyChecklistArchive() ? { legacyChecklistArchive: getLegacyChecklistArchive() } : {}),

      meta:{

        ship:
          meta?.ship ||
          '',

        dateOn:
          meta?.dateOn ||
          '',

        dateOff:
          meta?.dateOff ||
          '',

        reviewer:
          meta?.reviewer ||
          ''

      },

      state:
        JSON.parse(
          JSON.stringify(
            state ||
            {}
          )
        )

    },

    updated_at:
      new Date().toISOString()

  };

}


/* =========================================================
   CREATE OPEN REPORT
========================================================= */

export async function createOpenReport({
  meta,
  state
}){

  try{

    // Explicitly stamp the authenticated creator on INSERT only.
    // UPDATE operations never change created_by, so editing does not transfer ownership.
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if(authError) throw authError;

    const creatorId = authData?.user?.id;
    if(!creatorId){
      throw new Error('Please sign in again before creating a report.');
    }

    const payload = buildPayload({
      meta,
      state,
      status: 'open'
    });
    payload.created_by = creatorId;

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .insert(payload)
        .select()
        .single();


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  }catch(error){

    console.error(
      'createOpenReport:',
      error
    );


    return {

      success:false,

      data:null,

      error

    };

  }

}


/* =========================================================
   UPDATE OPEN REPORT
========================================================= */

export async function updateOpenReport({
  reportId,
  meta,
  state
}){

  try{

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .update(
          buildPayload({

            meta,

            state,

            status:
              'open'

          })
        )
        .eq(
          'id',
          reportId
        )
        .eq(
          'status',
          'open'
        )
        .select()
        .single();


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  }catch(error){

    console.error(
      'updateOpenReport:',
      error
    );


    return {

      success:false,

      data:null,

      error

    };

  }

}


/* =========================================================
   SAVE OPEN REPORT
========================================================= */

export async function saveOpenReport({
  reportId,
  meta,
  state
}){

  if(
    reportId
  ){

    return updateOpenReport({

      reportId,

      meta,

      state

    });

  }


  return createOpenReport({

    meta,

    state

  });

}


/* =========================================================
   SEND TO SHIP REVIEW
========================================================= */

export async function sendToShipReview({
  reportId,
  meta,
  state
}){

  try{

    if(
      !reportId
    ){

      throw new Error(
        'Report ID is required.'
      );

    }


    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .update(
          buildPayload({

            meta,

            state,

            status:
              'ship_review'

          })
        )
        .eq(
          'id',
          reportId
        )
        .eq(
          'status',
          'open'
        )
        .select()
        .single();


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  }catch(error){

    console.error(
      'sendToShipReview:',
      error
    );


    return {

      success:false,

      data:null,

      error

    };

  }

}


/* =========================================================
   OPEN REPORTS
========================================================= */

export async function getOpenReports(){

  try{

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .select('id,ship,date_on,date_off,reviewer,status,created_by,created_at,updated_at,submitted_at')
        .eq(
          'status',
          'open'
        )
        .order(
          'updated_at',
          {
            ascending:false
          }
        );


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data ||
        [],

      error:null

    };

  }catch(error){

    return {

      success:false,

      data:[],

      error

    };

  }

}


/* =========================================================
   SHIP REVIEW REPORTS
========================================================= */

export async function getShipReviewReports(){

  try{

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .select('id,ship,date_on,date_off,reviewer,status,created_by,created_at,updated_at,submitted_at')
        .eq(
          'status',
          'ship_review'
        )
        .order(
          'updated_at',
          {
            ascending:false
          }
        );


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data ||
        [],

      error:null

    };

  }catch(error){

    return {

      success:false,

      data:[],

      error

    };

  }

}


/* =========================================================
   SUBMITTED REPORTS
========================================================= */

export async function getSubmittedReports(){

  try{

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .select('id,ship,date_on,date_off,reviewer,status,created_by,created_at,updated_at,submitted_at')
        .eq(
          'status',
          'submitted'
        )
        .order(
          'updated_at',
          {
            ascending:false
          }
        );


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data ||
        [],

      error:null

    };

  }catch(error){

    return {

      success:false,

      data:[],

      error

    };

  }

}


/* =========================================================
   REPORT BY FRIENDLY REFERENCE
========================================================= */

export async function getReportByReference(
  reportRef
){

  try{

    if(!reportRef){
      throw new Error('Report reference is required.');
    }

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .select('*')
        .eq(
          'report_data->>reportRef',
          reportRef
        )
        .single();

    if(
      result.error
    ){
      throw result.error;
    }

    return {
      success:true,
      data:result.data,
      error:null
    };

  }catch(error){

    return {
      success:false,
      data:null,
      error
    };

  }

}


/* =========================================================
   SINGLE REPORT
========================================================= */

export async function getReport(
  reportId
){

  try{

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .select('*')
        .eq(
          'id',
          reportId
        )
        .single();


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  }catch(error){

    return {

      success:false,

      data:null,

      error

    };

  }

}


/* =========================================================
   SAVE SHIPBOARD COMMENTS ON OPEN REPORTS
========================================================= */

export async function saveShipboardOpenUpdates({ reportId, comments = {}, focusRequests = {} }){
  try{
    if(!reportId) throw new Error('Report ID is required.');
    const { data, error } = await supabase.rpc('save_shipboard_open_updates', {
      p_report_id: reportId,
      p_comments: comments || {},
      p_focus_requests: focusRequests || {}
    });
    if(error) throw error;
    return { success:true, data, error:null };
  }catch(error){
    console.error('saveShipboardOpenUpdates:', error);
    return { success:false, data:null, error };
  }
}


/* =========================================================
   SHIP SUBMITS FINAL RESPONSE
========================================================= */

export async function submitShipResponse({
  reportId,
  state
}){
  try{
    if(!reportId) throw new Error('Report ID is required.');
    const { data, error } = await supabase.rpc('submit_ship_response', {
      p_report_id: reportId,
      p_state: state || {}
    });
    if(error) throw error;
    return { success:true, data, error:null };
  }catch(error){
    console.error('submitShipResponse:', error);
    return { success:false, data:null, error };
  }
}


/* =========================================================
   AUTHENTICATION AND ROLE
========================================================= */

export async function getAuthContext(){
  const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
  if(sessionError) throw sessionError;
  const session = sessionResult?.session || null;
  if(!session) return null;

  const { data: roleRow, error: roleError } = await supabase
    .from('app_user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if(roleError) throw roleError;

  return {
    session,
    user: session.user,
    role: roleRow?.role || null
  };
}

const APPROVED_SHIP_VISIT_EMAILS = new Set([
  // Admin
  'aleksei.sologubov-ic@virginvoyages.com',

  // Report users / named reviewers
  'levi.mezick@virginvoyages.com',
  'seidy.soderholm@virginvoyages.com',
  'don.habets@virginvoyages.com',
  'eszter.tary@virginvoyages.com',
  'marin.lukin@virginvoyages.com',
  'edina.smajic-ic@virginvoyages.com',
  'andras.rafajlovics@virginvoyages.com',
  'andrew.diclementi@virginvoyages.com',
  'jamesadam.noffsinger@virginvoyages.com',
  'mycca.argawanon-ic@virginvoyages.com',

  // Shipboard users
  'val.htl.fbdirector@virginvoyages.com',
  'brl.htl.fbdirector@virginvoyages.com',
  'scl.htl.fbdirector@virginvoyages.com',
  'res.htl.fbdirector@virginvoyages.com',
  'scl.cul.srexecchef@virginvoyages.com',
  'val.cul.srexecchef@virginvoyages.com',
  'res.cul.srexecchef@virginvoyages.com',
  'brl.cul.srexecchef@virginvoyages.com',
  'scl.restaurantoperationsmanager@virginvoyages.com',
  'val.rst.operationsmgr@virginvoyages.com',
  'brl.rst.operationsmgr@virginvoyages.com',
  'scl.beverageoperationsmanager@virginvoyages.com',
  'brl.bev.operationsmgr@virginvoyages.com',
  'res.rst.operationsmgr@virginvoyages.com',
  'val.bev.operationsmgr@virginvoyages.com',
  'res.bev.operationsmgr@virginvoyages.com',
  'scl.htl.sanitationofficer@virginvoyages.com',
  'res.htl.sanitationofficer@virginvoyages.com',
  'val.htl.sanitationoff@virginvoyages.com',
  'brl.htl.sanitationofficer@virginvoyages.com'
]);

export async function signInWithPassword(email, password){
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');
  if(!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)){
    throw new Error('Enter a valid work email address.');
  }
  if(!APPROVED_SHIP_VISIT_EMAILS.has(cleanEmail)){
    throw new Error('This email address is not approved for Ship Visit Report access. Contact the administrator if you need access.');
  }
  if(!cleanPassword){
    throw new Error('Enter your password.');
  }
  return supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword
  });
}

export async function signOutUser(){
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
  return true;
}


/* =========================================================
   PRIVATE STORAGE PHOTO HELPERS
========================================================= */

function photoStoragePath(photo){
  let path = null;
  if(photo && typeof photo === 'object'){
    path = photo.storagePath || photo.storage_path || photo.path || null;
  }else if(typeof photo === 'string' && photo.startsWith('storage://')){
    path = photo.slice('storage://'.length);
  }
  if(typeof path !== 'string') return null;
  path = path.trim();
  if(path.startsWith('storage://')) path = path.slice('storage://'.length);
  if(path.startsWith(`${PHOTO_BUCKET}/`)) path = path.slice(PHOTO_BUCKET.length + 1);
  return path || null;
}

export async function getPhotoDisplayUrl(photo, expiresIn = 3600){
  if(!photo) return '';

  if(typeof photo === 'string'){
    if(photo.startsWith('data:image/')) return photo;
    if(/^https?:\/\//i.test(photo)) return photo;
  }

  if(photo && typeof photo === 'object'){
    const legacyPhotoId = photo.legacyPhotoId || photo.legacy_photo_id || photo.photoId || photo.photo_id || null;
    if(legacyPhotoId){
      const { data, error } = await supabase.rpc('get_legacy_report_photo', {
        p_photo_id: String(legacyPhotoId)
      });
      if(error) throw error;
      if(typeof data !== 'string' || !data.startsWith('data:image/')){
        throw new Error('Supabase returned no valid image data for the legacy photo reference.');
      }
      return data;
    }
  }

  const path = photoStoragePath(photo);
  if(typeof photo === 'string' && !path) return '';

  if(!path){
    const directSource = typeof photo === 'object'
      ? (photo.url || photo.src || photo.data || photo.image || '')
      : '';
    if(typeof directSource === 'string' && (directSource.startsWith('data:image/') || /^https?:\/\//i.test(directSource))) return directSource;
    return '';
  }

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, expiresIn);
  if(error) throw new Error(`Could not create a photo link for '${path}': ${error.message || error}`);
  if(!data?.signedUrl) throw new Error(`Supabase did not return a photo link for '${path}'.`);
  return data.signedUrl;
}

function blobToDataUrl(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read stored photo.'));
    reader.readAsDataURL(blob);
  });
}

export async function getPhotoDataUrl(photo){
  if(typeof photo === 'string' && photo.startsWith('data:image/')) return photo;
  const url = await getPhotoDisplayUrl(photo);
  if(!url) throw new Error('Photo reference is missing.');
  const response = await fetch(url);
  if(!response.ok) throw new Error(`Could not download photo (${response.status}).`);
  return blobToDataUrl(await response.blob());
}

export async function uploadPhotoDataUrl(reportId, pointKey, dataUrl, originalName = ''){
  if(!reportId) throw new Error('Save the report before attaching photos.');
  if(typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')){
    throw new Error('The selected photo could not be read as an image.');
  }

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const category = String(pointKey || 'general')
    .replace(/__\d+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_') || 'general';
  const safeKey = String(pointKey || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const random = (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const fileName = `${safeKey}_${random}.jpg`;
  const storagePath = `${reportId}/${category}/${fileName}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });
  if(error) throw error;

  return {
    storagePath,
    filename: String(originalName || fileName).slice(0, 200),
    contentType: blob.type || 'image/jpeg',
    uploadedAt: new Date().toISOString()
  };
}

export async function deleteStoragePhoto(storagePath){
  if(!storagePath) return { success:true };
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
  if(error) throw error;
  return { success:true };
}

export async function deleteLegacyPhotoData(legacyPhotoId){
  if(!legacyPhotoId) return { success:true, deleted:false };
  const { data, error } = await supabase.rpc('delete_legacy_report_photo', {
    p_photo_id: legacyPhotoId
  });
  if(error) throw error;
  return data || { success:true };
}

/* One-time Admin optimization. The SQL RPC moves embedded image strings into a
   private table and replaces them with small references in one database transaction.
   It avoids downloading and resending the complete multi-megabyte report JSON. */
export async function migrateEmbeddedPhotosToStorage(reportId, onProgress = null){
  try{
    const auth = await getAuthContext();
    if(!auth || auth.role !== 'admin') throw new Error('Administrator access is required.');
    if(!reportId) throw new Error('Report ID is required.');
    if(typeof onProgress === 'function') onProgress({ done:0, total:1, section:'Optimizing report photos' });

    const { data, error } = await supabase.rpc('prepare_report_photos_for_lazy_loading', {
      p_report_id: reportId
    });
    if(error) throw error;
    const migrated = Number(data?.migrated || 0);
    if(typeof onProgress === 'function') onProgress({ done:1, total:1, section:'Complete' });
    return {
      success: data?.success !== false,
      migrated,
      data,
      message: data?.message || 'Photo optimization complete.'
    };
  }catch(error){
    console.error('prepare report photos for lazy loading:', error);
    return { success:false, migrated:0, error };
  }
}


/* =========================================================
   EMAIL SHIP REPORT

   Calls the Supabase Edge Function that:
   - identifies the correct ship email
   - creates the secure response token
   - sends the report response email
========================================================= */

export async function sendShipReportEmail({
  reportId
}){

  try{

    if(
      !reportId
    ){

      throw new Error(
        'Report ID is required.'
      );

    }


    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-ship-report`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ reportId })
      }
    );


    let data = null;

    try{
      data = await response.json();
    }catch(
      _error
    ){
      data = null;
    }


    if(
      !response.ok ||
      !data?.success
    ){

      throw new Error(
        data?.error ||
        `Email function returned HTTP ${response.status}.`
      );

    }


    return {

      success:true,

      data,

      error:null

    };

  }catch(error){

    console.error(
      'sendShipReportEmail:',
      error
    );

    return {

      success:false,

      data:null,

      error

    };

  }

}


/* =========================================================
   REPORT OWNER (small query; does not download report photos)
========================================================= */

export async function getReportOwnership(reportId){
  try{
    const { data, error } = await supabase
      .from('ship_visit_reports')
      .select('id,created_by,ship,status,reviewer')
      .eq('id', reportId)
      .single();
    if(error) throw error;
    return { success:true, data, error:null };
  }catch(error){
    return { success:false, data:null, error };
  }
}


/* =========================================================
   DELETE REPORT
========================================================= */

export async function deleteReport(reportId){
  try{
    const { data, error } = await supabase
      .from('ship_visit_reports')
      .delete()
      .eq('id', reportId)
      .select('id')
      .maybeSingle();
    if(error) throw error;
    if(!data?.id){
      throw new Error('Report was not deleted. You may only delete reports you created.');
    }
    return { success:true, data, error:null };
  }catch(error){
    return { success:false, error };
  }
}


/* =========================================================
   REPORT STATUS COLOR
========================================================= */

export function getReportColor(
  report
){

  if(
    report?.status === 'open'
  ){

    return 'red';

  }


  if(
    report?.status === 'ship_review'
  ){

    return 'blue';

  }


  if(
    report?.status === 'submitted'
  ){

    return 'green';

  }


  return 'blue';

}


/* =========================================================
   STATUS TEXT
========================================================= */

export function getReportStatusText(
  report
){

  if(
    report?.status === 'open'
  ){

    return 'OPEN / ONGOING';

  }


  if(
    report?.status === 'ship_review'
  ){

    return 'WAITING FOR SHIP RESPONSE';

  }


  if(
    report?.status === 'submitted'
  ){

    return 'SUBMITTED';

  }


  return 'UNKNOWN';

}


/* =========================================================
   FOLLOW-UP COUNT
========================================================= */

export function countFollowUps(
  state
){

  return Object.values(
    state ||
    {}
  )
  .filter(
    item =>
      item &&
      item.followUpNeeded
  )
  .length;

}


/* =========================================================
   COMPLETED FOLLOW-UP COUNT
========================================================= */

export function countCompletedFollowUps(
  state
){

  return Object.values(
    state ||
    {}
  )
  .filter(
    item =>
      item &&
      item.followUpNeeded &&
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length > 0
  )
  .length;

}


/* =========================================================
   FOLLOW-UP STATUS
========================================================= */

export function reportNeedsFollowUp(
  report
){

  const state =
    report
      ?.report_data
      ?.state ||
    {};


  return Object.values(
    state
  )
  .some(
    item =>
      item &&
      item.followUpNeeded &&
      !(
        Array.isArray(
          item.shipComments
        ) &&
        item.shipComments.length > 0
      )
  );

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  supabase,

  createOpenReport,

  updateOpenReport,

  saveOpenReport,

  sendToShipReview,

  getOpenReports,

  getShipReviewReports,

  getSubmittedReports,

  getReport,

  submitShipResponse,

  sendShipReportEmail,

  deleteReport,
  getReportOwnership,

  getReportColor,

  getReportStatusText,

  countFollowUps,

  countCompletedFollowUps,

  reportNeedsFollowUp,
  getAuthContext,
  signInWithPassword,
  signOutUser,
  getPhotoDisplayUrl,
  getPhotoDataUrl,
  uploadPhotoDataUrl,
  deleteStoragePhoto,
  migrateEmbeddedPhotosToStorage

};

==========================================================================================
FILE: ship_visit_shipboard_comments_migration.txt
==========================================================================================

-- Virgin Voyages Ship Visit Report
-- Secure RPC for shipboard comments and department Ship Focus Requests on OPEN reports.
-- Run this migration in Supabase SQL Editor, preferably in staging first.
-- This function does not accept reviewer findings, checklist status, or follow-up flags from the client.

BEGIN;

CREATE OR REPLACE FUNCTION public.save_shipboard_open_updates(
  p_report_id uuid,
  p_comments jsonb DEFAULT '{}'::jsonb,
  p_focus_requests jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_report public.ship_visit_reports%ROWTYPE;
  v_state jsonb;
  v_focus jsonb;
  v_key text;
  v_text text;
  v_item jsonb;
  v_comments jsonb;
  v_comment jsonb;
  v_email text;
  v_name text;
  v_entry record;
  v_request jsonb;
  v_updated_rows integer;
BEGIN
  -- Only authenticated shipboard-role users may use this RPC.
  IF auth.uid() IS NULL OR public.current_app_role() IS DISTINCT FROM 'shipboard' THEN
    RAISE EXCEPTION 'Authenticated shipboard access is required.' USING errcode = '42501';
  END IF;

  IF jsonb_typeof(COALESCE(p_comments, '{}'::jsonb)) IS DISTINCT FROM 'object'
     OR jsonb_typeof(COALESCE(p_focus_requests, '{}'::jsonb)) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Comments and focus requests must be JSON objects.' USING errcode = '22023';
  END IF;

  -- Lock only a report that is still open. Shipboard inputs are not accepted after status changes.
  SELECT * INTO v_report
  FROM public.ship_visit_reports
  WHERE id = p_report_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The report is not open or does not exist.' USING errcode = 'P0002';
  END IF;

  v_state := COALESCE(v_report.report_data -> 'state', '{}'::jsonb);
  IF jsonb_typeof(v_state) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Report state has an unexpected format.' USING errcode = '22023';
  END IF;

  v_focus := COALESCE(v_report.report_data -> 'shipFocusRequests', '{}'::jsonb);
  IF jsonb_typeof(v_focus) IS DISTINCT FROM 'object' THEN
    v_focus := '{}'::jsonb;
  END IF;

  v_email := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_name := COALESCE(
    NULLIF(auth.jwt() ->> 'full_name', ''),
    NULLIF(auth.jwt() ->> 'name', ''),
    NULLIF(v_email, ''),
    'Shipboard'
  );

  -- Only update shipComments on existing points whose saved reviewer flag is true.
  -- The client cannot set or change followUpNeeded, checked, comments, or photos through this RPC.
  FOR v_entry IN
    SELECT key, value FROM jsonb_each(COALESCE(p_comments, '{}'::jsonb))
  LOOP
    v_key := v_entry.key;

    IF v_key !~ '^[A-Za-z0-9_-]+__[0-9]+$' THEN
      RAISE EXCEPTION 'Invalid checklist point key.' USING errcode = '22023';
    END IF;

    IF jsonb_typeof(v_entry.value) NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Each ship comment must be a string or null.' USING errcode = '22023';
    END IF;

    v_text := btrim(COALESCE(v_entry.value #>> '{}', ''));
    IF length(v_text) > 3000 THEN
      RAISE EXCEPTION 'Ship comment must be 3000 characters or fewer.' USING errcode = '22023';
    END IF;

    v_item := v_state -> v_key;
    IF v_item IS NULL OR jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Checklist point was not found in this report.' USING errcode = '22023';
    END IF;

    IF COALESCE((v_item ->> 'followUpNeeded')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Ship comments are allowed only when Follow-Up Needed from Ship is enabled.' USING errcode = '42501';
    END IF;

    v_comments := COALESCE(v_item -> 'shipComments', '[]'::jsonb);
    IF jsonb_typeof(v_comments) IS DISTINCT FROM 'array' THEN
      v_comments := '[]'::jsonb;
    END IF;

    -- Replace this user's previous response for this point; preserve responses from other users.
    SELECT COALESCE(jsonb_agg(entry.value), '[]'::jsonb)
      INTO v_comments
    FROM jsonb_array_elements(v_comments) AS entry(value)
    WHERE lower(COALESCE(entry.value ->> 'email', '')) <> v_email;

    IF v_text <> '' THEN
      v_comment := jsonb_build_object(
        'name', v_name,
        'email', v_email,
        'text', v_text,
        'timestamp', now()
      );
      v_comments := v_comments || jsonb_build_array(v_comment);
    END IF;

    v_item := jsonb_set(v_item, '{shipComments}', v_comments, true);
    v_state := jsonb_set(v_state, ARRAY[v_key], v_item, true);
  END LOOP;

  -- Store the latest request per department without touching other report fields.
  FOR v_entry IN
    SELECT key, value FROM jsonb_each(COALESCE(p_focus_requests, '{}'::jsonb))
  LOOP
    v_key := v_entry.key;

    IF v_key !~ '^[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'Invalid department ID.' USING errcode = '22023';
    END IF;

    IF jsonb_typeof(v_entry.value) NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Each Ship Focus Request must be a string or null.' USING errcode = '22023';
    END IF;

    v_text := btrim(COALESCE(v_entry.value #>> '{}', ''));
    IF length(v_text) > 3000 THEN
      RAISE EXCEPTION 'Ship Focus Request must be 3000 characters or fewer.' USING errcode = '22023';
    END IF;

    IF v_text = '' THEN
      v_focus := v_focus - v_key;
    ELSE
      v_request := jsonb_build_object(
        'sectionId', v_key,
        'text', v_text,
        'name', v_name,
        'email', v_email,
        'timestamp', now()
      );
      v_focus := jsonb_set(v_focus, ARRAY[v_key], v_request, true);
    END IF;
  END LOOP;

  UPDATE public.ship_visit_reports AS r
  SET report_data = jsonb_set(
        jsonb_set(COALESCE(r.report_data, '{}'::jsonb), '{state}', v_state, true),
        '{shipFocusRequests}', v_focus, true
      ),
      updated_at = now()
  WHERE r.id = p_report_id AND r.status = 'open';

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows <> 1 THEN
    RAISE EXCEPTION 'The report is no longer open; shipboard updates were not saved.' USING errcode = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'status', 'open'
  );
END;
$function$;

-- Do not expose this RPC to anonymous/public callers.
REVOKE ALL ON FUNCTION public.save_shipboard_open_updates(uuid, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_shipboard_open_updates(uuid, jsonb, jsonb) TO authenticated;

COMMENT ON FUNCTION public.save_shipboard_open_updates(uuid, jsonb, jsonb) IS
  'Allows shipboard-role users to save ship comments only on reviewer-flagged follow-up points and department Ship Focus Requests while a report is open.';

COMMIT;


==========================================================================================
FILE: README_ship_comment_update.txt
==========================================================================================

SHIP VISIT REPORT — SHIP COMMENT UI UPDATE

Files:
- ship_visit_main_updated.js: replaces the old SHIP TEAM COMMENT textarea/delete-button rendering with comment-card styling, Comment/Photo controls, Add, and ×.
- supabase_current.js: copy of the user's current Supabase module.
- ship_visit_shipboard_comments_migration.sql: existing secure save_shipboard_open_updates migration from the current project materials.

IMPORTANT LIMITATIONS:
1. The current backend stores one editable ship response per user per checklist point. This UI update does not create independently identified multiple comments.
2. The Photo control currently displays a status explaining that photo attachments need a matching Supabase RPC/schema migration. It does not upload a photo.
3. Do not replace production files or run SQL against production until the project schema and migration have been verified. The SQL file is the existing migration, not a new per-comment/photo migration.
4. main.js passed `node --check` syntax validation, but this package has not been integration-tested against your deployed Supabase project.

For a truly complete implementation of multiple independent comments with photos and per-comment delete, the database RPC and JSON schema must be extended first; do not treat this package as that complete feature.

