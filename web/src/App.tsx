import { useState } from "react";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    setLoggedIn(true);
  };

  if (loggedIn) {
    return <Dashboard email={email} onLogout={() => setLoggedIn(false)} />;
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

          <button className="authButton" type="submit">
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="switchAuth">
          <span>
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
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

          <h1>Welcome to Neo 👋</h1>

          <p>
            Manage your catalogue, generate marketplace listings,
            and update prices from one place.
          </p>
        </div>

        <div className="dashboardGrid">
          <div className="dashboardCard">
            <div className="cardIcon">📦</div>
            <h2>Product Genome</h2>
            <p>
              Manage your centralized product information and
              marketplace attributes.
            </p>
           <button
            onClick={() => {
              window.postMessage(
                {
                  type: "NEO_OPEN_EXTENSION",
                },
                "*"
              );
            }}
          >
            View Catalogue →
          </button>
          </div>

          <div className="dashboardCard">
            <div className="cardIcon">✨</div>
            <h2>AI Composer</h2>
            <p>
              Generate marketplace-ready titles, descriptions and
              keywords using AI.
            </p>
            <button
              onClick={() =>
                alert(
                  "AI Composer is available in the Neo browser extension."
                )
              }
            >
              Open Composer →
            </button>
          </div>

          <div className="dashboardCard">
            <div className="cardIcon">₹</div>
            <h2>Price Manager</h2>
            <p>
              Safely manage bulk price changes with preview and
              undo support.
            </p>
            <button
              onClick={() =>
                alert(
                  "Bulk Price Manager is available in the Neo browser extension."
                )
              }
            >
              Manage Prices →
            </button>
          </div>

          <div className="dashboardCard extensionCard">
            <div className="cardIcon">🧩</div>
            <h2>Project Neo Extension</h2>
            <p>
              Open the Neo browser extension and manage your
              marketplace catalogue directly from the side panel.
            </p>

            <button
              onClick={() => {
                alert(
                  "Open Chrome Extensions → Neo to launch the Project Neo side panel."
                );
              }}
            >
              Open Neo Extension →
            </button>
          </div>
        </div>

        <div className="dashboardStats">
          <div>
            <span>Total Products</span>
            <strong>3</strong>
          </div>

          <div>
            <span>Ready</span>
            <strong>2</strong>
          </div>

          <div>
            <span>Needs Review</span>
            <strong>1</strong>
          </div>

          <div>
            <span>Marketplace</span>
            <strong>Meesho</strong>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;