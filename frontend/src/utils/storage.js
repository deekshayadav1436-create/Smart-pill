// Local Storage & Multi-User Authentication Engine for Smart Pill Reminder System

const STORAGE_KEYS = {
  USERS: "smartpill_users",
  CURRENT_USER: "smartpill_current_user",
  MEDICATIONS_PREFIX: "smartpill_medications_",
  HEALTH_PREFIX: "smartpill_health_records_",
  NOTIFICATIONS_PREFIX: "smartpill_notifications_",
};

// Default seed users for demonstration
export const DEFAULT_USERS = [
  {
    id: "usr_1024",
    name: "Samskrut S.",
    email: "samskrut@smartpill.com",
    password: "password123",
    patientId: "SP-1024",
    role: "Patient",
    createdAt: "2026-09-24",
  },
  {
    id: "usr_1025",
    name: "Dr. Ananya Roy",
    email: "ananya@smartpill.com",
    password: "password123",
    patientId: "SP-1025",
    role: "Patient",
    createdAt: "2026-09-25",
  },
];

// Default sample medications for user 1 (Samskrut)
export const DEFAULT_MEDICATIONS_USER1 = [
  {
    id: 1,
    name: "Metformin",
    dose: "500 mg",
    time: "08:00",
    frequency: "Daily",
    type: "Tablet",
    status: "Taken",
    instructions: "Take with breakfast",
  },
  {
    id: 2,
    name: "Lisinopril",
    dose: "10 mg",
    time: "09:00",
    frequency: "Daily",
    type: "Tablet",
    status: "Taken",
    instructions: "For blood pressure control",
  },
  {
    id: 3,
    name: "Vitamin D3",
    dose: "1000 IU",
    time: "13:00",
    frequency: "Daily",
    type: "Capsule",
    status: "Upcoming",
    instructions: "Take after lunch with water",
  },
  {
    id: 4,
    name: "Amoxicillin",
    dose: "250 mg",
    time: "14:00",
    frequency: "Twice Daily",
    type: "Capsule",
    status: "Missed",
    instructions: "Complete full antibiotic course",
  },
  {
    id: 5,
    name: "Atorvastatin",
    dose: "20 mg",
    time: "20:30",
    frequency: "Daily",
    type: "Tablet",
    status: "Upcoming",
    instructions: "Take before bedtime",
  },
];

// Sample medications for user 2 (Ananya - demonstrating isolated user records)
export const DEFAULT_MEDICATIONS_USER2 = [
  {
    id: 201,
    name: "Aspirin",
    dose: "75 mg",
    time: "08:30",
    frequency: "Daily",
    type: "Tablet",
    status: "Taken",
    instructions: "Take after morning meal",
  },
  {
    id: 202,
    name: "Omega-3 Fish Oil",
    dose: "1000 mg",
    time: "13:30",
    frequency: "Daily",
    type: "Capsule",
    status: "Upcoming",
    instructions: "Dietary supplement with lunch",
  },
  {
    id: 203,
    name: "Cetirizine",
    dose: "10 mg",
    time: "21:00",
    frequency: "As Needed",
    type: "Tablet",
    status: "Upcoming",
    instructions: "For seasonal allergies",
  },
];

// ==========================================
// USER AUTHENTICATION MANAGEMENT
// ==========================================

export const getUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch (error) {
    console.error("Failed to load users from localStorage:", error);
    return DEFAULT_USERS;
  }
};

export const saveUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage:", error);
  }
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read current user from localStorage:", error);
    return null;
  }
};

export const setCurrentUser = (user) => {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  } catch (error) {
    console.error("Failed to set current user in localStorage:", error);
  }
};

export const registerUser = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return { success: false, message: "Please fill in all required fields." };
  }

  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );
  if (existingUser) {
    return {
      success: false,
      message: "An account with this email already exists. Please log in.",
    };
  }

  const newPatientId = `SP-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    password: password,
    patientId: newPatientId,
    role: "Patient",
    createdAt: new Date().toISOString().split("T")[0],
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  setCurrentUser(newUser);

  // Initialize a realistic starter set for this newly registered patient
  const starterMeds = [
    {
      id: Date.now(),
      name: "Multivitamin",
      dose: "1 Tablet",
      time: "09:00",
      frequency: "Daily",
      type: "Tablet",
      status: "Upcoming",
      instructions: "Take with breakfast and plenty of water",
    },
    {
      id: Date.now() + 1,
      name: "Vitamin C",
      dose: "500 mg",
      time: "14:00",
      frequency: "Daily",
      type: "Tablet",
      status: "Upcoming",
      instructions: "Immunity booster after lunch",
    },
  ];
  saveUserMedications(newUser.id, starterMeds);

  return { success: true, user: newUser };
};

export const loginUser = (email, password) => {
  if (!email || !password) {
    return { success: false, message: "Please enter your email and password." };
  }

  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!user) {
    return {
      success: false,
      message: "Invalid email or password. Please verify your credentials.",
    };
  }

  setCurrentUser(user);
  return { success: true, user };
};

export const logoutUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (error) {
    console.error("Failed to logout user:", error);
  }
};

// ==========================================
// USER-SCOPED MEDICATION DATA STORAGE
// ==========================================

export const loadUserMedications = (userId) => {
  if (!userId) return [];
  try {
    const key = `${STORAGE_KEYS.MEDICATIONS_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Backward compatibility: If it's user 1, check if old global key exists
      if (userId === "usr_1024") {
        const oldGlobal = localStorage.getItem("smartpill_medications");
        if (oldGlobal) {
          const parsed = JSON.parse(oldGlobal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(key, oldGlobal);
            return parsed;
          }
        }
        localStorage.setItem(key, JSON.stringify(DEFAULT_MEDICATIONS_USER1));
        return DEFAULT_MEDICATIONS_USER1;
      } else if (userId === "usr_1025") {
        localStorage.setItem(key, JSON.stringify(DEFAULT_MEDICATIONS_USER2));
        return DEFAULT_MEDICATIONS_USER2;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Failed to load medications for user ${userId}:`, error);
    return [];
  }
};

export const saveUserMedications = (userId, medications) => {
  if (!userId) return;
  try {
    const key = `${STORAGE_KEYS.MEDICATIONS_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(medications));
  } catch (error) {
    console.error(`Failed to save medications for user ${userId}:`, error);
  }
};

// ==========================================
// USER HELPER UTILITIES
// ==========================================

export const getUserInitials = (name) => {
  if (!name) return "SP";
  const parts = name.trim().replace(/^Dr\.\s*/i, "").split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};
