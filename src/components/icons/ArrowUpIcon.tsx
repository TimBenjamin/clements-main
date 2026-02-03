import { BaseIcon } from "./BaseIcon";
import { IconProps } from "./types";

export const ArrowUpIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
    </BaseIcon>
);
