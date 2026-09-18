/*
  pdf.js

  Generates the Ship Visit Report PDF.

  PDF includes:

  - Ship
  - Visit dates
  - Reviewer
  - Overall report
  - Every checklist point
  - Review status
  - Reviewer comments
  - Reviewer photos
  - Follow-Up Needed from Ship
  - Ship comments / responses
  - Follow-up status

  Photos remain attached to the exact checklist point.
*/


import {
  SECTIONS
} from './data.js';


import {
  getMeta,
  getState,
  getReviewer,
  getReportStatus
} from './state.js';


/* =========================================================
   LOAD jsPDF
========================================================= */

function getJsPDF() {

  if (
    window.jspdf &&
    window.jspdf.jsPDF
  ) {

    return window.jspdf.jsPDF;

  }


  return null;

}


/* =========================================================
   ESCAPE
========================================================= */

function safeText(
  value
) {

  return String(
    value ?? ''
  );

}


/* =========================================================
   STATUS
========================================================= */

function pointStatus(
  item
) {

  if (
    item.followUpNeeded
  ) {

    if (
      Array.isArray(
        item.shipComments
      ) &&
      item.shipComments.length
    ) {

      return 'FOLLOW-UP COMPLETED';

    }


    return 'FOLLOW-UP NEEDED FROM SHIP';

  }


  if (
    item.checked
  ) {

    return 'CHECKED';

  }


  return 'NOT CHECKED';

}


/* =========================================================
   REPORT COUNTS
========================================================= */

