import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import {
  FiActivity,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiBell,
  FiBriefcase,
  FiCheck,
  FiCopy,
  FiCreditCard,
  FiDownload,
  FiDollarSign,
  FiLock,
  FiMoon,
  FiPlus,
  FiSettings,
  FiShield,
  FiSun,
  FiTrendingUp,
  FiUnlock,
  FiUser,
} from 'react-icons/fi';
import { currencyMeta } from '../data/mockData';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: FiActivity },
  { id: 'wallet', label: 'Wallet', icon: FiDollarSign },
  { id: 'cards', label: 'Cards', icon: FiCreditCard },
  { id: 'transfer', label: 'Transfer', icon: FiArrowUpRight },
  { id: 'profile', label: 'Profile', icon: FiUser },
  { id: 'transactions', label: 'Transactions', icon: FiBriefcase },
  { id: 'settings', label: 'Settings', icon: FiSettings },
];
const timeframeDays = { '1 day': 1, '1 week': 7, '1 month': 30, '6 months': 180, '1 year': 365 };

const formatCurrency = (currency, amount) => {
  if (amount === undefined || amount === null) return '—';
  const numeric = Number(amount || 0);
  if (currency === 'UZS') {
    return `₮ ${new Intl.NumberFormat('en-US').format(numeric)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
};

function TransactionRow({ transaction, formatCurrency, onDownload }) {
  return (
    <div className="transaction-item">
      <div className="tx-icon">{transaction.direction === 'incoming' ? <FiArrowDownLeft /> : <FiArrowUpRight />}</div>
      <div className="tx-main"><strong>{transaction.title}</strong><small>{transaction.description}</small></div>
      <div className="tx-detail"><strong className={transaction.direction === 'incoming' ? 'incoming' : 'outgoing'}>{transaction.direction === 'incoming' ? '+' : '-'}{formatCurrency(transaction.currency, transaction.amount)}</strong><small>{new Date(transaction.timestamp).toLocaleString()}</small></div>
      {onDownload && <button type="button" className="tiny-btn" onClick={onDownload}><FiDownload /> PDF</button>}
    </div>
  );
}

function CardDetail({ card, isPrimary, isVisible, onToggleVisibility, onCopy, onToggleLock, onSetPrimary, onHistory }) {
  return (
    <div className="card-detail">
      <div><span className="mini-label">Selected card</span><h4>{card.label}</h4><p>{isVisible ? card.number : `•••• •••• •••• ${card.number.slice(-4)}`} · {card.expiry}</p></div>
      <div className="card-detail-actions"><button type="button" className="tiny-btn" onClick={onToggleVisibility}>{isVisible ? 'Hide number' : 'Show number'}</button><button type="button" className="tiny-btn" onClick={onCopy}><FiCopy /> Copy</button><button type="button" className="tiny-btn" onClick={onHistory}><FiBriefcase /> History</button><button type="button" className="secondary-btn" onClick={onToggleLock}>{card.isFrozen ? <FiUnlock /> : <FiLock />}{card.isFrozen ? 'Unfreeze' : 'Freeze'}</button><button type="button" className="primary-btn" onClick={onSetPrimary}>{isPrimary ? <><FiCheck /> Primary</> : 'Make primary'}</button></div>
    </div>
  );
}

export default function UserDashboard({
  currentUser,
  theme,
  onThemeToggle,
  onLogout,
  activeView,
  setActiveView,
  onAddCard,
  onTransfer,
  onPayment,
  onProfileUpdate,
  onToggleCardLock,
  onSetPrimaryCard,
}) {
  const [transferForm, setTransferForm] = useState({
    sourceCardId: currentUser?.wallet?.cards?.[0]?.id || '',
    targetCardId: currentUser?.wallet?.cards?.[1]?.id || '',
    amount: '250000',
    currency: currentUser?.wallet?.cards?.[0]?.currency || 'UZS',
  });
  const [cardForm, setCardForm] = useState({ scheme: 'Uzcard', type: 'real', label: 'New card', currency: 'UZS' });
  const [paymentForm, setPaymentForm] = useState({ cardId: currentUser?.wallet?.cards?.[0]?.id || '', amount: '200000', title: 'Merchant payment', beneficiary: 'Marketplace' });
  const [timeframe, setTimeframe] = useState('1 month');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [visibleCardIds, setVisibleCardIds] = useState({});
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    country: currentUser?.profile?.country || '',
    city: currentUser?.profile?.city || '',
    district: currentUser?.profile?.district || '',
    street: currentUser?.profile?.street || '',
    houseNumber: currentUser?.profile?.houseNumber || '',
    birthDate: currentUser?.profile?.birthDate || '',
    passportSeries: currentUser?.profile?.passport?.series || '',
    passportNumber: currentUser?.profile?.passport?.number || '',
    issueDate: currentUser?.profile?.passport?.issueDate || '',
    expiryDate: currentUser?.profile?.passport?.expiryDate || '',
  });

  const totalBalance = useMemo(
    () => currentUser.wallet.cards.reduce((sum, card) => sum + Number(card.balance || 0), 0),
    [currentUser]
  );

  const walletByCurrency = useMemo(() => {
    return currentUser.wallet.cards.reduce((acc, card) => {
      acc[card.currency] = (acc[card.currency] || 0) + Number(card.balance || 0);
      return acc;
    }, {});
  }, [currentUser]);

  const periodTransactions = useMemo(() => {
    const days = timeframeDays[timeframe];
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return currentUser.transactions.filter((transaction) => new Date(transaction.timestamp).getTime() >= threshold);
  }, [currentUser, timeframe]);
  const incomeTotal = periodTransactions.filter((transaction) => transaction.direction === 'incoming').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const outcomeTotal = periodTransactions.filter((transaction) => transaction.direction === 'outgoing').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const selectedCard = currentUser.wallet.cards.find((card) => card.id === selectedCardId);
  const historyTransactions = selectedCardId
    ? periodTransactions.filter((transaction) => transaction.from?.includes(selectedCard?.label) || transaction.to?.includes(selectedCard?.label))
    : periodTransactions;

  const toggleCardNumber = (cardId) => setVisibleCardIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  const copyCardNumber = async (card) => {
    await navigator.clipboard?.writeText(card.number.replace(/\s/g, ''));
  };

  const handleTransferSubmit = (event) => {
    event.preventDefault();
    onTransfer({
      sourceCardId: transferForm.sourceCardId,
      targetCardId: transferForm.targetCardId,
      amount: Number(transferForm.amount),
      currency: transferForm.currency,
    });
  };

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    onPayment({
      cardId: paymentForm.cardId,
      amount: Number(paymentForm.amount),
      title: paymentForm.title,
      beneficiary: paymentForm.beneficiary,
    });
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    onProfileUpdate({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      country: profileForm.country,
      city: profileForm.city,
      district: profileForm.district,
      street: profileForm.street,
      houseNumber: profileForm.houseNumber,
      birthDate: profileForm.birthDate,
      passportSeries: profileForm.passportSeries,
      passportNumber: profileForm.passportNumber,
      issueDate: profileForm.issueDate,
      expiryDate: profileForm.expiryDate,
    });
  };

  const generateCheck = (transaction) => {
    const doc = new jsPDF();
    doc.setFillColor(20, 26, 48);
    doc.rect(0, 0, 210, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('VelyBank', 14, 24);
    doc.setFontSize(10);
    doc.text('Payment check', 14, 36);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Transaction: ${transaction.title}`, 14, 80);
    doc.text(`Amount: ${formatCurrency(transaction.currency, transaction.amount)}`, 14, 92);
    doc.text(`Direction: ${transaction.direction === 'incoming' ? 'Incoming' : 'Outgoing'}`, 14, 104);
    doc.text(`From: ${transaction.from || '—'}`, 14, 116);
    doc.text(`To: ${transaction.to || '—'}`, 14, 128);
    doc.text(`Date: ${new Date(transaction.timestamp).toLocaleString()}`, 14, 140);
    doc.text(`User: ${currentUser.firstName} ${currentUser.lastName}`, 14, 152);
    doc.save(`check-${transaction.id}.pdf`);
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>VelyBank</strong>
            <small>Mobile finance</small>
          </div>
        </div>

        <nav className="nav-list">
          {sidebarItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activeView === id ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="mini-label">Available balance</span>
          <strong>{formatCurrency('UZS', totalBalance)}</strong>
          <button type="button" className="secondary-btn" onClick={onThemeToggle}>
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      <main className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Personal dashboard</p>
            <h2>Good morning, {currentUser.firstName}</h2>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="notifications">
              <FiBell />
            </button>
            <div className="user-mini-card">
              <div className="avatar small">{currentUser.avatar}</div>
              <div>
                <strong>{currentUser.firstName}</strong>
                <small>{currentUser.role}</small>
              </div>
            </div>
            <button type="button" className="outline-btn" onClick={onLogout}>Log out</button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-icon"><FiDollarSign /></div>
            <div>
              <span>Total wallet</span>
              <strong>{formatCurrency('UZS', totalBalance)}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FiCreditCard /></div>
            <div>
              <span>Cards</span>
              <strong>{currentUser.wallet.cards.length}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FiTrendingUp /></div>
            <div>
              <span>Income · {timeframe}</span>
              <strong>{formatCurrency('UZS', incomeTotal)}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FiShield /></div>
            <div>
              <span>Outcome · {timeframe}</span>
              <strong>{formatCurrency('UZS', outcomeTotal)}</strong>
            </div>
          </div>
        </section>

        <div className="period-toolbar">
          <span>Activity period</span>
          <div className="period-switcher">
            {Object.keys(timeframeDays).map((period) => (
              <button key={period} type="button" className={timeframe === period ? 'active' : ''} onClick={() => setTimeframe(period)}>{period}</button>
            ))}
          </div>
        </div>

        <section className="main-grid">
          {activeView === 'overview' && (
            <>
              <div className="panel large-panel">
                <div className="panel-header">
                  <h3>Wallet overview</h3>
                  <span className="chip success">+12.4%</span>
                </div>

                <div className="currency-summary">
                  {Object.entries(walletByCurrency).map(([currency, amount]) => (
                    <div key={currency} className="currency-pill">
                      <span>{currency}</span>
                      <strong>{formatCurrency(currency, amount)}</strong>
                    </div>
                  ))}
                </div>

                <div className="chart-bars">
                  {[42, 68, 55, 80, 62, 95, 88].map((height, index) => (
                    <div key={index} className="bar-item" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Cards</h3>
                  <button type="button" className="tiny-btn" onClick={() => setActiveView('cards')}>Manage</button>
                </div>

                <div className="card-stack">
                  {currentUser.wallet.cards.map((card) => (
                    <button key={card.id} type="button" className={`bank-card ${card.type} ${card.isFrozen ? 'frozen' : ''}`} onClick={() => setSelectedCardId(card.id)}>
                      <div className="card-top">
                        <span>{card.scheme}</span>
                        <span>{card.id === currentUser.wallet.primaryCardId ? 'Primary' : card.type}</span>
                      </div>
                      <strong>{visibleCardIds[card.id] ? card.number : `•••• •••• •••• ${card.number.slice(-4)}`}</strong>
                      <div className="card-meta">
                        <span>{card.holder}</span>
                        <span>{card.expiry}</span>
                      </div>
                      <div className="card-balance-row">
                        <small>{card.currency}</small>
                        <strong>{formatCurrency(card.currency, card.balance)}</strong>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedCard && <CardDetail card={selectedCard} isPrimary={selectedCard.id === currentUser.wallet.primaryCardId} isVisible={Boolean(visibleCardIds[selectedCard.id])} onToggleVisibility={() => toggleCardNumber(selectedCard.id)} onCopy={() => copyCardNumber(selectedCard)} onToggleLock={() => onToggleCardLock(selectedCard.id)} onSetPrimary={() => onSetPrimaryCard(selectedCard.id)} onHistory={() => setActiveView('transactions')} />}
              </div>
            </>
          )}

          {activeView === 'wallet' && (
            <div className="panel full-width-panel wallet-panel">
              <div className="panel-header"><div><p className="eyebrow">Personal wallet</p><h3>My wallet</h3></div><span className="chip success">1 wallet / user</span></div>
              <div className="wallet-hero"><div><span className="mini-label">Available balance</span><strong>{formatCurrency('UZS', totalBalance)}</strong></div><div><span className="mini-label">Wallet ID</span><strong>WLT-{String(currentUser.id).padStart(6, '0')}</strong></div></div>
              <div className="currency-summary">{Object.entries(walletByCurrency).map(([currency, amount]) => <div key={currency} className="currency-pill"><span>{currency}</span><strong>{formatCurrency(currency, amount)}</strong></div>)}</div>
              <div className="panel-header"><h3>Recent wallet activity</h3><button type="button" className="tiny-btn" onClick={() => setActiveView('transactions')}>View history</button></div>
              <div className="transaction-list">{periodTransactions.slice(0, 5).map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} formatCurrency={formatCurrency} />)}</div>
            </div>
          )}

          {activeView === 'cards' && (
            <div className="panel full-width-panel">
              <div className="panel-header">
                <h3>Card management</h3>
                <span className="chip neutral">{currentUser.wallet.cards.length} cards</span>
              </div>

              <div className="cards-grid">
                {currentUser.wallet.cards.map((card) => (
                  <div key={card.id} className="mini-card-box">
                    <div className="mini-head">
                      <span>{card.scheme}</span>
                      <span className={card.isFrozen ? 'chip blocked' : 'chip active'}>
                        {card.isFrozen ? 'Frozen' : 'Active'}
                      </span>
                    </div>
                    <strong>{visibleCardIds[card.id] ? card.number : `•••• •••• •••• ${card.number.slice(-4)}`}</strong>
                    <p>{card.currency} · {card.type}</p>
                    <div className="mini-card-actions">
                      <button type="button" className="tiny-btn" onClick={() => toggleCardNumber(card.id)}>{visibleCardIds[card.id] ? 'Hide' : 'Show'}</button>
                      <button type="button" className="tiny-btn" onClick={() => copyCardNumber(card)}><FiCopy /> Copy</button>
                      <button type="button" className="secondary-btn" onClick={() => onToggleCardLock(card.id)}>
                        {card.isFrozen ? <FiUnlock /> : <FiLock />}
                        {card.isFrozen ? 'Unfreeze' : 'Freeze'}
                      </button>
                    </div>
                    <div className="mini-card-actions"><button type="button" className="tiny-btn" onClick={() => setSelectedCardId(card.id)}>Details</button><button type="button" className={card.id === currentUser.wallet.primaryCardId ? 'tiny-btn selected' : 'tiny-btn'} onClick={() => onSetPrimaryCard(card.id)}>{card.id === currentUser.wallet.primaryCardId ? <><FiCheck /> Primary</> : 'Make primary'}</button></div>
                  </div>
                ))}
              </div>

              <form className="inline-form" onSubmit={(event) => {
                event.preventDefault();
                onAddCard(cardForm);
              }}>
                <label>
                  <span>Scheme</span>
                  <select value={cardForm.scheme} onChange={(e) => setCardForm((prev) => ({ ...prev, scheme: e.target.value }))}>
                    <option value="Uzcard">Uzcard</option>
                    <option value="Humo">Humo</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="UnionPay">UnionPay</option>
                  </select>
                </label>

                <label>
                  <span>Type</span>
                  <select value={cardForm.type} onChange={(e) => setCardForm((prev) => ({ ...prev, type: e.target.value }))}>
                    <option value="real">Real card</option>
                    <option value="virtual">Virtual card</option>
                  </select>
                </label>

                <label>
                  <span>Currency</span>
                  <select value={cardForm.currency} onChange={(e) => setCardForm((prev) => ({ ...prev, currency: e.target.value }))}>
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                    <option value="RUB">RUB</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>

                <label>
                  <span>Label</span>
                  <input value={cardForm.label} onChange={(e) => setCardForm((prev) => ({ ...prev, label: e.target.value }))} />
                </label>

                <button type="submit" className="primary-btn add-card-btn">
                  <FiPlus /> Add card
                </button>
              </form>
            </div>
          )}

          {activeView === 'transfer' && (
            <div className="panel full-width-panel">
              <div className="panel-header">
                <h3>Transfer money</h3>
                <span className="chip neutral">Secure</span>
              </div>

              <form className="transfer-form" onSubmit={handleTransferSubmit}>
                <label>
                  <span>From card</span>
                  <select value={transferForm.sourceCardId} onChange={(e) => setTransferForm((prev) => ({ ...prev, sourceCardId: e.target.value }))}>
                    {currentUser.wallet.cards.map((card) => (
                      <option key={card.id} value={card.id}>{card.label} · {card.currency}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>To card</span>
                  <select value={transferForm.targetCardId} onChange={(e) => setTransferForm((prev) => ({ ...prev, targetCardId: e.target.value }))}>
                    {currentUser.wallet.cards.map((card) => (
                      <option key={card.id} value={card.id}>{card.label} · {card.currency}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Amount</span>
                  <input value={transferForm.amount} onChange={(e) => setTransferForm((prev) => ({ ...prev, amount: e.target.value }))} />
                </label>

                <label>
                  <span>Currency</span>
                  <select value={transferForm.currency} onChange={(e) => setTransferForm((prev) => ({ ...prev, currency: e.target.value }))}>
                    {Object.keys(currencyMeta).map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </label>

                <button type="submit" className="primary-btn">Send transfer</button>
              </form>
            </div>
          )}

          {activeView === 'profile' && (
            <div className="panel full-width-panel">
              <div className="panel-header">
                <h3>Profile details</h3>
                <span className="chip neutral">Identity</span>
              </div>

              <form className="profile-form" onSubmit={handleProfileSubmit}>
                <div className="two-grid">
                  <label>
                    <span>First name</span>
                    <input value={profileForm.firstName} onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))} />
                  </label>
                  <label>
                    <span>Last name</span>
                    <input value={profileForm.lastName} onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))} />
                  </label>
                  <label>
                    <span>Country</span>
                    <input value={profileForm.country} onChange={(e) => setProfileForm((prev) => ({ ...prev, country: e.target.value }))} />
                  </label>
                  <label>
                    <span>City</span>
                    <input value={profileForm.city} onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))} />
                  </label>
                  <label>
                    <span>District</span>
                    <input value={profileForm.district} onChange={(e) => setProfileForm((prev) => ({ ...prev, district: e.target.value }))} />
                  </label>
                  <label>
                    <span>Street</span>
                    <input value={profileForm.street} onChange={(e) => setProfileForm((prev) => ({ ...prev, street: e.target.value }))} />
                  </label>
                  <label>
                    <span>House number</span>
                    <input value={profileForm.houseNumber} onChange={(e) => setProfileForm((prev) => ({ ...prev, houseNumber: e.target.value }))} />
                  </label>
                  <label>
                    <span>Date of birth</span>
                    <input type="date" value={profileForm.birthDate} onChange={(e) => setProfileForm((prev) => ({ ...prev, birthDate: e.target.value }))} />
                  </label>
                  <label>
                    <span>Passport series</span>
                    <input value={profileForm.passportSeries} onChange={(e) => setProfileForm((prev) => ({ ...prev, passportSeries: e.target.value }))} />
                  </label>
                  <label>
                    <span>Passport number</span>
                    <input value={profileForm.passportNumber} onChange={(e) => setProfileForm((prev) => ({ ...prev, passportNumber: e.target.value }))} />
                  </label>
                  <label>
                    <span>Issue date</span>
                    <input type="date" value={profileForm.issueDate} onChange={(e) => setProfileForm((prev) => ({ ...prev, issueDate: e.target.value }))} />
                  </label>
                  <label>
                    <span>Expiry date</span>
                    <input type="date" value={profileForm.expiryDate} onChange={(e) => setProfileForm((prev) => ({ ...prev, expiryDate: e.target.value }))} />
                  </label>
                </div>
                <button type="submit" className="primary-btn">Save profile</button>
              </form>
            </div>
          )}

          {activeView === 'transactions' && (
            <div className="panel full-width-panel">
              <div className="panel-header">
                <h3>Transaction history</h3>
                <span className="chip neutral">All cards</span>
              </div>

              {selectedCard && <p className="history-filter">Showing history for {selectedCard.label}</p>}
              <div className="transaction-list">{historyTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} formatCurrency={formatCurrency} onDownload={() => generateCheck(transaction)} />)}</div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="panel full-width-panel">
              <div className="panel-header">
                <h3>Account settings</h3>
                <span className="chip neutral">Preferences</span>
              </div>

              <div className="settings-grid">
                <div className="switch-block">
                  <div>
                    <strong>Biometric login</strong>
                    <small>Face / fingerprint login</small>
                  </div>
                  <button type="button" className="switch on">ON</button>
                </div>
                <div className="switch-block">
                  <div>
                    <strong>Two-step verification</strong>
                    <small>Extra login protection</small>
                  </div>
                  <button type="button" className="switch on">ON</button>
                </div>
                <div className="switch-block">
                  <div>
                    <strong>Card lock alerts</strong>
                    <small>Notify on card movement</small>
                  </div>
                  <button type="button" className="switch on">ON</button>
                </div>
              </div>

              <form className="payment-form" onSubmit={handlePaymentSubmit}>
                <label>
                  <span>Payment card</span>
                  <select value={paymentForm.cardId} onChange={(e) => setPaymentForm((prev) => ({ ...prev, cardId: e.target.value }))}>
                    {currentUser.wallet.cards.map((card) => (
                      <option key={card.id} value={card.id}>{card.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Title</span>
                  <input value={paymentForm.title} onChange={(e) => setPaymentForm((prev) => ({ ...prev, title: e.target.value }))} />
                </label>

                <label>
                  <span>Recipient</span>
                  <input value={paymentForm.beneficiary} onChange={(e) => setPaymentForm((prev) => ({ ...prev, beneficiary: e.target.value }))} />
                </label>

                <label>
                  <span>Amount</span>
                  <input value={paymentForm.amount} onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))} />
                </label>

                <button type="submit" className="primary-btn">Pay now</button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
