import { ReactNode } from "react";
import { XIcon } from "./icons";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    isWide?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, footer, isWide = false }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className={`modal ${isWide ? "modal-wide" : ""}`}>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <XIcon />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
