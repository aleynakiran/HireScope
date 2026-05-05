import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

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

  const [draftRoles, setDraftRoles] = useState({});

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
      <h2 style={{ marginTop: 0 }}>Admin</h2>

      {error ? <div className="error-message">{error}</div> : null}

      {stats ? (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 18 }}>
            <div>
              <div className="muted">Users</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total_users}</div>
            </div>
            <div>
              <div className="muted">Sessions</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total_sessions}</div>
            </div>
            <div>
              <div className="muted">Avg evaluation score</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {stats.average_score == null ? "—" : stats.average_score.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <strong>Users</strong>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>2FA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="select"
                    value={draftRoles[u.id] || u.role}
                    onChange={(e) => setDraftRoles((prev) => ({ ...prev, [u.id]: e.target.value }))}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.is_2fa_enabled ? "on" : "off"}</td>
                <td className="row">
                  <button type="button" className="btn primary" onClick={() => saveRole(u.id)}>
                    Save role
                  </button>
                  <button type="button" className="btn danger" onClick={() => deleteUser(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
