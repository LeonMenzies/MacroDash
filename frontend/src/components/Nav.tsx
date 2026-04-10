import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'MACRO' },
  { to: '/exec-summary', label: 'EXEC SUMMARY' },
  { to: '/catalyst-brain', label: 'CATALYST BRAIN' },
  { to: '/ideas', label: 'IDEAS' },
];

export default function Nav() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: 44,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--blue)',
        marginRight: 32,
        letterSpacing: '0.1em',
      }}>
        MACRODASH
      </span>
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            padding: '0 16px',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: isActive ? 'var(--text)' : 'var(--muted)',
            borderBottom: isActive ? '2px solid var(--blue)' : '2px solid transparent',
            transition: 'color 0.15s',
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
