import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import AppRoutes from "./routes/routes";

const App = () => {
  return <AppRoutes loginPage={<LoginPage />} adminPage={<AdminPage />} />;
};

export default App;
