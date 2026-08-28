import { BrowserRouter, Routes, Route } from "react-router";
import AuthGate from "./components/AuthGate.jsx";
import Layout from "./components/Layout.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import PartnerDashboard from "./partner/PartnerDashboard.jsx";
import ChangePassword from "./auth/ChangePassword.jsx";
import CreatePartner from "./admin/CreatePartner.jsx";
import Partners from "./admin/Partners.jsx";
import CreateJob from "./admin/CreateJob.jsx";
import { Toaster } from "react-hot-toast";
import PartnerJobDetail from "./partner/PartnerJobDetail.jsx";
import AdminJobDetail from "./admin/AdminJobDetail.jsx";
import Login from "./auth/Login.jsx";
import AuditLogList from "./admin/AuditLogList.jsx";
import AuditLogDetail from "./admin/AuditLogDetails.jsx";
import ArchivedJobs from "./admin/ArchivedJobs.jsx";
import PartnerStats from "./partner/PartnerStats.jsx";
import AdminStats from "./admin/AdminStats.jsx";
import CreateAdmin from "./admin/CreateAdmin.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route element={<AuthGate guestOnly />}>
          <Route path="/" element={<Login />} />
        </Route>

        <Route element={<AuthGate requiredRole="admin" />}>
          <Route element={<Layout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/partners" element={<Partners />}></Route>
            <Route
              path="/admin/jobs/create-job"
              element={<CreateJob />}
            ></Route>
            <Route
              path="/admin/jobs/create-partner"
              element={<CreatePartner />}
            ></Route>
            <Route
              path="/admin/jobs/create-admin"
              element={<CreateAdmin />}
            ></Route>
            <Route path="/admin/stats" element={<AdminStats />}></Route>
            <Route path="/admin/jobs/:id" element={<AdminJobDetail />}></Route>
            <Route
              path="/admin/jobs/archived"
              element={<ArchivedJobs />}
            ></Route>
            <Route path="/admin/audit-logs" element={<AuditLogList />}></Route>
            <Route
              path="/admin/audit-logs/:jobId"
              element={<AuditLogDetail />}
            ></Route>
          </Route>
        </Route>

        <Route element={<AuthGate requiredRole="partner" />}>
          <Route element={<Layout />}>
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            <Route
              path="/partner/jobs/:id"
              element={<PartnerJobDetail />}
            ></Route>
            <Route path="/partner/stats" element={<PartnerStats />} />
          </Route>
        </Route>

        <Route element={<AuthGate />}>
          <Route element={<Layout />}>
            <Route path="/auth/change-password" element={<ChangePassword />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
