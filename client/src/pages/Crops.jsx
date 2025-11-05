// src/pages/Crops.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../config/api";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

const isValidObjectId = (val) => /^[0-9a-fA-F]{24}$/.test(String(val || ""));

const placeholderFor = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Crop"
  )}&size=400&background=random&color=fff&bold=true&length=2`;

const handleImgError = (e, name) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = placeholderFor(name);
};

// Convert a quantity to quintals based on the unit
const toQuintals = (qty = 0, unit = "quintal") => {
  const n = Number(qty) || 0;
  switch ((unit || "quintal").toLowerCase()) {
    case "kg":
      return n / 100; // 100 kg = 1 quintal
    case "ton":
    case "tonne":
      return n * 10; // 1 ton = 10 quintal
    default:
      return n; // already in quintal
  }
};

// Build status badges based on crop quantity/unit and status
const buildBadges = (crop) => {
  const badges = [];
  const qtl = toQuintals(crop?.quantity, crop?.unit);
  const status = String(crop?.status || "").toLowerCase();

  if (qtl === 0) badges.push({ text: "0 quintal", cls: "bg-red-600" });
  if (qtl < 1 && qtl > 0) badges.push({ text: "Insufficient", cls: "bg-orange-500" });

  if (status === "sold" || qtl <= 0) badges.push({ text: "Sold out", cls: "bg-red-700" });
  if (status === "sold") badges.push({ text: "Completed", cls: "bg-purple-600" });
  if (status === "pending") badges.push({ text: "Not available", cls: "bg-yellow-600" });
  if (status === "unavailable" || status === "not available") badges.push({ text: "Unavailable", cls: "bg-gray-600" });

  // Deduplicate by text
  const seen = new Set();
  return badges.filter((b) => (seen.has(b.text) ? false : (seen.add(b.text), true)));
};

export default function Crops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await api.get("/crops");
        if (res.data?.success) {
          setCrops(res.data.crops || []);
        } else {
          toast.error(res.data?.message || "Failed to load crops");
        }
      } catch (error) {
        console.error("Error fetching crops:", error);
        toast.error("Failed to load crops");
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  const safeCrops = Array.isArray(crops) ? crops : [];

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-emerald-100 via-green-100 to-sky-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Back */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/buyer-dashboard")}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Fresh Crops</h1>
            <p className="text-gray-600">Fresh crops from verified sellers across India</p>
          </div>
        </div>

        {safeCrops.length === 0 ? (
          <p className="text-gray-600">No crops found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeCrops.map((crop) => {
            const validId = isValidObjectId(crop?._id);
            const unitPrice = Number(crop?.pricePerUnit || 0);
            const unit = crop?.unit || "quintal";
            const coverImg = (Array.isArray(crop?.images) && crop.images[0]) || crop?.image || placeholderFor(crop?.cropName);
            const badges = buildBadges(crop);
            const availableTxt = `${Number(crop?.quantity || 0)} ${crop?.unit || "quintal"}`;
            return (
              <div
                key={
                  crop?._id || `${crop?.cropName || "Crop"}-${Math.random()}`
                }
                className="p-4 border rounded-lg overflow-hidden bg-white/95 backdrop-blur-[1px] shadow-sm hover:shadow-md transition"
              >
                {/* Image */}
                <div className="mb-3 relative">
                  <img
                    src={coverImg}
                    alt={crop?.cropName || "Crop"}
                    onError={(e) => handleImgError(e, crop?.cropName)}
                    className="w-full h-48 object-cover rounded-md bg-gray-100"
                    loading="lazy"
                  />
                  {badges.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-2">
                      {badges.map((b) => (
                        <span key={b.text} className={`px-2 py-0.5 text-xs font-semibold rounded-full text-white ${b.cls}`}>
                          {b.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title and meta */}
                <h3 className="text-xl font-semibold">
                  {crop?.cropName || "Unnamed Crop"}
                </h3>

                <div className="mt-1 text-sm text-gray-600">
                  <div>Seller: {crop?.seller?.name || "Unknown Seller"}</div>
                  {crop?.location && (
                    <div>
                      Location: {crop.location?.district || "N/A"}, {crop.location?.state || "N/A"}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <p className="font-bold">₹{unitPrice.toLocaleString()}/{unit}</p>
                  <p className="text-sm text-gray-600">Available: {availableTxt}</p>
                </div>

                {/* Actions */}
                <div className="mt-4">
                  {validId ? (
                    <Link
                      to={`/crops/${crop._id}`}
                      className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      View Details
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-block px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                      title="Invalid crop ID"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
