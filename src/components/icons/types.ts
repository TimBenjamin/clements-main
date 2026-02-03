import { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number;
    color?: string;
    isFilled?: boolean;
    hasBorder?: boolean;
    fillColor?: string;
    borderColor?: string;
    fillVar?:
        | "--color-primary"
        | "--color-primary-dark"
        | "--color-primary-light"
        | "--color-secondary"
        | "--color-secondary-dark"
        | "--color-secondary-light"
        | "--color-text"
        | "--color-text-light"
        | "--color-text-dark"
        | "--color-border"
        | "--color-border-dark"
        | string;
    borderVar?:
        | "--color-primary"
        | "--color-primary-dark"
        | "--color-primary-light"
        | "--color-secondary"
        | "--color-secondary-dark"
        | "--color-secondary-light"
        | "--color-text"
        | "--color-text-light"
        | "--color-text-dark"
        | "--color-border"
        | "--color-border-dark"
        | string;
}
