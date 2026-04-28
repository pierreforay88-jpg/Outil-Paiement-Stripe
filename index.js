import { useState, useEffect } from 'react';
import Head from 'next/head';

const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'pierreforay2026';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('generate');

  // Partners state
  const [partners, setPartners] = useState([]);
  const [newPartner, setNewPartner] = useState({ name: '', apiKey: '', accountId: '' });
  const [partnerError, setPartnerError] = useState('');
  const [partnerSuccess, setPartnerSuccess] = useState('');

  // Payment generation state
  const [selectedPartner, setSelectedPartner] = useState('');
  const [amount, setAmount] = useState('');
  const [commission, setCommission] = useState(25);
  const [description, setDescription] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('pf_auth');
    if (auth === 'true') setAuthenticated(true);
    const saved = localStorage.getItem('pf_partners');
    if (saved) setPartners(JSON.parse(saved));
  }, []);

  function login() {
    if (password === APP_PASSWORD) {
      sessionStorage.setItem('pf_auth', 'true');
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Mot de passe incorrect.');
    }
  }

  function logout() {
    sessionStorage.removeItem('pf_auth');
    setAuthenticated(false);
    setPassword('');
  }

  function savePartners(list) {
    setPartners(list);
    localStorage.setItem('pf_partners', JSON.stringify(list));
  }

  function addPartner() {
    if (!newPartner.name || !newPartner.apiKey || !newPartner.accountId) {
      setPartnerError('Tous les champs sont obligatoires.');
      return;
    }
    if (!newPartner.apiKey.startsWith('sk_')) {
      setPartnerError('La clé API doit commencer par sk_live_ ou sk_test_');
      return;
    }
    if (!newPartner.accountId.startsWith('acct_')) {
      setPartnerError("L'ID du compte connecté doit commencer par acct_");
      return;
    }
    const updated = [...partners, { ...newPartner, id: Date.now().toString() }];
    savePartners(updated);
    setNewPartner({ name: '', apiKey: '', accountId: '' });
    setPartnerError('');
    setPartnerSuccess(`Partenaire "${newPartner.name}" ajouté avec succès.`);
    setTimeout(() => setPartnerSuccess(''), 3000);
  }

  function deletePartner(id) {
    if (!confirm('Supprimer ce partenaire ?')) return;
    savePartners(partners.filter(p => p.id !== id));
  }

  const amountNum = parseFloat(amount) || 0;
  const commissionAmt = amountNum > 0 ? Math.floor(amountNum * commission / 100 / 10) * 10 : 0;
  const partnerAmt = amountNum > 0 ? amountNum - commissionAmt : 0;

  async function generateLink() {
    if (!selectedPartner) { setGenError('Sélectionne un partenaire.'); return; }
    if (!amountNum || amountNum < 1) { setGenError('Entre un montant valide.'); return; }
    setGenerating(true);
    setGenError('');
    setGeneratedLink('');
    try {
      const partner = partners.find(p => p.id === selectedPartner);
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: partner.apiKey,
          accountId: partner.accountId,
          amount: Math.round(amountNum * 100),
          commissionAmount: commissionAmt * 100,
          description: description || `Prestation — commission Business Development ${commission}%`,
          partnerName: partner.name,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur Stripe');
      setGeneratedLink(data.url);
    } catch (e) {
      setGenError(e.message);
    }
    setGenerating(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function maskKey(key) {
    if (!key) return '';
    return key.slice(0, 8) + '••••••••••••••••' + key.slice(-4);
  }

  if (!authenticated) {
    return (
      <>
        <Head><title>BD Tool — Pierre Foray</title></Head>
        <div className="login-wrap">
          <div className="login-card">
            <div className="login-logo">PF</div>
            <h1>BD Commission Tool</h1>
            <p className="login-sub">Pierre Foray · Business Développeur Indépendant</p>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              className="login-input"
            />
            {loginError && <p className="error-msg">{loginError}</p>}
            <button onClick={login} className="login-btn">Accéder →</button>
          </div>
        </div>
        <style jsx>{`
          .login-wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0a0a0f;
            background-image: radial-gradient(ellipse at 30% 20%, rgba(58,123,213,0.12) 0%, transparent 60%),
                              radial-gradient(ellipse at 70% 80%, rgba(58,123,213,0.08) 0%, transparent 60%);
          }
          .login-card {
            background: #12121a;
            border: 1px solid rgba(58,123,213,0.3);
            border-radius: 16px;
            padding: 3rem 2.5rem;
            width: 360px;
            text-align: center;
          }
          .login-logo {
            width: 56px; height: 56px;
            background: #3A7BD5;
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-family: 'DM Mono', monospace;
            font-size: 18px; font-weight: 700; color: #fff;
            margin: 0 auto 1.5rem;
          }
          h1 { font-family: 'Syne', sans-serif; font-size: 1.6rem; color: #fff; margin: 0 0 0.5rem; }
          .login-sub { color: #6b7a99; font-size: 0.85rem; margin: 0 0 2rem; }
          .login-input {
            width: 100%; box-sizing: border-box;
            background: #1c1c28; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px; padding: 0.85rem 1rem;
            color: #fff; font-size: 1rem; margin-bottom: 0.75rem;
            outline: none; transition: border-color 0.2s;
          }
          .login-input:focus { border-color: #3A7BD5; }
          .error-msg { color: #ff6b6b; font-size: 0.85rem; margin: 0 0 0.75rem; }
          .login-btn {
            width: 100%; padding: 0.85rem;
            background: #3A7BD5; border: none; border-radius: 10px;
            color: #fff; font-size: 1rem; font-weight: 600;
            cursor: pointer; transition: background 0.2s;
          }
          .login-btn:hover { background: #2e65b8; }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>BD Tool — Pierre Foray</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">PF</div>
            <div>
              <div className="logo-name">Pierre Foray</div>
              <div className="logo-role">Business Développeur</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>
              <span className="nav-icon">⚡</span> Générer un lien
            </button>
            <button className={`nav-item ${activeTab === 'partners' ? 'active' : ''}`} onClick={() => setActiveTab('partners')}>
              <span className="nav-icon">🏢</span> Partenaires
              {partners.length > 0 && <span className="badge">{partners.length}</span>}
            </button>
          </nav>
          <button onClick={logout} className="logout-btn">Déconnexion</button>
        </aside>

        {/* Main */}
        <main className="main">
          {activeTab === 'generate' && (
            <div className="tab-content">
              <div className="page-header">
                <h2>Générer un lien de paiement</h2>
                <p>Le split commission / partenaire est automatique via Stripe Connect</p>
              </div>

              {partners.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏢</div>
                  <p>Aucun partenaire configuré.</p>
                  <button onClick={() => setActiveTab('partners')} className="btn-primary">Ajouter un partenaire →</button>
                </div>
              ) : (
                <div className="gen-grid">
                  {/* Left: form */}
                  <div className="gen-form card">
                    <div className="field">
                      <label>Partenaire</label>
                      <select value={selectedPartner} onChange={e => setSelectedPartner(e.target.value)}>
                        <option value="">Sélectionner un partenaire…</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Montant de la vente (€ HT)</label>
                      <input type="number" min="1" placeholder="ex. 1500" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Taux de commission</label>
                      <div className="rate-btns">
                        {[20, 25, 30].map(r => (
                          <button key={r} className={`rate-btn ${commission === r ? 'active' : ''}`} onClick={() => setCommission(r)}>
                            {r} %
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="field">
                      <label>Description (optionnel)</label>
                      <input type="text" placeholder="ex. Prestation SEO — Mai 2026" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    {genError && <p className="error-msg">{genError}</p>}
                    <button onClick={generateLink} disabled={generating} className="btn-primary full">
                      {generating ? 'Génération en cours…' : 'Générer le lien Stripe →'}
                    </button>
                  </div>

                  {/* Right: summary + result */}
                  <div className="gen-right">
                    <div className="summary card">
                      <div className="summary-title">Répartition automatique</div>
                      <div className="summary-row">
                        <span>Montant total</span>
                        <strong>{amountNum > 0 ? amountNum.toLocaleString('fr-FR') + ' €' : '—'}</strong>
                      </div>
                      <div className="summary-divider" />
                      <div className="summary-row commission">
                        <span>Ta commission ({commission} %)</span>
                        <strong className="green">{amountNum > 0 ? commissionAmt.toLocaleString('fr-FR') + ' €' : '—'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Partenaire reçoit</span>
                        <strong>{amountNum > 0 ? partnerAmt.toLocaleString('fr-FR') + ' €' : '—'}</strong>
                      </div>
                      {amountNum > 0 && (
                        <div className="summary-note">
                          Arrondi à la dizaine inférieure · Frais Stripe (~{(amountNum * 0.015 + 0.25).toFixed(2)} €) à la charge du partenaire
                        </div>
                      )}
                    </div>

                    {generatedLink && (
                      <div className="link-result card">
                        <div className="link-label">✅ Lien de paiement prêt</div>
                        <div className="link-url">{generatedLink}</div>
                        <button onClick={copyLink} className="btn-primary full">
                          {copied ? '✓ Copié !' : 'Copier le lien'}
                        </button>
                        <p className="link-hint">Envoie ce lien au client par WhatsApp, mail ou SMS. Le split est automatique à la réception du paiement.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="tab-content">
              <div className="page-header">
                <h2>Gestion des partenaires</h2>
                <p>Les clés API sont stockées localement sur ton appareil, jamais sur un serveur.</p>
              </div>

              {/* Add partner form */}
              <div className="card add-partner">
                <h3>Ajouter un partenaire</h3>
                <div className="fields-row">
                  <div className="field">
                    <label>Nom de l'entreprise</label>
                    <input type="text" placeholder="ex. Agence Dupont" value={newPartner.name} onChange={e => setNewPartner({ ...newPartner, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Clé API Stripe (sk_live_… ou sk_test_…)</label>
                    <input type="password" placeholder="sk_live_xxxxxxxxxxxx" value={newPartner.apiKey} onChange={e => setNewPartner({ ...newPartner, apiKey: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>ID compte connecté (acct_…)</label>
                    <input type="text" placeholder="acct_xxxxxxxxxxxx" value={newPartner.accountId} onChange={e => setNewPartner({ ...newPartner, accountId: e.target.value })} />
                  </div>
                </div>
                {partnerError && <p className="error-msg">{partnerError}</p>}
                {partnerSuccess && <p className="success-msg">{partnerSuccess}</p>}
                <button onClick={addPartner} className="btn-primary">Ajouter le partenaire →</button>
              </div>

              {/* Partners list */}
              {partners.length > 0 && (
                <div className="partners-list">
                  {partners.map(p => (
                    <div key={p.id} className="partner-card card">
                      <div className="partner-avatar">{p.name.slice(0, 2).toUpperCase()}</div>
                      <div className="partner-info">
                        <div className="partner-name">{p.name}</div>
                        <div className="partner-key">{maskKey(p.apiKey)}</div>
                        <div className="partner-account">ID: {p.accountId}</div>
                      </div>
                      <div className="partner-actions">
                        <button onClick={() => { setSelectedPartner(p.id); setActiveTab('generate'); }} className="btn-sm">Utiliser</button>
                        <button onClick={() => deletePartner(p.id)} className="btn-sm danger">Supprimer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {partners.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🔑</div>
                  <p>Aucun partenaire configuré. Ajoute ton premier partenaire ci-dessus.</p>
                </div>
              )}

              <div className="security-note card">
                <div className="security-icon">🔒</div>
                <div>
                  <strong>Sécurité des données</strong>
                  <p>Les clés API sont stockées uniquement dans le localStorage de ton navigateur. Elles ne transitent jamais en clair sur un serveur — elles sont envoyées directement à l'API Stripe au moment de la génération du lien.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; color: #e2e8f0; font-family: 'Inter', sans-serif; }
        input, select, textarea { font-family: 'Inter', sans-serif; }
      `}</style>
      <style jsx>{`
        .app { display: flex; min-height: 100vh; }

        /* SIDEBAR */
        .sidebar {
          width: 260px; min-height: 100vh;
          background: #0f0f18;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          padding: 1.5rem 1rem;
          position: fixed; top: 0; left: 0; bottom: 0;
        }
        .sidebar-logo {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.5rem; margin-bottom: 2rem;
        }
        .logo-mark {
          width: 40px; height: 40px; background: #3A7BD5;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: 'DM Mono', monospace; font-weight: 700; font-size: 14px; color: #fff;
          flex-shrink: 0;
        }
        .logo-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem; color: #fff; }
        .logo-role { font-size: 0.72rem; color: #4a5568; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
        .nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 1rem; border-radius: 10px;
          background: none; border: none; color: #6b7a99;
          font-size: 0.9rem; cursor: pointer; text-align: left;
          transition: all 0.15s; position: relative;
        }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
        .nav-item.active { background: rgba(58,123,213,0.15); color: #3A7BD5; font-weight: 600; }
        .nav-icon { font-size: 1rem; }
        .badge {
          margin-left: auto; background: #3A7BD5; color: #fff;
          font-size: 0.7rem; font-weight: 700; padding: 2px 7px;
          border-radius: 20px;
        }
        .logout-btn {
          background: none; border: 1px solid rgba(255,255,255,0.08);
          color: #4a5568; padding: 0.6rem 1rem; border-radius: 8px;
          cursor: pointer; font-size: 0.85rem; transition: all 0.15s;
        }
        .logout-btn:hover { border-color: rgba(255,80,80,0.4); color: #ff6b6b; }

        /* MAIN */
        .main { margin-left: 260px; flex: 1; padding: 2.5rem; max-width: calc(100vw - 260px); }
        .tab-content { max-width: 900px; }
        .page-header { margin-bottom: 2rem; }
        .page-header h2 { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem; }
        .page-header p { color: #4a5568; font-size: 0.9rem; }

        /* CARD */
        .card {
          background: #12121a; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 1.5rem;
        }

        /* GENERATE */
        .gen-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .field { margin-bottom: 1.25rem; }
        .field label { display: block; font-size: 0.8rem; font-weight: 600; color: #4a5568; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
        .field input, .field select {
          width: 100%; background: #0a0a0f; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 0.75rem 1rem; color: #e2e8f0;
          font-size: 0.95rem; outline: none; transition: border-color 0.2s;
        }
        .field input:focus, .field select:focus { border-color: #3A7BD5; }
        .field select option { background: #12121a; }
        .rate-btns { display: flex; gap: 0.5rem; }
        .rate-btn {
          flex: 1; padding: 0.65rem; background: #0a0a0f;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          color: #6b7a99; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .rate-btn:hover { border-color: #3A7BD5; color: #3A7BD5; }
        .rate-btn.active { background: rgba(58,123,213,0.15); border-color: #3A7BD5; color: #3A7BD5; }
        .btn-primary {
          background: #3A7BD5; border: none; border-radius: 9px;
          color: #fff; padding: 0.8rem 1.5rem; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; transition: background 0.2s;
        }
        .btn-primary:hover { background: #2e65b8; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary.full { width: 100%; }
        .error-msg { color: #ff6b6b; font-size: 0.85rem; margin-bottom: 1rem; }
        .success-msg { color: #48bb78; font-size: 0.85rem; margin-bottom: 1rem; }

        /* SUMMARY */
        .summary-title { font-size: 0.75rem; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 1.25rem; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; font-size: 0.9rem; }
        .summary-row span { color: #6b7a99; }
        .summary-row strong { color: #e2e8f0; }
        .summary-row.commission strong.green { color: #48bb78; font-size: 1.1rem; }
        .summary-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0.5rem 0; }
        .summary-note { margin-top: 1rem; font-size: 0.75rem; color: #4a5568; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem; }

        /* LINK RESULT */
        .link-result { margin-top: 1rem; }
        .link-label { font-size: 0.85rem; font-weight: 600; color: #48bb78; margin-bottom: 0.75rem; }
        .link-url {
          font-family: 'DM Mono', monospace; font-size: 0.75rem;
          color: #3A7BD5; background: #0a0a0f; border: 1px solid rgba(58,123,213,0.3);
          border-radius: 8px; padding: 0.75rem; word-break: break-all;
          margin-bottom: 0.75rem;
        }
        .link-hint { font-size: 0.78rem; color: #4a5568; margin-top: 0.75rem; line-height: 1.5; }

        /* EMPTY STATE */
        .empty-state { text-align: center; padding: 4rem 2rem; color: #4a5568; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .empty-state p { margin-bottom: 1.5rem; }

        /* PARTNERS */
        .add-partner h3 { font-family: 'Syne', sans-serif; font-weight: 700; color: #fff; margin-bottom: 1.25rem; }
        .fields-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        .partners-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
        .partner-card { display: flex; align-items: center; gap: 1rem; }
        .partner-avatar {
          width: 44px; height: 44px; background: rgba(58,123,213,0.2);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: 'DM Mono', monospace; font-weight: 700; font-size: 14px; color: #3A7BD5;
          flex-shrink: 0;
        }
        .partner-info { flex: 1; }
        .partner-name { font-weight: 600; color: #e2e8f0; margin-bottom: 0.2rem; }
        .partner-key { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #4a5568; }
        .partner-account { font-size: 0.75rem; color: #4a5568; }
        .partner-actions { display: flex; gap: 0.5rem; }
        .btn-sm {
          padding: 0.4rem 0.9rem; border-radius: 7px; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; border: 1px solid rgba(58,123,213,0.4); background: rgba(58,123,213,0.1); color: #3A7BD5;
          transition: all 0.15s;
        }
        .btn-sm:hover { background: rgba(58,123,213,0.2); }
        .btn-sm.danger { border-color: rgba(255,80,80,0.3); background: rgba(255,80,80,0.08); color: #ff6b6b; }
        .btn-sm.danger:hover { background: rgba(255,80,80,0.15); }
        .security-note {
          display: flex; align-items: flex-start; gap: 1rem;
          margin-top: 1.5rem; border-color: rgba(72,187,120,0.2);
        }
        .security-icon { font-size: 1.5rem; }
        .security-note strong { display: block; color: #48bb78; margin-bottom: 0.35rem; }
        .security-note p { font-size: 0.83rem; color: #4a5568; line-height: 1.6; }
      `}</style>
    </>
  );
}
