// ═══ BATERÍA OBRA LEÍDA (v399) · el lector no imputa a nuestra propia dirección ═══
import {esDireccionPropia,casarObra,limpiaObra,mismaDireccion} from '../src/lectura.js';
const ctx={miCif:'B45731981',miNombre:'BIG HOUSE 2010, S.L.',miDireccion:'CL NEON, 12',miCiudad:'45200 - ILLESCAS',
  direccionesPropias:'C/ Neón 7, nave 12, 45200 Illescas\nAv. Castilla la Mancha 87, 45200 Illescas',
  obras:[{alias:'Valdemoro',municipio:'Valdemoro',activa:true,otros:['C/ DALI DE VALDEMORO']},
         {alias:'Mozambique 35,37,39',activa:true,otros:['OBRA YUNCOS (TOLEDO) CL. MOZAMBIQUE Nº 35, 37 Y 39']},
         {alias:'JRJ Carranque',calle:'C/ Juan Ramón Jiménez',numero:'9',activa:true},
         {alias:'Vieja',calle:'C/ Neón',numero:'40',activa:false}],
  obraDisplay:o=>o.alias||'',
  conocidas:['YUNCOS','ILLESCAS PARQUE','CARRANQUE PISCINA','C/ MOZAMBIQUE, 35']};
let fallos=0;
const t=(nombre,real,esperado)=>{const ok=JSON.stringify(real)===JSON.stringify(esperado);if(!ok)fallos++;console.log((ok?'  ✓ ':'  ✗ ')+nombre+(ok?'':'  → '+JSON.stringify(real)+' ≠ '+JSON.stringify(esperado)));};
console.log('— direcciones propias —');
for(const v of ['NEON 7, NAVE 12, 45200, Illescas, Toledo','C/ NEON, 7, 45200 ILLESCAS, TOLEDO','C. NEON, 7, 45200 ILLESCAS, Toledo','NEON NAVE 12, 45200 ILLESCAS-TOLEDO','CL NEON 12','C/ NEÓN 12, 45200 ILLESCAS',
  'AV. CASTILLA LA MANCHA, 87 1º, 45200 ILLESCAS, Toledo','Avda.castilla la mancha 87 29A 45200 illescas toledo','AV CASTILLA LA MANCHA, PISO 2ª A- 87, 45200 ILLESCAS',
  'BIG HOUSE RETIRA POR SUS MEDIOS - AVD. DE LAS NACIONES 17, 45200, Illescas, Toledo','Recogida en tienda','www.bioclimaticbighouse.com','BIG HOUSE 2010, S.L. - B45731981','B45731981'])
  t('propia: '+v,esDireccionPropia(v,ctx),true);
console.log('— obras de verdad NO se descartan —');
for(const v of ['C/ MOZAMBIQUE, 35','C/ JUAN RAMON JIMENEZ, 9B','YUNCOS','C/ NEON 40, ILLESCAS','Calle Arboledas 55, Illescas','VALDEMORO 1','ILLESCAS PARQUE','CARRANQUE'])
  t('no propia: '+v,esDireccionPropia(v,ctx),false);
console.log('— casar con el catálogo —');
t('alias exacto',casarObra('valdemoro',ctx),'Valdemoro');
t('«otros» del catálogo',casarObra('C/ DALI DE VALDEMORO',ctx),'Valdemoro');
t('número dentro del alias',casarObra('C/ MOZAMBIQUE, 35',ctx),'Mozambique 35,37,39');
t('otros con varios números',casarObra('C/. MOZAMBIQUE 37 (OBRA DE CHALETS), 45210 YUNCOS-TOLEDO',ctx),'Mozambique 35,37,39');
t('calle+número del catálogo',casarObra('C/ JUAN RAMON JIMENEZ 9, CARRANQUE',ctx),'JRJ Carranque');
t('número distinto no casa',casarObra('C/ JUAN RAMON JIMENEZ, 10B',ctx),'');
t('obra inactiva no casa',casarObra('C/ NEON 40',ctx),'');
t('valor ya usado, otra grafía',casarObra('Illescas Parque',ctx),'ILLESCAS PARQUE');
t('desconocida',casarObra('C/ SOL 3, SESEÑA',ctx),'');
console.log('— limpiaObra: lo que entra en el formulario —');
t('propia → vacío',limpiaObra('AV. CASTILLA LA MANCHA, 87 1º, 45200 ILLESCAS, Toledo',ctx),'');
t('casada → alias',limpiaObra('C/ MOZAMBIQUE, 39',ctx),'Mozambique 35,37,39');
t('desconocida → se conserva',limpiaObra('C/ SOL 3, SESEÑA',ctx),'C/ SOL 3, SESEÑA');
t('vacío → vacío',limpiaObra('',ctx),'');
t('sin contexto no rompe',limpiaObra('C/ NEON 7',{}),'C/ NEON 7');
t('mismaDireccion sin número en la propia',mismaDireccion('C/ MAYOR 5, YUNCOS','Calle Mayor, Yuncos'),true);
console.log(fallos?`\n✗ ${fallos} fallos`:'\n✓ batería obra leída: todo verde');
process.exit(fallos?1:0);
