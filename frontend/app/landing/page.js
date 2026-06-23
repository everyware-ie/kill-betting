'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth-context';

const STEPS = [
  {
    n: 1,
    title: '회원가입 / 로그인',
    desc: '이메일로 가입하고 로그인합니다. "자동로그인"을 체크해두면 다음 방문 시 바로 입장할 수 있습니다.',
    image: '/guide/01-login.png',
  },
  {
    n: 2,
    title: '대시보드에서 방 만들기',
    desc: '대시보드에서 "방 만들기"를 선택해 새로운 킬내기 세션을 시작합니다. 초대받은 경우 초대 코드로 바로 참여할 수도 있습니다.',
    image: '/guide/02-dashboard.png',
  },
  {
    n: 3,
    title: '방 설정 (룰 정하기)',
    desc: '방 제목, 목표 킬 수, 제한 시간, 치킨 보너스 등 세션 룰을 설정합니다. 룰은 한 판으로 끝나는 게 아니라 누적 점수 기준으로 동작합니다.',
    image: '/guide/03-create-room.png',
  },
  {
    n: 4,
    title: '팀 구성 & 초대 코드 공유',
    desc: '기본 2개 팀(ALPHA, BRAVO)이 자동 생성됩니다. 팀별로 닉네임을 등록하고 리더를 지정한 뒤, 우측 상단의 초대 코드(또는 URL)를 팀원에게 공유하세요.',
    image: '/guide/04-invite.png',
  },
  {
    n: 5,
    title: '라이브 스코어보드 진입',
    desc: '매치 시작 시 라이브 스코어보드로 이동합니다. 매판 진행 상황과 누적 점수, 각 팀 통계가 실시간으로 표시되며, 내 팀 카드에서 "결과 입력"을 눌러 한 판 결과를 제출합니다.',
    image: '/guide/05-upload.png',
  },
  {
    n: 6,
    title: '매치 결과 업로드 (OCR 자동 분석)',
    desc: '배그 게임 결과 화면 스크린샷을 드래그하거나 붙여넣으면 OCR이 닉네임·킬·데미지·순위를 자동으로 채웁니다. 치킨 여부만 체크하고 "우리 팀 결과 제출"을 누르면 점수가 즉시 집계됩니다.',
    image: '/guide/06-upload.png',
  },
];

