import React from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");

interface ChartSectionProps {
  title: string;
  data: any[];
  type?: "line" | "bar" | "pie";
}

const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  data,
  type = "bar",
}) => {
  return (
    <View className="mb-8 rounded-3xl bg-white p-6 shadow-sm shadow-gray-200">
      <Text className="mb-6 text-lg font-bold text-gray-900">{title}</Text>

      <View className="items-center">
        {type === "bar" ? (
          <BarChart
            data={data}
            width={width - 100}
            noOfSections={3}
            barWidth={22}
            capRadius={4}
            barBorderRadius={4}
            frontColor="#F25E86"
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
            isAnimated={false}
            yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
          />
        ) : type === "line" ? (
          <LineChart
            data={data}
            width={width - 100}
            color="#3B82F6"
            thickness={3}
            startFillColor="rgba(59, 130, 246, 0.3)"
            endFillColor="rgba(59, 130, 246, 0.01)"
            startOpacity={0.9}
            endOpacity={0.2}
            initialSpacing={10}
            noOfSections={3}
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
            isAnimated={false}
            yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
          />
        ) : (
          <PieChart
            data={data.map(item => ({
              value: item.value,
              color: item.color || "#3B82F6",
              text: item.label
            }))}
            radius={80}
            innerRadius={60}
            innerCircleColor={'#ffffff'}
            centerLabelComponent={() => (
              <View className="items-center justify-center">
                <Text className="text-sm font-bold text-gray-900">Total</Text>
                <Text className="text-xs text-gray-400">{data.reduce((acc, curr) => acc + curr.value, 0)}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default ChartSection;
