/*
  ============================================================
  VIRGIN VOYAGES - SHIP VISIT REPORT
  main.js - stable master controller
  ============================================================

  Flow:
    Home -> Create -> Department -> Checklist -> Summary
                                      -> Ship Review
    Home -> Open Reports -> Checklist
    Home -> Ship Response Report -> Ship Response -> Submitted
    Home -> Submitted Reports -> Review -> Save PDF

  Notes:
    - Secondary modules are lazy-loaded.
    - Checklist functions are always called through checklist.js.
    - Reviewer comments accept current and legacy stored formats.
    - Admin delete is available in Ship Response Report.
*/

import { SECTIONS } from './data.js';

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
  submitShipResponse
} from './supabase.js';

let checklistModule = null;
let reviewModule = null;
let reportsModule = null;
let pdfModule = null;

let adminMode = false;
let checklistReturnScreen = 'setup';
let summaryReturnScreen = 'checklist';
let currentSubmittedReport = null;

const ADMIN_EMAILS = ['alebass80@gmail.com'];

const SCREENS = [
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
   APPLICATION START
============================================================ */

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  window.__SHIP_VISIT_SECTIONS__ = SECTIONS;
  window.shipVisitIsAdmin = () => adminMode;

  restoreAdminMode();
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
  updateAdminButton();
  showScreen('home');

  console.log('Ship Visit Report ready.');
}

/* ============================================================
   MODULE LOADERS
============================================================ */

async function getChecklistModule() {
  if (checklistModule) return checklistModule;

  try {
    checklistModule = await import('./checklist.js');
    return checklistModule;
  } catch (error) {
    console.error('checklist.js failed:', error);
    showError('Checklist module could not be loaded.', error);
    return null;
  }
}

async function getReviewModule() {
  if (reviewModule) return reviewModule;

  try {
    reviewModule = await import('./review.js');
    return reviewModule;
  } catch (error) {
    console.error('review.js failed:', error);
    showError('Ship Review module could not be loaded.', error);
    return null;
  }
}

async function getReportsModule() {
  if (reportsModule) return reportsModule;

  try {
    reportsModule = await import('./reports.js');
    return reportsModule;
  } catch (error) {
    console.error('reports.js failed:', error);
    showError('Reports module could not be loaded.', error);
    return null;
  }
}

async function getPDFModule() {
  if (pdfModule) return pdfModule;

  try {
    pdfModule = await import('./pdf.js');
    return pdfModule;
  } catch (error) {
    console.error('pdf.js failed:', error);
    showError('PDF module could not be loaded.', error);
    return null;
  }
}

/* ============================================================
   NAVIGATION
============================================================ */

export function showScreen(screen) {
  const target = SCREENS.includes(screen) ? screen : 'home';

  SCREENS.forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;

    const active = id === target;
    element.classList.toggle('hidden', !active);
    element.style.display = active ? '' : 'none';
  });

  window.scrollTo(0, 0);
}

function bindClick(id, handler) {
  const element = document.getElementById(id);
  if (!element) return;
  element.addEventListener('click', handler);
}

/* ============================================================
   HOME
============================================================ */

function bindHomeButtons() {
  bindClick('createReport', () => {
    clearSetupFields();
    setupDefaultDate();
    currentSubmittedReport = null;
    checklistReturnScreen = 'setup';
    summaryReturnScreen = 'checklist';
    showScreen('setup');
  });

  bindClick('openReport', async () => {
    showScreen('open');
    await loadOpenReportsScreen();
  });

  bindClick('submittedReports', async () => {
    showScreen('submitted');
    await loadSubmittedReportsScreen();
  });

  bindClick('shipResponseReport', async () => {
    showScreen('responses');
    await loadShipResponsesScreen();
  });

  bindClick('setupHome', () => showScreen('home'));
  bindClick('openHomeBtn', () => showScreen('home'));
  bindClick('reportsHomeBtn', () => showScreen('home'));
  bindClick('responsesHomeBtn', () => showScreen('home'));
  bindClick('followupsHomeBtn', () => showScreen('home'));
}

