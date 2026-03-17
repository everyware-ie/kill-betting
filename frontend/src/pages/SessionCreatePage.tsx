import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi } from '../api';
import type { RuleType } from '../types';

const RULE_PRESETS = [
  {
    name: '스탠다드',
    desc: '기본 킬내기 규칙',
    rules: [] as Array<{ ruleType: RuleType; killValue: number }>,
  },
  {
    name: '하드코어',
    desc: '패널티 강화 규칙',
    rules: [
      { ruleType: 'SURVIVAL_PENALTY' as RuleType, killValue: -2 },
      { ruleType: 'CONSECUTIVE_DEATH_PENALTY' as RuleType, killValue: -1 },
    ],
  },
  {
    name: '예능 모드',
    desc: '보너스 중심 규칙',
    rules: [
      { ruleType: 'CHICKEN_BONUS' as RuleType, killValue: 5 },
      { ruleType: 'PLACEMENT_BONUS' as RuleType, killValue: 2 },
    ],
  },
];

export default function SessionCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [targetKills, setTargetKills] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await sessionApi.create({
        name,
        targetKills: targetKills ? Number(targetKills) : undefined,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
        rules: RULE_PRESETS[selectedPreset].rules,
      });
      navigate(`/sessions/${data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '세션 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/')}>← 뒤로</button>
        <h2 style={styles.title}>새 킬내기 세션</h2>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>세션 이름</label>
        <input style={styles.input} placeholder="예: 화요일 밤 킬내기" value={name}
          onChange={(e) => setName(e.target.value)} required />

        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>목표 킬 수</label>
            <input style={styles.input} type="number" placeholder="예: 100" value={targetKills}
              onChange={(e) => setTargetKills(e.target.value)} min="1" />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>제한 시간 (분)</label>
            <input style={styles.input} type="number" placeholder="예: 120" value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value)} min="1" />
          </div>
        </div>

        <label style={styles.label}>룰 프리셋</label>
        <div style={styles.presets}>
          {RULE_PRESETS.map((preset, idx) => (
            <div key={idx} style={{ ...styles.preset, ...(selectedPreset === idx ? styles.presetSelected : {}) }}
              onClick={() => setSelectedPreset(idx)}>
              <span style={styles.presetName}>{preset.name}</span>
              <span style={styles.presetDesc}>{preset.desc}</span>
              {preset.rules.length > 0 && (
                <div style={styles.presetRules}>
                  {preset.rules.map((r, i) => (
                    <span key={i} style={styles.ruleTag}>
                      {r.ruleType === 'CHICKEN_BONUS' && `치킨 보너스 +${r.killValue}킬`}
                      {r.ruleType === 'SURVIVAL_PENALTY' && `생존 패널티 ${r.killValue}킬`}
                      {r.ruleType === 'CONSECUTIVE_DEATH_PENALTY' && `연속사망 패널티 ${r.killValue}킬`}
                      {r.ruleType === 'PLACEMENT_BONUS' && `순위 보너스 +${r.killValue}킬`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? '생성 중...' : '세션 생성하기'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0f1923', color: '#fff', padding: '20px 16px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  back: { background: 'transparent', color: '#8899aa', border: 'none', fontSize: '16px', cursor: 'pointer' },
  title: { margin: 0, fontSize: '20px' },
  form: { maxWidth: '480px', margin: '0 auto' },
  label: { display: 'block', color: '#8899aa', fontSize: '13px', marginBottom: '6px', marginTop: '16px' },
  input: { width: '100%', padding: '12px', background: '#1a2634', border: '1px solid #2a3a4a', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '12px' },
  col: { flex: 1 },
  presets: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' },
  preset: { background: '#1a2634', border: '2px solid #2a3a4a', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' },
  presetSelected: { borderColor: '#f5a623' },
  presetName: { fontWeight: 'bold', fontSize: '15px' },
  presetDesc: { color: '#8899aa', fontSize: '12px' },
  presetRules: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' },
  ruleTag: { background: '#0f1923', color: '#f5a623', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' },
  button: { width: '100%', padding: '14px', background: '#f5a623', color: '#000', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '24px' },
  error: { color: '#ff4d4d', fontSize: '13px', marginTop: '8px' },
};
