import { Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Landing } from "./pages/Landing";
import { Demo } from "./pages/Demo";

export function App() {
  return (
    <div className="bg-[#fff0f5] text-black font-cartoon">
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        {/* V3: /tools/* routes (Price Manager, Compose, Calculators, Autofill) go here */}
      </Routes>
    </div>
  );
}