/* ============================================================
   SETUP / CREATE REPORT
============================================================ */

function bindCreateReport() {
  bindClick('startBtn', handleStartReport);
}

function clearSetupFields() {
  ['ship', 'dateOn', 'dateOff', 'reviewer'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });
}

function setupDefaultDate() {
  const input = document.getElementById('dateOn');
  if (input && !input.value) {
    input.value = new Date().toISOString().slice(0, 10);
  }
}

async function handleStartReport() {
  const ship = document.getElementById('ship')?.value.trim() || '';
  const dateOn = document.getElementById('dateOn')?.value || '';
  const dateOff = document.getElementById('dateOff')?.value || '';
  const reviewer = document.getElementById('reviewer')?.value.trim() || '';

  if (!ship) {
    alert('Please enter the ship.');
    return;
  }

  if (!reviewer) {
    alert('Please enter the reviewer.');
    return;
  }

  try {
    startNewReport({ ship, dateOn, dateOff, reviewer });
    checklistReturnScreen = 'setup';
    summaryReturnScreen = 'checklist';

    const result = await saveOpenReport({
      reportId: null,
      meta: getMeta(),
      state: getState()
    });

    if (!result?.success || !result.data) {
      throw result?.error || new Error('Could not create the report.');
    }

    setReportId(result.data.id);

    const checklist = await getChecklistModule();
    if (!checklist) return;

    if (typeof checklist.updateChecklistHeader === 'function') {
      checklist.updateChecklistHeader();
    }

    checklist.renderChecklist();
    showScreen('checklist');
    showToast('OPEN REPORT CREATED');
  } catch (error) {
    console.error('Create report:', error);
    showError('Could not create the report.', error);
  }
}

/* ============================================================
   CHECKLIST
============================================================ */

function bindChecklistButtons() {
  bindClick('summaryBtn', async () => {
    const saved = await saveCurrentReport();
    if (!saved) {
      alert('Could not save the report.');
      return;
    }

    summaryReturnScreen = 'checklist';
    await showActiveSummary();
  });

  bindClick('shipReviewBtn', async () => {
    await openShipReview();
  });

  const reviewerInput = document.getElementById('hdrReviewer');
  if (reviewerInput) {
    reviewerInput.addEventListener('change', async event => {
      setReviewer(event.target.value);
      await saveCurrentReport();
    });
  }
}

async function saveCurrentReport() {
  const reportId = getReportId();
  if (!reportId) return false;

  try {
    const result = await saveOpenReport({
      reportId,
      meta: getMeta(),
      state: getState()
    });

    return Boolean(result?.success);
  } catch (error) {
    console.error('saveCurrentReport:', error);
    return false;
  }
}

/* ============================================================
   ACTIVE REPORT SUMMARY
============================================================ */

async function showActiveSummary() {
  const container = document.getElementById('report-overall-content');
  if (!container) return;

  const report = {
    id: getReportId(),
    ship: getMeta().ship,
    date_on: getMeta().dateOn,
    date_off: getMeta().dateOff,
    reviewer: getMeta().reviewer,
    status: 'open',
    report_data: {
      meta: getMeta(),
      state: getState()
    }
  };

  renderReportOverall(container, report);
  setSummaryMode(false);
  showScreen('summary');
}

/* ============================================================
   SHIP REVIEW
============================================================ */

async function openShipReview() {
  const saved = await saveCurrentReport();
  if (!saved) {
    alert('Could not save the report.');
    return;
  }

  const review = await getReviewModule();
  if (!review) return;

  if (typeof review.setReviewCallbacks === 'function') {
    review.setReviewCallbacks({
      sentToShip: async () => {
        showToast('REPORT SENT TO SHIP');
        showScreen('responses');
        await loadShipResponsesScreen();
      }
    });
  }

  const prepared = await review.prepareShipReview();
  if (!prepared) return;

  showScreen('review');
}

