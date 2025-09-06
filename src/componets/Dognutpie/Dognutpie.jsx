import { Pie } from "@ant-design/plots";
export default function Dognutpie() {
  const data = [
    {
      brand: "Paracetamol",
      sales: 120,
    },
    {
      brand: "Amoxicillin",
      sales: 200,
    },
    {
      brand: "Ciprofloxacin",
      sales: 150,
    },
    {
      brand: "Ibuprofen",
      sales: 180,
    },
    {
      brand: "Metformin",
      sales: 220,
    },
    {
      brand: "Omeprazole",
      sales: 190,
    },
    {
      brand: "Aspirin",
      sales: 90,
    },
    {
      brand: "Naproxen",
      sales: 110,
    },
    {
      brand: "Gabapentin",
      sales: 140,
    },
  ];
  const config = {
    data,
    angleField: "sales",
    colorField: "brand",
    innerRadius: 0.7,
    radius: 1,
    legend: {
      color: {
        title: false,
        position: "right",
        rowPadding: 5,
      },
    },

    annotations: [
      {
        type: "text",
        style: {
          text: "Detailing\nTime Spent",
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
