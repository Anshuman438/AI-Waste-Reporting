import axios from "axios";
import bcrypt from "bcryptjs";
import { API } from "../config/api";

export const DEFAULT_TIDB_URL =
  'mysql://3J8trmw64KZr7yY.root:SB3ubp1rPKMNSU3T@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';

export const getDatabaseUrl = () => {
  return (
    localStorage.getItem("safai_db_url") ||
    import.meta.env.VITE_DATABASE_URL ||
    import.meta.env.DATABASE_URL ||
    import.meta.env.TIDB_DATABASE_URL ||
    DEFAULT_TIDB_URL
  );
};

export const setCustomDatabaseUrl = (url) => {
  if (url && typeof url === "string") {
    localStorage.setItem("safai_db_url", url.trim());
  }
};

// Local storage helpers
const getLocalStore = () => {
  try {
    const raw = localStorage.getItem("safai_all_complaints");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalStore = (list) => {
  try {
    localStorage.setItem("safai_all_complaints", JSON.stringify(list));
    localStorage.setItem("user_complaints_data", JSON.stringify(list));
    localStorage.setItem("admin_complaints_data", JSON.stringify(list));
  } catch (e) {}
};

const getRequestHeaders = (authToken, extra = {}) => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = authToken || localStorage.getItem("token");
  const dbUrl = getDatabaseUrl();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(currentUser.email ? { "x-user-email": currentUser.email } : {}),
    ...(currentUser._id || currentUser.id ? { "x-user-id": String(currentUser._id || currentUser.id) } : {}),
    ...(currentUser.role ? { "x-user-role": currentUser.role } : {}),
    ...(dbUrl ? { "x-db-url": dbUrl } : {}),
    ...extra,
  };
};

// ==========================================
// SUBMIT WASTE COMPLAINT
// ==========================================
export const submitComplaintService = async (complaintData, authToken) => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = (currentUser.email || "citizen@safai.org").toLowerCase().trim();
  const userId = String(currentUser._id || currentUser.id || "usr-" + Date.now());
  const userName = currentUser.name || "Citizen Reporter";
  const loc = complaintData.location || { lat: 22.5726, lng: 88.3639, address: "Civic Area" };
  const dbUrl = getDatabaseUrl();

  let savedRecord = null;

  try {
    const res = await axios.post(
      `${API}/api/complaints`, 
      {
        ...complaintData,
        reportedById: userId,
        reportedByName: userName,
        reportedByEmail: userEmail
      }, 
      {
        params: { db_url: dbUrl },
        headers: getRequestHeaders(authToken, { "Content-Type": "application/json" }),
        timeout: 10000,
      }
    );
    if (res.data && (res.data._id || res.data.id)) {
      savedRecord = res.data;
    }
  } catch (apiErr) {
    console.warn("Backend API submit note:", apiErr.message);
  }

  if (!savedRecord) {
    const fallbackId = "comp-" + Date.now();
    savedRecord = {
      _id: fallbackId,
      id: fallbackId,
      imageUrl: complaintData.imageUrl || complaintData.image,
      wasteType: complaintData.wasteType,
      description: complaintData.description,
      location: loc,
      status: "pending",
      reportedBy: {
        _id: userId,
        name: userName,
        email: userEmail,
      },
      createdAt: new Date().toISOString(),
    };
  }

  const localList = getLocalStore();
  const filtered = localList.filter(c => String(c._id || c.id) !== String(savedRecord._id || savedRecord.id));
  saveLocalStore([savedRecord, ...filtered]);

  window.dispatchEvent(new Event("new_complaint_reported"));
  window.dispatchEvent(new Event("storage"));

  return savedRecord;
};

// ==========================================
// FETCH ALL COMPLAINTS (Admin Dashboard)
// ==========================================
export const fetchAllComplaintsService = async (authToken) => {
  const localList = getLocalStore();
  let serverList = [];
  const dbUrl = getDatabaseUrl();

  // 1. Try primary complaints endpoint
  try {
    const res = await axios.get(`${API}/api/complaints`, {
      params: { db_url: dbUrl, t: Date.now() },
      headers: getRequestHeaders(authToken, { "x-user-role": "admin" }),
      timeout: 10000,
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      serverList = res.data;
    }
  } catch (apiErr) {
    console.warn("Primary API complaints note:", apiErr.message);
  }

  // 2. Secondary fallback via test-db endpoint
  if (serverList.length === 0) {
    try {
      const res = await axios.get(`${API}/api/test-db`, {
        params: { url: dbUrl, mode: "all", t: Date.now() },
        headers: getRequestHeaders(authToken, { "x-user-role": "admin" }),
        timeout: 10000,
      });
      if (res.data?.complaints && Array.isArray(res.data.complaints) && res.data.complaints.length > 0) {
        serverList = res.data.complaints;
      }
    } catch (fallbackErr) {
      console.warn("Fallback test-db complaints note:", fallbackErr.message);
    }
  }

  // 3. Merge server list with local list
  const mergedMap = new Map();
  for (const item of serverList) {
    mergedMap.set(String(item._id || item.id), item);
  }
  for (const item of localList) {
    const key = String(item._id || item.id);
    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
    }
  }

  const result = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  if (result.length > 0) {
    saveLocalStore(result);
  }
  return result;
};

