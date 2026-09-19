/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  pdf.js
  ============================================================

  FINAL REPORT FORMAT

  1. Ship Visit Report
  2. Ship
  3. Visit Dates
  4. Reviewer
  5. Report Summary
  6. Checked checklist points only
  7. Reviewer comments
  8. Reviewer photos
  9. Follow-up status
  10. Ship comments / responses

  Functions used by main.js:

    generatePDF()
    generateFollowUpPDF()
    printReport()
*/


import {
  SECTIONS
} from './data.js';


import {
  getMeta,
  getState,
  getReviewer
} from './state.js';


/* ============================================================
   BASIC HELPERS
============================================================ */


/**
 * Convert anything to safe text.
 */
function safeText(value){

  if(
    value === null ||
    value === undefined
  ){

    return '';

  }

  return String(value);

}


/**
 * Escape HTML for print output.
 */
function escapeHtml(value){

  return safeText(value).replace(
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


/**
 * Get jsPDF constructor.
 */
function getJsPDF(){

  if(
    window.jspdf &&
    typeof window.jspdf.jsPDF === 'function'
  ){

    return window.jspdf.jsPDF;

  }

  return null;

}


/* ============================================================
   COMMENT NORMALIZATION
============================================================ */


/**
 * Get reviewer comments from the current
 * report data structure.
 */
function getReviewerComments(item){

  if(
    !item
  ){

    return [];

  }


  /*
    Current format:

    comments: [
      {
        name: "...",
        text: "...",
        timestamp: "..."
      }
    ]
  */

  if(
    Array.isArray(item.comments)
  ){

    return item.comments
      .filter(
        comment => {

          if(
            !comment
          ){

            return false;

          }


          const text =
            comment.text ??
            comment.comment ??
            comment.message ??
            '';


          return Boolean(
            safeText(text).trim()
          );

        }
      )
      .map(
        comment => {

          return {

            name:
              comment.name ||
              comment.reviewer ||
              'Reviewer',

            text:
              safeText(
                comment.text ??
                comment.comment ??
                comment.message ??
                ''
              ).trim()

          };

        }
      );

  }


  /*
    Legacy single comment.
  */

  if(
    typeof item.comment === 'string' &&
    item.comment.trim()
  ){

    return [

      {

        name:
          item.reviewer ||
          'Reviewer',

        text:
          item.comment.trim()

      }

    ];

  }


  /*
    Legacy reviewerComment.
  */

  if(
    typeof item.reviewerComment === 'string' &&
    item.reviewerComment.trim()
  ){

    return [

      {

        name:
          item.reviewer ||
          'Reviewer',

        text:
          item.reviewerComment.trim()

      }

    ];

  }


  /*
    Legacy reviewerComments array.
  */

  if(
    Array.isArray(item.reviewerComments)
  ){

    return item.reviewerComments
      .map(
        comment => {

          if(
            typeof comment === 'string'
          ){

            return {

              name:'Reviewer',

              text:
                comment.trim()

            };

          }


          return {

            name:
              comment?.name ||
              comment?.reviewer ||
              'Reviewer',

            text:
              safeText(
                comment?.text ??
                comment?.comment ??
                ''
              ).trim()

          };

        }
      )
      .filter(
        comment =>
          comment.text
      );

  }


  return [];

}


/* ============================================================
   PHOTO NORMALIZATION
============================================================ */

function getPhotos(item){

  if(
    !item
  ){

    return [];

  }


  if(
    Array.isArray(item.photos)
  ){

    return item.photos.filter(
      photo =>
        Boolean(photo)
    );

  }


  if(
    typeof item.photo === 'string' &&
    item.photo.trim()
  ){

    return [
      item.photo.trim()
    ];

  }


  return [];

}


/* ============================================================
   SHIP COMMENTS
============================================================ */

function getShipComments(item){

  if(
    !item
  ){

    return [];

  }


  if(
    Array.isArray(item.shipComments)
  ){

    return item.shipComments.filter(
      comment =>
        comment &&
        safeText(
          comment.text
        ).trim()
    );

  }


  return [];

}


/* ============================================================
   COLLECT CHECKED POINTS
============================================================ */

function getCheckedPoints(state){

  const points = [];


  SECTIONS.forEach(
    section => {

      if(
        !section ||
        !Array.isArray(section.items)
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


          /*
            Only checked items belong in
            the final report.
          */

          if(
            !item ||
            !item.checked
          ){

            return;

          }


          points.push({

            key,

            section:
              section.title,

            text:
              safeText(text),

            checked:true,

            followUpNeeded:
              Boolean(
                item.followUpNeeded
              ),

            comments:
              getReviewerComments(
                item
              ),

            photos:
              getPhotos(
                item
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
   COUNTS
============================================================ */

function getTotalChecklistPoints(){

  let total = 0;


  SECTIONS.forEach(
    section => {

      if(
        section &&
        Array.isArray(section.items)
      ){

        total +=
          section.items.length;

      }

    }
  );


  return total;

}


function getReportCounts(
  points
){

  let comments = 0;

  let photos = 0;

  let followUps = 0;

  let completedFollowUps = 0;


  points.forEach(
    point => {

      comments +=
        point.comments.length;

      photos +=
        point.photos.length;


      if(
        point.followUpNeeded
      ){

        followUps++;


        if(
          point.shipComments.length > 0
        ){

          completedFollowUps++;

          comments +=
            point.shipComments.length;

        }

      }

    }
  );


  return {

    total:
      getTotalChecklistPoints(),

    checked:
      points.length,

    comments,

    photos,

    followUps,

    completedFollowUps

  };

}


/* ============================================================
   SAFE FILE NAME
============================================================ */

function makeFileName(
  ship,
  date
){

  const safeShip =
    safeText(
      ship || 'Ship'
    )
      .trim()
      .replace(
        /\s+/g,
        '_'
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        ''
      );


  const safeDate =
    safeText(
      date || 'date'
    )
      .trim()
      .replace(
        /[^0-9-]/g,
        ''
      );


  return {

    report:
      `Ship_Visit_Report_${safeShip}_${safeDate}.pdf`,

    followup:
      `Ship_Visit_Follow_Up_${safeShip}_${safeDate}.pdf`

  };

}


/* ============================================================
   PDF IMAGE
============================================================ */

function addImageToPDF(
  doc,
  source,
  x,
  y,
  maxWidth,
  maxHeight
){

  if(
    !source
  ){

    return {

      width:0,

      height:0

    };

  }


  try{

    const properties =
      doc.getImageProperties(
        source
      );


    let width =
      maxWidth;


    let height =
      maxHeight;


    if(
      properties &&
      properties.width &&
      properties.height
    ){

      const ratio =
        properties.width /
        properties.height;


      width =
        maxWidth;


      height =
        width /
        ratio;


      if(
        height > maxHeight
      ){

        height =
          maxHeight;


        width =
          height *
          ratio;

      }

    }


    /*
      Use JPEG first.
    */

    try{

      doc.addImage(
        source,
        'JPEG',
        x,
        y,
        width,
        height
      );


      return {

        width,

        height

      };

    }catch(jpegError){

      /*
        Try PNG if JPEG fails.
      */

      doc.addImage(
        source,
        'PNG',
        x,
        y,
        width,
        height
      );


      return {

        width,

        height

      };

    }

  }catch(error){

    console.warn(
      'Could not add image to PDF:',
      error
    );


    return {

      width:0,

      height:0

    };

  }

}


/* ============================================================
   GENERATE PDF
============================================================ */

export function generatePDF(){

  const jsPDF =
    getJsPDF();


  if(
    !jsPDF
  ){

    alert(
      'PDF library is not available.'
    );


    return false;

  }


  const meta =
    getMeta() || {};


  const state =
    getState() || {};


  const reviewer =
    getReviewer() ||
    meta.reviewer ||
    'Reviewer';


  const points =
    getCheckedPoints(
      state
    );


  const counts =
    getReportCounts(
      points
    );


  const doc =
    new jsPDF({

      unit:'pt',

      format:'a4',

      compress:true

    });


  const pageWidth =
    doc.internal.pageSize.getWidth();


  const pageHeight =
    doc.internal.pageSize.getHeight();


  const margin =
    40;


  const contentWidth =
    pageWidth -
    margin * 2;


  const squid =
    [60,16,83];


  const red =
    [225,10,10];


  const green =
    [0,138,82];


  const blue =
    [36,99,184];


  const dark =
    [27,27,27];


  const gray =
    [95,95,95];


  const light =
    [248,246,249];


  let y = 0;


  /* ==========================================================
     HEADER
  ========================================================== */

  function drawHeader(){

    doc.setFillColor(
      squid[0],
      squid[1],
      squid[2]
    );


    doc.rect(
      0,
      0,
      pageWidth,
      88,
      'F'
    );


    /*
      Diagonal decorative lines.
    */

    doc.setDrawColor(
      92,
      44,
      115
    );


    doc.setLineWidth(
      1
    );


    for(
      let x = -120;
      x < pageWidth + 120;
      x += 38
    ){

      doc.line(
        x,
        0,
        x + 88,
        88
      );

    }


    doc.setTextColor(
      255,
      255,
      255
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      10
    );


    doc.text(
      '— VIRGIN VOYAGES',
      margin,
      25
    );


    doc.setFontSize(
      20
    );


    doc.text(
      'Ship Visit Report',
      margin,
      53
    );


    y =
      108;

  }


  /* ==========================================================
     FOOTER
  ========================================================== */

  function drawFooter(){

    doc.setFillColor(
      dark[0],
      dark[1],
      dark[2]
    );


    doc.rect(
      0,
      pageHeight - 24,
      pageWidth,
      24,
      'F'
    );


    doc.setTextColor(
      255,
      255,
      255
    );


    doc.setFont(
      'helvetica',
      'normal'
    );


    doc.setFontSize(
      7
    );


    doc.text(
      'Virgin Voyages — Ship Visit Report',
      margin,
      pageHeight - 9
    );


    doc.text(
      safeText(
        meta.ship || ''
      ),
      pageWidth - margin,
      pageHeight - 9,
      {
        align:'right'
      }
    );

  }


  /* ==========================================================
     NEW PAGE
  ========================================================== */

  function newPage(){

    drawFooter();


    doc.addPage();


    drawHeader();

  }


  /* ==========================================================
     CHECK SPACE
  ========================================================== */

  function ensureSpace(
    height
  ){

    if(
      y + height >
      pageHeight - 38
    ){

      newPage();

    }

  }


  /* ==========================================================
     TEXT
  ========================================================== */

  function addText(
    value,
    options = {}
  ){

    const size =
      options.size ??
      9;


    const color =
      options.color ??
      gray;


    const bold =
      Boolean(
        options.bold
      );


    const x =
      options.x ??
      margin;


    const width =
      options.width ??
      contentWidth;


    const lineHeight =
      options.lineHeight ??
      13;


    const lines =
      doc.splitTextToSize(
        safeText(
          value
        ),
        width
      );


    doc.setFont(
      'helvetica',
      bold
        ? 'bold'
        : 'normal'
    );


    doc.setFontSize(
      size
    );


    doc.setTextColor(
      color[0],
      color[1],
      color[2]
    );


    lines.forEach(
      line => {

        ensureSpace(
          lineHeight
        );


        doc.text(
          line,
          x,
          y
        );


        y +=
          lineHeight;

      }
    );

  }


  /* ==========================================================
     INFORMATION BOX
  ========================================================== */

  function addInfoBox(
    label,
    value
  ){

    ensureSpace(
      38
    );


    doc.setFillColor(
      light[0],
      light[1],
      light[2]
    );


    doc.roundedRect(
      margin,
      y - 13,
      contentWidth,
      31,
      5,
      5,
      'F'
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      7
    );


    doc.setTextColor(
      squid[0],
      squid[1],
      squid[2]
    );


    doc.text(
      safeText(
        label
      ).toUpperCase(),
      margin + 9,
      y
    );


    doc.setFont(
      'helvetica',
      'normal'
    );


    doc.setFontSize(
      9
    );


    doc.setTextColor(
      dark[0],
      dark[1],
      dark[2]
    );


    doc.text(
      safeText(
        value
      ),
      margin + 95,
      y
    );


    y +=
      36;

  }


  /* ==========================================================
     SECTION TITLE
  ========================================================== */

  function addSectionTitle(
    title
  ){

    ensureSpace(
      35
    );


    doc.setDrawColor(
      red[0],
      red[1],
      red[2]
    );


    doc.setLineWidth(
      1.3
    );


    doc.line(
      margin,
      y,
      margin + 50,
      y
    );


    y +=
      15;


    addText(
      title,
      {
        size:12,
        color:squid,
        bold:true,
        width:contentWidth
      }
    );


    y +=
      4;

  }


  /* ==========================================================
     CHECKED POINT
  ========================================================== */

  function addPoint(
    point
  ){

    ensureSpace(
      65
    );


    /*
      Checked circle.
    */

    doc.setFillColor(
      red[0],
      red[1],
      red[2]
    );


    doc.circle(
      margin + 9,
      y - 3,
      8,
      'F'
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      8
    );


    doc.setTextColor(
      255,
      255,
      255
    );


    doc.text(
      '✓',
      margin + 6.2,
      y
    );


    /*
      Point text.
    */

    addText(
      point.text,
      {
        size:9.5,
        color:dark,
        bold:true,
        x:margin + 24,
        width:contentWidth - 24,
        lineHeight:13
      }
    );


    /*
      Status.
    */

    let status =
      'CHECKED';


    let statusColor =
      blue;


    if(
      point.followUpNeeded
    ){

      if(
        point.shipComments.length > 0
      ){

        status =
          'SHIP FOLLOW-UP COMPLETED';


        statusColor =
          green;

      }else{

        status =
          'FOLLOW-UP NEEDED FROM SHIP';


        statusColor =
          blue;

      }

    }


    y +=
      2;


    addText(
      status,
      {
        size:7.5,
        color:statusColor,
        bold:true,
        x:margin + 24,
        width:contentWidth - 24,
        lineHeight:11
      }
    );


    /*
      Reviewer comments.
    */

    if(
      point.comments.length > 0
    ){

      y +=
        3;


      addText(
        'REVIEWER COMMENTS',
        {
          size:7.5,
          color:squid,
          bold:true,
          x:margin + 24,
          width:contentWidth - 24,
          lineHeight:10
        }
      );


      point.comments.forEach(
        comment => {

          addText(
            `${comment.name || 'Reviewer'}: ${comment.text || ''}`,
            {
              size:8.5,
              color:gray,
              x:margin + 31,
              width:contentWidth - 31,
              lineHeight:11
            }
          );

        }
      );

    }


    /*
      Reviewer photos.
    */

    if(
      point.photos.length > 0
    ){

      y +=
        4;


      addText(
        'ATTACHED PHOTOS',
        {
          size:7.5,
          color:squid,
          bold:true,
          x:margin + 24,
          width:contentWidth - 24,
          lineHeight:10
        }
      );


      point.photos.forEach(
        photo => {

          ensureSpace(
            160
          );


          const image =
            addImageToPDF(
              doc,
              photo,
              margin + 31,
              y,
              145,
              145
            );


          if(
            image.height > 0
          ){

            y +=
              image.height +
              8;

          }

        }
      );

    }


    /*
      Ship responses.
    */

    if(
      point.followUpNeeded
    ){

      y +=
        3;


      if(
        point.shipComments.length > 0
      ){

        addText(
          'SHIP COMMENTS / RESPONSES',
          {
            size:7.5,
            color:green,
            bold:true,
            x:margin + 24,
            width:contentWidth - 24,
            lineHeight:10
          }
        );


        point.shipComments.forEach(
          comment => {

            addText(
              `${comment.name || 'Ship'}: ${comment.text || ''}`,
              {
                size:8.5,
                color:green,
                x:margin + 31,
                width:contentWidth - 31,
                lineHeight:11
              }
            );

          }
        );

      }else{

        addText(
          'NO SHIP RESPONSE YET',
          {
            size:7.8,
            color:red,
            bold:true,
            x:margin + 24,
            width:contentWidth - 24,
            lineHeight:10
          }
        );

      }

    }


    /*
      Point separator.
    */

    y +=
      6;


    doc.setDrawColor(
      225,
      220,
      228
    );


    doc.setLineWidth(
      0.5
    );


    doc.line(
      margin + 24,
      y,
      margin + contentWidth,
      y
    );


    y +=
      10;

  }


  /* ==========================================================
     START
  ========================================================== */

  drawHeader();


  /* ==========================================================
     REPORT INFORMATION
  ========================================================== */

  addText(
    'REPORT INFORMATION',
    {
      size:11,
      color:squid,
      bold:true
    }
  );


  y +=
    8;


  addInfoBox(
    'Ship',
    meta.ship ||
    ''
  );


  addInfoBox(
    'Visit Dates',
    `${meta.dateOn || ''}` +
    (
      meta.dateOff
        ? ` → ${meta.dateOff}`
        : ''
    )
  );


  addInfoBox(
    'Reviewer',
    reviewer
  );


  y +=
    5;


  /* ==========================================================
     SUMMARY
  ========================================================== */

  addText(
    'REPORT SUMMARY',
    {
      size:11,
      color:squid,
      bold:true
    }
  );


  y +=
    5;


  ensureSpace(
    75
  );


  doc.setFillColor(
    light[0],
    light[1],
    light[2]
  );


  doc.roundedRect(
    margin,
    y - 10,
    contentWidth,
    67,
    6,
    6,
    'F'
  );


  const summaryY =
    y + 7;


  doc.setFont(
    'helvetica',
    'bold'
  );


  doc.setFontSize(
    9
  );


  doc.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );


  doc.text(
    `${counts.checked} of ${counts.total}`,
    margin + 10,
    summaryY
  );


  doc.setFont(
    'helvetica',
    'normal'
  );


  doc.setFontSize(
    7
  );


  doc.setTextColor(
    gray[0],
    gray[1],
    gray[2]
  );


  doc.text(
    'CHECKED POINTS',
    margin + 10,
    summaryY + 12
  );


  doc.setFont(
    'helvetica',
    'bold'
  );


  doc.setFontSize(
    9
  );


  doc.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );


  doc.text(
    String(
      counts.comments
    ),
    margin + 130,
    summaryY
  );


  doc.setFont(
    'helvetica',
    'normal'
  );


  doc.setFontSize(
    7
  );


  doc.setTextColor(
    gray[0],
    gray[1],
    gray[2]
  );


  doc.text(
    'COMMENTS',
    margin + 130,
    summaryY + 12
  );


  doc.setFont(
    'helvetica',
    'bold'
  );


  doc.setFontSize(
    9
  );


  doc.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );


  doc.text(
    String(
      counts.photos
    ),
    margin + 225,
    summaryY
  );


  doc.setFont(
    'helvetica',
    'normal'
  );


  doc.setFontSize(
    7
  );


  doc.setTextColor(
    gray[0],
    gray[1],
    gray[2]
  );


  doc.text(
    'PHOTOS',
    margin + 225,
    summaryY + 12
  );


  doc.setFont(
    'helvetica',
    'bold'
  );


  doc.setFontSize(
    9
  );


  doc.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );


  doc.text(
    String(
      counts.followUps
    ),
    margin + 320,
    summaryY
  );


  doc.setFont(
    'helvetica',
    'normal'
  );


  doc.setFontSize(
    7
  );


  doc.setTextColor(
    gray[0],
    gray[1],
    gray[2]
  );


  doc.text(
    'FOLLOW-UPS',
    margin + 320,
    summaryY + 12
  );


  if(
    counts.followUps > 0
  ){

    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      8
    );


    const followupColor =
      counts.completedFollowUps ===
      counts.followUps
        ? green
        : blue;


    doc.setTextColor(
      followupColor[0],
      followupColor[1],
      followupColor[2]
    );


    doc.text(
      `Follow-Ups Completed: ${counts.completedFollowUps}/${counts.followUps}`,
      margin + 10,
      summaryY + 35
    );

  }


  y +=
    77;


  /* ==========================================================
     DESCRIPTION
  ========================================================== */

  addText(
    'The report below contains only the checklist points checked during the ship visit, together with reviewer comments, attached photos, follow-up requirements and ship responses.',
    {
      size:8.5,
      color:gray,
      width:contentWidth,
      lineHeight:12
    }
  );


  y +=
    8;


  /* ==========================================================
     CHECKED POINTS
  ========================================================== */

  if(
    points.length === 0
  ){

    addText(
      'No checklist points were checked.',
      {
        size:9.5,
        color:red,
        bold:true
      }
    );

  }else{

    let currentSection =
      '';


    points.forEach(
      point => {

        if(
          point.section !==
          currentSection
        ){

          currentSection =
            point.section;


          addSectionTitle(
            currentSection
          );

        }


        addPoint(
          point
        );

      }
    );

  }


  drawFooter();


  /* ==========================================================
     SAVE
  ========================================================== */

  const names =
    makeFileName(
      meta.ship,
      meta.dateOn
    );


  doc.save(
    names.report
  );


  return true;

}


/* ============================================================
   GENERATE FOLLOW-UP PDF
============================================================ */

export function generateFollowUpPDF(
  report
){

  const jsPDF =
    getJsPDF();


  if(
    !jsPDF
  ){

    alert(
      'PDF library is not available.'
    );


    return false;

  }


  if(
    !report
  ){

    alert(
      'No report selected.'
    );


    return false;

  }


  const meta = {

    ship:
      report.ship ||
      '',

    dateOn:
      report.date_on ||
      '',

    dateOff:
      report.date_off ||
      '',

    reviewer:
      report.reviewer ||
      ''

  };


  const state =
    report
      ?.report_data
      ?.state ||
    {};


  const points =
    getCheckedPoints(
      state
    )
    .filter(
      point =>
        point.followUpNeeded
    );


  const doc =
    new jsPDF({

      unit:'pt',

      format:'a4',

      compress:true

    });


  const W =
    doc.internal.pageSize.getWidth();


  const H =
    doc.internal.pageSize.getHeight();


  const margin =
    40;


  const width =
    W -
    margin * 2;


  const squid =
    [60,16,83];


  const red =
    [225,10,10];


  const green =
    [0,138,82];


  const gray =
    [95,95,95];


  const dark =
    [27,27,27];


  let y = 105;


  function header(){

    doc.setFillColor(
      squid[0],
      squid[1],
      squid[2]
    );


    doc.rect(
      0,
      0,
      W,
      88,
      'F'
    );


    doc.setTextColor(
      255,
      255,
      255
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      10
    );


    doc.text(
      '— VIRGIN VOYAGES',
      margin,
      25
    );


    doc.setFontSize(
      20
    );


    doc.text(
      'Points To Follow Up',
      margin,
      53
    );

  }


  function footer(){

    doc.setFillColor(
      dark[0],
      dark[1],
      dark[2]
    );


    doc.rect(
      0,
      H - 24,
      W,
      24,
      'F'
    );


    doc.setTextColor(
      255,
      255,
      255
    );


    doc.setFont(
      'helvetica',
      'normal'
    );


    doc.setFontSize(
      7
    );


    doc.text(
      'Virgin Voyages — Ship Visit Report',
      margin,
      H - 9
    );


    doc.text(
      safeText(
        meta.ship
      ),
      W - margin,
      H - 9,
      {
        align:'right'
      }
    );

  }


  function newPage(){

    footer();

    doc.addPage();

    header();

    y =
      105;

  }


  function ensureSpace(
    height
  ){

    if(
      y + height >
      H - 38
    ){

      newPage();

    }

  }


  function addText(
    value,
    size = 9,
    color = gray,
    x = margin,
    maxWidth = width,
    bold = false
  ){

    const lines =
      doc.splitTextToSize(
        safeText(value),
        maxWidth
      );


    doc.setFont(
      'helvetica',
      bold
        ? 'bold'
        : 'normal'
    );


    doc.setFontSize(
      size
    );


    doc.setTextColor(
      color[0],
      color[1],
      color[2]
    );


    lines.forEach(
      line => {

        ensureSpace(
          size + 4
        );


        doc.text(
          line,
          x,
          y
        );


        y +=
          size + 4;

      }
    );

  }


  header();


  addText(
    `Ship: ${meta.ship}`,
    11,
    dark,
    margin,
    width,
    true
  );


  addText(
    `Visit: ${meta.dateOn}` +
    (
      meta.dateOff
        ? ` → ${meta.dateOff}`
        : ''
    ),
    9,
    gray
  );


  addText(
    `Reviewer: ${meta.reviewer}`,
    9,
    gray
  );


  y +=
    8;


  addText(
    `FOLLOW-UP POINTS: ${points.length}`,
    10,
    red,
    margin,
    width,
    true
  );


  y +=
    6;


  points.forEach(
    point => {

      ensureSpace(
        65
      );


      addText(
        point.section,
        9,
        squid,
        margin,
        width,
        true
      );


      addText(
        point.text,
        10,
        dark,
        margin,
        width,
        true
      );


      addText(
        point.shipComments.length > 0
          ? 'FOLLOW-UP COMPLETED'
          : 'FOLLOW-UP NEEDED FROM SHIP',
        8,
        point.shipComments.length > 0
          ? green
          : red,
        margin,
        width,
        true
      );


      if(
        point.comments.length > 0
      ){

        y +=
          4;


        addText(
          'REVIEWER COMMENTS',
          7.5,
          squid,
          margin,
          width,
          true
        );


        point.comments.forEach(
          comment => {

            addText(
              `${comment.name || 'Reviewer'}: ${comment.text || ''}`,
              8.5,
              gray,
              margin + 7,
              width - 7
            );

          }
        );

      }


      if(
        point.photos.length > 0
      ){

        y +=
          4;


        addText(
          'REVIEWER PHOTOS',
          7.5,
          squid,
          margin,
          width,
          true
        );


        point.photos.forEach(
          photo => {

            ensureSpace(
              155
            );


            const image =
              addImageToPDF(
                doc,
                photo,
                margin + 7,
                y,
                140,
                140
              );


            if(
              image.height > 0
            ){

              y +=
                image.height +
                8;

            }

          }
        );

      }


      if(
        point.shipComments.length > 0
      ){

        addText(
          'SHIP COMMENTS / RESPONSES',
          7.5,
          green,
          margin,
          width,
          true
        );


        point.shipComments.forEach(
          comment => {

            addText(
              `${comment.name || 'Ship'}: ${comment.text || ''}`,
              8.5,
              green,
              margin + 7,
              width - 7
            );

          }
        );

      }else{

        addText(
          'No ship response yet.',
          8.5,
          red,
          margin + 7,
          width - 7,
          true
        );

      }


      y +=
        8;

    }
  );


  footer();


  const names =
    makeFileName(
      meta.ship,
      meta.dateOn
    );


  doc.save(
    names.followup
  );


  return true;

}


/* ============================================================
   PRINT REPORT
============================================================ */

export function printReport(){

  const meta =
    getMeta() || {};


  const state =
    getState() || {};


  const reviewer =
    getReviewer() ||
    meta.reviewer ||
    'Reviewer';


  const points =
    getCheckedPoints(
      state
    );


  const counts =
    getReportCounts(
      points
    );


  /*
    Group points by section.
  */

  const groups = [];


  points.forEach(
    point => {

      let group =
        groups.find(
          item =>
            item.section ===
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


  /*
    Open a dedicated print window.
  */

  const printWindow =
    window.open(
      '',
      '_blank',
      'width=1000,height=1000'
    );


  if(
    !printWindow
  ){

    alert(
      'Please allow pop-ups to print the report.'
    );


    return false;

  }


  const html =
`
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>
  ${escapeHtml(
    meta.ship || 'Ship Visit Report'
  )}
</title>


<style>

  * {
    box-sizing:border-box;
  }


  html,
  body {
    margin:0;
    padding:0;
  }


  body {
    background:#F8F6F9;
    color:#333333;
    font-family:Arial,Calibri,sans-serif;
  }


  .report {
    width:100%;
    max-width:900px;
    margin:20px auto;
    background:#FFFFFF;
  }


  /* ================================================
     HEADER
  ================================================ */

  .header {
    position:relative;
    padding:28px 32px;
    overflow:hidden;
    background:#3C1053;
    color:#FFFFFF;
  }


  .header::after {
    content:'';
    position:absolute;
    inset:-120px;
    background:
      repeating-linear-gradient(
        45deg,
        transparent 0,
        transparent 36px,
        rgba(255,255,255,.055) 36px,
        rgba(255,255,255,.055) 38px
      );
    pointer-events:none;
  }


  .header-content {
    position:relative;
    z-index:2;
  }


  .eyebrow {
    font-size:11px;
    line-height:1.2;
    font-weight:800;
    letter-spacing:.08em;
  }


  .header h1 {
    margin:7px 0 0;
    font-size:29px;
    line-height:1.1;
    font-weight:800;
  }


  /* ================================================
     BODY
  ================================================ */

  .body {
    padding:28px 32px 38px;
  }


  /* ================================================
     INFORMATION
  ================================================ */

  .info-title {
    margin-bottom:10px;
    color:#3C1053;
    font-size:15px;
    font-weight:800;
  }


  .info-grid {
    display:grid;
    grid-template-columns:
      repeat(3,minmax(0,1fr));
    gap:10px;
    margin-bottom:23px;
  }


  .info-box {
    padding:11px;
    border:1px solid #E7E1EA;
    border-radius:7px;
    background:#F8F6F9;
  }


  .info-label {
    margin-bottom:4px;
    color:#3C1053;
    font-size:8px;
    font-weight:800;
    letter-spacing:.05em;
    text-transform:uppercase;
  }


  .info-value {
    color:#333333;
    font-size:11px;
    line-height:1.4;
    font-weight:600;
  }


  /* ================================================
     SUMMARY
  ================================================ */

  .summary {
    margin-bottom:25px;
    padding:15px;
    border-left:4px solid #E10A0A;
    border-radius:7px;
    background:#F8F6F9;
  }


  .summary-title {
    margin-bottom:10px;
    color:#3C1053;
    font-size:14px;
    font-weight:800;
  }


  .summary-grid {
    display:grid;
    grid-template-columns:
      repeat(4,minmax(0,1fr));
    gap:8px;
  }


  .summary-item {
    padding:8px;
    border:1px solid #E7E1EA;
    border-radius:5px;
    background:#FFFFFF;
    text-align:center;
  }


  .summary-number {
    color:#3C1053;
    font-size:17px;
    font-weight:800;
  }


  .summary-label {
    margin-top:2px;
    color:#8A8A8A;
    font-size:7px;
    font-weight:800;
    text-transform:uppercase;
  }


  .followup-summary {
    margin-top:8px;
    font-size:9px;
    font-weight:800;
  }


  /* ================================================
     INTRO
  ================================================ */

  .intro {
    margin-bottom:20px;
    color:#8A8A8A;
    font-size:10px;
    line-height:1.5;
  }


  /* ================================================
     SECTION
  ================================================ */

  .section-title {
    margin-top:22px;
    margin-bottom:12px;
    padding-bottom:7px;
    border-bottom:2px solid #E10A0A;
    color:#3C1053;
    font-size:17px;
    font-weight:800;
    page-break-after:avoid;
  }


  /* ================================================
     POINT
  ================================================ */

  .point {
    margin-bottom:14px;
    padding:14px;
    border:1px solid #E7E1EA;
    border-left:4px solid #3C1053;
    border-radius:8px;
    background:#FFFFFF;
    page-break-inside:avoid;
  }


  .point-title {
    display:flex;
    align-items:flex-start;
    gap:9px;
  }


  .check {
    display:flex;
    align-items:center;
    justify-content:center;
    width:22px;
    height:22px;
    flex:0 0 22px;
    border-radius:50%;
    background:#E10A0A;
    color:#FFFFFF;
    font-size:12px;
    font-weight:800;
  }


  .point-text {
    color:#333333;
    font-size:12px;
    line-height:1.45;
    font-weight:700;
  }


  .status {
    display:inline-block;
    margin-top:8px;
    padding:5px 8px;
    border-radius:999px;
    font-size:8px;
    line-height:1;
    font-weight:800;
  }


  .status.blue {
    color:#2463B8;
    background:#EEF5FF;
  }


  .status.green {
    color:#008A52;
    background:#EAF8F0;
  }


  .status.red {
    color:#CC0000;
    background:#FFF1F1;
  }


  .label {
    margin-top:12px;
    margin-bottom:5px;
    color:#3C1053;
    font-size:8px;
    font-weight:800;
    letter-spacing:.04em;
  }


  .comment {
    margin-top:5px;
    padding:8px 10px;
    border-left:3px solid #3C1053;
    border-radius:5px;
    background:#F8F5FA;
    font-size:10px;
    line-height:1.5;
  }


  .photo-grid {
    display:flex;
    flex-wrap:wrap;
    gap:8px;
  }


  .photo {
    width:145px;
    max-height:145px;
    overflow:hidden;
    border:1px solid #E7E1EA;
    border-radius:6px;
  }


  .photo img {
    display:block;
    width:100%;
    height:auto;
    max-height:145px;
    object-fit:contain;
  }


  .ship-comment {
    margin-top:5px;
    padding:8px 10px;
    border-left:3px solid #008A52;
    border-radius:5px;
    background:#EAF8F0;
    font-size:10px;
    line-height:1.5;
  }


  .no-response {
    margin-top:7px;
    color:#CC0000;
    font-size:9px;
    font-weight:800;
  }


  /* ================================================
     FOOTER
  ================================================ */

  .footer {
    margin-top:25px;
    padding-top:10px;
    border-top:1px solid #E7E1EA;
    color:#8A8A8A;
    font-size:8px;
    line-height:1.4;
    text-align:center;
  }


  /* ================================================
     PRINT
  ================================================ */

  @media print {

    @page {
      size:A4;
      margin:12mm;
    }


    body {
      background:#FFFFFF;
    }


    .report {
      width:100%;
      max-width:none;
      margin:0;
    }


    .header {
      print-color-adjust:exact;
      -webkit-print-color-adjust:exact;
    }


    .summary,
    .status,
    .check,
    .comment,
    .ship-comment {
      print-color-adjust:exact;
      -webkit-print-color-adjust:exact;
    }

  }


</style>

</head>


<body>


<div class="report">


  <!-- ==================================================
       HEADER
  =================================================== -->

  <div class="header">

    <div class="header-content">

      <div class="eyebrow">
        — VIRGIN VOYAGES
      </div>


      <h1>
        Ship Visit Report
      </h1>

    </div>

  </div>


  <!-- ==================================================
       BODY
  =================================================== -->

  <div class="body">


    <!-- REPORT INFORMATION -->

    <div class="info-title">
      REPORT INFORMATION
    </div>


    <div class="info-grid">


      <div class="info-box">

        <div class="info-label">
          Ship
        </div>

        <div class="info-value">

          ${escapeHtml(
            meta.ship || ''
          )}

        </div>

      </div>


      <div class="info-box">

        <div class="info-label">
          Visit Dates
        </div>

        <div class="info-value">

          ${escapeHtml(
            meta.dateOn || ''
          )}

          ${
            meta.dateOff
              ? ` → ${escapeHtml(
                  meta.dateOff
                )}`
              : ''
          }

        </div>

      </div>


      <div class="info-box">

        <div class="info-label">
          Reviewer
        </div>

        <div class="info-value">

          ${escapeHtml(
            reviewer
          )}

        </div>

      </div>


    </div>


    <!-- SUMMARY -->

    <div class="summary">

      <div class="summary-title">
        REPORT SUMMARY
      </div>


      <div class="summary-grid">


        <div class="summary-item">

          <div class="summary-number">
            ${counts.checked}
          </div>

          <div class="summary-label">
            Checked
          </div>

        </div>


        <div class="summary-item">

          <div class="summary-number">
            ${counts.comments}
          </div>

          <div class="summary-label">
            Comments
          </div>

        </div>


        <div class="summary-item">

          <div class="summary-number">
            ${counts.photos}
          </div>

          <div class="summary-label">
            Photos
          </div>

        </div>


        <div class="summary-item">

          <div class="summary-number">
            ${counts.followUps}
          </div>

          <div class="summary-label">
            Follow-Ups
          </div>

        </div>


      </div>


      ${
        counts.followUps > 0
          ? `

            <div
              class="followup-summary"
              style="
                color:${
                  counts.completedFollowUps ===
                  counts.followUps
                    ? '#008A52'
                    : '#2463B8'
                };
              "
            >

              Follow-Ups Completed:
              ${counts.completedFollowUps}/${counts.followUps}

            </div>

          `
          : ''
      }


    </div>


    <!-- DESCRIPTION -->

    <div class="intro">

      The report below contains only the checklist
      points checked during the ship visit, together
      with reviewer comments, attached photos,
      follow-up requirements and ship responses.

    </div>


    <!-- CHECKED POINTS -->

    ${
      groups.length === 0

        ? `

          <div
            style="
              padding:20px;
              color:#CC0000;
              font-size:10px;
              font-weight:800;
              text-align:center;
            "
          >

            No checklist points were checked.

          </div>

        `

        : groups
          .map(
            group => `

              <div>

                <div class="section-title">

                  ${escapeHtml(
                    group.section
                  )}

                </div>


                ${
                  group.points
                    .map(
                      point => `

                        <div class="point">


                          <div class="point-title">

                            <div class="check">
                              ✓
                            </div>


                            <div class="point-text">

                              ${escapeHtml(
                                point.text
                              )}

                            </div>

                          </div>


                          ${
                            point.followUpNeeded

                              ? `

                                <span
                                  class="status ${
                                    point.shipComments.length
                                      ? 'green'
                                      : 'blue'
                                  }"
                                >

                                  ${
                                    point.shipComments.length
                                      ? 'SHIP FOLLOW-UP COMPLETED'
                                      : 'FOLLOW-UP NEEDED FROM SHIP'
                                  }

                                </span>

                              `

                              : `

                                <span
                                  class="status blue"
                                >

                                  CHECKED

                                </span>

                              `
                          }


                          ${
                            point.comments.length

                              ? `

                                <div class="label">

                                  REVIEWER COMMENTS

                                </div>


                                ${
                                  point.comments
                                    .map(
                                      comment => `

                                        <div class="comment">

                                          <strong>

                                            ${escapeHtml(
                                              comment.name ||
                                              'Reviewer'
                                            )}:

                                          </strong>


                                          <div>

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

                              `

                              : ''

                          }


                          ${
                            point.photos.length

                              ? `

                                <div class="label">

                                  ATTACHED PHOTOS

                                </div>


                                <div class="photo-grid">

                                  ${
                                    point.photos
                                      .map(
                                        photo => `

                                          <div class="photo">

                                            <img
                                              src="${photo}"
                                              alt="Reviewer photo"
                                            >

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
                            point.followUpNeeded

                              ? (

                                  point.shipComments.length

                                    ? `

                                      <div class="label">

                                        SHIP COMMENTS / RESPONSES

                                      </div>


                                      ${
                                        point.shipComments
                                          .map(
                                            comment => `

                                              <div class="ship-comment">

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

                                    `

                                    : `

                                      <div class="no-response">

                                        NO SHIP RESPONSE YET

                                      </div>

                                    `

                                )

                              : ''

                          }


                        </div>

                      `
                    )
                    .join('')
                }


              </div>

            `
          )
          .join('')
    }


    <!-- FOOTER -->

    <div class="footer">

      Virgin Voyages — Ship Visit Report

      <br>

      ${escapeHtml(
        meta.ship || ''
      )}

      •
      
      ${escapeHtml(
        meta.dateOn || ''
      )}

    </div>


  </div>


</div>


<script>

window.addEventListener(
  'load',
  function(){

    setTimeout(
      function(){

        window.print();

      },
      300
    );

  }
);

</script>


</body>

</html>
`;


  /*
    IMPORTANT:

    The groups used in the print HTML
    are created here.
  */

  const printGroups =
    [];


  points.forEach(
    point => {

      let group =
        printGroups.find(
          item =>
            item.section ===
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


        printGroups.push(
          group
        );

      }


      group.points.push(
        point
      );

    }
  );


  /*
    Insert actual groups into the
    print HTML.

    The template above uses "groups",
    so replace it before writing.
  */

  const finalHtml =
    html.replace(
      /\$\{\s*groups\.length === 0[\s\S]*?\}/,
      groupsPlaceholder(
        printGroups
      )
    );


  printWindow.document.open();


  printWindow.document.write(
    finalHtml
  );


  printWindow.document.close();


  return true;

}


/* ============================================================
   PRINT GROUP GENERATOR
============================================================ */

function groupsPlaceholder(
  groups
){

  if(
    !groups ||
    groups.length === 0
  ){

    return `

      <div
        style="
          padding:20px;
          color:#CC0000;
          font-size:10px;
          font-weight:800;
          text-align:center;
        "
      >

        No checklist points were checked.

      </div>

    `;

  }


  return groups
    .map(
      group => `

        <div>

          <div class="section-title">

            ${escapeHtml(
              group.section
            )}

          </div>


          ${
            group.points
              .map(
                point => `

                  <div class="point">


                    <div class="point-title">

                      <div class="check">
                        ✓
                      </div>


                      <div class="point-text">

                        ${escapeHtml(
                          point.text
                        )}

                      </div>

                    </div>


                    ${
                      point.followUpNeeded

                        ? `

                          <span
                            class="status ${
                              point.shipComments.length
                                ? 'green'
                                : 'blue'
                            }"
                          >

                            ${
                              point.shipComments.length
                                ? 'SHIP FOLLOW-UP COMPLETED'
                                : 'FOLLOW-UP NEEDED FROM SHIP'
                            }

                          </span>

                        `

                        : `

                          <span class="status blue">
                            CHECKED
                          </span>

                        `
                    }


                    ${
                      point.comments.length

                        ? `

                          <div class="label">

                            REVIEWER COMMENTS

                          </div>


                          ${
                            point.comments
                              .map(
                                comment => `

                                  <div class="comment">

                                    <strong>

                                      ${escapeHtml(
                                        comment.name ||
                                        'Reviewer'
                                      )}:

                                    </strong>


                                    <div>

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

                        `

                        : ''

                    }


                    ${
                      point.photos.length

                        ? `

                          <div class="label">

                            ATTACHED PHOTOS

                          </div>


                          <div class="photo-grid">

                            ${
                              point.photos
                                .map(
                                  photo => `

                                    <div class="photo">

                                      <img
                                        src="${photo}"
                                        alt="Reviewer photo"
                                      >

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
                      point.followUpNeeded

                        ? (

                            point.shipComments.length

                              ? `

                                <div class="label">

                                  SHIP COMMENTS / RESPONSES

                                </div>


                                ${
                                  point.shipComments
                                    .map(
                                      comment => `

                                        <div class="ship-comment">

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

                              `

                              : `

                                <div class="no-response">

                                  NO SHIP RESPONSE YET

                                </div>

                              `

                          )

                        : ''

                    }


                  </div>

                `
              )
              .join('')
          }


        </div>

      `
    )
    .join('');

}


/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {

  generatePDF,

  generateFollowUpPDF,

  printReport

};
