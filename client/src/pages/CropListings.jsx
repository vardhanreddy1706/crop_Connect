import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../config/api";
import { toast } from "react-hot-toast";
import { Package, IndianRupee, MapPin, Calendar, ArrowLeft, BarChart3 } from "lucide-react";

function CropListings() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchMyCrops = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/crops/my-crops");
        setCrops(data.crops || []);
      } catch (e) {
        console.error("Fetch my crops error:", e);
        setError(e.response?.data?.message || "Failed to load your listings");
        toast.error("Failed to load your listings");
      } finally {
        setLoading(false);
      }
    };
    fetchMyCrops();
  }, []);

  const renderStatusBadge = (crop) => {
    const isSoldOut = Number(crop.quantity || 0) <= 0 || crop.status === "sold";
    const cls = isSoldOut
      ? "bg-red-100 text-red-800"
      : crop.status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-800";
    const label = isSoldOut ? "Sold Out" : crop.status === "pending" ? "Pending" : "Available";
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your crop listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-200">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Crop Listings</h1>
            <p className="text-gray-600">Manage crops you have listed for sale</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {crops.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">You have not listed any crops yet.</p>
            <div className="mt-4">
              <Link
                to="/sell-crop"
                className="inline-block px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                List a Crop
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {crops.map((crop) => (
              <div key={crop._id} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{crop.cropName} {crop.variety ? `(${crop.variety})` : ""}</h3>
                  {renderStatusBadge(crop)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <IndianRupee className="w-4 h-4 text-green-600" />
                    <span className="font-medium">₹{Number(crop.pricePerUnit || 0)}/{crop.unit || "quintal"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Package className="w-4 h-4 text-green-600" />
                    <span>Available: {crop.quantity} {crop.unit || "quintal"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>{crop.location?.village ? `${crop.location.village}, ` : ""}{crop.location?.district}, {crop.location?.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span>Listed: {new Date(crop.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Sales summary in quintals */}
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span>Sales summary (in quintals)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white rounded border border-gray-200 p-2 text-center">
                      <div className="text-gray-500">Posted</div>
                      <div className="text-gray-900 font-bold">
                        {(
                          toQuintals(crop.initialQuantity ?? (crop.quantity + (crop.soldQuantity || 0)), crop.unit)
                        ).toFixed(2)} qtl
                      </div>
                    </div>
                    <div className="bg-white rounded border border-gray-200 p-2 text-center">
                      <div className="text-gray-500">Sold</div>
                      <div className="text-gray-900 font-bold">
                        {(toQuintals(crop.soldQuantity || 0, crop.unit)).toFixed(2)} qtl
                      </div>
                    </div>
                    <div className="bg-white rounded border border-gray-200 p-2 text-center">
                      <div className="text-gray-500">Remaining</div>
                      <div className="text-gray-900 font-bold">
                        {(toQuintals(crop.remainingQuantity ?? crop.quantity, crop.unit)).toFixed(2)} qtl
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to="/farmer-crop-status"
                    className="flex-1 text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Status
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CropListings;
