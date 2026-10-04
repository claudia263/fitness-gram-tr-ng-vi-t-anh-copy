import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import LoginVisual from "@/components/fg/LoginVisual";
import LoginForm from "@/components/fg/LoginForm";

function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export default function Login() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (name) => {
    setBusy(true);
    setError("");
    try {
      const all = await base44.entities.Student.list(null, 500);
      const matched = all.filter((s) => normalize(s.full_name) === normalize(name));
      if (matched.length === 0) {
        setError("Không tìm thấy học sinh với tên này trong danh sách trường. Vui lòng kiểm tra lại họ tên.");
        setBusy(false);
        return;
      }
      sessionStorage.setItem("fg_entered", "true");
      sessionStorage.setItem("fg_student_ids", JSON.stringify(matched.map((s) => s.id)));
      window.dispatchEvent(new Event("fg_students_changed"));
      setLeaving(true);
      setTimeout(() => navigate("/"), 300);
    } catch (e) {
      setError("Không thể tra cứu lúc này, vui lòng thử lại.");
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={leaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: reduce ? 0.2 : 0.5 }}
        className="absolute inset-0"
      >
        <LoginVisual formOpen>
          <LoginForm onSubmit={handleSubmit} busy={busy} error={error} />
        </LoginVisual>
      </motion.div>
    </div>
  );
}