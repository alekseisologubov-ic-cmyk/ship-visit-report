/*
  ============================================================
  SHIP VISIT REPORT
  supabase.js
  ============================================================

  Supabase database module.

  IMPORTANT:
  Supabase is loaded globally by index.html.

  We intentionally do NOT use:

  import { createClient }
  from 'https://cdn.jsdelivr.net/...'

  This keeps the application module loading reliable.
*/


/* =========================================================
   CONFIGURATION
========================================================= */

export const SUPABASE_URL =
  'https://jpvtqvzsyqqawfenseua.supabase.co';


export const SUPABASE_KEY =
  'sb_publishable_2U4FJYEvgBYwfkUfJ768Qw_XtyshTJz';


/* =========================================================
   CHECK LIBRARY
========================================================= */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== 'function'
) {

  throw new Error(
    'Supabase library did not load. Check index.html.'
  );

}


/* =========================================================
   CLIENT
========================================================= */

export const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   CONNECTION TEST
========================================================= */

export async function testConnection(){

  try {

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .select(
          'id',
          {
            count:'exact',
            head:true
          }
        );


    if (
      result.error
    ) {

      return {

        success:false,

        error:
          result.error

      };

    }


    return {

      success:true,

      error:null

    };

  } catch(error) {

    return {

      success:false,

      error

    };

  }

}


/* =========================================================
   BUILD PAYLOAD
========================================================= */

function buildPayload({
  meta,
  state,
  status = 'open',
  submittedAt = null
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


  if (
    submittedAt
  ){

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

    const payload =
      buildPayload({

        meta,

        state,

        status:
          'open'

      });


    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .insert(
          payload
        )
        .select()
        .single();


    if (
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

  } catch(error) {

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

  try {

    if (
      !reportId
    ){

      throw new Error(
        'Report ID is required.'
      );

    }


    const payload =
      buildPayload({

        meta,

        state,

        status:
          'open'

      });


    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .update(
          payload
        )
        .eq(
          'id',
          reportId
        )
        .select()
        .single();


    if (
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

  } catch(error) {

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

  if (
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
   SUBMIT REPORT
========================================================= */

export async function submitReport({
  reportId,
  meta,
  state
}){

  try {

    if (
      !reportId
    ){

      throw new Error(
        'Report ID is required.'
      );

    }


    const submittedAt =
      new Date().toISOString();


    const payload =
      buildPayload({

        meta,

        state,

        status:
          'submitted',

        submittedAt

      });


    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .update(
          payload
        )
        .eq(
          'id',
          reportId
        )
        .select()
        .single();


    if (
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

  } catch(error) {

    console.error(
      'submitReport:',
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


    if (
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data || [],

      error:null

    };

  } catch(error) {

    console.error(
      'getOpenReports:',
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
        .from(
          'ship_visit_reports'
        )
        .select('*')
        .eq(
          'status',
          'submitted'
        )
        .order(
          'submitted_at',
          {
            ascending:false,
            nullsFirst:false
          }
        );


    if (
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data || [],

      error:null

    };

  } catch(error) {

    console.error(
      'getSubmittedReports:',
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

    if (
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
        .select('*')
        .eq(
          'id',
          reportId
        )
        .single();


    if (
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

  } catch(error) {

    console.error(
      'getReport:',
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
   DELETE OPEN REPORT
========================================================= */

export async function deleteOpenReport(
  reportId
){

  try {

    if (
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
        .delete()
        .eq(
          'id',
          reportId
        )
        .eq(
          'status',
          'open'
        );


    if (
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      error:null

    };

  } catch(error) {

    console.error(
      'deleteOpenReport:',
      error
    );


    return {

      success:false,

      error

    };

  }

}


/* =========================================================
   SAVE SHIP RESPONSE
========================================================= */

export async function saveShipResponse({
  reportId,
  state
}){

  try {

    if (
      !reportId
    ){

      throw new Error(
        'Report ID is required.'
      );

    }


    /*
      Get latest database record.
    */

    const current =
      await getReport(
        reportId
      );


    if (
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
            state || {}
          )
        ),

      shipResponseUpdatedAt:
        new Date().toISOString()

    };


    const complete =
      areFollowUpsComplete(
        state
      );


    updatedData.shipResponseStatus =
      complete
        ? 'complete'
        : 'open';


    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .update({

          report_data:
            updatedData,

          updated_at:
            new Date().toISOString()

        })
        .eq(
          'id',
          reportId
        )
        .eq(
          'status',
          'submitted'
        )
        .select()
        .single();


    if (
      result.error
    ){

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      complete,

      error:null

    };

  } catch(error) {

    console.error(
      'saveShipResponse:',
      error
    );


    return {

      success:false,

      data:null,

      complete:false,

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

  const items =
    Object.values(
      state || {}
    );


  const followUps =
    items.filter(
      item =>
        item &&
        item.followUpNeeded
    );


  /*
    No follow-ups:
    nothing waiting for ship.
  */

  if (
    followUps.length === 0
  ){

    return true;

  }


  /*
    At least one ship comment
    completes a follow-up.
  */

  return followUps.every(
    item =>
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length > 0
  );

}


/* =========================================================
   FOLLOW-UP COUNT
========================================================= */

export function countFollowUps(
  state
){

  return Object.values(
    state || {}
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
    state || {}
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
   REPORT COLOR
========================================================= */

export function getReportColor(
  report
){

  if (
    !report
  ){

    return 'blue';

  }


  /*
    OPEN
    RED
  */

  if (
    report.status ===
    'open'
  ){

    return 'red';

  }


  const state =
    report.report_data?.state ||
    {};


  /*
    COMPLETED
    GREEN
  */

  if (
    areFollowUpsComplete(
      state
    )
  ){

    return 'green';

  }


  /*
    SUBMITTED / WAITING
    BLUE
  */

  return 'blue';

}


/* =========================================================
   STATUS TEXT
========================================================= */

export function getReportStatusText(
  report
){

  const color =
    getReportColor(
      report
    );


  if (
    color ===
    'red'
  ){

    return 'OPEN / ONGOING';

  }


  if (
    color ===
    'green'
  ){

    return 'SHIP RESPONSE COMPLETE';

  }


  return 'JUST SUBMITTED';

}


/* =========================================================
   REPORT NEEDS FOLLOW-UP
========================================================= */

export function reportNeedsFollowUp(
  report
){

  if (
    !report ||
    report.status !== 'submitted'
  ){

    return false;

  }


  const state =
    report.report_data?.state ||
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
   GET FOLLOW-UP POINTS
========================================================= */

export function getFollowUpPoints(
  report
){

  const state =
    report?.report_data?.state ||
    {};


  return Object.entries(
    state
  )
  .filter(
    ([,item]) =>
      item &&
      item.followUpNeeded
  )
  .map(
    ([key,item]) => ({

      key,

      ...item

    })
  );

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

  submitReport,

  getOpenReports,

  getSubmittedReports,

  getReport,

  deleteOpenReport,

  saveShipResponse,

  areFollowUpsComplete,

  countFollowUps,

  countCompletedFollowUps,

  getReportColor,

  getReportStatusText,

  reportNeedsFollowUp,

  getFollowUpPoints

};
