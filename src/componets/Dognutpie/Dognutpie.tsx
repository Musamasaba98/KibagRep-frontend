import { Pie } from "@ant-design/plots";

export interface PieItem {
  brand: string;
  sales: number;
}

const STATIC_FALLBACK: PieItem[] = [
  { brand: "Product A", sales: 12 },
  { brand: "Product B", sales: 20 },
  { brand: "Product C", sales: 15 },
  { brand: "Product D", sales: 18 },
];

export default function Dognutpie({ data }: { data?: PieItem[] }) {
  const chartData = data && data.length > 0 ? data : STATIC_FALLBACK;

  const config = {
    data: chartData,
    angleField: "sales",
    colorField: "brand",
    innerRadius: 0.7,
    radius: 1,
    legend: {
      color: { title: false, position: "right", rowPadding: 5 },
    },
    annotations: [
      {
        type: "text",
        style: {
          text: "Detailing\nThis Month",
          x: "50%",
          y: "50%",
          textAlign: "center",
          fontSize: 10,
          fontStyle: "bold",
        },
      },
    ],
  };

  return <Pie {...config} />;
}
