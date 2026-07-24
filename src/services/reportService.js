import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { apiPost, apiGet } from "../lib/apiClient.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export async function createReport(params) {
    return apiPost("/reports", params);
}

export async function getReports() {
    return apiGet("/reports");
}

function removeAccents(str) {
    if (!str) return "--";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

function formatDuration(sec) {
    if (!sec || isNaN(sec)) return "--";
    const s = Math.round(Number(sec));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}h${mins}m${secs}s`;
    return `${mins}m${secs}s`;
}

/**
 * Xuất dữ liệu bảng trực tiếp ra PDF hoặc Excel chuẩn 100%
 */
export async function exportReportConnected({ posts = [], totals = null, platform = "ALL", dateFrom = "", dateTo = "", format = "XLSX", tableRef = null }) {
    if (format === "PDF") {
        const tableEl = tableRef || document.querySelector(".table-wrap") || document.querySelector(".grid-table");
        if (tableEl) {
            await exportTableToPDF(tableEl, platform);
        } else {
            exportPostsToPDF(posts, totals, platform);
        }
    } else {
        exportPostsToExcel(posts, totals, platform);
    }
}

/**
 * Chụp NGUYÊN TOÀN BỘ BẢNG (Bao gồm các cột bị cuộn ngang) để vừa khít 100% trang A4 Landscape
 */
export async function exportTableToPDF(element, platform = "ALL") {
    if (!element) return;

    const originalOverflow = element.style.overflow;
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;

    try {
        // Mở rộng phần tử bảng để html2canvas chụp full 100% các cột ngang không bị cắt
        const fullWidth = Math.max(element.scrollWidth, 1400);
        element.style.overflow = "visible";
        element.style.width = `${fullWidth}px`;
        element.style.maxWidth = "none";

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: fullWidth + 100,
        });

        // Khôi phục lại style ban đầu của DOM
        element.style.overflow = originalOverflow;
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const margin = 8;
        const availableWidth = pdfWidth - margin * 2;
        const imgWidth = availableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const startY = 10;
        pdf.addImage(imgData, "PNG", margin, startY, imgWidth, Math.min(imgHeight, pdfHeight - startY - 10));

        const dateStr = new Date().toISOString().split("T")[0];
        pdf.save(`Bao_Cao_Social_${platform}_${dateStr}.pdf`);
    } catch (err) {
        element.style.overflow = originalOverflow;
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;
        console.error("Lỗi khi chụp toàn bộ bảng ra PDF:", err);
    }
}

/**
 * Xuất đầy đủ 20 cột sang Excel
 */
export function exportPostsToExcel(posts = [], totals = null, platform = "ALL") {
    if (platform === "FACEBOOK") {
        const rows = posts.map((p, index) => {
            const m = p.metrics?.[0] || {};
            const reactions = Number(m.reactions ?? m.likes ?? 0);
            return {
                "STT": index + 1,
                "Ngày đăng": p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("vi-VN") : "--",
                "Loại": p.contentType === "VIDEO" ? "Video" : "Ảnh",
                "Caption": p.caption || "--",
                "Reach": m.reach != null ? Number(m.reach) : "--",
                "Lượt xem": m.views != null ? Number(m.views) : 0,
                "Tương tác": reactions + Number(m.comments ?? 0) + Number(m.shares ?? 0),
                "Xem từ 3s": m.view3Seconds != null ? Number(m.view3Seconds) : "--",
                "Xem từ 1 phút": m.view1Minute != null ? Number(m.view1Minute) : "--",
            };
        });
        if (totals) {
            rows.push({
                "STT": "TỔNG",
                "Ngày đăng": "--",
                "Loại": "--",
                "Caption": `Tổng hợp (${totals.count || 0} bài)`,
                "Reach": totals.reach || 0,
                "Lượt xem": totals.views || 0,
                "Tương tác": totals.interactions || 0,
                "Xem từ 3s": totals.view3s || 0,
                "Xem từ 1 phút": totals.view1m || 0,
            });
        }
        const worksheet = XLSX.utils.json_to_sheet(rows, {
            header: ["STT", "Ngày đăng", "Loại", "Caption", "Reach", "Lượt xem", "Tương tác", "Xem từ 3s", "Xem từ 1 phút"],
        });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Facebook");
        XLSX.writeFile(workbook, `Bao_Cao_Chi_So_FACEBOOK_${new Date().toISOString().split("T")[0]}.xlsx`);
        return;
    }

    const dataRows = posts.map((p, index) => {
        const m = p.metrics?.[0] || {};
        const raw = m.rawData || {};

        return {
            "STT": index + 1,
            "Ngày": p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("vi-VN") : "--",
            "Caption": p.caption || "--",
            "Lượt xem": m.views ? Number(m.views) : 0,
            "Người xem": m.viewers ? Number(m.viewers) : "--",
            "Like": m.likes ? Number(m.likes) : (Number(m.reactions) || 0),
            "Bình luận": m.comments ? Number(m.comments) : 0,
            "Chia sẻ": m.shares ? Number(m.shares) : 0,
            "Lưu video": m.saves ? Number(m.saves) : 0,
            "Tổng thời gian phát": formatDuration(m.totalWatchTimeSeconds),
            "Thời gian xem TB": m.averageWatchTimeSeconds ? `${Number(m.averageWatchTimeSeconds).toFixed(1)}s` : "--",
            "Tỷ lệ xem hết": m.completionRate ? `${Number(m.completionRate).toFixed(1)}%` : "--",
            "Follow mới": m.newFollowers ? Number(m.newFollowers) : 0,
            "Nguồn chính": m.trafficSource || raw.reach_type || "Đề xuất",
            "Người xem mới": m.newViewerRate ? `${Number(m.newViewerRate)}%` : "--",
            "Người xem quay lại": m.returningViewerRate ? `${Number(m.returningViewerRate)}%` : "--",
            "Nam": m.maleRate ? `${Number(m.maleRate)}%` : "--",
            "Nữ": m.femaleRate ? `${Number(m.femaleRate)}%` : "--",
            "Độ tuổi chính": m.mainAgeGroup || "--",
            "Khu vực chính": m.mainLocation || "Việt Nam",
        };
    });

    if (totals) {
        dataRows.push({
            "STT": "TỔNG",
            "Ngày": "--",
            "Caption": `Tổng hợp (${totals.count || 0} bài)`,
            "Lượt xem": totals.views || 0,
            "Người xem": totals.viewers || "--",
            "Like": totals.likes || 0,
            "Bình luận": totals.comments || 0,
            "Chia sẻ": totals.shares || 0,
            "Lưu video": totals.saves || 0,
            "Tổng thời gian phát": formatDuration(totals.watchTime),
            "Thời gian xem TB": "--",
            "Tỷ lệ xem hết": "--",
            "Follow mới": totals.newFollowers || 0,
            "Nguồn chính": "--",
            "Người xem mới": "--",
            "Người xem quay lại": "--",
            "Nam": "--",
            "Nữ": "--",
            "Độ tuổi chính": "--",
            "Khu vực chính": "--",
        });
    }

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChiTietChiSo");

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Bao_Cao_Chi_So_${platform}_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

/**
 * Xuất đầy đủ 20 cột sang PDF chuẩn bảng như Ảnh mẫu 2
 */
export function exportPostsToPDF(posts = [], totals = null, platform = "ALL") {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const headers = [
        [
            "STT",
            "Ngay",
            "Caption",
            "Luot xem",
            "Nguoi xem",
            "Like",
            "Binh luan",
            "Chia se",
            "Luu video",
            "Tong thoi gian phat",
            "Thoi gian xem TB",
            "Ty le xem het",
            "Follow moi",
            "Nguon chinh",
            "Nguoi xem moi",
            "Nguoi xem quay lai",
            "Nam",
            "Nu",
            "Do tuoi chinh",
            "Khu vuc chinh"
        ]
    ];

    const rows = posts.map((p, index) => {
        const m = p.metrics?.[0] || {};
        const raw = m.rawData || {};

        return [
            index + 1,
            p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("vi-VN") : "--",
            removeAccents(p.caption || "--").substring(0, 18),
            m.views ? Number(m.views).toLocaleString() : 0,
            m.viewers ? Number(m.viewers).toLocaleString() : "--",
            m.likes ? Number(m.likes) : (Number(m.reactions) || 0),
            m.comments ? Number(m.comments) : 0,
            m.shares ? Number(m.shares) : 0,
            m.saves ? Number(m.saves) : 0,
            formatDuration(m.totalWatchTimeSeconds),
            m.averageWatchTimeSeconds ? `${Number(m.averageWatchTimeSeconds).toFixed(1)}s` : "--",
            m.completionRate ? `${Number(m.completionRate).toFixed(1)}%` : "--",
            m.newFollowers ? Number(m.newFollowers) : 0,
            removeAccents(m.trafficSource || raw.reach_type || "De xuat"),
            m.newViewerRate ? `${Number(m.newViewerRate)}%` : "--",
            m.returningViewerRate ? `${Number(m.returningViewerRate)}%` : "--",
            m.maleRate ? `${Number(m.maleRate)}%` : "--",
            m.femaleRate ? `${Number(m.femaleRate)}%` : "--",
            removeAccents(m.mainAgeGroup || "--"),
            removeAccents(m.mainLocation || "Viet Nam")
        ];
    });

    if (totals) {
        rows.push([
            "TONG",
            "--",
            `Tong (${totals.count || 0})`,
            totals.views ? totals.views.toLocaleString() : 0,
            totals.viewers ? totals.viewers.toLocaleString() : "--",
            totals.likes ? totals.likes.toLocaleString() : 0,
            totals.comments ? totals.comments.toLocaleString() : 0,
            totals.shares ? totals.shares.toLocaleString() : 0,
            totals.saves ? totals.saves.toLocaleString() : 0,
            formatDuration(totals.watchTime),
            "--",
            "--",
            totals.newFollowers || 0,
            "--",
            "--",
            "--",
            "--",
            "--",
            "--",
            "--"
        ]);
    }

    autoTable(doc, {
        startY: 10,
        margin: { left: 6, right: 6, top: 10, bottom: 10 },
        head: headers,
        body: rows,
        styles: { fontSize: 6, cellPadding: 1.2, halign: "center", lineColor: [160, 160, 160], lineWidth: 0.1 },
        columnStyles: {
            2: { cellWidth: 24, halign: "left" }
        },
        headStyles: { fillColor: [180, 198, 231], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    const dateStr = new Date().toISOString().split("T")[0];
    doc.save(`Bao_Cao_Social_${platform}_${dateStr}.pdf`);
}
