import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, UserRole, PriceTiers, Address } from '../types';
import { MOCK_CUSTOMERS } from '../data/mockData';

interface AuthContextType {
  currentUser: Customer | null;
  activeRole: UserRole;
  priceLayer: keyof PriceTiers;
  roleTitle: string;
  isDealer?: boolean;
  isAuthModalOpen: boolean;
  welcomeMessage: string | null;
  openAuthModal: (redirectPath?: string) => void;
  closeAuthModal: () => void;
  clearWelcomeMessage: () => void;
  loginWithOtp: (phone: string, fullName?: string, companyName?: string) => { isNewUser: boolean };
  loginAs: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addClubPoints: (pts: number) => void;
  updateProfile: (data: Partial<Customer>) => void;
  activateDealerRole: () => void;
  // Address CRUD
  addAddress: (address: Omit<Address, 'id'>) => Address;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getUserAddresses: () => Address[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'hyper_sanat_auth_state_v2';
const USERS_STORAGE_KEY = 'hyper_sanat_registered_users_v2';

const INITIAL_DEFAULT_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    title: 'انبار مرکزی کارخانه کاشی ستاره میبد',
    recipientName: 'مهندس محمدرضا زارع',
    recipientPhone: '09131512345',
    province: 'یزد',
    city: 'میبد',
    fullAddress: 'شهرک صنعتی جهان‌آباد، بلوار تلاش، روبروی نیروگاه، درب شماره ۳ خط تولید کوره',
    postalCode: '8961123456',
    isDefault: true,
  },
  {
    id: 'addr-2',
    title: 'دفتر مرکزی بازرگانی یزد',
    recipientName: 'محمدرضا زارع',
    recipientPhone: '09131512345',
    province: 'یزد',
    city: 'یزد',
    fullAddress: 'بلوار جمهوری اسلامی، بعد از بیمارستان افشار، جنب بانک سپه',
    postalCode: '8917987654',
    isDefault: false,
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return currentUser ? currentUser.role : 'guest';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [redirectOnLogin, setRedirectOnLogin] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
        setActiveRole(currentUser.role);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setActiveRole('guest');
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  const openAuthModal = (redirectPath?: string) => {
    if (redirectPath) setRedirectOnLogin(redirectPath);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setRedirectOnLogin(null);
  };

  const clearWelcomeMessage = () => {
    setWelcomeMessage(null);
  };

  const loginWithOtp = (phone: string, fullName?: string, companyName?: string): { isNewUser: boolean } => {
    // Check if user exists in mock or registered storage
    const normalizedPhone = phone.trim();
    let existingUser = MOCK_CUSTOMERS.find(c => c.phone === normalizedPhone);

    let isNew = false;

    if (!existingUser) {
      try {
        const storedUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
        const storedUsers: Customer[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];
        existingUser = storedUsers.find(u => u.phone === normalizedPhone);
      } catch {
        // ignore
      }
    }

    if (existingUser) {
      // Existing user login
      const loggedUser = {
        ...existingUser,
        addresses: existingUser.addresses && existingUser.addresses.length > 0 ? existingUser.addresses : INITIAL_DEFAULT_ADDRESSES,
      };
      setCurrentUser(loggedUser);
      setActiveRole(loggedUser.role);
      setWelcomeMessage(`خوش آمدید، ${loggedUser.fullName || 'همکار گرامی'}`);
    } else {
      // New user auto registration
      isNew = true;
      const newUser: Customer = {
        id: 'cust-' + Date.now().toString().slice(-6),
        fullName: fullName || `مشتری ${normalizedPhone.slice(-4)}`,
        companyName: companyName || '',
        phone: normalizedPhone,
        role: 'retail',
        clubTier: 'bronze',
        clubPoints: 50, // ۵۰ امتیاز خوش‌آمدگویی
        approvedB2B: false,
        city: 'یزد',
        province: 'یزد',
        addresses: INITIAL_DEFAULT_ADDRESSES,
        createdAt: new Date().toLocaleDateString('fa-IR'),
      };

      try {
        const storedUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
        const storedUsers: Customer[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];
        storedUsers.push(newUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));
      } catch {
        // ignore
      }

      setCurrentUser(newUser);
      setActiveRole('retail');
      setWelcomeMessage('خوش آمدید! ۵۰ امتیاز هدیه خوش‌آمدگویی به حساب شما افزوده شد.');
    }

    setIsAuthModalOpen(false);

    // If there was a redirect waiting, handle it outside or via navigation
    if (redirectOnLogin) {
      window.location.hash = ''; // ensure clean state
      // window.location.pathname will be navigated by components listening to auth or redirect
    }

    return { isNewUser: isNew };
  };