function StepCard({ step }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
      gap: 28,
      alignItems: 'center',
      padding: '32px 0',
      borderBottom: '1px solid var(--kn-border)',
    }}>
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 10px',
          background: 'var(--kn-accent-bg)',
          color: 'var(--kn-accent)',
          borderRadius: 'var(--kn-r-sm)',
          fontSize: 12, fontWeight: 'var(--kn-w-semi)',
          marginBottom: 12,
        }}>
          STEP {String(step.n).padStart(2, '0')}
        </div>
        <h3 style={{
          fontSize: 22, fontWeight: 'var(--kn-w-bold)',
          letterSpacing: '-0.02em',
          margin: 0, marginBottom: 10,
        }}>
          {step.title}
        </h3>
        <p style={{
          fontSize: 14, lineHeight: 1.7,
          color: 'var(--kn-text-muted)',
          margin: 0,
        }}>
          {step.desc}
        </p>
      </div>
      <div style={{
        position: 'relative',
        borderRadius: 'var(--kn-r-md)',
        border: '1px solid var(--kn-border)',
        background: 'var(--kn-surface-2)',
        overflow: 'hidden',
        aspectRatio: '16 / 10',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={step.image}
          alt={step.title}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top',
            display: 'block',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const primaryCta = user
    ? { label: '대시보드로 이동', href: '/dashboard' }
    : { label: '지금 시작하기', href: '/auth/signup' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        padding: '64px 24px 48px',
        maxWidth: 960,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          borderRadius: 999,
          background: 'var(--kn-accent-bg)',
          color: 'var(--kn-accent)',
          fontSize: 12, fontWeight: 'var(--kn-w-semi)',
          marginBottom: 20,
        }}>
          <Icon name="target" size={13} />
          배그 킬내기, 점수는 자동으로
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 'var(--kn-w-bold)',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          margin: 0, marginBottom: 16,
        }}>
          매치 결과만 올리세요.<br />
          <span style={{ color: 'var(--kn-accent)' }}>점수 계산은 Killnagi가 합니다.</span>
        </h1>
        <p style={{
          fontSize: 16, lineHeight: 1.7,
          color: 'var(--kn-text-muted)',
          maxWidth: 600, margin: '0 auto 28px',
        }}>
          세션 룰만 설정하면 매치 결과 이미지에서 킬 수·순위를 자동으로 읽어
          팀별 누적 점수를 집계해드립니다. 더 이상 엑셀로 점수 계산하지 마세요.
        </p>
        <div style={{
          display: 'flex', gap: 10,
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push(primaryCta.href)}
            iconRight="arrow-right"
          >
            {primaryCta.label}
          </Button>
          {!user && (
            <Button variant="outline" size="lg" onClick={() => router.push('/auth/login')}>
              로그인
            </Button>
          )}
        </div>
      </section>

      {/* 핵심 기능 3컬럼 */}
      <section style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '24px 24px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {[
          { icon: 'image', title: '이미지 한 장이면 끝', desc: '매치 결과 캡쳐를 올리면 OCR이 킬 수·순위를 읽어 점수를 계산합니다.' },
          { icon: 'users', title: '팀/세션 룰 자유 설정', desc: '킬당 점수, 순위 점수 등 세션마다 자유롭게 룰을 설정할 수 있습니다.' },
          { icon: 'trophy', title: '자동 집계 스코어보드', desc: '매치가 누적될 때마다 실시간으로 팀별 누적 점수가 집계됩니다.' },
        ].map((f) => (
          <div key={f.title} style={{
            padding: 20,
            background: 'var(--kn-surface-1)',
            border: '1px solid var(--kn-border)',
            borderRadius: 'var(--kn-r-md)',
          }}>
            <div style={{
              width: 36, height: 36,
              display: 'grid', placeItems: 'center',
              borderRadius: 'var(--kn-r-sm)',
              background: 'var(--kn-accent-bg)',
              color: 'var(--kn-accent)',
              marginBottom: 12,
            }}>
              <Icon name={f.icon} size={18} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-semi)', marginBottom: 6 }}>
              {f.title}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--kn-text-muted)' }}>
              {f.desc}
            </div>
          </div>
        ))}
      </section>

      {/* 사용 가이드 */}
      <section style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '32px 24px 64px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontSize: 12, fontWeight: 'var(--kn-w-semi)',
            color: 'var(--kn-accent)',
            marginBottom: 8, letterSpacing: '0.04em',
          }}>
            HOW TO USE
          </div>
          <h2 style={{
            fontSize: 28, fontWeight: 'var(--kn-w-bold)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            6단계로 끝나는 킬내기 진행
          </h2>
        </div>

        <div>
          {STEPS.map((s) => <StepCard key={s.n} step={s} />)}
        </div>
      </section>

      {/* 하단 CTA */}
      <section style={{
        maxWidth: 720,
        margin: '0 auto 80px',
        padding: '40px 24px',
        textAlign: 'center',
        background: 'var(--kn-surface-1)',
        border: '1px solid var(--kn-border)',
        borderRadius: 'var(--kn-r-lg)',
      }}>
        <h2 style={{
          fontSize: 24, fontWeight: 'var(--kn-w-bold)',
          letterSpacing: '-0.02em',
          margin: 0, marginBottom: 10,
        }}>
          준비됐다면, 첫 방을 만들어보세요
        </h2>
        <p style={{
          fontSize: 14, color: 'var(--kn-text-muted)',
          margin: 0, marginBottom: 20,
        }}>
          몇 분이면 충분합니다. 점수 계산은 저희가 합니다.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push(primaryCta.href)}
          icon="arrow-right"
          iconPosition="right"
        >
          {primaryCta.label}
        </Button>
      </section>
    </div>
  );
}
