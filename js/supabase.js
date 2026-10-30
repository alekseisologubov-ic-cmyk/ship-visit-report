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

// Fields written only by shipboard users. Shoreside/admin saves must never overwrite them
// with a stale in-memory copy, so they are always taken from the stored report.
const SHIP_OWNED_ITEM_FIELDS = ['shipComments', 'shipPhotos'];

function hasShipData(item){
  return SHIP_OWNED_ITEM_FIELDS.some(field => {
    const value = item?.[field];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
}

function mergeShipOwnedFields(outgoingState, storedState){
  const merged = JSON.parse(JSON.stringify(outgoingState || {}));
  Object.entries(storedState || {}).forEach(([key, storedItem]) => {
    if(!storedItem || typeof storedItem !== 'object') return;
    const target = merged[key];
    if(target && typeof target === 'object'){
      SHIP_OWNED_ITEM_FIELDS.forEach(field => {
        if(storedItem[field] !== undefined) target[field] = storedItem[field];
      });
    }else if(hasShipData(storedItem)){
      merged[key] = JSON.parse(JSON.stringify(storedItem));
    }
  });
  return merged;
}

function buildPayload({
  meta,
  state,
  status,
  preserved
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

      ...(preserved?.shipFocusRequests !== undefined ? { shipFocusRequests: preserved.shipFocusRequests } : {}),

      ...(preserved?.reportRef !== undefined ? { reportRef: preserved.reportRef } : {}),

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

    // Re-read the stored report so shipboard comments/photos/focus requests added
    // since this editor was opened are kept instead of overwritten.
    const { data: stored, error: storedError } =
      await supabase
        .from('ship_visit_reports')
        .select('report_data')
        .eq('id', reportId)
        .eq('status', 'open')
        .maybeSingle();
    if(storedError) throw storedError;
    const storedData = stored?.report_data || {};

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .update(
          buildPayload({

            meta,

            state:
              mergeShipOwnedFields(state, storedData.state),

            status:
              'open',

            preserved:{
              shipFocusRequests: storedData.shipFocusRequests,
              reportRef: storedData.reportRef
            }

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

export async function saveShipboardOpenUpdates({ reportId, comments = {}, focusRequests = {}, photos = {} }){
  try{
    if(!reportId) throw new Error('Report ID is required.');
    const { data, error } = await supabase.rpc('save_shipboard_open_updates', {
      p_report_id: reportId,
      p_comments: comments || {},
      p_focus_requests: focusRequests || {},
      p_photos: photos || {}
    });
    if(error) throw error;
    return { success:true, data, error:null };
  }catch(error){
    console.error('saveShipboardOpenUpdates:', error);
    return { success:false, data:null, error };
  }
}


/* =========================================================
   APPEND ONE SHIPBOARD COMMENT (NEVER REPLACE HISTORY)
========================================================= */
export async function appendShipboardOpenComment({ reportId, pointKey, text }) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    if (!pointKey) throw new Error('Checklist point is required.');
    const cleanText = String(text || '').trim();
    if (!cleanText) throw new Error('Enter a comment before saving.');
    if (cleanText.length > 3000) throw new Error('Comment must be 3000 characters or fewer.');

    const { data, error } = await supabase.rpc('append_shipboard_open_comment', {
      p_report_id: reportId,
      p_point_key: pointKey,
      p_text: cleanText
    });
    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('appendShipboardOpenComment:', error);
    return { success: false, data: null, error };
  }
}


/* =========================================================
   DELETE ONE SHIPBOARD COMMENT (SERVER CHECKS AUTHORSHIP)
========================================================= */
export async function deleteShipboardOpenComment({ reportId, pointKey, commentId }) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    if (!pointKey) throw new Error('Checklist point is required.');
    if (!commentId) throw new Error('Comment ID is required.');
    const { data, error } = await supabase.rpc('delete_shipboard_open_comment', {
      p_report_id: reportId,
      p_point_key: pointKey,
      p_comment_id: String(commentId)
    });
    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error('deleteShipboardOpenComment:', error);
    return { success: false, data: null, error };
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

  // Access is driven by the app_user_roles table in SQL (one row per approved login).
  const { data: roleRow, error: roleError } = await supabase
    .from('app_user_roles')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if(roleError) throw roleError;

  const active = roleRow ? roleRow.active !== false : false;
  const aliases = Array.isArray(roleRow?.reviewer_aliases) ? roleRow.reviewer_aliases : [];

  return {
    session,
    user: session.user,
    role: active ? (roleRow?.role || null) : null,
    displayName: roleRow?.display_name || '',
    reviewerAliases: [roleRow?.display_name, ...aliases].filter(Boolean)
  };
}

export async function signInWithPassword(email, password){
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');
  if(!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)){
    throw new Error('Enter a valid work email address.');
  }
  if(!cleanPassword){
    throw new Error('Enter your password.');
  }
  const result = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword
  });
  if(result?.error) return result;

  // Approval check is done in SQL: the signed-in user must have an active role row.
  let context = null;
  try{
    context = await getAuthContext();
  }catch(error){
    await supabase.auth.signOut();
    throw error;
  }
  if(!context?.role){
    await supabase.auth.signOut();
    throw new Error('This email address is not approved for Ship Visit Report access. Contact the administrator if you need access.');
  }
  return result;
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
  const contentType = blob.type || 'image/jpeg';
  if(!/^image\/(jpeg|png|webp|gif)$/i.test(contentType)) {
    throw new Error('Choose a JPG, PNG, WEBP, or GIF image.');
  }
  if(blob.size > 12 * 1024 * 1024) {
    throw new Error('Each photo must be 12 MB or smaller.');
  }
  const category = String(pointKey || 'general')
    .replace(/__\d+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_') || 'general';
  const safeKey = String(pointKey || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const extension = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[contentType.toLowerCase()] || 'jpg';
  const random = (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const fileName = `${safeKey}_${random}.${extension}`;
  const storagePath = `${reportId}/${category}/${fileName}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, blob, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });
  if(error) throw error;

  return {
    storagePath,
    filename: String(originalName || fileName).slice(0, 200),
    contentType,
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

/* =========================================================
   SHORESIDE / ADMIN SHIP FOCUS REQUEST MANAGEMENT
========================================================= */

export async function manageShipFocusRequest({
  reportId,
  sectionId,
  text = ''
} = {}) {
  try {
    if (!reportId || !sectionId) {
      throw new Error('Report ID and department are required.');
    }

    const { data, error } = await supabase.rpc(
      'manage_ship_focus_request',
      {
        p_report_id: reportId,
        p_section_id: sectionId,
        p_request_text: text || ''
      }
    );

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('manageShipFocusRequest:', error);

    return {
      success: false,
      data: null,
      error
    };
  }
}
