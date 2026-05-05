import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import GradeCard from './GradeCard';
import './MyPage.css';

interface Profile {
  nickname: string;
  avatar_url: string;
  phone: string;
  card_last4: string;
  card_expiry: string;
  card_type: string;
}

interface Props {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export default function MyPage({ user, onBack, onLogout }: Props) {
  const [profile, setProfile] = useState<Profile>({
    nickname: '',
    avatar_url: '',
    phone: '',
    card_last4: '',
    card_expiry: '',
    card_type: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editSection, setEditSection] = useState<'profile' | 'payment' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile({
        nickname: data.nickname ?? '',
        avatar_url: data.avatar_url ?? '',
        phone: data.phone ?? '',
        card_last4: data.card_last4 ?? '',
        card_expiry: data.card_expiry ?? '',
        card_type: data.card_type ?? '',
      });
    }
    setLoading(false);
  }

  async function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert('사진 업로드 실패: ' + uploadError.message);
      setAvatarUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    const newAvatarUrl = publicUrl + '?t=' + Date.now();
    await supabase.from('profiles').upsert({ id: user.id, avatar_url: newAvatarUrl });
    setProfile((p) => ({ ...p, avatar_url: newAvatarUrl }));
    setAvatarUploading(false);
  }

  async function handleSaveProfile() {
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      nickname: profile.nickname,
      phone: profile.phone,
    });
    setSaving(false);
    if (error) {
      setSaveMsg('저장 실패: ' + error.message);
    } else {
      setSaveMsg('저장됐어요!');
      setEditSection(null);
    }
    setTimeout(() => setSaveMsg(''), 2500);
  }

  async function handleSavePayment() {
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      card_last4: profile.card_last4,
      card_expiry: profile.card_expiry,
      card_type: profile.card_type,
    });
    setSaving(false);
    if (error) {
      setSaveMsg('저장 실패: ' + error.message);
    } else {
      setSaveMsg('결제 정보가 저장됐어요!');
      setEditSection(null);
    }
    setTimeout(() => setSaveMsg(''), 2500);
  }

  async function handleDeleteAccount() {
    if (!confirm('정말 계정을 삭제할까요? 이 작업은 되돌릴 수 없어요.')) return;
    await supabase.auth.signOut();
    onBack();
  }

  const avatarSrc = profile.avatar_url || null;
  const initials = (profile.nickname || user.email || '?')[0].toUpperCase();

  const isGoogle = user.app_metadata?.provider === 'google';

  if (loading) {
    return (
      <div className="mypage-screen">
        <div className="mypage-loading">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="mypage-screen">
      <div className="mypage-container">
        <div className="mypage-header">
          <button className="mypage-back" onClick={onBack}>← 돌아가기</button>
          <h1 className="mypage-title">마이페이지</h1>
          <div />
        </div>

        {/* 아바타 */}
        <div className="mypage-avatar-section">
          <button className="mypage-avatar-btn" onClick={handleAvatarClick} disabled={avatarUploading}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="프로필" className="mypage-avatar-img" />
            ) : (
              <div className="mypage-avatar-placeholder">{initials}</div>
            )}
            <div className="mypage-avatar-overlay">
              {avatarUploading ? '업로드 중...' : '사진 변경'}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <p className="mypage-avatar-name">{profile.nickname || '닉네임 없음'}</p>
          <p className="mypage-avatar-email">{user.email}</p>
        </div>

        {/* 등급 & 랭킹 */}
        <div className="mypage-section">
          <h2 className="mypage-section-title">트렌드세터 등급</h2>
          <GradeCard />
        </div>

        {/* 프로필 정보 */}
        <div className="mypage-section">
          <div className="mypage-section-header">
            <h2 className="mypage-section-title">프로필 정보</h2>
            {editSection !== 'profile' && (
              <button className="mypage-edit-btn" onClick={() => setEditSection('profile')}>편집</button>
            )}
          </div>

          <div className="mypage-fields">
            <div className="mypage-field">
              <label className="mypage-label">닉네임</label>
              {editSection === 'profile' ? (
                <input
                  className="mypage-input"
                  value={profile.nickname}
                  onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
                  placeholder="닉네임을 입력하세요"
                  maxLength={20}
                />
              ) : (
                <span className="mypage-value">{profile.nickname || '설정 안 됨'}</span>
              )}
            </div>

            <div className="mypage-field">
              <label className="mypage-label">이메일</label>
              <span className="mypage-value mypage-value--readonly">
                {user.email}
                {isGoogle && <span className="mypage-badge">Google</span>}
              </span>
            </div>

            <div className="mypage-field">
              <label className="mypage-label">전화번호</label>
              {editSection === 'profile' ? (
                <input
                  className="mypage-input"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  type="tel"
                />
              ) : (
                <span className="mypage-value">{profile.phone || '설정 안 됨'}</span>
              )}
            </div>
          </div>

          {editSection === 'profile' && (
            <div className="mypage-action-row">
              <button className="mypage-cancel-btn" onClick={() => { setEditSection(null); loadProfile(); }}>취소</button>
              <button className="mypage-save-btn" onClick={handleSaveProfile} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </div>

        {/* 결제 정보 */}
        <div className="mypage-section">
          <div className="mypage-section-header">
            <h2 className="mypage-section-title">결제 정보</h2>
            {editSection !== 'payment' && (
              <button className="mypage-edit-btn" onClick={() => setEditSection('payment')}>편집</button>
            )}
          </div>

          {editSection === 'payment' ? (
            <div className="mypage-fields">
              <div className="mypage-field">
                <label className="mypage-label">카드사</label>
                <select
                  className="mypage-input mypage-select"
                  value={profile.card_type}
                  onChange={(e) => setProfile((p) => ({ ...p, card_type: e.target.value }))}
                >
                  <option value="">선택</option>
                  <option value="신한">신한카드</option>
                  <option value="KB국민">KB국민카드</option>
                  <option value="현대">현대카드</option>
                  <option value="삼성">삼성카드</option>
                  <option value="롯데">롯데카드</option>
                  <option value="우리">우리카드</option>
                  <option value="하나">하나카드</option>
                  <option value="BC">BC카드</option>
                </select>
              </div>
              <div className="mypage-field">
                <label className="mypage-label">카드 끝 4자리</label>
                <input
                  className="mypage-input"
                  value={profile.card_last4}
                  onChange={(e) => setProfile((p) => ({ ...p, card_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              <div className="mypage-field">
                <label className="mypage-label">유효기간</label>
                <input
                  className="mypage-input"
                  value={profile.card_expiry}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                    setProfile((p) => ({ ...p, card_expiry: v }));
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="mypage-action-row">
                <button className="mypage-cancel-btn" onClick={() => { setEditSection(null); loadProfile(); }}>취소</button>
                <button className="mypage-save-btn" onClick={handleSavePayment} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : profile.card_last4 ? (
            <div className="mypage-card-preview">
              <div className="mypage-card">
                <span className="mypage-card-type">{profile.card_type || '카드'}</span>
                <span className="mypage-card-num">**** **** **** {profile.card_last4}</span>
                <span className="mypage-card-expiry">{profile.card_expiry}</span>
              </div>
            </div>
          ) : (
            <p className="mypage-empty">등록된 결제 수단이 없어요.</p>
          )}
        </div>

        {saveMsg && <p className="mypage-save-msg">{saveMsg}</p>}

        {/* 계정 관리 */}
        <div className="mypage-section mypage-section--danger">
          <h2 className="mypage-section-title">계정 관리</h2>
          <div className="mypage-danger-btns">
            <button className="mypage-logout-btn" onClick={onLogout}>로그아웃</button>
            <button className="mypage-delete-btn" onClick={handleDeleteAccount}>계정 삭제</button>
          </div>
        </div>
      </div>
    </div>
  );
}
