import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./invoice.css";

/* ---------------- NUMBER TO WORDS ---------------- */

const toWords = (num) => {
  if (!num || num === 0) return "Zero Only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred " + convert(n % 100);
    if (n < 100000)
      return convert(Math.floor(n / 1000)) + " Thousand " + convert(n % 1000);
    return convert(Math.floor(n / 100000)) + " Lakh " + convert(n % 100000);
  };

  return convert(num).trim() + " Only";
};

/* ---------------- FORMATTING ---------------- */

const formatINR = (num) => (num ? Number(num).toLocaleString("en-IN") : "");

const formatWithSlash = (num) => (num ? `${formatINR(num)}/-` : "");

/* ---------------- COMPONENT ---------------- */

export default function InvoicePage() {
  const [billNo, setBillNo] = useState("001");
  const [billDate, setBillDate] = useState("2026-01-28");
  const [partyName, setPartyName] = useState("Sam Stone");

  const [rows, setRows] = useState([
    {
      sr: 1,
      date: "",
      truck: "",
      from: "",
      to: "",
      weight: "",
      rate: "",
      detention: "",
      amount: "",
      remarks: "",
    },
  ]);

  const addRow = () => {
    setRows([
      ...rows,
      {
        sr: rows.length + 1,
        date: "",
        truck: "",
        from: "",
        to: "",
        weight: "",
        rate: "",
        detention: "",
        amount: "",
        remarks: "",
      },
    ]);
  };

  const updateRow = (i, field, value) => {
    const updated = [...rows];
    updated[i][field] = value;
    setRows(updated);
  };

  const totalAmount = rows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0,
  );

  /* ---------------- PDF GENERATOR ---------------- */

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const leftMargin = 15;
    const rightMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - leftMargin - rightMargin;
    const rightX = pageWidth - rightMargin;

    /* ---------------- HEADER ---------------- */

    doc.setFont("times", "normal");
    doc.setFontSize(11);

    /* ---------------- TOP HEADER (BILL + DATE) ---------------- */

    doc.setFont("times", "normal");
    doc.setFontSize(11);

    const formatDateDDMMYYYY = (dateStr) => {
      if (!dateStr) return "";

      const [year, month, day] = dateStr.split("-");
      return `${day}-${month}-${year}`;
    };

    const headerY = 40;

    doc.text(`Bill No : ${billNo}`, 14, headerY);

    doc.text(`Date : ${formatDateDDMMYYYY(billDate)}`, rightX, headerY, {
      align: "right",
    });

    /* ---------------- TITLE ---------------- */

    doc.setFont("times", "bold");
    doc.setFontSize(18);

    const titleText = "Tax / Retail Invoice";
    const titleY = headerY + 12;

    doc.text(titleText, pageWidth / 2, titleY, { align: "center" });

    /* Title underline */

    const titleWidth = doc.getTextWidth(titleText);

    doc.line(
      pageWidth / 2 - titleWidth / 2,
      titleY + 2.5,
      pageWidth / 2 + titleWidth / 2,
      titleY + 2.5,
    );

    /* -------- PARTY NAME -------- */

    doc.setFont("times", "bold");
    doc.setFontSize(11);

    const partyText = `Party Name : ${partyName}`;
    const partyY = titleY + 9;

    doc.text(partyText, 14, partyY);

    /* Dynamic underline */

    const partyWidth = doc.getTextWidth(partyText);

    doc.line(14, partyY + 2, 14 + partyWidth, partyY + 2);

    /* -------- TRANSPORT TITLE -------- */

    doc.setFontSize(12);
    doc.setFont("times", "bold");

    const transportText = "Transportation Charges as mentioned below";
    const transportY = partyY + 9;

    doc.text(transportText, pageWidth / 2, transportY, {
      align: "center",
    });

    /* Dynamic underline */
 
  
    const transportWidth = doc.getTextWidth(transportText);

    doc.line(
      pageWidth / 2 - transportWidth / 2,
      transportY + 2.5,
      pageWidth / 2 + transportWidth / 2,
      transportY + 2.5,
    );

    /* ---------------- TABLE ---------------- */

    const headRows = [
      // PARTICULARS TITLE ROW
      [
        {
          content: "Particulars",
          colSpan: 10,
          styles: {
            halign: "center",
            fontStyle: "bold",
            fontSize: 11,
          },
        },
      ],

      // NORMAL HEADER ROW
      [
        "Sr No",
        "Date",
        "Truck",
        "From",
        "To",
        "Weight",
        "Rate",
        "Detention",
        "Amount",
        "Remarks",
      ],
    ];

    const body = [
      ...rows.map((r) => [
        r.sr,
        r.date,
        r.truck,
        r.from,
        r.to,
        r.weight,
        formatWithSlash(r.rate),
        formatWithSlash(r.detention),
        formatWithSlash(r.amount),
        r.remarks,
      ]),

      /* TOTAL ROW */

      [
        {
          content: "TOTAL",
          colSpan: 8,
          styles: { halign: "center", fontStyle: "bold" },
        }, 
        {
          content: formatWithSlash(totalAmount),
          styles: { halign: "right", fontStyle: "bold" },
        },
        "",
      ],

      /* RUPEES ROW */

      [
        {
          content: `Rupees : ${toWords(totalAmount)}`,
          colSpan: 10,
          styles: { halign: "left", fontStyle: "bold" },
        },
      ],
    ];

    autoTable(doc, {
      head: headRows,
      body: body,

      startY: 78,

      margin: {
        left: leftMargin,
        right: rightMargin,
      },

      tableWidth: usableWidth,

      theme: "grid",

      styles: {
        font: "times",
        fontSize: 10,
        cellPadding: 4,
        halign: "center",
        valign: "middle",

        // 🔥 IMPORTANT: enable wrapping
        overflow: "linebreak",
        cellWidth: "wrap",

        lineWidth: 0.4,
        lineColor: [0, 0, 0],
      },

      headStyles: {
        fontStyle: "bold",
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.4,
        lineColor: [0, 0, 0],
      },

      bodyStyles: {
        lineWidth: 0.4,
        lineColor: [0, 0, 0],
      },

      footStyles: {
        lineWidth: 0.4,
        lineColor: [0, 0, 0],
      },

      // 🔥 Column width control for better wrapping
      columnStyles: {
        0: { cellWidth: 8 }, // Sr
        1: { cellWidth: 16 }, // Date
        2: { cellWidth: 22 }, // Truck
        3: { cellWidth: 22 }, // From
        4: { cellWidth: 22 }, // To
        5: { cellWidth: 16 }, // Weight
        6: { cellWidth: 18 }, // Rate
        7: { cellWidth: 18 }, // Detention
        8: { cellWidth: 20 }, // Amount
        9: { cellWidth: "auto" }, // Remarks wraps freely
      },

      // 🔥 Prevent row cutting across pages
      rowPageBreak: "avoid",

      didParseCell: function (data) {
        if (data.row.section === "head" && data.row.index === 0) {
          data.cell.styles.fontSize = 11;
          data.cell.styles.fontStyle = "bold";
        }

        if (data.row.raw?.[0]?.content === "TOTAL") {
          data.cell.styles.fontStyle = "bold";
        }

        if (
          typeof data.row.raw?.[0]?.content === "string" &&
          data.row.raw[0].content.startsWith("Rupees")
        ) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY + 6;

    /* ---------------- FOOTER ---------------- */

    const footerStart = finalY + 10;

    doc.setFont("times", "bold");
    doc.setFontSize(10);

    /* LEFT — BANK NAME */

    doc.text("Punjab National Bank", leftMargin, footerStart);

    /* UNDERLINE BANK NAME */
    doc.line(leftMargin, footerStart + 1.5, leftMargin + 55, footerStart + 1.5);

    /* RIGHT — COMPANY NAME (SAME LINE) */

    doc.text("For, Umiya Roadways", rightX, footerStart, { align: "right" });

    /* UNDERLINE COMPANY NAME */
    doc.line(rightX - 55, footerStart + 1.5, rightX, footerStart + 1.5);

    /* BRANCH (LEFT) */

    doc.text("BRANCH : Vastral, Ahmedabad", leftMargin, footerStart + 7);

    /* UNDERLINE BRANCH */
    doc.line(leftMargin, footerStart + 8.5, leftMargin + 70, footerStart + 8.5);

    /* ACCOUNT DETAILS */

    doc.setFont("times", "normal");

    doc.text("A/C No : 9556002100000080", leftMargin, footerStart + 14);
    doc.text("IFSC : PUNB0955600", leftMargin, footerStart + 20);
    doc.text("PAN : BHEPP5358Q", leftMargin, footerStart + 26);

    doc.save("Bill.pdf");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="page-wrap">
      <div className="bill-page">
        <div className="header">
          <div>
            Bill No :
            <input
              className="plain-input"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
            />
          </div>

          <div>
            Date :
            <input
              type="date"
              className="date-input"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>
        </div>

        <h3 className="title">
          <u>Tax / Retail Invoice</u>
        </h3>

        <div className="party">
          <u>PARTY NAME</u> :
          <input
            className="plain-input wide"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
          />
        </div>

        <div className="transport-text">
          Transportation Charges as mentioned below
        </div>

        <table className="bill-table">
          <thead>
            {/* PARTICULARS ROW */}
            <tr>
              <th colSpan="10" style={{ fontSize: "14px", padding: "10px" }}>
                Particulars
              </th>
            </tr>

            {/* COLUMN HEADERS */}
            <tr>
              <th>Sr</th>
              <th>Date</th>
              <th>Truck</th>
              <th>From</th>
              <th>To</th>
              <th>Weight</th>
              <th>Rate</th>
              <th>Detention</th>
              <th>Amount</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{row.sr}</td>

                {[
                  "date",
                  "truck",
                  "from",
                  "to",
                  "weight",
                  "rate",
                  "detention",
                  "amount",
                  "remarks",
                ].map((field) => (
                  <td key={field}>
                    <input
                      value={
                        ["rate", "detention", "amount"].includes(field)
                          ? formatWithSlash(row[field])
                          : row[field]
                      }
                      onChange={(e) =>
                        updateRow(
                          i,
                          field,
                          ["rate", "detention", "amount"].includes(field)
                            ? e.target.value.replace(/[^0-9]/g, "")
                            : e.target.value,
                        )
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}

            <tr className="total-row">
              <td colSpan="8">TOTAL</td>
              <td>{formatWithSlash(totalAmount)}</td>
              <td></td>
            </tr>

            <tr className="rupees-row">
              <td colSpan="10">Rupees : {toWords(totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="add-row" onClick={addRow}>
          + Add Row
        </div>
      </div>

      {/* FOOTER UI */}

      <div className="footer">
        <div className="footer-bold">
          <div>
            <u>Punjab National Bank</u>
          </div>
          <div>
            <u>BRANCH: VASTRAL, AHMEDABAD</u>
          </div>
          <div>A/C NO.: 9556002100000080</div>
          <div>IFSC CODE: PUNB0955600</div>
          <div>PAN: BHEPP5358Q</div>
        </div>

        <div className="footer-title">
          <u>For, Umiya Roadways</u>
        </div>
      </div>

      <button className="pdf-btn" onClick={generatePDF}>
        Generate PDF
      </button>
    </div>
  );
}
