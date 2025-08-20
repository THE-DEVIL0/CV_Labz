import { BrowserRouter, Route, Routes } from "react-router-dom"
import { SessionProvider } from "./contexts/SessionContext"
import { useSession } from "./contexts/SessionContext"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import Home from "./pages/Home"
import PromptPage from "./pages/PromptPage"
import EmailMarketingCampaigns from "./pages/Agents/EmailMarketingCampaigns"
import BlogWriting from "./pages/Agents/BlogWriting"
import RealTimeCVCoverLetterCoach from "./pages/Agents/RealTimeCVCoverLetterCoach"
import PersistentCandidateMemoryLayer from "./pages/Agents/PersistentCandidateMemoryLayer"
import SmartInterviewNotebook from "./pages/Agents/SmartInterviewNotebook"
import AIInterviewSimulator from "./pages/Agents/AIInterviewSimulator"
import ProgressDashboardLearningLoop from "./pages/Agents/ProgressDashboardLearningLoop"
import KeywordManager from "./pages/Agents/KeywordManager"
import CampaignCalendarScheduler from "./pages/Agents/CampaignCalendarScheduler"
import PerformanceAnalyzer from "./pages/Agents/PerformanceAnalyzer"
import EngagementBot from "./pages/Agents/EngagementBot"
import PersonaBuilder from "./pages/Agents/PersonaBuilder"
import GoogleAdsGenerator from "./pages/Agents/GoogleAdsGenerator"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ProtectedRoute from "./components/ProtectedRoute"
import RealCvBuilder from "./pages/Agents/RealCvBuilder"
import ImageGenrator from "./pages/Agents/BrandImageGenrator"
import VideoGenerator from "./pages/Agents/VideoGenerator"
// import SessionStatus from './components/SessionStatus';

const AppContent = () => {
  const { isAuthenticated } = useSession()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        {isAuthenticated && <Sidebar />}
        <div
          className={`flex-1 transition-all duration-300 ${
            isAuthenticated ? "ml-16 lg:ml-16 lg:data-[sidebar-expanded=true]:ml-64" : ""
          }`}
          data-sidebar-expanded="true"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/prompt"
              element={
                <ProtectedRoute>
                  <PromptPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-marketing-campaigns"
              element={
                <ProtectedRoute>
                  <EmailMarketingCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video-generator"
              element={
                <ProtectedRoute>
                  <VideoGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blog-writing"
              element={
                <ProtectedRoute>
                  <BlogWriting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cv-cover-letter-coach"
              element={
                <ProtectedRoute>
                  <RealTimeCVCoverLetterCoach />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate-memory-layer"
              element={
                <ProtectedRoute>
                  <PersistentCandidateMemoryLayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/smart-interview-notebook"
              element={
                <ProtectedRoute>
                  <SmartInterviewNotebook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-interview-simulator"
              element={
                <ProtectedRoute>
                  <AIInterviewSimulator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress-dashboard-learning-loop"
              element={
                <ProtectedRoute>
                  <ProgressDashboardLearningLoop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/keyword-manager"
              element={
                <ProtectedRoute>
                  <KeywordManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaign-calendar-scheduler"
              element={
                <ProtectedRoute>
                  <CampaignCalendarScheduler />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance-analyzer"
              element={
                <ProtectedRoute>
                  <PerformanceAnalyzer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/engagement-bot"
              element={
                <ProtectedRoute>
                  <EngagementBot />
                </ProtectedRoute>
              }
            />
            <Route
              path="/persona-builder"
              element={
                <ProtectedRoute>
                  <PersonaBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/google-ads-generator"
              element={
                <ProtectedRoute>
                  <GoogleAdsGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/real-time-cv"
              element={
                <ProtectedRoute>
                  {" "}
                  <RealCvBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/brand-image-generator"
              element={
                <ProtectedRoute>
                  {" "}
                  <ImageGenrator />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
          {/* <SessionStatus show={true} /> */}
        </div>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App
