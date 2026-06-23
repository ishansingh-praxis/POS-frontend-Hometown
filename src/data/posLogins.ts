export type PosRole = "ADMIN" | "MANAGER" | "CASHIER";

export type PosLogin = {
  serial: number;
  role: PosRole;
  name: string;
  email: string;
  password: string;
  storeCode: string;
  storeName: string;
  dashboardType: "ADMIN_DASHBOARD" | "MANAGER_DASHBOARD" | "CASHIER_DASHBOARD";
};

export const POS_LOGINS: PosLogin[] = [
  { serial: 1, role: "ADMIN", name: "KAILASH", email: "kailash.vaishanv@praxisretail.in", password: "Password@123", storeCode: "ALL", storeName: "ALL STORES", dashboardType: "ADMIN_DASHBOARD" },
  { serial: 2, role: "ADMIN", name: "PUNIT PRAKASH SINGH", email: "punit.singh@praxisretail.in", password: "Password@123", storeCode: "ALL", storeName: "ALL STORES", dashboardType: "ADMIN_DASHBOARD" },

  { serial: 3, role: "MANAGER", name: "AZAM QAZI", email: "manager.6068@hometownpos.in", password: "Password@123", storeCode: "6068", storeName: "Ht Aurangabad-Prozone Mall", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 4, role: "MANAGER", name: "ALOK RANJAN SAHOO", email: "manager.6036@hometownpos.in", password: "Password@123", storeCode: "6036", storeName: "Ht Bhubaneshwar Janpath", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 5, role: "MANAGER", name: "PRANJAL BARUAH", email: "manager.6098@hometownpos.in", password: "Password@123", storeCode: "6098", storeName: "Ht-Guwahati Lachit Nagar", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 6, role: "MANAGER", name: "RAHUL DESHMUKH", email: "manager.6063@hometownpos.in", password: "Password@123", storeCode: "6063", storeName: "Ht-Nashik City Center Mall", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 7, role: "MANAGER", name: "DHRUV SHAH", email: "manager.6501@hometownpos.in", password: "Password@123", storeCode: "6501", storeName: "Ht-Ahmedabad Acropolis Mall", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 8, role: "MANAGER", name: "SUBHAJIT ROY", email: "manager.6352@hometownpos.in", password: "Password@123", storeCode: "6352", storeName: "Ht-Kol-Bhavanipur Homeland", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 9, role: "MANAGER", name: "ANIRBAN DUTTA", email: "manager.6357@hometownpos.in", password: "Password@123", storeCode: "6357", storeName: "Ht-Kolkata-Dcn Mall", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 10, role: "MANAGER", name: "VIVEK TIWARI", email: "manager.6140@hometownpos.in", password: "Password@123", storeCode: "6140", storeName: "Ht-Lucknow-Gomti Nagar", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 11, role: "MANAGER", name: "NITIN GEDAM", email: "manager.6343@hometownpos.in", password: "Password@123", storeCode: "6343", storeName: "Ht-Exp Nagpur Wardha Road", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 12, role: "MANAGER", name: "ROHIT KUMAR", email: "manager.6139@hometownpos.in", password: "Password@123", storeCode: "6139", storeName: "Ht-Patna-Bhavya Iconic Tower", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 13, role: "MANAGER", name: "SAGAR PATIL", email: "manager.6150@hometownpos.in", password: "Password@123", storeCode: "6150", storeName: "Ht-Pune Seasons Mall", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 14, role: "MANAGER", name: "SHANKAR BARMAN", email: "manager.6144@hometownpos.in", password: "Password@123", storeCode: "6144", storeName: "Ht-Raipur-Lal ganga", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 15, role: "MANAGER", name: "HIMANSU SEKHAR NAYAK", email: "manager.6346@hometownpos.in", password: "Password@123", storeCode: "6346", storeName: "Ht-Siliguri", dashboardType: "MANAGER_DASHBOARD" },
  { serial: 16, role: "MANAGER", name: "SATYANARAYANA REDDY", email: "manager.6095@hometownpos.in", password: "Password@123", storeCode: "6095", storeName: "Ht-Vizag Cmr Central Mall", dashboardType: "MANAGER_DASHBOARD" },

  { serial: 17, role: "CASHIER", name: "AARAV SHARMA", email: "cashier1.6068@hometownpos.in", password: "Password@123", storeCode: "6068", storeName: "Ht Aurangabad-Prozone Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 18, role: "CASHIER", name: "ADITI SINGH", email: "cashier2.6068@hometownpos.in", password: "Password@123", storeCode: "6068", storeName: "Ht Aurangabad-Prozone Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 19, role: "CASHIER", name: "RAHUL VERMA", email: "cashier3.6068@hometownpos.in", password: "Password@123", storeCode: "6068", storeName: "Ht Aurangabad-Prozone Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 20, role: "CASHIER", name: "PRIYA NAIR", email: "cashier4.6068@hometownpos.in", password: "Password@123", storeCode: "6068", storeName: "Ht Aurangabad-Prozone Mall", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 21, role: "CASHIER", name: "NEHA MEHTA", email: "cashier1.6036@hometownpos.in", password: "Password@123", storeCode: "6036", storeName: "Ht Bhubaneshwar Janpath", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 22, role: "CASHIER", name: "ROHAN GUPTA", email: "cashier2.6036@hometownpos.in", password: "Password@123", storeCode: "6036", storeName: "Ht Bhubaneshwar Janpath", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 23, role: "CASHIER", name: "ANANYA RAO", email: "cashier3.6036@hometownpos.in", password: "Password@123", storeCode: "6036", storeName: "Ht Bhubaneshwar Janpath", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 24, role: "CASHIER", name: "SANJAY PATEL", email: "cashier4.6036@hometownpos.in", password: "Password@123", storeCode: "6036", storeName: "Ht Bhubaneshwar Janpath", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 25, role: "CASHIER", name: "KAVITA IYER", email: "cashier1.6098@hometownpos.in", password: "Password@123", storeCode: "6098", storeName: "Ht-Guwahati Lachit Nagar", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 26, role: "CASHIER", name: "VIKRAM JOSHI", email: "cashier2.6098@hometownpos.in", password: "Password@123", storeCode: "6098", storeName: "Ht-Guwahati Lachit Nagar", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 27, role: "CASHIER", name: "SNEHA DAS", email: "cashier3.6098@hometownpos.in", password: "Password@123", storeCode: "6098", storeName: "Ht-Guwahati Lachit Nagar", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 28, role: "CASHIER", name: "ARJUN MENON", email: "cashier4.6098@hometownpos.in", password: "Password@123", storeCode: "6098", storeName: "Ht-Guwahati Lachit Nagar", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 29, role: "CASHIER", name: "MEERA KAPOOR", email: "cashier1.6063@hometownpos.in", password: "Password@123", storeCode: "6063", storeName: "Ht-Nashik City Center Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 30, role: "CASHIER", name: "KARAN MALHOTRA", email: "cashier2.6063@hometownpos.in", password: "Password@123", storeCode: "6063", storeName: "Ht-Nashik City Center Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 31, role: "CASHIER", name: "POOJA SHAH", email: "cashier3.6063@hometownpos.in", password: "Password@123", storeCode: "6063", storeName: "Ht-Nashik City Center Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 32, role: "CASHIER", name: "NITIN KULKARNI", email: "cashier4.6063@hometownpos.in", password: "Password@123", storeCode: "6063", storeName: "Ht-Nashik City Center Mall", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 33, role: "CASHIER", name: "SONAL JAIN", email: "cashier1.6501@hometownpos.in", password: "Password@123", storeCode: "6501", storeName: "Ht-Ahmedabad Acropolis Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 34, role: "CASHIER", name: "DEEPAK YADAV", email: "cashier2.6501@hometownpos.in", password: "Password@123", storeCode: "6501", storeName: "Ht-Ahmedabad Acropolis Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 35, role: "CASHIER", name: "RITU SINHA", email: "cashier3.6501@hometownpos.in", password: "Password@123", storeCode: "6501", storeName: "Ht-Ahmedabad Acropolis Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 36, role: "CASHIER", name: "ALOK MISHRA", email: "cashier4.6501@hometownpos.in", password: "Password@123", storeCode: "6501", storeName: "Ht-Ahmedabad Acropolis Mall", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 37, role: "CASHIER", name: "ISHA PATEL", email: "cashier1.6352@hometownpos.in", password: "Password@123", storeCode: "6352", storeName: "Ht-Kol-Bhavanipur Homeland", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 38, role: "CASHIER", name: "KABIR KHAN", email: "cashier2.6352@hometownpos.in", password: "Password@123", storeCode: "6352", storeName: "Ht-Kol-Bhavanipur Homeland", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 39, role: "CASHIER", name: "TANYA BOSE", email: "cashier3.6352@hometownpos.in", password: "Password@123", storeCode: "6352", storeName: "Ht-Kol-Bhavanipur Homeland", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 40, role: "CASHIER", name: "MANISH JAIN", email: "cashier1.6357@hometownpos.in", password: "Password@123", storeCode: "6357", storeName: "Ht-Kolkata-Dcn Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 41, role: "CASHIER", name: "DIVYA NAIR", email: "cashier2.6357@hometownpos.in", password: "Password@123", storeCode: "6357", storeName: "Ht-Kolkata-Dcn Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 42, role: "CASHIER", name: "HARSH MEHTA", email: "cashier3.6357@hometownpos.in", password: "Password@123", storeCode: "6357", storeName: "Ht-Kolkata-Dcn Mall", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 43, role: "CASHIER", name: "RIYA SEN", email: "cashier1.6140@hometownpos.in", password: "Password@123", storeCode: "6140", storeName: "Ht-Lucknow-Gomti Nagar", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 44, role: "CASHIER", name: "MOHIT ARORA", email: "cashier2.6140@hometownpos.in", password: "Password@123", storeCode: "6140", storeName: "Ht-Lucknow-Gomti Nagar", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 45, role: "CASHIER", name: "KOMAL GUPTA", email: "cashier3.6140@hometownpos.in", password: "Password@123", storeCode: "6140", storeName: "Ht-Lucknow-Gomti Nagar", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 46, role: "CASHIER", name: "SURESH YADAV", email: "cashier1.6343@hometownpos.in", password: "Password@123", storeCode: "6343", storeName: "Ht-Exp Nagpur Wardha Road", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 47, role: "CASHIER", name: "BHAVNA SHAH", email: "cashier2.6343@hometownpos.in", password: "Password@123", storeCode: "6343", storeName: "Ht-Exp Nagpur Wardha Road", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 48, role: "CASHIER", name: "ANKIT RAWAT", email: "cashier3.6343@hometownpos.in", password: "Password@123", storeCode: "6343", storeName: "Ht-Exp Nagpur Wardha Road", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 49, role: "CASHIER", name: "SWATI IYER", email: "cashier1.6139@hometownpos.in", password: "Password@123", storeCode: "6139", storeName: "Ht-Patna-Bhavya Iconic Tower", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 50, role: "CASHIER", name: "RAMESH KUMAR", email: "cashier2.6139@hometownpos.in", password: "Password@123", storeCode: "6139", storeName: "Ht-Patna-Bhavya Iconic Tower", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 51, role: "CASHIER", name: "NISHA VERMA", email: "cashier3.6139@hometownpos.in", password: "Password@123", storeCode: "6139", storeName: "Ht-Patna-Bhavya Iconic Tower", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 52, role: "CASHIER", name: "VIVEK SINHA", email: "cashier1.6150@hometownpos.in", password: "Password@123", storeCode: "6150", storeName: "Ht-Pune Seasons Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 53, role: "CASHIER", name: "GEETA DAS", email: "cashier2.6150@hometownpos.in", password: "Password@123", storeCode: "6150", storeName: "Ht-Pune Seasons Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 54, role: "CASHIER", name: "AMAN MALHOTRA", email: "cashier3.6150@hometownpos.in", password: "Password@123", storeCode: "6150", storeName: "Ht-Pune Seasons Mall", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 55, role: "CASHIER", name: "PREETI RAO", email: "cashier1.6144@hometownpos.in", password: "Password@123", storeCode: "6144", storeName: "Ht-Raipur-Lal ganga", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 56, role: "CASHIER", name: "YOGESH JOSHI", email: "cashier2.6144@hometownpos.in", password: "Password@123", storeCode: "6144", storeName: "Ht-Raipur-Lal ganga", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 57, role: "CASHIER", name: "SUNITA SINGH", email: "cashier3.6144@hometownpos.in", password: "Password@123", storeCode: "6144", storeName: "Ht-Raipur-Lal ganga", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 58, role: "CASHIER", name: "MANOJ PATEL", email: "cashier1.6346@hometownpos.in", password: "Password@123", storeCode: "6346", storeName: "Ht-Siliguri", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 59, role: "CASHIER", name: "KRITIKA JAIN", email: "cashier2.6346@hometownpos.in", password: "Password@123", storeCode: "6346", storeName: "Ht-Siliguri", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 60, role: "CASHIER", name: "SAMEER KHAN", email: "cashier3.6346@hometownpos.in", password: "Password@123", storeCode: "6346", storeName: "Ht-Siliguri", dashboardType: "CASHIER_DASHBOARD" },

  { serial: 61, role: "CASHIER", name: "PAYAL ROY", email: "cashier1.6095@hometownpos.in", password: "Password@123", storeCode: "6095", storeName: "Ht-Vizag Cmr Central Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 62, role: "CASHIER", name: "AJAY NAIR", email: "cashier2.6095@hometownpos.in", password: "Password@123", storeCode: "6095", storeName: "Ht-Vizag Cmr Central Mall", dashboardType: "CASHIER_DASHBOARD" },
  { serial: 63, role: "CASHIER", name: "SIMRAN KAUR", email: "cashier3.6095@hometownpos.in", password: "Password@123", storeCode: "6095", storeName: "Ht-Vizag Cmr Central Mall", dashboardType: "CASHIER_DASHBOARD" },
];

export const getLoginsByRole = (role: PosRole) =>
  POS_LOGINS.filter((user) => user.role === role);

export const findLoginByEmail = (email: string) =>
  POS_LOGINS.find((user) => user.email.toLowerCase() === email.toLowerCase());
