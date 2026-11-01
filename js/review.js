/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  review.js
  ============================================================

  REVIEW STEP
  Open report -> REVIEW (the finished PDF with every photo, nothing else)
  -> SUBMIT -> the report moves to Submitted Reports.
*/

import { SECTIONS } from './data.js';

import {
  getState,
  getMeta,
  getReportId
} from './state.js';

import {
  saveOpenReport,
  getReport,
  supabase
} from './supabase.js';

import { generatePDF } from './pdf.js';


/* =========================================================
   CALLBACKS
========================================================= */

let callbacks = { sentToShip: null };

export function setReviewCallbacks(newCallbacks = {}){
  callbacks = { ...callbacks, ...newCallbacks };
}


function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[character]));
}


/* =========================================================
   CHECKED POINTS (kept for other modules)
========================================================= */

export function getCheckedReviewPoints(){
  const state = getState() || {};
  const points = [];
  SECTIONS.forEach(section => {
    section.items.forEach((text, index) => {
      const key = `${section.id}__${index}`;
      const item = state[key];
      if(!item || !item.checked) return;
      points.push({
        key,
        section: section.title,
        text,
        comments: Array.isArray(item.comments) ? item.comments : [],
        photos: Array.isArray(item.photos) ? item.photos : [],
        followUpNeeded: Boolean(item.followUpNeeded),
        shipComments: Array.isArray(item.shipComments) ? item.shipComments : [],
        shipPhotos: Array.isArray(item.shipPhotos) ? item.shipPhotos : []
      });
    });
  });
  return points;
}


/* =========================================================
   SHOW THE PDF
========================================================= */

let currentPdfUrl = '';
let renderToken = 0;

function setSubmitButton(enabled, label){
  const button = document.getElementById('reviewSubmitBtn');
  if(!button) return;
  button.disabled = !enabled;
  if(label) button.textContent = label;
}

