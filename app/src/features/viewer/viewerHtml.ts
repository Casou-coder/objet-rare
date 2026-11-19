/**
 * Page HTML du viewer sécurisé (WebView) : image ou PDF (pdf.js), zoom par pincement, rotation,
 * pagination. Aucun lien de téléchargement, menu contextuel et sélection désactivés.
 * Le PDF est transmis en mémoire (base64) : rien n'est écrit sur l'appareil.
 */
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

export function viewerHtml(kind: 'image' | 'pdf', imageUrl?: string): string {
  const safeUrl = (imageUrl ?? '').replace(/"/g, '&quot;');
  return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=6,user-scalable=yes">
<style>
  html,body{margin:0;background:#0B0B0F;color:#F6F2EA;font-family:-apple-system,Roboto,sans-serif;
    -webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  #wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;transition:transform .2s}
  img,canvas{max-width:100%;height:auto;pointer-events:none}
</style>
${kind === 'pdf' ? `<script src="${PDFJS}/pdf.min.js"></script>` : ''}
</head><body oncontextmenu="return false">
<div id="wrap">${kind === 'image' ? `<img id="img" src="${safeUrl}" draggable="false">` : '<canvas id="cv"></canvas>'}</div>
<script>
  var rot = 0, doc = null, page = 1;
  function post(m){ window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  function rotate(){ rot = (rot + 90) % 360; document.getElementById('wrap').style.transform = 'rotate(' + rot + 'deg)'; }
  ${kind === 'image' ? `
  var img = document.getElementById('img');
  img.onload = function(){ post({type:'ready', pages:1}); };
  img.onerror = function(){ post({type:'error'}); };
  ` : `
  pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.js';
  function render(n){
    doc.getPage(n).then(function(p){
      var vp = p.getViewport({scale: 2});
      var cv = document.getElementById('cv');
      cv.width = vp.width; cv.height = vp.height;
      p.render({canvasContext: cv.getContext('2d'), viewport: vp}).promise.then(function(){
        post({type:'page', page:n, pages:doc.numPages});
      });
    });
  }
  function load(b64){
    var raw = atob(b64), bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    pdfjsLib.getDocument({data: bytes}).promise.then(function(d){ doc = d; page = 1; post({type:'ready', pages:d.numPages}); render(1); })
      .catch(function(){ post({type:'error'}); });
  }
  function go(delta){ if(!doc) return; var n = page + delta; if(n < 1 || n > doc.numPages) return; page = n; render(n); }
  `}
</script></body></html>`;
}

/** Encode un ArrayBuffer en base64 sans dépendance (par blocs, compatible Hermes). */
export function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return globalThis.btoa(bin);
}