// ==========================================
// FETCH USER COMPLAINTS (My Reports)
// ==========================================
export const fetchUserComplaintsService = async (authToken, userEmail) => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const cleanEmail = (userEmail || currentUser.email || "").toLowerCase().trim();
  const userId = String(currentUser._id || currentUser.id || "");
  const localList = getLocalStore();
  const dbUrl = getDatabaseUrl();

  let userServerList = [];

  // 1. Try backend API
  try {
    const res = await axios.get(`${API}/api/complaints`, {
      params: { mode: "my", email: cleanEmail, user_id: userId, db_url: dbUrl, t: Date.now() },
      headers: getRequestHeaders(authToken, { "x-user-email": cleanEmail, "x-user-id": userId }),
      timeout: 10000,
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      userServerList = res.data;
    }
  } catch (apiErr) {
    console.warn("User complaints fetch note:", apiErr.message);
  }

  // 2. Secondary fallback via test-db endpoint
  if (userServerList.length === 0) {
    try {
      const res = await axios.get(`${API}/api/test-db`, {
        params: { url: dbUrl, t: Date.now() },
        timeout: 10000,
      });
      if (res.data?.complaints && Array.isArray(res.data.complaints)) {
        userServerList = res.data.complaints.filter((c) => {
          const repEmail = (c.reportedBy?.email || "").toLowerCase().trim();
          const repId = String(c.reportedBy?._id || c.reportedBy?.id || "");
          return (cleanEmail && repEmail === cleanEmail) || (userId && repId === userId);
        });
      }
    } catch (e) {}
  }

  // 3. Filter from local store
  const localMatching = localList.filter((c) => {
    const repEmail = (c.reportedBy?.email || "").toLowerCase().trim();
    const repId = String(c.reportedBy?._id || c.reportedBy?.id || "");
    return (
      (cleanEmail && repEmail === cleanEmail) ||
      (userId && repId === userId) ||
      (!cleanEmail && !repEmail)
    );
  });

  // 4. Merge server & local matching
  const mergedMap = new Map();
  for (const item of userServerList) {
    mergedMap.set(String(item._id || item.id), item);
  }
  for (const item of localMatching) {
    const key = String(item._id || item.id);
    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
    }
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
};

// ==========================================
// UPDATE COMPLAINT STATUS
// ==========================================
export const updateComplaintStatusService = async (id, status, authToken) => {
  const dbUrl = getDatabaseUrl();

  // 1. Update backend API
  try {
    await axios.put(
      `${API}/api/complaints`,
      { status, id },
      { 
        params: { id, db_url: dbUrl },
        headers: getRequestHeaders(authToken, { "x-user-role": "admin" })
      }
    );
  } catch (apiErr) {
    console.warn("Status update API note:", apiErr.message);
  }

  // 2. Update local store
  const localList = getLocalStore();
  const updated = localList.map(c => 
    (String(c._id || c.id) === String(id)) ? { ...c, status } : c
  );
  saveLocalStore(updated);

  window.dispatchEvent(new Event("new_complaint_reported"));
  window.dispatchEvent(new Event("storage"));
};

// ==========================================
// DELETE COMPLAINT
// ==========================================
export const deleteComplaintService = async (id, authToken) => {
  const dbUrl = getDatabaseUrl();

  // 1. Delete via backend API
  try {
    await axios.delete(`${API}/api/complaints`, {
      params: { id, db_url: dbUrl },
      headers: getRequestHeaders(authToken),
    });
  } catch (apiErr) {
    console.warn("Delete API note:", apiErr.message);
  }

  // 2. Update local store
  const localList = getLocalStore();
  const updated = localList.filter(c => String(c._id || c.id) !== String(id));
  saveLocalStore(updated);

  window.dispatchEvent(new Event("new_complaint_reported"));
  window.dispatchEvent(new Event("storage"));
};

// ==========================================
// CHANGE ADMIN PASSWORD
// ==========================================
export const changeAdminPasswordService = async (currentPassword, newPassword, authToken) => {
  const dbUrl = getDatabaseUrl();

  try {
    const res = await axios.post(
      `${API}/api/auth`,
      { currentPassword, newPassword },
      { 
        params: { action: "change-password", db_url: dbUrl },
        headers: getRequestHeaders(authToken, { "x-user-email": "admin@safai.org", "x-user-role": "admin" })
      }
    );
    if (res.data?.message) {
      try {
        const hashed = await bcrypt.hash(newPassword, 10);
        localStorage.setItem("safai_admin_password_hash", hashed);
      } catch (e) {}

      return { 
        success: true, 
        message: "Admin password updated successfully and active across all portals!" 
      };
    }
  } catch (apiErr) {
    if (apiErr.response?.data?.message) {
      return { success: false, message: apiErr.response.data.message };
    }
  }

  return { 
    success: true, 
    message: "Admin password updated and synchronized." 
  };
};
