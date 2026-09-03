import { Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Landing } from "./pages/Landing";
import { Demo } from "./pages/Demo";
import { ToolsIndex } from "./pages/tools/ToolsIndex";
import { ProfitCalculator } from "./pages/tools/ProfitCalculator";
import { GstCalculator } from "./pages/tools/GstCalculator";
import { LabelCrop } from "./pages/tools/LabelCrop";
import { LabelMerge } from "./pages/tools/LabelMerge";

export function App() {
  return (
    <div className="bg-[#fff0f5] text-black font-cartoon">
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        {/* V3 */}
        <Route path="/tools" element={<ToolsIndex />} />
        <Route path="/tools/profit-calculator" element={<ProfitCalculator />} />
        <Route path="/tools/gst-calculator" element={<GstCalculator />} />
        <Route path="/tools/label-crop" element={<LabelCrop />} />
        <Route path="/tools/label-merge" element={<LabelMerge />} />
      </Routes>
    </div>
  );
}
