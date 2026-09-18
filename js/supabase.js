/*
  supabase.js

  Handles all communication between the Ship Visit Report
  application and Supabase.

  This module is responsible for:

  - Creating a new Open Report
  - Saving an Open Report
  - Submitting a Report
  - Loading Open Reports
  - Loading Submitted Reports
  - Loading one specific report
  - Updating Ship Responses
  - Deleting Open Reports

  IMPORTANT:
  This browser version uses the Supabase publishable key.
  Never put a Supabase secret/service-role key in this file.
*/


/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

import {
  createClient
} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';


/*
  Your Supabase project.
*/

export const SUPABASE_URL =
  'https://jpvtqvzsyqqawfenseua.supabase.co';


/*
  Your Supabase publishable browser key.
*/

export const SUPABASE_KEY =
  'sb_publishable_2U4FJYEvgBYwfkUfJ768Qw_XtyshTJz';


/* =========================================================
   CREATE CLIENT
========================================================= */

export const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   CONNECTION TEST
========================================================= */

export async function testConnection() {

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


    if (result.error) {

      console.error(
        'Supabase connection test failed:',
        result.error
      );


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

  } catch (error) {

    console.error(
      'Supabase connection test failed:',
      error
    );


    return {

      success:false,

      error

    };

  }

}


/* =========================================================
   BUILD DATABASE PAYLOAD
========================================================= */

function buildPayload({
  meta,
  state,
  status,
  submittedAt = null
}) {

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

    status:
      status || 'open',

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
  ) {

    payload.submitted_at =
      submittedAt;

  }


  return payload;

}


/* =========================================================
   CREATE NEW OPEN REPORT
========================================================= */

export async function createOpenReport({
  meta,
  state
}) {

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
    ) {

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  } catch (error) {

    console.error(
      'Create open report failed:',
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
   UPDATE EXISTING OPEN REPORT
========================================================= */

export async function updateOpenReport({
  reportId,
  meta,
  state
}) {

  try {

    if (
      !reportId
    ) {

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
    ) {

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  } catch (error) {

    console.error(
      'Update open report failed:',
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
}) {

  if (
    reportId
  ) {

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
}) {

  try {

    if (
      !reportId
    ) {

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
    ) {

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  } catch (error) {

    console.error(
      'Submit report failed:',
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
   LOAD OPEN REPORTS
========================================================= */

export async function getOpenReports() {

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
    ) {

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data || [],

      error:null

    };

  } catch (error) {

    console.error(
      'Load open reports failed:',
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
   LOAD SUBMITTED REPORTS
========================================================= */

export async function getSubmittedReports() {

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
    ) {

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data || [],

      error:null

    };

  } catch (error) {

    console.error(
      'Load submitted reports failed:',
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
   LOAD ONE REPORT
========================================================= */

export async function getReport(
  reportId
) {

  try {

    if (
      !reportId
    ) {

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
    ) {

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      error:null

    };

  } catch (error) {

    console.error(
      'Load report failed:',
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
) {

  try {

    if (
      !reportId
    ) {

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
    ) {

      throw result.error;

    }


    return {

      success:true,

      error:null

    };

  } catch (error) {

    console.error(
      'Delete open report failed:',
      error
    );


    return {

      success:false,

      error

    };

  }

}


/* =========================================================
   UPDATE SHIP RESPONSE
========================================================= */

export async function saveShipResponse({
  reportId,
  state
}) {

  try {

    if (
      !reportId
    ) {

      throw new Error(
        'Report ID is required.'
      );

    }


    /*
      First load the latest database version.

      This helps avoid overwriting metadata
      with stale browser data.
    */

    const current =
      await getReport(
        reportId
      );


    if (
      !current.success ||
      !current.data
    ) {

      throw (
        current.error ||
        new Error(
          'Report could not be loaded.'
        )
      );

    }


    const report =
      current.data;


    const existingData =
      report.report_data || {};


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
    ) {

      throw result.error;

    }


    return {

      success:true,

      data:
        result.data,

      complete,

      error:null

    };

  } catch (error) {

    console.error(
      'Save ship response failed:',
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
   FOLLOW-UP CHECK
========================================================= */

export function areFollowUpsComplete(
  state
) {

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
    No follow-ups means
    nothing is waiting for the ship.
  */

  if (
    followUps.length === 0
  ) {

    return true;

  }


  /*
    A follow-up is complete when
    at least one ship comment exists.
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
   COUNT FOLLOW-UPS
========================================================= */

export function countFollowUps(
  state
) {

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
   COUNT COMPLETED FOLLOW-UPS
========================================================= */

export function countCompletedFollowUps(
  state
) {

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
   GET REPORT STATUS COLOR
========================================================= */

export function getReportColor(
  report
) {

  if (
    !report
  ) {

    return 'blue';

  }


  /*
    Open report:
    RED
  */

  if (
    report.status ===
    'open'
  ) {

    return 'red';

  }


  const state =
    report.report_data?.state ||
    {};


  /*
    Submitted report with
    completed follow-ups:
    GREEN
  */

  if (
    areFollowUpsComplete(
      state
    )
  ) {

    return 'green';

  }


  /*
    Submitted report waiting
    for ship follow-up:
    BLUE
  */

  return 'blue';

}


/* =========================================================
   GET STATUS TEXT
========================================================= */

export function getReportStatusText(
  report
) {

  const color =
    getReportColor(
      report
    );


  if (
    color ===
    'red'
  ) {

    return 'OPEN / ONGOING';

  }


  if (
    color ===
    'green'
  ) {

    return 'SHIP RESPONSE COMPLETE';

  }


  return 'JUST SUBMITTED';

}


/* =========================================================
   REPORT WITH FOLLOW-UP ONLY
========================================================= */

export function reportNeedsFollowUp(
  report
) {

  if (
    !report
  ) {

    return false;

  }


  if (
    report.status !==
    'submitted'
  ) {

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
        item.shipComments.length
      )
  );

}


/* =========================================================
   GET REPORT FOLLOW-UP POINTS
========================================================= */

export function getFollowUpPoints(
  report
) {

  const state =
    report?.report_data?.state ||
    {};


  return Object.entries(
    state
  )
  .filter(
    ([key,item]) =>
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
   REFRESH UPDATED_AT
========================================================= */

export async function touchReport(
  reportId
) {

  try {

    const result =
      await supabase
        .from(
          'ship_visit_reports'
        )
        .update({

          updated_at:
            new Date().toISOString()

        })
        .eq(
          'id',
          reportId
        );


    if (
      result.error
    ) {

      throw result.error;

    }


    return {

      success:true,

      error:null

    };

  } catch (error) {

    console.error(
      'Touch report failed:',
      error
    );


    return {

      success:false,

      error

    };

  }

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  supabase,

  createOpenReport,

  updateOpenReport,

  saveOpenReport,

  submitReport,

  getOpenReports,

  getSubmittedReports,

  getReport,

  deleteOpenReport,

  saveShipResponse,

  testConnection,

  getReportColor,

  getReportStatusText,

  reportNeedsFollowUp,

  getFollowUpPoints,

  countFollowUps,

  countCompletedFollowUps,

  areFollowUpsComplete

};
