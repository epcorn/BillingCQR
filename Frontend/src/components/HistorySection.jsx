import React, { useEffect, useState } from "react";
import axios from "axios";

const HistorySection = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token missing");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/activity", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setActivities(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError(
          err.response?.data?.message || "Failed to load activity history"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // Runs only once on mount

  if (loading) {
    return <p style={styles.loading}>Loading history...</p>;
  }

  if (error) {
    return <p style={styles.error}>{error}</p>;
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.heading}>User Activity History</h2>
      {activities.length === 0 ? (
        <p style={styles.noData}>No activity found</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Extra Data</th>
              <th style={styles.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a._id}>
                <td style={styles.td}>{a.userId?.name || "Deleted User"}</td>
                <td style={styles.td}>
                  <strong style={{ fontWeight: 800 }}>{a.actionType}</strong>
                </td>
                <td style={styles.td}>
                  {a.contractNo || a.cardNo || a.extraInfo ? (
                    <>
                      {a.contractNo && (
                        <div>
                          <strong>Contract:</strong> {a.contractNo}
                        </div>
                      )}
                      {a.cardNo && (
                        <div>
                          <strong>Card:</strong> {a.cardNo}
                        </div>
                      )}
                      {a.extraInfo && (
                        <div>
                          <strong>Note:</strong> {a.extraInfo}
                        </div>
                      )}
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td style={styles.td}>
                  {new Date(a.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    marginTop: "50px",
    padding: "25px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
    border: "1px solid #e0e0e0",
  },
  heading: {
    fontSize: "22px",
    marginBottom: "18px",
    fontWeight: "600",
    color: "#2c3e50",
    borderBottom: "2px solid #4a90e2",
    paddingBottom: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14.5px",
  },
  th: {
    backgroundColor: "#f5f7fa",
    color: "#444",
    textAlign: "left",
    padding: "12px 10px",
    fontWeight: "600",
    borderBottom: "2px solid #ddd",
    textTransform: "uppercase",
    fontSize: "12.5px",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee",
    color: "#444",
    fontWeight: 700,
    verticalAlign: "top",
  },
  loading: {
    textAlign: "center",
    padding: "20px",
    color: "#666",
    fontStyle: "italic",
  },
  error: {
    textAlign: "center",
    padding: "20px",
    color: "#e74c3c",
    fontWeight: "500",
  },
  noData: {
    textAlign: "center",
    padding: "25px",
    color: "#888",
    fontStyle: "italic",
    fontSize: "15px",
  },
};

export default HistorySection;
