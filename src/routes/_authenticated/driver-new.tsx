import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, TrendingUp, Star, LogOut, Phone, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/driver-new")({
  component: DriverDashboard,
});

interface DriverStats {
  todayEarnings: number;
  totalDeliveries: number;
  rating: number;
  activeOrders: number;
}

function DriverDashboard() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<any>(null);
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 0,
    totalDeliveries: 0,
    rating: 4.8,
    activeOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      navigate({ to: "/driver-login" });
      return;
    }

    const { data: driverData } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    if (driverData) {
      setDriver(driverData);
      // Load stats from orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", driverData.id);

      if (orders) {
        const todayOrders = orders.filter((o) => {
          const orderDate = new Date(o.created_at).toDateString();
          return orderDate === new Date().toDateString();
        });

        const todayEarnings = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const activeCount = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;

        setStats({
          todayEarnings,
          totalDeliveries: orders.filter((o) => o.status === "delivered").length,
          rating: driverData.rating || 4.8,
          activeOrders: activeCount,
        });
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/driver-login" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Truck className="h-12 w-12 animate-bounce text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-400 rounded-full flex items-center justify-center">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{driver?.name}</h1>
                <p className="text-emerald-100">{driver?.phone}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats.todayEarnings.toLocaleString("en-IN")}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-emerald-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Deliveries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalDeliveries}
                </p>
              </div>
              <Truck className="h-12 w-12 text-emerald-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Your Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.rating}/5
                </p>
              </div>
              <Star className="h-12 w-12 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeOrders}
                </p>
              </div>
              <Clock className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active Orders</h2>
          
          {stats.activeOrders === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No active orders</p>
              <p className="text-gray-400 text-sm mt-2">
                Check back soon for new delivery requests
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Placeholder for active orders list */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">#ORD12345</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" /> 9876543210
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Beawar, Rajasthan
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
