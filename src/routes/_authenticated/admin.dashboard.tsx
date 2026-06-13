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
  Users,
  Gift,
  Package2,
  CreditCard,
  Trash2,
  Edit2,
  Plus,
  Check,
  AlertCircle,
  Zap,
} from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
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

type Driver = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  vehicle_no: string;
  status: "active" | "inactive" | "suspended";
  verified: boolean;
  total_deliveries: number;
  total_earnings: number;
  created_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  plan_type: string;
  status: "active" | "inactive" | "expired";
  start_date: string;
  end_date: string;
  amount: number;
  created_at: string;
};

type Coupon = {
  id: string;
  code: string;
  discount_pct: number;
  max_uses: number;
  used_count: number;
  expiry_date: string;
  status: "active" | "inactive";
  created_at: string;
};

type BulkOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  quantity_l: number;
  total: number;
  delivery_date: string;
  created_at: string;
};

type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  customer_name: string;
  created_at: string;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "drivers" | "subs" | "coupons" | "bulk" | "wallet">("bookings");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [exporting, setExporting] = useState(false);
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

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, driversRes, subsRes, couponsRes, bulkRes, walletsRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("drivers").select("*").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("bulk_orders").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("wallets").select("id, user_id, balance, created_at").order("created_at", { ascending: false }).limit(100),
      ]);

      if (ordersRes.data) setOrders((ordersRes.data as Order[]) || []);
      if (driversRes.data) setDrivers((driversRes.data as Driver[]) || []);
      if (subsRes.data) setSubscriptions((subsRes.data as Subscription[]) || []);
      if (couponsRes.data) setCoupons((couponsRes.data as Coupon[]) || []);
      if (bulkRes.data) setBulkOrders((bulkRes.data as BulkOrder[]) || []);
      if (walletsRes.data) {
        const walletsWithNames = await Promise.all(
          (walletsRes.data as any[]).map(async (w) => {
            const { data: userData } = await supabase.auth.admin?.getUserById(w.user_id) || {};
            return { ...w, customer_name: userData?.user_metadata?.full_name || "Unknown" } as Wallet;
          })
        );
        setWallets(walletsWithNames);
      }

      if (ordersRes.error) throw ordersRes.error;
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      void loadAllData();
    }
  }, [isAdmin]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void loadAllData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
        void loadAllData();
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
    void loadAllData();
    toast.success("Dashboard refreshed");
  };

  const handleExportPDF = () => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 10;

      // Title
      doc.setFontSize(16);
      doc.text("Admin Dashboard Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 8;

      // KPIs Section
      doc.setFontSize(12);
      doc.text("Key Performance Indicators", 10, yPos);
      yPos += 6;

      doc.setFontSize(9);
      const kpiText = [
        `Total Revenue: ₹${kpis.totalRevenue.toLocaleString("en-IN")}`,
        `Today's Revenue: ₹${kpis.todayRevenue.toLocaleString("en-IN")}`,
        `Platform Commission (15%): ₹${kpis.commission.toLocaleString("en-IN")}`,
        `Net Profit: ₹${kpis.netProfit.toLocaleString("en-IN")}`,
        `Total Bookings: ${kpis.totalBookings}`,
      ];
      kpiText.forEach((text) => {
        doc.text(text, 15, yPos);
        yPos += 5;
      });

      // Order Status Summary
      yPos += 5;
      doc.setFontSize(12);
      doc.text("Order Status Summary", 10, yPos);
      yPos += 6;

      doc.setFontSize(9);
      const statusText = [
        `Pending: ${kpis.statusCounts.pending}`,
        `Confirmed: ${kpis.statusCounts.confirmed}`,
        `In Transit: ${kpis.statusCounts.inTransit}`,
        `Delivered: ${kpis.statusCounts.delivered}`,
        `Cancelled: ${kpis.statusCounts.cancelled}`,
      ];
      statusText.forEach((text) => {
        doc.text(text, 15, yPos);
        yPos += 5;
      });

      // Recent Orders Table
      if (filteredBookings.length > 0) {
        yPos += 8;
        doc.setFontSize(12);
        doc.text("Recent Orders", 10, yPos);
        yPos += 6;

        const tableData = filteredBookings.slice(0, 10).map((o) => [
          o.order_code,
          o.customer_name.substring(0, 15),
          o.status,
          `₹${o.total}`,
        ]);

        (doc as any).autoTable({
          startY: yPos,
          head: [["Order ID", "Customer", "Status", "Amount"]],
          body: tableData,
          margin: 10,
          styles: { fontSize: 8 },
        });
      }

      doc.save(`admin-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["Admin Dashboard Report"],
        [],
        ["Key Metrics", "Value"],
        ["Total Revenue", kpis.totalRevenue],
        ["Today's Revenue", kpis.todayRevenue],
        ["Platform Commission (15%)", kpis.commission],
        ["Net Profit", kpis.netProfit],
        ["Total Bookings", kpis.totalBookings],
        [],
        ["Order Status", "Count"],
        ["Pending", kpis.statusCounts.pending],
        ["Confirmed", kpis.statusCounts.confirmed],
        ["In Transit", kpis.statusCounts.inTransit],
        ["Delivered", kpis.statusCounts.delivered],
        ["Cancelled", kpis.statusCounts.cancelled],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Orders Sheet
      if (orders.length > 0) {
        const ordersData = orders.map((o) => [
          o.order_code,
          o.customer_name,
          o.customer_phone,
          o.status,
          o.water_type,
          o.size_l,
          o.total,
          new Date(o.created_at).toLocaleDateString("en-IN"),
        ]);
        const ordersSheet = XLSX.utils.aoa_to_sheet([
          ["Order ID", "Customer", "Phone", "Status", "Water Type", "Size (L)", "Amount", "Created At"],
          ...ordersData,
        ]);
        XLSX.utils.book_append_sheet(workbook, ordersSheet, "Orders");
      }

      // Drivers Sheet
      if (drivers.length > 0) {
        const driversData = drivers.map((d) => [
          d.name,
          d.phone,
          d.vehicle_no,
          d.status,
          d.verified ? "Yes" : "No",
          d.total_deliveries,
          d.total_earnings,
        ]);
        const driversSheet = XLSX.utils.aoa_to_sheet([
          ["Name", "Phone", "Vehicle", "Status", "Verified", "Deliveries", "Earnings"],
          ...driversData,
        ]);
        XLSX.utils.book_append_sheet(workbook, driversSheet, "Drivers");
      }

      XLSX.writeFile(workbook, `admin-report-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setExporting(false);
    }
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
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-60"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                PDF Report
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-60"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
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

        {/* Drivers Tab */}
        {activeTab === "drivers" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Drivers ({drivers.length})</h2>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search drivers by name, phone, or vehicle..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Phone</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Vehicle</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-900">Verified</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Deliveries</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.length > 0 ? (
                    drivers.map((driver) => (
                      <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{driver.name}</td>
                        <td className="px-4 py-3 text-gray-700">{driver.phone}</td>
                        <td className="px-4 py-3 text-gray-700">{driver.vehicle_no}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              driver.status === "active"
                                ? "bg-green-100 text-green-800"
                                : driver.status === "suspended"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {driver.verified ? (
                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">{driver.total_deliveries}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{driver.total_earnings.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No drivers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === "subs" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Subscriptions ({subscriptions.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-blue-900">
                  {subscriptions.filter((s) => s.status === "active").length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Subscription Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{subscriptions.reduce((sum, s) => sum + (s.status === "active" ? s.amount : 0), 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-purple-900">{subscriptions.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Plan Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Start Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">End Date</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length > 0 ? (
                    subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{sub.plan_type}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sub.status === "active"
                                ? "bg-green-100 text-green-800"
                                : sub.status === "expired"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(sub.start_date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(sub.end_date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{sub.amount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No subscriptions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Coupons ({coupons.length})</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                <Plus className="h-4 w-4" />
                Add Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Active Coupons</p>
                <p className="text-2xl font-bold text-blue-900">
                  {coupons.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Total Uses</p>
                <p className="text-2xl font-bold text-purple-900">{coupons.reduce((sum, c) => sum + c.used_count, 0)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600">Capacity Left</p>
                <p className="text-2xl font-bold text-orange-900">
                  {coupons.reduce((sum, c) => sum + (c.max_uses - c.used_count), 0)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Code</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-900">Discount</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-900">Uses</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Expiry</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length > 0 ? (
                    coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{coupon.code}</td>
                        <td className="px-4 py-3 text-center text-gray-900">{coupon.discount_pct}%</td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {coupon.used_count}/{coupon.max_uses}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(coupon.expiry_date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              coupon.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button className="p-1 hover:bg-blue-100 rounded transition-colors">
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </button>
                            <button className="p-1 hover:bg-red-100 rounded transition-colors">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No coupons found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bulk Orders Tab */}
        {activeTab === "bulk" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package2 className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Bulk Orders ({bulkOrders.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total Bulk Orders</p>
                <p className="text-2xl font-bold text-blue-900">{bulkOrders.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Volume</p>
                <p className="text-2xl font-bold text-green-900">
                  {bulkOrders.reduce((sum, b) => sum + b.quantity_l, 0).toLocaleString("en-IN")} L
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{bulkOrders.reduce((sum, b) => sum + b.total, 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Phone</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Volume (L)</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Delivery Date</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkOrders.length > 0 ? (
                    bulkOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{order.customer_name}</td>
                        <td className="px-4 py-3 text-gray-700">{order.customer_phone}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{order.quantity_l.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(order.delivery_date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{order.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No bulk orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Customer Wallets ({wallets.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Total Wallets</p>
                <p className="text-2xl font-bold text-blue-900">{wallets.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Balance</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Avg Balance</p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{(wallets.length > 0 ? Math.round(wallets.reduce((sum, w) => sum + w.balance, 0) / wallets.length) : 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Customer Name</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Balance</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.length > 0 ? (
                    wallets.map((wallet) => (
                      <tr key={wallet.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{wallet.customer_name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{wallet.balance.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(wallet.created_at).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No wallets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
