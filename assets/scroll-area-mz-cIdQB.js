import{j as t,x as U,V as J,d as he,r as c,u as R,s as fe,P as N,J as O,f as P,p as C,g as me,a as Q}from"./main-D_Fx8VSj.js";import{a as xe}from"./index-CPWBhaM8.js";import{I as G}from"./input-6PyyXwCd.js";import{c as be}from"./index-BdQq_4o_.js";const k=""+new URL("placeholderFemale-CxQPDRt4.webp",import.meta.url).href,ze=e=>t.jsx("div",{className:e.style,children:t.jsxs("div",{className:"w-full flex flex-row justify-between",children:[t.jsxs("div",{className:"flex flex-row",children:[t.jsxs("div",{className:"relative w-14 h-14",children:[t.jsx("div",{children:t.jsx("img",{src:k,alt:"",className:"w-12 h-12 rounded-full mx-2"})}),t.jsx("div",{className:"w-4 h-4 rounded-full bg-green-500 animate-pulse absolute right-0 top-0"})]}),t.jsxs("div",{className:"flex flex-col px-3 ",children:[t.jsx("div",{className:"text-xl font-semibold",children:"Friends Name"}),t.jsx("div",{className:"text-sm",children:"placeholder"})]})]}),t.jsx(U,{variant:"ghost",className:"flex justify-center items-center h-14 w-14 text-3xl",children:t.jsx(xe,{className:"/text-2xl /h-20"})})]})}),Oe=e=>{const o=e.user?"order-2":"order-none",r=e.user?"flex flex-row w-full px-2 my-2 justify-end":"flex flex-row w-full px-2 my-2 justify-start",n=e.user?"w-full flex-wrap bg-accent-tertiary/80 px-4 py-2 /mb-2 rounded-b-xl rounded-l-xl dark:text-background text-black":"w-full flex-wrap bg-accent-tertiary/80 px-4 py-2 /mb-2 rounded-b-xl rounded-r-xl text-black";return t.jsxs("div",{className:r,children:[t.jsx("div",{className:o,children:t.jsx("img",{src:k,alt:"",className:"w-12 h-12 rounded-full mx-2"})}),t.jsxs("div",{className:"flex flex-col items-center max-w-[60%]",children:[t.jsxs("div",{className:n,children:["chats chats chats ",e.chats]}),t.jsx("div",{className:"text-sm w-full text-end text-foreground/70 my-1",children:"time"})]})]})},Ie=e=>t.jsx("div",{className:e.style,children:t.jsxs("div",{className:"flex flex-row w-full max-w-[360px] px-2 /h-full justify-center items-center",children:[t.jsx(G,{className:"flex-1 bg-secondary overflow-auto w-full h-[2.5rem] max-h-[4rem] border-none outline-none text-nowrap"}),t.jsx(U,{className:"w-14 rounded-lg text-2xl bg-accent top-0 right-0 h-full -translate-x-2 hover:text-accent",children:t.jsx(J,{})})]})}),Xe=()=>t.jsx("div",{children:t.jsxs("div",{className:"flex flex-row",children:[t.jsx(G,{placeholder:"user",className:"flex-1 bg-secondary overflow-auto w-full h-[2.5rem] max-h-[4rem] border-none outline-none text-nowrap"}),t.jsx(U,{className:"w-14 rounded-lg text-2xl bg-accent top-0 right-0 h-full -translate-x-2 hover:text-accent",children:t.jsx(J,{})})]})}),Ye=()=>t.jsx("div",{children:t.jsxs("div",{className:"flex flex-row p-1 hover:bg-secondary",children:[t.jsxs("div",{className:"relative w-14 h-14",children:[t.jsx("div",{children:t.jsx("img",{src:k,alt:"",className:"w-12 h-12 rounded-full mx-2"})}),t.jsx("div",{className:"w-4 h-4 rounded-full bg-green-500 animate-pulse absolute right-0 top-0"})]}),t.jsxs("div",{className:"flex flex-1 flex-col px-2",children:[t.jsx("div",{className:"text-lg font-semibold",children:"Users Name"}),t.jsx("div",{className:"text-sm text-foreground/80",children:"hello"})]}),t.jsx("div",{className:"text-sm text-foreground/70 w-20",children:" time"})]})});function ve(e,o){return c.useReducer((r,n)=>o[r][n]??r,e)}var B="ScrollArea",[K,Me]=he(B),[pe,v]=K(B),Z=c.forwardRef((e,o)=>{const{__scopeScrollArea:r,type:n="hover",dir:l,scrollHideDelay:s=600,...a}=e,[i,d]=c.useState(null),[f,u]=c.useState(null),[m,h]=c.useState(null),[x,w]=c.useState(null),[E,Y]=c.useState(null),[g,T]=c.useState(0),[M,L]=c.useState(0),[_,A]=c.useState(!1),[D,H]=c.useState(!1),b=R(o,y=>d(y)),p=fe(l);return t.jsx(pe,{scope:r,type:n,dir:p,scrollHideDelay:s,scrollArea:i,viewport:f,onViewportChange:u,content:m,onContentChange:h,scrollbarX:x,onScrollbarXChange:w,scrollbarXEnabled:_,onScrollbarXEnabledChange:A,scrollbarY:E,onScrollbarYChange:Y,scrollbarYEnabled:D,onScrollbarYEnabledChange:H,onCornerWidthChange:T,onCornerHeightChange:L,children:t.jsx(N.div,{dir:p,...a,ref:b,style:{position:"relative","--radix-scroll-area-corner-width":g+"px","--radix-scroll-area-corner-height":M+"px",...e.style}})})});Z.displayName=B;var ee="ScrollAreaViewport",re=c.forwardRef((e,o)=>{const{__scopeScrollArea:r,children:n,nonce:l,...s}=e,a=v(ee,r),i=c.useRef(null),d=R(o,i,a.onViewportChange);return t.jsxs(t.Fragment,{children:[t.jsx("style",{dangerouslySetInnerHTML:{__html:"[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}"},nonce:l}),t.jsx(N.div,{"data-radix-scroll-area-viewport":"",...s,ref:d,style:{overflowX:a.scrollbarXEnabled?"scroll":"hidden",overflowY:a.scrollbarYEnabled?"scroll":"hidden",...e.style},children:t.jsx("div",{ref:a.onContentChange,style:{minWidth:"100%",display:"table"},children:n})})]})});re.displayName=ee;var S="ScrollAreaScrollbar",V=c.forwardRef((e,o)=>{const{forceMount:r,...n}=e,l=v(S,e.__scopeScrollArea),{onScrollbarXEnabledChange:s,onScrollbarYEnabledChange:a}=l,i=e.orientation==="horizontal";return c.useEffect(()=>(i?s(!0):a(!0),()=>{i?s(!1):a(!1)}),[i,s,a]),l.type==="hover"?t.jsx(we,{...n,ref:o,forceMount:r}):l.type==="scroll"?t.jsx(Se,{...n,ref:o,forceMount:r}):l.type==="auto"?t.jsx(te,{...n,ref:o,forceMount:r}):l.type==="always"?t.jsx(F,{...n,ref:o}):null});V.displayName=S;var we=c.forwardRef((e,o)=>{const{forceMount:r,...n}=e,l=v(S,e.__scopeScrollArea),[s,a]=c.useState(!1);return c.useEffect(()=>{const i=l.scrollArea;let d=0;if(i){const f=()=>{window.clearTimeout(d),a(!0)},u=()=>{d=window.setTimeout(()=>a(!1),l.scrollHideDelay)};return i.addEventListener("pointerenter",f),i.addEventListener("pointerleave",u),()=>{window.clearTimeout(d),i.removeEventListener("pointerenter",f),i.removeEventListener("pointerleave",u)}}},[l.scrollArea,l.scrollHideDelay]),t.jsx(O,{present:r||s,children:t.jsx(te,{"data-state":s?"visible":"hidden",...n,ref:o})})}),Se=c.forwardRef((e,o)=>{const{forceMount:r,...n}=e,l=v(S,e.__scopeScrollArea),s=e.orientation==="horizontal",a=X(()=>d("SCROLL_END"),100),[i,d]=ve("hidden",{hidden:{SCROLL:"scrolling"},scrolling:{SCROLL_END:"idle",POINTER_ENTER:"interacting"},interacting:{SCROLL:"interacting",POINTER_LEAVE:"idle"},idle:{HIDE:"hidden",SCROLL:"scrolling",POINTER_ENTER:"interacting"}});return c.useEffect(()=>{if(i==="idle"){const f=window.setTimeout(()=>d("HIDE"),l.scrollHideDelay);return()=>window.clearTimeout(f)}},[i,l.scrollHideDelay,d]),c.useEffect(()=>{const f=l.viewport,u=s?"scrollLeft":"scrollTop";if(f){let m=f[u];const h=()=>{const x=f[u];m!==x&&(d("SCROLL"),a()),m=x};return f.addEventListener("scroll",h),()=>f.removeEventListener("scroll",h)}},[l.viewport,s,d,a]),t.jsx(O,{present:r||i!=="hidden",children:t.jsx(F,{"data-state":i==="hidden"?"hidden":"visible",...n,ref:o,onPointerEnter:P(e.onPointerEnter,()=>d("POINTER_ENTER")),onPointerLeave:P(e.onPointerLeave,()=>d("POINTER_LEAVE"))})})}),te=c.forwardRef((e,o)=>{const r=v(S,e.__scopeScrollArea),{forceMount:n,...l}=e,[s,a]=c.useState(!1),i=e.orientation==="horizontal",d=X(()=>{if(r.viewport){const f=r.viewport.offsetWidth<r.viewport.scrollWidth,u=r.viewport.offsetHeight<r.viewport.scrollHeight;a(i?f:u)}},10);return j(r.viewport,d),j(r.content,d),t.jsx(O,{present:n||s,children:t.jsx(F,{"data-state":s?"visible":"hidden",...l,ref:o})})}),F=c.forwardRef((e,o)=>{const{orientation:r="vertical",...n}=e,l=v(S,e.__scopeScrollArea),s=c.useRef(null),a=c.useRef(0),[i,d]=c.useState({content:0,viewport:0,scrollbar:{size:0,paddingStart:0,paddingEnd:0}}),f=ce(i.viewport,i.content),u={...n,sizes:i,onSizesChange:d,hasThumb:f>0&&f<1,onThumbChange:h=>s.current=h,onThumbPointerUp:()=>a.current=0,onThumbPointerDown:h=>a.current=h};function m(h,x){return Re(h,a.current,i,x)}return r==="horizontal"?t.jsx(ge,{...u,ref:o,onThumbPositionChange:()=>{if(l.viewport&&s.current){const h=l.viewport.scrollLeft,x=q(h,i,l.dir);s.current.style.transform=`translate3d(${x}px, 0, 0)`}},onWheelScroll:h=>{l.viewport&&(l.viewport.scrollLeft=h)},onDragScroll:h=>{l.viewport&&(l.viewport.scrollLeft=m(h,l.dir))}}):r==="vertical"?t.jsx(Ce,{...u,ref:o,onThumbPositionChange:()=>{if(l.viewport&&s.current){const h=l.viewport.scrollTop,x=q(h,i);s.current.style.transform=`translate3d(0, ${x}px, 0)`}},onWheelScroll:h=>{l.viewport&&(l.viewport.scrollTop=h)},onDragScroll:h=>{l.viewport&&(l.viewport.scrollTop=m(h))}}):null}),ge=c.forwardRef((e,o)=>{const{sizes:r,onSizesChange:n,...l}=e,s=v(S,e.__scopeScrollArea),[a,i]=c.useState(),d=c.useRef(null),f=R(o,d,s.onScrollbarXChange);return c.useEffect(()=>{d.current&&i(getComputedStyle(d.current))},[d]),t.jsx(le,{"data-orientation":"horizontal",...l,ref:f,sizes:r,style:{bottom:0,left:s.dir==="rtl"?"var(--radix-scroll-area-corner-width)":0,right:s.dir==="ltr"?"var(--radix-scroll-area-corner-width)":0,"--radix-scroll-area-thumb-width":I(r)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.x),onDragScroll:u=>e.onDragScroll(u.x),onWheelScroll:(u,m)=>{if(s.viewport){const h=s.viewport.scrollLeft+u.deltaX;e.onWheelScroll(h),ie(h,m)&&u.preventDefault()}},onResize:()=>{d.current&&s.viewport&&a&&n({content:s.viewport.scrollWidth,viewport:s.viewport.offsetWidth,scrollbar:{size:d.current.clientWidth,paddingStart:z(a.paddingLeft),paddingEnd:z(a.paddingRight)}})}})}),Ce=c.forwardRef((e,o)=>{const{sizes:r,onSizesChange:n,...l}=e,s=v(S,e.__scopeScrollArea),[a,i]=c.useState(),d=c.useRef(null),f=R(o,d,s.onScrollbarYChange);return c.useEffect(()=>{d.current&&i(getComputedStyle(d.current))},[d]),t.jsx(le,{"data-orientation":"vertical",...l,ref:f,sizes:r,style:{top:0,right:s.dir==="ltr"?0:void 0,left:s.dir==="rtl"?0:void 0,bottom:"var(--radix-scroll-area-corner-height)","--radix-scroll-area-thumb-height":I(r)+"px",...e.style},onThumbPointerDown:u=>e.onThumbPointerDown(u.y),onDragScroll:u=>e.onDragScroll(u.y),onWheelScroll:(u,m)=>{if(s.viewport){const h=s.viewport.scrollTop+u.deltaY;e.onWheelScroll(h),ie(h,m)&&u.preventDefault()}},onResize:()=>{d.current&&s.viewport&&a&&n({content:s.viewport.scrollHeight,viewport:s.viewport.offsetHeight,scrollbar:{size:d.current.clientHeight,paddingStart:z(a.paddingTop),paddingEnd:z(a.paddingBottom)}})}})}),[Pe,oe]=K(S),le=c.forwardRef((e,o)=>{const{__scopeScrollArea:r,sizes:n,hasThumb:l,onThumbChange:s,onThumbPointerUp:a,onThumbPointerDown:i,onThumbPositionChange:d,onDragScroll:f,onWheelScroll:u,onResize:m,...h}=e,x=v(S,r),[w,E]=c.useState(null),Y=R(o,b=>E(b)),g=c.useRef(null),T=c.useRef(""),M=x.viewport,L=n.content-n.viewport,_=C(u),A=C(d),D=X(m,10);function H(b){if(g.current){const p=b.clientX-g.current.left,y=b.clientY-g.current.top;f({x:p,y})}}return c.useEffect(()=>{const b=p=>{const y=p.target;w?.contains(y)&&_(p,L)};return document.addEventListener("wheel",b,{passive:!1}),()=>document.removeEventListener("wheel",b,{passive:!1})},[M,w,L,_]),c.useEffect(A,[n,A]),j(w,D),j(x.content,D),t.jsx(Pe,{scope:r,scrollbar:w,hasThumb:l,onThumbChange:C(s),onThumbPointerUp:C(a),onThumbPositionChange:A,onThumbPointerDown:C(i),children:t.jsx(N.div,{...h,ref:Y,style:{position:"absolute",...h.style},onPointerDown:P(e.onPointerDown,b=>{b.button===0&&(b.target.setPointerCapture(b.pointerId),g.current=w.getBoundingClientRect(),T.current=document.body.style.webkitUserSelect,document.body.style.webkitUserSelect="none",x.viewport&&(x.viewport.style.scrollBehavior="auto"),H(b))}),onPointerMove:P(e.onPointerMove,H),onPointerUp:P(e.onPointerUp,b=>{const p=b.target;p.hasPointerCapture(b.pointerId)&&p.releasePointerCapture(b.pointerId),document.body.style.webkitUserSelect=T.current,x.viewport&&(x.viewport.style.scrollBehavior=""),g.current=null})})})}),W="ScrollAreaThumb",ne=c.forwardRef((e,o)=>{const{forceMount:r,...n}=e,l=oe(W,e.__scopeScrollArea);return t.jsx(O,{present:r||l.hasThumb,children:t.jsx(ye,{ref:o,...n})})}),ye=c.forwardRef((e,o)=>{const{__scopeScrollArea:r,style:n,...l}=e,s=v(W,r),a=oe(W,r),{onThumbPositionChange:i}=a,d=R(o,m=>a.onThumbChange(m)),f=c.useRef(),u=X(()=>{f.current&&(f.current(),f.current=void 0)},100);return c.useEffect(()=>{const m=s.viewport;if(m){const h=()=>{if(u(),!f.current){const x=Ee(m,i);f.current=x,i()}};return i(),m.addEventListener("scroll",h),()=>m.removeEventListener("scroll",h)}},[s.viewport,u,i]),t.jsx(N.div,{"data-state":a.hasThumb?"visible":"hidden",...l,ref:d,style:{width:"var(--radix-scroll-area-thumb-width)",height:"var(--radix-scroll-area-thumb-height)",...n},onPointerDownCapture:P(e.onPointerDownCapture,m=>{const x=m.target.getBoundingClientRect(),w=m.clientX-x.left,E=m.clientY-x.top;a.onThumbPointerDown({x:w,y:E})}),onPointerUp:P(e.onPointerUp,a.onThumbPointerUp)})});ne.displayName=W;var $="ScrollAreaCorner",se=c.forwardRef((e,o)=>{const r=v($,e.__scopeScrollArea),n=!!(r.scrollbarX&&r.scrollbarY);return r.type!=="scroll"&&n?t.jsx(je,{...e,ref:o}):null});se.displayName=$;var je=c.forwardRef((e,o)=>{const{__scopeScrollArea:r,...n}=e,l=v($,r),[s,a]=c.useState(0),[i,d]=c.useState(0),f=!!(s&&i);return j(l.scrollbarX,()=>{const u=l.scrollbarX?.offsetHeight||0;l.onCornerHeightChange(u),d(u)}),j(l.scrollbarY,()=>{const u=l.scrollbarY?.offsetWidth||0;l.onCornerWidthChange(u),a(u)}),f?t.jsx(N.div,{...n,ref:o,style:{width:s,height:i,position:"absolute",right:l.dir==="ltr"?0:void 0,left:l.dir==="rtl"?0:void 0,bottom:0,...e.style}}):null});function z(e){return e?parseInt(e,10):0}function ce(e,o){const r=e/o;return isNaN(r)?0:r}function I(e){const o=ce(e.viewport,e.content),r=e.scrollbar.paddingStart+e.scrollbar.paddingEnd,n=(e.scrollbar.size-r)*o;return Math.max(n,18)}function Re(e,o,r,n="ltr"){const l=I(r),s=l/2,a=o||s,i=l-a,d=r.scrollbar.paddingStart+a,f=r.scrollbar.size-r.scrollbar.paddingEnd-i,u=r.content-r.viewport,m=n==="ltr"?[0,u]:[u*-1,0];return ae([d,f],m)(e)}function q(e,o,r="ltr"){const n=I(o),l=o.scrollbar.paddingStart+o.scrollbar.paddingEnd,s=o.scrollbar.size-l,a=o.content-o.viewport,i=s-n,d=r==="ltr"?[0,a]:[a*-1,0],f=be(e,d);return ae([0,a],[0,i])(f)}function ae(e,o){return r=>{if(e[0]===e[1]||o[0]===o[1])return o[0];const n=(o[1]-o[0])/(e[1]-e[0]);return o[0]+n*(r-e[0])}}function ie(e,o){return e>0&&e<o}var Ee=(e,o=()=>{})=>{let r={left:e.scrollLeft,top:e.scrollTop},n=0;return function l(){const s={left:e.scrollLeft,top:e.scrollTop},a=r.left!==s.left,i=r.top!==s.top;(a||i)&&o(),r=s,n=window.requestAnimationFrame(l)}(),()=>window.cancelAnimationFrame(n)};function X(e,o){const r=C(e),n=c.useRef(0);return c.useEffect(()=>()=>window.clearTimeout(n.current),[]),c.useCallback(()=>{window.clearTimeout(n.current),n.current=window.setTimeout(r,o)},[r,o])}function j(e,o){const r=C(o);me(()=>{let n=0;if(e){const l=new ResizeObserver(()=>{cancelAnimationFrame(n),n=window.requestAnimationFrame(r)});return l.observe(e),()=>{window.cancelAnimationFrame(n),l.unobserve(e)}}},[e,r])}var de=Z,Ae=re,Ne=se;const Te=c.forwardRef(({className:e,children:o,...r},n)=>t.jsxs(de,{ref:n,className:Q("relative overflow-hidden",e),...r,children:[t.jsx(Ae,{className:"h-full w-full rounded-[inherit]",children:o}),t.jsx(ue,{}),t.jsx(Ne,{})]}));Te.displayName=de.displayName;const ue=c.forwardRef(({className:e,orientation:o="vertical",...r},n)=>t.jsx(V,{ref:n,orientation:o,className:Q("flex touch-none select-none transition-colors",o==="vertical"&&"h-full w-2.5 border-l border-l-transparent p-[1px]",o==="horizontal"&&"h-2.5 flex-col border-t border-t-transparent p-[1px]",e),...r,children:t.jsx(ne,{className:"relative flex-1 rounded-full bg-accent"})}));ue.displayName=V.displayName;export{ze as C,Te as S,Oe as a,Ie as b,Xe as c,Ye as d};
