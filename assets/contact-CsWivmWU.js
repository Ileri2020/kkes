import{c as Lt,G as Me,j as n,C as Ot,r,a as B,P as k,b as At,d as Ht,e as Le,u as H,A as Dt,f as R,g as z,h as Oe,i as Vt,k as Bt,R as Ft,S as Kt,F as Wt,D as Ut,l as zt,n as Ie,o as qt,p as Gt,q as $t,s as Yt,t as Ee,v as Jt,w as Xt,x as Zt,m as Qt}from"./main-D_Fx8VSj.js";import{F as eo}from"./index-CPWBhaM8.js";import{S as to}from"./social-C4wyuHGl.js";import{I as ue}from"./input-6PyyXwCd.js";import{c as _e}from"./index-BdQq_4o_.js";import{u as oo,C as Ae}from"./index-BPgC4Ef5.js";/**
 * @license lucide-react v0.414.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const no=Lt("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);function ro(e){return Me({tag:"svg",attr:{viewBox:"0 0 24 24"},child:[{tag:"path",attr:{fill:"none",d:"M0 0h24v24H0V0z"},child:[]},{tag:"path",attr:{d:"M4 4h16v12H5.17L4 17.17V4m0-2c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4zm2 10h12v2H6v-2zm0-3h12v2H6V9zm0-3h12v2H6V6z"},child:[]}]})(e)}function so(e){return Me({tag:"svg",attr:{viewBox:"0 0 24 24"},child:[{tag:"path",attr:{fill:"none",d:"M0 0h24v24H0V0z"},child:[]},{tag:"path",attr:{d:"M6.54 5c.06.89.21 1.76.45 2.59l-1.2 1.2c-.41-1.2-.67-2.47-.76-3.79h1.51m9.86 12.02c.85.24 1.72.39 2.6.45v1.49c-1.32-.09-2.59-.35-3.8-.75l1.2-1.19M7.5 3H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.49c0-.55-.45-1-1-1-1.24 0-2.45-.2-3.57-.57a.84.84 0 0 0-.31-.05c-.26 0-.51.1-.71.29l-2.2 2.2a15.149 15.149 0 0 1-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1z"},child:[]}]})(e)}const ke={title:"contact",description:"If you have any questions, inquiries, or would like to make suggestions, We would love to hear from you. Please feel free to reach out using the contact information provided below:",contact:[{icon:n.jsx(eo,{className:"w-[40px] h-[40px] text-accent hover:bg-accent hover:text-slate-100 rounded-md bg-transparent border-accent border-2 p-1"}),text:"Email",value:"adepojuololade2020@gmail.com"},{icon:n.jsx(ro,{className:"w-[40px] h-[40px] text-accent hover:bg-accent hover:text-slate-100 rounded-md bg-transparent border-accent border-2 p-1"}),text:"Chat to us",value:"ileri2020.github.io"},{icon:n.jsx(so,{className:"w-[40px] h-[40px] text-accent hover:bg-accent hover:text-slate-100 rounded-md bg-transparent border-accent border-2 p-1"}),text:"Phone",value:"(+234) 816 968 4400"},{icon:n.jsx(Ot,{className:"w-[40px] h-[40px] text-accent hover:bg-accent hover:text-slate-100 rounded-md bg-transparent border-accent border-2 p-1"}),text:"address",value:"22 Akinagbe, Alapere, Ketu, Lagos State"}]},He=r.forwardRef(({className:e,...o},t)=>n.jsx("textarea",{className:B("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",e),ref:t,...o}));He.displayName="Textarea";var ao="VisuallyHidden",De=r.forwardRef((e,o)=>n.jsx(k.span,{...e,ref:o,style:{position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal",...e.style}}));De.displayName=ao;var lo=[" ","Enter","ArrowUp","ArrowDown"],io=[" ","Enter"],le="Select",[me,fe,co]=At(le),[oe,rn]=Ht(le,[co,Le]),he=Le(),[uo,q]=oe(le),[po,mo]=oe(le),Ve=e=>{const{__scopeSelect:o,children:t,open:a,defaultOpen:s,onOpenChange:d,value:l,defaultValue:i,onValueChange:c,dir:u,name:x,autoComplete:g,disabled:I,required:C}=e,m=he(o),[h,S]=r.useState(null),[f,v]=r.useState(null),[y,F]=r.useState(!1),L=Yt(u),[ne=!1,E]=Ee({prop:a,defaultProp:s,onChange:d}),[M,$]=Ee({prop:l,defaultProp:i,onChange:c}),Q=r.useRef(null),Y=h?!!h.closest("form"):!0,[O,K]=r.useState(new Set),W=Array.from(O).map(P=>P.props.value).join(";");return n.jsx(Jt,{...m,children:n.jsxs(uo,{required:C,scope:o,trigger:h,onTriggerChange:S,valueNode:f,onValueNodeChange:v,valueNodeHasChildren:y,onValueNodeHasChildrenChange:F,contentId:Ie(),value:M,onValueChange:$,open:ne,onOpenChange:E,dir:L,triggerPointerDownPosRef:Q,disabled:I,children:[n.jsx(me.Provider,{scope:o,children:n.jsx(po,{scope:e.__scopeSelect,onNativeOptionAdd:r.useCallback(P=>{K(A=>new Set(A).add(P))},[]),onNativeOptionRemove:r.useCallback(P=>{K(A=>{const D=new Set(A);return D.delete(P),D})},[]),children:t})}),Y?n.jsxs(ut,{"aria-hidden":!0,required:C,tabIndex:-1,name:x,autoComplete:g,value:M,onChange:P=>$(P.target.value),disabled:I,children:[M===void 0?n.jsx("option",{value:""}):null,Array.from(O)]},W):null]})})};Ve.displayName=le;var Be="SelectTrigger",Fe=r.forwardRef((e,o)=>{const{__scopeSelect:t,disabled:a=!1,...s}=e,d=he(t),l=q(Be,t),i=l.disabled||a,c=H(o,l.onTriggerChange),u=fe(t),[x,g,I]=pt(m=>{const h=u().filter(v=>!v.disabled),S=h.find(v=>v.value===l.value),f=mt(h,m,S);f!==void 0&&l.onValueChange(f.value)}),C=()=>{i||(l.onOpenChange(!0),I())};return n.jsx(Dt,{asChild:!0,...d,children:n.jsx(k.button,{type:"button",role:"combobox","aria-controls":l.contentId,"aria-expanded":l.open,"aria-required":l.required,"aria-autocomplete":"none",dir:l.dir,"data-state":l.open?"open":"closed",disabled:i,"data-disabled":i?"":void 0,"data-placeholder":dt(l.value)?"":void 0,...s,ref:c,onClick:R(s.onClick,m=>{m.currentTarget.focus()}),onPointerDown:R(s.onPointerDown,m=>{const h=m.target;h.hasPointerCapture(m.pointerId)&&h.releasePointerCapture(m.pointerId),m.button===0&&m.ctrlKey===!1&&(C(),l.triggerPointerDownPosRef.current={x:Math.round(m.pageX),y:Math.round(m.pageY)},m.preventDefault())}),onKeyDown:R(s.onKeyDown,m=>{const h=x.current!=="";!(m.ctrlKey||m.altKey||m.metaKey)&&m.key.length===1&&g(m.key),!(h&&m.key===" ")&&lo.includes(m.key)&&(C(),m.preventDefault())})})})});Fe.displayName=Be;var Ke="SelectValue",We=r.forwardRef((e,o)=>{const{__scopeSelect:t,className:a,style:s,children:d,placeholder:l="",...i}=e,c=q(Ke,t),{onValueNodeHasChildrenChange:u}=c,x=d!==void 0,g=H(o,c.onValueNodeChange);return z(()=>{u(x)},[u,x]),n.jsx(k.span,{...i,ref:g,style:{pointerEvents:"none"},children:dt(c.value)?n.jsx(n.Fragment,{children:l}):d})});We.displayName=Ke;var fo="SelectIcon",Ue=r.forwardRef((e,o)=>{const{__scopeSelect:t,children:a,...s}=e;return n.jsx(k.span,{"aria-hidden":!0,...s,ref:o,children:a||"▼"})});Ue.displayName=fo;var ho="SelectPortal",ze=e=>n.jsx($t,{asChild:!0,...e});ze.displayName=ho;var Z="SelectContent",qe=r.forwardRef((e,o)=>{const t=q(Z,e.__scopeSelect),[a,s]=r.useState();if(z(()=>{s(new DocumentFragment)},[]),!t.open){const d=a;return d?Oe.createPortal(n.jsx(Ge,{scope:e.__scopeSelect,children:n.jsx(me.Slot,{scope:e.__scopeSelect,children:n.jsx("div",{children:e.children})})}),d):null}return n.jsx($e,{...e,ref:o})});qe.displayName=Z;var V=10,[Ge,G]=oe(Z),xo="SelectContentImpl",$e=r.forwardRef((e,o)=>{const{__scopeSelect:t,position:a="item-aligned",onCloseAutoFocus:s,onEscapeKeyDown:d,onPointerDownOutside:l,side:i,sideOffset:c,align:u,alignOffset:x,arrowPadding:g,collisionBoundary:I,collisionPadding:C,sticky:m,hideWhenDetached:h,avoidCollisions:S,...f}=e,v=q(Z,t),[y,F]=r.useState(null),[L,ne]=r.useState(null),E=H(o,p=>F(p)),[M,$]=r.useState(null),[Q,Y]=r.useState(null),O=fe(t),[K,W]=r.useState(!1),P=r.useRef(!1);r.useEffect(()=>{if(y)return Vt(y)},[y]),Bt();const A=r.useCallback(p=>{const[N,..._]=O().map(j=>j.ref.current),[w]=_.slice(-1),b=document.activeElement;for(const j of p)if(j===b||(j?.scrollIntoView({block:"nearest"}),j===N&&L&&(L.scrollTop=0),j===w&&L&&(L.scrollTop=L.scrollHeight),j?.focus(),document.activeElement!==b))return},[O,L]),D=r.useCallback(()=>A([M,y]),[A,M,y]);r.useEffect(()=>{K&&D()},[K,D]);const{onOpenChange:ee,triggerPointerDownPosRef:U}=v;r.useEffect(()=>{if(y){let p={x:0,y:0};const N=w=>{p={x:Math.abs(Math.round(w.pageX)-(U.current?.x??0)),y:Math.abs(Math.round(w.pageY)-(U.current?.y??0))}},_=w=>{p.x<=10&&p.y<=10?w.preventDefault():y.contains(w.target)||ee(!1),document.removeEventListener("pointermove",N),U.current=null};return U.current!==null&&(document.addEventListener("pointermove",N),document.addEventListener("pointerup",_,{capture:!0,once:!0})),()=>{document.removeEventListener("pointermove",N),document.removeEventListener("pointerup",_,{capture:!0})}}},[y,ee,U]),r.useEffect(()=>{const p=()=>ee(!1);return window.addEventListener("blur",p),window.addEventListener("resize",p),()=>{window.removeEventListener("blur",p),window.removeEventListener("resize",p)}},[ee]);const[xe,ce]=pt(p=>{const N=O().filter(b=>!b.disabled),_=N.find(b=>b.ref.current===document.activeElement),w=mt(N,p,_);w&&setTimeout(()=>w.ref.current.focus())}),ge=r.useCallback((p,N,_)=>{const w=!P.current&&!_;(v.value!==void 0&&v.value===N||w)&&($(p),w&&(P.current=!0))},[v.value]),ve=r.useCallback(()=>y?.focus(),[y]),te=r.useCallback((p,N,_)=>{const w=!P.current&&!_;(v.value!==void 0&&v.value===N||w)&&Y(p)},[v.value]),de=a==="popper"?ye:Ye,re=de===ye?{side:i,sideOffset:c,align:u,alignOffset:x,arrowPadding:g,collisionBoundary:I,collisionPadding:C,sticky:m,hideWhenDetached:h,avoidCollisions:S}:{};return n.jsx(Ge,{scope:t,content:y,viewport:L,onViewportChange:ne,itemRefCallback:ge,selectedItem:M,onItemLeave:ve,itemTextRefCallback:te,focusSelectedItem:D,selectedItemText:Q,position:a,isPositioned:K,searchRef:xe,children:n.jsx(Ft,{as:Kt,allowPinchZoom:!0,children:n.jsx(Wt,{asChild:!0,trapped:v.open,onMountAutoFocus:p=>{p.preventDefault()},onUnmountAutoFocus:R(s,p=>{v.trigger?.focus({preventScroll:!0}),p.preventDefault()}),children:n.jsx(Ut,{asChild:!0,disableOutsidePointerEvents:!0,onEscapeKeyDown:d,onPointerDownOutside:l,onFocusOutside:p=>p.preventDefault(),onDismiss:()=>v.onOpenChange(!1),children:n.jsx(de,{role:"listbox",id:v.contentId,"data-state":v.open?"open":"closed",dir:v.dir,onContextMenu:p=>p.preventDefault(),...f,...re,onPlaced:()=>W(!0),ref:E,style:{display:"flex",flexDirection:"column",outline:"none",...f.style},onKeyDown:R(f.onKeyDown,p=>{const N=p.ctrlKey||p.altKey||p.metaKey;if(p.key==="Tab"&&p.preventDefault(),!N&&p.key.length===1&&ce(p.key),["ArrowUp","ArrowDown","Home","End"].includes(p.key)){let w=O().filter(b=>!b.disabled).map(b=>b.ref.current);if(["ArrowUp","End"].includes(p.key)&&(w=w.slice().reverse()),["ArrowUp","ArrowDown"].includes(p.key)){const b=p.target,j=w.indexOf(b);w=w.slice(j+1)}setTimeout(()=>A(w)),p.preventDefault()}})})})})})})});$e.displayName=xo;var go="SelectItemAlignedPosition",Ye=r.forwardRef((e,o)=>{const{__scopeSelect:t,onPlaced:a,...s}=e,d=q(Z,t),l=G(Z,t),[i,c]=r.useState(null),[u,x]=r.useState(null),g=H(o,E=>x(E)),I=fe(t),C=r.useRef(!1),m=r.useRef(!0),{viewport:h,selectedItem:S,selectedItemText:f,focusSelectedItem:v}=l,y=r.useCallback(()=>{if(d.trigger&&d.valueNode&&i&&u&&h&&S&&f){const E=d.trigger.getBoundingClientRect(),M=u.getBoundingClientRect(),$=d.valueNode.getBoundingClientRect(),Q=f.getBoundingClientRect();if(d.dir!=="rtl"){const b=Q.left-M.left,j=$.left-b,J=E.left-j,X=E.width+J,we=Math.max(X,M.width),Se=window.innerWidth-V,be=_e(j,[V,Se-we]);i.style.minWidth=X+"px",i.style.left=be+"px"}else{const b=M.right-Q.right,j=window.innerWidth-$.right-b,J=window.innerWidth-E.right-j,X=E.width+J,we=Math.max(X,M.width),Se=window.innerWidth-V,be=_e(j,[V,Se-we]);i.style.minWidth=X+"px",i.style.right=be+"px"}const Y=I(),O=window.innerHeight-V*2,K=h.scrollHeight,W=window.getComputedStyle(u),P=parseInt(W.borderTopWidth,10),A=parseInt(W.paddingTop,10),D=parseInt(W.borderBottomWidth,10),ee=parseInt(W.paddingBottom,10),U=P+A+K+ee+D,xe=Math.min(S.offsetHeight*5,U),ce=window.getComputedStyle(h),ge=parseInt(ce.paddingTop,10),ve=parseInt(ce.paddingBottom,10),te=E.top+E.height/2-V,de=O-te,re=S.offsetHeight/2,p=S.offsetTop+re,N=P+A+p,_=U-N;if(N<=te){const b=S===Y[Y.length-1].ref.current;i.style.bottom="0px";const j=u.clientHeight-h.offsetTop-h.offsetHeight,J=Math.max(de,re+(b?ve:0)+j+D),X=N+J;i.style.height=X+"px"}else{const b=S===Y[0].ref.current;i.style.top="0px";const J=Math.max(te,P+h.offsetTop+(b?ge:0)+re)+_;i.style.height=J+"px",h.scrollTop=N-te+h.offsetTop}i.style.margin=`${V}px 0`,i.style.minHeight=xe+"px",i.style.maxHeight=O+"px",a?.(),requestAnimationFrame(()=>C.current=!0)}},[I,d.trigger,d.valueNode,i,u,h,S,f,d.dir,a]);z(()=>y(),[y]);const[F,L]=r.useState();z(()=>{u&&L(window.getComputedStyle(u).zIndex)},[u]);const ne=r.useCallback(E=>{E&&m.current===!0&&(y(),v?.(),m.current=!1)},[y,v]);return n.jsx(wo,{scope:t,contentWrapper:i,shouldExpandOnScrollRef:C,onScrollButtonChange:ne,children:n.jsx("div",{ref:c,style:{display:"flex",flexDirection:"column",position:"fixed",zIndex:F},children:n.jsx(k.div,{...s,ref:g,style:{boxSizing:"border-box",maxHeight:"100%",...s.style}})})})});Ye.displayName=go;var vo="SelectPopperPosition",ye=r.forwardRef((e,o)=>{const{__scopeSelect:t,align:a="start",collisionPadding:s=V,...d}=e,l=he(t);return n.jsx(zt,{...l,...d,ref:o,align:a,collisionPadding:s,style:{boxSizing:"border-box",...d.style,"--radix-select-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-select-content-available-width":"var(--radix-popper-available-width)","--radix-select-content-available-height":"var(--radix-popper-available-height)","--radix-select-trigger-width":"var(--radix-popper-anchor-width)","--radix-select-trigger-height":"var(--radix-popper-anchor-height)"}})});ye.displayName=vo;var[wo,Pe]=oe(Z,{}),Ce="SelectViewport",Je=r.forwardRef((e,o)=>{const{__scopeSelect:t,nonce:a,...s}=e,d=G(Ce,t),l=Pe(Ce,t),i=H(o,d.onViewportChange),c=r.useRef(0);return n.jsxs(n.Fragment,{children:[n.jsx("style",{dangerouslySetInnerHTML:{__html:"[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}"},nonce:a}),n.jsx(me.Slot,{scope:t,children:n.jsx(k.div,{"data-radix-select-viewport":"",role:"presentation",...s,ref:i,style:{position:"relative",flex:1,overflow:"auto",...s.style},onScroll:R(s.onScroll,u=>{const x=u.currentTarget,{contentWrapper:g,shouldExpandOnScrollRef:I}=l;if(I?.current&&g){const C=Math.abs(c.current-x.scrollTop);if(C>0){const m=window.innerHeight-V*2,h=parseFloat(g.style.minHeight),S=parseFloat(g.style.height),f=Math.max(h,S);if(f<m){const v=f+C,y=Math.min(m,v),F=v-y;g.style.height=y+"px",g.style.bottom==="0px"&&(x.scrollTop=F>0?F:0,g.style.justifyContent="flex-end")}}}c.current=x.scrollTop})})})]})});Je.displayName=Ce;var Xe="SelectGroup",[So,bo]=oe(Xe),Ze=r.forwardRef((e,o)=>{const{__scopeSelect:t,...a}=e,s=Ie();return n.jsx(So,{scope:t,id:s,children:n.jsx(k.div,{role:"group","aria-labelledby":s,...a,ref:o})})});Ze.displayName=Xe;var Qe="SelectLabel",et=r.forwardRef((e,o)=>{const{__scopeSelect:t,...a}=e,s=bo(Qe,t);return n.jsx(k.div,{id:s.id,...a,ref:o})});et.displayName=Qe;var pe="SelectItem",[yo,tt]=oe(pe),ot=r.forwardRef((e,o)=>{const{__scopeSelect:t,value:a,disabled:s=!1,textValue:d,...l}=e,i=q(pe,t),c=G(pe,t),u=i.value===a,[x,g]=r.useState(d??""),[I,C]=r.useState(!1),m=H(o,f=>c.itemRefCallback?.(f,a,s)),h=Ie(),S=()=>{s||(i.onValueChange(a),i.onOpenChange(!1))};if(a==="")throw new Error("A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.");return n.jsx(yo,{scope:t,value:a,disabled:s,textId:h,isSelected:u,onItemTextChange:r.useCallback(f=>{g(v=>v||(f?.textContent??"").trim())},[]),children:n.jsx(me.ItemSlot,{scope:t,value:a,disabled:s,textValue:x,children:n.jsx(k.div,{role:"option","aria-labelledby":h,"data-highlighted":I?"":void 0,"aria-selected":u&&I,"data-state":u?"checked":"unchecked","aria-disabled":s||void 0,"data-disabled":s?"":void 0,tabIndex:s?void 0:-1,...l,ref:m,onFocus:R(l.onFocus,()=>C(!0)),onBlur:R(l.onBlur,()=>C(!1)),onPointerUp:R(l.onPointerUp,S),onPointerMove:R(l.onPointerMove,f=>{s?c.onItemLeave?.():f.currentTarget.focus({preventScroll:!0})}),onPointerLeave:R(l.onPointerLeave,f=>{f.currentTarget===document.activeElement&&c.onItemLeave?.()}),onKeyDown:R(l.onKeyDown,f=>{c.searchRef?.current!==""&&f.key===" "||(io.includes(f.key)&&S(),f.key===" "&&f.preventDefault())})})})})});ot.displayName=pe;var se="SelectItemText",nt=r.forwardRef((e,o)=>{const{__scopeSelect:t,className:a,style:s,...d}=e,l=q(se,t),i=G(se,t),c=tt(se,t),u=mo(se,t),[x,g]=r.useState(null),I=H(o,f=>g(f),c.onItemTextChange,f=>i.itemTextRefCallback?.(f,c.value,c.disabled)),C=x?.textContent,m=r.useMemo(()=>n.jsx("option",{value:c.value,disabled:c.disabled,children:C},c.value),[c.disabled,c.value,C]),{onNativeOptionAdd:h,onNativeOptionRemove:S}=u;return z(()=>(h(m),()=>S(m)),[h,S,m]),n.jsxs(n.Fragment,{children:[n.jsx(k.span,{id:c.textId,...d,ref:I}),c.isSelected&&l.valueNode&&!l.valueNodeHasChildren?Oe.createPortal(d.children,l.valueNode):null]})});nt.displayName=se;var rt="SelectItemIndicator",st=r.forwardRef((e,o)=>{const{__scopeSelect:t,...a}=e;return tt(rt,t).isSelected?n.jsx(k.span,{"aria-hidden":!0,...a,ref:o}):null});st.displayName=rt;var Ne="SelectScrollUpButton",at=r.forwardRef((e,o)=>{const t=G(Ne,e.__scopeSelect),a=Pe(Ne,e.__scopeSelect),[s,d]=r.useState(!1),l=H(o,a.onScrollButtonChange);return z(()=>{if(t.viewport&&t.isPositioned){let i=function(){const u=c.scrollTop>0;d(u)};const c=t.viewport;return i(),c.addEventListener("scroll",i),()=>c.removeEventListener("scroll",i)}},[t.viewport,t.isPositioned]),s?n.jsx(it,{...e,ref:l,onAutoScroll:()=>{const{viewport:i,selectedItem:c}=t;i&&c&&(i.scrollTop=i.scrollTop-c.offsetHeight)}}):null});at.displayName=Ne;var je="SelectScrollDownButton",lt=r.forwardRef((e,o)=>{const t=G(je,e.__scopeSelect),a=Pe(je,e.__scopeSelect),[s,d]=r.useState(!1),l=H(o,a.onScrollButtonChange);return z(()=>{if(t.viewport&&t.isPositioned){let i=function(){const u=c.scrollHeight-c.clientHeight,x=Math.ceil(c.scrollTop)<u;d(x)};const c=t.viewport;return i(),c.addEventListener("scroll",i),()=>c.removeEventListener("scroll",i)}},[t.viewport,t.isPositioned]),s?n.jsx(it,{...e,ref:l,onAutoScroll:()=>{const{viewport:i,selectedItem:c}=t;i&&c&&(i.scrollTop=i.scrollTop+c.offsetHeight)}}):null});lt.displayName=je;var it=r.forwardRef((e,o)=>{const{__scopeSelect:t,onAutoScroll:a,...s}=e,d=G("SelectScrollButton",t),l=r.useRef(null),i=fe(t),c=r.useCallback(()=>{l.current!==null&&(window.clearInterval(l.current),l.current=null)},[]);return r.useEffect(()=>()=>c(),[c]),z(()=>{i().find(x=>x.ref.current===document.activeElement)?.ref.current?.scrollIntoView({block:"nearest"})},[i]),n.jsx(k.div,{"aria-hidden":!0,...s,ref:o,style:{flexShrink:0,...s.style},onPointerDown:R(s.onPointerDown,()=>{l.current===null&&(l.current=window.setInterval(a,50))}),onPointerMove:R(s.onPointerMove,()=>{d.onItemLeave?.(),l.current===null&&(l.current=window.setInterval(a,50))}),onPointerLeave:R(s.onPointerLeave,()=>{c()})})}),Co="SelectSeparator",ct=r.forwardRef((e,o)=>{const{__scopeSelect:t,...a}=e;return n.jsx(k.div,{"aria-hidden":!0,...a,ref:o})});ct.displayName=Co;var Te="SelectArrow",No=r.forwardRef((e,o)=>{const{__scopeSelect:t,...a}=e,s=he(t),d=q(Te,t),l=G(Te,t);return d.open&&l.position==="popper"?n.jsx(qt,{...s,...a,ref:o}):null});No.displayName=Te;function dt(e){return e===""||e===void 0}var ut=r.forwardRef((e,o)=>{const{value:t,...a}=e,s=r.useRef(null),d=H(o,s),l=oo(t);return r.useEffect(()=>{const i=s.current,c=window.HTMLSelectElement.prototype,x=Object.getOwnPropertyDescriptor(c,"value").set;if(l!==t&&x){const g=new Event("change",{bubbles:!0});x.call(i,t),i.dispatchEvent(g)}},[l,t]),n.jsx(De,{asChild:!0,children:n.jsx("select",{...a,ref:d,defaultValue:t})})});ut.displayName="BubbleSelect";function pt(e){const o=Gt(e),t=r.useRef(""),a=r.useRef(0),s=r.useCallback(l=>{const i=t.current+l;o(i),function c(u){t.current=u,window.clearTimeout(a.current),u!==""&&(a.current=window.setTimeout(()=>c(""),1e3))}(i)},[o]),d=r.useCallback(()=>{t.current="",window.clearTimeout(a.current)},[]);return r.useEffect(()=>()=>window.clearTimeout(a.current),[]),[t,s,d]}function mt(e,o,t){const s=o.length>1&&Array.from(o).every(u=>u===o[0])?o[0]:o,d=t?e.indexOf(t):-1;let l=jo(e,Math.max(d,0));s.length===1&&(l=l.filter(u=>u!==t));const c=l.find(u=>u.textValue.toLowerCase().startsWith(s.toLowerCase()));return c!==t?c:void 0}function jo(e,o){return e.map((t,a)=>e[(o+a)%e.length])}var To=Ve,ft=Fe,Io=We,Po=Ue,Ro=ze,ht=qe,Eo=Je,_o=Ze,xt=et,gt=ot,ko=nt,Mo=st,vt=at,wt=lt,St=ct;const Lo=To,Oo=_o,Ao=Io,bt=r.forwardRef(({className:e,children:o,...t},a)=>n.jsxs(ft,{ref:a,className:B("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",e),...t,children:[o,n.jsx(Po,{asChild:!0,children:n.jsx(Ae,{className:"h-4 w-4 opacity-50"})})]}));bt.displayName=ft.displayName;const yt=r.forwardRef(({className:e,...o},t)=>n.jsx(vt,{ref:t,className:B("flex cursor-default items-center justify-center py-1",e),...o,children:n.jsx(no,{className:"h-4 w-4"})}));yt.displayName=vt.displayName;const Ct=r.forwardRef(({className:e,...o},t)=>n.jsx(wt,{ref:t,className:B("flex cursor-default items-center justify-center py-1",e),...o,children:n.jsx(Ae,{className:"h-4 w-4"})}));Ct.displayName=wt.displayName;const Nt=r.forwardRef(({className:e,children:o,position:t="popper",...a},s)=>n.jsx(Ro,{children:n.jsxs(ht,{ref:s,className:B("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-background text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",t==="popper"&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",e),position:t,...a,children:[n.jsx(yt,{}),n.jsx(Eo,{className:B("p-1 ",t==="popper"&&"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),children:o}),n.jsx(Ct,{})]})}));Nt.displayName=ht.displayName;const jt=r.forwardRef(({className:e,...o},t)=>n.jsx(xt,{ref:t,className:B("py-1.5 pl-8 pr-2 text-sm font-semibold ",e),...o}));jt.displayName=xt.displayName;const ae=r.forwardRef(({className:e,children:o,...t},a)=>n.jsxs(gt,{ref:a,className:B("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",e),...t,children:[n.jsx("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:n.jsx(Mo,{children:n.jsx(Xt,{className:"h-4 w-4"})})}),n.jsx(ko,{children:o})]}));ae.displayName=gt.displayName;const Ho=r.forwardRef(({className:e,...o},t)=>n.jsx(St,{ref:t,className:B("-mx-1 my-1 h-px bg-muted",e),...o}));Ho.displayName=St.displayName;class ie{constructor(o=0,t="Network Error"){this.status=o,this.text=t}}const Do=()=>{if(!(typeof localStorage>"u"))return{get:e=>Promise.resolve(localStorage.getItem(e)),set:(e,o)=>Promise.resolve(localStorage.setItem(e,o)),remove:e=>Promise.resolve(localStorage.removeItem(e))}},T={origin:"https://api.emailjs.com",blockHeadless:!1,storageProvider:Do()},Re=e=>e?typeof e=="string"?{publicKey:e}:e.toString()==="[object Object]"?e:{}:{},Vo=(e,o="https://api.emailjs.com")=>{if(!e)return;const t=Re(e);T.publicKey=t.publicKey,T.blockHeadless=t.blockHeadless,T.storageProvider=t.storageProvider,T.blockList=t.blockList,T.limitRate=t.limitRate,T.origin=t.origin||o},Tt=async(e,o,t={})=>{const a=await fetch(T.origin+e,{method:"POST",headers:t,body:o}),s=await a.text(),d=new ie(a.status,s);if(a.ok)return d;throw d},It=(e,o,t)=>{if(!e||typeof e!="string")throw"The public key is required. Visit https://dashboard.emailjs.com/admin/account";if(!o||typeof o!="string")throw"The service ID is required. Visit https://dashboard.emailjs.com/admin";if(!t||typeof t!="string")throw"The template ID is required. Visit https://dashboard.emailjs.com/admin/templates"},Bo=e=>{if(e&&e.toString()!=="[object Object]")throw"The template params have to be the object. Visit https://www.emailjs.com/docs/sdk/send/"},Pt=e=>e.webdriver||!e.languages||e.languages.length===0,Rt=()=>new ie(451,"Unavailable For Headless Browser"),Fo=(e,o)=>{if(!Array.isArray(e))throw"The BlockList list has to be an array";if(typeof o!="string")throw"The BlockList watchVariable has to be a string"},Ko=e=>!e.list?.length||!e.watchVariable,Wo=(e,o)=>e instanceof FormData?e.get(o):e[o],Et=(e,o)=>{if(Ko(e))return!1;Fo(e.list,e.watchVariable);const t=Wo(o,e.watchVariable);return typeof t!="string"?!1:e.list.includes(t)},_t=()=>new ie(403,"Forbidden"),Uo=(e,o)=>{if(typeof e!="number"||e<0)throw"The LimitRate throttle has to be a positive number";if(o&&typeof o!="string")throw"The LimitRate ID has to be a non-empty string"},zo=async(e,o,t)=>{const a=Number(await t.get(e)||0);return o-Date.now()+a},kt=async(e,o,t)=>{if(!o.throttle||!t)return!1;Uo(o.throttle,o.id);const a=o.id||e;return await zo(a,o.throttle,t)>0?!0:(await t.set(a,Date.now().toString()),!1)},Mt=()=>new ie(429,"Too Many Requests"),qo=async(e,o,t,a)=>{const s=Re(a),d=s.publicKey||T.publicKey,l=s.blockHeadless||T.blockHeadless,i=s.storageProvider||T.storageProvider,c={...T.blockList,...s.blockList},u={...T.limitRate,...s.limitRate};return l&&Pt(navigator)?Promise.reject(Rt()):(It(d,e,o),Bo(t),t&&Et(c,t)?Promise.reject(_t()):await kt(location.pathname,u,i)?Promise.reject(Mt()):Tt("/api/v1.0/email/send",JSON.stringify({lib_version:"4.4.1",user_id:d,service_id:e,template_id:o,template_params:t}),{"Content-type":"application/json"}))},Go=e=>{if(!e||e.nodeName!=="FORM")throw"The 3rd parameter is expected to be the HTML form element or the style selector of the form"},$o=e=>typeof e=="string"?document.querySelector(e):e,Yo=async(e,o,t,a)=>{const s=Re(a),d=s.publicKey||T.publicKey,l=s.blockHeadless||T.blockHeadless,i=T.storageProvider||s.storageProvider,c={...T.blockList,...s.blockList},u={...T.limitRate,...s.limitRate};if(l&&Pt(navigator))return Promise.reject(Rt());const x=$o(t);It(d,e,o),Go(x);const g=new FormData(x);return Et(c,g)?Promise.reject(_t()):await kt(location.pathname,u,i)?Promise.reject(Mt()):(g.append("lib_version","4.4.1"),g.append("service_id",e),g.append("template_id",o),g.append("user_id",d),Tt("/api/v1.0/email/send-form",g))},Jo={init:Vo,send:qo,sendForm:Yo,EmailJSResponseStatus:ie},Xo=()=>{const e=r.useRef(null),o=t=>{t.preventDefault(),Jo.sendForm("service_uce9jif","template_x317p9q",e.current,{publicKey:"x5CVllr3OuJKwPm0a"}).then(()=>{alert("SUCCESS!")},a=>{console.log("FAILED...",a.text)}),t.target.reset()};return n.jsxs("form",{ref:e,onSubmit:o,className:"flex flex-col gap-6 p-10 bg-secondary rounded-xl",children:[n.jsx("h3",{className:"text-4xl text-accent mb-7 text-center md:text-start",children:"Mail us"}),n.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[n.jsx(ue,{type:"firstname",placeholder:"Firstname",className:"rounded-sm bg-background"}),n.jsx(ue,{type:"lastname",name:"user_name",placeholder:"Lastname",className:"rounded-sm bg-background"}),n.jsx(ue,{type:"email",name:"user_email",placeholder:"Email address",className:"rounded-sm bg-background"}),n.jsx(ue,{type:"phone",placeholder:"Phone number",className:"rounded-sm bg-background"})]}),n.jsxs(Lo,{name:"service",children:[n.jsx(bt,{className:"w-full",children:n.jsx(Ao,{placeholder:"Select a service"})}),n.jsx(Nt,{children:n.jsxs(Oo,{children:[n.jsx(jt,{children:"Select a service"}),n.jsx(ae,{value:"wd",children:" Suggestion "}),n.jsx(ae,{value:"md",children:" Admission "}),n.jsx(ae,{value:"da",children:" Enquiry "}),n.jsx(ae,{value:"sa",children:" Complain "})]})})]}),n.jsx(He,{className:"h-[120px]",name:"message",placeholder:"Type your message here"}),n.jsx(Zt,{type:"submit",className:"before:ani-shadow",children:"Submit"})]})},sn=()=>n.jsx(Qt.section,{initial:{opacity:0},animate:{opacity:1,transition:{delay:.5,duration:.6,ease:"easeIn"}},className:"w-[100vw] overflow-clip py-6",children:n.jsx("div",{className:"container mx-auto",children:n.jsxs("div",{className:"flex flex-col xl:flex-row gap-[30px]",children:[n.jsx("div",{className:"xl:h-[54%] order-2 xl:order-none",children:n.jsx(Xo,{})}),n.jsxs("div",{className:"flex flex-col flex-1 max-w-[480px] mx-3",children:[n.jsx("div",{className:"text-2xl font-semibold my-3 text-center md:text-start",children:"Let's talk"}),n.jsx("div",{className:"my-5",children:ke.description}),n.jsx("div",{className:"flex flex-col",children:ke.contact.map((e,o)=>n.jsxs("div",{className:"flex flex-row m-2",children:[n.jsx("div",{className:"p-2",children:e.icon}),n.jsxs("div",{className:"flex flex-col mx-5",children:[n.jsx("div",{className:"text-lg my-1",children:e.text}),n.jsx("div",{children:e.value})]})]},o))}),n.jsx("div",{className:"w-full mx-2 my-10 flex justify-center items-center",children:n.jsx(to,{containerStyles:"flex gap-4 md:gap-6 mx-auto",iconStyles:"w-9 h-9 border border-accent rounded-full flex justify-center items-center text-accent text-base hover:bg-accent hover:text-background/80 hover:transition-all duration-500"})})]})]})})});export{sn as default};
