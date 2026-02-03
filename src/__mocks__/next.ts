const mockRouter = {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
};

export const useRouter = () => mockRouter;
export const usePathname = () => "";
export const useSearchParams = () => new URLSearchParams();