function getCounts(
  state
) {

  let total =
    0;

  let checked =
    0;

  let comments =
    0;

  let photos =
    0;

  let followUps =
    0;

  let completedFollowUps =
    0;


  Object.values(
    state || {}
  )
  .forEach(
    item => {

      total++;


      if (
        item.checked
      ) {

        checked++;

      }


      comments +=
        Array.isArray(
          item.comments
        )
          ? item.comments.length
          : 0;


      comments +=
        Array.isArray(
          item.shipComments
        )
          ? item.shipComments.length
          : 0;


      photos +=
        Array.isArray(
          item.photos
        )
          ? item.photos.length
          : 0;


      if (
        item.followUpNeeded
      ) {

        followUps++;


        if (
          Array.isArray(
            item.shipComments
          ) &&
          item.shipComments.length
        ) {

          completedFollowUps++;

        }

      }

    }
  );


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
   PDF GENERATOR
========================================================= */

export function generatePDF(){

  const jsPDF =
    getJsPDF();


  if (
    !jsPDF
  ) {

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


  const counts =
    getCounts(
      state
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


  let y =
    84;


  const squid =
    [60,16,83];


  const red =
    [225,10,10];


  const green =
    [25,135,84];


  const blue =
    [43,93,168];


  const dark =
    [27,27,27];


  const gray =
    [95,95,95];


  /* =======================================================
     HEADER
  ======================================================= */

  function drawHeader(
    pageTitle = 'Ship Visit Report'
  ) {

    doc.setFillColor(
      ...squid
    );


    doc.rect(
      0,
      0,
      pageWidth,
      68,
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
      24
    );


    doc.setFontSize(
      16
    );


    doc.text(
      pageTitle,
      margin,
      47
    );


    y =
      84;

  }


  /* =======================================================
     FOOTER
  ======================================================= */

  function drawFooter() {

    doc.setFillColor(
      ...dark
    );


    doc.rect(
      0,
      pageHeight - 25,
      pageWidth,
      25,
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
      8
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

  function newPage() {

    drawFooter();

    doc.addPage();

    drawHeader();

  }


  /* =======================================================
     CHECK SPACE
  ======================================================= */

  function checkSpace(
    height
  ) {

    if (
      y + height >
      pageHeight - 38
    ) {

      newPage();

    }

  }


  /* =======================================================
     TEXT
  ======================================================= */

  function addText(
    text,
    options = {}
  ) {

    const size =
      options.size ||
      9.5;


    const width =
      options.width ||
      contentWidth;


    const x =
      options.x ||
      margin;


    const color =
      options.color ||
      gray;


    const bold =
      Boolean(
        options.bold
      );


    const lineHeight =
      options.lineHeight ||
      size + 4;


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


    const lines =
      doc.splitTextToSize(
        safeText(
          text
        ),
        width
      );


    lines.forEach(
      line => {

        checkSpace(
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


  /* =======================================================
     IMAGE
  ======================================================= */

  function addImage(
    source
  ) {

    if (
      !source
    ) {

      return;

    }


    const imageWidth =
      Math.min(
        150,
        contentWidth
      );


    const imageHeight =
      150;


    checkSpace(
      imageHeight + 12
    );


    try {

      doc.addImage(
        source,
        'JPEG',
        margin + 20,
        y,
        imageWidth,
        imageHeight
      );


      y +=
        imageHeight + 10;

    } catch(error) {

      console.error(
        'Could not add image to PDF:',
        error
      );

    }

  }


  /* =======================================================
     INITIAL HEADER
  ======================================================= */

  drawHeader();


  /* =======================================================
     REPORT INFORMATION
  ======================================================= */

  addText(
    `Ship: ${meta.ship || ''}`,
    {
      size:11,
      color:dark,
      bold:true
    }
  );


  addText(
    `Date On: ${meta.dateOn || ''}`,
    {
      size:10,
      color:dark
    }
  );


  addText(
    `Date Off: ${meta.dateOff || ''}`,
    {
      size:10,
      color:dark
    }
  );


  addText(
    `Reviewer: ${reviewer}`,
    {
      size:10,
      color:dark
    }
  );


  y += 5;


  /* =======================================================
     SUMMARY KPI LINE
  ======================================================= */

  addText(
    `${counts.checked}/${counts.total} CHECKED    •    ` +
    `${counts.comments} COMMENTS    •    ` +
    `${counts.photos} PHOTOS    •    ` +
    `${counts.followUps} FOLLOW-UPS`,
    {
      size:9,
      color:red,
      bold:true
    }
  );


  y += 6;


  /* =======================================================
     OVERALL
  ======================================================= */

  addText(
    'REPORT OVERALL',
    {
      size:12,
      color:squid,
      bold:true
    }
  );


  y += 2;


  const overall =
    document.getElementById(
      'overall-summary'
    ) ||
    document.getElementById(
      'overall'
    );


  if (
    overall
  ) {

    addText(
      overall.value,
      {
        size:9.5,
        color:gray,
        width:contentWidth
      }
    );

  } else {

    addText(
      `Ship visit report for ${meta.ship || ''}. ` +
      `${counts.checked} of ${counts.total} points were checked. ` +
      `${counts.followUps} points require follow-up from the ship.`,
      {
        size:9.5,
        color:gray
      }
    );

  }


  y += 9;


  /* =======================================================
     EACH SECTION
  ======================================================= */

  SECTIONS.forEach(
    section => {

      checkSpace(
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
        margin + 38,
        y
      );


      y += 14;


      addText(
        section.title,
        {
          size:12,
          color:squid,
          bold:true
        }
      );


      y += 3;


      section.items.forEach(
        (text,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key] ||
            {

              checked:false,

              comments:[],

              photos:[],

              followUpNeeded:false,

              shipComments:[]

            };


          checkSpace(
            20
          );


          const status =
            pointStatus(
              item
            );


          let statusColor =
            gray;


          if (
            status ===
            'FOLLOW-UP NEEDED FROM SHIP'
          ) {

            statusColor =
              red;

          }


          if (
            status ===
            'FOLLOW-UP COMPLETED'
          ) {

            statusColor =
              green;

          }


          if (
            status ===
            'CHECKED'
          ) {

            statusColor =
              gray;

          }


          /*
            Point status
          */

          addText(
            item.checked
              ? '[x]'
              : '[ ]',
            {
              size:9,
              color:
                item.checked
                  ? gray
                  : red,
              bold:true,
              width:20,
              x:margin
            }
          );


          /*
            Point text
          */

          const pointStartY =
            y;


          const lines =
            doc.splitTextToSize(
              safeText(
                text
              ),
              contentWidth - 65
            );


          doc.setFont(
            'helvetica',
            'normal'
          );


          doc.setFontSize(
            9.2
          );


          doc.setTextColor(
            60,
            60,
            60
          );


          lines.forEach(
            line => {

              checkSpace(
                12
              );


              doc.text(
                line,
                margin + 21,
                y
              );


              y += 12;

            }
          );


          /*
            Status line
          */

          y += 1;


          addText(
            status,
            {
              size:8,
              color:statusColor,
              bold:true,
              x:margin + 21,
              width:contentWidth - 25
            }
          );


          /*
            Reviewer comments
          */

          if (
            item.comments &&
            item.comments.length
          ) {

            y += 1;


            addText(
              'REVIEWER COMMENTS',
              {
                size:8,
                color:squid,
                bold:true,
                x:margin + 21,
                width:contentWidth - 25
              }
            );


            item.comments.forEach(
              comment => {

                addText(
                  `— ${comment.name || 'Reviewer'}: ${comment.text || ''}`,
                  {
                    size:8.5,
                    color:gray,
                    x:margin + 28,
                    width:contentWidth - 35
                  }
                );

              }
            );

          }


          /*
            Photos
          */

          if (
            item.photos &&
            item.photos.length
          ) {

            y += 2;


            addText(
              'ATTACHED PHOTOS',
              {
                size:8,
                color:squid,
                bold:true,
                x:margin + 21,
                width:contentWidth - 25
              }
            );


            item.photos.forEach(
              photo => {

                addImage(
                  photo
                );

              }
            );

          }


          /*
            Follow-up
          */

          if (
            item.followUpNeeded
          ) {

            y += 2;


            addText(
              'FOLLOW-UP NEEDED FROM SHIP',
              {
                size:8,
                color:red,
                bold:true,
                x:margin + 21,
                width:contentWidth - 25
              }
            );


            /*
              Ship responses
            */

            if (
              item.shipComments &&
              item.shipComments.length
            ) {

              y += 1;


              addText(
                'SHIP COMMENTS / RESPONSES',
                {
                  size:8,
                  color:green,
                  bold:true,
                  x:margin + 21,
                  width:contentWidth - 25
                }
              );


              item.shipComments.forEach(
                comment => {

                  addText(
                    `— ${comment.name || 'Ship'}: ${comment.text || ''}`,
                    {
                      size:8.5,
                      color:green,
                      x:margin + 28,
                      width:contentWidth - 35
                    }
                  );

                }
              );

            } else {

              addText(
                'No ship response yet.',
                {
                  size:8.5,
                  color:red,
                  x:margin + 28,
                  width:contentWidth - 35
                }
              );

            }

          }


          /*
            Separator
          */

          y += 6;

        }
      );


      y += 5;

    }
  );


  /* =======================================================
     FINAL PAGE FOOTER
  ======================================================= */

  drawFooter();


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
   GENERATE FOLLOW-UP PDF
========================================================= */

export function generateFollowUpPDF(
  report
) {

  /*
    This function is used when reviewing
    Points To Follow Up from a submitted report.

    It displays only the follow-up points,
    including reviewer photos and all
    ship responses.
  */

  const jsPDF =
    getJsPDF();


  if (
    !jsPDF
  ) {

    alert(
      'PDF library is not available.'
    );

    return false;

  }


  if (
    !report
  ) {

    alert(
      'No report selected.'
    );

    return false;

  }


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
    82;


  const squid =
    [60,16,83];


  const red =
    [225,10,10];


  const green =
    [25,135,84];


  const dark =
    [27,27,27];


  const gray =
    [90,90,90];


  function header(){

    doc.setFillColor(
      ...squid
    );


    doc.rect(
      0,
      0,
      W,
      68,
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
      24
    );


    doc.setFontSize(
      16
    );


    doc.text(
      'Points To Follow Up',
      margin,
      47
    );


    y =
      84;

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
      8
    );


    doc.text(
      'INTERNAL USE ONLY',
      margin,
      H - 9
    );


    doc.text(
      `${report.ship || ''} • ${report.date_on || ''}`,
      W - margin,
      H - 9,
      {
        align:'right'
      }
    );

  }


  function space(
    amount
  ){

    if(
      y + amount >
      H - 38
    ){

      footer();

      doc.addPage();

      header();

    }

  }


  function text(
    value,
    size = 9.5,
    color = gray,
    x = margin,
    maxWidth = width,
    bold = false
  ){

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


    const lines =
      doc.splitTextToSize(
        safeText(
          value
        ),
        maxWidth
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


  function image(
    source
  ){

    if(
      !source
    ){

      return;

    }


    space(
      165
    );


    try{

      doc.addImage(
        source,
        'JPEG',
        margin + 20,
        y,
        145,
        145
      );


      y +=
        153;

    }catch(error){

      console.error(
        'Follow-up PDF image error:',
        error
      );

    }

  }


  header();


  text(
    `Ship: ${report.ship || ''}`,
    11,
    dark,
    margin,
    width,
    true
  );


  text(
    `Visit: ${report.date_on || ''}` +
    (
      report.date_off
        ? ` → ${report.date_off}`
        : ''
    ),
    9.5,
    gray
  );


  text(
    `Reviewer: ${report.reviewer || ''}`,
    9.5,
    gray
  );


  y += 8;


  const state =
    report.report_data?.state ||
    {};


  const followUps = [];


  SECTIONS.forEach(
    section => {

      section.items.forEach(
        (itemText,index) => {

          const key =
            `${section.id}__${index}`;


          const item =
            state[key];


          if(
            item &&
            item.followUpNeeded
          ){

            followUps.push({

              section:
                section.title,

              text:
                itemText,

              item

            });

          }

        }
      );

    }
  );


  text(
    `FOLLOW-UP POINTS: ${followUps.length}`,
    10,
    red,
    margin,
    width,
    true
  );


  y += 7;


  followUps.forEach(
    point => {

      space(
        25
      );


      doc.setDrawColor(
        ...red
      );


      doc.line(
        margin,
        y,
        margin + 38,
        y
      );


      y += 13;


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


      y += 2;


      text(
        'FOLLOW-UP NEEDED FROM SHIP',
        8.5,
        red,
        margin,
        width,
        true
      );


      /*
        Reviewer comments
      */

      if(
        Array.isArray(
          point.item.comments
        ) &&
        point.item.comments.length
      ){

        y += 4;


        text(
          'REVIEWER COMMENTS',
          8,
          squid,
          margin,
          width,
          true
        );


        point.item.comments.forEach(
          comment => {

            text(
              `— ${comment.name || 'Reviewer'}: ${comment.text || ''}`,
              9,
              gray,
              margin + 7,
              width - 7
            );

          }
        );

      }


      /*
        Reviewer photos
      */

      if(
        Array.isArray(
          point.item.photos
        ) &&
        point.item.photos.length
      ){

        y += 4;


        text(
          'REVIEWER PHOTOS',
          8,
          squid,
          margin,
          width,
          true
        );


        point.item.photos.forEach(
          photo => {

            image(
              photo
            );

          }
        );

      }


      /*
        Ship responses
      */

      y += 4;


      if(
        Array.isArray(
          point.item.shipComments
        ) &&
        point.item.shipComments.length
      ){

        text(
          'SHIP COMMENTS / RESPONSES',
          8,
          green,
          margin,
          width,
          true
        );


        point.item.shipComments.forEach(
          comment => {

            text(
              `— ${comment.name || 'Ship'}: ${comment.text || ''}`,
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


      y += 8;

    }
  );


  footer();


  const ship =
    safeText(
      report.ship ||
      'Ship'
    )
      .replace(
        /\s+/g,
        '_'
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        ''
      );


  doc.save(
    `Ship_Visit_Follow_Up_${ship}_${report.date_on || 'date'}.pdf`
  );


  return true;

}


/* =========================================================
   PRINT CURRENT REPORT
========================================================= */

export function printReport(){

  window.print();

}


/* =========================================================
   PRINT FOLLOW-UP REPORT
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
