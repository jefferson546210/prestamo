import { useState, useEffect } from 'react';

export default function Sidebar() {
  const [currentPath, setCurrentPath] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    const stored = localStorage.getItem('darkMode');
    if (stored === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', next);
  }

  function isActive(href) {
    if (href === '/dashboard') return currentPath === '/dashboard';
    return currentPath.startsWith(href);
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/></svg>,
    },
    {
      href: '/dashboard/clientes',
      label: 'Clientes',
      icon: <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    },
    {
      href: '/dashboard/prestamos',
      label: 'Préstamos',
      icon: <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
    },
    {
      href: '/dashboard/pagos',
      label: 'Pagos',
      icon: <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    },
    {
      href: '/dashboard/reporte',
      label: 'Reportes',
      icon: <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
    },
  ];

  const linkBase = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 14px', borderRadius: '10px',
    fontSize: '0.875rem', textDecoration: 'none',
    transition: 'all 0.15s', fontWeight: 500,
  };

  const linkActive = { ...linkBase, background: '#16a34a', color: 'white', fontWeight: 600 };
  const linkInactive = { ...linkBase, color: 'var(--text-nav)' };

  return (
    <aside style={{
      width: '240px', minWidth: '240px', height: '100vh',
      background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column',
      padding: '24px 16px', borderRight: '1px solid var(--border)',
      overflowY: 'auto',
    }}>

      {/* Logo */}
      <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#16a34a', marginBottom: '28px', letterSpacing: '-0.02em' }}>
        💰 PRÉSTAMOS
      </div>

      {/* Navegación */}
        <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '14px' }}>
        Navegación
      </p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '24px' }}>
        {navItems.map(item => (
          
           <a key={item.href}
            href={item.href}
            style={isActive(item.href) ? linkActive : linkInactive}
            onMouseEnter={e => { if (!isActive(item.href)) { e.currentTarget.style.background = darkMode ? '#1a3a2a' : '#f0fdf4'; e.currentTarget.style.color = darkMode ? '#16a34a' : '#16a34a'; } }}
            onMouseLeave={e => { if (!isActive(item.href)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      {/* Soporte */}
        <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '14px' }}>
        Soporte
      </p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {[
          { href: '/dashboard/configuracion', label: 'Configuración', icon: <svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
          { href: '#', label: 'Ayuda', icon: <svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
        ].map(item => (
          
            <a key={item.href}
            href={item.href}
            style={linkInactive}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}

        {/* Dark mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', fontSize: '0.875rem', color: 'var(--text-nav)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            Dark mode
          </div>
          <button
            onClick={toggleDark}
            style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative', background: darkMode ? '#16a34a' : '#cbd5e1', transition: 'background 0.2s' }}
          >
            <span style={{ position: 'absolute', top: '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: darkMode ? 'translateX(18px)' : 'translateX(2px)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </nav>

      {/* Card inferior */}
      <div style={{ marginTop: 'auto', background: '#16a34a', borderRadius: '16px', padding: '20px', color: 'white' }}>
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.3 }}>Sistema de Préstamos</h4>
        <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '4px' }}>Gestiona clientes, préstamos y pagos desde un solo lugar.</p>
        
          <a href="/dashboard/clientes/nuevo"
          style={{ display: 'block', marginTop: '14px', background: 'white', color: '#16a34a', fontSize: '0.875rem', fontWeight: 700, borderRadius: '10px', padding: '9px', textAlign: 'center', textDecoration: 'none' }}
        >
          Nuevo Cliente
        </a>
      </div>
    </aside>
  );
}