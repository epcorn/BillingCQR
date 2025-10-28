import React, { useState, useEffect } from "react";
import axios from "axios";

const MakeBillModal = ({ isOpen, onClose, rows, renderMedia }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCards, setFilteredCards] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [uploadedBillPaths, setUploadedBillPaths] = useState([]);
  const [cardFiles, setCardFiles] = useState([]);

  // 🟢 Added for tracking
  const token = localStorage.getItem("token");

  // 🟢 Helper to log activity
  const logBillingActivity = async (actionType, contractNo = null, cardNo = null) => {
    try {
await axios.post(
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/activity`,
  { actionType, contractNo, cardNo },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

    } catch (err) {
      console.error("Activity log failed:", err);
    }
  };

  // 🔍 Filter cards by contract number
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards([]);
      return;
    }
    const filtered = rows.filter((row) =>
      row.contractNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCards(filtered);
  }, [searchTerm, rows]);

  // Escape to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 📤 Upload Bill Handler
  const handleUploadConsolidatedBill = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Please select at least one bill file first.");
      return;
    }
    if (filteredCards.length === 0) {
      alert("Please enter a valid contract number first.");
      return;
    }

    const contractNo = filteredCards[0].contractNo;
    const formData = new FormData();

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("billFiles", selectedFiles[i]);
    }

    formData.append("contractNo", contractNo);

    try {
      setUploading(true);
      const res = await axios.post(
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/billing/upload-bill`,
  formData,
  {
    headers: { "Content-Type": "multipart/form-data" },
  }
);

      if (res.data.success) {
        setFileUploaded(true);
        setUploadedBillPaths(res.data.billPaths || []);
        setCardFiles(res.data.cardPaths || []);
        alert("Files uploaded successfully!");

        // 🟢 Track upload action
        await logBillingActivity("upload_bill", contractNo);
      } else {
        alert("File upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading bill file(s).");
    } finally {
      setUploading(false);
    }
  };

  // ✉️ Send Email Handler
  const handleSendEmail = async () => {
    if (!fileUploaded || uploadedBillPaths.length === 0) {
      alert("Please upload the bill file(s) before sending the email.");
      return;
    }
    const contractNo = filteredCards[0]?.contractNo;
    if (!contractNo) {
      alert("Contract number missing.");
      return;
    }

    try {
      setSendingEmail(true);
const res = await axios.post(
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/billing/send-bill-email`,
  {
    contractNo,
    filePaths: uploadedBillPaths,
    cardPaths: cardFiles,
  }
);


      if (res.data.success) {
        alert(`Email sent successfully to client for Contract ${contractNo}.`);
        // 🟢 Track send email
        await logBillingActivity("send_email", contractNo);
      } else {
        alert("Failed to send email.");
      }
    } catch (err) {
      console.error("Email sending error:", err);
      alert("Error sending email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // 🟢 Modified: Track front/back downloads
  const downloadFile = async (filePath, fileName, contractNo, cardNo, actionType) => {
    try {
      const getFileName = (path, fallback) => {
        if (fileName) return fileName;
        if (path) {
          const parts = path.split("/");
          return parts[parts.length - 1];
        }
        return fallback;
      };

      const res = await fetch(filePath);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFileName(filePath, "download");
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // 🟢 Track download
      await logBillingActivity(actionType, contractNo, cardNo);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2>Make Bill from Service Cards</h2>
          <button onClick={onClose} style={styles.closeButton}>
            &times;
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Enter Contract No (e.g., G/182)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFileUploaded(false);
                setSelectedFiles(null);
                setUploadedBillPaths([]);
                setCardFiles([]);
              }}
              style={styles.searchInput}
              autoFocus
            />
          </div>

          <div style={styles.resultsContainer}>
            {searchTerm && filteredCards.length > 0 ? (
              filteredCards.map((card, index) => (
                <div key={card.serviceId} style={styles.cardItem}>
                  <strong style={styles.cardLabel}>{card.serviceCardLabel}</strong>
                  <div style={styles.imagePair}>
                    <div style={styles.mediaContainer}>
                      <span style={styles.mediaLabel}>Front</span>
                      {renderMedia(card.cardFrontImage)}
                      <button
                        style={styles.downloadBtn}
                        onClick={() =>
                          downloadFile(
                            card.cardFrontImage,
                            card.cardFrontImage.split("/").pop(),
                            card.contractNo,
                            `${index + 1}/2`,
                            "download_front"
                          )
                        }
                      >
                        Download Front
                      </button>
                    </div>
                    <div style={styles.mediaContainer}>
                      <span style={styles.mediaLabel}>Back</span>
                      {renderMedia(card.cardBackImage)}
                      <button
                        style={styles.downloadBtn}
                        onClick={() =>
                          downloadFile(
                            card.cardBackImage,
                            card.cardBackImage.split("/").pop(),
                            card.contractNo,
                            `${index + 1}/2`,
                            "download_back"
                          )
                        }
                      >
                        Download Back
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>📂</div>
                <h3>{searchTerm ? "No Matching Cards Found" : "Find Service Cards"}</h3>
                <p>
                  {searchTerm
                    ? "Try a different contract number."
                    : "Enter a contract number above to see the relevant service cards for this billing period."}
                </p>
              </div>
            )}
          </div>
        </div>

        {filteredCards.length > 0 && (
          <div style={styles.modalFooter}>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={(e) => setSelectedFiles(e.target.files)}
              style={styles.fileInput}
              multiple
            />

            {selectedFiles && selectedFiles.length > 0 && (
              <span style={{ fontSize: "12px", color: "#6c757d", marginRight: "auto" }}>
                {selectedFiles.length} file(s) selected
              </span>
            )}

            <button
              style={{
                ...styles.secondaryButton,
                opacity: uploading ? 0.7 : 1,
                cursor: uploading ? "not-allowed" : "pointer",
              }}
              onClick={handleUploadConsolidatedBill}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Bill(s)"}
            </button>

            <button
              style={{
                ...styles.actionButton,
                opacity: !fileUploaded ? 0.6 : 1,
                cursor: !fileUploaded ? "not-allowed" : "pointer",
              }}
              onClick={handleSendEmail}
              disabled={!fileUploaded || sendingEmail}
            >
              {sendingEmail ? "Sending..." : "Send Email"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};




// --- Styles ---
const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(5px)",
  },
  modalContent: {
    background: "#f8f9fa",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "1000px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 25px",
    borderBottom: "1px solid #dee2e6",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "2.5rem",
    cursor: "pointer",
    color: "#6c757d",
    lineHeight: 1,
  },
  modalBody: { flex: 1, padding: "25px", overflowY: "auto" },
  searchContainer: { position: "relative", marginBottom: "25px" },
  searchIcon: {
    position: "absolute",
    top: "50%",
    left: "15px",
    transform: "translateY(-50%)",
    color: "#adb5bd",
    fontSize: "1.2rem",
  },
  searchInput: {
    width: "100%",
    padding: "15px 15px 15px 50px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ced4da",
    backgroundColor: "#fff",
  },
  resultsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    minHeight: "200px",
  },
  cardItem: {
    background: "#ffffff",
    border: "1px solid #e9ecef",
    borderRadius: "10px",
    padding: "15px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  cardLabel: {
    display: "block",
    marginBottom: "15px",
    fontWeight: "600",
    color: "#212529",
    fontSize: "16px",
    textAlign: "center",
    borderBottom: "1px solid #f1f3f4",
    paddingBottom: "10px",
  },
  imagePair: { display: "flex", justifyContent: "space-around", gap: "10px" },
  mediaContainer: { textAlign: "center" },
  mediaLabel: {
    display: "block",
    fontSize: "12px",
    color: "#6c757d",
    marginBottom: "5px",
    textTransform: "uppercase",
  },
  downloadBtn: {
    marginTop: "5px",
    padding: "5px 10px",
    fontSize: "12px",
    borderRadius: "5px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "40px 20px",
    color: "#6c757d",
  },
  emptyStateIcon: { fontSize: "4rem", marginBottom: "15px" },
  modalFooter: {
    padding: "20px 25px",
    borderTop: "1px solid #dee2e6",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "15px",
    backgroundColor: "#fff",
  },
  fileInput: { flex: 1 },
  actionButton: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
  },
  secondaryButton: {
    background: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
  },
};

export default MakeBillModal;