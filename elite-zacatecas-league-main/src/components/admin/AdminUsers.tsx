import { Shield } from 'react';

const adminUsers = [
  { email: 'admin1@example.com', password: 'password123' },
  { email: 'admin2@example.com', password: 'password456' },
  { email: 'admin3@example.com', password: 'password789' },
];

export function AdminUsers() {
  return (
    <div className="card-gold">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Administradores</h2>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {adminUsers.map((admin, index) => (
          <div key={index} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm">{admin.email}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Contraseña: {admin.password}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
