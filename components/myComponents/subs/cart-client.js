'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartClient = CartClient;
var React = require("react");
var link_1 = require("next/link");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var badge_1 = require("@/components/ui/badge");
var input_1 = require("@/components/ui/input");
var sheet_1 = require("@/components/ui/sheet");
var drawer_1 = require("@/components/ui/drawer");
var use_cart_1 = require("@/hooks/use-cart");
var use_media_query_1 = require("@/hooks/use-media-query");
var useAppContext_1 = require("@/hooks/useAppContext");
var utils_1 = require("@/lib/utils");
var stock_pricing_1 = require("@/lib/stock-pricing");
var axios_1 = require("axios");
var sonner_1 = require("sonner");
// Payment Components
var monnify_1 = require("../../payment/monnify");
var manual_1 = require("../../payment/manual");
var AddressEdit_1 = require("./AddressEdit");
var AffiliateDialog_1 = require("./AffiliateDialog");
var login_1 = require("./login");
var signup_1 = require("./signup");
var TermsAgreements_1 = require("./TermsAgreements");
var affiliate_tracking_1 = require("@/lib/affiliate-tracking");
function CartClient(_a) {
    var _this = this;
    var _b, _c, _d;
    var className = _a.className, _unusedCart = _a.cart;
    var _e = (0, use_cart_1.useCart)(), items = _e.items, removeItem = _e.removeItem, clearCart = _e.clearCart, subtotal = _e.subtotal, updateQuantity = _e.updateQuantity, itemCount = _e.itemCount;
    var _f = (0, useAppContext_1.useAppContext)(), user = _f.user, setUser = _f.setUser, checkoutData = _f.checkoutData, setCheckoutData = _f.setCheckoutData;
    var _g = React.useState(false), isOpen = _g[0], setIsOpen = _g[1];
    var _h = React.useState(false), isMounted = _h[0], setIsMounted = _h[1];
    var _j = React.useState(false), isCheckingOut = _j[0], setIsCheckingOut = _j[1];
    var _k = React.useState(""), couponInput = _k[0], setCouponInput = _k[1];
    var _l = React.useState(null), appliedCoupon = _l[0], setAppliedCoupon = _l[1];
    var _m = React.useState(false), isValidatingCoupon = _m[0], setIsValidatingCoupon = _m[1];
    var _o = React.useState(100), deliveryFee = _o[0], setDeliveryFee = _o[1];
    var _p = React.useState(true), withDelivery = _p[0], setWithDelivery = _p[1];
    var _q = React.useState(null), pendingAutoMethod = _q[0], setPendingAutoMethod = _q[1];
    var _r = React.useState(null), savedCartMeta = _r[0], setSavedCartMeta = _r[1];
    var _s = React.useState(!!((user === null || user === void 0 ? void 0 : user.acceptedTerms) && (user === null || user === void 0 ? void 0 : user.acceptedPrivacy) && (user === null || user === void 0 ? void 0 : user.acceptedReturns))), termsAccepted = _s[0], setTermsAccepted = _s[1];
    var monnifyRef = React.useRef(null);
    var manualRef = React.useRef(null);
    var isDesktop = (0, use_media_query_1.useMediaQuery)("(min-width: 768px)");
    var _t = React.useState((_d = (_c = (_b = user === null || user === void 0 ? void 0 : user.addresses) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null), selectedAddressId = _t[0], setSelectedAddressId = _t[1];
    var savedCartStorageKey = React.useMemo(function () { return ((user === null || user === void 0 ? void 0 : user.id) && user.id !== 'nil' ? "hc_saved_cart_".concat(user.id) : null); }, [user === null || user === void 0 ? void 0 : user.id]);
    React.useEffect(function () {
        if (!savedCartStorageKey) {
            setSavedCartMeta(null);
            return;
        }
        try {
            var raw = localStorage.getItem(savedCartStorageKey);
            if (!raw)
                return;
            var parsed = JSON.parse(raw);
            if ((parsed === null || parsed === void 0 ? void 0 : parsed.cartId) &&
                (parsed === null || parsed === void 0 ? void 0 : parsed.snapshot) &&
                (parsed === null || parsed === void 0 ? void 0 : parsed.tx_ref) &&
                typeof parsed.amount === 'number') {
                setSavedCartMeta(parsed);
            }
        }
        catch (error) {
            console.error('Failed to load saved cart metadata:', error);
        }
    }, [savedCartStorageKey]);
    React.useEffect(function () {
        if (!savedCartStorageKey)
            return;
        if (savedCartMeta) {
            localStorage.setItem(savedCartStorageKey, JSON.stringify(savedCartMeta));
        }
        else {
            localStorage.removeItem(savedCartStorageKey);
        }
    }, [savedCartStorageKey, savedCartMeta]);
    React.useEffect(function () {
        if (!checkoutData && savedCartMeta) {
            setCheckoutData({
                cartId: savedCartMeta.cartId,
                tx_ref: savedCartMeta.tx_ref,
                amount: savedCartMeta.amount,
                currency: 'NGN',
            });
        }
    }, [checkoutData, savedCartMeta, setCheckoutData]);
    React.useEffect(function () {
        var fetchDeliveryFee = function () { return __awaiter(_this, void 0, void 0, function () {
            var addr, res, fees, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!selectedAddressId || !(user === null || user === void 0 ? void 0 : user.addresses))
                            return [2 /*return*/];
                        addr = user.addresses.find(function (a) { return a.id === selectedAddressId; });
                        if (!(addr === null || addr === void 0 ? void 0 : addr.state))
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.get("/api/dbhandler?model=deliveryFee&state=".concat(addr.state))];
                    case 2:
                        res = _a.sent();
                        fees = Array.isArray(res.data) ? res.data : [];
                        if (fees.length > 0) {
                            setDeliveryFee(fees[0].price);
                        }
                        else {
                            setDeliveryFee(100); // Default NGN 100 as requested for now
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.error("Failed to fetch delivery fee", err_1);
                        setDeliveryFee(100);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchDeliveryFee();
    }, [selectedAddressId, user === null || user === void 0 ? void 0 : user.addresses]);
    // The delivery fee is already in the state
    var subtotalRounded = (0, stock_pricing_1.roundUpToNearest5)(subtotal);
    var deliveryFeeRounded = withDelivery ? (0, stock_pricing_1.roundUpToNearest5)(deliveryFee) : 0;
    var discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
            discountAmount = (subtotalRounded * appliedCoupon.discount) / 100;
        }
        else {
            discountAmount = appliedCoupon.discount;
        }
    }
    var discountAmountRounded = (0, stock_pricing_1.roundUpToNearest5)(discountAmount);
    var totalAmount = Math.max(0, (subtotalRounded - discountAmountRounded) + deliveryFeeRounded);
    var currentCartSnapshot = React.useMemo(function () {
        return JSON.stringify({
            items: items.map(function (i) { return ({
                id: i.id,
                quantity: i.quantity,
                bulkPriceId: i.bulkPriceId || null,
                customName: i.customName || null,
                customPrice: i.customPrice || null,
                isSpecial: !!i.isSpecial,
            }); }),
            selectedAddressId: selectedAddressId,
            withDelivery: withDelivery,
            couponCode: (appliedCoupon === null || appliedCoupon === void 0 ? void 0 : appliedCoupon.code) || null,
            discountAmountRounded: discountAmountRounded,
            deliveryFeeRounded: deliveryFeeRounded,
        });
    }, [items, selectedAddressId, withDelivery, appliedCoupon === null || appliedCoupon === void 0 ? void 0 : appliedCoupon.code, discountAmountRounded, deliveryFeeRounded]);
    var isCartUnchanged = (savedCartMeta === null || savedCartMeta === void 0 ? void 0 : savedCartMeta.snapshot) === currentCartSnapshot;
    var hasSavedCart = Boolean(savedCartMeta === null || savedCartMeta === void 0 ? void 0 : savedCartMeta.cartId);
    var showCheckoutButton = items.length > 0 && (!hasSavedCart || !isCartUnchanged);
    var showPaymentButtons = items.length > 0 && hasSavedCart && isCartUnchanged;
    var role = (user === null || user === void 0 ? void 0 : user.role) || "customer";
    var markup = stock_pricing_1.PRICE_MARKUPS[role] || 1.3;
    React.useEffect(function () {
        setIsMounted(true);
    }, []);
    // Sync termsAccepted when user data loads asynchronously
    React.useEffect(function () {
        if ((user === null || user === void 0 ? void 0 : user.acceptedTerms) && (user === null || user === void 0 ? void 0 : user.acceptedPrivacy) && (user === null || user === void 0 ? void 0 : user.acceptedReturns)) {
            setTermsAccepted(true);
        }
    }, [user === null || user === void 0 ? void 0 : user.acceptedTerms, user === null || user === void 0 ? void 0 : user.acceptedPrivacy, user === null || user === void 0 ? void 0 : user.acceptedReturns]);
    React.useEffect(function () {
        // Only fetch if undefined to prevent infinite loop on empty array
        if ((user === null || user === void 0 ? void 0 : user.id) && user.id !== 'nil' && user.addresses === undefined) {
            var fetchAddresses = function () { return __awaiter(_this, void 0, void 0, function () {
                var res, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, axios_1.default.get("/api/dbhandler?model=shippingAddress&userId=".concat(user.id))];
                        case 1:
                            res = _a.sent();
                            if (Array.isArray(res.data)) {
                                setUser(__assign(__assign({}, user), { addresses: res.data }));
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            err_2 = _a.sent();
                            console.error("Failed to fetch user addresses in cart", err_2);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            fetchAddresses();
        }
    }, [user, setUser]);
    React.useEffect(function () {
        var _a;
        if (!selectedAddressId && ((_a = user === null || user === void 0 ? void 0 : user.addresses) === null || _a === void 0 ? void 0 : _a.length)) {
            setSelectedAddressId(user.addresses[0].id);
        }
    }, [user === null || user === void 0 ? void 0 : user.addresses, selectedAddressId]);
    // Handle Automatic payment trigger after checkoutData is received
    // We use a separate effect for triggering the programmatic click to avoid re-render conflicts
    React.useEffect(function () {
        if (checkoutData && pendingAutoMethod) {
            var timer_1 = setTimeout(function () {
                var triggered = false;
                if ((pendingAutoMethod === 'monnify' || pendingAutoMethod === 'test') && monnifyRef.current) {
                    console.log("Auto-launching Monnify for:", checkoutData.tx_ref);
                    // CLOSE the cart dialog first to release body pointer-events block
                    setIsOpen(false);
                    // Slight further delay to let the Sheet/Drawer close transition finish
                    setTimeout(function () {
                        var _a;
                        (_a = monnifyRef.current) === null || _a === void 0 ? void 0 : _a.click();
                    }, 300);
                    triggered = true;
                }
                else if (pendingAutoMethod === 'manual' && manualRef.current) {
                    manualRef.current.click();
                    triggered = true;
                }
                if (triggered) {
                    // Reset after triggering click to prevent duplicate triggers
                    setPendingAutoMethod(null);
                }
            }, 500);
            return function () { return clearTimeout(timer_1); };
        }
    }, [checkoutData, pendingAutoMethod]);
    var initiateCheckout = function (forcedAmount) { return __awaiter(_this, void 0, void 0, function () {
        var payload, res, newMeta, err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(user === null || user === void 0 ? void 0 : user.id) || user.id === 'nil') {
                        sonner_1.toast.error("Please log in to checkout");
                        return [2 /*return*/];
                    }
                    if (!selectedAddressId) {
                        sonner_1.toast.error("Please select a delivery address");
                        return [2 /*return*/];
                    }
                    setIsCheckingOut(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    payload = {
                        userId: user.id,
                        cartId: savedCartMeta === null || savedCartMeta === void 0 ? void 0 : savedCartMeta.cartId,
                        items: items.map(function (i) { return ({
                            productId: i.id,
                            quantity: i.quantity,
                            bulkPriceId: i.bulkPriceId,
                            isSpecial: !!i.isSpecial,
                            customPrice: i.customPrice,
                            customName: i.customName
                        }); }),
                        deliveryFee: deliveryFee,
                        deliveryAddressId: selectedAddressId,
                        forcedAmount: forcedAmount,
                        couponCode: (appliedCoupon === null || appliedCoupon === void 0 ? void 0 : appliedCoupon.code) || null,
                        discountAmount: discountAmountRounded,
                        affiliateId: ((_a = (0, affiliate_tracking_1.getStoredAffiliateReferral)()) === null || _a === void 0 ? void 0 : _a.affiliateId) || null
                    };
                    return [4 /*yield*/, axios_1.default.post('/api/payment', payload)];
                case 2:
                    res = _c.sent();
                    if ((_b = res.data) === null || _b === void 0 ? void 0 : _b.cartId) {
                        newMeta = {
                            cartId: res.data.cartId,
                            snapshot: currentCartSnapshot,
                            tx_ref: res.data.tx_ref,
                            amount: res.data.amount,
                        };
                        setSavedCartMeta(newMeta);
                    }
                    setCheckoutData(res.data);
                    return [2 /*return*/, res.data];
                case 3:
                    err_3 = _c.sent();
                    console.error("Checkout failed:", err_3);
                    sonner_1.toast.error("Failed to initiate checkout");
                    setPendingAutoMethod(null);
                    return [3 /*break*/, 5];
                case 4:
                    setIsCheckingOut(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handlePaymentMethod = function (method) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPendingAutoMethod(method);
                    return [4 /*yield*/, initiateCheckout()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleAdminTest = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPendingAutoMethod('test');
                    return [4 /*yield*/, initiateCheckout(100)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleApplyCoupon = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, coupon, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!couponInput)
                        return [2 /*return*/];
                    setIsValidatingCoupon(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios_1.default.get("/api/dbhandler?model=coupon&code=".concat(couponInput))];
                case 2:
                    res = _a.sent();
                    coupon = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (!coupon || !coupon.active) {
                        sonner_1.toast.error("Invalid or inactive promo code");
                        setAppliedCoupon(null);
                    }
                    else if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
                        sonner_1.toast.error("This promo code has expired");
                        setAppliedCoupon(null);
                    }
                    else {
                        setAppliedCoupon(coupon);
                        sonner_1.toast.success("Coupon Applied: ".concat(coupon.type === 'percentage' ? coupon.discount + '%' : '₦' + coupon.discount, " off!"));
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_4 = _a.sent();
                    console.error("Coupon validation error", err_4);
                    sonner_1.toast.error("Failed to validate coupon");
                    return [3 /*break*/, 5];
                case 4:
                    setIsValidatingCoupon(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var CartTrigger = (<button_1.Button aria-label="Open cart" className="relative h-10 w-10 rounded-full" size="icon" variant="outline">
      <lucide_react_1.ShoppingCart className="h-5 w-5"/>
      {itemCount > 0 && (<badge_1.Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]" variant="default">
          {itemCount}
        </badge_1.Badge>)}
    </button_1.Button>);
    var CartContent = (<div className="flex flex-col h-full bg-background no-scrollbar overflow-hidden">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background z-20">
        <div>
          <div className="text-xl font-bold">Shopping Cart</div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">
            {itemCount === 0
            ? "Your cart is empty"
            : "You have ".concat(itemCount, " item").concat(itemCount !== 1 ? "s" : "", " in your cart")}
          </p>
        </div>
        {isDesktop ? (<sheet_1.SheetClose asChild>
            <button_1.Button size="icon" variant="ghost" className="rounded-full">
              <lucide_react_1.X className="h-5 w-5"/>
            </button_1.Button>
          </sheet_1.SheetClose>) : (<drawer_1.DrawerClose asChild>
             <button_1.Button size="icon" variant="ghost" className="rounded-full">
              <lucide_react_1.X className="h-5 w-5"/>
            </button_1.Button>
          </drawer_1.DrawerClose>)}
      </div>

      {/* 2 & 3. Scrollable Middle Area (Items + Actions) */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 flex flex-col">
        {/* Items Area */}
        <div className="px-6 py-4 bg-secondary/5 grow">
          {items.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <lucide_react_1.ShoppingCart className="h-16 w-16 text-muted-foreground mb-4"/>
            <h3 className="text-lg font-bold">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
            {isDesktop ? (<sheet_1.SheetClose asChild>
                <link_1.default href="/store"><button_1.Button>Browse Products</button_1.Button></link_1.default>
              </sheet_1.SheetClose>) : (<drawer_1.DrawerClose asChild>
                <link_1.default href="/store"><button_1.Button>Browse Products</button_1.Button></link_1.default>
              </drawer_1.DrawerClose>)}
          </div>) : (<div className="space-y-4">
             {items.map(function (item) {
                var _a, _b, _c;
                return (<div key={"".concat(item.id, "-").concat(item.bulkPriceId || 'single')} className="flex gap-4 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  <img alt={item.name} className="h-full w-full object-cover" src={(_c = (_a = item.img) !== null && _a !== void 0 ? _a : (_b = item.images) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : '/placeholder.jpg'}/>
                </div>
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                   <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                       <link_1.default className="text-sm font-bold truncate hover:text-primary transition-colors" href={"/products/".concat(item.id)} onClick={function () { return setIsOpen(false); }}>
                        {item.name}
                      </link_1.default>
                      <button className="text-muted-foreground hover:text-destructive p-1" onClick={function () { return removeItem(item.id, item.bulkPriceId); }}>
                        <lucide_react_1.X className="h-4 w-4"/>
                      </button>
                    </div>
                    <div className="flex gap-2">
                       <badge_1.Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-black">
                          {item.category ? (typeof item.category === 'string' ? item.category : item.category.name) : 'Medical'}
                       </badge_1.Badge>
                       {item.bulkName && (<badge_1.Badge variant="default" className="text-[9px] px-1 py-0 h-4 font-black">
                             {item.bulkName}
                          </badge_1.Badge>)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border rounded-lg bg-background">
                      <button className="p-1 hover:bg-muted rounded-l-lg transition-colors" disabled={item.quantity <= 1} onClick={function () { return updateQuantity(item.id, item.quantity - 1, item.bulkPriceId); }}>
                        <lucide_react_1.Minus className="h-3 w-3"/>
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button className="p-1 hover:bg-muted rounded-r-lg transition-colors" onClick={function () { return updateQuantity(item.id, item.quantity + 1, item.bulkPriceId); }}>
                        <lucide_react_1.Plus className="h-3 w-3"/>
                      </button>
                    </div>
                    <p className="text-sm font-black text-primary">
                      ₦{(0, stock_pricing_1.formatPrice)(item.price * markup * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>);
            })}
          </div>)}
      </div>

      {/* Actions Section (Now scrolls with items) */}
      {items.length > 0 && (<div className="border-t px-6 py-4 bg-background space-y-4 shadow-top shrink-0">
          {/* Address */}
          {(user === null || user === void 0 ? void 0 : user.id) !== 'nil' ? (<div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Delivery Address</label>
                <AddressEdit_1.AddressEdit triggerClassName={(!user.addresses || user.addresses.length === 0) ? "border-2 border-green-500 animate-pulse bg-transparent" : ""}/>
              </div>
              {user.addresses && user.addresses.length > 0 ? (<select className="w-full h-10 rounded-xl border px-3 text-xs font-bold bg-muted/20 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" value={selectedAddressId !== null && selectedAddressId !== void 0 ? selectedAddressId : ""} onChange={function (e) { return setSelectedAddressId(e.target.value); }}>
                  {user.addresses.map(function (address) { return (<option key={address.id} value={address.id}>
                      {[address.address, address.city, address.state].filter(Boolean).join(", ")}
                    </option>); })}
                </select>) : (<div className="p-3 rounded-xl border border-dashed border-red-300 bg-red-50 text-center">
                  <p className="text-[10px] font-bold text-red-600">No address found. Add one to proceed.</p>
                </div>)}
            </div>) : (<div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/10 flex flex-col items-center gap-3">
              <p className="text-xs font-black text-primary uppercase italic">Login to Complete Order</p>
              <div className="flex gap-4">
                <login_1.default />
                <signup_1.default />
              </div>
            </div>)}

          {/* Promo Code Input */}
          <div className="space-y-2 mt-4">
             <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <lucide_react_1.Ticket className="w-3 h-3 text-primary"/> Have a Promo Code?
             </label>
             <div className="flex gap-2">
                <input_1.Input placeholder="Enter code..." value={couponInput} onChange={function (e) { return setCouponInput(e.target.value.toUpperCase()); }} className="h-10 text-xs font-black uppercase tracking-widest"/>
                <button_1.Button size="sm" className="h-10 px-4 font-black" onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponInput}>
                    {isValidatingCoupon ? <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/> : 'APPLY'}
                </button_1.Button>
             </div>
             {appliedCoupon && (<div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] font-black text-green-700 uppercase">Code {appliedCoupon.code} Applied!</span>
                    <button onClick={function () { return setAppliedCoupon(null); }} className="text-[10px] font-black text-red-500 hover:scale-110 transition-transform">REMOVE</button>
                </div>)}
          </div>

           {/* Delivery Toggle */}
           <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Delivery Service</span>
                <span className="text-[9px] text-muted-foreground font-medium italic">Turn off for self-pickup</span>
              </div>
              <button_1.Button variant={withDelivery ? "default" : "outline"} size="sm" className={(0, utils_1.cn)("h-7 px-3 text-[9px] font-black uppercase tracking-widest transition-all", !withDelivery && "border-primary text-primary")} onClick={function () { return setWithDelivery(!withDelivery); }}>
                {withDelivery ? 'ADDED' : 'ADD DELIVERY'}
              </button_1.Button>
           </div>

           {/* Pricing Summary */}
           <div className="space-y-2 py-3 border-t border-b border-dashed">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                 <span>Subtotal</span>
                 <span>₦{(0, stock_pricing_1.formatPrice)(subtotalRounded)}</span>
              </div>
              {appliedCoupon && (<div className="flex justify-between text-xs font-bold text-green-600">
                     <span>Discount ({appliedCoupon.code})</span>
                     <span>-₦{(0, stock_pricing_1.formatPrice)(discountAmountRounded)}</span>
                  </div>)}
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                 <span>Delivery Charge</span>
                 <span>{withDelivery ? "\u20A6".concat((0, stock_pricing_1.formatPrice)(deliveryFeeRounded)) : 'FREE / PICKUP'}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-primary pt-1">
                 <span>Total Amount</span>
                 <span>₦{(0, stock_pricing_1.formatPrice)(totalAmount)}</span>
              </div>
           </div>

           {!((user === null || user === void 0 ? void 0 : user.acceptedTerms) && (user === null || user === void 0 ? void 0 : user.acceptedPrivacy) && (user === null || user === void 0 ? void 0 : user.acceptedReturns)) && (<TermsAgreements_1.TermsAgreements onAllAcceptedChange={setTermsAccepted}/>)}

          {/* Buttons Block */}
          {(user === null || user === void 0 ? void 0 : user.id) !== 'nil' && !isCheckingOut && (<div className="space-y-2">
              {showCheckoutButton && (<button_1.Button className="w-full h-11 rounded-xl font-black shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all gap-2" disabled={!selectedAddressId || !termsAccepted} onClick={function () { return handlePaymentMethod(null); }}>
                    <lucide_react_1.LayoutList className="w-4 h-4"/>
                    Checkout
                </button_1.Button>)}

              {showPaymentButtons && (<>
                  <div className="grid grid-cols-2 gap-2">
                    <button_1.Button className="w-full h-10 rounded-xl font-black border-2 border-primary/20 hover:bg-primary/5 transition-all gap-2 text-xs" disabled={!selectedAddressId || !termsAccepted} onClick={function () { return handlePaymentMethod('monnify'); }} variant="outline">
                      <lucide_react_1.CreditCard className="w-4 h-4 text-primary"/>
                      Monnify
                    </button_1.Button>

                    <button_1.Button className="w-full h-10 rounded-xl font-black border-2 border-primary/20 hover:bg-primary/5 transition-all gap-2 text-xs" disabled={!selectedAddressId || !termsAccepted} onClick={function () { return handlePaymentMethod('manual'); }} variant="outline">
                      <lucide_react_1.Landmark className="w-4 h-4 text-primary"/>
                      Bank Transfer
                    </button_1.Button>
                  </div>

                  {user.role === 'admin' && (<button_1.Button className="w-full h-10 rounded-xl font-black border-dashed border-2 border-amber-500 text-amber-600 hover:bg-amber-100 transition-all gap-2 text-xs" disabled={!selectedAddressId || !termsAccepted} onClick={handleAdminTest} variant="outline">
                      <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px]">₦</div>
                      Admin Test (₦100) Payment
                    </button_1.Button>)}
                </>)}

              {showPaymentButtons && (<div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs font-black text-primary">
                  Cart saved. Use a payment option to complete your order.
                </div>)}
            </div>)}

          {isCheckingOut && (<div className="flex flex-col items-center justify-center py-6 gap-2 text-primary animate-pulse">
               <lucide_react_1.Loader2 className="w-8 h-8 animate-spin"/>
               <p className="text-xs font-black uppercase tracking-widest">Applying Checkout...</p>
            </div>)}
        </div>)}
      </div>

      {/* 4. Footer Links (Fixed at bottom) */}
      <div className="p-6 pt-2 space-y-3 bg-background border-t shrink-0 shadow-inner text-center z-20">
        <AffiliateDialog_1.AffiliateDialog trigger={<button_1.Button variant="outline" size="sm" className="w-full gap-2">
              <lucide_react_1.Users className="h-4 w-4"/>
              Affiliate Program
            </button_1.Button>}/>
        <link_1.default href="/cart" onClick={function () { return setIsOpen(false); }} className="inline-block w-full">
          <button_1.Button className="w-full h-11 rounded-xl font-black" variant="secondary">
             VIEW ALL SAVED CARTS
          </button_1.Button>
        </link_1.default>
        {items.length > 0 && !isCheckingOut && (<div className="flex gap-2">
              <button_1.Button variant="outline" className="flex-1 h-9 rounded-xl text-xs font-black text-destructive hover:bg-destructive hover:text-white transition-all" onClick={function () { clearCart(); setCheckoutData(null); setSavedCartMeta(null); }}>
                CLEAR CART
             </button_1.Button>
          </div>)}
      </div>
    </div>);
    if (!isMounted) {
        return (<div className={(0, utils_1.cn)("relative", className)}>
        <button_1.Button aria-label="Open cart" className="relative h-10 w-10 rounded-full" size="icon" variant="outline">
          <lucide_react_1.ShoppingCart className="h-5 w-5"/>
          {itemCount > 0 && (<badge_1.Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-black" variant="default">
              {itemCount}
            </badge_1.Badge>)}
        </button_1.Button>
      </div>);
    }
    return (<div className={(0, utils_1.cn)("relative", className)}>
      {isDesktop ? (<sheet_1.Sheet onOpenChange={setIsOpen} open={isOpen}>
          <sheet_1.SheetTrigger asChild>{CartTrigger}</sheet_1.SheetTrigger>
          <sheet_1.SheetContent className="flex w-[400px] flex-col p-0">
            <sheet_1.SheetHeader className="hidden">
              <sheet_1.SheetTitle>Shopping Cart</sheet_1.SheetTitle>
            </sheet_1.SheetHeader>
            <div className="flex-1 overflow-hidden h-full">
               {CartContent}
            </div>
          </sheet_1.SheetContent>
        </sheet_1.Sheet>) : (<drawer_1.Drawer onOpenChange={setIsOpen} open={isOpen}>
          <drawer_1.DrawerTrigger asChild>{CartTrigger}</drawer_1.DrawerTrigger>
          <drawer_1.DrawerContent className="h-[95vh] p-0 flex flex-col">
            <drawer_1.DrawerHeader className="hidden">
              <drawer_1.DrawerTitle>Shopping Cart</drawer_1.DrawerTitle>
            </drawer_1.DrawerHeader>
            <div className="flex-1 overflow-hidden h-full">
               {CartContent}
            </div>
          </drawer_1.DrawerContent>
        </drawer_1.Drawer>)}

      {/* STABLE POSITION TRIGGERS OUTSIDE DIALOG CONTENT */}
      {/* We REMOVED pointer-events-none because it can interfere with the Monnify iframe interactivity */}
      <div id="payment-trigger-container" className="fixed bottom-0 left-0 w-1 h-1 overflow-hidden opacity-0 invisible z-[-1]" aria-hidden="true">
        {checkoutData && (<>
            <monnify_1.default amount={checkoutData.amount} email={user.email} name={user.name || 'User'} onSuccess={function () { return __awaiter(_this, void 0, void 0, function () {
                var affiliateReferral, commissionResponse, commissionError_1, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            affiliateReferral = (0, affiliate_tracking_1.getStoredAffiliateReferral)();
                            if (!affiliateReferral) return [3 /*break*/, 4];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, axios_1.default.post('/api/affiliate/commission', {
                                    affiliateId: affiliateReferral.affiliateId,
                                    amount: checkoutData.amount,
                                    orderId: checkoutData.cartId,
                                    cartId: checkoutData.cartId,
                                })];
                        case 2:
                            commissionResponse = _a.sent();
                            if (commissionResponse.data.success) {
                                sonner_1.toast.success("Affiliate commission credited: \u20A6".concat(commissionResponse.data.commission.toFixed(2)));
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            commissionError_1 = _a.sent();
                            console.error('Failed to credit affiliate commission:', commissionError_1);
                            return [3 /*break*/, 4];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            error_1 = _a.sent();
                            console.error('Error in payment success handler:', error_1);
                            return [3 /*break*/, 6];
                        case 6:
                            clearCart();
                            setCheckoutData(null);
                            setSavedCartMeta(null);
                            setIsOpen(false);
                            window.location.reload();
                            return [2 /*return*/];
                    }
                });
            }); }} ref={monnifyRef} reference={checkoutData.tx_ref}/>
            <manual_1.ManualTransfer amount={checkoutData.amount} cartId={checkoutData.cartId} ref={manualRef} tx_ref={checkoutData.tx_ref} userId={user.id}/>
          </>)}
      </div>
    </div>);
}
