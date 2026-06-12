import { Circle } from "lucide-react";

interface AdminStatusCardProps {
  label: string;
  count: number;
  color: "yellow" | "blue" | "purple" | "green" | "red";
}

const colorMap = {
  yellow: { bg: "bg-yellow-50", dot: "text-yellow-500", text: "text-yellow-700" },
  blue: { bg: "bg-blue-50", dot: "text-blue-500", text: "text-blue-700" },
  purple: { bg: "bg-purple-50", dot: "text-purple-500", text: "text-purple-700" },
  green: { bg: "bg-green-50", dot: "text-green-500", text: "text-green-700" },
  red: { bg: "bg-red-50", dot: "text-red-500", text: "text-red-700" },
};

export function AdminStatusCard({ label, count, color }: AdminStatusCardProps) {
  const colors = colorMap[color];
  return (
    <div className={`rounded-lg p-6 ${colors.bg} text-center`}>
      <div className="flex justify-center mb-2">
        <Circle className={`h-5 w-5 fill-current ${colors.dot}`} />
      </div>
      <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
      <p className={`text-sm ${colors.text} opacity-75`}>{label}</p>
    </div>
  );
}