function bindReviewButtons() {
  bindClick('reviewBackBtn', async () => {
    const checklist = await getChecklistModule();
    if (checklist) {
      if (typeof checklist.updateChecklistHeader === 'function') {
        checklist.updateChecklistHeader();
      }
      checklist.renderChecklist();
    }
    showScreen('checklist');
  });

  bindClick('reviewSubmitBtn', async () => {
    const review = await getReviewModule();
    if (!review) return;
    await review.sendCurrentReportToShip();
  });
}

/* ============================================================
   SUMMARY BUTTONS
============================================================ */

function bindSummaryButtons() {
  bindClick('summaryBackToReportBtn', async () => {
    const checklist = await getChecklistModule();
    if (checklist) {
      if (typeof checklist.updateChecklistHeader === 'function') {
        checklist.updateChecklistHeader();
      }
      checklist.renderChecklist();
    }
    showScreen('checklist');
  });

  bindClick('summarySubmitBtn', async () => {
    await openShipReview();
  });

  bindClick('summaryBackToSubmittedBtn', async () => {
    showScreen('submitted');
    await loadSubmittedReportsScreen();
  });

  bindClick('summaryPdfBtn', async () => {
    if (!currentSubmittedReport) {
      alert('No submitted report selected.');
      return;
    }

    const pdf = await getPDFModule();
    if (!pdf) return;

    try {
      loadReport(currentSubmittedReport);
      pdf.generatePDF();
    } catch (error) {
      console.error('Save PDF:', error);
      showError('Could not save PDF.', error);
    }
  });
}

function setSummaryMode(isSubmitted) {
  const active = document.getElementById('summaryActiveActions');
  const submitted = document.getElementById('summarySubmittedActions');

  if (active) active.classList.toggle('hidden', isSubmitted);
  if (submitted) submitted.classList.toggle('hidden', !isSubmitted);
}

/* ============================================================
   OPEN REPORTS
============================================================ */

async function loadOpenReportsScreen() {
  const container = document.getElementById('openList');
  if (!container) return;

  container.innerHTML = '<div class="empty">Loading open reports...</div>';

  try {
    const result = await getOpenReports();
    if (!result?.success) throw result?.error || new Error('Could not load open reports.');

    const module = await getReportsModule();
    if (module && typeof module.setReportCallbacks === 'function') {
      module.setReportCallbacks({
        openReport: async report => openSavedReport(report),
        viewSummary: async report => openSubmittedReport(report),
        viewFollowUps: async report => openSubmittedFollowUps(report),
        showHome: () => showScreen('home')
      });
    }

    if (module && typeof module.renderOpenReports === 'function') {
      await module.renderOpenReports();
      return;
    }

    renderBasicReportList(container, result.data || [], 'open');
  } catch (error) {
    console.error('Open Reports:', error);
    container.innerHTML = `<div class="empty">Could not load Open Reports.<br><br>${escapeHtml(error?.message || 'Unknown error')}</div>`;
  }
}

/* ============================================================
   SUBMITTED REPORTS
============================================================ */

async function loadSubmittedReportsScreen() {
  const container = document.getElementById('reportList');
  if (!container) return;

  container.innerHTML = '<div class="empty">Loading submitted reports...</div>';

  try {
    const result = await getSubmittedReports();
    if (!result?.success) throw result?.error || new Error('Could not load submitted reports.');

    const module = await getReportsModule();
    if (module && typeof module.setReportCallbacks === 'function') {
      module.setReportCallbacks({
        openReport: async report => openSavedReport(report),
        viewSummary: async report => openSubmittedReport(report),
        viewFollowUps: async report => openSubmittedFollowUps(report),
        showHome: () => showScreen('home')
      });
    }

    if (module && typeof module.renderSubmittedReports === 'function') {
      await module.renderSubmittedReports();
      return;
    }

    renderBasicReportList(container, result.data || [], 'submitted');
  } catch (error) {
    console.error('Submitted Reports:', error);
    container.innerHTML = `<div class="empty">Could not load Submitted Reports.<br><br>${escapeHtml(error?.message || 'Unknown error')}</div>`;
  }
}

