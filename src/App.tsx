import { Routes, Route, useLocation,HashRouter } from "react-router-dom";
import ReactGA from "react-ga4";
import { useEffect } from "react";
import Home from "@/pages/home";
import Discount from "@/pages/discount/discount";
import Fuji from "@/pages/discount/fuji";
import Hicheese from "@/pages/discount/hicheese";
import Kokuterudo from "@/pages/discount/kokuterudo";
import Question from "@/pages/question"
import { ThemeProvider } from "@/components/theme-provider";

const TRACKING_ID = "G-4F3PMM48SS";
if (TRACKING_ID) {
  ReactGA.initialize(TRACKING_ID);
}

const TrackPageViews = () => {
  const location = useLocation();
  useEffect(() => {
    if (TRACKING_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);

  return null;
};



const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tamap-theme">
      <HashRouter basename={import.meta.env.PROD ? "" : ""}>
        <TrackPageViews />
        <Routes>
          <Route
            path="/"
            element={
              <Home />
            }
          />
          
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
