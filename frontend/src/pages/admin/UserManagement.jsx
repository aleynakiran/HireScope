export default function UserManagement({ users, draftRoles, setDraftRoles, onSaveRole, onDeleteUser }) {
  return (
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
                <button
                  data-testid="change-role-btn"
                  type="button"
                  className="btn primary"
                  onClick={() => onSaveRole(u.id)}
                >
                  Save role
                </button>
                <button type="button" className="btn danger" onClick={() => onDeleteUser(u.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
