import { Column } from "@ant-design/plots";

export interface BarItem {
  brand: string;
  sales: number;
}

const STATIC_FALLBACK: BarItem[] = [
  { brand: "Product A", sales: 12 },
  { brand: "Product B", sales: 20 },
  { brand: "Product C", sales: 15 },
  { brand: "Product D", sales: 18 },
];

const COLOR_PALETTE = [
  "#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6",
  "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

export default function Bargraph({ data }: { data?: BarItem[] }) {
  const chartData = data && data.length > 0 ? data : STATIC_FALLBACK;

  const config = {
    data: chartData,
    xField: "brand",
    yField: "sales",
    colorField: "brand",
    legend: false,
    style: { maxWidth: 40, inset: 5 },
    scale: { color: { range: COLOR_PALETTE } },
    axis: { y: null },
    xAxis: { label: { style: { textAlign: "center" } } },
  };

  return <Column {...config} />;
}
