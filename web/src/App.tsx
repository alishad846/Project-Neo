import { useState } from "react";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  
  // NEW: Added state for loading and error messages
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); // Clear old errors

    // 1. Basic validation
    if (isLogin) {
      if (!email || !password) return setErrorMsg("Please enter email and password.");
    } else {
      if (!email || !password || !fullName || !shopName) return setErrorMsg("Please fill all fields.");
    }

    setIsLoading(true);

    try {
      // 2. Decide if we are hitting /auth/login or /auth/signup
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const payload = isLogin 
        ? { email, password } 
        : { fullName, shopName, email, password };

      // 3. Send the request to your NestJS backend
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // 4. Handle backend errors (like "Invalid password" or "Email already exists")
      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      // 5. Success! Save the JWT token and update the UI
      if (data.access_token) {
        localStorage.setItem("neo_session_token", data.access_token);
      }

      // If logging in, the backend sends us the user's name. Let's save it for the dashboard greeting!
      if (isLogin && data.user?.fullName) {
        setFullName(data.user.fullName);
      }

      setLoggedIn(true);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("neo_session_token");
    setLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  if (loggedIn) {
    return <Dashboard email={email} fullName={fullName} onLogout={handleLogout} />;
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="logo">NEO</div>
        <p className="logoSubtitle">Seller Catalogue Assistant</p>

        <div className="authHeader">
          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p>
            {isLogin
              ? "Sign in to manage your product catalogue."
              : "Start automating your marketplace catalogue."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* NEW: Error message display */}
          {errorMsg && <div style={{ color: "red", fontSize: "14px", marginBottom: "15px" }}>{errorMsg}</div>}

          {!isLogin && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Anilabho Basak"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <label>Shop Name</label>
              <input
                type="text"
                placeholder="e.g. Anilabho Gift Store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            placeholder="seller@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="passwordWrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="showPassword"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {isLogin && (
            <div className="forgotRow">
              <span>Secure seller access</span>
              <button type="button">Forgot password?</button>
            </div>
          )}

          <button className="authButton" type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="switchAuth">
          <span>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(""); // Clear errors when switching modes
            }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Dashboard Component Remains Exactly the Same ---
function Dashboard({ email, fullName, onLogout }: { email: string; fullName?: string; onLogout: () => void; }) {
  return (
    <div className="dashboard">
      <header className="dashboardHeader">
        <div>
          <div className="dashboardLogo">NEO</div>
          <span>Seller Catalogue Assistant</span>
        </div>
        <div className="userArea">
          <span>{email}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboardContent">
        <div className="welcome">
          <p className="eyebrow">SELLER DASHBOARD</p>
          <h1>Welcome to Neo {fullName ? `, ${fullName.split(' ')[0]}` : "👋"}</h1>
          <p>Manage your catalogue, generate marketplace listings, and update prices from one place.</p>
        </div>

        <div className="dashboardGrid">
          <div className="dashboardCard">
            <div className="cardIcon">📦</div>
            <h2>Product Genome</h2>
            <p>Manage your centralized product information and marketplace attributes.</p>
            <button onClick={() => window.postMessage({ type: "NEO_OPEN_EXTENSION" }, "*")}>
              View Catalogue →
            </button>
          </div>
          <div className="dashboardCard">
            <div className="cardIcon">✨</div>
            <h2>AI Composer</h2>
            <p>Generate marketplace-ready titles, descriptions and keywords using AI.</p>
            <button onClick={() => alert("AI Composer is available in the Neo browser extension.")}>
              Open Composer →
            </button>
          </div>
          <div className="dashboardCard">
            <div className="cardIcon">₹</div>
            <h2>Price Manager</h2>
            <p>Safely manage bulk price changes with preview and undo support.</p>
            <button onClick={() => alert("Bulk Price Manager is available in the Neo browser extension.")}>
              Manage Prices →
            </button>
          </div>
          <div className="dashboardCard extensionCard">
            <div className="cardIcon">🧩</div>
            <h2>Project Neo Extension</h2>
            <p>Open the Neo browser extension and manage your marketplace catalogue directly from the side panel.</p>
            <button onClick={() => alert("Open Chrome Extensions → Neo to launch the Project Neo side panel.")}>
              Open Neo Extension →
            </button>
          </div>
        </div>

        <div className="dashboardStats">
          <div><span>Total Products</span><strong>3</strong></div>
          <div><span>Ready</span><strong>2</strong></div>
          <div><span>Needs Review</span><strong>1</strong></div>
          <div><span>Marketplace</span><strong>Meesho</strong></div>
        </div>
      </main>
    </div>
  );
}

export default App;