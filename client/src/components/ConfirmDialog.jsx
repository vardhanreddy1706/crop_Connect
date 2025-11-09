import React from "react";
import { X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  loading = false
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
    danger: <XCircle className="w-12 h-12 text-red-500" />,
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />
  };

  const buttonColors = {
    warning: "bg-yellow-600 hover:bg-yellow-700",
    danger: "bg-red-600 hover:bg-red-700",
    success: "bg-green-600 hover:bg-green-700",
    info: "bg-blue-600 hover:bg-blue-700"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="w-5 h-5" />
        </button>
        <div className="flex justify-center mb-4">{icons[type]}</div>
        <h3 className="text-xl font-bold text-center mb-2 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${buttonColors[type]}`}>
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
