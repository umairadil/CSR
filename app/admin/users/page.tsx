"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type UserRow = { id: string; name: string | null; email: string; role: 'ADMIN' | 'CSR_AGENT'; status?: 'ACTIVE' | 'DISABLED'; createdAt: string };

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // create form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CSR_AGENT'>('CSR_AGENT');
  const [status, setStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=1&pageSize=100`);
      const json = await res.json();
      setRows(json.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createUser() {
    await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role, status }) });
    setName(''); setEmail(''); setPassword(''); setRole('CSR_AGENT'); setStatus('ACTIVE');
    await load();
  }

  async function updateUser(id: string, patch: Partial<UserRow> & { password?: string }) {
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    await load();
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage users</p>
        </div>
      </div>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className="h-9 rounded border bg-background px-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as any)}>
                <option value="CSR_AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="flex items-center gap-2">
                <select className="h-9 rounded border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
                <Button onClick={createUser} disabled={!email || !password}>Create</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users</CardTitle>
              <div className="flex items-center gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="w-[240px]" />
                <Button variant="outline" onClick={load} disabled={loading}>Search</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Created</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">{u.name ?? '-'}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">
                        <select className="h-8 rounded border bg-background px-2 text-sm" value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value as any })}>
                          <option value="CSR_AGENT">Agent</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select className="h-8 rounded border bg-background px-2 text-sm" value={u.status ?? 'ACTIVE'} onChange={(e) => updateUser(u.id, { status: e.target.value as any })}>
                          <option value="ACTIVE">Active</option>
                          <option value="DISABLED">Disabled</option>
                        </select>
                      </td>
                      <td className="p-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={async () => {
                            const pwd = window.prompt('New password?');
                            if (!pwd) return;
                            await updateUser(u.id, { password: pwd });
                          }}>Reset Password</Button>
                          <Button variant="outline" size="sm" onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}





