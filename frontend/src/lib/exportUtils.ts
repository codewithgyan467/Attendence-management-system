/**
 * Utility functions for exporting Attendance Registers and Reports to Excel (.xls), Word (.doc), and PDF/Print.
 */

export interface ExportRegisterData {
  institutionName?: string;
  departmentName?: string;
  subjectCode: string;
  subjectName: string;
  sectionName: string;
  semester: number | string;
  facultyName: string;
  timeframe: string;
  dateRangeStr?: string;
  ncThreshold: number;
  dcThreshold: number;
  sessions: Array<{
    id: string;
    formattedDate: string;
    timeSlot: string;
  }>;
  students: Array<{
    enrollmentNo: string;
    name: string;
    totalHeld: number;
    totalAttended: number;
    totalAbsent: number;
    percentage: number;
    status: 'NORMAL' | 'NC' | 'DC';
    records: Record<string, { status: string }>;
  }>;
}

export function exportRegisterToExcel(data: ExportRegisterData, filename?: string) {
  const safeFilename = (filename || `Attendance_Register_${data.subjectCode}_${data.timeframe}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  
  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Attendance Register</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #999; padding: 6px 10px; text-align: center; }
      th { background-color: #f2f4f8; font-weight: bold; }
      .header-title { font-size: 14pt; font-weight: bold; text-align: left; border: none; }
      .header-sub { font-size: 10pt; color: #555; text-align: left; border: none; }
      .text-left { text-align: left; }
      .status-normal { background-color: #d1e7dd; color: #0f5132; font-weight: bold; }
      .status-nc { background-color: #fff3cd; color: #664d03; font-weight: bold; }
      .status-dc { background-color: #f8d7da; color: #842029; font-weight: bold; }
      .cell-p { background-color: #e8f5e9; color: #2e7d32; font-weight: bold; }
      .cell-a { background-color: #ffebee; color: #c62828; font-weight: bold; }
      .cell-l { background-color: #fff8e1; color: #f57f17; font-weight: bold; }
    </style>
  </head>
  <body>
    <table>
      <tr><td colspan="${7 + data.sessions.length}" class="header-title">${data.institutionName || 'Assam Engineering College'} - ${data.departmentName || 'Department of MCA'}</td></tr>
      <tr><td colspan="${7 + data.sessions.length}" class="header-sub">Course: ${data.subjectName} (${data.subjectCode}) | Section: ${data.sectionName} | Semester: ${data.semester}</td></tr>
      <tr><td colspan="${7 + data.sessions.length}" class="header-sub">Faculty In-Charge: ${data.facultyName} | Report View: ${data.timeframe.toUpperCase()} | Policy: NC &lt; ${data.ncThreshold}%, DC &lt; ${data.dcThreshold}%</td></tr>
      <tr><td colspan="${7 + data.sessions.length}" class="header-sub">Generated On: ${new Date().toLocaleString('en-IN')}</td></tr>
      <tr><td colspan="${7 + data.sessions.length}" style="border:none; height: 12px;"></td></tr>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th class="text-left" style="width: 140px;">Roll / Enrollment No</th>
          <th class="text-left" style="width: 200px;">Student Name</th>
          ${data.sessions.map(s => `<th>${s.formattedDate}<br/><small style="font-size:9px;color:#666;">${s.timeSlot}</small></th>`).join('')}
          <th style="width: 60px;">Total</th>
          <th style="width: 60px;">Present</th>
          <th style="width: 60px;">Absent</th>
          <th style="width: 80px;">Attendance %</th>
          <th style="width: 100px;">Eligibility Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.students.map((st, idx) => {
          const statusClass = st.status === 'NORMAL' ? 'status-normal' : st.status === 'NC' ? 'status-nc' : 'status-dc';
          const statusLabel = st.status === 'NORMAL' ? 'Eligible' : st.status === 'NC' ? `NC (&lt;${data.ncThreshold}%)` : `DC (&lt;${data.dcThreshold}%)`;
          return `
          <tr>
            <td>${idx + 1}</td>
            <td class="text-left">${st.enrollmentNo}</td>
            <td class="text-left">${st.name}</td>
            ${data.sessions.map(s => {
              const rec = st.records[s.id];
              const mark = rec?.status === 'PRESENT' ? 'P' : rec?.status === 'LATE' ? 'L' : 'A';
              const cellClass = mark === 'P' ? 'cell-p' : mark === 'L' ? 'cell-l' : 'cell-a';
              return `<td class="${cellClass}">${mark}</td>`;
            }).join('')}
            <td>${st.totalHeld}</td>
            <td>${st.totalAttended}</td>
            <td>${st.totalAbsent}</td>
            <td><b>${st.percentage}%</b></td>
            <td class="${statusClass}">${statusLabel}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFilename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportRegisterToWord(data: ExportRegisterData, filename?: string) {
  const safeFilename = (filename || `Attendance_Report_${data.subjectCode}_${data.timeframe}`).replace(/[^a-zA-Z0-9_-]/g, '_');

  let html = `
  <html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Attendance Register</title>
    <style>
      @page {
        size: landscape;
        margin: 1.5cm;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 10pt;
        color: #111;
      }
      .title {
        font-size: 16pt;
        font-weight: bold;
        text-align: center;
        margin-bottom: 2px;
      }
      .sub-title {
        font-size: 12pt;
        text-align: center;
        margin-bottom: 12px;
        color: #333;
      }
      .meta-box {
        margin-bottom: 16px;
        border-bottom: 2px solid #222;
        padding-bottom: 8px;
        font-size: 10pt;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th, td {
        border: 1px solid #444;
        padding: 5px 6px;
        text-align: center;
        font-size: 9.5pt;
      }
      th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      .text-left { text-align: left; }
      .sign-section {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
      }
      .sign-box {
        display: inline-block;
        width: 30%;
        text-align: center;
        border-top: 1px solid #444;
        padding-top: 6px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="title">${data.institutionName || 'Assam Engineering College (AEC)'}</div>
    <div class="sub-title">${data.departmentName || 'Department of Master of Computer Applications (MCA)'}</div>
    
    <div class="meta-box">
      <table style="border:none; width:100%;">
        <tr style="border:none;">
          <td style="border:none; text-align:left;"><b>Course / Subject:</b> ${data.subjectName} (${data.subjectCode})</td>
          <td style="border:none; text-align:right;"><b>Section:</b> ${data.sectionName} | <b>Semester:</b> ${data.semester}</td>
        </tr>
        <tr style="border:none;">
          <td style="border:none; text-align:left;"><b>Faculty In-Charge:</b> ${data.facultyName}</td>
          <td style="border:none; text-align:right;"><b>Report Type:</b> ${data.timeframe.toUpperCase()} Register</td>
        </tr>
        <tr style="border:none;">
          <td style="border:none; text-align:left;"><b>Institutional Criteria:</b> Non-Collegiate (NC) &lt; ${data.ncThreshold}% | Dis-Collegiate (DC) &lt; ${data.dcThreshold}%</td>
          <td style="border:none; text-align:right;"><b>Date Generated:</b> ${new Date().toLocaleDateString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th class="text-left" style="width: 130px;">Enrollment No</th>
          <th class="text-left" style="width: 160px;">Student Name</th>
          ${data.sessions.map(s => `<th>${s.formattedDate}</th>`).join('')}
          <th style="width: 50px;">Held</th>
          <th style="width: 50px;">Attended</th>
          <th style="width: 60px;">Rate %</th>
          <th style="width: 90px;">Category</th>
        </tr>
      </thead>
      <tbody>
        ${data.students.map((st, idx) => {
          const category = st.status === 'NORMAL' ? 'Eligible' : st.status === 'NC' ? 'NC (Warning)' : 'DC (Dis-Collegiate)';
          return `
          <tr>
            <td>${idx + 1}</td>
            <td class="text-left">${st.enrollmentNo}</td>
            <td class="text-left">${st.name}</td>
            ${data.sessions.map(s => {
              const rec = st.records[s.id];
              const mark = rec?.status === 'PRESENT' ? 'P' : rec?.status === 'LATE' ? 'L' : 'A';
              return `<td><b>${mark}</b></td>`;
            }).join('')}
            <td>${st.totalHeld}</td>
            <td>${st.totalAttended}</td>
            <td><b>${st.percentage}%</b></td>
            <td><b>${category}</b></td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div style="margin-top: 50px; width: 100%;">
      <table style="border:none; width: 100%;">
        <tr style="border:none;">
          <td style="border:none; text-align:center; width:33%;">
            <br/><br/>
            ___________________________<br/>
            <b>Course Instructor / Faculty</b>
          </td>
          <td style="border:none; text-align:center; width:33%;">
            <br/><br/>
            ___________________________<br/>
            <b>Head of Department (HOD)</b>
          </td>
          <td style="border:none; text-align:center; width:33%;">
            <br/><br/>
            ___________________________<br/>
            <b>Principal / Dean Academic</b>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFilename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printOrSavePdf() {
  window.print();
}
