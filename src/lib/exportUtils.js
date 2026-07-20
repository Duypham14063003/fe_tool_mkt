/**
 * exportUtils.js
 * Chức năng xuất dữ liệu thống kê ra file Excel (.xlsx) hoặc PDF.
 * Sử dụng: SheetJS (xlsx) cho Excel, jsPDF + AutoTable cho PDF.
 */

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FB_COLS = [
    { key: "stt",              label: "STT" },
    { key: "date",             label: "Ngày" },
    { key: "caption",          label: "Nội dung" },
    { key: "views",            label: "Lượt xem" },
    { key: "reach",            label: "Tiếp cận" },
    { key: "likes",            label: "Thích" },
    { key: "comments",         label: "Bình luận" },
    { key: "shares",           label: "Chia sẻ" },
    { key: "saves",            label: "Lưu" },
    { key: "total_time",       label: "Tổng TG xem" },
    { key: "avg_time",         label: "TG xem TB" },
    { key: "watch_through",    label: "Xem hết %" },
    { key: "new_followers",    label: "Theo dõi mới" },
    { key: "traffic_source",   label: "Nguồn traffic" },
    { key: "new_viewers",      label: "Người xem mới" },
    { key: "returning_viewers",label: "Người xem cũ" },
    { key: "male",             label: "Nam" },
    { key: "female",           label: "Nữ" },
    { key: "age_group",        label: "Độ tuổi chính" },
    { key: "region",           label: "Khu vực chính" },
];

const TT_COLS = [
    { key: "stt",        label: "STT" },
    { key: "date",       label: "Ngày" },
    { key: "type",       label: "Loại" },
    { key: "caption",    label: "Nội dung" },
    { key: "reach",      label: "Tiếp cận" },
    { key: "views",      label: "Lượt xem" },
    { key: "engagement", label: "Tương tác" },
    { key: "view_3s",    label: "Xem 3 giây" },
    { key: "view_1m",    label: "Xem 1 phút" },
];

function getSheet(platform, rows, totals) {
    const cols = platform === "facebook" ? FB_COLS : TT_COLS;
    const header = cols.map(c => c.label);
    const data = rows.map(row => cols.map(c => row[c.key] ?? ""));
    let totalsRow = null;
    if (totals) {
        totalsRow = cols.map(c => {
            if (c.key === "stt") return "TỔNG CHUNG";
            return totals[c.key] ?? "--";
        });
    }

    return { cols, header, data, totalsRow };
}
export function exportToExcel({ fbRows, fbTotals, ttRows, ttTotals, includeFb, includeTiktok }) {
    const wb = XLSX.utils.book_new();
    if (includeFb) {
        const { header, data, totalsRow } = getSheet("facebook", fbRows, fbTotals);
        const sheetData = [header, ...data];
        if (totalsRow) sheetData.push(totalsRow);
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [
            { wch: 5 }, { wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 10 },
            { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 14 },
            { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 14 },
            { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 22 }, { wch: 18 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, "Facebook");
    }
    if (includeTiktok) {
        const { header, data, totalsRow } = getSheet("tiktok", ttRows, ttTotals);
        const sheetData = [header, ...data];
        if (totalsRow) sheetData.push(totalsRow);
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [
            { wch: 5 }, { wch: 8 }, { wch: 8 }, { wch: 22 }, { wch: 10 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, "TikTok");
    }
    const fileName = `Bao-cao-Social-${_dateStr()}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
export function exportToPDF({ fbRows, fbTotals, ttRows, ttTotals, includeFb, includeTiktok }) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    // Sử dụng helvetica cho chữ không bị lỗi tiếng Việt không dấu (đối với PDF cơ bản ta dùng chữ không dấu)
    doc.setFont("helvetica");
    let yStart = 14;
    function addSection(platform, rows, totals) {
        const { header, data, totalsRow } = getSheet(platform, rows, totals);
        const platformLabel = platform === "facebook" ? "Facebook" : "TikTok";
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(26, 30, 38);
        doc.text(`Thong ke ${platformLabel}`, 14, yStart);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Ngay xuat: ${new Date().toLocaleDateString("vi-VN")}`, 14, yStart + 6);
        yStart += 12;
        const removeVietnameseTones = (str) => {
            if (typeof str !== "string") return str;
            return str
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/Đ/g, "D");
        };
        const cleanHeader = header.map(h => removeVietnameseTones(h));
        const cleanBody = data.map(row => row.map(cell => removeVietnameseTones(cell)));
        
        if (totalsRow) {
            cleanBody.push(totalsRow.map(cell => removeVietnameseTones(cell)));
        }

        autoTable(doc, {
            startY: yStart,
            head: [cleanHeader],
            body: cleanBody,
            theme: "grid",
            styles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                font: "helvetica",
                overflow: "linebreak",
                textColor: [26, 30, 38],
            },
            headStyles: {
                fillColor: [183, 135, 46],   // var(--gold) = #B7872E
                textColor: 255,
                fontStyle: "bold",
                fontSize: 8,
                halign: "center",
            },
            alternateRowStyles: {
                fillColor: [250, 249, 246],  // var(--cream)
            },
            didParseCell: (data) => {
                if (totalsRow && data.row.index === cleanBody.length - 1) {
                    data.cell.styles.fillColor = [243, 236, 224];
                    data.cell.styles.fontStyle = "bold";
                }
            },
            margin: { left: 10, right: 10 },
        });

        yStart = doc.lastAutoTable.finalY + 16;

        // Trang mới nếu còn phần khác
        if (yStart > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            yStart = 14;
        }
    }

    if (includeFb) addSection("facebook", fbRows, fbTotals);
    if (includeTiktok) addSection("tiktok", ttRows, ttTotals);

    doc.save(`Bao-cao-Social-${_dateStr()}.pdf`);
}

function _dateStr() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
