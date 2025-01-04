import { Column } from "@ant-design/plots";
export default function Bargraph() {
  const data = [
    {
      brand: "Pcm",
      sales: 120,
    },
    {
      brand: "Amoxyl",
      sales: 200,
    },
    {
      brand: "Cipro",
      sales: 150,
    },
    {
      brand: "Ibup",
      sales: 180,
    },
    {
      brand: "Metf",
      sales: 220,
    },
    {
      brand: "Omep",
      sales: 190,
    },
    {
      brand: "Asp",
      sales: 90,
    },
    {
      brand: "Nap",
      sales: 100,
    },
    {
      brand: "Gaba",
      sales: 140,
    },
  ];
  const COLOR_PALETTE = [
    "#ff0000",
    "#0dcccc",
    "#f18e56",
    "#d787ff",
    "#7f6bff",
    "#68c738",
    "#c1952f",
    "#ff87cd",
    "#2f97b7",
  ];
  const config = {
    data,
    xField: "brand",
    yField: "sales",
    colorField: "brand",
    legend: false,
    style: {
      maxWidth: 40,
      inset: 5,
    },
    scale: {
      color: COLOR_PALETTE,
    },
    yAxis: {
      grid: { line: { style: { lineWidth: 0 } } },
    },
    axis: {
      y: null,
    },
    xAxis: {
      label: {
        style: { textAlign: "center" },
      },
    },
  };
  return <Column {...config} />;
}
