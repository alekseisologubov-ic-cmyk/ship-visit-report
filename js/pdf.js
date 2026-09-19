/*
  ============================================================
  VIRGIN VOYAGES
  SHIP VISIT REPORT
  pdf.js
  ============================================================

  FINAL REPORT FORMAT

  1. Virgin Voyages header
  2. Ship name
  3. Visit dates
  4. Reviewer
  5. Report summary
  6. Checked checklist points only
  7. Reviewer comments
  8. Reviewer photos
  9. Follow-up status
  10. Ship comments / responses
  11. Consistent PDF + Print layout
*/


import {
  SECTIONS
} from './data.js';


import {
  getMeta,
  getState,
  getReviewer
} from './state.js';


/* =========================================================
   LOAD jsPDF
========================================================= */

function getJsPDF(){

  if(
    window.jspdf &&
    window.jspdf.jsPDF
  ){

    return window.jspdf.jsPDF;

  }


  return null;

}


/* =========================================================
   SAFE TEXT
========================================================= */

function safeText(
  value
){

  return String(
    value ?? ''
  );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
  value
){

  return safeText(
    value
  ).replace(
    /[&<>"']/g,
    character => ({

      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'

    }[character])
  );

}


/* =========================================================
   NORMALIZE COMMENTS
========================================================= */

function getReviewerComments(
  item
){

  if(
    !item
  ){

    return [];

  }


  if(
    Array.isArray(
      item.comments
    )
  ){

    return item.comments
      .filter(
        comment => {

          const text =
            comment?.text ??
            comment?.comment ??
            comment?.message ??
            '';


          return Boolean(
            safeText(
              text
            ).trim()
          );

        }
      )
      .map(
        comment => ({

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
            ).trim()

        })
      );

  }


  if(
    typeof item.comment ===
    'string' &&
    item.comment.trim()
  ){

    return [

      {

        name:'Reviewer',

        text:
          item.comment.trim()

      }

    ];

  }


  if(
    typeof item.reviewerComment ===
    'string' &&
    item.reviewerComment.trim()
  ){

    return [

      {

        name:'Reviewer',

        text:
          item.reviewerComment.trim()

      }

    ];

  }


  return [];

}


/* =========================================================
   PHOTOS
========================================================= */

function getPhotos(
  item
){

  if(
    !item
  ){

    return [];

  }


  if(
    Array.isArray(
      item.photos
    )
  ){

    return item.photos.filter(
      photo =>
        Boolean(
          photo
        )
    );

  }


  if(
    typeof item.photo ===
    'string' &&
    item.photo.trim()
  ){

    return [
      item.photo.trim()
    ];

  }


  return [];

}


/* =========================================================
   SHIP COMMENTS
========================================================= */

function getShipComments(
  item
){

  if(
    !item
  ){

    return [];

  }


  if(
    Array.isArray(
      item.shipComments
    )
  ){

    return item.shipComments
      .filter(
        comment =>
          comment &&
          safeText(
            comment.text
          ).trim()
      );

  }


  return [];

}


/* =========================================================
   CHECKED POINTS
========================================================= */

function getCheckedPoints(
  state
){

  const points = [];


  SECTIONS.forEach(
    section => {

      section.items.forEach(
        (
          itemText,
          index
        ) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


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
              itemText,

            item,

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
              ),

            followUpNeeded:
              Boolean(
                item.followUpNeeded
              )

          });

        }
      );

    }
  );


  return points;

}


/* =========================================================
   COUNTS
========================================================= */

function getCounts(
  state,
  checkedPoints
){

  let total =
    0;


  SECTIONS.forEach(
    section => {

      total +=
        section.items.length;

    }
  );


  const checked =
    checkedPoints.length;


  const comments =
    checkedPoints.reduce(
      (
        total,
        point
      ) =>
        total +
        point.comments.length +
        point.shipComments.length,
      0
    );


  const photos =
    checkedPoints.reduce(
      (
        total,
        point
      ) =>
        total +
        point.photos.length,
      0
    );


  const followUps =
    checkedPoints.filter(
      point =>
        point.followUpNeeded
    ).length;


  const completedFollowUps =
    checkedPoints.filter(
      point =>
        point.followUpNeeded &&
        point.shipComments.length > 0
    ).length;


  return {

    total,

    checked,

    comments,

    photos,

    followUps,

    completedFollowUps

  };

}


