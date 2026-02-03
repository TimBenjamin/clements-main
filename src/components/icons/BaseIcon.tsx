import { IconProps } from "./types";

export const BaseIcon = ({
    size = 24,
    color = "currentColor",
    isFilled = false,
    hasBorder = true,
    fillColor,
    borderColor,
    fillVar,
    borderVar,
    children,
    ...props
}: IconProps & { children: React.ReactNode }) => {
    const fill = (() => {
        if (!isFilled) return "none";
        if (fillVar) return `var(${fillVar})`;
        if (fillColor) return fillColor;
        return color;
    })();

    const stroke = (() => {
        if (!hasBorder) return "none";
        if (borderVar) return `var(${borderVar})`;
        if (borderColor) return borderColor;
        if (fillVar) return `var(${fillVar})`;
        if (fillColor) return fillColor;
        return color;
    })();

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            {children}
        </svg>
    );
};
