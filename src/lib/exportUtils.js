/**
 * exportUtils.js
 * Chức năng xuất dữ liệu thống kê Facebook & TikTok ra file Excel (.xlsx) hoặc PDF.
 * Khớp 100% định dạng, tiêu đề cột, màu sắc bảng và hỗ trợ tiếng Việt đầy đủ.
 */

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FB_COLS = [
    { key: "stt",              label: "STT" },
    { key: "date",             label: "Ngày" },
    { key: "caption",          label: "Caption" },
    { key: "views",            label: "Lượt xem" },
    { key: "reach",            label: "Người xem" },
    { key: "likes",            label: "Like" },
    { key: "comments",         label: "Bình luận" },
    { key: "shares",           label: "Chia sẻ" },
    { key: "saves",            label: "Lưu video" },
    { key: "total_time",       label: "Tổng thời gian phát" },
    { key: "avg_time",         label: "Thời gian xem TB" },
    { key: "watch_through",    label: "Tỷ lệ xem hết" },
    { key: "new_followers",    label: "Follow mới" },
    { key: "traffic_source",   label: "Nguồn chính" },
    { key: "new_viewers",      label: "Người xem mới" },
    { key: "returning_viewers",label: "Người xem quay lại" },
    { key: "male",             label: "Nam" },
    { key: "female",           label: "Nữ" },
    { key: "age_group",        label: "Độ tuổi chính" },
    { key: "region",           label: "Khu vực chính" },
];

const TT_COLS = [
    { key: "stt",        label: "STT" },
    { key: "date",       label: "Ngày đăng" },
    { key: "type",       label: "Loại" },
    { key: "caption",    label: "Caption" },
    { key: "reach",      label: "Reach" },
    { key: "views",      label: "Lượt xem" },
    { key: "engagement", label: "Tương tác" },
    { key: "view_3s",    label: "Xem từ 3s" },
    { key: "view_1m",    label: "Xem từ 1 phút" },
];

