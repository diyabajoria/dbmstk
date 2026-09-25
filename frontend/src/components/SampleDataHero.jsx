import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSampleData } from "../services/setupService";
import { useToast } from "./Toast";

/** Shown when the household has no items yet. */
export default function SampleDataHero({ onLoaded }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function handleLoad() {
    setLoading(true);
    try {
      const res = await loadSampleData();
      if (res.data.seededItems) toast?.success(`Loaded ${res.data.items} sample items with 3 months of history.`);
      else toast?.info("Your household already has items.");
      onLoaded?.();
    } catch (err) {
      toast?.error(err.response?.data?.error || "Couldn't load sample data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-card">
      <div className="hero-emoji" aria-hidden="true">🧺</div>
      <h3>Welcome home! Let's fill your pantry.</h3>
      <p>
        Your household is empty. Load a ready-made sample household (48 everyday items with purchase and usage
        history) to explore every feature, or start adding your own items in one tap.
      </p>
      <div className="hero-actions">
        <button className="btn btn-light btn-lg" onClick={handleLoad} disabled={loading}>
          {loading ? "Loading…" : "✨ Load sample household"}
        </button>
        <button className="btn btn-ghost btn-lg" onClick={() => navigate("/app/purchases?new=1")}>
          ＋ Add my first item
        </button>
      </div>
    </div>
  );
}
