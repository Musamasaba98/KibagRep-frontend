import { Line } from "@ant-design/plots";
import { visitsTrendData } from "../../../data";
import { Bar } from "@ant-design/plots";

const VisitsTrendCont = () => {

    const teamSalesData = [
  { supervisor: "Alice", rep: "John", sales: 50 },
  { supervisor: "Alice", rep: "Mary", sales: 30 },
  { supervisor: "Bob", rep: "Tom", sales: 70 },
  { supervisor: "Bob", rep: "Sara", sales: 40 },
];


  const config_one = {
    data: visitsTrendData,
    xField: "date",
    yField: "value",
    seriesField: "type",
    smooth: true,
    height:300,
    point: {
      size: 5,
      shape: "circle",
    },
   color: ["#E49B0F","#4096FF"],
    legend: {
      position: "top",
    },
    yAxis: {
      title: { text: "Number of Visits" },
    },
    xAxis: {
      title: { text: "Date" },
    },
  };

   const config = {
    data: teamSalesData,
    height:300,
    isStack: true,       // enables stacked bars
    xField: "sales",      // values
    yField: "supervisor", // groups bars by supervisor
    seriesField: "rep",   // stack parts by rep
    legend: { position: "top-left" },
  };

  return (
    <div className="w-full flex gap-5 mt-8">
      {/* THE VISITS TREND */}
      <div className="bg-white h- w-[50%] p-4 shadow-md rounded-md">
        <h1 className="font-semibold text-lg mb-3">Weekly visits Trend</h1>
        <Line {...config_one} />
      </div>

      
    </div>
  );
};

export default VisitsTrendCont;
