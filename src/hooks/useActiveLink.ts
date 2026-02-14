import { useLocation } from 'react-router-dom';

/**
 * Returns a className helper that highlights the active nav link
 * Usage: const linkClass = useActiveLink();
 *        <Link className={linkClass('/shop')}>SHOP</Link>
 */
export function useActiveLink() {
    const location = useLocation();

    return (path: string) =>
        `no-underline text-sm font-semibold transition-colors ${location.pathname === path ? 'text-primary' : 'text-gray-700 hover:text-green-700'
        }`;
}
