/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  supabase.js
  ============================================================
*/


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

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .insert(
          buildPayload({

            meta,

            state,

            status:
              'open'

          })
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
        .select('id,ship,date_on,date_off,reviewer,status,created_at,updated_at,submitted_at')
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
        .select('id,ship,date_on,date_off,reviewer,status,created_at,updated_at,submitted_at')
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
        .select('id,ship,date_on,date_off,reviewer,status,created_at,updated_at,submitted_at')
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

export async function signInWithPassword(email, password){
  return supabase.auth.signInWithPassword({
    email: String(email || '').trim(),
    password: String(password || '')
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
  if(photo && typeof photo === 'object' && typeof photo.storagePath === 'string'){
    return photo.storagePath;
  }
  if(typeof photo === 'string' && photo.startsWith('storage://')){
    return photo.slice('storage://'.length);
  }
  return null;
}

export async function getPhotoDisplayUrl(photo, expiresIn = 3600){
  if(!photo) return '';
  const path = photoStoragePath(photo);
  if(typeof photo === 'string'){
    if(photo.startsWith('data:image/')) return photo;
    if(/^https?:\/\//i.test(photo)) return photo;
    if(!path) return '';
  }
  if(!path) return String(photo.url || photo.src || photo.data || '');
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, expiresIn);
  if(error) throw error;
  return data?.signedUrl || '';
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

/* One-time admin migration: upload every embedded data-URL photo first,
   then update the report JSON only after every upload has succeeded. */
export async function migrateEmbeddedPhotosToStorage(reportId, onProgress = null){
  const uploadedPaths = [];
  try{
    const auth = await getAuthContext();
    if(!auth || auth.role !== 'admin') throw new Error('Administrator access is required.');
    const result = await getReport(reportId);
    if(!result?.success || !result.data) throw (result?.error || new Error('Could not load report.'));
    const report = result.data;
    if(report.status !== 'open') throw new Error('Only an open report can be migrated with this tool.');

    const updatedReportData = JSON.parse(JSON.stringify(report.report_data || {}));
    const state = updatedReportData.state || {};
    let total = 0;
    for(const item of Object.values(state)){
      if(Array.isArray(item?.photos)){
        total += item.photos.filter(photo => typeof photo === 'string' && photo.startsWith('data:image/')).length;
      }
    }
    if(total === 0) return { success:true, migrated:0, message:'No embedded photo data was found in this report.' };

    let done = 0;
    for(const [key, item] of Object.entries(state)){
      if(!item || !Array.isArray(item.photos)) continue;
      const nextPhotos = [];
      for(const photo of item.photos){
        if(typeof photo === 'string' && photo.startsWith('data:image/')){
          const ref = await uploadPhotoDataUrl(reportId, key, photo, `legacy-${done + 1}.jpg`);
          uploadedPaths.push(ref.storagePath);
          nextPhotos.push(ref);
          done++;
          if(typeof onProgress === 'function') onProgress({ done, total, section:key });
        }else{
          nextPhotos.push(photo);
        }
      }
      item.photos = nextPhotos;
    }

    updatedReportData.state = state;
    const { data, error } = await supabase
      .from('ship_visit_reports')
      .update({ report_data:updatedReportData, updated_at:new Date().toISOString() })
      .eq('id', reportId)
      .eq('status', 'open')
      .select('id,status')
      .single();
    if(error) throw error;
    if(!data) throw new Error('Report update was not confirmed. The original embedded photos have not been intentionally removed.');
    return { success:true, migrated:done, uploadedPaths, data };
  }catch(error){
    // Do not delete uploaded objects here. If an update request timed out after the
    // database committed, automatic cleanup could break photo references in the report.
    // Unreferenced uploads are safer than deleting a potentially referenced image.
    console.error('migrateEmbeddedPhotosToStorage:', error, { uploadedPaths });
    return { success:false, migrated:0, uploadedPaths, error };
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
   DELETE REPORT
========================================================= */

export async function deleteReport(
  reportId
){

  try{

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .delete()
        .eq(
          'id',
          reportId
        );


    if(
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      error:null

    };

  }catch(error){

    return {

      success:false,

      error

    };

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
