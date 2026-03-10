/**
 * LoginPage — страница входа (1:1 копия старого Stels / ExtJS 4.2.1 Gray)
 *
 * Структура:
 *   Логотип (320×90, margin 80px auto 25px auto)
 *   Framed panel 350×200 (margin 5px auto 0 auto)
 *     Язык:         [Русский ▼]
 *     Имя:          [________]
 *     Пароль:       [________]
 *                   ☐ Запомнить меня
 *                   ☐ Мобильная версия
 *     ─────────────────────────────
 *     [Забыли свой пароль?]  [Вход]
 *
 * По номеру определяется роль:
 *   +79160966669  → user  (мониторинг)
 *   +79252907661  → admin (биллинг-админка)
 */
import { useState, type FormEvent, type CSSProperties } from 'react';
import { setToken } from '@/api/client';

// ─── MVP: Hardcoded пользователи ────────────────────────────────────────

interface MockUser {
  phone: string;
  password: string;
  role: 'user' | 'admin';
  name: string;
  orgId: number;
}

const MOCK_USERS: MockUser[] = [
  {
    phone: '+79160966669',
    password: 'sosgps',
    role: 'user',
    name: 'Оператор',
    orgId: 1,
  },
  {
    phone: '+79252907661',
    password: 'sosgpsAdmin',
    role: 'admin',
    name: 'Администратор',
    orgId: 1,
  },
];

// UTF-8 safe Base64 — btoa() падает на кириллице (InvalidCharacterError)
function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

