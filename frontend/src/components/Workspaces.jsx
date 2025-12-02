import React, { useEffect, useState } from 'react';
import { getWorkspaces, createWorkspace } from '../services/api';

export default function Workspaces({ selectedId, onSelect }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      const ws = await getWorkspaces();
      setWorkspaces(ws);
    })();
  }, []);

  const addWorkspace = async () => {
    if (!name.trim()) return;
    const res = await createWorkspace({ name });
    setWorkspaces((w) => [...w, res]);
    setName('');
  };

  return (
    <div className="workspaces">
      <h3>Workspaces</h3>
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {workspaces.map((w) => (
          <li key={w.id} style={{ padding: '6px 8px', borderRadius: 6, background: w.id === selectedId ? '#eef' : 'transparent', cursor: 'pointer' }} onClick={() => onSelect(w.id)}>
            {w.name}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New workspace name" style={{ width: '100%', padding: 8 }} />
        <div style={{ marginTop: 6 }}>
          <button className="btn" onClick={addWorkspace}>Create workspace</button>
        </div>
      </div>
    </div>
  );
}
