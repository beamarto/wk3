"use client";

type DeleteConfirmModalProps = {
  name: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  name,
  deleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h3 className="mb-2 text-lg font-bold text-zinc-900">
          Delete café card
        </h3>
        <p className="mb-6 text-sm text-zinc-600">
          Are you sure you want to delete <strong>{name}</strong>&apos;s card?
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
