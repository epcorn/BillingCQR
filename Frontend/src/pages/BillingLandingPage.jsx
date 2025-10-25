import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import MakeBillModal from '../components/MakeBillModal';

const BillingLandingPage = () => {
    const [rows, setRows] = useState([]);
    const [afterJobCards, setAfterJobCards] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [month, setMonth] = useState("10");
    const [year, setYear] = useState("2025");
    const [isLoading, setIsLoading] = useState(true);
    const [sortDirection, setSortDirection] = useState('asc');
    const [uploadStatus, setUploadStatus] = useState({});
    const fileInputRef = useRef(null);
    const [currentTargetServiceId, setCurrentTargetServiceId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("due"); // "due" or "afterJob"

    // Helper to normalize serviceCardLabel
    function ensureLabel(item) {
        if (item.serviceCardLabel) return item;
        const contractNo = item.contractNo || "";
        const scn = item.serviceCardNumber || 0;
        const total = item.totalCardsInContract ? `/${item.totalCardsInContract}` : "";
        return { ...item, serviceCardLabel: `${contractNo} (${scn}${total})` };
    }

    // Fetch due cards
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/billing/due-cards?month=${month}&year=${year}`);
                setRows(res.data.data || []);
            } catch (err) {
                console.error("Error fetching due-cards:", err.message || err);
                setRows([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [month, year]);

    // Fetch after-job cards immediately and every 60s
    useEffect(() => {
        let intervalId = null;
        const fetchAfterJobCards = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/billing/after-job?month=${month}&year=${year}`);
                const raw = res.data?.data || [];
                setAfterJobCards(raw.map(ensureLabel));
            } catch (err) {
                console.error("Error fetching after-job cards:", err.message || err);
            }
        };
        fetchAfterJobCards();
        intervalId = setInterval(fetchAfterJobCards, 60000);
        return () => clearInterval(intervalId);
    }, [month, year]);

    // Fetch activity logs immediately and every 60s
    useEffect(() => {
        let intervalId = null;
        const fetchLogs = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/billing/activity?month=${month}&year=${year}`);
                setActivityLogs(res.data?.data || []);
            } catch (err) {
                console.error("Error fetching activity logs:", err.message || err);
                setActivityLogs([]);
            }
        };
        fetchLogs();
        intervalId = setInterval(fetchLogs, 60000);
        return () => clearInterval(intervalId);
    }, [month, year]);

    // Refetch after-job cards on tab switch
    useEffect(() => {
        if (activeTab === "afterJob") {
            (async () => {
                try {
                    const res = await axios.get(`http://localhost:5000/api/billing/after-job?month=${month}&year=${year}`);
                    setAfterJobCards(res.data?.data.map(ensureLabel) || []);
                } catch (err) {
                    console.error("Error fetching after-job cards on tab switch:", err.message || err);
                }
            })();
        }
    }, [activeTab, month, year]);

    // Sorting
    const customSort = (a, b) => {
        const valA = (a.serviceCardLabel || "").toString();
        const valB = (b.serviceCardLabel || "").toString();
        const regex = /^(.*?)(?:\s*\()/;
        const matchA = valA.match(regex);
        const primaryA = matchA ? matchA[1].trim() : valA.trim();
        const matchB = valB.match(regex);
        const primaryB = matchB ? matchB[1].trim() : valB.trim();
        if (primaryA !== primaryB) return primaryA.localeCompare(primaryB);
        return valA.localeCompare(valB);
    };

    const sortedRows = useMemo(() => {
        const list = activeTab === "due" ? rows.map(ensureLabel) : afterJobCards.map(ensureLabel);
        if (!list || list.length === 0) return [];
        const sorted = [...list].sort(customSort);
        return sortDirection === 'desc' ? sorted.reverse() : sorted;
    }, [rows, afterJobCards, sortDirection, activeTab]);

    const handleSort = () => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    const handleUploadClick = (serviceId) => { setCurrentTargetServiceId(serviceId); fileInputRef.current?.click(); };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        const serviceId = currentTargetServiceId;
        if (!file || !serviceId) return;

        setUploadStatus(prev => ({ ...prev, [serviceId]: 'uploading' }));
        const formData = new FormData();
        formData.append('billFile', file);
        formData.append('serviceId', serviceId);

        try {
            await axios.post(`http://localhost:5000/api/billing/upload-bill`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadStatus(prev => ({ ...prev, [serviceId]: 'success' }));

            if (activeTab === "afterJob") {
                const res = await axios.get(`http://localhost:5000/api/billing/after-job?month=${month}&year=${year}`);
                setAfterJobCards(res.data?.data.map(ensureLabel) || []);
            }
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus(prev => ({ ...prev, [serviceId]: 'error' }));
        } finally {
            event.target.value = null;
            setCurrentTargetServiceId(null);
        }
    };

    const renderMedia = (url) => {
        if (!url) return <span style={styles.naText}>N/A</span>;
        const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(url);
        const isDoc = /\.docx?$/i.test(url);
        if (isImage) return <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} style={styles.image} alt="Card" /></a>;
        if (isDoc) return <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} target="_blank" rel="noopener noreferrer"><button style={styles.viewBtn}>View File</button></a>;
        return <a href={url} target="_blank" rel="noopener noreferrer"><button style={styles.viewBtn}>Open File</button></a>;
    };

    return (
        <div style={styles.wrapper}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

            <div style={styles.headerContainer}>
                <h1 style={styles.title}>📋 Billing-CQR Dashboard</h1>
                <button style={styles.makeBillBtn} onClick={() => setIsModalOpen(true)}>Make Bill</button>
            </div>

            {/* Filter Bar */}
            <div style={styles.filterBar}>
                <label style={styles.filterLabel}>Month:</label>
                <select value={month} onChange={e => setMonth(e.target.value)} style={styles.select}>
                    {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={(i+1).toString().padStart(2,'0')}>{(i+1).toString().padStart(2,'0')}</option>)}
                </select>
                <label style={styles.filterLabel}>Year:</label>
                <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                    {["2023","2024","2025","2026"].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Tabs */}
            <div style={styles.tabBar}>
                <button onClick={() => setActiveTab("due")} style={{ ...styles.tabBtn, backgroundColor: activeTab==="due"?"#4a90e2":"#e0e0e0", color: activeTab==="due"?"#fff":"#333" }}>Due Cards</button>
                <button onClick={() => setActiveTab("afterJob")} style={{ ...styles.tabBtn, backgroundColor: activeTab==="afterJob"?"#4a90e2":"#e0e0e0", color: activeTab==="afterJob"?"#fff":"#333" }}>Bill After Job</button>
            </div>

            {/* Billing Table */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.thSortable} onClick={handleSort}>Contract No / Card # {sortDirection==='asc'?'▲':'▼'}</th>
                            <th style={styles.th}>Bill To</th>
                            <th style={styles.th}>Ship To</th>
                            <th style={styles.th}>Service Card Front</th>
                            <th style={styles.th}>Service Card Back</th>
                            <th style={styles.th}>Upload Bill</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? <tr><td colSpan="6" style={styles.noData}>Loading...</td></tr> :
                            sortedRows.length>0 ? sortedRows.map(row => {
                                const status = uploadStatus[row.serviceId];
                                return (
                                    <tr key={row.serviceId} style={styles.tableRow}>
                                        <td style={styles.td}>{row.serviceCardLabel}</td>
                                        <td style={styles.td}>{row.billTo}</td>
                                        <td style={styles.td}>{row.shipTo}</td>
                                        <td style={styles.td}>{renderMedia(row.cardFrontImage)}</td>
                                        <td style={styles.td}>{renderMedia(row.cardBackImage)}</td>
                                        <td style={styles.td}>
                                            {status==='uploading' && <span style={styles.statusText}>Uploading...</span>}
                                            {status==='success' && <span style={{...styles.statusText,color:'green'}}>Success ✓</span>}
                                            {status==='error' && <button onClick={()=>handleUploadClick(row.serviceId)} style={{...styles.uploadBtn,backgroundColor:'#e74c3c'}}>Retry</button>}
                                            {!status && <button onClick={()=>handleUploadClick(row.serviceId)} style={styles.uploadBtn}>Upload</button>}
                                        </td>
                                    </tr>
                                );
                            }) :
                            <tr><td colSpan="6" style={styles.noData}>{activeTab==="afterJob"?"No after-job cards found.":"No due cards found for selected month and year."}</td></tr>
                        }
                    </tbody>
                </table>
            </div>

            {/* Activity History Section */}
            <div style={styles.historyWrapper}>
                <h2 style={styles.historyTitle}>Activity History (Real-time)</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Time</th>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Action</th>
                                <th style={styles.th}>Service / Bill ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activityLogs.length === 0 ? (
                                <tr><td colSpan="4" style={styles.noData}>No activity for selected month</td></tr>
                            ) : activityLogs.map(log => (
                                <tr key={log._id}>
                                    <td style={styles.td}>{new Date(log.createdAt).toLocaleString()}</td>
                                    <td style={styles.td}>{log.user}</td>
                                    <td style={styles.td}>{log.action}</td>
                                    <td style={styles.td}>{log.serviceId || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <MakeBillModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} rows={sortedRows} renderMedia={renderMedia} />
        </div>
    );
};

