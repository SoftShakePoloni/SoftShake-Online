import React from 'react';
export function usePathname() { return new URLSearchParams(location.search).get('path') || '/admin'; }
const router = { prefetch() {}, refresh() {}, push(path: string) { location.search = '?path=' + path; } };
export function useRouter() { return router; }
export function useLinkStatus() { return { pending: false }; }
export default function Link({href, prefetch, scroll, children, ...props}: any) { return <a href={'?path='+href} {...props}>{children}</a>; }