function renderBasicReportList(container, reports, type) {
  if (!Array.isArray(reports) || reports.length === 0) {
    container.innerHTML = `<div class="empty">${type === 'submitted' ? 'No submitted reports yet.' : 'No open reports yet.'}</div>`;
    return;
  }

  container.innerHTML = reports.map(report => `
    <div class="report-card ${type === 'submitted' ? 'green' : 'red'}">
      <h3>${escapeHtml(report.ship || 'Unnamed Ship')}</h3>
      <div class="report-meta">
        <b>Visit:</b> ${escapeHtml(report.date_on || '')}
        ${report.date_off ? ` → ${escapeHtml(report.date_off)}` : ''}<br>
        <b>Reviewer:</b> ${escapeHtml(report.reviewer || '')}
      </div>
      <button type="button" class="btn-primary" data-basic-report-id="${escapeHtml(report.id)}">
        ${type === 'submitted' ? 'REVIEW REPORT' : 'OPEN REPORT'}
      </button>
    </div>
  `).join('');

  container.querySelectorAll('[data-basic-report-id]').forEach(button => {
    button.addEventListener('click', async () => {
      const report = reports.find(item => String(item.id) === String(button.dataset.basicReportId));
      if (!report) return;
      if (type === 'submitted') await openSubmittedReport(report);
      else await openSavedReport(report);
    });
  });
}

/* ============================================================
   OPEN SAVED REPORT
============================================================ */

async function openSavedReport(report) {
  try {
    loadReport(report);
    currentSubmittedReport = null;
    checklistReturnScreen = 'open';

    const checklist = await getChecklistModule();
    if (!checklist) return;

    if (typeof checklist.updateChecklistHeader === 'function') {
      checklist.updateChecklistHeader();
    }

    checklist.renderChecklist();
    showScreen('checklist');
  } catch (error) {
    console.error('Open saved report:', error);
    showError('Could not open this report.', error);
  }
}

/* ============================================================
   REVIEWER COMMENT NORMALIZATION
============================================================ */

function normalizeReviewerComments(item, reportReviewer = '') {
  if (!item) return [];

  const candidate =
    item.comments ??
    item.reviewerComments ??
    item.reviewer_comments ??
    item.reviewComments ??
    null;

  if (Array.isArray(candidate)) {
    return candidate.map(value => normalizeOneComment(value, reportReviewer || item.reviewer)).filter(Boolean);
  }

  if (candidate && typeof candidate === 'object') {
    const normalized = normalizeOneComment(candidate, reportReviewer || item.reviewer);
    return normalized ? [normalized] : [];
  }

  const legacyFields = [
    'reviewerComment',
    'reviewer_comment',
    'reviewComment',
    'review_comment',
    'comment',
    'note'
  ];

  for (const field of legacyFields) {
    if (typeof item[field] === 'string' && item[field].trim()) {
      return [{
        name: reportReviewer || item.reviewer || 'Reviewer',
        text: item[field].trim(),
        timestamp: null
      }];
    }
  }

  return [];
}

function normalizeOneComment(value, fallbackReviewer = '') {
  if (typeof value === 'string') {
    const text = value.trim();
    return text ? {
      name: fallbackReviewer || 'Reviewer',
      text,
      timestamp: null
    } : null;
  }

  if (!value || typeof value !== 'object') return null;

  const text = String(
    value.text ??
    value.comment ??
    value.message ??
    value.value ??
    ''
  ).trim();

  if (!text) return null;

  return {
    name: String(
      value.name ??
      value.reviewer ??
      value.author ??
      fallbackReviewer ??
      'Reviewer'
    ).trim() || 'Reviewer',
    text,
    timestamp: value.timestamp ?? value.createdAt ?? null
  };
}

