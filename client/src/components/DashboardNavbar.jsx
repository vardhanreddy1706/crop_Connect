import React from "react";
import { Sprout, LogOut, Menu, X, Moon, Sun } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";
import { Link } from "react-router-dom";

/**
 * Modern, elegant Dashboard Navbar for CropConnect
 * Features:
 * - Sticky top navigation with backdrop blur
 * - Prominent branding with leaf icon
 * - Role badge with dynamic styling
 * - User greeting with avatar placeholder
 * - Notification bell, language selector, logout
 * - Responsive mobile menu
 */
export default function DashboardNavbar({
  role,
  userName,
  onLogout,
  tabs = [],
  activeTab,
  onTabChange,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const showTabs = Array.isArray(tabs) && tabs.length > 0 && typeof onTabChange === "function";

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply dark mode on mount
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Role-based theme colors
  const roleThemes = {
    "Farmer": { gradient: "from-green-500 to-emerald-600", badge: "bg-green-100 text-green-700" },
    "Worker": { gradient: "from-emerald-500 to-teal-600", badge: "bg-emerald-100 text-emerald-700" },
    "Tractor Owner": { gradient: "from-sky-500 to-blue-600", badge: "bg-sky-100 text-sky-700" },
    "Buyer": { gradient: "from-purple-500 to-indigo-600", badge: "bg-purple-100 text-purple-700" },
  };

  const theme = roleThemes[role] || roleThemes["Farmer"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Main navbar content */}
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand + Tagline */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-green-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Sprout className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  CropConnect
                </h1>
                {role && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.badge} shadow-sm`}>
                    {role}
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-xs text-gray-500 mt-1 font-medium tracking-wide">
                Growing Together • Empowering Farmers
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* User greeting (desktop) */}
            {userName && (
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Welcome back</p>
                  <p className="text-sm font-bold text-gray-900">{userName}</p>
                </div>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Language Selector */}
            <LanguageSelector />

            {/* Browse Crops (Buyer only) */}
            {role === "Buyer" && (
              <Link
                to="/crops"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
              >
                Browse Crops
              </Link>
            )}

            {/* Logout Button */}
            {typeof onLogout === "function" && (
              <button
                onClick={onLogout}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-gray-200 space-y-3">
            {userName && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Welcome back</p>
                  <p className="text-base font-bold text-gray-900">{userName}</p>
                </div>
              </div>
            )}
            {/* Mobile: Browse Crops (Buyer only) */}
            {role === "Buyer" && (
              <Link
                to="/crops"
                className="block w-full text-center px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
              >
                Browse Crops
              </Link>
            )}

            {typeof onLogout === "function" && (
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs (Desktop & Mobile) */}
      {showTabs && (
        <div className="border-t border-gray-200 bg-white/80">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 sm:gap-6 overflow-x-auto no-scrollbar py-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={`relative py-3 px-4 border-b-2 -mb-px text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
                    activeTab === t.id
                      ? "border-green-600 text-green-700 bg-green-50/50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  {t.icon ? <t.icon className="w-4 h-4" /> : null}
                  <span>{t.label}</span>
                  {typeof t.badge === "number" && t.badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-green-600 text-white shadow-sm">
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
