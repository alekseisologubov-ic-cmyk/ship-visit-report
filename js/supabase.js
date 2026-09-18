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
        .select('*')
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
        .select('*')
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
        .select('*')
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


    const existingData =
      current.data.report_data ||
      {};


    const updatedData = {

      ...existingData,

      state:
        JSON.parse(
          JSON.stringify(
            state ||
            {}
          )
        ),

      shipResponseStatus:
        'submitted',

      shipResponseUpdatedAt:
        new Date().toISOString()

    };


    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
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
        .eq(
          'id',
          reportId
        )
        .eq(
          'status',
          'ship_review'
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
      'submitShipResponse:',
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

  deleteReport,

  getReportColor,

  getReportStatusText,

  countFollowUps,

  countCompletedFollowUps,

  reportNeedsFollowUp

};