function removeVietnameseTones(str) {
    if (typeof str !== "string") return str;
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

async function ensureVietnameseFont(doc) {
    try {
        const [regRes, boldRes] = await Promise.all([
            fetch("https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/roboto/Roboto-Regular.ttf"),
            fetch("https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/roboto/Roboto-Bold.ttf")
        ]);
        if (regRes.ok && boldRes.ok) {
            const [regBuf, boldBuf] = await Promise.all([
                regRes.arrayBuffer(),
                boldRes.arrayBuffer()
            ]);
            const arrayBufferToBase64 = (buffer) => {
                let binary = "";
                const bytes = new Uint8Array(buffer);
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            };

            doc.addFileToVFS("Roboto-Regular.ttf", arrayBufferToBase64(regBuf));
            doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

            doc.addFileToVFS("Roboto-Bold.ttf", arrayBufferToBase64(boldBuf));
            doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

            doc.setFont("Roboto");
            return "Roboto";
        }
    } catch (err) {
        console.warn("Khong the tải Roboto font cho PDF, dung font mặc định helvetica", err);
    }
    doc.setFont("helvetica");
    return "helvetica";
}

export function exportToExcel({ fbRows = [], fbTotals = null, ttRows = [], ttTotals = null, includeFb = true, includeTiktok = true }) {
    const wb = XLSX.utils.book_new();

    if (includeFb) {
        const header = FB_COLS.map(c => c.label);
        const data = fbRows.map(row => FB_COLS.map(c => row[c.key] ?? ""));
        const totalsRow = fbTotals ? [
            "TỔNG",
            fbTotals.videos || "14 video",
            "--",
            fbTotals.views || "",
            fbTotals.reach || "",
            fbTotals.likes || "",
            fbTotals.comments || "",
            fbTotals.shares || "",
            fbTotals.saves || "",
            fbTotals.total_time || "",
            fbTotals.avg_time || "--",
            fbTotals.watch_through || "--",
            fbTotals.new_followers || "",
            fbTotals.traffic_source || "--",
            fbTotals.new_viewers || "--",
            fbTotals.returning_viewers || "--",
            fbTotals.male || "--",
            fbTotals.female || "--",
            fbTotals.age_group || "--",
            fbTotals.region || "--"
        ] : null;

        const sheetData = [header, ...data];
        if (totalsRow) sheetData.push(totalsRow);

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [
            { wch: 6 }, { wch: 10 }, { wch: 25 }, { wch: 10 }, { wch: 12 },
            { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 18 },
            { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 16 },
            { wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 24 }, { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, "Facebook");
    }

    if (includeTiktok) {
        const header = TT_COLS.map(c => c.label);
        const data = ttRows.map(row => TT_COLS.map(c => row[c.key] ?? ""));
        const totalsRow = ttTotals ? [
            ttTotals.videos || "TỔNG 14 VIDEO",
            "",
            "",
            "",
            ttTotals.reach || "",
            ttTotals.views || "",
            ttTotals.engagement || "",
            ttTotals.view_3s || "",
            ttTotals.view_1m || ""
        ] : null;

        const sheetData = [header, ...data];
        if (totalsRow) sheetData.push(totalsRow);

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [
            { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 10 },
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, "TikTok");
    }

    const fileName = `Bao-cao-Social-${_dateStr()}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

export async function exportToPDF({ fbRows = [], fbTotals = null, ttRows = [], ttTotals = null, includeFb = true, includeTiktok = true }) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const fontName = await ensureVietnameseFont(doc);
    const cleanText = (val) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        return fontName === "helvetica" ? removeVietnameseTones(str) : str;
    };

    let firstPage = true;

    // Render Facebook Section
    if (includeFb && fbRows.length > 0) {
        firstPage = false;
        const header = FB_COLS.map(c => cleanText(c.label));
        const body = fbRows.map(row => FB_COLS.map(c => cleanText(row[c.key] ?? "")));

        if (fbTotals) {
            body.push([
                cleanText("TỔNG"),
                cleanText(fbTotals.videos || "14 video"),
                cleanText("--"),
                cleanText(fbTotals.views || ""),
                cleanText(fbTotals.reach || ""),
                cleanText(fbTotals.likes || ""),
                cleanText(fbTotals.comments || ""),
                cleanText(fbTotals.shares || ""),
                cleanText(fbTotals.saves || ""),
                cleanText(fbTotals.total_time || ""),
                cleanText("--"),
                cleanText("--"),
                cleanText(fbTotals.new_followers || ""),
                cleanText("--"),
                cleanText("--"),
                cleanText("--"),
                cleanText("--"),
                cleanText("--"),
                cleanText("--"),
                cleanText("--")
            ]);
        }

        autoTable(doc, {
            startY: 10,
            head: [header],
            body: body,
            theme: "grid",
            styles: {
                font: fontName,
                fontSize: 6.5,
                cellPadding: 1.8,
                overflow: "linebreak",
                textColor: [26, 30, 38],
                lineWidth: 0.15,
                lineColor: [200, 200, 200]
            },
            headStyles: {
                fillColor: [208, 217, 234], // Soft ice blue #D0D9EA
                textColor: [0, 0, 0],
                fontStyle: "bold",
                fontSize: 7,
                halign: "center",
                valign: "middle"
            },
            columnStyles: {
                0: { halign: "center", fontStyle: "bold" },
                1: { halign: "center" },
                2: { halign: "left" },
                3: { halign: "center" },
                4: { halign: "center" },
                5: { halign: "center" },
                6: { halign: "center" },
                7: { halign: "center" },
                8: { halign: "center" },
                9: { halign: "center" },
                10: { halign: "center" },
                11: { halign: "center" },
                12: { halign: "center" },
                13: { halign: "left" },
                14: { halign: "center" },
                15: { halign: "center" },
                16: { halign: "center" },
                17: { halign: "center" },
                18: { halign: "left" },
                19: { halign: "left" }
            },
            didParseCell: (data) => {
                if (fbTotals && data.row.index === body.length - 1) {
                    data.cell.styles.fillColor = [226, 213, 222]; // Soft pinkish purple #E2D5DE
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.textColor = [0, 0, 0];
                }
            },
            margin: { left: 8, right: 8 }
        });
    }

    // Render TikTok Section
    if (includeTiktok && ttRows.length > 0) {
        if (!firstPage) {
            doc.addPage();
        }

        const header = TT_COLS.map(c => cleanText(c.label));
        const body = ttRows.map(row => TT_COLS.map(c => cleanText(row[c.key] ?? "")));

        let totalsCell = null;
        if (ttTotals) {
            totalsCell = [
                { content: cleanText(ttTotals.videos || "TỔNG 14 VIDEO"), colSpan: 3, styles: { halign: "center", fontStyle: "bold" } },
                cleanText(""),
                cleanText(ttTotals.reach || ""),
                cleanText(ttTotals.views || ""),
                cleanText(ttTotals.engagement || ""),
                cleanText(ttTotals.view_3s || ""),
                cleanText(ttTotals.view_1m || "")
            ];
            body.push(totalsCell);
        }

        autoTable(doc, {
            startY: 10,
            head: [header],
            body: body,
            theme: "grid",
            styles: {
                font: fontName,
                fontSize: 8.5,
                cellPadding: 2.5,
                overflow: "linebreak",
                textColor: [26, 30, 38],
                lineWidth: 0.15,
                lineColor: [200, 200, 200]
            },
            headStyles: {
                fillColor: [226, 213, 222], // Soft pinkish purple #E2D5DE
                textColor: [0, 0, 0],
                fontStyle: "bold",
                fontSize: 9,
                halign: "center",
                valign: "middle"
            },
            columnStyles: {
                0: { halign: "center", fontStyle: "bold" },
                1: { halign: "center" },
                2: { halign: "center" },
                3: { halign: "left" },
                4: { halign: "center", fontStyle: "bold" },
                5: { halign: "center", fontStyle: "bold" },
                6: { halign: "center", fontStyle: "bold" },
                7: { halign: "center", fontStyle: "bold" },
                8: { halign: "center", fontStyle: "bold" }
            },
            didParseCell: (data) => {
                if (ttTotals && data.row.index === body.length - 1) {
                    data.cell.styles.fillColor = [217, 225, 242]; // Soft ice blue #D9E1F2
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.textColor = [0, 0, 0];
                }
            },
            margin: { left: 15, right: 15 }
        });
    }

    doc.save(`chi-tiet-chi-so-${_dateStr()}.pdf`);
}

function _dateStr() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