export async function renderShipReview(){

  const container = document.getElementById('ship-review-content');
  if(!container) return;

  const token = ++renderToken;
  const bottom = document.getElementById('ship-review-all');
  if(bottom) bottom.innerHTML = '';

  setSubmitButton(false, 'SUBMIT REPORT');

  container.innerHTML = `
    <div style="padding:24px;text-align:center;color:var(--vv-squid);font-weight:800;font-size:14px;">
      Preparing the report PDF with all photos…
      <div style="margin-top:6px;font-weight:400;font-size:12px;color:var(--vv-gray);">
        This can take a moment when the report has many photos.
      </div>
    </div>
  `;

  try{

    // Build the PDF from what is stored in the database right now,
    // so shoreside and shipboard comments and photos are all included.
    const reportId = getReportId();
    const fresh = reportId ? await getReport(reportId) : null;
    const stored = fresh?.success ? fresh.data : null;

    const options = { preview: true };
    if(stored?.report_data?.state){
      options.state = stored.report_data.state;
      options.meta = {
        ...(stored.report_data.meta || {}),
        ship: stored.ship || stored.report_data.meta?.ship || '',
        dateOn: stored.date_on || stored.report_data.meta?.dateOn || '',
        dateOff: stored.date_off || stored.report_data.meta?.dateOff || '',
        reviewer: stored.reviewer || stored.report_data.meta?.reviewer || ''
      };
    }

    const result = await generatePDF(options);
    if(token !== renderToken) return;   // a newer render replaced this one
    if(!result || !result.url) throw new Error('The PDF could not be created.');

    if(currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
    currentPdfUrl = result.url;

    container.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="color:var(--vv-squid);font-size:15px;font-weight:800;">
          REVIEW THE REPORT, THEN SUBMIT
        </div>
        <div style="display:flex;gap:8px;">
          <a href="${currentPdfUrl}" target="_blank" rel="noopener"
             style="padding:8px 12px;border:1px solid #D9CFE0;border-radius:8px;background:#fff;color:var(--vv-squid);font-size:12px;font-weight:800;text-decoration:none;">OPEN IN NEW TAB</a>
          <a href="${currentPdfUrl}" download="${escapeHtml(result.fileName || 'Ship_Visit_Report.pdf')}"
             style="padding:8px 12px;border:1px solid #D9CFE0;border-radius:8px;background:#fff;color:var(--vv-squid);font-size:12px;font-weight:800;text-decoration:none;">DOWNLOAD PDF</a>
        </div>
      </div>
      <iframe src="${currentPdfUrl}" title="Report PDF"
        style="width:100%;height:78vh;min-height:480px;border:1px solid #E7E1EA;border-radius:8px;background:#fff;"></iframe>
    `;

    if(bottom){
      bottom.innerHTML = `
        <div style="padding:14px;background:var(--vv-bg);border-radius:8px;">
          <div style="color:var(--vv-squid);font-size:14px;font-weight:800;">READY TO SUBMIT</div>
          <div style="margin-top:5px;color:var(--vv-gray);font-size:11px;line-height:1.5;">
            After submitting, this report leaves Open Reports and appears in Submitted Reports.
          </div>
        </div>
      `;
    }

    setSubmitButton(true, 'SUBMIT REPORT');

  }catch(error){

    console.error('Review PDF failed:', error);
    if(token !== renderToken) return;

    container.innerHTML = `
      <div style="padding:18px;border:1px solid #E10A0A;border-radius:8px;color:#C41425;font-size:13px;line-height:1.5;">
        <b>The PDF could not be prepared.</b><br>
        ${escapeHtml(error?.message || 'Unknown error')}<br><br>
        Go back and try again.
      </div>
    `;

  }

}


/* =========================================================
   PREPARE REVIEW
========================================================= */

export async function prepareShipReview(){

  const reportId = getReportId();
  if(!reportId){
    alert('No active report was found.');
    return false;
  }

  const saved = await saveOpenReport({
    reportId,
    meta: getMeta(),
    state: getState()
  });

  if(!saved || !saved.success){
    alert(
      'Could not save the report before Review.\n\n' +
      (saved?.error?.message || 'Unknown error')
    );
    return false;
  }

  // Not awaited on purpose: the screen opens at once and the PDF appears when ready.
  renderShipReview();

  return true;

}


/* =========================================================
   SUBMIT (OPEN -> SUBMITTED)
========================================================= */

export async function sendCurrentReportToShip(){

  const reportId = getReportId();
  if(!reportId){
    alert('No active report was found.');
    return false;
  }

  if(getCheckedReviewPoints().length === 0){
    alert('Please check at least one checklist point before submitting the report.');
    return false;
  }

  const confirmed = window.confirm(
    'Submit this report?\n\n' +
    'It will leave Open Reports and move to Submitted Reports.'
  );
  if(!confirmed) return false;

  setSubmitButton(false, 'SUBMITTING…');

  try{

    // One last save, keeping any shipboard comments and photos that were added meanwhile.
    const saved = await saveOpenReport({
      reportId,
      meta: getMeta(),
      state: getState()
    });
    if(!saved || !saved.success){
      throw saved?.error || new Error('Could not save the report before submitting.');
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('ship_visit_reports')
      .update({ status: 'submitted', submitted_at: now, updated_at: now })
      .eq('id', reportId)
      .eq('status', 'open')
      .select()
      .maybeSingle();

    if(error) throw error;
    if(!data){
      throw new Error('The report was not submitted. Your account may not be allowed to submit this report.');
    }

    if(currentPdfUrl){
      URL.revokeObjectURL(currentPdfUrl);
      currentPdfUrl = '';
    }

    if(callbacks.sentToShip){
      await callbacks.sentToShip(data);
    }

    return true;

  }catch(error){

    console.error('Submit report failed:', error);
    alert('The report could not be submitted.\n\n' + (error?.message || 'Unknown error'));
    setSubmitButton(true, 'SUBMIT REPORT');
    return false;

  }

}


/* =========================================================
   COMPATIBILITY
========================================================= */

export async function submitCurrentReport(){
  return sendCurrentReportToShip();
}


export default {
  renderShipReview,
  getCheckedReviewPoints,
  prepareShipReview,
  sendCurrentReportToShip,
  submitCurrentReport,
  setReviewCallbacks
};
