/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  pdf.js
  ============================================================

  PDF + PRINT REPORT TEMPLATE

  REPORT ORDER
  ------------------------------------------------------------
  1. Virgin Voyages header
  2. Report Information
     - Ship
     - Visit Dates
     - Reviewer
  3. Report Summary
  4. Checked checklist points only
  5. Reviewer comments
  6. Reviewer photos
  7. Follow-up status
  8. Ship comments / responses
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

function safeText(value){

  if(
    value === null ||
    value === undefined
  ){

    return '';

  }

  return String(value);

}


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

      return map[character] || character;

    }
  );

}


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
   REVIEWER COMMENTS
============================================================ */

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
        name,
        text,
        timestamp
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
        comment => ({

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
            ).trim(),

          timestamp:
            comment.timestamp ||
            null

        })
      );

  }


  /*
    Legacy single string.
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
          item.comment.trim(),

        timestamp:null

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
          item.reviewerComment.trim(),

        timestamp:null

      }

    ];

  }


  /*
    Legacy array.
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
                comment.trim(),

              timestamp:null

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
                comment?.message ??
                ''
              ).trim(),

            timestamp:
              comment?.timestamp ||
              null

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
   PHOTOS
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

    return item.shipComments
      .filter(
        comment =>
          comment &&
          safeText(
            comment.text
          ).trim()
      )
      .map(
        comment => ({

          name:
            comment.name ||
            comment.ship ||
            'Ship',

          text:
            safeText(
              comment.text ||
              ''
            ).trim(),

          timestamp:
            comment.timestamp ||
            null

        })
      );

  }


  /*
    Legacy ship response string.
  */

  if(
    typeof item.shipComment === 'string' &&
    item.shipComment.trim()
  ){

    return [

      {

        name:'Ship',

        text:
          item.shipComment.trim(),

        timestamp:null

      }

    ];

  }


  return [];

}


function getDepartmentGeneralComments(state, sectionId){
  const comments = state?.[`__department_general__${sectionId}`]?.comments;
  return Array.isArray(comments)
    ? comments.filter(comment => comment && safeText(comment.text).trim()).map(comment => ({
        name: comment.name || 'Reviewer',
        text: safeText(comment.text).trim()
      }))
    : [];
}

function countDepartmentGeneralComments(state){
  return SECTIONS.reduce((total, section) =>
    total + getDepartmentGeneralComments(state, section.id).length, 0
  );
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
            Only checked points are included.
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
              section.title ||
              section.name ||
              'Section',

            text:
              safeText(text),

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
   GROUP POINTS
============================================================ */

function groupPoints(points){

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


  return groups;

}


/* ============================================================
   TOTAL CHECKLIST POINTS
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


/* ============================================================
   REPORT COUNTS
============================================================ */

function getReportCounts(points, departmentGeneralCommentCount = 0){

  let comments = 0;

  let photos = 0;

  let followUps = 0;

  let completedFollowUps = 0;


  points.forEach(
    point => {

      comments +=
        point.comments.length;


      comments +=
        point.shipComments.length;


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

        }

      }

    }
  );


  return {

    total:
      getTotalChecklistPoints(),

    checked:
      points.length,

    comments:
      comments + departmentGeneralCommentCount,

    photos,

    followUps,

    completedFollowUps

  };

}


/* ============================================================
   FILE NAME
============================================================ */

