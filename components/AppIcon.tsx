import { Feather } from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";
import { Platform } from "react-native";

export type AppIconName =
  | "alert-circle"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "book-open"
  | "download"
  | "trash-2"
  | "check"
  | "info"
  | "chevron-left"
  | "chevron-right"
  | "home"
  | "list"
  | "minus"
  | "plus"
  | "repeat"
  | "search"
  | "sun"
  | "moon"
  | "x";

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const paths = {
  "arrow-left": "M19 12H5M12 19L5 12L12 5",
  "arrow-right": "M5 12H19M12 5L19 12L12 19",
  "arrow-up": "M12 19V5M5 12L12 5L19 12",
  "chevron-left": "M15 18L9 12L15 6",
  "chevron-right": "M9 18L15 12L9 6",
  plus: "M12 5V19M5 12H19",
  minus: "M5 12H19",
  repeat:
    "M17 1L21 5L17 9M3 11V9C3 6.8 4.8 5 7 5H21M7 23L3 19L7 15M21 13V15C21 17.2 19.2 19 17 19H3",
  x: "M6 6L18 18M18 6L6 18",
  "trash-2": "M3 6H21M8 6V4H16V6M6 6L7 20H17L18 6M10 10V17M14 10V17",
  check: "M5 12L10 17L19 7",
  info: "M12 16V11M12 8H12.01",
} as const;

export function AppIcon({
  name,
  size = 20,
  color = "#E8E0CC",
  strokeWidth = 1.9,
}: AppIconProps) {
  if (Platform.OS !== "android") {
    return (
      <Feather
        name={name as keyof typeof Feather.glyphMap}
        size={size}
        color={color}
      />
    );
  }

  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === "search" ? (
        <>
          <Circle cx="10.8" cy="10.8" r="6.8" {...common} />
          <Path d="M16 16L21 21" {...common} />
        </>
      ) : name === "list" ? (
        <>
          <Path d="M9 6H20M9 12H20M9 18H20" {...common} />
          <Path d="M4 6H4.01M4 12H4.01M4 18H4.01" {...common} />
        </>
      ) : name === "book-open" ? (
        <Path
          d="M3.5 5.5C6.35 4.7 9.25 5.25 12 7.2C14.75 5.25 17.65 4.7 20.5 5.5V19C17.65 18.2 14.75 18.75 12 20.7C9.25 18.75 6.35 18.2 3.5 19V5.5ZM12 7.2V20.7"
          {...common}
        />
      ) : name === "home" ? (
        <Path
          d="M3.5 10.5L12 3.5L20.5 10.5V20H14.5V14H9.5V20H3.5V10.5Z"
          {...common}
        />
      ) : name === "alert-circle" ? (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M12 8V12.5M12 16H12.01" {...common} />
        </>
      ) : name === "sun" ? (
        <>
          <Circle cx="12" cy="12" r="4" {...common} />
          <Path
            d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93"
            {...common}
          />
        </>
      ) : name === "moon" ? (
        <Path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5A8.5 8.5 0 1 0 20.5 15.3Z" {...common} />
      ) : name === "download" ? (
        <>
          <Path d="M12 3V15M7 10L12 15L17 10M5 20H19" {...common} />
        </>
      ) : (
        <Path d={paths[name]} {...common} />
      )}
    </Svg>
  );
}