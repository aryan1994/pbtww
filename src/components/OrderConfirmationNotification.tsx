// Notification component for order confirmation with invoice
import { useEffect, useState } from "react";
import { FileText, Download, X, AlertCircle } from "lucide-react";

interface OrderNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
  total: number;
}

export function OrderConfirmationNotification({
  isOpen,
  onClose,
  orderId,
  customerName,
  total,
}: OrderNotificationProps) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-download invoice after 2 seconds
      const timer = setTimeout(() => {
        const element = document.createElement("a");
        element.setAttribute("href", `/api/invoice/${orderId}`);
        element.setAttribute("download", `invoice_${orderId}.pdf`);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in">
        {/* Header - Success */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Order Confirmed! ✅</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-green-100">Your water tanker is on the way</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Order Details */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="text-2xl font-bold text-gray-900">#{orderId}</p>
            <p className="text-sm text-gray-600 mt-2">Customer: {customerName}</p>
            <p className="text-lg font-semibold text-blue-600 mt-2">₹{total.toLocaleString("en-IN")}</p>
          </div>

          {/* Invoice Auto-Download Info */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">Invoice Downloading</p>
              <p className="text-xs text-yellow-800 mt-1">
                Your invoice is automatically downloading. Check your Downloads folder.
              </p>
            </div>
          </div>

          {/* Invoice Modal Button */}
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="h-5 w-5" />
            View Invoice & Download
          </button>

          {/* Next Steps */}
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-900">What's next?</p>
            <div className="space-y-2 text-gray-700">
              <p>✓ Driver assigned to your order</p>
              <p>✓ Live tracking available</p>
              <p>✓ Delivery within 60 minutes</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Invoice Modal - Nested */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Invoice</h3>
                <p className="text-blue-100 text-sm mt-1">#{orderId}</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm mb-2">Order for: {customerName}</p>
                <p className="text-3xl font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</p>
              </div>

              <button
                onClick={() => {
                  const element = document.createElement("a");
                  element.setAttribute("href", `/api/invoice/${orderId}`);
                  element.setAttribute("download", `invoice_${orderId}.pdf`);
                  element.style.display = "none";
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="h-5 w-5" />
                Download Invoice (PDF)
              </button>

              {/* How to Access on Mobile */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold text-gray-900">📱 Access on Mobile</p>
                <div className="text-gray-700 space-y-1">
                  <p><strong>iOS:</strong> Open Safari → pbtww.vercel.app → Log in → My Orders → Download</p>
                  <p><strong>Android:</strong> Open Chrome → pbtww.vercel.app → Log in → My Orders → Download</p>
                </div>
              </div>

              <button
                onClick={() => setShowInvoiceModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
