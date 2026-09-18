/*
  ============================================================
  SHIP VISIT REPORT
  supabase.js
  ============================================================
*/

export const SUPABASE_URL =
  'https://jpvtqvzsyqqawfenseua.supabase.co';


export const SUPABASE_KEY =
  'sb_publishable_2U4FJYEvgBYwfkUfJ768Qw_XtyshTJz';


/* =========================================================
   SUPABASE CLIENT
========================================================= */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== 'function'
) {

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
   CONNECTION
========================================================= */

export async function testConnection(){

  try {

    const result =
      await supabase
        .from('ship_visit_reports')
        .select(
          'id',
          {
            count:'exact',
            head:true
          }
        );


    if(result.error){

      return {
        success:false,
        error:result.error
      };

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
   PAYLOAD
========================================================= */

function buildPayload({
  meta,
  state,
  status='open',
  submittedAt=null
}){

  const now =
    new Date().toISOString();


  const payload = {

    ship:
      meta?.ship || '',

    date_on:
      meta?.dateOn || null,

    date_off:
      meta?.dateOff || null,

    reviewer:
      meta?.reviewer || '',

    status,

    report_data:{

      meta:{

        ship:
          meta?.ship || '',

        dateOn:
          meta?.dateOn || '',

        dateOff:
          meta?.dateOff || '',

        reviewer:
          meta?.reviewer || ''

      },

      state:
        JSON.parse(
          JSON.stringify(
            state || {}
          )
        )

    },

    updated_at:
      now

  };


  if(submittedAt){

    payload.submitted_at =
      submittedAt;

  }


  return payload;

}


/* =========================================================
   CREATE OPEN REPORT
========================================================= */

export async function createOpenReport({
  meta,
  state
}){

  try {

    const result =
      await supabase
        .from('ship_visit_reports')
        .insert(
          buildPayload({
            meta,
            state,
            status:'open'
          })
        )
        .select()
        .single();


    if(result.error){

      throw result.error;

    }


    return {
      success:true,
      data:result.data,
      error:null
    };

  }catch(error){

    console.error(
      'createOpenReport',
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

  try {

    const result =
      await supabase
        .from('ship_visit_reports')
        .update(
          buildPayload({
            meta,
            state,
            status:'open'
          })
        )
        .eq('id',reportId)
        .eq('status','open')
        .select()
        .single();


    if(result.error){

      throw result.error;

    }


    return {
      success:true,
      data:result.data,
      error:null
    };

  }catch(error){

    console.error(
      'updateOpenReport',
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

  if(reportId){

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

  try {

    if(!reportId){

      throw new Error(
        'Report ID is required.'
      );

    }


    const result =
      await supabase
        .from('ship_visit_reports')
        .update(
          buildPayload({
            meta,
            state,
            status:'ship_review'
          })
        )
        .eq('id',reportId)
        .eq('status','open')
        .select()
        .single();


    if(result.error){

      throw result.error;

    }


    return {
      success:true,
      data:result.data,
      error:null
    };

  }catch(error){

    console.error(
      'sendToShipReview',
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
   GET OPEN REPORTS
========================================================= */

export async function getOpenReports(){

  try {

    const result =
      await supabase
        .from('ship_visit_reports')
        .select('*')
        .eq('status','open')
        .order(
          'updated_at',
          {
            ascending:false
          }
        );


    if(result.error){

      throw result.error;

    }


    return {
      success:true,
      data:result.data || [],
      error:null
    };

  }catch(error){

    console.error(
      'getOpenReports',
      error
    );


    return {
      success:false,
      data:[],
      error
    };

  }

}


/* =========================================================
   GET REPORTS WAITING FOR SHIP
========================================================= */

export async function getShipReviewReports(){

  try {

    const result =
      await supabase
        .from('ship_visit_reports')
        .select('*')
        .eq('status','ship_review')
        .order(
          'updated_at',
          {
            ascending:false
          }
        );


    if(result.error){

      throw result.error;

    }


    return {
      success:true,
      data:result.data || [],
      error:null
    };

  }catch(error){

    console.error(
      'getShipReviewReports',
      error
    );


    return {
      success:false,
      data:[],
      error
    };

  }

}


/* =========================================================
   GET SUBMITTED REPORTS
========================================================= */

export async function getSubmittedReports(){

  try {

    const result =
      await supabase
        .from('ship_visit_reports')
        .select('*')
        .eq('status','submitted')
        .order(
          'submitted_at',
          {
            ascending:false,
            nullsFirst:false
          }
        );


    if(result.error){

      throw result.error;

    }


    return {
      success:true,
      data:result.data || [],
      error:null
    };

  }catch(error){

    console.error(
      'getSubmittedReports',
      error
    );


    return {
      success:false,
      data:[],
      error
    };

  }

}


/* =========================================================
   GET SINGLE REPORT
========================================================= */

export async function getReport(
  reportId
){

  try {

    if(!reportId){

      throw new Error(
        'Report ID is required.'
      );

    }


    const result =
      await supabase
        .from('ship_visit_reports')
        .select('*')
        .eq('id',reportId)
        .single();


    if(result.error){

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
   SHIP SUBMITS RESPONSE
========================================================= */

export async function submitShipResponse({
  reportId,
  state
}){

  try {

    if(!reportId){

      throw new Error(
        'Report ID is required.'
      );

    }


    const current =
      await getReport(
        reportId
      );


    if(
      !current.success ||
      !current.data
    ){

      throw (
        current.error ||
        new Error(
          'Report could not be loaded.'
        )
      );

    }


    const existing =
      current.data.report_data || {};


    const updatedData = {

      ...existing,

      state:
        JSON.parse(
          JSON.stringify(
            state || {}
          )
        ),

      shipResponseUpdatedAt:
        new Date().toISOString(),

      shipResponseStatus:
        'submitted'

    };


    const result =
      await supabase
        .from('ship_visit_reports')
        .update({

          report_data:
            updatedData,

          status:
            'submitted',

          submitted_at:
            new Date().toISOString(),

          updated_at:
            new Date().toISOString()

        })
        .eq('id',reportId)
        .eq('status','ship_review')
        .select()
        .single();


    if(result.error){

      throw result.error;

    }


    return {
      success:true,
      data:result.data,
      error:null
    };

  }catch(error){

    console.error(
      'submitShipResponse',
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
   DELETE
========================================================= */

export async function deleteReport(
  reportId
){

  try {

    const result =
      await supabase
        .from('ship_visit_reports')
        .delete()
        .eq('id',reportId);


    if(result.error){

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
   FOLLOW-UP COMPLETE
========================================================= */

export function areFollowUpsComplete(
  state
){

  const followUps =
    Object.values(
      state || {}
    ).filter(
      item =>
        item &&
        item.followUpNeeded
    );


  if(
    followUps.length === 0
  ){

    return true;

  }


  return followUps.every(
    item =>
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length > 0
  );

}


/* =========================================================
   COUNTS
========================================================= */

export function countFollowUps(
  state
){

  return Object.values(
    state || {}
  ).filter(
    item =>
      item &&
      item.followUpNeeded
  ).length;

}


export function countCompletedFollowUps(
  state
){

  return Object.values(
    state || {}
  ).filter(
    item =>
      item &&
      item.followUpNeeded &&
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length > 0
  ).length;

}


/* =========================================================
   STATUS COLOR
========================================================= */

export function getReportColor(
  report
){

  if(!report){

    return 'blue';

  }


  if(
    report.status === 'open'
  ){

    return 'red';

  }


  if(
    report.status === 'ship_review'
  ){

    return 'blue';

  }


  if(
    report.status === 'submitted'
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
   DEFAULT EXPORT
========================================================= */

export default {

  supabase,

  testConnection,

  createOpenReport,

  updateOpenReport,

  saveOpenReport,

  sendToShipReview,

  getOpenReports,

  getShipReviewReports,

  getSubmittedReports,

  getReport,

  submitShipResponse,

  deleteReport,

  areFollowUpsComplete,

  countFollowUps,

  countCompletedFollowUps,

  getReportColor,

  getReportStatusText

};