function makeFileName(
  ship,
  date
){

  const cleanShip =
    safeText(
      ship ||
      'Ship'
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


  const cleanDate =
    safeText(
      date ||
      'date'
    )
      .trim()
      .replace(
        /[^0-9-]/g,
        ''
      );


  return {

    report:
      `Ship_Visit_Report_${cleanShip}_${cleanDate}.pdf`,

    followup:
      `Ship_Visit_Follow_Up_${cleanShip}_${cleanDate}.pdf`

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


    try{

      doc.addImage(
        source,
        'JPEG',
        x,
        y,
        width,
        height
      );

    }catch(jpegError){

      doc.addImage(
        source,
        'PNG',
        x,
        y,
        width,
        height
      );

    }


    return {

      width,

      height

    };

  }catch(error){

    console.warn(
      'Could not add report image:',
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


  const groups =
    groupPoints(
      points
    );


  const counts =
    getReportCounts(
      points,
      countDepartmentGeneralComments(state)
    );


  const doc =
    new jsPDF({

      unit:'pt',

      format:'a4',

      orientation:'portrait',

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
        meta.ship ||
        ''
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
     SPACE
  ========================================================== */

  function ensureSpace(
    amount
  ){

    if(
      y + amount >
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
    options={}
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
        safeText(value),
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
      safeText(label).toUpperCase(),
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
      safeText(value),
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
        bold:true
      }
    );


    y +=
      4;

  }


  /* ==========================================================
     POINT
  ========================================================== */

  function addPoint(
    point
  ){

    ensureSpace(
      60
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

    if(
      point.followUpNeeded
    ){

      if(
        point.shipComments.length > 0
      ){

        addText(
          'SHIP FOLLOW-UP COMPLETED',
          {
            size:7.5,
            color:green,
            bold:true,
            x:margin + 24,
            width:contentWidth - 24,
            lineHeight:10
          }
        );

      }else{

        addText(
          'FOLLOW-UP NEEDED FROM SHIP',
          {
            size:7.5,
            color:blue,
            bold:true,
            x:margin + 24,
            width:contentWidth - 24,
            lineHeight:10
          }
        );

      }

    }else{

      addText(
        'CHECKED',
        {
          size:7.5,
          color:blue,
          bold:true,
          x:margin + 24,
          width:contentWidth - 24,
          lineHeight:10
        }
      );

    }


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
      Photos.
    */

    if(
      point.photos.length > 0
    ){

      y +=
        3;


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
      Ship response.
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
      Separator.
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
     BUILD PDF
  ========================================================== */

  drawHeader();


  /* REPORT INFORMATION */

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


  /* REPORT SUMMARY */

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


  /*
    Checked.
  */

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


  /*
    Comments.
  */

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


  /*
    Photos.
  */

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


  /*
    Follow-ups.
  */

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

    const completionColor =
      counts.completedFollowUps ===
      counts.followUps
        ? green
        : blue;


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      8
    );


    doc.setTextColor(
      completionColor[0],
      completionColor[1],
      completionColor[2]
    );


    doc.text(
      `Follow-Ups Completed: ${counts.completedFollowUps}/${counts.followUps}`,
      margin + 10,
      summaryY + 35
    );

  }


  y +=
    77;


  /* DESCRIPTION */

  addText(
    'The report contains only the checklist points checked during the ship visit, together with reviewer comments, attached photos, follow-up requirements and ship responses.',
    {
      size:8.5,
      color:gray,
      width:contentWidth,
      lineHeight:12
    }
  );


  y +=
    8;


  /* POINTS */

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

    SECTIONS.forEach(section => {

      const group = groups.find(item => item.section === section.title);
      const generalComments = getDepartmentGeneralComments(state, section.id);

      if((!group || !group.points.length) && !generalComments.length){
        return;
      }

      addSectionTitle(section.title);

      if(generalComments.length){
        addText('GENERAL COMMENTS', {
          size:7.5, color:squid, bold:true,
          x:margin, width:contentWidth, lineHeight:10
        });

        generalComments.forEach(comment => {
          addText(`${comment.name || 'Reviewer'}: ${comment.text || ''}`, {
            size:8.5, color:gray,
            x:margin + 7, width:contentWidth - 7, lineHeight:11
          });
        });
        y += 3;
      }

      if(group){
        group.points.forEach(point => addPoint(point));
      }

    });


  }


  drawFooter();


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
   PRINT REPORT
   SAME CONTENT + SAME TEMPLATE
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


  const groups =
    groupPoints(
      points
    );


  const counts =
    getReportCounts(
      points
    );


  const reportSections =
    groups.length === 0

      ? `

        <div class="empty-report">

          No checklist points were checked.

        </div>

      `

      : groups
          .map(
            group => `

              <section class="report-section">

                <div class="section-title">

                  ${escapeHtml(
                    group.section
                  )}

                </div>


                ${
                  group.points
                    .map(
                      point =>
                        renderPrintPoint(
                          point
                        )
                    )
                    .join('')
                }

              </section>

            `
          )
          .join('');


  /*
    Open dedicated print window.
  */

  const printWindow =
    window.open(
      '',
      '_blank',
      'width=900,height=1100'
    );


  if(
    !printWindow
  ){

    alert(
      'Please allow pop-ups to print the report.'
    );


    return false;

  }


  const html = `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">


<title>
  Ship Visit Report - ${escapeHtml(
    meta.ship ||
    ''
  )}
</title>


<style>

/* ==========================================================
   PAGE
========================================================== */

@page {

  size:A4 portrait;

  margin:0;

}


/* ==========================================================
   RESET
========================================================== */

* {
  box-sizing:border-box;
}


html,
body {

  margin:0;

  padding:0;

  width:100%;

}


body {

  background:#F8F6F9;

  color:#333333;

  font-family:
    Arial,
    Calibri,
    sans-serif;

  font-size:10pt;

}


/* ==========================================================
   REPORT
========================================================== */

.report {

  width:210mm;

  min-height:297mm;

  margin:0 auto;

  background:#FFFFFF;

}


/* ==========================================================
   HEADER
========================================================== */

.header {

  position:relative;

  width:100%;

  height:33mm;

  padding:
    8mm 12mm;

  overflow:hidden;

  background:#3C1053;

  color:#FFFFFF;

}


.header::after {

  content:'';

  position:absolute;

  inset:-35mm;

  background:
    repeating-linear-gradient(
      45deg,
      transparent 0,
      transparent 9mm,
      rgba(255,255,255,.055) 9mm,
      rgba(255,255,255,.055) 9.5mm
    );

  pointer-events:none;

}


.header-content {

  position:relative;

  z-index:2;

}


.eyebrow {

  margin:0 0 2mm;

  color:#FFFFFF;

  font-size:8pt;

  line-height:1.2;

  font-weight:800;

  letter-spacing:.08em;

}


.header-title {

  color:#FFFFFF;

  font-size:20pt;

  line-height:1.05;

  font-weight:800;

}


/* ==========================================================
   BODY
========================================================== */

.body {

  padding:
    9mm 12mm 12mm;

}


/* ==========================================================
   INFORMATION
========================================================== */

.info-title {

  margin-bottom:3mm;

  color:#3C1053;

  font-size:10pt;

  line-height:1.2;

  font-weight:800;

}


.info-grid {

  display:grid;

  grid-template-columns:
    repeat(3,minmax(0,1fr));

  gap:3mm;

  margin-bottom:7mm;

}


.info-box {

  min-height:17mm;

  padding:3mm;

  border:
    .3mm solid #E7E1EA;

  border-radius:2mm;

  background:#F8F6F9;

}


.info-label {

  margin-bottom:1.5mm;

  color:#3C1053;

  font-size:6.5pt;

  line-height:1.1;

  font-weight:800;

  letter-spacing:.05em;

  text-transform:uppercase;

}


.info-value {

  color:#333333;

  font-size:8.5pt;

  line-height:1.35;

  font-weight:600;

}


/* ==========================================================
   SUMMARY
========================================================== */

.summary {

  margin-bottom:7mm;

  padding:4mm;

  border-left:
    1.2mm solid #E10A0A;

  border-radius:2mm;

  background:#F8F6F9;

}


.summary-title {

  margin-bottom:3mm;

  color:#3C1053;

  font-size:10pt;

  line-height:1.2;

  font-weight:800;

}


.summary-grid {

  display:grid;

  grid-template-columns:
    repeat(4,minmax(0,1fr));

  gap:2.5mm;

}


.summary-item {

  padding:2.5mm;

  border:
    .3mm solid #E7E1EA;

  border-radius:1.5mm;

  background:#FFFFFF;

  text-align:center;

}


.summary-number {

  color:#3C1053;

  font-size:13pt;

  line-height:1.1;

  font-weight:800;

}


.summary-label {

  margin-top:1mm;

  color:#8A8A8A;

  font-size:6pt;

  line-height:1.1;

  font-weight:800;

  text-transform:uppercase;

}


.followup-summary {

  margin-top:2mm;

  font-size:7pt;

  line-height:1.2;

  font-weight:800;

}


/* ==========================================================
   INTRO
========================================================== */

.intro {

  margin-bottom:6mm;

  color:#8A8A8A;

  font-size:7.5pt;

  line-height:1.45;

}


/* ==========================================================
   SECTIONS
========================================================== */

.report-section {

  width:100%;

  margin:0;

}


.section-title {

  margin:
    6mm 0 3mm;

  padding-bottom:2mm;

  border-bottom:
    .6mm solid #E10A0A;

  color:#3C1053;

  font-size:11pt;

  line-height:1.2;

  font-weight:800;

  page-break-after:avoid;

}


/* ==========================================================
   POINT
========================================================== */

.point {

  margin-bottom:3mm;

  padding:3.5mm;

  border:
    .3mm solid #E7E1EA;

  border-left:
    1.2mm solid #3C1053;

  border-radius:2mm;

  background:#FFFFFF;

  page-break-inside:avoid;

}


.point-title {

  display:flex;

  align-items:flex-start;

  gap:2.5mm;

}


.check {

  display:flex;

  align-items:center;

  justify-content:center;

  width:6mm;

  height:6mm;

  min-width:6mm;

  min-height:6mm;

  border-radius:50%;

  background:#E10A0A;

  color:#FFFFFF;

  font-size:7pt;

  line-height:1;

  font-weight:800;

}


.point-text {

  flex:1;

  color:#333333;

  font-size:8.5pt;

  line-height:1.4;

  font-weight:700;

}


/* ==========================================================
   STATUS
========================================================== */

.status {

  display:inline-block;

  margin-top:2mm;

  padding:
    1.3mm 2mm;

  border-radius:999px;

  font-size:6pt;

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


/* ==========================================================
   LABEL
========================================================== */

.label {

  margin-top:3mm;

  margin-bottom:1.2mm;

  color:#3C1053;

  font-size:6pt;

  line-height:1.2;

  font-weight:800;

  letter-spacing:.04em;

}


/* ==========================================================
   REVIEWER COMMENT
========================================================== */

.comment {

  margin-bottom:1.5mm;

  padding:
    2mm 2.5mm;

  border-left:
    .8mm solid #3C1053;

  border-radius:1.2mm;

  background:#F8F5FA;

  color:#333333;

  font-size:7.5pt;

  line-height:1.45;

}


.comment strong {

  color:#3C1053;

}


/* ==========================================================
   PHOTO
========================================================== */

.photo-grid {

  display:flex;

  flex-wrap:wrap;

  gap:2.5mm;

}


.photo {

  width:38mm;

  max-width:38mm;

  max-height:38mm;

  overflow:hidden;

  border:
    .3mm solid #E7E1EA;

  border-radius:1.5mm;

  background:#F4F2F5;

}


.photo img {

  display:block;

  width:100%;

  height:auto;

  max-height:38mm;

  object-fit:contain;

}


/* ==========================================================
   SHIP RESPONSE
========================================================== */

.ship-comment {

  margin-bottom:1.5mm;

  padding:
    2mm 2.5mm;

  border-left:
    .8mm solid #008A52;

  border-radius:1.2mm;

  background:#EAF8F0;

  color:#333333;

  font-size:7.5pt;

  line-height:1.45;

}


.ship-comment strong {

  color:#008A52;

}


.no-response {

  margin-top:2mm;

  color:#CC0000;

  font-size:6.5pt;

  line-height:1.2;

  font-weight:800;

}


/* ==========================================================
   EMPTY
========================================================== */

.empty-report {

  padding:8mm;

  border:
    .3mm solid #E7E1EA;

  border-radius:2mm;

  color:#CC0000;

  text-align:center;

  font-size:8pt;

  font-weight:800;

}


/* ==========================================================
   FOOTER
========================================================== */

.footer {

  margin-top:8mm;

  padding-top:3mm;

  border-top:
    .3mm solid #E7E1EA;

  color:#8A8A8A;

  font-size:6pt;

  line-height:1.3;

  text-align:center;

}


/* ==========================================================
   PRINT
========================================================== */

@media print {

  @page {

    size:A4 portrait;

    margin:12mm;

  }


  html,
  body {

    width:210mm;

    min-height:297mm;

    background:#FFFFFF;

  }


  .report {

    width:100%;

    max-width:none;

    min-height:auto;

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


  <!-- ========================================================
       HEADER
  ========================================================= -->

  <div class="header">

    <div class="header-content">

      <div class="eyebrow">

        — VIRGIN VOYAGES

      </div>


      <div class="header-title">

        Ship Visit Report

      </div>

    </div>

  </div>


  <!-- ========================================================
       BODY
  ========================================================= -->

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
            meta.ship ||
            ''
          )}

        </div>

      </div>


      <div class="info-box">

        <div class="info-label">

          Visit Dates

        </div>


        <div class="info-value">

          ${escapeHtml(
            meta.dateOn ||
            ''
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


    <!-- REPORT SUMMARY -->

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


    <!-- INTRO -->

    <div class="intro">

      The report contains only the checklist
      points checked during the ship visit,
      together with reviewer comments,
      attached photos, follow-up requirements
      and ship responses.

    </div>


    <!-- REPORT SECTIONS -->

    ${reportSections}


    <!-- FOOTER -->

    <div class="footer">

      Virgin Voyages — Ship Visit Report

      <br>

      ${escapeHtml(
        meta.ship ||
        ''
      )}

      •

      ${escapeHtml(
        meta.dateOn ||
        ''
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
      500
    );

  }
);

</script>


</body>

</html>
`;


  printWindow.document.open();

  printWindow.document.write(
    html
  );

  printWindow.document.close();


  return true;

}


/* ============================================================
   PRINT POINT
============================================================ */

function renderPrintPoint(
  point
){

  return `

    <div class="point">


      <!-- POINT -->

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


      <!-- STATUS -->

      ${
        point.followUpNeeded

          ? `

            <span
              class="status ${
                point.shipComments.length > 0
                  ? 'green'
                  : 'blue'
              }"
            >

              ${
                point.shipComments.length > 0
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


      <!-- REVIEWER COMMENTS -->

      ${
        point.comments.length > 0

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


      <!-- REVIEWER PHOTOS -->

      ${
        point.photos.length > 0

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

          `

          : ''

      }


      <!-- SHIP RESPONSES -->

      ${
        point.followUpNeeded

          ? (

              point.shipComments.length > 0

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

                : `

                  <div class="no-response">

                    NO SHIP RESPONSE YET

                  </div>

                `

            )

          : ''

      }


    </div>

  `;

}


/* ============================================================
   FOLLOW-UP PDF
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


  const allPoints =
    getCheckedPoints(
      state
    );


  const points =
    allPoints.filter(
      point =>
        point.followUpNeeded
    );


  const doc =
    new jsPDF({

      unit:'pt',

      format:'a4',

      orientation:'portrait',

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


  const blue =
    [36,99,184];


  const gray =
    [95,95,95];


  const dark =
    [27,27,27];


  let y =
    105;


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
    amount
  ){

    if(
      y + amount >
      H - 38
    ){

      newPage();

    }

  }


  function addText(
    value,
    size=9,
    color=gray,
    x=margin,
    maxWidth=width,
    bold=false
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
    'REPORT INFORMATION',
    11,
    squid,
    margin,
    width,
    true
  );


  y +=
    5;


  addText(
    `Ship: ${meta.ship}`,
    9.5,
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
    7;


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
          : blue,
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
   DEFAULT EXPORT
============================================================ */

export default {

  generatePDF,

  generateFollowUpPDF,

  printReport

};
