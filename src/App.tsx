import { useState, useEffect, useRef, useMemo } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "./firebase";
import { Employee, Criteria, SystemUser, Evaluation } from "./types";
import { INITIAL_USERS, SUPER_ADMIN, CRITERIA, INITIAL_EMPLOYEES } from "./data";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogOut, 
  Search, 
  RefreshCw, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  FileDown, 
  Activity, 
  Send, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  AlertCircle,
  FileCheck,
  Sun,
  Moon
} from "lucide-react";

// Firestore Error Types and Logger conformant with system specs
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: "custom-auth-web-session"
    },
    operationType,
    path
  };
  console.error("Firestore Error Checklist: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  // --- STATE DECLARATIONS ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved !== null ? saved === "true" : false; // Defaults to Day Mode as requested by user
  });
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  // Auth States
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginDarkMode, setLoginDarkMode] = useState(false);

  // App Workspace & Sidebar Switcher
  const [activeTab, setActiveTab] = useState<"form" | "dashboard" | "manageusers">("form");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form Entry States
  const [empId, setEmpId] = useState("");
  const [empName, setEmpName] = useState("");
  const [position, setPosition] = useState("");
  const [campus, setCampus] = useState("");
  const [gender, setGender] = useState("");
  const [hiredDate, setHiredDate] = useState("");
  const [appraiser, setAppraiser] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  // Scores
  const [selfScores, setSelfScores] = useState<{ [critId: number]: number }>({});
  const [superScores, setSuperScores] = useState<{ [critId: number]: number }>({});
  const [sheetStatus, setSheetStatus] = useState<string>("Click Refresh to load online G-Sheet data");
  const [refreshingSheetStates, setRefreshingSheetStates] = useState(false);

  // Search, Suggestions, Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Modals & Details
  const [selectedEvalIndex, setSelectedEvalIndex] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [mUserId, setMUserId] = useState("");
  const [mUserName, setMUserName] = useState("");
  const [mPassword, setMPassword] = useState("user123");
  const [mRole, setMRole] = useState<"admin" | "superadmin">("admin");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // --- SHOW TOAST ---
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- ANIMATED STAR CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Bootstrap star objects
    const STAR_COUNT = 150;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.2 + 0.4,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.5 + 0.1,
        twinkleSpeed: Math.random() * 0.015 + 0.003,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * 0.001;

      // Galaxy background ambient glows (only draw dark galaxy gradients if in dark mode)
      if (isDarkMode) {
        const galaxyX = canvas.width * 0.3 + Math.sin(time * 0.04) * canvas.width * 0.1;
        const galaxyY = canvas.height * 0.3 + Math.cos(time * 0.03) * canvas.height * 0.08;
        const galaxyRad = Math.min(canvas.width, canvas.height) * 0.4;
        const galGrad = ctx.createRadialGradient(galaxyX, galaxyY, 0, galaxyX, galaxyY, galaxyRad);
        galGrad.addColorStop(0, "rgba(30, 98, 236, 0.03)");
        galGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.015)");
        galGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = galGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Soft sunny rays in day mode
        const galaxyX = canvas.width * 0.4 + Math.sin(time * 0.04) * canvas.width * 0.05;
        const galaxyY = canvas.height * 0.2 + Math.cos(time * 0.03) * canvas.height * 0.05;
        const galaxyRad = Math.min(canvas.width, canvas.height) * 0.3;
        const galGrad = ctx.createRadialGradient(galaxyX, galaxyY, 0, galaxyX, galaxyY, galaxyRad);
        galGrad.addColorStop(0, "rgba(245, 158, 11, 0.03)");
        galGrad.addColorStop(0.5, "rgba(14, 165, 233, 0.015)");
        galGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = galGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render star pixels
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.speedX;
        s.y += s.speedY;

        if (s.x < -5) s.x = canvas.width + 5;
        if (s.x > canvas.width + 5) s.x = -5;
        if (s.y < -5) s.y = canvas.height + 5;
        if (s.y > canvas.height + 5) s.y = -5;

        const twinkle = s.opacity * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed * 10 + s.twinklePhase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        
        if (isDarkMode) {
          ctx.fillStyle = `rgba(96, 165, 250, ${twinkle})`;
        } else {
          ctx.fillStyle = `rgba(59, 130, 246, ${twinkle * 0.55})`;
        }
        ctx.fill();

        if (s.size > 1.6) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3.5, 0, Math.PI * 2);
          if (isDarkMode) {
            ctx.fillStyle = `rgba(59, 130, 246, ${twinkle * 0.08})`;
          } else {
            ctx.fillStyle = `rgba(14, 165, 233, ${twinkle * 0.04})`;
          }
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  // --- FIRESTORE DATABASE SYNCHRONIZATION ---
  useEffect(() => {
    // 1. Real-time Listeners for Evaluations
    const unsubEvals = onSnapshot(
      collection(db, "evaluations"),
      (snapshot) => {
        const list: Evaluation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Evaluation);
        });
        // Sort chronologically by submission time (newest first)
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEvaluations(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "evaluations");
      }
    );

    // 2. Real-time Listeners for System Administrators Concept
    const unsubUsers = onSnapshot(
      collection(db, "system_users"),
      async (snapshot) => {
        const list: SystemUser[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SystemUser);
        });
        
        if (list.length === 0) {
          // SEED DATABASE ON COLD LAUNCH
          console.log("Seeding Firestore with standard admins...");
          try {
            // Write default users & super admin concept
            const seedList = [SUPER_ADMIN, ...INITIAL_USERS];
            for (const adminUser of seedList) {
              await setDoc(doc(db, "system_users", adminUser.id), adminUser);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, "system_users");
          }
        } else {
          setSystemUsers(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "system_users");
      }
    );

    return () => {
      unsubEvals();
      unsubUsers();
    };
  }, []);

  // Auto-fetch employee data on mount
  useEffect(() => {
    fetchEmployeesFromSheet();
  }, []);

  // Auto-sync employee data from MasterList every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEmployeesFromSheet();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close suggestions box on external clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAutocompleteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-populate appraiser field from logged-in user
  useEffect(() => {
    if (user) {
      setAppraiser(user.name);
    }
  }, [user]);

  // --- REMOTE FILE & SHEETS SYNC SYSTEM ---
  async function fetchEmployeesFromSheet() {
    try {
      const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTO68GX9WFErMXR7GxUbaAybv0Vu-Cuia482ACsE8LDVOy_g_fAmvuEG7Y6WTSAII_PG521XZoBgBM_/pub?gid=1500996284&single=true&output=csv");
      if (!response.ok) throw new Error("Spreadsheet employee CSV fetch failed");
      const csv = await response.text();
      const lines = csv.split("\n");
      const fetched: Employee[] = [];
      let started = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.includes("Staff ID")) {
          started = true;
          continue;
        }
        if (!started) continue;

        const parts = parseCSVLine(line);
        const id = (parts[2] || "").trim();
        if (!id || isNaN(Number(id))) continue;

        fetched.push({
          id: id,
          name: (parts[3] || "").trim().toUpperCase(),
          nameKh: (parts[4] || "").trim(),
          gender: (parts[5] || "").trim(),
          hired: (parts[11] || "").trim(),
          campus: (parts[13] || "").trim(),
          position: (parts[14] || "").trim()
        });
      }

      if (fetched.length > 5) {
        setEmployees(fetched);
        setSheetStatus(`${fetched.length} staff list synchronized dynamically from Google Workspace!`);
      }
    } catch (err: any) {
      console.log("Sheet demographics loader failed, using default cached employee seed:", err.message);
      setSheetStatus("Sheet proxy offline, loaded native employees blueprint cache.");
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === "," && !inQ) {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  };

  const fetchSelfScoresForEmployee = async (employeeIdStr: string) => {
    try {
      const resp = await fetch(`https://docs.google.com/spreadsheets/d/1PtOX76nXMJFZ7ymlyrmdYMlPSVU6p614b5Azx1MBkMk/gviz/tq?tqx=out:csv&gid=607488980`);
      if (!resp.ok) throw new Error("G-Sheets self-scores fetch failed");
      const csv = await resp.text();
      const lines = csv.split("\n");
      let matchedScores: number[] = [];

      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = parseCSVLine(line);
        // Column 2 is standard Employee ID Column in submissions
        if (parts.length >= 14) {
          const id = parts[2].trim();
          if (id === employeeIdStr) {
            const tempScores: number[] = [];
            // Columns 4 -> 13 are the 10 scorecard inputs
            for (let cols = 4; cols < 14; cols++) {
              tempScores.push(parseFloat(parts[cols]) || 0);
            }
            matchedScores = tempScores;
          }
        }
      }

      const tempSelfScores: { [id: number]: number } = {};
      if (matchedScores.length > 0) {
        CRITERIA.forEach((crit, index) => {
          tempSelfScores[crit.id] = matchedScores[index] !== undefined ? matchedScores[index] : 0;
        });
        setSelfScores(tempSelfScores);
        setSheetStatus(`Loaded ${matchedScores.length} Google Form selfscores for ID: ${employeeIdStr}`);
        showToast("Synchronized staff self-scores from G-Sheets!", "success");
      } else {
        // Clear self inputs if none matched
        CRITERIA.forEach((crit) => {
          tempSelfScores[crit.id] = 0;
        });
        setSelfScores(tempSelfScores);
        setSheetStatus(`No self-evaluation found for ID: ${employeeIdStr} in linked Sheet.`);
      }
    } catch (err: any) {
      console.log("Self-evaluation loader failed:", err.message);
      setSheetStatus("Offline or Sheet connection failed. Fields ready for manual entry.");
    }
  };

  const refreshSheetData = async () => {
    setRefreshingSheetStates(true);
    setSheetStatus("Pulling latest values from Sheet...");
    showToast("Re-fetching linked spreadsheet database...", "success");
    await fetchEmployeesFromSheet();
    if (empId) {
      await fetchSelfScoresForEmployee(empId);
    }
    setRefreshingSheetStates(false);
  };

  // --- ACTIONS & CALCULATORS ---
  const filteredEmployeesMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return employees.filter(
      (e) => e.id.startsWith(q) || e.name.toLowerCase().includes(q)
    );
  }, [searchQuery, employees]);

  const selectEmployeeHandler = (emp: Employee) => {
    setEmpId(emp.id);
    setEmpName(emp.name);
    setPosition(emp.position);
    setCampus(emp.campus);
    setGender(emp.gender === "M" ? "Male" : "Female");
    setHiredDate(emp.hired);
    setSearchQuery(emp.id);
    setAutocompleteOpen(false);

    // Pull evaluations
    fetchSelfScoresForEmployee(emp.id);
  };

  // Aggregations
  const totalSelfSum = useMemo(() => {
    return Object.values(selfScores).reduce((acc: number, v: number) => acc + (v || 0), 0);
  }, [selfScores]);

  const totalSuperSum = useMemo(() => {
    return Object.values(superScores).reduce((acc: number, v: number) => acc + (v || 0), 0);
  }, [superScores]);

  const overallCalculatedScore = useMemo(() => {
    // Override with supervisor score if present, otherwise default to self
    return totalSuperSum > 0 ? totalSuperSum : totalSelfSum;
  }, [totalSelfSum, totalSuperSum]);

  // Auth Functions
  const doLogin = () => {
    if (!loginUserId.trim() || !loginPassword) {
      setLoginError("Please enter both User ID and password.");
      return;
    }
    setLoginError("");
    setLoginLoading(true);

    setTimeout(() => {
      setLoginLoading(false);
      
      const adminMatches = systemUsers.find(
        (u) => u.id.toLowerCase() === loginUserId.trim().toLowerCase() && u.password === loginPassword
      );

      if (adminMatches) {
        setUser(adminMatches);
        fetchEmployeesFromSheet();
        showToast(`Successfully logged in as ${adminMatches.name}!`, "success");
        setLoginUserId("");
        setLoginPassword("");
      } else if (
        loginUserId.toLowerCase() === SUPER_ADMIN.id &&
        loginPassword === SUPER_ADMIN.password
      ) {
        setUser(SUPER_ADMIN);
        fetchEmployeesFromSheet();
        showToast("Logged in as Super Admin!", "success");
        setLoginUserId("");
        setLoginPassword("");
      } else {
        setLoginError("Invalid User ID or password. Try again.");
      }
    }, 1000);
  };

  const doLogout = () => {
    setUser(null);
    setActiveTab("form");
    setSidebarOpen(false);
    showToast("Logged out successfully.", "success");
  };

  // Submit Handler write to Firestore
  const submitEvaluationForm = async () => {
    if (!empId || !empName || !campus || !appraiser || !reviewDate) {
      showToast("សូមបំពេញព័ត៌មានចាំបាច់ / Please fill in all mandatory evaluation parameters.", "error");
      return;
    }
    if (totalSelfSum === 0 && totalSuperSum === 0) {
      showToast("សូមបញ្ចូលពិន្ទុ / Please key-in metric evaluations first.", "error");
      return;
    }

    const payload: Omit<Evaluation, "id"> = {
      employeeId: empId,
      employeeName: empName,
      position,
      campus,
      hiredDate,
      gender,
      appraiser,
      reviewDate,
      evaluatorId: user.id,
      criteria: CRITERIA.map((crit) => ({
        id: crit.id,
        self: selfScores[crit.id] || 0
      })),
      superScores: CRITERIA.map((crit) => ({
        id: crit.id,
        super: superScores[crit.id] || 0
      })),
      totalSelf: totalSelfSum,
      totalSuper: totalSuperSum,
      overallScore: overallCalculatedScore,
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "evaluations"), payload);
      showToast("ដាក់ស្នើជោគជ័យ និងធ្វើសមកាលកម្មសម្រាប់គ្រប់ឧបករណ៍! / Submitted successfully & synced across all devices in real-time!", "success");
      // Reset Form fields
      setEmpId("");
      setEmpName("");
      setPosition("");
      setCampus("");
      setGender("");
      setHiredDate("");
      setAppraiser(user.name);
      setReviewDate("");
      setSearchQuery("");
      setSelfScores({});
      setSuperScores({});
      setActiveTab("dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "evaluations");
      showToast("Submission failed to write to Firestore.", "error");
    }
  };

  // Delete evaluation
  const deleteEvaluationCard = async (origId: string) => {
    if (!confirm("តើអ្នកប្រាកដថាចង់លុបការវាយតម្លៃនេះទេ?\nAre you sure you want to permanently delete this evaluation report?")) return;
    try {
      await deleteDoc(doc(db, "evaluations", origId));
      showToast("ការវាយតម្លៃត្រូវបានលុប! / Evaluation was permanently erased.", "success");
      setDetailModalOpen(false);
      setSelectedEvalIndex(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `evaluations/${origId}`);
    }
  };

  // Clear all list
  const clearDatabaseEntries = async () => {
    if (!evaluations.length) return;
    if (!confirm("តើអ្នកប្រាកដថាចង់លុបទិន្នន័យទាំងអស់?\nWARNING: Are you absolutely sure you want to permanently empty ALL evaluation rows? This cannot be undone.")) return;
    try {
      for (const item of evaluations) {
        if (item.id) {
          await deleteDoc(doc(db, "evaluations", item.id));
        }
      }
      showToast("Cleared all evaluation tables successfully.", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // --- STATISTICS WRAPER ---
  const statsSummaryValues = useMemo(() => {
    if (!evaluations.length) {
      return { total: 0, avg: 0, top: 0, low: 0 };
    }
    const total = evaluations.length;
    let sum = 0;
    let top = 0;
    let low = 0;
    evaluations.forEach((item) => {
      const s = item.overallScore || 0;
      sum += s;
      if (s > top) top = s;
      if (s < 70) low++;
    });
    return {
      total,
      avg: parseFloat((sum / total).toFixed(1)),
      top: parseFloat(top.toFixed(1)),
      low
    };
  }, [evaluations]);

  // Filtering dashboard items
  const filteredDashboardList = useMemo(() => {
    const q = dashboardSearch.trim().toLowerCase();
    if (!q) return evaluations;
    return evaluations.filter(
      (item) => 
        (item.employeeName || "").toLowerCase().includes(q) ||
        (item.employeeId || "").startsWith(q) ||
        (item.campus || "").toLowerCase().includes(q) ||
        (item.position || "").toLowerCase().includes(q)
    );
  }, [dashboardSearch, evaluations]);

  // Filtering users
  const filteredUserRegistry = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = [SUPER_ADMIN, ...systemUsers];
    if (!q) return list;
    return list.filter(
      (u) => u.id.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [userSearch, systemUsers]);

  const viewDetailByIndex = (index: number) => {
    setSelectedEvalIndex(index);
    setDetailModalOpen(true);
  };

  // --- REUSABLE SECURITY & ADMIN MANAGEMENT CRUD ---
  const triggerOpenAddUser = () => {
    setEditingUserId(null);
    setMUserId("");
    setMUserName("");
    setMPassword("admin@123");
    setMRole("admin");
    setUserModalOpen(true);
  };

  const triggerOpenEditUser = (u: SystemUser) => {
    setEditingUserId(u.id);
    setMUserId(u.id);
    setMUserName(u.name);
    setMPassword(u.password);
    setMRole(u.role);
    setUserModalOpen(true);
  };

  const saveModifiedUser = async () => {
    const uid = mUserId.trim();
    const name = mUserName.trim().toUpperCase();
    const pass = mPassword.trim();
    if (!uid || !name || !pass) {
      showToast("Please fill all properties.", "error");
      return;
    }

    try {
      const updatedUser: SystemUser = {
        id: uid,
        name,
        password: pass,
        role: mRole
      };

      await setDoc(doc(db, "system_users", uid), updatedUser);

      if (editingUserId && editingUserId !== uid) {
        // If ID has been edited, delete old doc key
        await deleteDoc(doc(db, "system_users", editingUserId));
      }

      showToast("User updated and synced successfully across devices!", "success");
      setUserModalOpen(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `system_users/${uid}`);
    }
  };

  const deleteSystemUser = async (uid: string) => {
    if (uid === SUPER_ADMIN.id) {
      showToast("Cannot erase root superadmin.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to delete user registry ${uid}?`)) return;
    try {
      await deleteDoc(doc(db, "system_users", uid));
      showToast("User removed successfully.", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `system_users/${uid}`);
    }
  };

  // --- TELEGRAM BROADCASTER ---
  const generateTelegramMarkup = (e: Evaluation) => {
    const lines = [];
    lines.push("<b>📋 HR Annual Performance Evaluation Alert</b>");
    lines.push("────────────────────────");
    lines.push(`👤 <b>Staff Name:</b> ${e.employeeName}`);
    lines.push(`🆔 <b>ID No:</b> ${e.employeeId}`);
    lines.push(`🏫 <b>Campus Location:</b> ${e.campus}`);
    lines.push(`💼 <b>Position Held:</b> ${e.position}`);
    lines.push(`🎖️ <b>Evaluated By:</b> ${e.appraiser}`);
    lines.push(`📅 <b>Review Date:</b> ${e.reviewDate}`);
    lines.push("");
    lines.push("📝 <b>Category Metrics Breakdowns</b>");
    lines.push("────────────────────────");

    CRITERIA.forEach((crit, idx) => {
      const selfVal = e.criteria?.[idx]?.self || 0;
      const superVal = e.superScores?.[idx]?.super || 0;
      lines.push(`${idx + 1}. ${crit.en}: <b>Self ${selfVal}/10 | Super ${superVal}/10</b>`);
    });

    lines.push("");
    lines.push("────────────────────────");
    lines.push(`📊 <b>Self Total Score:</b> ${e.totalSelf.toFixed(2)}/100`);
    lines.push(`🏢 <b>Supervisor Total:</b> ${e.totalSuper.toFixed(2)}/100`);
    lines.push(`⭐ <b>Final Overall:</b> ${e.overallScore.toFixed(2)}%`);
    lines.push(`🏆 <b>Descriptive Rating:</b> ${getRatingLabel(e.overallScore)}`);
    return lines.join("\n");
  };

  const transmitAuditToTelegram = async (e: Evaluation) => {
    const markupText = generateTelegramMarkup(e);
    try {
      const res = await fetch("https://us-central1-quiet-gift-drtgb.cloudfunctions.net/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: markupText, parse_mode: "HTML" })
      });
      const data = await res.json();
      if (data.ok) {
        showToast("Success: Alert dispatched to security/audits Telegram!", "success");
      } else {
        showToast(`Telegram notification skipped: ${data.description}`, "error");
      }
    } catch (err: any) {
      showToast("Network error dispatching Telegram alert.", "error");
    }
  };

  const transmitBulkSummaryTelegram = async () => {
    if (!evaluations.length) {
      showToast("No records to transmit.", "error");
      return;
    }
    const avgSelf = evaluations.reduce((sum, v) => sum + (v.totalSelf || 0), 0) / evaluations.length;
    const avgSuper = evaluations.reduce((sum, v) => sum + (v.totalSuper || 0), 0) / evaluations.length;
    const avgOverall = evaluations.reduce((sum, v) => sum + (v.overallScore || 0), 0) / evaluations.length;

    const markup = `<b>📂 HR Bulk Evaluations Summary Report</b>
────────────────────────
<b>Total Evaluated Staff:</b> ${evaluations.length}
<b>Triggered On:</b> ${new Date().toLocaleString()}

<b>📈 System Broad Aggregates:</b>
• Average Self Score: <b>${avgSelf.toFixed(2)}</b>
• Average Supervisor: <b>${avgSuper.toFixed(2)}</b>
• Standard Overall Yield: <b>${avgOverall.toFixed(2)}%</b>

<i>Authorized appraisal feed dispatch.</i>`;

    try {
      const res = await fetch("https://us-central1-quiet-gift-drtgb.cloudfunctions.net/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: markup, parse_mode: "HTML" })
      });
      const d = await res.json();
      if (d.ok) {
        showToast("Telegram bulk statistics broadcasted!", "success");
      } else {
        showToast(`Broadcasting skipped: ${d.description}`, "error");
      }
    } catch {
      showToast("Network failure transmitting bulk alert.", "error");
    }
  };

  // --- DATA EXPORTS (CSV, EXCEL, AND FORMATTED HTML PDF) ---
  const getRatingLabel = (score: number) => {
    if (score >= 95) return "Outstanding";
    if (score >= 90) return "Good";
    if (score >= 70) return "Meets Expectations";
    if (score >= 60) return "Below Expectations";
    return "Does Not Meet";
  };

  const getRatingBadgeClass = (score: number) => {
    if (score >= 95) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/25";
    if (score >= 90) return "bg-sky-500/10 text-sky-500 border-sky-500/25";
    if (score >= 70) return "bg-amber-500/10 text-amber-500 border-amber-500/25";
    return "bg-rose-500/10 text-rose-500 border-rose-500/25";
  };

  // 1. Bulk EXCEL Export (Uses XLSX SheetJS loaded via index CDN)
  const exportAllToExcel = () => {
    if (!evaluations.length) {
      showToast("No logs to package.", "error");
      return;
    }
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      showToast("SheetJS workbook engine was skipped. Try again shortly.", "error");
      return;
    }

    // Build headers
    const rowHeaders = [
      "ID", "Employee Name", "Campus", "Position", "Gender", "Hired Date", "Evaluator", "Evaluation Date"
    ];
    CRITERIA.forEach((crit) => {
      rowHeaders.push(`C${crit.id} Self`);
      rowHeaders.push(`C${crit.id} Supervisor`);
    });
    rowHeaders.push("Total Self", "Total Supervisor", "Overall Score %", "Qualitative Rating");

    // Build rows
    const sheetData = [rowHeaders];
    evaluations.forEach((e) => {
      const dataRow = [
        e.employeeId,
        e.employeeName,
        e.campus,
        e.position,
        e.gender,
        e.hiredDate,
        e.appraiser,
        e.reviewDate
      ];
      CRITERIA.forEach((crit, index) => {
        dataRow.push(e.criteria?.[index]?.self ?? 0);
        dataRow.push(e.superScores?.[index]?.super ?? 0);
      });
      dataRow.push(
        e.totalSelf,
        e.totalSuper,
        e.overallScore,
        getRatingLabel(e.overallScore)
      );
      sheetData.push(dataRow);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Summary");
    
    // Download workbook
    XLSX.writeFile(workbook, `HR_Performance_Evaluations_${Date.now()}.xlsx`);
    showToast("Dispatched excel spreadsheet download successfully!", "success");
  };

  // 2. Single Excel Row Export for Selected item
  const exportSingleToExcel = (e: Evaluation) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;

    const rowHeaders = [
      "Parameter", "Evaluated Value"
    ];
    const sheetRows = [
      rowHeaders,
      ["ID", e.employeeId],
      ["Employee Name", e.employeeName],
      ["Campus", e.campus],
      ["Position", e.position],
      ["Hired Date", e.hiredDate],
      ["Appraiser Name", e.appraiser],
      ["Review Date", e.reviewDate]
    ];
    CRITERIA.forEach((crit, index) => {
      sheetRows.push([`C${crit.id} (${crit.en}) Self`, String(e.criteria?.[index]?.self ?? 0)]);
      sheetRows.push([`C${crit.id} (${crit.en}) Supervisor`, String(e.superScores?.[index]?.super ?? 0)]);
    });
    sheetRows.push(["Total Calculated Self", String(e.totalSelf)]);
    sheetRows.push(["Total Calculated Supervisor", String(e.totalSuper)]);
    sheetRows.push(["Final Unified Overall Score", `${e.overallScore}%`]);
    sheetRows.push(["Performance Tier Label", getRatingLabel(e.overallScore)]);

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Evaluation Details");
    XLSX.writeFile(wb, `Evaluation_Card_${e.employeeId}_${Date.now()}.xlsx`);
    showToast("Single evaluation sheet dispatched!", "success");
  };

  // 3. Bulk CSV Export
  const exportAllToCSV = () => {
    if (!evaluations.length) {
      showToast("No data rows to compile.", "error");
      return;
    }
    const rows = [];
    const headers = ["EmployeeID", "EmployeeName", "Campus", "Position", "OverallScore", "ReviewDate", "Evaluator"];
    rows.push(headers.join(","));

    evaluations.forEach((item) => {
      const row = [
        `"${item.employeeId}"`,
        `"${item.employeeName}"`,
        `"${item.campus}"`,
        `"${item.position}"`,
        item.overallScore,
        `"${item.reviewDate}"`,
        `"${item.appraiser}"`
      ];
      rows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HR_Evaluations_Dataset_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Dispatched CSV spreadsheet successfully!", "success");
  };

  // 4. Formatted, Elegant PDF Report generator
  // 4. Formatted, Elegant PDF Report generator
  const exportDetailedPDF = (e: Evaluation) => {
    showToast("Compiling performance booklet vector image graphics...", "success");

    const html2canvas = (window as any).html2canvas;
    const { jsPDF } = (window as any).jspdf || {};

    if (!html2canvas || !jsPDF) {
      showToast("PDF Canvas printing utilities skipped. Try again.", "error");
      return;
    }

    // Build absolute standalone compiled print template
    let critRows = "";
    CRITERIA.forEach((c, idx) => {
      const selfVal = e.criteria?.[idx]?.self || 0;
      const superVal = e.superScores?.[idx]?.super || 0;
      const progressWidth = (superVal / 10) * 100;
      const barColor = progressWidth >= 90 ? "#10b981" : progressWidth >= 70 ? "#3b82f6" : "#f59e0b";
      const bgStyle = idx % 2 === 0 ? "background-color: #fafbfc;" : "background-color: #ffffff;";

      critRows += `
        <tr style="${bgStyle} transition: all 0.2s;">
          <td style="padding: 12px 14px; text-align: center; border-bottom: 1.5px solid #f1f5f9; font-family: monospace; font-weight: 800; color: #64748b;">${c.id}</td>
          <td style="padding: 12px 14px; border-bottom: 1.5px solid #f1f5f9;">
            <div style="font-weight: 800; color: #0f172a; font-size: 11.5px; font-family: 'Noto Sans Khmer', sans-serif;">${c.kh}</div>
            <div style="font-size: 9px; color: #64748b; font-weight: 600; margin-top: 1px; font-family: Inter, sans-serif;">${c.en}</div>
          </td>
          <td style="padding: 12px 14px; text-align: center; border-bottom: 1.5px solid #f1f5f9; font-family: monospace; font-weight: 700; color: #64748b;">10</td>
          <td style="padding: 12px 14px; text-align: center; border-bottom: 1.5px solid #f1f5f9; font-family: monospace; font-weight: 850; color: #4f46e5;">${selfVal}</td>
          <td style="padding: 12px 14px; border-bottom: 1.5px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
              <div style="flex: 1; min-width: 45px; height: 5px; background-color: #e2e8f0; border-radius: 3px; overflow: hidden; display: inline-block;">
                <div style="width: ${progressWidth}%; height: 100%; background-color: ${barColor}; border-radius: 3px;"></div>
              </div>
              <span style="font-family: monospace; font-weight: 900; color: #0f172a; font-size: 11.5px; min-width: 15px; text-align: right;">${superVal}</span>
            </div>
          </td>
        </tr>
      `;
    });

    const isFail = e.overallScore < 70;
    const scoreColor = isFail ? "#ef4444" : "#0284c7";

    const printedHTMLContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&family=Inter:wght@400;500;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; font-family: 'Inter', 'Noto Sans Khmer', sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased; }
          .page-frame { width: 210mm; min-height: 297mm; background-color: #ffffff; padding: 42px; box-sizing: border-box; position: relative; margin: 0 auto; border-top: 10px solid #1e293b; }
          
          /* Premium Top Accent Badge */
          .official-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; }
          .official-tag { font-size: 8.5px; font-weight: 900; tracking-wide: 1px; text-transform: uppercase; color: #475569; background-color: #f1f5f9; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
          .system-id { font-size: 8.5px; font-weight: 700; font-family: monospace; color: #94a3b8; }
          
          /* Header design */
          .header-wrapper { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; color: #ffffff; margin-bottom: 28px; position: relative; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); }
          .header-wrapper::before { content: ''; position: absolute; right: -40px; top: -40px; width: 160px; height: 160px; background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%); }
          .title-area h1 { font-size: 26px; font-weight: 900; margin: 0; font-family: Inter, sans-serif; letter-spacing: -0.75px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .title-area p { font-size: 11px; font-weight: 700; color: #38bdf8; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1px; }
          
          .score-badge-card { background: rgba(255, 255, 255, 0.08); border: 1.5px solid rgba(255, 255, 255, 0.16); padding: 14px 22px; border-radius: 16px; text-align: right; backdrop-filter: blur(8px); }
          .score-badge-card .num { font-size: 32px; font-weight: 955; color: #ffffff; font-family: Inter, sans-serif; line-height: 1; }
          .score-badge-card .lbl { font-size: 8px; font-weight: 800; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }
          
          /* Demographics Grid */
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 30px; }
          .info-block { background-color: #fafbfc; border: 1.5px solid #f1f5f9; padding: 14px 18px; border-radius: 14px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
          .info-block .symbol { width: 36px; height: 36px; background-color: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; color: #16a34a; border: 1px solid #dcfce7; }
          .info-block.secondary .symbol { background-color: #f0f9ff; color: #0284c7; border: 1px solid #e0f2fe; }
          .info-block .lbl { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; }
          .info-block .val { font-size: 13.5px; font-weight: 850; color: #0f172a; }

          /* Table custom */
          .section-title { font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 12px; border-left: 4px solid #0284c7; padding-left: 10px; }
          .crit-table { width: 100%; border-collapse: collapse; overflow: hidden; margin-bottom: 26px; border: 1px solid #e2e8f0; border-radius: 12px; }
          .crit-table thead th { background-color: #0f172a; color: #ffffff; font-size: 9.5px; font-weight: 850; text-transform: uppercase; letter-spacing: 0.8px; padding: 14px 12px; text-align: center; }
          .crit-table thead th:nth-child(2) { text-align: left; }
          .crit-table tbody td { padding: 12px 14px; border-bottom: 1.5px solid #f1f5f9; vertical-align: middle; }
          .crit-table tbody tr:last-child td { border-bottom: none; }
          .crit-table tbody tr:nth-child(even) { background-color: #fafbfb; }
          
          .p-num { font-size: 11px; font-weight: 800; color: #64748b; font-family: monospace; }
          .kh-title { font-size: 11.5px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
          .en-desc { font-size: 9px; font-weight: 600; color: #64748b; margin: 0; }
          .score-text { font-size: 11.5px; font-weight: 800; color: #0f172a; font-family: monospace; }
          
          /* Progress Feedback indicator in PDF */
          .pdf-bar-wrap { display: flex; align-items: center; gap: 8px; justify-content: center; }
          .pdf-bar { width: 45px; h: 4.5px; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: inline-block; }
          .pdf-bar-fill { height: 100%; border-radius: 4px; }

          /* Summary card block */
          .summary-card-row { display: flex; gap: 14px; margin-bottom: 35px; }
          .summary-card-row .crd { flex: 1; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 14px 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); }
          .summary-card-row .crd .lbl { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
          .summary-card-row .crd .val { font-size: 22px; font-weight: 900; color: #0f172a; font-family: Inter, sans-serif; }
          .summary-card-row .crd.highlighted { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-color: #0f172a; }
          .summary-card-row .crd.highlighted .lbl { color: rgba(255,255,255,0.7); }
          .summary-card-row .crd.highlighted .val { color: #38bdf8; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }

          /* Real Certification Seal Watermark stamp */
          .cert-stamp { position: absolute; right: 45px; bottom: 135px; width: 115px; height: 115px; border: 3px double ${scoreColor}; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(-7deg); opacity: 0.85; pointer-events: none; padding: 4px; box-sizing: border-box; background-color: rgba(255,255,255,0.9); }
          .cert-stamp-inner { width: 100%; height: 100%; border: 1px solid ${scoreColor}; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .cert-stamp .head { font-size: 7.5px; font-weight: 900; color: ${scoreColor}; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px; }
          .cert-stamp .grade { font-size: 13px; font-weight: 900; color: ${scoreColor}; text-transform: uppercase; margin: 1px 0; }
          .cert-stamp .foot { font-size: 6.5px; font-weight: 700; color: ${scoreColor}; text-transform: uppercase; letter-spacing: 0.5px; }

          /* Hands Signatures */
          .sig-container { display: flex; justify-content: space-between; margin-top: 45px; margin-bottom: 15px; }
          .sig-box { width: 44%; text-align: center; }
          .sig-line { border-bottom: 1.5px dashed #cbd5e1; height: 42px; margin-bottom: 10px; }
          .sig-title { font-size: 10.5px; font-weight: 855; color: #0f172a; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 2px; }
          .sig-subtitle { font-size: 8.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }

          /* Footer design */
          .report-footer { border-top: 1.5px solid #f1f5f9; padding-top: 14px; display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; }
        </style>
      </head>
      <body>
        <div class="page-frame">
          <div class="official-bar">
            <span class="official-tag">OFFICIAL RECOGNITION REPORT</span>
            <span class="system-id">PAS-ID: EVAL-${e.employeeId}-${new Date(e.reviewDate).getFullYear() || "2026"}</span>
          </div>

          <div class="header-wrapper">
            <div class="title-area">
              <h1>Annual appraisal</h1>
              <p>Staff performance rating</p>
            </div>
            <div class="score-badge-card">
              <div class="num" style="color: ${scoreColor};">${e.overallScore.toFixed(1)}%</div>
              <div class="lbl">Unified Performance Index</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="info-block">
              <div class="symbol">👤</div>
              <div>
                <div class="lbl">Staff Full Name</div>
                <div class="val">${e.employeeName}</div>
              </div>
            </div>
            <div class="info-block">
              <div class="symbol" style="background-color: #f0f9ff; color: #0284c7; border: 1px solid #e0f2fe;">🪪</div>
              <div>
                <div class="lbl">Staff Index ID</div>
                <div class="val" style="font-family: monospace; font-weight: bold; color: #0284c7;">${e.employeeId}</div>
              </div>
            </div>
            <div class="info-block secondary">
              <div class="symbol">🏫</div>
              <div>
                <div class="lbl">Campus Branch</div>
                <div class="val">${e.campus}</div>
              </div>
            </div>
            <div class="info-block secondary">
              <div class="symbol">💼</div>
              <div>
                <div class="lbl">Registered Position</div>
                <div class="val">${e.position}</div>
              </div>
            </div>
            <div class="info-block secondary">
              <div class="symbol">🎖️</div>
              <div>
                <div class="lbl">Lead Evaluator</div>
                <div class="val">${e.appraiser}</div>
              </div>
            </div>
            <div class="info-block secondary">
              <div class="symbol">📅</div>
              <div>
                <div class="lbl">Review Close Date</div>
                <div class="val">${e.reviewDate}</div>
              </div>
            </div>
          </div>

          <h3 class="section-title">Core Capability evaluation Breakdown</h3>
          
          <table class="crit-table">
            <thead>
              <tr>
                <th style="width: 8%;">ID</th>
                <th style="width: 44%; text-align: left;">Characteristics / Capability Objectives</th>
                <th style="width: 10%;">Weight</th>
                <th style="width: 16%;">Self Eval</th>
                <th style="width: 22%;">Supervisor Appr</th>
              </tr>
            </thead>
            <tbody>
              ${critRows}
            </tbody>
          </table>

          <div class="summary-card-row">
            <div class="crd">
              <div class="lbl">Aspirant Self-Score</div>
              <div class="val">${e.totalSelf.toFixed(1)} <span style="font-size:11px;color:#94a3b8;font-weight:bold;">/ 100</span></div>
            </div>
            <div class="crd">
              <div class="lbl">Supervisor Aggregate</div>
              <div class="val">${e.totalSuper.toFixed(1)} <span style="font-size:11px;color:#94a3b8;font-weight:bold;">/ 100</span></div>
            </div>
            <div class="crd highlighted">
              <div class="lbl">Consolidated Grade</div>
              <div class="val">${getRatingLabel(e.overallScore)}</div>
            </div>
          </div>

          <!-- Dynamic Certified Stamp Watermark -->
          <div class="cert-stamp">
            <div class="cert-stamp-inner">
              <span class="head">EVALUATION DEPT</span>
              <span class="grade" style="font-weight: 950;">${getRatingLabel(e.overallScore)}</span>
              <span class="foot">VERIFIED SECURE</span>
            </div>
          </div>

          <!-- Hand Signatures Container for Executive Sign-off -->
          <div class="sig-container">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Evaluator Appraiser</div>
              <div class="sig-subtitle">Signature &amp; Date stamp</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-title">Appraisee Personnel</div>
              <div class="sig-subtitle">Confirmed acknowledgment signature</div>
            </div>
          </div>

          <div class="report-footer">
            <span>Official digital report: Issued ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span>Annual Performance Management System (Live Cloud Database)</span>
          </div>
        </div>
      </body>
      </html>
    `;

    // Dynamically insert iframe for background rendering
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position: fixed; top: -10000px; left: -10000px; width: 794px; height: 1123px; border: none; background: #ffffff;";
    document.body.appendChild(iframe);

    // Write content
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(printedHTMLContent);
    iframe.contentDocument!.close();

    // Trigger vector canvas capture after resources hold
    setTimeout(() => {
      const pageToRender = iframe.contentDocument!.body.querySelector(".page-frame");
      html2canvas(pageToRender || iframe.contentDocument!.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.96);
        const docPDF = new jsPDF("p", "mm", "a4");
        
        // standard A4 dimensions
        const pageW = 210;
        const pageH = 297;
        const imgH = (pageW * canvas.height) / canvas.width;

        docPDF.addImage(imgData, "JPEG", 0, 0, pageW, Math.min(imgH, pageH));
        docPDF.save(`Appraisal_Report_${String(e.employeeName).replace(/\s+/g, "_")}_${Date.now()}.pdf`);
        document.body.removeChild(iframe);
        showToast("PDF report generated successfully!", "success");
      }).catch((err: any) => {
        console.error(err);
        document.body.removeChild(iframe);
        showToast("PDF Canvas printing failed.", "error");
      });
    }, 1500);
  };

  const selectedEvaluationObj = selectedEvalIndex !== null ? filteredDashboardList[selectedEvalIndex] : null;

  return (
    <div className={`relative min-h-screen transition-colors duration-300 font-sans select-none antialiased overflow-x-hidden ${
      isDarkMode ? "bg-[#08091a] text-slate-100" : "bg-[#f1f5f9] text-slate-900 day-mode"
    }`}>
      {/* Animated canvas star cluster */}
      <canvas ref={canvasRef} id="starCanvas" className="fixed inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: isDarkMode ? 1 : 0.6 }} />

      {/* FIXED NEON BACKGROUND LINE ORNAMENTATIONS */}
      <div className="fixed top-[10%] left-[25%] w-[1px] h-[300px] bg-gradient-to-b from-transparent via-sky-500/20 to-transparent pointer-events-none blur-[1px] z-0" />
      <div className="fixed bottom-[15%] right-[10%] w-[250px] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent pointer-events-none blur-[1px] z-0" />

      {/* TOAST NOTIFIER */}
      {toast && (
        <div 
          className={`fixed bottom-8 right-8 z-[9000] flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-[13.5px] shadow-2xl transition-all duration-300 animate-bounce ${
            toast.type === "success" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 backdrop-blur-xl" 
              : "bg-rose-500/10 text-rose-400 border border-rose-500/30 backdrop-blur-xl"
          }`}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-400" : "bg-rose-400"}`} />
          {toast.message}
        </div>
      )}

      {/* ===================== LOGIN LAYOUT ===================== */}
      {!user ? (
        <div className={`relative flex items-center justify-center min-h-screen w-full transition-all duration-1000 ${
          isDarkMode ? "bg-[#08091a]" : "bg-[#f1f5f9]"
        }`}>
          <div className={`relative w-full max-w-md p-10 border rounded-3xl overflow-hidden z-10 transition-transform hover:scale-[1.01] duration-500 ${
            isDarkMode 
              ? "bg-[#0E1236]/80 border-slate-700/45 shadow-[0_12px_45px_rgba(0,0,0,0.45)] backdrop-blur-2xl" 
              : "bg-white border-slate-200 shadow-lg"
          }`}>
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400" />
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md shadow-sky-500/15 mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Annual Performance</h2>
              <p className={`text-xs font-semibold mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Personnel Management System Dashboard</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`block text-[10px] font-extrabold tracking-wider uppercase mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>User ID</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={loginUserId}
                    onChange={(e) => setLoginUserId(e.target.value)}
                    placeholder="Enter your administrative ID"
                    onKeyDown={(e) => e.key === "Enter" && doLogin()}
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl text-sm font-bold placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all duration-300 ${
                      isDarkMode 
                        ? "bg-slate-900/40 border-slate-700/60 text-white focus:bg-slate-900/80" 
                        : "bg-white border-slate-200 text-slate-900 focus:bg-slate-50"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-extrabold tracking-wider uppercase mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Entry Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter auth code key"
                    onKeyDown={(e) => e.key === "Enter" && doLogin()}
                    className={`w-full pl-12 pr-12 py-4 border rounded-xl text-sm font-bold placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all duration-300 ${
                      isDarkMode 
                        ? "bg-slate-900/40 border-slate-700/60 text-white focus:bg-slate-900/80" 
                        : "bg-white border-slate-200 text-slate-900 focus:bg-slate-50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button 
                  onClick={() => alert("Please consult database administrator for access registry recovery.")}
                  className={`text-[11px] font-bold transition-colors ${isDarkMode ? "text-slate-400 hover:text-sky-400" : "text-slate-500 hover:text-sky-600"}`}
                >
                  Retrieve login codes?
                </button>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                disabled={loginLoading}
                onClick={doLogin}
                className={`relative w-full py-4 font-black rounded-xl tracking-wider text-sm pointer-events-auto cursor-pointer transition-all hover:-translate-y-[2px] active:translate-y-0 duration-300 group ${
                  isDarkMode 
                    ? "bg-white hover:bg-slate-100 disabled:bg-slate-300 text-[#0c0d24] shadow-lg shadow-white/10" 
                    : "bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white shadow-lg shadow-sky-600/20"
                }`}
              >
                {loginLoading ? (
                  <div className={`w-5 h-5 border-2 rounded-full animate-spin mx-auto ${isDarkMode ? "border-slate-900/20 border-t-slate-950" : "border-white/30 border-t-white"}`} />
                ) : (
                  "LOGIN"
                )}
              </button>
            </div>

            <div className={`mt-8 pt-6 border-t text-center text-[10px] font-semibold tracking-wide uppercase ${
              isDarkMode ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
            }`}>
              &copy; 2026 Admin Portal &bull; Secure Encrypted Session
            </div>
          </div>
        </div>
      ) : (
        /* ===================== SEAMLESS WORKSPACE ===================== */
        <div className="relative min-h-screen flex z-10 w-full">
          
          {/* OFFCANVAS OVERLAY ON MOBILE WIDTHS */}
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
            />
          )}

          {/* LEFT SIDEBAR CONTROLLERS */}
          <sidebar className={`fixed lg:sticky top-0 left-0 bottom-0 w-80 p-7 flex flex-col justify-between z-50 lg:z-30 transition-all duration-300 lg:translate-x-0 ${
            isDarkMode 
              ? "bg-[#0a0b22] border-r border-slate-800/60 text-slate-100" 
              : "bg-white border-r border-slate-200 text-slate-900 shadow-xl"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="space-y-10">
              
              {/* Header logo banner */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-1.5xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/15">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-white tracking-wide uppercase leading-tight">HR Appraisal</h1>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Management Portal</span>
                </div>
              </div>

              {/* Navigation lists */}
              <div className="space-y-2">
                <button
                  onClick={() => { setActiveTab("form"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-extrabold uppercase transition-all duration-300 hover:translate-x-1 ${
                    activeTab === "form" 
                      ? "bg-slate-800/60 text-white border border-slate-700/60 shadow-inner" 
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <FileCheck className="w-5 h-5 flex-shrink-0 text-sky-400" />
                  <span>New Evaluation</span>
                </button>

                <button
                  onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-extrabold uppercase transition-all duration-300 hover:translate-x-1 ${
                    activeTab === "dashboard" 
                      ? "bg-slate-800/60 text-white border border-slate-700/60 shadow-inner" 
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Layers className="w-5 h-5 flex-shrink-0 text-indigo-400" />
                  <span>Dashboard Reports</span>
                </button>

                {user.role === "superadmin" && (
                  <button
                    onClick={() => { setActiveTab("manageusers"); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-extrabold uppercase transition-all duration-300 hover:translate-x-1 ${
                      activeTab === "manageusers" 
                        ? "bg-slate-800/60 text-white border border-slate-700/60 shadow-inner" 
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                    <span>Manage Admins</span>
                  </button>
                )}
              </div>
            </div>

            {/* User Session Footer */}
            <div className="pt-6 border-t border-slate-800/60 space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-slate-900/65 border-slate-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 font-bold text-center text-white text-sm flex items-center justify-center leading-none">
                  {user.name.split(" ").slice(0, 2).map((x) => x[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white truncate">{user.name}</h4>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{user.role}</span>
                </div>
              </div>

              <button
                onClick={doLogout}
                className="w-full py-4 border border-rose-500/10 hover:border-rose-500/35 hover:bg-rose-500/5 text-rose-450 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Session</span>
              </button>
            </div>
          </sidebar>

          {/* MAIN PAGE AREA */}
          <main className="flex-1 min-w-0 p-5 mt-16 lg:mt-0 md:p-10 flex flex-col justify-start">
            
            {/* Header top row bar */}
            <header className={`flex items-center gap-4 p-5 md:p-8 rounded-2xl mb-10 shadow-lg justify-between flex-wrap transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#090b23]/90 border border-slate-800/50 text-white" 
                : "bg-white border border-slate-200 text-slate-900 shadow-sm"
            }`}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className={`p-2 rounded-lg lg:hidden block ${isDarkMode ? "bg-slate-800/40 text-slate-200" : "bg-slate-100 text-slate-700"}`}
                >
                  &#9776;
                </button>
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-500 to-indigo-500 items-center justify-center text-white">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h1 className={`text-base md:text-lg font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Performance Appraisal System</h1>
                  <p className="text-[10px] tracking-wide text-slate-400 font-bold uppercase mt-px">Staff Academic and Operations Multi-Device Tracker</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="theme-toggler-btn"
                  onClick={() => {
                    const nextMode = !isDarkMode;
                    setIsDarkMode(nextMode);
                    localStorage.setItem("isDarkMode", nextMode ? "true" : "false");
                    showToast(`Switched to ${nextMode ? "Premium Night" : "Executive Day"} mode!`, "success");
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-850" 
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
                  }`}
                  title="Toggle Theme Mode"
                >
                  {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </button>

                <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <span className="text-[11px] font-black text-indigo-300 tracking-wider">REAL-TIME DATA LINK FORMED</span>
                </div>
              </div>
            </header>

            {/* ===================== TAB 1: NEW EVALUATION FORM ===================== */}
            {activeTab === "form" && (
              <div className="space-y-6 animate-fade-in duration-500 module-form">
                
                {/* 1. Demographics Grid Card */}
                <div className="p-7 md:p-10 bg-slate-900/40 border border-slate-800/60 rounded-3xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-8 flex-wrap gap-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-3">
                      <span className="text-sky-400">&#128100;</span>
                      ព័ត៌មានបុគ្គលិក / Appraisee Information
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Forms Link Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ID Auto search */}
                    <div className="flex flex-col relative" ref={dropdownRef}>
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">លេខសម្គាល់បុគ្គលិក / Search Staff ID</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          <Search className="w-5 h-5" />
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearchQuery(val);
                            setAutocompleteOpen(true);
                            if (val && employees.length > 50) {
                              const exact = employees.find(emp => emp.id === val);
                              if (exact) {
                                selectEmployeeHandler(exact);
                              }
                            }
                          }}
                          onFocus={() => setAutocompleteOpen(true)}
                          placeholder="Type Employee ID or Name to list matching..."
                          className="w-full pl-12 pr-4 py-4 bg-slate-950/45 border border-slate-800 rounded-xl text-sm text-white font-bold placeholder-slate-600 focus:outline-none focus:border-indigo-600 focus:bg-slate-950/90 transition-all"
                        />
                      </div>

                      {/* Suggestions portal dropdown */}
                      {autocompleteOpen && filteredEmployeesMatch.length > 0 && (
                        <div className="absolute top-[102%] left-0 right-0 z-50 bg-[#0E1236] border border-slate-700/60 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar py-2 animate-fade-in mt-1">
                          {filteredEmployeesMatch.slice(0, 10).map((emp) => (
                            <div
                              key={emp.id}
                              onClick={() => selectEmployeeHandler(emp)}
                              className="px-5 py-3.5 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between border-b border-slate-800/40 last:border-0"
                            >
                              <div>
                                <span className="font-extrabold text-sm text-sky-400">{emp.id}</span>
                                <span className="font-bold text-sm text-white ml-2">{emp.name}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-1 rounded">
                                {emp.campus} &bull; {emp.position.split(" ")[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">ឈ្មោះបុគ្គលិក / Employee Name</label>
                      <input
                        type="text"
                        value={empName}
                        readOnly
                        placeholder="Automatically populated upon selection"
                        className="w-full px-5 py-4 bg-slate-950/20 border border-slate-900 rounded-xl text-sm text-slate-400 font-bold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">តួនាទី / Position Held</label>
                      <input
                        type="text"
                        value={position}
                        readOnly
                        className="w-full px-5 py-4 bg-slate-950/20 border border-slate-900 rounded-xl text-sm text-slate-400 font-bold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">សាខា / Campus Branch</label>
                      <input
                        type="text"
                        value={campus}
                        readOnly
                        className="w-full px-5 py-4 bg-slate-950/20 border border-slate-900 rounded-xl text-sm text-slate-400 font-bold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">ភេទ / Gender</label>
                      <input
                        type="text"
                        value={gender}
                        readOnly
                        className="w-full px-5 py-4 bg-slate-950/20 border border-slate-900 rounded-xl text-sm text-slate-400 font-bold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">ថ្ងៃចូលបម្រើការងារ / Hire Date</label>
                      <input
                        type="text"
                        value={hiredDate}
                        readOnly
                        className="w-full px-5 py-4 bg-slate-950/20 border border-slate-900 rounded-xl text-sm text-slate-400 font-bold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">អ្នកវាយតម្លៃ / Appraiser</label>
                      <input
                        type="text"
                        value={appraiser}
                        onChange={(e) => setAppraiser(e.target.value)}
                        placeholder="Enter evaluator fullname"
                        className="w-full px-5 py-4 bg-slate-950/45 border border-slate-800 rounded-xl text-sm text-white font-bold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10.5px] font-black tracking-wider text-slate-300 uppercase mb-2">កាលបរិច្ឆេទត្រួតពិនិត្យ / Review Date</label>
                      <input
                        type="date"
                        value={reviewDate}
                        onChange={(e) => setReviewDate(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-950/45 border border-slate-800 rounded-xl text-sm text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Rating Scale Helper Card */}
                <div className="p-7 md:p-10 bg-slate-900/40 border border-slate-800/60 rounded-3xl backdrop-blur-md">
                  <h3 className="text-base font-bold text-white flex items-center gap-3 border-b border-slate-800 pb-5 mb-8">
                    <span className="text-sky-400">&#128202;</span>
                    តារាងវាយតម្លៃ / Descriptive Scale Reference
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-0.5">ល្អណាស់ / Outstanding</span>
                        <h4 className="text-sm font-black text-[#10b981]">95 - 100 %</h4>
                      </div>
                    </div>
                    <div className="p-4 bg-sky-500/5 border-l-4 border-sky-400 rounded-r-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-0.5">ល្អ / Good Performance</span>
                        <h4 className="text-sm font-black text-sky-400">90 - 94 %</h4>
                      </div>
                    </div>
                    <div className="p-4 bg-indigo-500/5 border-l-4 border-indigo-400 rounded-r-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-0.5">តាមការរំពឹងទុក / Meets Target</span>
                        <h4 className="text-sm font-black text-indigo-400">70 - 89 %</h4>
                      </div>
                    </div>
                    <div className="p-4 bg-amber-500/5 border-l-4 border-amber-400 rounded-r-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-0.5">ក្រោមការរំពឹងទុក / Marginal</span>
                        <h4 className="text-sm font-black text-amber-400">60 - 69 %</h4>
                      </div>
                    </div>
                    <div className="p-4 bg-rose-500/5 border-l-4 border-rose-500 rounded-r-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-0.5">មិនទាន់វាយតម្លៃបាន / Unsatisfactory</span>
                        <h4 className="text-sm font-black text-rose-500">&lt; 59 %</h4>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-700/5 border-l-4 border-slate-500 rounded-r-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-0.5">មិនអាចអនុវត្តបាន / Not Applicable</span>
                        <h4 className="text-sm font-black text-slate-400">0 %</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Main Metrics Input Questionnaire */}
                <div className="p-7 md:p-10 bg-slate-900/40 border border-slate-800/60 rounded-3xl backdrop-blur-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 mb-8 gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-3">
                        <span className="text-sky-400">&#128221;</span>
                        ការវាយតម្លៃជំនាញវិជ្ជាជីវៈ និងការគ្រប់គ្រង
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Professional Skills and Management Competencies (100% Weighted)</p>
                    </div>

                    {/* Google Sheets Link Indicator and Button */}
                    <div className="flex items-center gap-3.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-right">
                        <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">External Link Status</span>
                        <p className="text-[10px] font-bold text-slate-300 mt-0.5">{sheetStatus}</p>
                      </div>
                      <button
                        disabled={refreshingSheetStates}
                        onClick={refreshSheetData}
                        className="p-2.5 bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 active:scale-95 disabled:opacity-40 transition-all rounded-lg border border-sky-500/20 flex items-center gap-2"
                        title="Reload Google spreadsheets data immediately"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingSheetStates ? "animate-spin" : ""}`} />
                        <span className="text-[10px] font-black uppercase">Refresh G-Sheet</span>
                      </button>
                    </div>
                  </div>

                  {/* Criteria List */}
                  <div className="space-y-1.5">
                    {/* Headers */}
                    <div className="grid grid-cols-[36px_1fr_60px_100px_100px] gap-4 p-4 bg-indigo-500/5 text-indigo-300 rounded-xl font-extrabold text-[11px] uppercase tracking-wider text-center items-center">
                      <span>N</span>
                      <span className="text-left">លក្ខណៈ / Competency Parameters</span>
                      <span>Max</span>
                      <span>Self score</span>
                      <span>Supervisor</span>
                    </div>

                    {/* Content Rows */}
                    {CRITERIA.map((crit) => {
                      const selfVal = selfScores[crit.id];
                      const isPreFilledSelf = typeof selfVal === "number" && selfVal > 0;

                      return (
                        <div
                          key={crit.id}
                          className="grid grid-cols-[36px_1fr_60px_100px_100px] gap-4 p-4 border-b border-slate-800/40 text-center items-center hover:bg-slate-800/10 transition-colors"
                        >
                          <span className="font-extrabold text-slate-500 font-mono text-base">{crit.id}</span>
                          <div className="text-left">
                            <h4 className="text-sm font-bold text-white font-sans">{crit.kh}</h4>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                              <b>{crit.khDesc}</b>
                            </span>
                            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
                              <b>{crit.en} &mdash; {crit.desc}</b>
                            </span>
                          </div>
                          <span className="font-bold text-slate-400 font-mono text-sm">10</span>
                          
                          {/* Self input (optionally locked from sheet, prefilled) */}
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={selfScores[crit.id] !== undefined ? selfScores[crit.id] : ""}
                            disabled={isPreFilledSelf}
                            onChange={(e) => {
                              const val = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                              setSelfScores({ ...selfScores, [crit.id]: val });
                            }}
                            className={`px-3 py-2.5 rounded-lg border text-sm font-bold text-center bg-slate-950/40 outline-none transition-all ${
                              isPreFilledSelf 
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" 
                                : "border-slate-800 focus:border-indigo-600 text-white"
                            }`}
                          />

                          {/* Supervisor score input */}
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="0.5"
                            value={superScores[crit.id] !== undefined ? superScores[crit.id] : ""}
                            onChange={(e) => {
                              const val = Math.min(10, Math.max(1, parseFloat(e.target.value) || 0));
                              setSuperScores({ ...superScores, [crit.id]: val });
                            }}
                            className="px-3 py-2.5 bg-slate-950/45 border border-slate-800 focus:border-indigo-600 rounded-lg text-sm text-white text-center font-bold outline-none transition-all"
                          />
                        </div>
                      );
                    })}

                    {/* Totals aggregate summary row */}
                    <div className="grid grid-cols-[1fr_60px_100px_100px] gap-4 p-6 bg-gradient-to-r from-sky-500/5 to-indigo-500/5 text-white rounded-2xl font-extrabold mt-6 border border-slate-800 text-center items-center">
                      <span className="text-left text-sm text-slate-300">សរុប / Unified Evaluated Aggregates</span>
                      <span className="font-mono text-slate-400 text-sm">100</span>
                      <span className="font-mono text-indigo-300 text-base">{totalSelfSum.toFixed(2)}</span>
                      <span className="font-mono text-sky-400 text-lg">{totalSuperSum.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Form actions triggers */}
                <div className="pt-4 flex items-center justify-end gap-4 flex-wrap">
                  <button 
                    onClick={() => {
                      if(confirm("Confirm clearing all entered evaluation attributes?")) {
                        setEmpId("");
                        setEmpName("");
                        setPosition("");
                        setCampus("");
                        setGender("");
                        setHiredDate("");
                        setAppraiser(user.name);
                        setReviewDate("");
                        setSearchQuery("");
                        setSelfScores({});
                        setSuperScores({});
                      }
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 active:scale-95 text-xs text-white font-extrabold uppercase rounded-xl shadow-lg shadow-rose-500/10 hover:shadow-rose-400/20 transition-all cursor-pointer pointer-events-auto"
                  >
                    កំណត់ឡើងវិញ / Clear
                  </button>
                  <button
                    onClick={submitEvaluationForm}
                    className="px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-xs text-white font-extrabold uppercase rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-400/20 transition-all cursor-pointer pointer-events-auto"
                  >
                    &#10003; ដាក់ស្នើ / Submit Evaluation
                  </button>
                </div>
              </div>
            )}

            {/* ===================== TAB 2: REPORTS VIEW AND EXPORTS ===================== */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fade-in duration-500 module-dashboard">
                
                {/* 1. Global statistics widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  
                  <div className="p-6 bg-slate-900/45 border border-slate-800/60 rounded-2xl backdrop-blur-md relative overflow-hidden transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#fbbf24] opacity-50" />
                    <span className="block text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Total Evaluated Staff</span>
                    <h2 className="text-3xl font-black text-white font-mono">{statsSummaryValues.total}</h2>
                    <span className="block text-[10px] font-semibold text-[#fbbf24] mt-2">evaluated this academic cycle</span>
                  </div>

                  <div className="p-6 bg-slate-900/45 border border-slate-800/60 rounded-2xl backdrop-blur-md relative overflow-hidden transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0ea5e9] opacity-50" />
                    <span className="block text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Average Calculated Score</span>
                    <h2 className="text-3xl font-black text-white font-mono">{statsSummaryValues.avg}%</h2>
                    <span className="block text-[10px] font-semibold text-sky-400 mt-2">standard out of 100</span>
                  </div>

                  <div className="p-6 bg-slate-900/45 border border-slate-800/60 rounded-2xl backdrop-blur-md relative overflow-hidden transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#6366f1] opacity-50" />
                    <span className="block text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Top Score Recorded</span>
                    <h2 className="text-3xl font-black text-white font-mono">{statsSummaryValues.top}%</h2>
                    <span className="block text-[10px] font-semibold text-indigo-400 mt-2">highest overall scorecard</span>
                  </div>

                  <div className="p-6 bg-slate-900/45 border border-slate-800/60 rounded-2xl backdrop-blur-md relative overflow-hidden transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose-500/50" />
                    <span className="block text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Needs Improvement</span>
                    <h2 className="text-3xl font-black text-white font-mono">{statsSummaryValues.low}</h2>
                    <span className="block text-[10px] font-semibold text-rose-500 mt-2">below 70% threshold</span>
                  </div>
                </div>

                {/* 2. Main query database and files packager */}
                <div className="p-7 md:p-10 bg-slate-900/40 border border-slate-800/60 rounded-3xl backdrop-blur-md">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-800 pb-5 mb-8 gap-5">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-3">
                        <span className="text-sky-400">&#128196;</span>
                        របាយការណ៍វាយតម្លៃ / Performance Reports List
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1">Review unified data logs. Synchronized across devices automatically in real-time.</p>
                    </div>

                    {/* Query tools and download ports */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={dashboardSearch}
                          onChange={(e) => setDashboardSearch(e.target.value)}
                          placeholder="Search appraisees..."
                          className="pl-10 pr-4 py-2.5 bg-slate-950/45 border border-slate-800 focus:border-indigo-600 rounded-xl text-xs font-bold text-white outline-none w-52 placeholder-slate-600"
                        />
                      </div>

                      <button
                        onClick={exportAllToCSV}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/60 rounded-xl text-[10.5px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer"
                        title="Download summary dataset report as CSV"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>CSV Export</span>
                      </button>

                      <button
                        onClick={exportAllToExcel}
                        className="p-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/25 rounded-xl text-[10.5px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer"
                        title="Package compiled summaries worksheet in XLSX Excel sheet"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Excel Export</span>
                      </button>

                      <button
                        onClick={transmitBulkSummaryTelegram}
                        className="p-2.5 bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 hover:text-sky-300 border border-sky-600/35 rounded-xl text-[10.5px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer"
                        title="Send bulk summary statistics to Telegram Bot alert channel"
                      >
                        <Send className="w-4 h-4" />
                        <span>Bulk TG</span>
                      </button>

                      <button
                        onClick={clearDatabaseEntries}
                        className="p-2.5 border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 text-[10.5px] font-black uppercase rounded-xl transition-all cursor-pointer"
                        title="Wipe database entries (Super Admin Concept override)"
                      >
                        Wipe logs
                      </button>
                    </div>
                  </div>

                  {/* Listings table */}
                  {filteredDashboardList.length === 0 ? (
                    <div className="text-center py-24 text-slate-500">
                      <Layers className="w-16 h-16 text-slate-700 mx-auto mb-4 animate-pulse" />
                      <p className="font-extrabold text-sm mb-1">មិនទាន់មានទិន្នន័យ / No records found</p>
                      <p className="text-xs font-semibold text-slate-600">Submit assessments from the standard Form, or adjust filter keywords.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl">
                      <table className="w-full text-xs text-left text-slate-400 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/30 text-indigo-300 text-[10.5px] font-bold uppercase tracking-wider">
                            <th className="p-4">ឈ្មោះ / Fullname</th>
                            <th className="p-4">Index ID</th>
                            <th className="p-4">សាខា / Campus</th>
                            <th className="p-4">តួនាទី / Position</th>
                            <th className="p-4 text-center">Self Total</th>
                            <th className="p-4 text-center">Supervisor</th>
                            <th className="p-4 text-center">Overall %</th>
                            <th className="p-4 text-center">Qualitative Rating</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {filteredDashboardList.map((item, idx) => {
                            const badgeTheme = getRatingBadgeClass(item.overallScore);
                            const badgeLabel = getRatingLabel(item.overallScore);
                            return (
                              <tr 
                                key={item.id || idx}
                                onClick={() => viewDetailByIndex(idx)}
                                className="hover:bg-slate-800/20 transition-all cursor-pointer"
                              >
                                <td className="p-4 font-black text-white">{item.employeeName}</td>
                                <td className="p-4 font-bold text-sky-400 font-mono">{item.employeeId}</td>
                                <td className="p-4 font-bold">{item.campus}</td>
                                <td className="p-4 font-medium text-slate-400 max-w-xs truncate">{item.position}</td>
                                <td className="p-4 text-center font-mono font-extrabold text-indigo-300">{item.totalSelf.toFixed(1)}</td>
                                <td className="p-4 text-center font-mono font-extrabold text-cyan-400">{item.totalSuper.toFixed(1)}</td>
                                <td className="p-4 text-center font-mono font-black text-white text-sm">{item.overallScore.toFixed(1)}%</td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${badgeTheme}`}>
                                    {badgeLabel}
                                  </span>
                                </td>
                                <td className="p-4 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => viewDetailByIndex(idx)}
                                    className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold uppercase tracking-wide rounded-lg text-[10px] cursor-pointer"
                                  >
                                    View Card
                                  </button>
                                  <button
                                    onClick={() => deleteEvaluationCard(item.id!)}
                                    className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="Erase log"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================== TAB 3: MANAGE ADMINISTRATORS ===================== */}
            {activeTab === "manageusers" && user.role === "superadmin" && (
              <div className="space-y-6 animate-fade-in duration-500 module-manageusers">
                
                {/* 1. Admins Overview stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
                    <span className="block text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Registered System Admins</span>
                    <h2 className="text-3xl font-black text-white font-mono">{filteredUserRegistry.length}</h2>
                  </div>
                  <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
                    <span className="block text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Standard Admins concept</span>
                    <h2 className="text-3xl font-black text-sky-400 font-mono">
                      {filteredUserRegistry.filter((u) => u.role === "admin").length}
                    </h2>
                  </div>
                  <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
                    <span className="block text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Root Superadminconcept</span>
                    <h2 className="text-3xl font-black text-indigo-400 font-mono">
                      {filteredUserRegistry.filter((u) => u.role === "superadmin").length}
                    </h2>
                  </div>
                </div>

                {/* 2. Main registry table */}
                <div className="p-7 md:p-10 bg-slate-900/40 border border-slate-800/60 rounded-3xl backdrop-blur-md animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 mb-8 gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-3">
                        <span className="text-sky-400">&#128295;</span>
                        គ្រប់គ្រងអ្នកប្រើប្រាស់ / Manage Administrators List
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1">Add, update, or remove credentials in real-time across devices.</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search system registry..."
                          className="pl-10 pr-4 py-2.5 bg-slate-950/45 border border-slate-800 focus:border-indigo-600 rounded-xl text-xs font-bold text-white outline-none w-52 placeholder-slate-600"
                        />
                      </div>

                      <button
                        onClick={triggerOpenAddUser}
                        className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-extrabold uppercase rounded-xl flex items-center gap-2 shadow transition-all cursor-pointer active:scale-95 duration-200"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New User</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-400 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-indigo-300 font-bold uppercase tracking-widest text-[10px]/none pb-3">
                          <th className="p-4">User ID Number</th>
                          <th className="p-4">Account Fullname</th>
                          <th className="p-4">Password key</th>
                          <th className="p-4 text-center">Assigned Role</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredUserRegistry.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/10 transition-colors">
                            <td className="p-4 font-black text-sky-400 font-mono text-sm">{u.id}</td>
                            <td className="p-4 font-extrabold text-white">{u.name}</td>
                            <td className="p-4 font-semibold text-slate-500 select-all font-mono text-xs">{u.password}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                u.role === "superadmin" 
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                  : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {u.id !== "superadmin" ? (
                                <>
                                  <button
                                    onClick={() => triggerOpenEditUser(u)}
                                    className="p-2 text-slate-400 hover:text-sky-400 transition-colors inline-block cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteSystemUser(u.id)}
                                    className="p-2 text-slate-500 hover:text-rose-500 transition-colors inline-block cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Immunised</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ===================== EVALUATION DETAIL MODAL ===================== */}
      {detailModalOpen && selectedEvaluationObj && (
        <div className={`fixed inset-0 z-[5000] flex items-center justify-center p-4 animate-fade-in ${
          isDarkMode ? "bg-slate-950/70 backdrop-blur-md" : "bg-black/40"
        }`}>
          <div className={`relative w-full max-w-4xl p-8 border rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar ${
            isDarkMode ? "bg-[#0b0c26] border-slate-700/60" : "bg-white border-slate-200 shadow-xl"
          }`}>
            
            {/* Header elements download triggers */}
            <div className={`flex items-center justify-between pb-5 mb-6 flex-wrap gap-4 ${
              isDarkMode ? "border-b border-slate-800" : "border-b border-slate-200"
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-3 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                <span className="text-sky-400">&#128269;</span>
                ព័ត៌មានលម្អិត / Evaluation report Card View
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportDetailedPDF(selectedEvaluationObj)}
                  className={`p-2.5 border rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-800 hover:bg-slate-700 hover:text-white border-slate-700/60 text-sky-400" 
                      : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-sky-600"
                  }`}
                  title="Render beautiful vector PDF document report"
                >
                  <FileDown className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-extrabold uppercase">Download PDF</span>
                </button>

                <button
                  onClick={() => exportSingleToExcel(selectedEvaluationObj)}
                  className={`p-2.5 border rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-800 hover:bg-slate-700 hover:text-white border-slate-700/60 text-emerald-400" 
                      : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-emerald-600"
                  }`}
                  title="Download single sheet report"
                >
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-extrabold uppercase">EXCEL</span>
                </button>

                <button
                  onClick={() => transmitAuditToTelegram(selectedEvaluationObj)}
                  className="p-2.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-xl text-[#0088cc] flex items-center gap-2 transition-all cursor-pointer"
                  title="Publish live to alert monitor channel"
                >
                  <Send className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-extrabold uppercase">tg notification</span>
                </button>

                {user.role === "superadmin" && (
                  <button
                    onClick={() => deleteEvaluationCard(selectedEvaluationObj.id!)}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl cursor-pointer"
                    title="Erase evaluations log permanently"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}

                <button 
                  onClick={() => { setDetailModalOpen(false); setSelectedEvalIndex(null); }}
                  className={`p-2.5 rounded-xl cursor-pointer ${
                    isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Core demographics information */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 border p-6 rounded-2xl mb-8 ${
              isDarkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Employee Name</span>
                <p className={`text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEvaluationObj.employeeName}</p>
              </div>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Employee ID Number</span>
                <p className="text-sm font-extrabold text-sky-400 font-mono">{selectedEvaluationObj.employeeId}</p>
              </div>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Campus Location</span>
                <p className={`text-sm font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{selectedEvaluationObj.campus}</p>
              </div>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Position Held</span>
                <p className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{selectedEvaluationObj.position}</p>
              </div>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Evaluator Appraiser</span>
                <p className={`text-sm font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{selectedEvaluationObj.appraiser}</p>
              </div>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Review Appraisal Date</span>
                <p className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{selectedEvaluationObj.reviewDate}</p>
              </div>
            </div>

            {/* Compilers Scorecard List */}
            <h4 className={`text-sm font-extrabold tracking-wide uppercase mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Competency Parameter Breakdowns</h4>
            <div className={`space-y-2 max-h-72 overflow-y-auto no-scrollbar border rounded-xl divide-y px-4 ${
              isDarkMode ? "border-slate-800/60 divide-slate-800/40 bg-slate-950/20" : "border-slate-200 divide-slate-200 bg-white"
            }`}>
              
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_60px_130px_130px] gap-2 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider items-center text-center">
                <span>#</span>
                <span className="text-left">Parameter</span>
                <span>Max</span>
                <span>Self Evaluation</span>
                <span>Supervisor score</span>
              </div>

              {CRITERIA.map((crit, idx) => {
                const sVal = selectedEvaluationObj.criteria?.[idx]?.self || 0;
                const pVal = selectedEvaluationObj.superScores?.[idx]?.super || 0;
                const selfPct = (sVal / 10) * 100;
                const superPct = (pVal / 10) * 100;

                return (
                  <div key={crit.id} className="grid grid-cols-[40px_1fr_60px_130px_130px] gap-2 py-4 text-center items-center">
                    <span className="font-mono text-slate-500 font-extrabold">{crit.id}</span>
                    <div className="text-left">
                      <h5 className={`font-bold text-xs ${isDarkMode ? "text-white" : "text-slate-900"}`}>{crit.kh}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold truncate block max-w-xs">{crit.en}</span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold">10</span>
                    
                    {/* Self score with micro feedback bar */}
                    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border justify-center ${
                      isDarkMode ? "bg-slate-950/30 border-slate-900" : "bg-slate-100 border-slate-200"
                    }`}>
                      <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                        <div className="h-full bg-indigo-500" style={{ width: `${selfPct}%` }} />
                      </div>
                      <span className="font-mono font-extrabold text-indigo-500 text-xs">{sVal}</span>
                    </div>

                    {/* Supervisor score with feedback bar */}
                    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border justify-center ${
                      isDarkMode ? "bg-slate-950/30 border-slate-900" : "bg-slate-100 border-slate-200"
                    }`}>
                      <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                        <div className="h-full bg-cyan-500" style={{ width: `${superPct}%` }} />
                      </div>
                      <span className="font-mono font-extrabold text-cyan-500 text-xs">{pVal}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary and totals indexes */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl border mt-6 items-center ${
              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Self Total Score</span>
                <p className="text-xl font-extrabold text-indigo-400 font-mono">{selectedEvaluationObj.totalSelf.toFixed(2)}/100</p>
              </div>
              <div>
                <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Supervisor Total</span>
                <p className="text-xl font-extrabold text-cyan-400 font-mono">{selectedEvaluationObj.totalSuper.toFixed(2)}/100</p>
              </div>
              <div className="text-right">
                <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Overall Unified Score</span>
                <p className={`text-2xl font-black font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedEvaluationObj.overallScore.toFixed(2)}%</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase mt-1 border ${getRatingBadgeClass(selectedEvaluationObj.overallScore)}`}>
                  {getRatingLabel(selectedEvaluationObj.overallScore)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== USER MANAGEMENT MODAL ===================== */}
      {userModalOpen && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-8 bg-[#0c0d25] border border-slate-800 rounded-3xl shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-500 to-indigo-600" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingUserId ? "Edit User Registry" : "Add Admin Account"}
              </h3>
              <button 
                onClick={() => setUserModalOpen(false)}
                className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5">User account ID</label>
                <input
                  type="text"
                  value={mUserId}
                  onChange={(e) => setMUserId(e.target.value)}
                  placeholder="e.g. 15024"
                  className="px-4 py-3 bg-slate-950/45 border border-slate-800 focus:border-indigo-600 rounded-xl text-xs font-bold text-white outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5">User display Fullname</label>
                <input
                  type="text"
                  value={mUserName}
                  onChange={(e) => setMUserName(e.target.value)}
                  placeholder="e.g. JOHN DOE"
                  className="px-4 py-3 bg-slate-950/45 border border-slate-800 focus:border-indigo-600 rounded-xl text-xs font-bold text-white outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5">Entry Access Code (Password)</label>
                <input
                  type="text"
                  value={mPassword}
                  onChange={(e) => setMPassword(e.target.value)}
                  placeholder="e.g. key@2026"
                  className="px-4 py-3 bg-slate-950/45 border border-slate-800 focus:border-indigo-600 rounded-xl text-xs font-bold text-white outline-none font-mono"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5">System Access Role</label>
                <select
                  value={mRole}
                  onChange={(e) => setMRole(e.target.value as "admin" | "superadmin")}
                  className="px-4 py-3 bg-slate-950/45 border border-slate-800 focus:border-indigo-600 rounded-xl text-xs font-bold text-white outline-none"
                >
                  <option value="admin">Administrator (Appraise / View Logs)</option>
                  <option value="superadmin">Super Administrator (Full System CRUD)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-end gap-3 font-bold text-xs uppercase">
              <button 
                onClick={() => setUserModalOpen(false)}
                className="px-4 py-2 bg-slate-805 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={saveModifiedUser}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-450 text-[#0c0d24] font-black rounded-lg shadow cursor-pointer shadow-sky-500/10 hover:shadow-sky-400/20"
              >
                Save account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
