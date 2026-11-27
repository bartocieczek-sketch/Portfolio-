export const CSS = `
.pa{--ink:#111;--ink2:#525252;--muted:#8c8c8c;--line:#e6e6e6;--bg:#fafafa;--card:#fff;--soft:#f3f3f3;--r:16px;--ease:cubic-bezier(.23,1,.32,1);
  display:grid;grid-template-columns:248px minmax(0,1fr);height:100%;background:var(--bg);color:var(--ink);
  font-family:"PP Neue Montreal","Neue Montreal","Inter","Helvetica Neue",Arial,sans-serif;font-size:14px;line-height:1.5;letter-spacing:-.01em;-webkit-font-smoothing:antialiased}
.pa *,.pa *::before,.pa *::after{box-sizing:border-box;min-width:0}
.pa a{color:inherit;text-decoration:none}
.pa button,.pa input,.pa select,.pa textarea{font:inherit;color:inherit;letter-spacing:inherit}
.pa :focus-visible{outline:2px solid var(--ink);outline-offset:2px;border-radius:8px}
.pa ::selection{background:#111;color:#fff}

.pa-side{background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:22px;padding:24px 16px 16px;overflow:auto;scrollbar-width:none}
.pa-brand{display:flex;align-items:center;gap:10px;padding:0 8px}
.pa-brand b{font-weight:500;font-size:16px;letter-spacing:-.02em}
.pa-group h4{margin:0 0 6px;padding:0 10px;font-size:12px;font-weight:500;color:var(--muted);letter-spacing:0}
.pa-nav{display:flex;flex-direction:column;gap:2px}
.pa-item{display:flex;align-items:center;gap:11px;width:100%;padding:9px 10px;border-radius:9px;color:var(--ink2);font-size:14px;transition:background-color .15s ease,color .15s ease}
.pa-item span{flex:1}
.pa-item em{font-style:normal;font-size:11px;color:var(--ink2);background:#fff;border:1px solid var(--line);border-radius:6px;padding:1px 6px;font-variant-numeric:tabular-nums;letter-spacing:0}
@media (hover:hover){.pa-item:hover{background:var(--soft);color:var(--ink)}}
.pa-item[aria-current=page]{background:var(--soft);color:var(--ink);font-weight:500}
.pa-promo{margin-top:auto;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg)}
.pa-promo b{display:block;font-weight:500;font-size:13px;margin-bottom:4px}
.pa-promo p{margin:0 0 10px;color:var(--ink2);font-size:12.5px;line-height:1.45;letter-spacing:0}
.pa-user{display:flex;align-items:center;gap:10px;padding:4px 6px}
.pa-user i{width:32px;height:32px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;font-style:normal;font-weight:500;font-size:12px;flex:none}
.pa-user div{flex:1}
.pa-user b{display:block;font-weight:500;font-size:13px;line-height:1.2}
.pa-user small{display:block;color:var(--muted);font-size:12px;letter-spacing:0}
.pa-user button{border:0;background:none;color:var(--muted);cursor:pointer;padding:6px;border-radius:8px;display:grid;place-items:center}
@media (hover:hover){.pa-user button:hover{color:var(--ink);background:var(--soft)}}

.pa-main{display:flex;flex-direction:column;min-height:0;overflow:auto;scrollbar-width:thin;scrollbar-color:#d4d4d4 transparent}
.pa-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:16px;min-height:60px;padding:0 clamp(16px,3vw,40px);background:rgba(255,255,255,.92);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.pa-crumb{flex:1;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink2);white-space:nowrap;overflow:hidden}
.pa-crumb a{color:var(--ink2)}.pa-crumb b{color:var(--ink);font-weight:500;overflow:hidden;text-overflow:ellipsis}
.pa-search{display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:#fff;width:min(280px,34vw);color:var(--muted);transition:border-color .15s ease}
.pa-search:focus-within{border-color:#bdbdbd}
.pa-search input{flex:1;border:0;outline:0;background:none;font-size:13px;color:var(--ink);min-width:0}
.pa-search kbd{font:inherit;font-size:11px;border:1px solid var(--line);border-radius:5px;padding:0 5px;color:var(--ink2);letter-spacing:0}
.pa-tl{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--ink);padding:8px 4px;white-space:nowrap}
.pa-tl svg{color:var(--muted)}
.pa-burger{display:none;border:1px solid var(--line);background:#fff;border-radius:9px;width:36px;height:36px;place-items:center;cursor:pointer;flex:none}

.pa-page{padding:clamp(28px,4vw,44px) clamp(16px,3vw,48px) 40px;max-width:1360px;width:100%}
.pa-path{font-size:12px;color:var(--muted);letter-spacing:0;margin-bottom:14px}
.pa-path b{color:var(--ink);font-weight:500}
.pa-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
.pa-h1{font-size:clamp(32px,3.6vw,44px);line-height:1.02;letter-spacing:-.04em;font-weight:500;margin:0}
.pa-desc{margin:12px 0 0;color:var(--ink2);font-size:16px;line-height:1.5;max-width:62ch;letter-spacing:-.01em}

.pa-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));background:#fff;border:1px solid var(--line);border-radius:var(--r);margin-top:32px;overflow:hidden}
.pa-stat{padding:18px 20px 20px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:18px}
.pa-stat:last-child{border-right:0}
.pa-stat header{display:flex;justify-content:space-between;align-items:center;color:var(--ink2);font-size:13px;letter-spacing:0}
.pa-stat header svg{color:var(--muted)}
.pa-stat strong{font-size:28px;line-height:1;letter-spacing:-.04em;font-weight:500;white-space:nowrap}
.pa-stat strong small{font-size:13px;letter-spacing:0;color:var(--ink2);font-weight:400;margin-left:6px}

.pa-sec{margin-top:52px}
.pa-sechead{display:flex;align-items:flex-end;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;margin-bottom:18px}
.pa-h2{font-size:26px;line-height:1.1;letter-spacing:-.035em;font-weight:500;margin:0}
.pa-sub{margin:6px 0 0;color:var(--ink2);font-size:14px}
.pa-more{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;white-space:nowrap;padding:4px 0;border:0;background:none;cursor:pointer}
.pa-more svg{transition:transform .25s var(--ease)}
@media (hover:hover){.pa-more:hover svg{transform:translateX(3px)}}

.pa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;align-items:start}
.pa-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.pa-grid.covers{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.pa-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;transition:transform .25s var(--ease),box-shadow .25s var(--ease),border-color .2s ease}
@media (hover:hover){a.pa-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px -12px rgba(0,0,0,.14);border-color:#dcdcdc}}
a.pa-card:active{transform:translateY(0) scale(.995)}
.pa-pv{position:relative;aspect-ratio:16/10;background:var(--soft);overflow:hidden;border-bottom:1px solid var(--line)}
.pa-pv.tall{aspect-ratio:4/5}.pa-pv.wide{aspect-ratio:16/7}
.pa-pv img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s var(--ease)}
@media (hover:hover){a.pa-card:hover .pa-pv img{transform:scale(1.03)}}
.pa-pv .doc{position:absolute;left:50%;top:18px;width:1280px;height:1600px;transform-origin:top center;border:0;pointer-events:none;background:#fff;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 24px -8px rgba(0,0,0,.12)}
.pa-pv .tag{position:absolute;left:12px;top:12px}
.pa-pv .empty{position:absolute;inset:0;display:grid;place-items:center;color:var(--muted)}
.pa-pv .mono{position:absolute;inset:0;display:grid;place-items:center;font-size:44px;font-weight:500;letter-spacing:-.05em}
.pa-body{padding:16px 18px 0;display:flex;flex-direction:column;gap:6px;flex:1}
.pa-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.pa-title b{font-weight:500;font-size:17px;line-height:1.25;letter-spacing:-.025em}
.pa-body p{margin:0;color:var(--ink2);font-size:13px;line-height:1.45;letter-spacing:0}
.pa-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 18px 0;padding:12px 0 14px;border-top:1px solid var(--line);font-size:12px;color:var(--ink2);letter-spacing:0}
.pa-foot b{color:var(--ink);font-weight:500;font-size:13px;letter-spacing:-.02em}
.pa-foot svg{color:var(--ink);transition:transform .25s var(--ease);flex:none}
@media (hover:hover){a.pa-card:hover .pa-foot svg{transform:translateX(3px)}}

.pa-pill{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:500;white-space:nowrap;letter-spacing:0;background:var(--soft);color:var(--ink2);flex:none}
.pa-pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.pa-pill[data-s=sent],.pa-pill[data-s=ready],.pa-pill[data-s=quote]{background:#111;color:#fff}
.pa-pill[data-s=active]{background:#e9f1ff;color:#1d4ed8}
.pa-pill[data-s=accepted],.pa-pill[data-s=published],.pa-pill[data-s=done],.pa-pill[data-s=live]{background:#eaf5ee;color:#1f7a4d}
.pa-pill[data-s=rejected]{background:#fdecec;color:#b3261e}
.pa-pill[data-s=drafted],.pa-pill[data-s=changes]{background:#fff4e0;color:#9a5b00}
.pa-pill.onimg{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}

.pa-tools{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:28px}
.pa-seg{display:inline-flex;gap:2px;padding:3px;background:#efefef;border-radius:10px;flex-wrap:wrap}
.pa-seg button{border:0;background:none;padding:6px 12px;border-radius:7px;font-size:13px;color:var(--ink2);cursor:pointer;white-space:nowrap;transition:background-color .15s ease,color .15s ease}
.pa-seg button[aria-pressed=true]{background:#fff;color:var(--ink);font-weight:500;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.pa-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:999px;background:#111;color:#fff;border:1px solid #111;font-size:14px;font-weight:500;white-space:nowrap;cursor:pointer;transition:transform .16s ease-out,background-color .15s ease,opacity .15s ease}
.pa .pa-btn{color:#fff}
.pa .pa-btn.ghost{background:#fff;color:#111;border-color:var(--line)}
.pa .pa-btn.danger{background:#fff;color:#b3261e;border-color:#f1d0cd}
.pa-btn.sm{height:32px;padding:0 12px;font-size:13px}
@media (hover:hover){.pa-btn:hover{background:#2a2a2a}.pa-btn.ghost:hover{background:var(--soft)}.pa-btn.danger:hover{background:#fdf3f2}}
.pa-btn:active{transform:scale(.97)}
.pa-btn:disabled{opacity:.45;cursor:default;transform:none}
.pa-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}

.pa-table{background:#fff;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.pa-tr{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.4fr) 90px 90px 28px;gap:16px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line);transition:background-color .15s ease}
.pa-tr:last-child{border-bottom:0}
.pa-tr.th{font-size:12px;color:var(--muted);letter-spacing:0;padding-top:11px;padding-bottom:11px;background:var(--bg)}
@media (hover:hover){a.pa-tr:hover{background:var(--bg)}}
.pa-tr b{font-weight:500;font-size:15px;display:flex;align-items:center;gap:10px}
.pa-tr .av{width:30px;height:30px;border-radius:8px;background:var(--soft);display:grid;place-items:center;font-size:12px;font-weight:500;flex:none;overflow:hidden}
.pa-tr .av img{width:100%;height:100%;object-fit:cover}
.pa-tr span{color:var(--ink2);font-size:13px;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.pa-blank{grid-column:1/-1;border:1px dashed #d9d9d9;border-radius:var(--r);padding:36px 24px;text-align:center;color:var(--ink2);background:#fff}
.pa-blank b{display:block;color:var(--ink);font-weight:500;font-size:16px;margin-bottom:4px}
.pa-blank p{margin:0 auto 16px;max-width:46ch}
.pa-err{margin-top:24px;padding:14px 16px;border:1px solid #f3c7c4;background:#fdf3f2;border-radius:12px;color:#8c1d18}
.pa-note{padding:12px 14px;border:1px solid #f2dfb8;background:#fffaf0;border-radius:12px;color:#7a4a00;font-size:13px}
.pa-sk{background:linear-gradient(90deg,#f0f0f0 0%,#e8e8e8 50%,#f0f0f0 100%);background-size:200% 100%;animation:pa-sk 1.2s linear infinite;border-radius:var(--r)}
@keyframes pa-sk{to{background-position:-200% 0}}
.pa-pfoot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:56px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--muted);letter-spacing:0}

/* editors */
.pa-ed{display:grid;grid-template-columns:minmax(380px,520px) minmax(0,1fr);flex:1;min-height:0}
.pa-ed.single{grid-template-columns:minmax(0,1fr) 340px}
.pa-edbar{position:sticky;top:0;z-index:6;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px clamp(16px,3vw,32px);background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.pa-edbar .ttl{flex:1;display:flex;align-items:center;gap:10px;min-width:180px}
.pa-edbar .ttl a{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;border:1px solid var(--line);background:#fff;flex:none}
.pa-edbar .ttl b{font-weight:500;font-size:16px;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pa-state{font-size:12px;color:var(--muted);letter-spacing:0;white-space:nowrap}
.pa-state[data-s=dirty]{color:#9a5b00}.pa-state[data-s=error]{color:#b3261e}
.pa-form{padding:24px clamp(16px,2.6vw,32px) 80px;overflow:auto;border-right:1px solid var(--line);background:#fff}
.pa-ed.single .pa-form{border-right:0;background:transparent}
.pa-fs{border:0;margin:0 0 28px;padding:0}
.pa-fs>legend{font-size:18px;font-weight:500;letter-spacing:-.03em;margin:0 0 14px;padding:0}
.pa-fs>p.hint{margin:-8px 0 14px;color:var(--muted);font-size:13px;letter-spacing:0}
.pa-f{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.pa-f>label,.pa-f>span.lab{font-size:13px;font-weight:500;letter-spacing:0}
.pa-f small{color:var(--muted);font-size:12px;letter-spacing:0}
.pa-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pa-row.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.pa-in{width:100%;height:40px;border:1px solid var(--line);border-radius:10px;padding:0 12px;background:#fff;font-size:14px;transition:border-color .15s ease,box-shadow .15s ease}
textarea.pa-in{height:auto;min-height:88px;padding:10px 12px;line-height:1.5;resize:vertical}
select.pa-in{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
.pa-in:focus{outline:0;border-color:#111;box-shadow:0 0 0 3px rgba(17,17,17,.07)}
.pa-in::placeholder{color:#a3a3a3}
.pa-list{display:flex;flex-direction:column;gap:6px}
.pa-li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:start}
.pa-li .ops{display:flex;gap:2px}
.pa-ic{width:32px;height:32px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:var(--muted);cursor:pointer;transition:background-color .15s ease,color .15s ease}
@media (hover:hover){.pa-ic:hover{background:var(--soft);color:var(--ink)}}
.pa-ic:disabled{opacity:.3;cursor:default}
.pa-add{display:inline-flex;align-items:center;gap:6px;border:1px dashed #cfcfcf;background:#fff;border-radius:10px;height:36px;padding:0 12px;font-size:13px;font-weight:500;cursor:pointer;color:var(--ink2);align-self:flex-start;transition:border-color .15s ease,color .15s ease}
@media (hover:hover){.pa-add:hover{border-color:#111;color:var(--ink)}}
.pa-items{display:flex;flex-direction:column;gap:10px}
.pa-itm{border:1px solid var(--line);border-radius:12px;padding:12px;background:#fff}
.pa-itm .top{display:grid;grid-template-columns:minmax(0,1fr) 64px 64px auto;gap:6px;align-items:center}
.pa-itm .bot{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;margin-top:6px;align-items:center}
.pa-itm .pa-in{height:36px}
.pa-itm .num{text-align:right}
.pa-tot{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:12px;background:var(--soft);font-size:13px;letter-spacing:0}
.pa-tot b{font-weight:500;font-size:14px;letter-spacing:-.02em}
.pa-prev{position:relative;background:#ececec;overflow:hidden;min-height:0}
.pa-prev .stage{position:absolute;inset:0;overflow:auto;padding:24px}
.pa-prev iframe{display:block;border:0;width:1280px;transform-origin:top left;background:#fff;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.06),0 20px 40px -20px rgba(0,0,0,.2)}
.pa-tabs{display:none}
.pa-side2{padding:24px clamp(16px,2.6vw,28px);display:flex;flex-direction:column;gap:16px}
.pa-box{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:16px}
.pa-box h3{margin:0 0 10px;font-size:15px;font-weight:500;letter-spacing:-.02em}
.pa-box a.ln{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line);font-size:13px}
.pa-box a.ln:first-of-type{border-top:0}
.pa-drop{border:1px dashed #cfcfcf;border-radius:14px;padding:22px;text-align:center;color:var(--ink2);background:#fff;cursor:pointer;transition:border-color .15s ease,background-color .15s ease}
.pa-drop[data-over=true],.pa-drop:focus-within{border-color:#111;background:#fafafa}
.pa-drop b{display:block;color:var(--ink);font-weight:500;margin-bottom:2px}
.pa-drop input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.pa-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:12px}
.pa-th{background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.pa-th .im{position:relative;aspect-ratio:4/3;background:var(--soft)}
.pa-th .im img{width:100%;height:100%;object-fit:cover;display:block}
.pa-th .im .tag{position:absolute;left:8px;top:8px}
.pa-th .ops{display:flex;justify-content:space-between;padding:4px}
.pa-th input{border:0;border-top:1px solid var(--line);padding:8px 10px;font-size:12px;letter-spacing:0;outline:0}
.pa-up{display:flex;flex-direction:column;gap:4px;margin-top:10px;font-size:12px;color:var(--ink2);letter-spacing:0}
.pa-up [data-s=err]{color:#b3261e}
.pa-files{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-top:10px;background:#fff}
.pa-files div{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 8px 8px 12px;border-top:1px solid var(--line);font-size:13px}
.pa-files div:first-child{border-top:0}
.pa-files a{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-cover{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:center}
.pa-cover .im{aspect-ratio:4/5;border-radius:12px;background:var(--soft);overflow:hidden;border:1px solid var(--line)}
.pa-cover .im img{width:100%;height:100%;object-fit:cover;display:block}
.pa-confirm{display:inline-flex;align-items:center;gap:8px;font-size:13px}
.pa-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:50;background:#111;color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:500;box-shadow:0 10px 30px -10px rgba(0,0,0,.4);transition:opacity .2s ease,transform .25s var(--ease)}
.pa-toast[data-s=err]{background:#b3261e}
@starting-style{.pa-toast{opacity:0;transform:translate(-50%,8px)}}

@media (max-width:1100px){.pa-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.pa-stat:nth-child(2){border-right:0}.pa-stat:nth-child(-n+2){border-bottom:1px solid var(--line)}.pa-grid.three{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pa-ed{grid-template-columns:minmax(0,1fr)}.pa-ed.single{grid-template-columns:minmax(0,1fr)}
  .pa-tabs{display:inline-flex}.pa-ed[data-tab=edit] .pa-prev,.pa-ed[data-tab=preview] .pa-form{display:none}.pa-ed[data-tab=preview] .pa-prev{min-height:70vh}.pa-form{border-right:0}}
@media (max-width:860px){
  .pa{grid-template-columns:minmax(0,1fr)}
  .pa-side{position:fixed;inset:0 auto 0 0;width:280px;z-index:20;transform:translateX(-100%);transition:transform .3s var(--ease)}
  .pa[data-menu=open] .pa-side{transform:none;box-shadow:0 0 0 100vmax rgba(0,0,0,.25)}
  .pa-burger{display:grid}
  .pa-search{width:auto;flex:1}.pa-crumb{display:none}.pa-tl.hide{display:none}
  .pa-tr{grid-template-columns:minmax(0,1fr) auto}.pa-tr>*:nth-child(3),.pa-tr>*:nth-child(4),.pa-tr>*:nth-child(5){display:none}.pa-tr.th{display:none}
  .pa-row.three{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:560px){.pa-grid.three,.pa-grid{grid-template-columns:minmax(0,1fr)}.pa .pa-grid.covers{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .pa-grid.covers .pa-body{padding:12px 12px 0}.pa-grid.covers .pa-title{flex-direction:column;gap:6px}.pa-grid.covers .pa-foot{margin:10px 12px 0}.pa-grid.covers .pa-foot>span:first-child{display:none}
  .pa-stat{padding:14px 14px 16px;gap:12px}.pa-stat strong{font-size:24px}.pa-stat strong small{display:block;margin:6px 0 0;font-size:12px}
  .pa-search kbd{display:none}.pa-row{grid-template-columns:minmax(0,1fr)}
  .pa-edbar{gap:8px}.pa-edbar .ttl{flex-basis:100%}.pa-edbar .pa-btn{height:34px;padding:0 12px;font-size:13px}.pa-edbar .pa-state{flex-basis:100%;order:9}.pa-itm .top{grid-template-columns:minmax(0,1fr) 56px 56px}.pa-itm .top .ops{grid-column:1/-1;justify-self:end}}
@media (prefers-reduced-motion:reduce){.pa *{transition:none!important;animation:none!important}}
`;
