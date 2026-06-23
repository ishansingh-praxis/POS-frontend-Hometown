import { Link as RouterLink, useLocation, useNavigate as useRRNavigate } from "react-router-dom";
import type { ComponentProps } from "react";

export type LinkProps = ComponentProps<typeof RouterLink>;
export const Link = RouterLink;

type NavigateInput = string | {
  to?: string;
  search?: Record<string, string | number | boolean | undefined>;
  replace?: boolean;
};

export function useNavigate() {
  const navigate = useRRNavigate();
  return (input: NavigateInput) => {
    if (typeof input === "string") return navigate(input);
    const to = input.to || "/";
    const search = input.search
      ? "?" + new URLSearchParams(
          Object.entries(input.search)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : "";
    return navigate(`${to}${search}`, { replace: Boolean(input.replace) });
  };
}

export function useRouterState<T = unknown>({ select }: { select: (state: { location: { pathname: string; search: string } }) => T }) {
  const location = useLocation();
  return select({ location: { pathname: location.pathname, search: location.search } });
}

export function useSearch(_options?: { from?: string }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => { result[key] = value; });
  return result;
}