// Простой JWT-like токен (для MVP, без криптографии)
function generateMockToken(user: MockUser): string {
  const payload = {
    sub: user.phone,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  return utf8ToBase64(JSON.stringify({ alg: 'none' }))
    + '.' + utf8ToBase64(JSON.stringify(payload))
    + '.mock';
}

// Нормализация номера телефона (убираем пробелы, скобки, дефисы)
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

// ─── Свойства ───────────────────────────────────────────────────────────

interface LoginPageProps {
  onLogin: (role: 'user' | 'admin', orgId: number) => void;
}

// ─── Компонент ──────────────────────────────────────────────────────────

export function LoginPage({ onLogin }: LoginPageProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalized = normalizePhone(phone);
    const user = MOCK_USERS.find(
      u => normalizePhone(u.phone) === normalized && u.password === password
    );

    if (!user) {
      setError('Неверный логин и/или пароль');
      setLoading(false);
      return;
    }

    const token = generateMockToken(user);
    setToken(token);

    localStorage.setItem('wayrecall_user', JSON.stringify({
      userId: user.phone,
      name: user.name,
      roles: [user.role],
      companyId: String(user.orgId),
    }));

    setTimeout(() => {
      setLoading(false);
      onLogin(user.role, user.orgId);
    }, 300);
  };

  /* ─── Рендер (1:1 со старым Stels / ExtJS 4.2.1 Gray) ─────────────── */
  return (
    <div style={S.page}>
      {/* Логотип: PNG из оригинального Stels (ksb_logon_screen.png 320×90) */}
      <img
        src="/images/ksb_logon_screen.png"
        alt="Система мониторинга транспорта"
        width={320}
        height={90}
        style={S.logo}
      />

      {/* ═══ ExtJS framed panel (frame:true, width:350, height:200) ═══ */}
      <div style={S.frameOuter}>
        <div style={S.frameInner}>
          {/* ── Panel header (серый градиент, bold 11px) ── */}
          <div style={S.header}>Вход в систему</div>

          {/* ── Panel body (bodyPadding: 5px 5px 0) ── */}
          <div style={S.body}>
            <form onSubmit={handleSubmit}>
              {/* 1. Язык */}
              <div style={S.row}>
                <label style={S.label}>Язык:</label>
                <div style={S.inputWrap}>
                  <select style={S.select} defaultValue="ru">
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>

              {/* 2. Имя */}
              <div style={S.row}>
                <label style={S.label}>Имя:</label>
                <div style={S.inputWrap}>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={S.input}
                    autoFocus
                  />
                </div>
              </div>

              {/* 3. Пароль */}
              <div style={S.row}>
                <label style={S.label}>Пароль:</label>
                <div style={S.inputWrap}>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={S.input}
                  />
                </div>
              </div>

              {/* 4. ☐ Запомнить меня (checked:false по дефолту) */}
              <div style={S.row}>
                <div style={S.labelSpacer} />
                <label style={S.checkLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={S.checkbox}
                  />
                  Запомнить меня
                </label>
              </div>

              {/* 5. ☐ Мобильная версия */}
              <div style={S.row}>
                <div style={S.labelSpacer} />
                <label style={S.checkLabel}>
                  <input type="checkbox" style={S.checkbox} />
                  Мобильная версия
                </label>
              </div>

              {/* Ошибка авторизации (ExtJS MessageBox стиль) */}
              {error && (
                <div style={S.error}>
                  <b>Ошибка авторизации</b>
                  <br />
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* ── Panel fbar (кнопки внизу) ── */}
          <div style={S.fbar}>
            <button type="button" style={{ ...S.btn, marginRight: 6 }}>
              Забыли свой пароль?
            </button>
            <div style={{ flex: 1 }} />
            <button
              type="submit"
              disabled={loading}
              style={{ ...S.btn, marginRight: 6, opacity: loading ? 0.6 : 1 }}
              onClick={handleSubmit as any}
            >
              {loading ? 'Вход...' : 'Вход'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Стили — ExtJS 4.2.1 Gray Theme (ext-all-gray.css), frame:true panel
// ═══════════════════════════════════════════════════════════════════════════

const FONT = 'tahoma, arial, verdana, sans-serif';

const S: Record<string, CSSProperties> = {
  /* Страница — белый фон, ExtJS body default: font 12px tahoma, color black */
  page: {
    minHeight: '100vh',
    background: '#fff',
    fontFamily: FONT,
    fontSize: 12,
    color: 'black',
    margin: 0,
    padding: 0,
  },

  /* Логотип — margin:80px auto 25px auto; display:block (login.html) */
  logo: {
    display: 'block',
    margin: '80px auto 25px auto',
  },

  /* Frame outer — framed panel: border #d0d0d0, bg #f1f1f1, radius 4px, padding 4px */
  frameOuter: {
    width: 350,
    margin: '5px auto 0 auto',
    border: '1px solid #d0d0d0',
    borderRadius: 4,
    background: '#f1f1f1',
    padding: 4,
  },

  /* Frame inner — внутренний контейнер */
  frameInner: {
    overflow: 'hidden',
  },

  /* Panel header — серый градиент #f0f0f0→#d7d7d7, bold 11px tahoma, color #333 */
  header: {
    background: 'linear-gradient(to bottom, #f0f0f0, #d7d7d7)',
    border: '1px solid #d0d0d0',
    borderBottomWidth: 0,
    borderRadius: '4px 4px 0 0',
    padding: '4px 5px',
    fontWeight: 'bold',
    fontSize: 11,
    fontFamily: FONT,
    color: '#333',
    lineHeight: '15px',
  },

  /* Panel body — background #f1f1f1, bodyPadding: 5px 5px 0 */
  body: {
    background: '#f1f1f1',
    padding: '5px 5px 0',
  },

  /* Строка поля */
  row: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 4,
    height: 24,
  },

  /* Label — width:125, textAlign:right, font 11px, color black */
  label: {
    width: 125,
    textAlign: 'right',
    paddingRight: 5,
    fontSize: 11,
    fontFamily: FONT,
    color: 'black',
    flexShrink: 0,
    lineHeight: '13px',
    marginTop: 4,
  },

  /* Пустой label spacer для чекбоксов (125px пустоты слева) */
  labelSpacer: {
    width: 125,
    paddingRight: 5,
    flexShrink: 0,
  },

  /* Обёртка инпута — ровно 175px (300 - 125) */
  inputWrap: {
    width: 175,
    flexShrink: 0,
  },

  /* ExtJS textfield: border #b5b8c8, высота 22px, font 12px tahoma */
  input: {
    width: '100%',
    height: 22,
    padding: '1px 3px 2px 3px',
    border: '1px solid #b5b8c8',
    borderRadius: 0,
    fontSize: 12,
    fontFamily: FONT,
    color: 'black',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },

  /* ExtJS combobox (select) */
  select: {
    width: '100%',
    height: 22,
    padding: '1px 3px',
    border: '1px solid #b5b8c8',
    borderRadius: 0,
    fontSize: 11,
    fontFamily: FONT,
    color: 'black',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },

  /* Checkbox label — font 11px, color black */
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    fontFamily: FONT,
    color: 'black',
    cursor: 'pointer',
    userSelect: 'none',
    lineHeight: '13px',
    marginTop: 4,
  },

  checkbox: {
    marginRight: 4,
  },

  /* Ошибка — стиль Ext.MessageBox.ERROR */
  error: {
    background: '#fee',
    border: '1px solid #dd7777',
    color: '#aa0000',
    padding: '4px 8px',
    margin: '4px 0 0 130px',
    fontSize: 11,
    fontFamily: FONT,
  },

  /* Footer bar — ExtJS panel fbar: transparent bg, no border */
  fbar: {
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    padding: '3px 0 2px 6px',
  },

  /* ExtJS Gray button (default small): gradient #fff→#eee, border #bbb */
  btn: {
    display: 'inline-block',
    background: 'linear-gradient(to bottom, #ffffff 0%, #eeeeee 100%)',
    border: '1px solid #bbbbbb',
    borderRadius: 3,
    padding: '2px 2px',
    fontSize: 11,
    fontFamily: FONT,
    color: '#333',
    cursor: 'pointer',
    lineHeight: '18px',
    whiteSpace: 'nowrap',
  },
};
