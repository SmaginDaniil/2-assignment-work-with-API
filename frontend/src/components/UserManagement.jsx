import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import * as api from "../services/api";

export default function UserManagement() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError("You do not have permission to access this page.");
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError("");
      setSuccess("");
      await api.updateUserRole(userId, newRole);
      setSuccess("User role updated successfully.");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update user role.");
      console.error(err);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>User Management</h2>
      {error && <div style={styles.errorAlert}>{error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={styles.row}>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>{u.role}</td>
              <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td style={styles.td}>
                {u.role === 'admin' ? (
                  <button
                    onClick={() => handleRoleChange(u.id, 'user')}
                    style={styles.buttonDanger}
                  >
                    Demote to User
                  </button>
                ) : (
                  <button
                    onClick={() => handleRoleChange(u.id, 'admin')}
                    style={styles.buttonSuccess}
                  >
                    Promote to Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    padding: "1.5rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    marginTop: "1rem",
  },
  errorAlert: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "0.75rem",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  successAlert: {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "0.75rem",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  error: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "0.75rem",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    borderRadius: "4px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  headerRow: {
    backgroundColor: "#007bff",
    color: "white",
  },
  th: {
    padding: "0.75rem",
    textAlign: "left",
    fontWeight: "bold",
  },
  row: {
    borderBottom: "1px solid #ddd",
  },
  td: {
    padding: "0.75rem",
  },
  buttonSuccess: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  buttonDanger: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};
