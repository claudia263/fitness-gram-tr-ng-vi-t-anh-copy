import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { resolveStudentsByIds, useStudentBundle } from "@/lib/studentData";

// Context chung: giữ học sinh đang được chọn (activeStudent) và bundle dữ liệu của em đó.
// LookupHome set activeStudent khi bấm vào thẻ học sinh; Results/History/Profile đọc chung.
const StudentContext = createContext();

export function StudentProvider({ children }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentError, setStudentError] = useState(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoadingStudents(true);
      try {
        let ids = [];
        try {
          ids = JSON.parse(sessionStorage.getItem("fg_student_ids") || "[]");
        } catch (e) { ids = []; }
        const list = await resolveStudentsByIds(ids);
        if (!alive) return;
        setStudents(list);
        setActiveStudent((prev) => (prev && list.some((s) => s.id === prev.id)) ? prev : (list[0] || null));
      } catch (e) {
        if (alive) setStudentError(e);
      } finally {
        if (alive) setLoadingStudents(false);
      }
    };
    run();
    // Tải lại khi trang Login báo đã ghi danh sách id học sinh mới
    const onChange = () => run();
    window.addEventListener("fg_students_changed", onChange);
    return () => { alive = false; window.removeEventListener("fg_students_changed", onChange); };
  }, []);

  const bundle = useStudentBundle(activeStudent?.id);

  return (
    <StudentContext.Provider
      value={{
        user,
        students,
        activeStudent,
        setActiveStudent,
        loadingStudents,
        studentError,
        ...bundle,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}