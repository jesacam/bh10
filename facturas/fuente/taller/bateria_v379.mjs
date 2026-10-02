// ═══ BATERÍA · v379 ═══════════════════════════════════════════════════════
// Jesús (07-09-2026): «cuando meto una factura en la empresa green me sale
// este error» … «pero si me está funcionando en big house, es el green donde
// no me está funcionando».
// La causa no era la clave: los ajustes se guardan POR EMPRESA, la dirección
// del Worker estaba puesta en Big House y no en Green, y sin Worker la app
// caía a llamar a Anthropic DIRECTAMENTE con una clave guardada en el
// navegador — el camino que se cerró en agosto por seguridad y que en Green
// seguía vivo. Esto vigila que no vuelva.
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');

console.log('── 1 · no queda ningún camino directo a la API ──');
ok(!/api\.anthropic\.com/.test(app),'la dirección de la API de Anthropic ya NO aparece en el código de la app');
ok(!/h\['x-api-key'\]/.test(app),'no se manda x-api-key desde el navegador');
ok(!/anthropic-dangerous/.test(app),'ni la cabecera que permitía llamar desde el navegador');
ok(/const urlIA=\(\)=>urlMaster\(\)\.replace/.test(app),'la única salida es el Worker');
ok((app.match(/fetch\(urlIA\(\)/g)||[]).length===4,'y las cuatro llamadas (facturas, nóminas, hoja suelta, euríbor) pasan por ahí');

console.log('── 2 · la dirección del Worker vale para todas las empresas ──');
ok(/const urlMaster=\(\)=>/.test(app),'hay un único sitio que decide la dirección');
ok(/localStorage\.getItem\('bh10-master-url'\)/.test(app),'si la empresa en uso no la tiene, se recupera la del aparato');
ok(/localStorage\.setItem\('bh10-master-url'/.test(app),'y al guardarla en una empresa queda para el resto');
ok(/vale para todas las empresas del grupo/.test(app),'se le dice al usuario, para que no lo tenga que adivinar');
{
  // la lógica real de urlMaster, ejecutada
  const m=app.match(/const urlMaster=\(\)=>\{([\s\S]*?)\n  \};/);
  ok(!!m,'el cuerpo de urlMaster se puede leer y probar');
  const f=(masterCfg,local)=>new Function('masterCfg','localStorage',m[1])(masterCfg,{getItem:()=>local});
  ok(f({url:'https://a.workers.dev'},'')==='https://a.workers.dev','con la empresa configurada, manda la suya');
  ok(f({},'https://b.workers.dev')==='https://b.workers.dev','sin configurar (el caso de GREEN), se usa la del aparato');
  ok(f({url:'  '},'https://b.workers.dev')==='https://b.workers.dev','una dirección en blanco no cuenta como configurada');
  ok(f({},'')==='','y si no hay ninguna, se queda vacía (no se inventa una)');
}

console.log('── 3 · los mensajes de error dicen la verdad ──');
// Antes: un 401 con «API key is invalid» mandaba a Jesús a cerrar sesión.
{
  const i=app.indexOf('const errorIA=async(resp)=>');
  const cuerpo=app.slice(i,app.indexOf('const cabToken',i));
  ok(/api key\|x-api-key\|authentication_error\|credit balance\|billing/.test(cuerpo),'se mira el CONTENIDO del error, no solo el número');
  const iClave=cuerpo.indexOf('api key|');
  const i401=cuerpo.indexOf('resp.status===401');
  ok(iClave>=0&&i401>iClave,'y se mira ANTES que el 401: una clave inválida ya no se confunde con la sesión');
  ok(/no vale o no tiene saldo/.test(cuerpo),'el mensaje habla de la clave y del saldo');
  ok(/ojo a los espacios al pegarla/.test(cuerpo),'y avisa del fallo más habitual al pegarla en el móvil');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<15){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
