

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ImageIcon,
  VideoIcon,
  MailIcon,
  PenToolIcon,
  FileTextIcon,
  BrainIcon,
  BookOpenIcon,
  MicIcon,
  TrendingUpIcon,
  TagIcon,
  CalendarIcon,
  BarChartIcon,
  MessageCircleIcon,
  UsersIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

const Sidebar = () => {
  const location = useLocation()
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  useEffect(() => {
    const mainContent = document.querySelector("[data-sidebar-expanded]")
    if (mainContent) {
      mainContent.setAttribute("data-sidebar-expanded", !isDesktopCollapsed)
    }
  }, [isDesktopCollapsed])

  const isActiveRoute = (path) => location.pathname === path

  const navItems = [
    { path: "/brand-image-generator", label: "Brand Image Generator", icon: ImageIcon },
    { path: "/video-generator", label: "Video Generator", icon: VideoIcon },
    { path: "/email-marketing-campaigns", label: "Email Marketing Campaigns", icon: MailIcon },
    { path: "/blog-writing", label: "Blog Writing", icon: PenToolIcon },
    { path: "/cv-cover-letter-coach", label: "Real-time CV & Cover Letter Coach", icon: FileTextIcon },
    { path: "/candidate-memory-layer", label: "Persistent Candidate Memory Layer", icon: BrainIcon },
    { path: "/smart-interview-notebook", label: "Smart Interview Notebook", icon: BookOpenIcon },
    { path: "/ai-interview-simulator", label: "AI Interview Simulator", icon: MicIcon },
    { path: "/progress-dashboard-learning-loop", label: "Progress Dashboard & Learning Loop", icon: TrendingUpIcon },
    { path: "/keyword-manager", label: "Keyword Manager", icon: TagIcon },
    { path: "/campaign-calendar-scheduler", label: "Campaign Calendar & Scheduler", icon: CalendarIcon },
    { path: "/performance-analyzer", label: "Performance Analyzer", icon: BarChartIcon },
    { path: "/persona-builder", label: "Persona Builder & Targeting Optimizer", icon: UsersIcon }
  ]

  return (
    <>
      <div
        className="lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 shadow-lg z-40 transition-all duration-300 ease-in-out"
        style={{ width: isMobileExpanded ? "280px" : "64px" }}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              {isMobileExpanded && (
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Agents
                </h2>
              )}
              <button
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-600 hover:text-slate-800 ml-auto"
                title={isMobileExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isMobileExpanded ? <ChevronLeftIcon size={18} /> : <ChevronRightIcon size={18} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            <nav className="p-2 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.path)

                return (
                  <div key={item.path} className="relative group">
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100"
                          : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                      }`}
                      onClick={() => setIsMobileExpanded(false)}
                    >
                      <Icon
                        size={20}
                        className={`flex-shrink-0 transition-colors duration-200 ${
                          isActive ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
                        } ${isMobileExpanded ? "opacity-100" : "opacity-100"}`}
                      />
                      <span
                        className={`ml-3 text-sm leading-tight transition-opacity duration-300 ${
                          isMobileExpanded ? "opacity-100" : "opacity-0 absolute"
                        }`}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                      )}
                    </Link>
                    {!isMobileExpanded && (
                      <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      <div
        className={`mt-16 hidden lg:block fixed left-0 top-0 h-full bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 shadow-lg z-40 transition-all duration-300 ease-in-out ${
          isDesktopCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              {!isDesktopCollapsed && (
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Agents
                </h2>
              )}
              <button
                onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-600 hover:text-slate-800"
                title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isDesktopCollapsed ? <ChevronRightIcon size={18} /> : <ChevronLeftIcon size={18} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            <nav className="p-3 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.path)

                return (
                  <div key={item.path} className="relative group">
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100"
                          : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`flex-shrink-0 transition-colors duration-200 ${
                          isActive ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
                        } ${isDesktopCollapsed ? "opacity-100" : "opacity-100"}`}
                      />
                      <span
                        className={`ml-3 text-sm leading-tight transition-opacity duration-300 ${
                          isDesktopCollapsed ? "opacity-0 absolute" : "opacity-100"
                        }`}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                      )}
                    </Link>
                    {isDesktopCollapsed && (
                      <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar