/**
 * Input 컴포넌트
 *
 * Props:
 *   label      : 라벨 텍스트
 *   hint       : 라벨 우측 보조 텍스트
 *   error      : 에러 메시지 (있으면 빨간 테두리 + 메시지 표시)
 *   success    : 성공 메시지 (있으면 초록 테두리 + 메시지 표시)
 *   prefix     : 입력창 왼쪽 아이콘/텍스트
 *   suffix     : 입력창 오른쪽 아이콘/텍스트
 */

'use client';

export default function Input({
  label,
  hint,
  error,
  success,
  prefix,
  suffix,
  style = {},
  containerStyle = {},
  ...props
}) {
  const borderColor = error
    ? 'rgba(229,57,53,0.6)'
    : success
    ? 'rgba(76,175,80,0.6)'
    : 'rgba(200,155,0,0.3)';

  return (
    <div style={{ ...containerStyle }}>
      {/* 라벨 */}
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#C8B878', letterSpacing: 0.5 }}>
            {label}
          </span>
          {hint && (
            <span style={{ fontSize: 10, color: '#8A8060' }}>{hint}</span>
          )}
        </div>
      )}

      {/* 입력창 */}
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#5a5030', fontSize: 14, pointerEvents: 'none',
          }}>
            {prefix}
          </span>
        )}
        <input
          style={{
            width: '100%',
            background: '#141200',
            border: `1px solid ${borderColor}`,
            color: '#E8DFC0',
            padding: `9px ${suffix ? 40 : 12}px 9px ${prefix ? 38 : 12}px`,
            borderRadius: 4,
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color .15s',
            ...style,
          }}
          {...props}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#8A8060',
          }}>
            {suffix}
          </span>
        )}
      </div>

      {/* 에러/성공 메시지 */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 6, fontSize: 12, color: '#E53935',
        }}>
          ⚠ {error}
        </div>
      )}
      {success && !error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 6, fontSize: 12, color: '#4CAF50',
        }}>
          ✓ {success}
        </div>
      )}
    </div>
  );
}
