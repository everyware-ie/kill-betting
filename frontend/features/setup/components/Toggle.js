export default function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? '#F5A623' : '#2a2810',
        border: '1px solid rgba(200,155,0,0.25)',
        cursor: 'pointer', position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 19 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: 'white', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.4)',
      }} />
    </div>
  );
}