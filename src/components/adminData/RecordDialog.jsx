// Form thêm / sửa / xoá một bản ghi, sinh tự động từ mô tả cột trong lib/adminData/tables.js.
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RefPicker from "@/components/adminData/RefPicker";
import { can, pkOf } from "@/lib/adminData/tables";
import { display, fromInput, toInput } from "@/lib/adminData/format";

const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const inputCls = "fg-input h-10 w-full bg-white px-3 text-sm text-navy disabled:bg-slate-50 disabled:text-muted-foreground";

function Field({ col, value, refLabel, onChange, disabled }) {
  const id = `f-${col.key}`;
  let input;
  if (col.type === "ref") {
    input = <RefPicker id={id} refKey={col.ref} value={value} label={refLabel} disabled={disabled} onChange={(v, label) => onChange(v || "", label)} />;
  } else if (col.type === "enum" || col.type === "bool") {
    const options = col.type === "bool" ? [{ value: "true", label: "Có" }, { value: "false", label: "Không" }] : col.options;
    input = (
      <select id={id} className={inputCls} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Chọn —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (col.type === "multi") {
    input = (
      <div className="flex min-h-10 flex-wrap items-center gap-4">
        {col.options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              disabled={disabled}
              checked={value.includes(o.value)}
              onChange={() => onChange(value.includes(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value])}
              className="h-4 w-4 accent-[#26275D]"
            />
            {o.label}
          </label>
        ))}
      </div>
    );
  } else if (col.type === "textarea" || col.type === "json") {
    input = (
      <textarea
        id={id}
        rows={col.type === "json" ? 6 : 3}
        className={`fg-input w-full bg-white px-3 py-2 text-sm text-navy disabled:bg-slate-50 ${col.type === "json" ? "font-mono text-xs" : ""}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    const type = { number: "text", int: "number", date: "date", time: "time", datetime: "text" }[col.type] || "text";
    input = (
      <input
        id={id}
        type={type}
        inputMode={col.type === "number" ? "decimal" : undefined}
        step={col.type === "time" ? 300 : undefined}
        className={inputCls}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  const wide = ["textarea", "json", "multi"].includes(col.type) || col.type === "ref";
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className={labelCls}>
        {col.label}
        {col.required && !disabled && <span className="text-rose-600"> *</span>}
      </label>
      {input}
      {col.hint && !disabled && <p className="mt-1 text-xs text-muted-foreground">{col.hint}</p>}
    </div>
  );
}

export default function RecordDialog({ table, row, refs, onClose, onSave, onDelete }) {
  const isNew = !row;
  const editable = isNew ? can(table, "Insert") : can(table, "Update");
  const cols = table.columns.filter((c) => (isNew ? !c.readOnly || c.pkEditable : true));
  const locked = (c) => !editable || c.readOnly || (!isNew && c.key === pkOf(table));
  const [values, setValues] = useState(() => Object.fromEntries(cols.map((c) => [c.key, toInput(c, row?.[c.key])])));
  const [labels, setLabels] = useState(() => Object.fromEntries(cols.filter((c) => c.type === "ref").map((c) => [c.key, display(c, row?.[c.key], refs)])));
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    let patch;
    try {
      patch = Object.fromEntries(cols.filter((c) => !locked(c)).map((c) => [c.key, fromInput(c, values[c.key])]));
    } catch (err) {
      setError(err.message);
      return;
    }
    setBusy("save");
    try {
      await onSave(patch);
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-[22px] bg-white p-0 gap-0">
        <form onSubmit={submit} noValidate>
          <DialogHeader className="border-b px-5 py-4 text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{table.label}</p>
            <DialogTitle className="text-xl font-extrabold text-navy">{isNew ? "Thêm mới" : editable ? "Sửa bản ghi" : "Chi tiết bản ghi"}</DialogTitle>
            <DialogDescription>{editable ? "Các ô có dấu * là bắt buộc." : "Bảng này chỉ xem, không sửa được trong app."}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            {cols.map((c) => (
              <Field
                key={c.key}
                col={c}
                value={values[c.key]}
                refLabel={labels[c.key]}
                disabled={locked(c)}
                onChange={(v, label) => {
                  setValues((s) => ({ ...s, [c.key]: v }));
                  if (label !== undefined) setLabels((s) => ({ ...s, [c.key]: label }));
                }}
              />
            ))}
          </div>

          {error && <p className="mx-5 mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
            <div>
              {!isNew && can(table, "Delete") &&
                (confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-rose-900">
                    <span>{table.deleteNote || "Xoá bản ghi này?"}</span>
                    <button type="button" onClick={remove} disabled={!!busy} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
                      {busy === "delete" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Xoá
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg px-2 py-1.5 font-semibold text-navy hover:bg-navy-soft">
                      Huỷ
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Xoá
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-navy hover:bg-navy-soft">
                {editable ? "Huỷ" : "Đóng"}
              </button>
              {editable && (
                <button type="submit" disabled={!!busy} className="fg-btn-secondary inline-flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-60">
                  {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isNew ? "Thêm" : "Lưu"}
                </button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
