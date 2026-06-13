import { useState } from "react";
import { Download, X, Apple, Smartphone } from "lucide-react";

interface InvoiceDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
}

export function InvoiceDownloadModal({
  isOpen,
  onClose,
  orderId,
  customerName,
}: InvoiceDownloadModalProps) {
  const [showHowToAccess, setShowHowToAccess] = useState(false);

  const downloadInvoice = () => {
    // Trigger PDF download
    const element = document.createElement("a");
    element.setAttribute("href", `/api/invoice/${orderId}`);
    element.setAttribute("download", `invoice_${orderId}.pdf`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Order Invoice</h2>
            <p className="text-blue-100 text-sm mt-1">#{orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-700 font-semibold mb-2">Order for: {customerName}</p>
            <p className="text-gray-600 text-sm">
              Your invoice has been generated and is ready to download.
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadInvoice}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="h-5 w-5" />
            Download Invoice (PDF)
          </button>

          {/* How to Access */}
          {!showHowToAccess && (
            <button
              onClick={() => setShowHowToAccess(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              ? How to access invoices on mobile?
            </button>
          )}

          {showHowToAccess && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border-l-4 border-blue-600">
              <p className="font-semibold text-gray-900">Access Invoices On Mobile</p>

              {/* iOS Instructions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="h-5 w-5 text-gray-800" />
                  <p className="font-semibold text-gray-900">iOS (iPhone/iPad)</p>
                </div>
                <ol className="text-sm text-gray-700 space-y-1 ml-7 list-decimal">
                  <li>Open Safari or your browser</li>
                  <li>Go to <span className="font-mono bg-gray-100 px-1">pbtww.vercel.app</span></li>
                  <li>Log in with your account</li>
                  <li>Go to "My Orders" → select order</li>
                  <li>Tap "Download Invoice"</li>
                  <li>Invoice saves to Files or your preferred app</li>
                  <li>Tap "Share" to send via WhatsApp/Email</li>
                </ol>
              </div>

              {/* Android Instructions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-gray-900">Android</p>
                </div>
                <ol className="text-sm text-gray-700 space-y-1 ml-7 list-decimal">
                  <li>Open Chrome or your browser</li>
                  <li>Visit <span className="font-mono bg-gray-100 px-1">pbtww.vercel.app</span></li>
                  <li>Log in with your account</li>
                  <li>Navigate to "My Orders" → tap order</li>
                  <li>Tap "Download Invoice"</li>
                  <li>PDF opens in your default reader</li>
                  <li>Use share icon to send via WhatsApp/Email</li>
                </ol>
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-100 border border-blue-200 rounded p-3 mt-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">💡 Quick Tips:</p>
                <ul className="text-xs text-blue-800 space-y-0.5">
                  <li>• Check Downloads folder for files</li>
                  <li>• Use Files app (iOS) to organize PDFs</li>
                  <li>• Set up automatic backup via cloud</li>
                </ul>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
