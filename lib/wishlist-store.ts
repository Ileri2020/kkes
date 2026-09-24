import { getUserWishlist } from "@/action/wishlist";

let wishlistCache: string[] | null = null;
let wishlistPromise: Promise<string[]> | null = null;

export const fetchGlobalWishlist = async (): Promise<string[]> => {
    if (typeof window === 'undefined') {
        // On server, always fetch direct
        return getUserWishlist();
    }

    if (wishlistCache) return wishlistCache;

    if (!wishlistPromise) {
        wishlistPromise = getUserWishlist().then(res => {
            wishlistCache = res;
            return res;
        }).catch(err => {
            wishlistPromise = null;
            return [];
        });
    }

    return wishlistPromise;
};

export const clearWishlistCache = () => {
    wishlistCache = null;
    wishlistPromise = null;
};
