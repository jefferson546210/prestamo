import { useState, useEffect } from 'react';

export default function LoginForm() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!correo.trim()) {
      nuevosErrores.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = 'Ingresa un correo válido';
    }
    if (!password) {
      nuevosErrores.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleCorreoChange = (e) => {
    const valor = e.target.value;
    setCorreo(valor);
    if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      setErrores(prev => ({ ...prev, correo: 'Ingresa un correo válido' }));
    } else {
      setErrores(prev => ({ ...prev, correo: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const valor = e.target.value;
    setPassword(valor);
    if (valor && valor.length < 6) {
      setErrores(prev => ({ ...prev, password: 'La contraseña debe tener al menos 6 caracteres' }));
    } else {
      setErrores(prev => ({ ...prev, password: '' }));
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validarFormulario()) {
      setMensaje('Por favor, corrige los errores del formulario');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      setMensaje('Inicio de sesión exitoso. Redirigiendo...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error) {
      console.error('Error en login:', error);
      setMensaje('Ocurrió un error inesperado. Intenta nuevamente');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, width: '100%', margin: '0 16px' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.08)', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Bienvenido</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }} noValidate>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={handleCorreoChange}
              onBlur={validarFormulario}
              placeholder="correo@ejemplo.com"
              disabled={loading}
              autoComplete="email"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: `1px solid ${errores.correo ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: 10, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
            {errores.correo && <p style={{ marginTop: 4, fontSize: 12, color: '#dc2626' }}>{errores.correo}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                onBlur={validarFormulario}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 14, paddingRight: 40,
                  border: `1px solid ${errores.password ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: 10, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                  padding: 4, display: 'flex',
                }}
                tabIndex={-1}
              >
                {mostrarPassword ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            {errores.password && <p style={{ marginTop: 4, fontSize: 12, color: '#dc2626' }}>{errores.password}</p>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
              <input type="checkbox" disabled={loading} style={{ width: 16, height: 16 }} />
              Recordarme
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', fontSize: 15, fontWeight: 700, color: 'white',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                </svg>
                Verificando...
              </>
            ) : 'Iniciar Sesión'}
          </button>

          {mensaje && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, fontSize: 13, textAlign: 'center',
              background: mensaje.includes('exitoso') ? '#f0fdf4' : '#fef2f2',
              color: mensaje.includes('exitoso') ? '#16a34a' : '#dc2626',
              border: `1px solid ${mensaje.includes('exitoso') ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {mensaje}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