  const loginAs = (role: UserRole) => {
    if (role === 'guest') {
      setCurrentUser(null);
      setActiveRole('guest');
      return;
    }

    if (role === 'admin') {
      const adminUser: Customer = {
        id: 'admin-1',
        fullName: 'مدیریت بازرگانی تسمه اطلس',
        companyName: 'دفتر مرکزی یزد',
        phone: '035-37254000',
        email: 'admin@atlassanat.ir',
        role: 'admin',
        clubTier: 'gold',
        clubPoints: 5000,
        approvedB2B: true,
        city: 'یزد',
        province: 'یزد',
        addresses: INITIAL_DEFAULT_ADDRESSES,
        createdAt: '1366/01/01',
      };
      setCurrentUser(adminUser);
      setActiveRole('admin');
      return;
    }

    const mock = MOCK_CUSTOMERS.find(c => c.role === role) || MOCK_CUSTOMERS[0];
    const userWithAddresses: Customer = {
      ...mock,
      addresses: mock.addresses && mock.addresses.length > 0 ? mock.addresses : INITIAL_DEFAULT_ADDRESSES,
    };
    setCurrentUser(userWithAddresses);
    setActiveRole(role);
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveRole('guest');
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchRole = (role: UserRole) => {
    loginAs(role);
  };

  const addClubPoints = (pts: number) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? { ...prev, clubPoints: Math.max(0, prev.clubPoints + pts) } : null);
  };

  const updateProfile = (data: Partial<Customer>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
  };

  const activateDealerRole = () => {
    if (currentUser) {
      const updatedUser: Customer = {
        ...currentUser,
        role: 'dealer',
        approvedB2B: true,
        companyName: currentUser.companyName || 'فروشگاه و نمایندگی پخش قطعات صنعتی',
      };
      setCurrentUser(updatedUser);
      setActiveRole('dealer');
      setWelcomeMessage('پنل نمایندگی و پخش هایپر صنعت اطلس برای شما با موفقیت فعال شد.');
    } else {
      loginAs('dealer');
      setWelcomeMessage('پنل نمایندگی و پخش هایپر صنعت اطلس فعال شد.');
    }
  };

  const getUserAddresses = (): Address[] => {
    if (currentUser?.addresses && currentUser.addresses.length > 0) {
      return currentUser.addresses;
    }
    return INITIAL_DEFAULT_ADDRESSES;
  };

  const addAddress = (addressData: Omit<Address, 'id'>): Address => {
    const newAddr: Address = {
      ...addressData,
      id: 'addr-' + Date.now(),
      isDefault: addressData.isDefault ?? false,
    };

    if (currentUser) {
      const currentList = getUserAddresses();
      const updatedList: Address[] = newAddr.isDefault
        ? [...currentList.map(a => ({ ...a, isDefault: false })), newAddr]
        : [...currentList, newAddr];
      updateProfile({ addresses: updatedList });
    }
    return newAddr;
  };

  const updateAddress = (id: string, addressData: Partial<Address>) => {
    if (!currentUser) return;
    const currentList = getUserAddresses();
    let updatedList = currentList.map(a => (a.id === id ? { ...a, ...addressData } : a));
    if (addressData.isDefault) {
      updatedList = updatedList.map(a => ({ ...a, isDefault: a.id === id }));
    }
    updateProfile({ addresses: updatedList });
  };

  const deleteAddress = (id: string) => {
    if (!currentUser) return;
    const currentList = getUserAddresses();
    const updatedList = currentList.filter(a => a.id !== id);
    if (updatedList.length > 0 && !updatedList.some(a => a.isDefault)) {
      updatedList[0].isDefault = true;
    }
    updateProfile({ addresses: updatedList });
  };

  const setDefaultAddress = (id: string) => {
    if (!currentUser) return;
    const currentList = getUserAddresses();
    const updatedList = currentList.map(a => ({ ...a, isDefault: a.id === id }));
    updateProfile({ addresses: updatedList });
  };

  let priceLayer: keyof PriceTiers = 'retail';
  if (activeRole === 'wholesale') priceLayer = 'wholesale';
  else if (activeRole === 'dealer') priceLayer = 'dealer';
  else if (activeRole === 'admin') priceLayer = 'dealer';
  else priceLayer = 'retail';

  const roleTitles: Record<UserRole, string> = {
    guest: 'مشتری عزیز (استعلام قیمت)',
    retail: 'مشتری گرامی بازرگانی اطلس',
    wholesale: 'مشتری صنعتی و همکار معتبر',
    dealer: 'نمایندگی رسمی و شبکه پخش اطلس',
    admin: 'مدیر ارشد سامانه بازرگانی اطلس',
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        priceLayer,
        roleTitle: roleTitles[activeRole],
        isDealer: activeRole === 'dealer',
        isAuthModalOpen,
        welcomeMessage,
        openAuthModal,
        closeAuthModal,
        clearWelcomeMessage,
        loginWithOtp,
        loginAs,
        logout,
        switchRole,
        addClubPoints,
        updateProfile,
        activateDealerRole,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getUserAddresses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