const styles = {
    wrapper:{minHeight:"100vh",padding:"30px",fontFamily:"'Segoe UI', Roboto, Helvetica, Arial, sans-serif",color:"#333", background:"linear-gradient(135deg,#e0eafc,#cfdef3)"},
    headerContainer:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'30px'},
    title:{marginBottom:0,color:"#2c3e50",fontSize:"32px",fontWeight:"600"},
    makeBillBtn:{background:"#27ae60",color:"#fff",border:"none",padding:"12px 25px",borderRadius:"8px",cursor:"pointer",fontSize:"16px",fontWeight:"600"},
    filterBar:{display:"flex",justifyContent:'center',alignItems:'center',gap:'15px',marginBottom:'25px',backgroundColor:"#fff",padding:'12px 20px',borderRadius:'10px',boxShadow:"0 4px 15px rgba(0,0,0,0.08)"},
    filterLabel:{fontSize:'16px',fontWeight:'500',color:'#555'},
    select:{padding:'10px 18px',fontSize:'16px',borderRadius:'8px',border:'1px solid #c0c0c0',backgroundColor:'#f8f8f8',cursor:'pointer'},
    tabBar:{display:'flex',justifyContent:'center',gap:'10px',marginBottom:'20px'},
    tabBtn:{padding:'10px 20px',fontSize:'15px',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600'},
    tableWrapper:{overflowX:'auto',backgroundColor:'#fff',borderRadius:'12px',boxShadow:'0 8px 25px rgba(0,0,0,0.15)',border:'1px solid #e0e0e0',marginBottom:'40px'},
    table:{width:'100%',borderCollapse:'separate',borderSpacing:'0'},
    th:{backgroundColor:'#4a90e2',color:'#fff',padding:'15px 10px',textAlign:'left',fontWeight:'600',fontSize:'15px',textTransform:'uppercase',borderBottom:'2px solid #3a7bd5'},
    thSortable:{backgroundColor:'#4a90e2',color:'#fff',padding:'15px 10px',cursor:'pointer'},
    td:{padding:'12px 10px',borderBottom:'1px solid #eee',fontSize:'14px',color:'#444'},
    tableRow:{transition:'background-color 0.3s ease'},
    image:{width:'70px',height:'70px',objectFit:'cover',borderRadius:'8px',border:'1px solid #ddd'},
    naText:{color:'#888',fontStyle:'italic'},
    viewBtn:{background:"#6c63ff",color:"#fff",border:"none",padding:"8px 15px",borderRadius:"5px",cursor:"pointer"},
    noData:{textAlign:'center',padding:'30px',fontSize:'16px',color:'#666',fontStyle:'italic'},
    uploadBtn:{background:"#3498db",color:"#fff",border:"none",padding:"8px 15px",borderRadius:"5px",cursor:"pointer"},
    statusText:{fontSize:'14px',color:'#555',fontStyle:'italic'},
    historyWrapper:{marginTop:'50px'},
    historyTitle:{fontSize:'22px',fontWeight:'600',marginBottom:'15px',color:'#2c3e50'}
};

export default BillingLandingPage;
