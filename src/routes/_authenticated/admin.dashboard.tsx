import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Download,
  RefreshCw,
  LogOut,
  Package,
  TrendingUp,
  Wallet,
  IndianRupee,
  Calendar,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { AdminKPICard } from "@/components/AdminKPICard";
import { AdminStatusCard } from "@/components/AdminStatusCard";
import { WATER_TYPE_LABEL, ORDER_STATUS_LABEL } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard | PBTW" }] }),
  component: AdminDashboard,
});

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  water_type: string;
  size_l: number;
  total: number;
  address_text: string;
  delivery_date: string;
  created_at: string;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "drivers" | "subs" | "coupons" | "bulk" | "wallet">("bookings");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 10;

  // Calculate KPIs
  const kpis = useMemo(() => {
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const todayOrders = orders.filter((o) => {
      const orderDate = new Date(o.created_at).toDateString();
      return orderDate === new Date().toDateString();
    });
    const todayRevenue = todayOrders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total, 0);
    const commission = totalRevenue * 0.15;
    const netProfit = totalRevenue - (totalRevenue * 0.05); // 5% GST

    const statusCounts = {
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      inTransit: orders.filter((o) => ["on_the_way", "reached"].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    return {
      totalRevenue,
      todayRevenue,
      commission,
      netProfit,
      totalBookings: orders.length,
      statusCounts,
    };
  }, [orders]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setIsAdmin(false);
        navigate({ to: "/auth/login" });
        return;
      }

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow) {
        setIsAdmin(false);
        navigate({ to: "/" });
        return;
      }

      setIsAdmin(true);
    })();
  }, [navigate]);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } else {
      setOrders((data as Order[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      void loadOrders();
    }
  }, [isAdmin]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth/login" });
  };

  const handleRefresh = () => {
    void loadOrders();
    toast.success("Dashboard refreshed");
  };

  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
  };

  const handleExportExcel = () => {
    toast.info("Excel export coming soon");
  };

  const filteredBookings = useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => {
        if (statusFilter === "inTransit") {
          return ["on_the_way", "reached"].includes(o.status);
        }
        return o.status === statusFilter;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
      );
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  const paginatedBookings = useMemo(() => {
    const start = (pageNum - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, pageNum]);

  const totalPages = Math.ceil(filteredBookings.length / pageSize);

  if (isAdmin === null || (isAdmin && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Access denied</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo showText={false} size="md" className="text-white" />
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100 text-sm mt-1">Revenue · Bookings · Fleet Management</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors text-sm font-medium"
              >
                <FileText className="h-4 w-4" />
                PDF Report
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Excel Export
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-400 rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminKPICard
            title="Total Revenue"
            value={`₹${kpis.totalRevenue.toLocaleString("en-IN")}`}
            subtitle={`${orders.filter((o) => o.status === "delivered").length} deliveries`}
            icon={IndianRupee}
          />
          <AdminKPICard
            title="Today's Revenue"
            value={`₹${kpis.todayRevenue.toLocaleString("en-IN")}`}
            subtitle={new Date().toLocaleDateString("en-IN")}
            icon={Calendar}
          />
          <AdminKPICard
            title="Platform Commission (15%)"
            value={`₹${kpis.commission.toLocaleString("en-IN")}`}
            subtitle="Today: ₹0"
            icon={TrendingUp}
          />
          <AdminKPICard
            title="Net Profit"
            value={`₹${kpis.netProfit.toLocaleString("en-IN")}`}
            subtitle="After GST deduction"
            icon={Wallet}
          />
        </div>

        {/* KPI Cards - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <AdminKPICard
            title="Driver Payouts (85%)"
            value={`₹${(kpis.totalRevenue * 0.85).toLocaleString("en-IN")}`}
          />
          <AdminKPICard
            title="GST Collected (5%)"
            value={`₹${(kpis.totalRevenue * 0.05).toLocaleString("en-IN")}`}
          />
          <AdminKPICard
            title="Online Revenue"
            value={`₹${kpis.totalRevenue.toLocaleString("en-IN")}`}
          />
          <AdminKPICard
            title="Pending Revenue"
            value={`₹0`}
          />
          <AdminKPICard
            title="Total Bookings"
            value={kpis.totalBookings}
          />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <AdminStatusCard label="Pending" count={kpis.statusCounts.pending} color="yellow" />
          <AdminStatusCard label="Confirmed" count={kpis.statusCounts.confirmed} color="blue" />
          <AdminStatusCard label="In Transit" count={kpis.statusCounts.inTransit} color="purple" />
          <AdminStatusCard label="Delivered" count={kpis.statusCounts.delivered} color="green" />
          <AdminStatusCard label="Cancelled" count={kpis.statusCounts.cancelled} color="red" />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {(["bookings", "drivers", "subs", "coupons", "bulk", "wallet"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">
                Bookings ({filteredBookings.length}/{orders.length})
              </h2>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order ID, customer..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPageNum(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPageNum(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="inTransit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div></div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Order ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Address</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Phone</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Water Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Size</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/orders`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            #{order.order_code}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{order.customer_name}</td>
                        <td className="px-4 py-3 text-gray-700 truncate max-w-xs">{order.address_text}</td>
                        <td className="px-4 py-3 text-gray-700">{order.customer_phone}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {WATER_TYPE_LABEL[order.water_type as keyof typeof WATER_TYPE_LABEL]}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{order.size_l}L</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : ["on_the_way", "reached"].includes(order.status)
                                ? "bg-purple-100 text-purple-800"
                                : order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{order.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        {loading ? "Loading..." : "No bookings found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {(pageNum - 1) * pageSize + 1} to{" "}
                  {Math.min(pageNum * pageSize, filteredBookings.length)} of {filteredBookings.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPageNum(Math.max(1, pageNum - 1))}
                    disabled={pageNum === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageToShow = Math.max(1, pageNum - 2) + i;
                      if (pageToShow > totalPages) return null;
                      return (
                        <button
                          key={pageToShow}
                          onClick={() => setPageNum(pageToShow)}
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            pageNum === pageToShow
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageToShow}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPageNum(Math.min(totalPages, pageNum + 1))}
                    disabled={pageNum === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Tabs */}
        {activeTab !== "bookings" && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            <p>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} section coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
