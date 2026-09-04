import React, { useState } from 'react';
import './App.css';
import { defaultUsers } from './data/mockData';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { apiRequest, buildVerificationCode } from './services/api';

function App() {
  const [theme, setTheme] = useState('dark');
  const [users, setUsers] = useState(defaultUsers);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [message, setMessage] = useState('Demo fintech platform tayyor.');
  const [activeView, setActiveView] = useState('overview');

  const syncUserState = (updatedUser) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setCurrentUser(updatedUser);
  };

  const handleLogin = async (event, loginForm) => {
    event.preventDefault();
    const user = users.find(
      (item) => item.username === loginForm.username && item.password === loginForm.password
    );

    if (!user) {
      setMessage('Login yoki parol xato.');
      return;
    }

    setCurrentUser(user);
    setMessage(`${user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'} kabineti ochildi.`);
    await apiRequest('post', '/auth/login', { username: loginForm.username, password: loginForm.password });
  };

  const handleSendCode = async (contact) => {
    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      setMessage('Email yoki telefon raqami kiriting.');
      return null;
    }

    const code = buildVerificationCode();
    setMessage(`Tasdiqlash kodi yuborildi: ${code} (demo rejimida)`);
    await apiRequest('post', '/auth/send-code', { contact: trimmedContact, code });
    return code;
  };

  const handleRegister = async ({ contact, username, password, confirmPassword }) => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirm) {
      setMessage("Barcha maydonlar to'ldirilishi zarur.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setMessage('Parollar mos kelmadi.');
      return;
    }

    if (users.some((item) => item.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      setMessage('Bu login allaqachon band.');
      return;
    }

    const newUser = {
      id: Date.now(),
      role: 'user',
      username: trimmedUsername,
      password: trimmedPassword,
      email: contact.includes('@') ? contact : '',
      phone: contact.includes('@') ? '' : contact,
      firstName: 'Yangi',
      lastName: 'Foydalanuvchi',
      avatar: 'NF',
      isBlocked: false,
      profile: {
        country: 'Uzbekistan',
        city: 'Tashkent',
        district: 'Chilonzor',
        street: "Yangi ko'cha",
        houseNumber: '1',
        birthDate: '2000-01-01',
        passport: {
          jshshr: '00000000000000',
          series: 'AA',
          number: '0000000',
          issueDate: '2024-01-01',
          expiryDate: '2034-01-01',
        },
      },
      wallet: { cards: [], totalBalance: 0 },
      transactions: [],
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    setCurrentUser(newUser);
    setAuthMode('login');
    setMessage("Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.");
    await apiRequest('post', '/auth/register', { contact, username: trimmedUsername, password: trimmedPassword });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMessage('Siz tizimdan chiqdingiz.');
  };

  const handleAddCard = (cardForm) => {
    if (!currentUser) return;

    const newCard = {
      id: `card-${Date.now()}`,
      label: cardForm.label || `${cardForm.scheme} card`,
      scheme: cardForm.scheme,
      type: cardForm.type,
      status: 'active',
      number: `XXXX ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      holder: `${currentUser.firstName} ${currentUser.lastName}`.toUpperCase(),
      cvv: '***',
      expiry: '12/31',
      currency: cardForm.currency,
      balance: 0,
      isFrozen: false,
    };

    const updatedUser = {
      ...currentUser,
      wallet: {
        ...currentUser.wallet,
        cards: [...currentUser.wallet.cards, newCard],
      },
    };

    syncUserState(updatedUser);
    setMessage(`${newCard.label} kartasi muvaffaqiyatli qo'shildi.`);
  };

  const handleTransfer = ({ sourceCardId, targetCardId, amount, currency }) => {
    if (!currentUser) return;
    if (!sourceCardId || !targetCardId) {
      setMessage('Iltimos, karta tanlang.');
      return;
    }

    const sourceCard = currentUser.wallet.cards.find((card) => card.id === sourceCardId);
    const targetCard = currentUser.wallet.cards.find((card) => card.id === targetCardId);

    if (!sourceCard || !targetCard) {
      setMessage('Karta topilmadi.');
      return;
    }

    if (sourceCard.isFrozen || targetCard.isFrozen) {
      setMessage("Bitta karta muzlatilgan bo'lib, transfer davom ettirilmaydi.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setMessage("To'g'ri summa kiriting.");
      return;
    }

    if (sourceCard.balance < parsedAmount) {
      setMessage("Kartada yetarli mablag' mavjud emas.");
      return;
    }

    const updatedCards = currentUser.wallet.cards.map((card) => {
      if (card.id === sourceCardId) {
        return { ...card, balance: Number(card.balance) - parsedAmount };
      }
      if (card.id === targetCardId) {
        return { ...card, balance: Number(card.balance) + parsedAmount };
      }
      return card;
    });

    const transaction = {
      id: `trx-${Date.now()}`,
      title: 'Internal transfer',
      amount: parsedAmount,
      currency,
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
      status: 'success',
      description: 'Money transferred between cards',
      from: sourceCard.label,
      to: targetCard.label,
    };

    const updatedUser = {
      ...currentUser,
      wallet: { ...currentUser.wallet, cards: updatedCards },
      transactions: [transaction, ...currentUser.transactions],
    };

    syncUserState(updatedUser);
    setMessage('Transfer muvaffaqiyatli bajarildi.');
  };

  const handlePayment = ({ cardId, amount, title, beneficiary }) => {
    if (!currentUser) return;

    const card = currentUser.wallet.cards.find((item) => item.id === cardId);
    if (!card) {
      setMessage('Karta topilmadi.');
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setMessage("To'g'ri summa kiriting.");
      return;
    }

    if (card.balance < parsedAmount) {
      setMessage("Mablag' yetarli emas.");
      return;
    }

    const updatedCards = currentUser.wallet.cards.map((item) =>
      item.id === cardId ? { ...item, balance: Number(item.balance) - parsedAmount } : item
    );

    const transaction = {
      id: `pay-${Date.now()}`,
      title: title || 'Merchant payment',
      amount: parsedAmount,
      currency: card.currency,
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
      status: 'success',
      description: 'Payment processing',
      from: card.label,
      to: beneficiary || 'Merchant',
    };

    const updatedUser = {
      ...currentUser,
      wallet: { ...currentUser.wallet, cards: updatedCards },
      transactions: [transaction, ...currentUser.transactions],
    };

    syncUserState(updatedUser);
    setMessage("To'lov muvaffaqiyatli bajarildi.");
  };

  const handleProfileUpdate = (profileData) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      profile: {
        ...currentUser.profile,
        country: profileData.country,
        city: profileData.city,
        district: profileData.district,
        street: profileData.street,
        houseNumber: profileData.houseNumber,
        birthDate: profileData.birthDate,
        passport: {
          ...currentUser.profile.passport,
          series: profileData.passportSeries,
          number: profileData.passportNumber,
          issueDate: profileData.issueDate,
          expiryDate: profileData.expiryDate,
        },
      },
    };

    syncUserState(updatedUser);
    setMessage('Profil ma\'lumotlari saqlandi.');
  };

  const handleToggleCardLock = (cardId) => {
    if (!currentUser) return;

    const updatedCards = currentUser.wallet.cards.map((card) =>
      card.id === cardId ? { ...card, isFrozen: !card.isFrozen } : card
    );

    const updatedUser = {
      ...currentUser,
      wallet: { ...currentUser.wallet, cards: updatedCards },
    };

    syncUserState(updatedUser);
    setMessage('Karta holati yangilandi.');
  };

  const handleToggleUserStatus = (userId) => {
    const updatedUsers = users.map((user) => {
      if (user.id !== userId || user.role !== 'user') return user;
      const newBlockedState = !user.isBlocked;
      return {
        ...user,
        isBlocked: newBlockedState,
        wallet: {
          ...user.wallet,
          cards: user.wallet.cards.map((card) => ({ ...card, isFrozen: newBlockedState })),
        },
      };
    });

    setUsers(updatedUsers);
    if (currentUser && currentUser.id === userId) {
      const targetedUser = updatedUsers.find((user) => user.id === userId);
      setCurrentUser(targetedUser);
    }
    setMessage('Foydalanuvchi statusi yangilandi.');
  };

  const handleAdminToggleCardLock = (userId, cardId) => {
    const updatedUsers = users.map((user) => {
      if (user.id !== userId) return user;
      return {
        ...user,
        wallet: {
          ...user.wallet,
          cards: user.wallet.cards.map((card) =>
            card.id === cardId ? { ...card, isFrozen: !card.isFrozen } : card
          ),
        },
      };
    });

    setUsers(updatedUsers);
  };

  const handleThemeToggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  if (!currentUser) {
    return (
      <div className={`app-shell ${theme}`}>
        <AuthPage
          authMode={authMode}
          onToggleMode={setAuthMode}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onSendCode={handleSendCode}
          message={message}
        />
      </div>
    );
  }

  return (
    <div className={`app-shell ${theme}`}>
      {currentUser.role === 'admin' ? (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          onLogout={handleLogout}
          onToggleUserStatus={handleToggleUserStatus}
          onToggleCardLock={handleAdminToggleCardLock}
        />
      ) : (
        <UserDashboard
          currentUser={currentUser}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onLogout={handleLogout}
          activeView={activeView}
          setActiveView={setActiveView}
          onAddCard={handleAddCard}
          onTransfer={handleTransfer}
          onPayment={handlePayment}
          onProfileUpdate={handleProfileUpdate}
          onToggleCardLock={handleToggleCardLock}
        />
      )}
    </div>
  );
}

export default App;