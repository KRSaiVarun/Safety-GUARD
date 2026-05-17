const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-CzXt-N4v.js","assets/index-Vdg-X6Ox.js","assets/index-m4IbSnIe.css"])))=>i.map(i=>d[i]);
import{r as i,j as h,_ as m}from"./index-Vdg-X6Ox.js";let o=null;m(()=>import("./leaflet-src-CzXt-N4v.js").then(t=>t.l),__vite__mapDeps([0,1,2])).then(t=>{o=t.default??t});function b({locations:t,current:l,height:g=400,showPulse:u=!1}){const d=i.useRef(null),a=i.useRef(null),f=i.useRef(null),c=i.useRef(null),p=i.useRef(null);return i.useEffect(()=>!d.current||a.current?void 0:((async()=>{const e=await m(()=>import("./leaflet-src-CzXt-N4v.js").then(x=>x.l),__vite__mapDeps([0,1,2])),n=e.default??e,s=n.map(d.current,{center:[20.5937,78.9629],zoom:5,zoomControl:!0,attributionControl:!1});n.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(s),a.current=s})(),()=>{var e;(e=a.current)==null||e.remove(),a.current=null}),[]),i.useEffect(()=>{const r=a.current;if(!r||!o||!l)return;const e=[l.lat,l.lng];if(f.current)f.current.setLatLng(e);else{const n=o.divIcon({html:`
          <div style="
            width:20px;height:20px;border-radius:50%;
            background:#ff2d55;
            border:3px solid #fff;
            box-shadow:0 0 20px rgba(255,45,85,0.8);
            position:relative;
          ">
            ${u?`
              <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #ff2d55;animation:pulse-ring 1.5s ease-out infinite;"></div>
              <div style="position:absolute;inset:-12px;border-radius:50%;border:1px solid rgba(255,45,85,0.4);animation:pulse-ring 1.5s ease-out infinite;animation-delay:0.5s;"></div>
            `:""}
          </div>
        `,iconSize:[20,20],iconAnchor:[10,10],className:""});f.current=o.marker(e,{icon:n}).addTo(r)}if(u&&(p.current?p.current.setLatLng(e):p.current=o.circle(e,{radius:80,color:"#ff2d55",fillColor:"#ff2d55",fillOpacity:.08,weight:1}).addTo(r)),t.length>1){const n=t.map(s=>[s.lat,s.lng]);c.current?c.current.setLatLngs(n):c.current=o.polyline(n,{color:"#ff2d55",weight:3,opacity:.7,dashArray:"6, 4"}).addTo(r)}r.flyTo(e,Math.max(r.getZoom(),15),{animate:!0,duration:1})},[l,t,u]),h.jsx("div",{ref:d,style:{width:"100%",height:g,borderRadius:"var(--radius-lg)",overflow:"hidden"}})}export{b as default};
