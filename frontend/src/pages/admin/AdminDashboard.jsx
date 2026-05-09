import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/client";
import SystemStats from "./SystemStats";
import UserManagement from "./UserManagement";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [draftRoles, setDraftRoles] = useState({});

  async function reload() {
    setError("");
    try {
      const [u, s] = await Promise.all([apiClient.get("/admin/users"), apiClient.get("/admin/stats")]);
      setUsers(u.data);
      setStats(s.data);
    } catch {
      setError("Could not load admin data.");
    }
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const next = {};
    for (const u of users) next[u.id] = u.role;
    setDraftRoles(next);
  }, [users]);

  async function saveRole(userId) {
    const role = draftRoles[userId];
    await apiClient.put(`/admin/users/${userId}/role?role=${encodeURIComponent(role)}`);
    await reload();
  }

  async function deleteUser(userId) {
    if (!window.confirm("Delete this user and related sessions?")) return;
    await apiClient.delete(`/admin/users/${userId}`);
    await reload();
  }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Admin</h2>
        <Link className="btn" to="/admin/oversight">
          System oversight
        </Link>
      </div>
      {error ? <div className="error-message">{error}</div> : null}
      <SystemStats stats={stats} />
      <UserManagement
        users={users}
        draftRoles={draftRoles}
        setDraftRoles={setDraftRoles}
        onSaveRole={saveRole}
        onDeleteUser={deleteUser}
      />
    </div>
  );
}
