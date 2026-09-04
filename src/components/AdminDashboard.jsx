import React from 'react';
import { FiActivity, FiArrowDownLeft, FiArrowUpRight, FiBell, FiCreditCard, FiLock, FiShield, FiUnlock, FiUsers } from 'react-icons/fi';

const formatCurrency = (currency, amount) => {
  const numeric = Number(amount || 0);
  if (currency === 'UZS') return `₮ ${new Intl.NumberFormat('en-US').format(numeric)}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
};

export default function AdminDashboard({ currentUser, users, onLogout, onToggleUserStatus, onToggleCardLock }) {
  const totalSystemBalance = users
    .filter((user) => user.role === 'user')
    .reduce((sum, user) => sum + user.wallet.cards.reduce((acc, card) => acc + Number(card.balance || 0), 0), 0);

  return (
    <div className="dashboard-shell admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>Admin panel</strong>
            <small>Operations</small>
          </div>
        </div>

        <nav className="nav-list">
          <button type="button" className="nav-item active">
            <FiActivity />
            <span>Overview</span>
          </button>
          <button type="button" className="nav-item">
            <FiUsers />
            <span>Users</span>
          </button>
          <button type="button" className="nav-item">
            <FiCreditCard />
            <span>Cards</span>
          </button>
          <button type="button" className="nav-item">
            <FiShield />
            <span>Security</span>
          </button>
        </nav>

        <div className="sidebar-card">
          <span className="mini-label">System balance</span>
          <strong>{formatCurrency('UZS', totalSystemBalance)}</strong>
          <button type="button" className="outline-btn" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      <main className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h2>Operations center</h2>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button"><FiBell /></button>
            <div className="user-mini-card">
              <div className="avatar small">{currentUser.avatar}</div>
              <div>
                <strong>{currentUser.firstName}</strong>
                <small>Admin</small>
              </div>
            </div>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-icon"><FiUsers /></div>
            <div>
              <span>Users</span>
              <strong>{users.filter((user) => user.role === 'user').length}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FiCreditCard /></div>
            <div>
              <span>Cards</span>
              <strong>{users.reduce((count, user) => count + (user.wallet?.cards?.length || 0), 0)}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FiShield /></div>
            <div>
              <span>Security score</span>
              <strong>97%</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FiActivity /></div>
            <div>
              <span>Transactions</span>
              <strong>{users.reduce((count, user) => count + (user.transactions?.length || 0), 0)}</strong>
            </div>
          </div>
        </section>

        <section className="admin-grid">
          <div className="panel full-width-panel">
            <div className="panel-header">
              <h3>User list</h3>
              <span className="chip neutral">All members</span>
            </div>

            <div className="user-table">
              {users.filter((user) => user.role === 'user').map((user) => (
                <div key={user.id} className="admin-user-row">
                  <div className="admin-user-meta">
                    <div className="avatar">{user.avatar}</div>
                    <div>
                      <strong>{user.firstName} {user.lastName}</strong>
                      <small>{user.email || user.phone}</small>
                    </div>
                  </div>

                  <div className="admin-user-details">
                    <span>{user.isBlocked ? 'Blocked' : 'Active'}</span>
                    <strong>{user.wallet.cards.length} cards</strong>
                  </div>

                  <div className="admin-user-details">
                    <span>Balance</span>
                    <strong>{formatCurrency('UZS', user.wallet.cards.reduce((sum, card) => sum + Number(card.balance || 0), 0))}</strong>
                  </div>

                  <button type="button" className="secondary-btn" onClick={() => onToggleUserStatus(user.id)}>
                    {user.isBlocked ? <FiUnlock /> : <FiLock />}
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel full-width-panel">
            <div className="panel-header">
              <h3>Card control</h3>
              <span className="chip neutral">All cards</span>
            </div>

            <div className="admin-card-scroll">
              {users
                .filter((user) => user.role === 'user')
                .flatMap((user) => user.wallet.cards.map((card) => ({ user, card })))
                .map(({ user, card }) => (
                  <div key={card.id} className="admin-card-item">
                    <div>
                      <strong>{card.label}</strong>
                      <small>{user.firstName} {user.lastName}</small>
                    </div>
                    <div className="admin-card-info">
                      <span>{card.scheme}</span>
                      <span>{card.currency}</span>
                    </div>
                    <div className="admin-card-actions">
                      <button type="button" className="tiny-btn" onClick={() => onToggleCardLock(user.id, card.id)}>
                        {card.isFrozen ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="panel full-width-panel">
            <div className="panel-header">
              <h3>Latest activity</h3>
              <span className="chip neutral">Live</span>
            </div>

            <div className="transaction-list">
              {users
                .filter((user) => user.role === 'user')
                .flatMap((user) => user.transactions.map((tx) => ({ user, tx })))
                .slice(0, 6)
                .map(({ user, tx }) => (
                  <div key={tx.id} className="transaction-item">
                    <div className="tx-icon">
                      {tx.direction === 'incoming' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                    </div>
                    <div className="tx-main">
                      <strong>{tx.title}</strong>
                      <small>{user.firstName} {user.lastName}</small>
                    </div>
                    <div className="tx-detail">
                      <strong className={tx.direction === 'incoming' ? 'incoming' : 'outgoing'}>
                        {tx.direction === 'incoming' ? '+' : '-'}
                        {formatCurrency(tx.currency, tx.amount)}
                      </strong>
                      <small>{new Date(tx.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