/* =========================================================
   POINT STATUS
========================================================= */

function getPointStatus(
  point
){

  if(
    point.followUpNeeded
  ){

    if(
      point.shipComments.length > 0
    ){

      return 'FOLLOW-UP COMPLETED';

    }


    return 'FOLLOW-UP NEEDED FROM SHIP';

  }


  return 'CHECKED';

}


/* =========================================================
   PDF IMAGE
========================================================= */

function addPdfImage(
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
        height >
        maxHeight
      ){

        height =
          maxHeight;

        width =
          height *
          ratio;

      }

    }


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

  }catch(error){

    /*
      Some browser-generated images can
      still be inserted without image
      properties. Try PNG next.
    */

    try{

      doc.addImage(
        source,
        'PNG',
        x,
        y,
        maxWidth,
        maxHeight
      );


      return {

        width:maxWidth,

        height:maxHeight

      };

    }catch(secondError){

      console.error(
        'PDF image error:',
        secondError
      );


      return {

        width:0,

        height:0

      };

    }

  }

}


/* =========================================================
   GENERATE PDF
========================================================= */

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
    getMeta();


  const state =
    getState();


  const reviewer =
    getReviewer() ||
    meta.reviewer ||
    'Reviewer';


  /*
    ONLY CHECKED POINTS
  */

  const checkedPoints =
    getCheckedPoints(
      state
    );


  const counts =
    getCounts(
      state,
      checkedPoints
    );


  const doc =
    new jsPDF({

      unit:'pt',

      format:'a4',

      compress:true

    });


  const pageWidth =
    doc.internal.pageSize
      .getWidth();


  const pageHeight =
    doc.internal.pageSize
      .getHeight();


  const margin =
    40;


  const contentWidth =
    pageWidth -
    margin * 2;


  /*
    Virgin Voyages colors.
  */

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


  let y =
    0;


  /* =======================================================
     HEADER
  ======================================================= */

  function header(
    title = 'Ship Visit Report'
  ){

    doc.setFillColor(
      ...squid
    );


    doc.rect(
      0,
      0,
      pageWidth,
      88,
      'F'
    );


    /*
      Simple diagonal Virgin-style
      background detail.
    */

    doc.setDrawColor(
      95,
      45,
      118
    );


    doc.setLineWidth(
      1
    );


    for(
      let x = -100;
      x < pageWidth + 100;
      x += 35
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
      title,
      margin,
      54
    );


    y =
      108;

  }


  /* =======================================================
     FOOTER
  ======================================================= */

  function footer(){

    doc.setFillColor(
      ...dark
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
      7.5
    );


    doc.text(
      'INTERNAL USE ONLY',
      margin,
      pageHeight - 9
    );


    doc.text(
      `${meta.ship || ''} • ${meta.dateOn || ''}`,
      pageWidth - margin,
      pageHeight - 9,
      {
        align:'right'
      }
    );

  }


  /* =======================================================
     NEW PAGE
  ======================================================= */

  function newPage(){

    footer();


    doc.addPage();


    header();

  }


  /* =======================================================
     SPACE
  ======================================================= */

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


  /* =======================================================
     TEXT
  ======================================================= */

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
      (size + 4);


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
      ...color
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


    return lines.length;

  }


  /* =======================================================
     LABEL / VALUE FIELD
  ======================================================= */

  function addInfoField(
    label,
    value
  ){

    ensureSpace(
      35
    );


    const boxHeight =
      30;


    doc.setFillColor(
      ...light
    );


    doc.roundedRect(
      margin,
      y - 13,
      contentWidth,
      boxHeight,
      5,
      5,
      'F'
    );


    doc.setTextColor(
      ...squid
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      7.5
    );


    doc.text(
      label.toUpperCase(),
      margin + 9,
      y
    );


    doc.setFont(
      'helvetica',
      'normal'
    );


    doc.setFontSize(
      9.5
    );


    doc.setTextColor(
      ...dark
    );


    doc.text(
      safeText(
        value
      ),
      margin + 88,
      y
    );


    y +=
      34;

  }


  /* =======================================================
     SECTION TITLE
  ======================================================= */

  function addSectionTitle(
    title
  ){

    ensureSpace(
      35
    );


    doc.setDrawColor(
      ...red
    );


    doc.setLineWidth(
      1.2
    );


    doc.line(
      margin,
      y,
      margin + 45,
      y
    );


    y +=
      14;


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


  /* =======================================================
     POINT
  ======================================================= */

  function addPoint(
    point
  ){

    /*
      Estimate space before beginning.
    */

    ensureSpace(
      55
    );


    const startY =
      y;


    /*
      Point border box is calculated after
      content is written.
    */

    doc.setDrawColor(
      ...squid
    );


    doc.setLineWidth(
      0.7
    );


    /*
      Checked circle.
    */

    doc.setFillColor(
      ...red
    );


    doc.circle(
      margin + 9,
      y - 3,
      8,
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
      8
    );


    doc.text(
      '✓',
      margin + 6.3,
      y
    );


    /*
      Checklist text.
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

    const status =
      getPointStatus(
        point
      );


    let statusColor =
      gray;


    if(
      status ===
      'FOLLOW-UP NEEDED FROM SHIP'
    ){

      statusColor =
        red;

    }


    if(
      status ===
      'FOLLOW-UP COMPLETED'
    ){

      statusColor =
        green;

    }


    y +=
      2;


    addText(
      status,
      {
        size:7.8,
        color:statusColor,
        bold:true,
        x:margin + 24,
        width:contentWidth - 24
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
          size:7.7,
          color:squid,
          bold:true,
          x:margin + 24,
          width:contentWidth - 24
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
        4;


      addText(
        'ATTACHED PHOTOS',
        {
          size:7.7,
          color:squid,
          bold:true,
          x:margin + 24,
          width:contentWidth - 24
        }
      );


      point.photos.forEach(
        photo => {

          ensureSpace(
            165
          );


          const image =
            addPdfImage(
              doc,
              photo,
              margin + 31,
              y,
              145,
              145
            );


          if(
            image.height
          ){

            y +=
              image.height +
              8;

          }

        }
      );

    }


    /*
      Follow-up.
    */

    if(
      point.followUpNeeded
    ){

      y +=
        3;


      addText(
        point.shipComments.length > 0
          ? 'SHIP FOLLOW-UP COMPLETED'
          : 'FOLLOW-UP NEEDED FROM SHIP',
        {
          size:8,
          color:
            point.shipComments.length > 0
              ? green
              : red,
          bold:true,
          x:margin + 24,
          width:contentWidth - 24
        }
      );


      /*
        Ship comments.
      */

      if(
        point.shipComments.length > 0
      ){

        y +=
          2;


        addText(
          'SHIP COMMENTS / RESPONSES',
          {
            size:7.7,
            color:green,
            bold:true,
            x:margin + 24,
            width:contentWidth - 24
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

      }

    }


    /*
      Separator.
    */

    y +=
      5;


    doc.setDrawColor(
      ...[225,220,228]
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
      9;

  }


  /* =======================================================
     START PDF
  ======================================================= */

  header(
    'Ship Visit Report'
  );


  /* =======================================================
     REPORT INFORMATION
  ======================================================= */

  addText(
    'REPORT INFORMATION',
    {
      size:11,
      color:squid,
      bold:true
    }
  );


  y +=
    7;


  addInfoField(
    'Ship',
    meta.ship ||
    ''
  );


  addInfoField(
    'Visit Dates',
    `${meta.dateOn || ''}` +
    (
      meta.dateOff
        ? ` → ${meta.dateOff}`
        : ''
    )
  );


  addInfoField(
    'Reviewer',
    reviewer
  );


  y +=
    3;


  /* =======================================================
     SUMMARY
  ======================================================= */

  addText(
    'REPORT SUMMARY',
    {
      size:11,
      color:squid,
      bold:true
    }
  );


  y +=
    4;


  const summaryBoxHeight =
    54;


  ensureSpace(
    summaryBoxHeight
  );


  doc.setFillColor(
    248,
    246,
    249
  );


  doc.roundedRect(
    margin,
    y - 10,
    contentWidth,
    summaryBoxHeight,
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
    ...dark
  );


  doc.text(
    `${counts.checked} of ${counts.total} points checked`,
    margin + 10,
    summaryY
  );


  doc.setTextColor(
    ...gray
  );


  doc.setFont(
    'helvetica',
    'normal'
  );


  doc.text(
    `${counts.comments} comments`,
    margin + 10,
    summaryY + 15
  );


  doc.text(
    `${counts.photos} photos`,
    margin + 150,
    summaryY + 15
  );


  doc.text(
    `${counts.followUps} follow-up points`,
    margin + 275,
    summaryY + 15
  );


  if(
    counts.followUps > 0
  ){

    doc.setTextColor(
      counts.completedFollowUps ===
      counts.followUps
        ? ...green
        : ...blue
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.text(
      `${counts.completedFollowUps}/${counts.followUps} follow-ups completed`,
      margin + 10,
      summaryY + 31
    );

  }


  y +=
    summaryBoxHeight +
    12;


  /* =======================================================
     INTRO
  ======================================================= */

  addText(
    'The report below contains the checklist points that were checked during the ship visit, together with reviewer comments, attached photos, follow-up requirements and ship responses.',
    {
      size:8.5,
      color:gray,
      width:contentWidth,
      lineHeight:12
    }
  );


  y +=
    8;


  /* =======================================================
     CHECKED POINTS
  ======================================================= */

  let currentSection =
    '';


  if(
    checkedPoints.length === 0
  ){

    addText(
      'No checklist points were checked.',
      {
        size:10,
        color:red,
        bold:true
      }
    );

  }else{

    checkedPoints.forEach(
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


  /* =======================================================
     FINAL FOOTER
  ======================================================= */

  footer();


  /* =======================================================
     FILE NAME
  ======================================================= */

  const safeShip =
    safeText(
      meta.ship ||
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


  const safeDate =
    safeText(
      meta.dateOn ||
      'date'
    )
      .replace(
        /[^0-9-]/g,
        ''
      );


  const filename =
    `Ship_Visit_Report_${safeShip}_${safeDate}.pdf`;


  doc.save(
    filename
  );


  return true;

}


/* =========================================================
   PRINT REPORT
========================================================= */

export function printReport(){

  const meta =
    getMeta();


  const state =
    getState();


  const reviewer =
    getReviewer() ||
    meta.reviewer ||
    'Reviewer';


  const points =
    getCheckedPoints(
      state
    );


  const counts =
    getCounts(
      state,
      points
    );


  /*
    Group by section.
  */

  const groups =
    [];


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


  const reportWindow =
    window.open(
      '',
      '_blank',
      'width=900,height=1000'
    );


  if(
    !reportWindow
  ){

    alert(
      'Please allow pop-ups to print the report.'
    );


    return false;

  }


  reportWindow.document.open();


  reportWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
  Ship Visit Report - ${escapeHtml(
    meta.ship || ''
  )}
</title>


<style>

  * {
    box-sizing:border-box;
  }


  body {

    margin:0;

    padding:25px;

    background:#F8F6F9;

    color:#333;

    font-family:
      Arial,
      Calibri,
      sans-serif;

  }


  .report {

    max-width:900px;

    margin:0 auto;

    background:#FFFFFF;

  }


  .header {

    position:relative;

    padding:28px 32px;

    color:#FFFFFF;

    background:#3C1053;

    overflow:hidden;

  }


  .header::after {

    content:'';

    position:absolute;

    inset:-100px;

    background:
      repeating-linear-gradient(
        45deg,
        transparent 0,
        transparent 35px,
        rgba(255,255,255,.055) 35px,
        rgba(255,255,255,.055) 37px
      );

    pointer-events:none;

  }


  .header-content {

    position:relative;

    z-index:1;

  }


  .eyebrow {

    font-size:11px;

    font-weight:800;

    letter-spacing:.08em;

  }


  .header h1 {

    margin:8px 0 0;

    font-size:28px;

    line-height:1.1;

  }


  .body {

    padding:28px 32px 40px;

  }


  .section-title {

    margin-top:24px;

    margin-bottom:12px;

    padding-bottom:7px;

    border-bottom:2px solid #E10A0A;

    color:#3C1053;

    font-size:17px;

    font-weight:800;

  }


  .info-title {

    margin-bottom:10px;

    color:#3C1053;

    font-size:15px;

    font-weight:800;

  }


  .info-grid {

    display:grid;

    grid-template-columns:
      repeat(3,1fr);

    gap:10px;

    margin-bottom:22px;

  }


  .info-box {

    padding:12px;

    border-radius:7px;

    background:#F8F6F9;

    border:1px solid #E7E1EA;

  }


  .info-label {

    margin-bottom:4px;

    color:#3C1053;

    font-size:8px;

    font-weight:800;

    text-transform:uppercase;

    letter-spacing:.05em;

  }


  .info-value {

    color:#333333;

    font-size:11px;

    line-height:1.4;

    font-weight:600;

  }


  .summary {

    margin-bottom:25px;

    padding:14px;

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
      repeat(4,1fr);

    gap:8px;

  }


  .summary-item {

    padding:8px;

    background:#FFFFFF;

    border:1px solid #E7E1EA;

    border-radius:5px;

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


  .intro {

    margin-bottom:18px;

    color:#8A8A8A;

    font-size:10px;

    line-height:1.5;

  }


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

    gap:9px;

    align-items:flex-start;

  }


  .check {

    width:22px;

    height:22px;

    flex:0 0 22px;

    display:flex;

    align-items:center;

    justify-content:center;

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

    font-weight:800;

  }


  .status.red {

    color:#CC0000;

    background:#FFF1F1;

  }


  .status.green {

    color:#008A52;

    background:#EAF8F0;

  }


  .status.blue {

    color:#2463B8;

    background:#EEF5FF;

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


  .footer {

    margin-top:25px;

    padding-top:10px;

    border-top:1px solid #E7E1EA;

    color:#8A8A8A;

    font-size:8px;

    text-align:center;

  }


  @media print {

    @page {

      size:A4;

      margin:12mm;

    }


    body {

      padding:0;

      background:#FFFFFF;

    }


    .report {

      max-width:none;

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
              style="
                margin-top:8px;
                color:${
                  counts.completedFollowUps ===
                  counts.followUps
                    ? '#008A52'
                    : '#2463B8'
                };
                font-size:9px;
                font-weight:800;
              "
            >

              Follow-Ups Completed:
              ${counts.completedFollowUps}/${counts.followUps}

            </div>

          `
          : ''
      }

    </div>


    <div class="intro">

      The report below contains only the checklist
      points that were checked during the ship visit,
      together with reviewer comments, attached photos,
      follow-up requirements and ship responses.

    </div>


    ${
      groups.length === 0

        ? `

          <div
            style="
              padding:20px;
              text-align:center;
              color:#CC0000;
              font-size:11px;
              font-weight:800;
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
                                ? `

                                  ${
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

                                        <div
                                          style="
                                            margin-top:10px;
                                            color:#CC0000;
                                            font-size:9px;
                                            font-weight:800;
                                          "
                                        >

                                          NO SHIP RESPONSE YET

                                        </div>

                                      `
                                  }

                                `
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

window.onload = function(){

  setTimeout(
    function(){

      window.print();

    },
    300
  );

};

</script>


</body>

</html>

  `);


  reportWindow.document.close();


  return true;

}


/* =========================================================
   FOLLOW-UP PDF
========================================================= */

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
    doc.internal.pageSize
      .getWidth();


  const H =
    doc.internal.pageSize
      .getHeight();


  const margin =
    40;


  const width =
    W -
    margin * 2;


  let y =
    105;


  const squid =
    [60,16,83];


  const red =
    [225,10,10];


  const green =
    [0,138,82];


  const dark =
    [27,27,27];


  const gray =
    [95,95,95];


  function header(){

    doc.setFillColor(
      ...squid
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
      54
    );

  }


  function footer(){

    doc.setFillColor(
      ...dark
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
      7.5
    );


    doc.text(
      'INTERNAL USE ONLY',
      margin,
      H - 9
    );


    doc.text(
      `${meta.ship || ''} • ${meta.dateOn || ''}`,
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


  function space(
    height
  ){

    if(
      y + height >
      H - 38
    ){

      newPage();

    }

  }


  function text(
    value,
    size = 9,
    color = gray,
    x = margin,
    maxWidth = width,
    bold = false
  ){

    const lines =
      doc.splitTextToSize(
        safeText(
          value
        ),
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
      ...color
    );


    lines.forEach(
      line => {

        space(
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


  text(
    `Ship: ${meta.ship}`,
    11,
    dark,
    margin,
    width,
    true
  );


  text(
    `Visit: ${meta.dateOn}` +
    (
      meta.dateOff
        ? ` → ${meta.dateOff}`
        : ''
    ),
    9.5,
    gray
  );


  text(
    `Reviewer: ${meta.reviewer}`,
    9.5,
    gray
  );


  y +=
    8;


  text(
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

      space(
        50
      );


      doc.setDrawColor(
        ...red
      );


      doc.line(
        margin,
        y,
        margin + 40,
        y
      );


      y +=
        13;


      text(
        point.section,
        10,
        squid,
        margin,
        width,
        true
      );


      text(
        point.text,
        10,
        dark,
        margin,
        width,
        true
      );


      y +=
        2;


      text(
        point.shipComments.length
          ? 'FOLLOW-UP COMPLETED'
          : 'FOLLOW-UP NEEDED FROM SHIP',
        8.5,
        point.shipComments.length
          ? green
          : red,
        margin,
        width,
        true
      );


      if(
        point.comments.length
      ){

        y +=
          4;


        text(
          'REVIEWER COMMENTS',
          8,
          squid,
          margin,
          width,
          true
        );


        point.comments.forEach(
          comment => {

            text(
              `${comment.name || 'Reviewer'}: ${comment.text || ''}`,
              9,
              gray,
              margin + 7,
              width - 7
            );

          }
        );

      }


      if(
        point.photos.length
      ){

        y +=
          4;


        text(
          'REVIEWER PHOTOS',
          8,
          squid,
          margin,
          width,
          true
        );


        point.photos.forEach(
          photo => {

            space(
              150
            );


            const image =
              addPdfImage(
                doc,
                photo,
                margin + 7,
                y,
                140,
                140
              );


            if(
              image.height
            ){

              y +=
                image.height +
                8;

            }

          }
        );

      }


      y +=
        4;


      if(
        point.shipComments.length
      ){

        text(
          'SHIP COMMENTS / RESPONSES',
          8,
          green,
          margin,
          width,
          true
        );


        point.shipComments.forEach(
          comment => {

            text(
              `${comment.name || 'Ship'}: ${comment.text || ''}`,
              9,
              green,
              margin + 7,
              width - 7
            );

          }
        );

      }else{

        text(
          'No ship response yet.',
          9,
          red,
          margin + 7,
          width - 7
        );

      }


      y +=
        8;

    }
  );


  footer();


  const safeShip =
    safeText(
      meta.ship ||
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


  doc.save(
    `Ship_Visit_Follow_Up_${safeShip}_${meta.dateOn || 'date'}.pdf`
  );


  return true;

}


/* =========================================================
   PRINT FOLLOW-UP
========================================================= */

export function printFollowUp(){

  window.print();

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  generatePDF,

  generateFollowUpPDF,

  printReport,

  printFollowUp

};
