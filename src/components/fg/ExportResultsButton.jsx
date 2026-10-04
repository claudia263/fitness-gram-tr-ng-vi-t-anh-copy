import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ExportReport from "@/components/fg/ExportReport";

// Xuất báo cáo A4 đầy đủ — chia 2 trang (html2canvas → PDF) cho học sinh đang xem
export default function ExportResultsButton({ student, data, className = "" }) {
  const [busy, setBusy] = useState(false);
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);

  const handleExport = async () => {
    if (!student) return;
    setBusy(true);
    try {
      // chờ font + biểu đồ render
      await new Promise((r) => setTimeout(r, 400));

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const pages = [page1Ref.current, page2Ref.current].filter(Boolean);
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          backgroundColor: "#F0F4F8",
          useCORS: true,
          logging: false,
        });
        const imgW = pageW;
        const imgH = (canvas.height * imgW) / canvas.width;
        // căn giữa dọc nếu ảnh nhỏ hơn trang
        const yOffset = Math.max(0, (pageH - imgH) / 2);
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, yOffset, imgW, imgH);
      }

      pdf.save(`FitnessGram_${(student.full_name || "hocsinh").replace(/\s+/g, "_")}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={busy || !student}
        className={`fg-btn-secondary inline-flex items-center gap-2 px-4 h-10 text-sm ${className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span>{busy ? "Đang xuất..." : "Xuất file PDF"}</span>
      </button>

      {createPortal(
        <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
          <ExportReport student={student} data={data} page1Ref={page1Ref} page2Ref={page2Ref} />
        </div>,
        document.body
      )}
    </>
  );
}