function normalizePhotos(item) {
  if (!item) return [];

  const value = item.photos;

  if (!Array.isArray(value)) return [];

  return value.map(photo => {
    if (typeof photo === 'string') return photo;
    if (photo && typeof photo === 'object') {
      return photo.url || photo.src || photo.data || photo.image || '';
    }
    return '';
  }).filter(Boolean);
}

function normalizeShipComments(item) {
  if (!item) return [];

  const value = item.shipComments ?? item.ship_comments ?? item.shipComment ?? [];

  if (Array.isArray(value)) {
    return value.map(comment => {
      if (typeof comment === 'string') {
        const text = comment.trim();
        return text ? { name: 'Ship', text, timestamp: null } : null;
      }

      if (!comment || typeof comment !== 'object') return null;

      const text = String(
        comment.text ??
        comment.comment ??
        comment.message ??
        ''
      ).trim();

      if (!text) return null;

      return {
        name: comment.name || comment.ship || 'Ship',
        text,
        timestamp: comment.timestamp ?? comment.createdAt ?? null
      };
    }).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [{ name: 'Ship', text: value.trim(), timestamp: null }];
  }

  return [];
}

function getReportPoints(report, onlyChecked = true) {
  const state = report?.report_data?.state || {};
  const reviewer = report?.reviewer || report?.report_data?.meta?.reviewer || '';
  const points = [];

  SECTIONS.forEach(section => {
    section.items.forEach((text, index) => {
      const key = `${section.id}__${index}`;
            const item = state[key];

      if (!item) return;
      if (onlyChecked && !item.checked) return;

      points.push({
        key,
        section: section.title,
        text,
        checked: Boolean(item.checked),
        comments: normalizeReviewerComments(item, reviewer),
        photos: normalizePhotos(item),
        followUpNeeded: Boolean(item.followUpNeeded),
        shipComments: normalizeShipComments(item)
      });
    });
  });

  return points;
}

/* ============================================================
   SUBMITTED REPORT -> SUMMARY
============================================================ */

async function openSubmittedReport(report) {
  try {
    currentSubmittedReport = report;
    summaryReturnScreen = 'submitted';
    loadReport(report);

    const container = document.getElementById('report-overall-content');
    if (!container) return;

    renderReportOverall(container, report);
    setSummaryMode(true);
    showScreen('summary');
  } catch (error) {
    console.error('Open submitted report:', error);
    showError('Could not open submitted report.', error);
  }
}

function renderReportOverall(container, report) {
  const meta = report?.report_data?.meta || {};
  const points = getReportPoints(report, true);

  if (points.length === 0) {
    container.innerHTML = '<div class="empty">No checklist points were checked.</div>';
    return;
  }

  const groups = [];

  points.forEach(point => {
    let group = groups.find(item => item.section === point.section);
    if (!group) {
      group = { section: point.section, points: [] };
      groups.push(group);
    }
    group.points.push(point);
  });

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <div style="color:var(--vv-squid);font-size:16px;font-weight:800;">REPORT INFORMATION</div>
      <div style="margin-top:7px;color:var(--vv-gray);font-size:11px;line-height:1.7;">
        <b>Ship:</b> ${escapeHtml(report.ship || meta.ship || '')}<br>
        <b>Visit:</b> ${escapeHtml(report.date_on || meta.dateOn || '')}
        ${(report.date_off || meta.dateOff) ? ` → ${escapeHtml(report.date_off || meta.dateOff)}` : ''}<br>
        <b>Reviewer:</b> ${escapeHtml(report.reviewer || meta.reviewer || '')}
      </div>
    </div>

    <div style="margin-bottom:18px;">
      <div style="color:var(--vv-squid);font-size:16px;font-weight:800;">REPORT SUMMARY</div>
      <div style="margin-top:7px;color:var(--vv-gray);font-size:11px;line-height:1.6;">
        ${points.length} checked point(s) shown below with reviewer comments, photos and ship responses where available.
      </div>
    </div>

    ${groups.map(group => `
      <div style="margin-bottom:20px;">
        <div style="margin-bottom:9px;padding-bottom:6px;border-bottom:2px solid var(--vv-red);color:var(--vv-squid);font-size:14px;font-weight:800;">
          ${escapeHtml(group.section)}
        </div>
        ${group.points.map(renderSummaryPoint).join('')}
      </div>
    `).join('')}
  `;
}

function renderSummaryPoint(point) {
  const completed = point.followUpNeeded && point.shipComments.length > 0;

  return `
    <div style="margin-bottom:11px;padding:12px;border:1px solid var(--vv-line);border-left:4px solid var(--vv-squid);border-radius:8px;background:#fff;">
      <div style="display:flex;gap:8px;align-items:flex-start;">
        <div style="width:22px;height:22px;flex:0 0 22px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--vv-red);color:#fff;font-size:11px;font-weight:800;">✓</div>
        <div style="flex:1;font-size:13px;line-height:1.5;font-weight:700;">${escapeHtml(point.text)}</div>
      </div>

      ${point.followUpNeeded ? `
        <div style="margin-top:9px;">
          <span class="status ${completed ? 'green' : 'blue'}">${completed ? 'SHIP FOLLOW-UP COMPLETED' : 'FOLLOW-UP NEEDED FROM SHIP'}</span>
        </div>
      ` : ''}

      ${point.comments.length ? `
        <div style="margin-top:10px;">
          <div class="response-label">REVIEWER COMMENTS</div>
          ${point.comments.map(comment => `
            <div class="comment">
              <strong>${escapeHtml(comment.name || 'Reviewer')}:</strong>
              <div style="margin-top:3px;">${escapeHtml(comment.text || '')}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${point.photos.length ? `
        <div style="margin-top:10px;">
          <div class="response-label">ATTACHED PHOTOS</div>
          <div class="response-photos">
            ${point.photos.map(photo => `
              <div class="response-photo">
                <img src="${escapeHtml(photo)}" alt="Reviewer photo">
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${point.shipComments.length ? `
        <div style="margin-top:10px;">
          <div class="response-label" style="color:var(--status-green);">SHIP COMMENTS / RESPONSES</div>
          ${point.shipComments.map(comment => `
            <div class="ship-response-display">
              <strong>${escapeHtml(comment.name || 'Ship')}:</strong>
              <div style="margin-top:3px;">${escapeHtml(comment.text || '')}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/* ============================================================
   FOLLOW-UP VIEW
============================================================ */

async function openSubmittedFollowUps(report) {
  currentSubmittedReport = report;
  loadReport(report);

  const container = document.getElementById('report-followups-content');
  if (!container) return;

  const points = getReportPoints(report, true).filter(point => point.followUpNeeded);

  if (!points.length) {
    container.innerHTML = '<div class="empty">No points were marked Follow-Up Needed from Ship.</div>';
    showScreen('followups');
    return;
  }

  container.innerHTML = points.map(renderSummaryPoint).join('');
  showScreen('followups');
}

/* ============================================================
   SHIP RESPONSE REPORTS
============================================================ */

async function loadShipResponsesScreen() {
  const container = document.getElementById('responseList');
  if (!container) return;

  container.innerHTML = '<div class="empty">Loading reports waiting for ship response...</div>';

  try {
    const result = await getShipReviewReports();
    if (!result?.success) throw result?.error || new Error('Could not load Ship Response reports.');

    const reports = Array.isArray(result.data) ? result.data : [];

    if (!reports.length) {
      container.innerHTML = '<div class="empty">No reports are currently waiting for ship response.</div>';
      return;
    }

    const validReports = reports.filter(report =>
      getReportPoints(report, true).some(point => point.followUpNeeded)
    );

    if (!validReports.length) {
      container.innerHTML = '<div class="empty">No reports are currently waiting for ship response.</div>';
      return;
    }

    container.innerHTML =
      validReports
        .map(renderShipResponseReport)
        .join('');

    bindShipResponseButtons();
  } catch (error) {
    console.error('Ship Response:', error);
    container.innerHTML =
      `<div class="empty">Could not load Ship Response Report.<br><br>${escapeHtml(error?.message || 'Unknown error')}</div>`;
  }
}

function renderShipResponseReport(report) {
  const points =
    getReportPoints(
      report,
      true
    ).filter(
      point =>
        point.followUpNeeded
    );


  return `

    <div
      class="report-card blue"
      data-response-report="${escapeHtml(
        report.id
      )}"
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
      >

        SHIP RESPONSE REQUIRED

      </div>


      ${
        points
          .map(
            point =>
              renderShipResponsePoint(
                report.id,
                point
              )
          )
          .join('')
      }


      <button
        type="button"
        class="btn-primary submit-ship-response"
        data-response-report-id="${escapeHtml(
          report.id
        )}"
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
                background:#fff;
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

function renderShipResponsePoint(
  reportId,
  point
) {

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
        class="status blue"
        style="
          margin-top:7px;
        "
      >

        FOLLOW-UP NEEDED FROM SHIP

      </div>


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
                      photo => `

                        <div
                          class="response-photo"
                        >

                          <img
                            src="${escapeHtml(
                              photo
                            )}"
                            alt="Reviewer photo"
                          >

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


      <div
        class="field"
        style="
          margin-top:11px;
          margin-bottom:0;
        "
      >

        <label
          for="ship-response-${escapeHtml(
            reportId
          )}-${escapeHtml(
            point.key
          )}"
        >

          SHIP COMMENT

        </label>


        <textarea
          id="ship-response-${escapeHtml(
            reportId
          )}-${escapeHtml(
            point.key
          )}"
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


    </div>

  `;

}


/* ============================================================
   ADMIN
============================================================ */

function isAdmin() {
  return Boolean(adminMode);
}

function restoreAdminMode() {
  adminMode =
    sessionStorage.getItem(
      'ship_visit_admin'
    ) === 'true';
}

function bindAdminButton() {
  const button =
    document.getElementById(
      'adminButton'
    );

  if (!button) return;

  button.addEventListener(
    'click',
    () => {

      if (adminMode) {

        if (
          window.confirm(
            'Disable Admin Mode?'
          )
        ) {

          adminMode =
            false;

          sessionStorage.removeItem(
            'ship_visit_admin'
          );

          updateAdminButton();

          loadShipResponsesScreen();

        }

        return;

      }

      const email =
        window.prompt(
          'Enter administrator email:'
        );

      if (!email) return;

      if (
        !ADMIN_EMAILS.includes(
          email.trim().toLowerCase()
        )
      ) {

        alert(
          'Administrator access denied.'
        );

        return;

      }

      adminMode =
        true;

      sessionStorage.setItem(
        'ship_visit_admin',
        'true'
      );

      updateAdminButton();

      showToast(
        'Admin mode enabled.'
      );

      loadShipResponsesScreen();

    }
  );

}

function updateAdminButton() {

  const button =
    document.getElementById(
      'adminButton'
    );

  if (!button) return;

  if (adminMode) {

    button.textContent =
      'ADMIN MODE ON';

    button.style.background =
      '#E10A0A';

    button.style.color =
      '#FFFFFF';

    button.style.borderColor =
      '#E10A0A';

  } else {

    button.textContent =
      'ADMIN';

    button.style.background =
      '#FFFFFF';

    button.style.color =
      '#3C1053';

    button.style.borderColor =
      '#3C1053';

  }

}


/* ============================================================
   SHIP RESPONSE BUTTONS
============================================================ */

function bindShipResponseButtons() {

  document
    .querySelectorAll(
      '.submit-ship-response'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

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

        button.addEventListener(
          'click',
          async event => {

            event.stopPropagation();

            await deleteShipResponseReport(
              button.dataset.responseDeleteId
            );

          }
        );

      }
    );

}


async function deleteShipResponseReport(
  reportId
) {

  if (
    !isAdmin()
  ) {

    alert(
      'Administrator access required.'
    );

    return;

  }


  if (
    !reportId
  ) {

    alert(
      'Report ID is missing.'
    );

    return;

  }


  if (
    !window.confirm(
      'Delete this report permanently?'
    )
  ) {

    return;

  }


  if (
    !window.confirm(
      'This cannot be undone.\n\nContinue?'
    )
  ) {

    return;

  }


  try {

    const module =
      await import(
        './supabase.js'
      );


    if (
      typeof module.deleteReport !==
      'function'
    ) {

      throw new Error(
        'Delete function is not available in supabase.js.'
      );

    }


    const result =
      await module.deleteReport(
        reportId
      );


    if (
      !result?.success
    ) {

      throw (
        result?.error ||
        new Error(
          'Could not delete report.'
        )
      );

    }


    showToast(
      'REPORT DELETED'
    );


    await loadShipResponsesScreen();

  } catch (error) {

    console.error(
      'Delete Ship Response report:',
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
) {

  try {

    const current =
      await getReport(
        reportId
      );


    if (
      !current?.success ||
      !current.data
    ) {

      throw (
        current?.error ||
        new Error(
          'Could not load report.'
        )
      );

    }


    const state =
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


        if (
          !text
        ) {

          return;

        }


        const key =
          input.dataset.responseKey;


        if (
          !state[key]
        ) {

          return;

        }


        if (
          !Array.isArray(
            state[key].shipComments
          )
        ) {

          state[key].shipComments =
            [];

        }


        state[key].shipComments.push({

          name:
            'Ship',

          text,

          timestamp:
            new Date().toISOString()

        });


        added++;

      }
    );


    if (
      added ===
      0
    ) {

      alert(
        'Please enter at least one ship response.'
      );


      return;

    }


    const incomplete =
      Object.values(
        state
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


    if (
      incomplete.length
    ) {

      alert(
        `${incomplete.length} follow-up point(s) still need a ship response.`
      );


      return;

    }


    if (
      !window.confirm(
        'Submit Ship Response?\n\n' +
        'The report will move to Submitted Reports.'
      )
    ) {

      return;

    }


    const result =
      await submitShipResponse({

        reportId,

        state

      });


    if (
      !result?.success
    ) {

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

  } catch (error) {

    console.error(
      'Submit Ship Response:',
      error
    );


    showError(
      'Could not submit Ship Response.',
      error
    );

  }

}


/* ============================================================
   CSS ESCAPE
============================================================ */

function cssEscape(
  value
) {

  const text =
    String(
      value ?? ''
    );


  if (
    window.CSS &&
    typeof window.CSS.escape ===
    'function'
  ) {

    return window.CSS.escape(
      text
    );

  }


  return text.replace(
    /(["\\])/g,
    '\\$1'
  );

}


/* ============================================================
   ERROR HANDLING
============================================================ */

function showError(
  message,
  error = null
) {

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


/* ============================================================
   GLOBAL ERROR LOGGING
============================================================ */

window.addEventListener(
  'error',
  event => {

    console.error(
      'Ship Visit Report error:',
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  'unhandledrejection',
  event => {

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
  getReportsModule,
  getPDFModule,
  saveCurrentReport,
  loadOpenReportsScreen,
  loadSubmittedReportsScreen,
  loadShipResponsesScreen,
  openSavedReport,
  openSubmittedReport,
  openSubmittedFollowUps
};
